import "./polyfill.js";
import { DurableObject } from "cloudflare:workers";
import {
  applyMatchAction,
  createMatchState,
  evaluateDeferredRoll,
  fanOutPayloads,
  ROLL_ANIM_MS,
} from "./applyAction.js";
import { normalizeOnlineVisibility } from "../src/lib/onlineVisibility.js";

const MAX_PLAYERS = 2;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function makeRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/**
 * One Durable Object = one match room (invite code).
 */
export class MatchRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.busy = false;
    this.evalTimer = null;
  }

  async loadRoom() {
    return (
      (await this.ctx.storage.get("room")) || {
        code: null,
        status: "lobby", // lobby | playing | finished
        seats: [],
        matchState: null,
        seq: 0,
        rollPending: false,
        createdAt: Date.now(),
      }
    );
  }

  async saveRoom(room) {
    await this.ctx.storage.put("room", room);
  }

  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith("/bootstrap") && request.method === "POST") {
      const room = await this.loadRoom();
      if (!room.code) {
        room.code = url.searchParams.get("code") || makeRoomCode();
        room.createdAt = Date.now();
        await this.saveRoom(room);
      }
      return json({ code: room.code, status: room.status, seats: room.seats.length });
    }

    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    if (path.endsWith("/status") && request.method === "GET") {
      const room = await this.loadRoom();
      return json({
        code: room.code,
        status: room.status,
        seats: room.seats.map((s) => ({
          playerIndex: s.playerIndex,
          name: s.name,
          connected: this.isSeatConnected(s.playerId),
        })),
      });
    }

    return json({ error: "Not found" }, 404);
  }

  isSeatConnected(playerId) {
    for (const ws of this.ctx.getWebSockets()) {
      const meta = ws.deserializeAttachment() || {};
      if (meta.playerId === playerId) return true;
    }
    return false;
  }

  async handleWebSocket(request) {
    const url = new URL(request.url);
    const name = (url.searchParams.get("name") || "Player").slice(0, 24);
    const playerId = url.searchParams.get("playerId") || randomToken();
    const skinId = (url.searchParams.get("skinId") || "classic_white").slice(0, 64);
    const trueSkinId = url.searchParams.get("trueSkinId") || "";

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({
      playerId,
      name,
      skinId,
      trueSkinId: trueSkinId || null,
      joined: false,
    });

    // Join is completed on first "hello" / auto-join message so visibility can be sent.
    this.send(server, {
      type: "welcome",
      playerId,
      suggestedName: name,
    });

    return new Response(null, { status: 101, webSocket: client, headers: corsHeaders() });
  }

  async webSocketMessage(ws, message) {
    let msg;
    try {
      msg = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      this.send(ws, { type: "error", error: "Invalid JSON" });
      return;
    }

    try {
      await this.dispatchMessage(ws, msg);
    } catch (err) {
      // A thrown handler would otherwise leave the client waiting on a socket
      // that never answers. Log it and notify the client. The lock/rollPending
      // are owned and released by the "action" path's own try/finally, so this
      // catch must not touch them — clearing them here would unlock a match
      // while an unrelated message failed mid-roll.
      console.error("MatchRoom message failed", msg?.type, err);
      this.send(ws, { type: "error", error: "Server error handling that action" });
    }
  }

  async dispatchMessage(ws, msg) {
    const meta = ws.deserializeAttachment() || {};
    const room = await this.loadRoom();

    if (msg.type === "join" || msg.type === "hello") {
      await this.handleJoin(ws, meta, room, msg);
      return;
    }

    if (!meta.joined || meta.playerIndex == null) {
      this.send(ws, { type: "error", error: "Join the room first" });
      return;
    }

    if (msg.type === "set_visibility") {
      const seat = room.seats.find((s) => s.playerId === meta.playerId);
      if (seat) {
        seat.visibility = normalizeOnlineVisibility(msg.visibility);
        await this.saveRoom(room);
        if (room.matchState) {
          await this.broadcastState(room);
        } else {
          this.broadcastLobby(room);
        }
      }
      return;
    }

    if (msg.type === "ready" && room.status === "lobby") {
      const seat = room.seats.find((s) => s.playerId === meta.playerId);
      if (seat) {
        seat.ready = true;
        await this.saveRoom(room);
        if (room.seats.length >= MAX_PLAYERS && room.seats.every((s) => s.ready)) {
          await this.startMatch(room);
        } else {
          this.broadcastLobby(room);
        }
      }
      return;
    }

    if (msg.type === "action") {
      // Claim the in-memory lock before any await so concurrent WS messages cannot
      // interleave past a stale busy/rollPending check.
      if (this.busy) {
        this.send(ws, { type: "error", error: "Please wait" });
        return;
      }
      this.busy = true;
      let handlerReleasedLock = false;
      try {
        const roomForBusy = await this.loadRoom();
        if (roomForBusy.rollPending) {
          this.send(ws, { type: "error", error: "Please wait" });
          return;
        }
        if (roomForBusy.status !== "playing" || !roomForBusy.matchState) {
          this.send(ws, { type: "error", error: "Match not in progress" });
          return;
        }
        handlerReleasedLock = await this.handleAction(ws, meta, roomForBusy, msg);
      } finally {
        // Deferred rolls release busy themselves after evaluate — do not clobber a newer lock.
        if (!handlerReleasedLock) this.busy = false;
      }
      return;
    }

    if (msg.type === "ping") {
      this.send(ws, { type: "pong", t: Date.now() });
    }
  }

  async handleJoin(ws, meta, room, msg) {
    if (meta.joined) {
      this.sendSeatSnapshot(ws, room, meta.playerIndex);
      return;
    }

    const name = String(msg.name || meta.name || "Player").slice(0, 24);
    const skinId = String(msg.skinId || meta.skinId || "classic_white").slice(0, 64);
    const trueSkinId = msg.trueSkinId || meta.trueSkinId || null;
    const visibility = normalizeOnlineVisibility(msg.visibility);
    const playerId = meta.playerId;

    let seat = room.seats.find((s) => s.playerId === playerId);
    if (!seat) {
      if (room.status !== "lobby") {
        this.send(ws, { type: "error", error: "Match already started" });
        ws.close(4000, "Match started");
        return;
      }
      if (room.seats.length >= MAX_PLAYERS) {
        this.send(ws, { type: "error", error: "Room is full" });
        ws.close(4001, "Room full");
        return;
      }
      seat = {
        playerId,
        playerIndex: room.seats.length,
        name,
        skinId,
        trueSkinId,
        visibility,
        ready: false,
      };
      room.seats.push(seat);
    } else {
      seat.name = name;
      seat.skinId = skinId;
      seat.trueSkinId = trueSkinId;
      seat.visibility = visibility;
      // Reconnect may bring Ghost disguise after lobby join — sync into live match players.
      if (room.matchState?.players?.[seat.playerIndex]) {
        const p = room.matchState.players[seat.playerIndex];
        room.matchState.players[seat.playerIndex] = {
          ...p,
          name: seat.name,
          skinId: seat.skinId,
          ...(seat.trueSkinId ? { trueSkinId: seat.trueSkinId } : {}),
        };
        if (!seat.trueSkinId && p.trueSkinId) {
          const { trueSkinId: _drop, ...rest } = room.matchState.players[seat.playerIndex];
          room.matchState.players[seat.playerIndex] = rest;
        }
      }
    }

    ws.serializeAttachment({
      ...meta,
      joined: true,
      playerIndex: seat.playerIndex,
      name: seat.name,
      skinId: seat.skinId,
      trueSkinId: seat.trueSkinId,
    });

    await this.saveRoom(room);
    this.send(ws, {
      type: "joined",
      code: room.code,
      playerId,
      playerIndex: seat.playerIndex,
      status: room.status,
    });
    this.broadcastLobby(room);

    if (room.status === "playing" && room.matchState) {
      this.sendSeatSnapshot(ws, room, seat.playerIndex);
    }
  }

  async startMatch(room) {
    room.status = "playing";
    room.matchState = createMatchState(room.seats);
    room.seq = (room.seq || 0) + 1;
    await this.saveRoom(room);
    this.broadcastLobby(room);
    await this.broadcastState(room);
  }

  /**
   * @returns {Promise<boolean>} true if this handler already released `this.busy`
   *   (deferred roll path); false if the caller should clear the lock.
   */
  async handleAction(ws, meta, room, msg) {
    const action = msg.action;
    const payload = msg.payload || {};
    const result = applyMatchAction(room.matchState, meta.playerIndex, action, payload);
    if (!result.ok) {
      this.send(ws, { type: "error", error: result.error || "Action failed" });
      return false;
    }

    room.matchState = result.state;
    room.seq = (room.seq || 0) + 1;
    if (room.matchState?.winner) room.status = "finished";

    // Persist rollPending before any further await (hibernation-safe).
    if (result.deferEvaluate) {
      room.rollPending = true;
    }

    try {
      await this.saveRoom(room);
      await this.broadcastState(room, {
        rollAnimMs: result.rollAnimMs || 0,
        toast: result.toast,
        actorIndex: meta.playerIndex,
      });
    } catch (err) {
      // rollPending may already be persisted above. If saveRoom/broadcastState
      // throws before the deferred-eval finally can run, the marker would leak
      // and brick the room ("Please wait" forever), so undo it before rethrowing.
      if (result.deferEvaluate) {
        try {
          const latest = await this.loadRoom();
          if (latest.rollPending) {
            latest.rollPending = false;
            await this.saveRoom(latest);
          }
        } catch (undoErr) {
          console.error("MatchRoom failed to clear a stuck rollPending", undoErr);
        }
      }
      throw err;
    }

    if (result.deferEvaluate) {
      try {
        await scheduler.wait(ROLL_ANIM_MS);
        const latest = await this.loadRoom();
        if (latest.matchState) {
          latest.matchState = evaluateDeferredRoll(latest.matchState);
          latest.seq = (latest.seq || 0) + 1;
          latest.rollPending = false;
          if (latest.matchState?.winner) latest.status = "finished";
          await this.saveRoom(latest);
          await this.broadcastState(latest);
        }
      } finally {
        this.busy = false;
        const cleared = await this.loadRoom();
        if (cleared.rollPending) {
          cleared.rollPending = false;
          await this.saveRoom(cleared);
        }
      }
      return true;
    }

    return false;
  }

  broadcastLobby(room) {
    const body = {
      type: "lobby",
      code: room.code,
      status: room.status,
      seats: room.seats.map((s) => ({
        playerIndex: s.playerIndex,
        name: s.name,
        skinId: s.skinId,
        ready: !!s.ready,
        connected: this.isSeatConnected(s.playerId),
      })),
    };
    for (const socket of this.ctx.getWebSockets()) {
      this.send(socket, body);
    }
  }

  async broadcastState(room, extras = {}) {
    const fans = fanOutPayloads(room.matchState, room);
    for (const socket of this.ctx.getWebSockets()) {
      const meta = socket.deserializeAttachment() || {};
      if (meta.playerIndex == null) continue;
      const fan = fans.find((f) => f.playerIndex === meta.playerIndex);
      if (!fan) continue;
      this.send(socket, {
        type: "match_state",
        matchId: room.code,
        viewerPlayerIndex: meta.playerIndex,
        seq: room.seq,
        status: room.status,
        payload: fan.payload,
        rollAnimMs: extras.rollAnimMs || 0,
        toast: extras.actorIndex === meta.playerIndex ? extras.toast : undefined,
      });
    }
  }

  sendSeatSnapshot(ws, room, playerIndex) {
    if (!room.matchState) return;
    const fans = fanOutPayloads(room.matchState, room);
    const fan = fans.find((f) => f.playerIndex === playerIndex);
    if (!fan) return;
    this.send(ws, {
      type: "match_state",
      matchId: room.code,
      viewerPlayerIndex: playerIndex,
      seq: room.seq,
      status: room.status,
      payload: fan.payload,
    });
  }

  send(ws, obj) {
    try {
      ws.send(JSON.stringify(obj));
    } catch {
      /* closed */
    }
  }

  async webSocketClose(ws) {
    const meta = ws.deserializeAttachment() || {};
    const room = await this.loadRoom();
    this.broadcastLobby(room);
    // Keep seat reserved so reconnect with same playerId can resume.
    void meta;
  }

  async webSocketError(ws) {
    try {
      ws.close(1011, "WebSocket error");
    } catch {
      /* ignore */
    }
  }
}

