# Online Multiplayer Architecture

**Status (Jul 2026):** Online PvP is **not implemented**. `/online` routes to a placeholder page. There is no game server, WebSocket layer, matchmaking, or auth. Local pass-and-play privacy (`src/lib/passPlayPrivacy.js`) is a **shared-device** feature and does not apply to remote play.

This document defines the **server-authoritative, per-client visibility** model the client is scaffolded for.

---

## What exists today

| Area | Status |
|------|--------|
| Route `/online`, `/online/:matchId` | Placeholder → `OnlineUnavailable.jsx` |
| WebSocket / REST game server | **None** |
| Matchmaking / rooms / invites | **None** |
| Auth / accounts | Local profile only (`localProfile.js`) |
| Online skin levels stub | `skin_levels` in profile + `getSkinPowerLevel()` |
| Opponent SFX mute | Saved in profile (for future online) |
| Pass-and-play privacy | Local shared-screen only — **not** online |
| Client scaffolding | `onlineGameState.js`, `onlineVisibility.js`, `useOnlineGameView.js` |

---

## Core principle: server-authoritative per-client payloads

Each connected client receives a **`ClientMatchPayload`** built by the server for **that viewer only**. Clients must never infer hidden opponent data from a shared broadcast.

```
┌─────────────┐     authoritative      ┌──────────────┐
│   Server    │◄─── actions (roll,     │  Player A    │
│  match room │     hold, bank, power) │  (client)    │
│             │                        └──────────────┘
│  canonical  │     ClientMatchPayload
│  MatchState │────────────────────────► Player A view (full dice on A's turn)
│             │
│             │     ClientMatchPayload
│             └────────────────────────► Player B view (redacted dice on A's turn)
```

The reference implementation of payload projection lives in:

- `src/lib/onlineGameState.js` → `buildClientMatchPayload()`, `deriveOnlineUiFlags()`

The server should run equivalent logic (or share this module in a monorepo worker).

---

## Visibility preferences (per player)

Each player configures what **opponents** see during **their** turn. Stored locally today as `online_visibility` in the player profile; must sync to server account when online launches.

| Flag | Opponent sees during your turn |
|------|----------------------------------|
| `hideDice` | Blurred/hidden die faces (held status optional) |
| `hideTurnScore` | `•••` instead of live turn score |
| `hidePowerPanel` | No power mode panel / tray charge fanfare |
| `hidePowerChargeBadge` | No ⚡ on score card |
| `hideXrayReveals` | X-ray findings withheld |
| `subtlePowerVfx` | Reduced glow if any power UI leaks through |

Defaults: all hiding **on** (privacy-first).

Managed by `src/lib/onlineVisibility.js` and `OnlinePrivacySettings.jsx`.

---

## Server message contract

### Client → Server (actions)

```json
{
  "type": "action",
  "matchId": "uuid",
  "playerId": "uuid",
  "action": "roll" | "toggle_hold" | "confirm_reroll" | "bank" | "pass_farkle" | "use_power" | "plasma_cut" | ...,
  "payload": {}
}
```

Server validates turn, applies via existing game rules (`gameLogic.js` on server), then pushes updated payloads.

### Server → Client (state sync)

```json
{
  "type": "match_state",
  "matchId": "uuid",
  "viewerPlayerIndex": 0,
  "seq": 42,
  "payload": { /* ClientMatchPayload — see onlineGameState.js */ }
}
```

### ClientMatchPayload (per viewer)

Fields the client needs to render (redacted where applicable):

| Field | Notes |
|-------|-------|
| `viewerPlayerIndex` | Which seat this payload is for |
| `currentIndex` | Active turn |
| `players[]` | Names, banked scores, onBoard, debuffs; `scoreHidden` per player when applicable |
| `dice[]` | Full values for active viewer on their turn; `value: null` + `valueHidden: true` for opponents when `hideDice` |
| `turnScore` | `null` when hidden from this viewer |
| `hasRolled`, `farkle`, `winner`, … | Same semantics as local `gameLogic` state |
| `xrayReveals` | Empty object when hidden from viewer |
| `uiHints` | Precomputed flags: `opponentTurnShield`, `hidePowerPanel`, `subtlePowerVfx`, etc. |

Reveal rules (when opponent **may** see data):

- **Bank / pass / farkle end of turn** — final turn score and dice outcome broadcast to both (configurable; default reveal on bank).
- **Game over** — all scores visible.
- **Powers with public effect** (e.g. score freeze on opponent) — effect visible, charge animation optional per `hidePowerPanel`.

---

## What must be built (backend)

1. **Game server** — WebSocket or WebRTC data channel; room lifecycle, reconnect.
2. **Authoritative game loop** — Port or share `gameLogic.js` + `scoring.js` + `powers.js` on server.
3. **Per-client fan-out** — After each action, call `buildClientMatchPayload()` once per connected player.
4. **Account / matchmaking** — Invite codes, queue, or friends list (out of scope for client stub).
5. **Anti-cheat** — Never trust client dice values; server rolls.
6. **Profile sync** — `skin_levels`, `online_visibility`, cosmetics for display.

---

## Client integration points

| File | Role |
|------|------|
| `src/hooks/useOnlineGameView.js` | Maps server payload → UI flags + display dice |
| `src/pages/Game.jsx` | Uses hook when `dice10k_online_mock` session flag set; ready for real socket |
| `src/pages/OnlineUnavailable.jsx` | Roadmap + dev visibility preview |
| `src/lib/onlineGameState.js` | Payload builder (server spec + client mock) |

When wiring a real server:

```javascript
// Pseudocode in Game.jsx or useOnlineMatch.js
socket.on("match_state", (msg) => {
  setClientPayload(msg.payload);
});
const { ui, displayDice } = useOnlineGameView({
  enabled: true,
  clientPayload, // from server — skip local buildClientMatchPayload
});
```

---

## Dev mock (no server)

1. Open `/online` → **Preview visibility (dev)**.
2. Sets session flags and opens `/game` as viewer index `0`.
3. Toggle **Online privacy** in the header (EyeOff) to change what the opponent would see.
4. Use browser devtools to change `sessionStorage.dice10k_online_viewer_index` to `1` and refresh to simulate the other device.

This runs **local** game logic with **simulated** per-client redaction — useful for UI only, not network testing.

---

## Conflict with pass-and-play privacy

| Feature | Scope |
|---------|-------|
| `passPlayPrivacy.js` | One device, handoff overlay, look-away |
| `onlineVisibility.js` | Two devices, server redacts opponent payload |

Do not conflate them. Online mode ignores pass-and-play handoff overlay.
