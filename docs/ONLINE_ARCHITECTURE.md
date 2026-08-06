# Online Multiplayer Architecture

**Status (Aug 2026):** Online PvP MVP is implemented via a Cloudflare Worker + Durable Object (`server/`). Local play remains fully offline.

---

## What exists today

| Area | Status |
|------|--------|
| Route `/online` | Lobby — create / join by invite code |
| Route `/online/:code/play` | Waiting room → hands off to `/game` |
| WebSocket game server | `server/` Cloudflare Worker + `MatchRoom` DO |
| Matchmaking | Invite codes (2 players) |
| Auth / accounts | Guest tokens in `sessionStorage` (no accounts yet) |
| Per-client visibility | `buildClientMatchPayload()` on the server |
| Client scaffolding | `onlineClient.js`, `useOnlineMatch.js`, `useOnlineGameView.js` |

---

## Local development

Run **two** terminals:

```bash
# Terminal A — game UI
npm run dev

# Terminal B — online worker (Durable Objects)
npm run online:dev
```

Vite proxies `/online-api` → `http://127.0.0.1:8787` (see `vite.config.js`).

Open two browser profiles (or one normal + one private window) at `http://127.0.0.1:5173/online`:

1. **Create room** on device A → copy code  
2. **Join** with that code on device B  
3. Both tap **I'm ready** → match starts on `/game`

---

## Production deploy

```bash
npx wrangler login   # once
npm run online:deploy
```

Then set the worker URL for the web app:

```bash
# .env.production / Cloudflare Pages env
VITE_ONLINE_URL=https://roll10000-online.<account>.workers.dev
```

Rebuild/deploy the Pages site (`npm run deploy:web`) so the client picks up `VITE_ONLINE_URL`.

---

## Core principle: server-authoritative per-client payloads

Each connected client receives a **`ClientMatchPayload`** built by the server for **that viewer only**. Clients must never infer hidden opponent data from a shared broadcast.

The reference implementation lives in:

- `src/lib/onlineGameState.js` → `buildClientMatchPayload()`, `deriveOnlineUiFlags()`
- `server/applyAction.js` → applies `gameLogic` actions, then fans out payloads

---

## Server message contract

### Client → Server

```json
{ "type": "join", "name": "You", "skinId": "classic_white", "visibility": { } }
{ "type": "ready" }
{ "type": "action", "action": "roll" | "toggle_hold" | "confirm_reroll" | "bank" | "pass_farkle" | "use_power" | "plasma_cut" | "clear_shark_bite_fx", "payload": {} }
{ "type": "set_visibility", "visibility": { } }
```

### Server → Client

```json
{ "type": "lobby", "code": "ABC123", "status": "lobby", "seats": [] }
{ "type": "match_state", "seq": 42, "viewerPlayerIndex": 0, "payload": { /* ClientMatchPayload */ }, "rollAnimMs": 900 }
{ "type": "error", "error": "…" }
```

---

## Conflict with pass-and-play privacy

| Feature | Scope |
|---------|-------|
| `passPlayPrivacy.js` | One device, handoff overlay, look-away |
| `onlineVisibility.js` | Two devices, server redacts opponent payload |

Online mode ignores pass-and-play handoff overlay.
