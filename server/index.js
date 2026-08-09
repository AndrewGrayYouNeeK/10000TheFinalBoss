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
const MAX_ROOM_CODE_LEN = 12;
const MAX_PLAYER_ID_LEN = 64;
const MAX_WS_MESSAGE_BYTES = 8 * 1024;

/** Origins allowed to call the match API / open a match WebSocket. */
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/roll10000\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]+\.roll10000\.pages\.dev$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^capacitor:\/\/localhost$/,
  /^ionic:\/\/localhost$/,
];

/**
 * Extra origins for custom domains, set as the `ALLOWED_ORIGINS` Worker var
 * (comma-separated, e.g. "https://roll10000.com,https://www.roll10000.com").
 */
function extraAllowedOrigins(env) {
  return String(env?.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isAllowedOrigin(origin, env = null) {
  if (!origin) return false;
  if (ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))) return true;
  return extraAllowedOrigins(env).includes(origin);
}

function json(data, status = 200, extraHeaders = {}, request = null, env = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
      ...extraHeaders,
    },
  });
}

/**
 * CORS for the allowlisted origins only. Native app / same-origin requests send
 * no Origin header and are unaffected.
 */
function corsHeaders(request, env = null) {
  const origin = request?.headers?.get("Origin") || "";
  if (!isAllowedOrigin(origin, env)) return { vary: "Origin" };
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

/** Room codes only ever contain code-alphabet characters. */
function sanitizeRoomCode(raw) {
  const code = String(raw || "").toUpperCase().slice(0, MAX_ROOM_CODE_LEN);
  return /^[A-Z0-9]+$/.test(code) ? code : null;
}

/** Seat tokens are opaque, but must stay short and printable to be storable. */
function sanitizePlayerId(raw) {
  const id = String(raw || "").slice(0, MAX_PLAYER_ID_LEN);
  return /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
}

function sanitizeSkinId(raw, fallback = "") {
  const id = String(raw || "").slice(0, 64);
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : fallback;
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
      return new Response(null, { status: 204, headers: corsHeaders(request, this.env) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith("/bootstrap") && request.method === "POST") {
      const room = await this.loadRoom();
      if (!room.code) {
        room.code = sanitizeRoomCode(url.searchParams.get("code")) || makeRoomCode();
        room.createdAt = Date.now();
        await this.saveRoom(room);
      }
      return json(
        { code: room.code, status: room.status, seats: room.seats.length },
        200,
        {},
        request,
        this.env
      );
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
      }, 200, {}, request, this.env);
    }

    return json({ error: "Not found" }, 404, {}, request, this.env);
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
    const playerId = sanitizePlayerId(url.searchParams.get("playerId")) || randomToken();
    const skinId = sanitizeSkinId(url.searchParams.get("skinId"), "classic_white");
    const trueSkinId = sanitizeSkinId(url.searchParams.get("trueSkinId"));

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

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const size = typeof message === "string" ? message.length : message.byteLength;
    if (size > MAX_WS_MESSAGE_BYTES) {
      this.send(ws, { type: "error", error: "Message too large" });
      return;
    }

    let msg;
    try {
      msg = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      this.send(ws, { type: "error", error: "Invalid JSON" });
      return;
    }

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
    const skinId = sanitizeSkinId(msg.skinId || meta.skinId, "classic_white");
    const trueSkinId = sanitizeSkinId(msg.trueSkinId || meta.trueSkinId) || null;
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

    await this.saveRoom(room);
    await this.broadcastState(room, {
      rollAnimMs: result.rollAnimMs || 0,
      toast: result.toast,
      actorIndex: meta.playerIndex,
    });

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
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    // Browser-initiated cross-site requests (including WebSocket upgrades, which
    // CORS does not protect) must come from a known app origin.
    if (origin && !isAllowedOrigin(origin, env)) {
      return json({ error: "Origin not allowed" }, 403, {}, request, env);
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "roll10000-online" }, 200, {}, request, env);
    }

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      const code = makeRoomCode();
      const id = env.MATCH_ROOM.idFromName(code);
      const stub = env.MATCH_ROOM.get(id);
      const boot = await stub.fetch(
        new Request(`https://match/bootstrap?code=${encodeURIComponent(code)}`, {
          method: "POST",
        })
      );
      const data = await boot.json();
      return json({ code: data.code || code }, 200, {}, request, env);
    }

    const roomMatch = url.pathname.match(
      new RegExp(`^/api/rooms/([A-Za-z0-9]{1,${MAX_ROOM_CODE_LEN}})(?:/(ws|status))?$`)
    );
    if (roomMatch) {
      const code = roomMatch[1].toUpperCase();
      const id = env.MATCH_ROOM.idFromName(code);
      const stub = env.MATCH_ROOM.get(id);
      const targetPath = roomMatch[2] === "status" ? "/status" : "/ws";
      const target = new URL(request.url);
      target.pathname = targetPath;
      // Ensure room knows its code on first touch.
      if (request.headers.get("Upgrade") === "websocket") {
        await stub.fetch(
          new Request(`https://match/bootstrap?code=${encodeURIComponent(code)}`, {
            method: "POST",
          })
        );
      }
      return stub.fetch(new Request(target.toString(), request));
    }

    return json({ error: "Not found" }, 404, {}, request, env);
  },
};

export { makeRoomCode, randomToken };