/**
 * Worker entry — routes HTTP/WS to MatchRoom Durable Objects.
 */
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "roll10000-online" });
    }

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      const code = makeRoomCode();
      const id = env.MATCH_ROOM.idFromName(code);
      const stub = env.MATCH_ROOM.get(id);
      try {
        const boot = await stub.fetch(
          new Request(`https://match/bootstrap?code=${encodeURIComponent(code)}`, {
            method: "POST",
          })
        );
        if (!boot.ok) {
          console.error("Room bootstrap failed", boot.status);
          return json({ error: `Could not create the room (${boot.status})` }, 502);
        }
        const data = await boot.json();
        return json({ code: data.code || code });
      } catch (err) {
        // Without this the client only sees an opaque 500 with no body.
        console.error("Room bootstrap failed", err);
        return json({ error: "Could not create the room" }, 502);
      }
    }

    const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)(?:\/(ws|status))?$/);
    if (roomMatch) {
      const code = roomMatch[1].toUpperCase();
      const id = env.MATCH_ROOM.idFromName(code);
      const stub = env.MATCH_ROOM.get(id);
      const targetPath = roomMatch[2] === "status" ? "/status" : "/ws";
      const target = new URL(request.url);
      target.pathname = targetPath;
      // Ensure room knows its code on first touch.
      if (request.headers.get("Upgrade") === "websocket") {
        try {
          const boot = await stub.fetch(
            new Request(`https://match/bootstrap?code=${encodeURIComponent(code)}`, {
              method: "POST",
            })
          );
          if (!boot.ok) {
            console.error("Room bootstrap failed", boot.status);
            return json({ error: `Could not join the room (${boot.status})` }, 502);
          }
        } catch (err) {
          // Without this the client only sees an opaque 500 with no body.
          console.error("Room bootstrap failed", err);
          return json({ error: "Could not join the room" }, 502);
        }
      }
      return stub.fetch(new Request(target.toString(), request));
    }

    return json({ error: "Not found" }, 404);
  },
};

export { makeRoomCode, randomToken };
