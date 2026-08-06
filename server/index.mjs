/**
 * YouNeeK 10,000 — authoritative online game server (WebSocket).
 *
 * Dev: npm run dev:online-server  (default ws://127.0.0.1:8787)
 * Vite proxies /ws → this server during `npm run dev`.
 */
import http from "node:http";
import { WebSocketServer } from "ws";
import { MatchRoom } from "./matchRoom.mjs";

const PORT = Number(process.env.ONLINE_SERVER_PORT || 8787);
const HOST = process.env.ONLINE_SERVER_HOST || "127.0.0.1";

/** @type {Map<import('ws').WebSocket, { roomCode: string, playerId: string }>} */
const connections = new Map();

function send(socket, msg) {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify(msg));
}

function parseMessage(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: MatchRoom.rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  send(socket, { type: "hello", version: 1 });

  socket.on("message", (raw) => {
    const msg = parseMessage(raw);
    if (!msg?.type) return;

    if (msg.type === "ping") {
      send(socket, { type: "pong" });
      return;
    }

    if (msg.type === "create_room") {
      const room = MatchRoom.create();
      const joined = room.addPlayer(socket, {
        name: msg.playerName,
        skinId: msg.skinId,
        disguiseSkinId: msg.disguiseSkinId,
        visibility: msg.visibility,
      });
      if (joined.error) {
        send(socket, { type: "error", message: joined.error });
        return;
      }
      connections.set(socket, { roomCode: room.code, playerId: joined.playerId });
      send(socket, {
        type: "joined",
        roomCode: room.code,
        playerId: joined.playerId,
        playerIndex: joined.playerIndex,
        isHost: joined.isHost,
      });
      room.broadcast();
      return;
    }

    if (msg.type === "join_room") {
      const code = String(msg.roomCode || "").toUpperCase();
      const room = MatchRoom.get(code);
      if (!room) {
        send(socket, { type: "error", message: "Room not found" });
        return;
      }
      const joined = room.addPlayer(socket, {
        name: msg.playerName,
        skinId: msg.skinId,
        disguiseSkinId: msg.disguiseSkinId,
        visibility: msg.visibility,
      });
      if (joined.error) {
        send(socket, { type: "error", message: joined.error });
        return;
      }
      connections.set(socket, { roomCode: room.code, playerId: joined.playerId });
      send(socket, {
        type: "joined",
        roomCode: room.code,
        playerId: joined.playerId,
        playerIndex: joined.playerIndex,
        isHost: joined.isHost,
      });
      room.broadcast();
      return;
    }

    if (msg.type === "reconnect") {
      const code = String(msg.roomCode || "").toUpperCase();
      const room = MatchRoom.get(code);
      if (!room) {
        send(socket, { type: "error", message: "Room not found" });
        return;
      }
      const joined = room.reconnectPlayer(socket, msg.playerId);
      if (joined.error) {
        send(socket, { type: "error", message: joined.error });
        return;
      }
      connections.set(socket, { roomCode: room.code, playerId: joined.playerId });
      send(socket, {
        type: "reconnected",
        roomCode: room.code,
        playerId: joined.playerId,
        playerIndex: joined.playerIndex,
        isHost: joined.isHost,
      });
      room.broadcast();
      return;
    }

    const conn = connections.get(socket);
    if (!conn) {
      send(socket, { type: "error", message: "Not in a room" });
      return;
    }
    const room = MatchRoom.get(conn.roomCode);
    if (!room) {
      send(socket, { type: "error", message: "Room expired" });
      return;
    }

    if (msg.type === "sync_visibility") {
      room.setVisibility(conn.playerId, msg.visibility);
      return;
    }

    if (msg.type === "start_match") {
      const result = room.startMatch(conn.playerId);
      if (result.error) send(socket, { type: "error", message: result.error });
      return;
    }

    if (msg.type === "action") {
      const result = room.handleAction(conn.playerId, msg.action, msg.payload ?? {});
      if (result.error) send(socket, { type: "error", message: result.error });
      return;
    }
  });

  socket.on("close", () => {
    const conn = connections.get(socket);
    if (!conn) return;
    connections.delete(socket);
    const room = MatchRoom.get(conn.roomCode);
    room?.removePlayer(conn.playerId);
    room?.broadcast();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[online] WebSocket server ws://${HOST}:${PORT}/ws`);
  console.log(`[online] health http://${HOST}:${PORT}/health`);
});
