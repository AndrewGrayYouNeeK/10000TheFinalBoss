import { randomUUID } from "node:crypto";
import { createInitialState, consumeSkinPower } from "../src/lib/gameLogic.js";
import { buildClientMatchPayload, applyClientPayloadToRenderState } from "../src/lib/onlineGameState.js";
import { DEFAULT_ONLINE_VISIBILITY, normalizeOnlineVisibility } from "../src/lib/onlineVisibility.js";
import { applyMatchAction } from "./applyAction.mjs";
import { executeRollOffRound, createRollOffState } from "../src/lib/turnOrderRollOff.js";
import { applySkinPower } from "../src/lib/powerEffects.js";
import { applyPlasmaCut } from "../src/lib/plasmaCut.js";

const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomRoomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  }
  return code;
}

function runAutoRollOff(playerNames) {
  let rollOff = createRollOffState(playerNames.length);
  let guard = 0;
  while (!rollOff.done && guard < 32) {
    rollOff = executeRollOffRound(rollOff, playerNames);
    guard += 1;
  }
  return rollOff.order[0] ?? 0;
}

/**
 * @typedef {Object} RoomPlayer
 * @property {string} id
 * @property {string} name
 * @property {number} index
 * @property {import('ws').WebSocket|null} socket
 * @property {import('@/lib/onlineVisibility').OnlineVisibilitySettings} visibility
 * @property {string} skinId
 * @property {string|null} disguiseSkinId
 */

export class MatchRoom {
  /** @type {Map<string, MatchRoom>} */
  static rooms = new Map();

  /** @param {string} code */
  static get(code) {
    return MatchRoom.rooms.get(code?.toUpperCase()) ?? null;
  }

  static create() {
    let code = randomRoomCode();
    while (MatchRoom.rooms.has(code)) code = randomRoomCode();
    const room = new MatchRoom(code);
    MatchRoom.rooms.set(code, room);
    return room;
  }

  /** @param {string} code */
  constructor(code) {
    this.code = code;
    /** @type {"lobby"|"playing"|"finished"} */
    this.status = "lobby";
    /** @type {RoomPlayer[]} */
    this.players = [];
    this.matchState = null;
    this.seq = 0;
    this.hostId = null;
    this.createdAt = Date.now();
  }

  /** @param {import('ws').WebSocket} socket */
  addPlayer(socket, { name, skinId, disguiseSkinId, visibility }) {
    if (this.players.length >= 2) return { error: "Room is full" };
    const id = randomUUID();
    const index = this.players.length;
    if (index === 0) this.hostId = id;
    const player = {
      id,
      name: (name || `Player ${index + 1}`).slice(0, 24),
      index,
      socket,
      visibility: normalizeOnlineVisibility(visibility ?? DEFAULT_ONLINE_VISIBILITY),
      skinId: skinId || "classic_white",
      disguiseSkinId: disguiseSkinId || null,
    };
    this.players.push(player);
    return { playerId: id, playerIndex: index, isHost: index === 0 };
  }

  /** @param {string} playerId */
  reconnectPlayer(socket, playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return { error: "Player not in room" };
    player.socket = socket;
    return { playerId: player.id, playerIndex: player.index, isHost: player.id === this.hostId };
  }

  /** @param {string} playerId */
  removePlayer(playerId) {
    const idx = this.players.findIndex((p) => p.id === playerId);
    if (idx < 0) return;
    this.players[idx].socket = null;
    if (this.status === "lobby" && this.players.every((p) => !p.socket)) {
      MatchRoom.rooms.delete(this.code);
    }
  }

  /** @param {string} playerId */
  setVisibility(playerId, visibility) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return;
    player.visibility = normalizeOnlineVisibility(visibility);
    this.broadcast();
  }

  /** @param {string} playerId */
  startMatch(playerId) {
    if (playerId !== this.hostId) return { error: "Only host can start" };
    if (this.players.length < 2) return { error: "Waiting for opponent" };
    if (this.status !== "lobby") return { error: "Match already started" };

    const names = this.players.map((p) => p.name);
    const playerSkins = this.players.map((p) => {
      if (p.skinId === "ghost" && p.disguiseSkinId) {
        return { skinId: "ghost", trueSkinId: p.disguiseSkinId };
      }
      return { skinId: p.skinId };
    });
    const firstPlayerIndex = runAutoRollOff(names);
    this.matchState = createInitialState(names, { playerSkins, firstPlayerIndex });
    this.status = "playing";
    this.seq += 1;
    this.broadcast();
    return { ok: true };
  }

  /** @param {string} playerId */
  handleAction(playerId, action, payload = {}) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return { error: "Unknown player" };
    if (this.status !== "playing" || !this.matchState) {
      return { error: "Match not in progress" };
    }

    let nextState = this.matchState;
    if (action === "apply_power") {
      const powerId = payload.powerId;
      if (!powerId) return { error: "Missing powerId" };
      const casterIndex = nextState.currentIndex;
      const result = applySkinPower(nextState, powerId);
      nextState = consumeSkinPower({ ...result.state, currentIndex: casterIndex });
    } else if (action === "plasma_cut") {
      const result = applyPlasmaCut(nextState, payload.dieId, payload.newValue);
      nextState = consumeSkinPower(result.state ?? nextState);
    } else {
      const result = applyMatchAction(nextState, {
        action,
        payload: { ...payload, playerIndex: player.index },
      });
      if (result.error) return { error: result.error };
      nextState = result.state;
    }

    this.matchState = nextState;
    if (nextState.winner) this.status = "finished";
    this.seq += 1;
    this.broadcast();
    return { ok: true };
  }

  visibilityMap() {
    const map = {};
    for (const p of this.players) {
      map[p.index] = p.visibility;
    }
    return map;
  }

  lobbyPayload(forPlayer) {
    return {
      type: "room_state",
      roomCode: this.code,
      status: this.status,
      seq: this.seq,
      youAreIndex: forPlayer?.index ?? 0,
      isHost: forPlayer?.id === this.hostId,
      players: this.players.map((p) => ({
        index: p.index,
        name: p.name,
        connected: !!p.socket,
        skinId: p.skinId,
      })),
      canStart: this.status === "lobby" && this.players.length >= 2 && forPlayer?.id === this.hostId,
    };
  }

  matchPayloadFor(player) {
    if (!this.matchState) return null;
    return buildClientMatchPayload({
      matchState: this.matchState,
      viewerPlayerIndex: player.index,
      visibilityByPlayerIndex: this.visibilityMap(),
    });
  }

  /** @param {RoomPlayer} player */
  send(player, msg) {
    if (!player?.socket || player.socket.readyState !== 1) return;
    try {
      player.socket.send(JSON.stringify(msg));
    } catch {
      /* ignore send failures */
    }
  }

  broadcast() {
    for (const player of this.players) {
      if (this.status === "lobby") {
        this.send(player, this.lobbyPayload(player));
        continue;
      }
      const payload = this.matchPayloadFor(player);
      const viewerState = applyClientPayloadToRenderState(this.matchState, payload);
      this.send(player, {
        type: "match_state",
        roomCode: this.code,
        matchId: this.code,
        viewerPlayerIndex: player.index,
        seq: this.seq,
        payload,
        state: viewerState,
      });
    }
  }
}
