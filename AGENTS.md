# AGENTS.md — YouNeeK 10,000 (The Final Boss)

Instructions for AI coding agents working in this repository.

## What This Is

YouNeeK 10,000 — The Ultimate Roll. A browser-first dice game with local multiplayer, story mode, shop/cosmetics, and mystery boxes. Runs fully offline. Player progress is stored in `localStorage` via `src/lib/localProfile.js`.

## Hard Rules

1. **Do not modify game logic** unless the user explicitly requests a gameplay change. Sacred files: `src/lib/gameLogic.js`, `src/lib/scoring.js`, `src/lib/powers.js`, `src/lib/aiOpponent.js`.
2. **Standalone only** — do not reintroduce external platform SDKs, cloud auth, subscription checks, or third-party platform CDNs.
3. **Minimal diffs** — match existing conventions; don't refactor unrelated code.

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server (http://localhost:5173)
npm run build        # production build → dist/
npm run lint         # ESLint
npm run ios:sync     # build web + sync to Capacitor iOS
npm run ios:open     # open Xcode workspace
```

## Dev Server (Important)

**Do not start `npm run dev` as part of routine agent work.** Agent terminal sessions are ephemeral — when the agent finishes, the dev server is killed and the user sees `ERR_CONNECTION_REFUSED` at `http://localhost:5173`.

The user should run the dev server once in their **own Terminal** (outside Cursor agent sessions):

```bash
npm run dev
```

Leave that terminal open while developing. Use `npm run build` and `npm run lint` to verify changes. Only start the dev server if the user explicitly asks, and warn them it will stop when the agent session ends.

## Architecture

```
src/
  lib/           game logic, scoring, shop catalog, local profile
  pages/         route-level screens (Home, Game, Shop, Story, …)
  components/    UI (game/, shop/, story/, ui/)
  hooks/         useCosmetics, useMysteryBox
public/assets/   self-hosted images and videos
ios/             Capacitor native iOS project (generated)
```

## Key Flows

- **Local game**: Home → Setup → Game (`sessionStorage` for player names)
- **Story mode**: Home → Story → StoryGame (AI opponent via `aiOpponent.js`)
- **Shop**: coins/XP from `localProfile`; purchases via `useCosmetics().buyItem()`
- **Online**: `/online` shows unavailable page (no server yet)

## Cursor Rules

Project rules live in `.cursor/rules/*.mdc`. Project skill: `.cursor/skills/yourneek-10000-dev/SKILL.md`.

## iOS / Xcode

Capacitor wraps the Vite build. After web changes:

```bash
npm run ios:sync
npm run ios:open   # builds in Xcode, run on simulator or device
```

Bundle ID: `com.yourneek.neon10000`

## Cursor Cloud specific instructions

Standard commands live in the `## Commands` section above and in `README.md`; this section only covers non-obvious cloud caveats.

- **Dependencies** are refreshed automatically on VM startup by the environment update script (`npm ci`), so you normally don't need to install anything manually.
- **Running the dev server here:** the "don't start `npm run dev`" rule targets *ephemeral* agent shells. In the cloud VM, when you need to run/test the app, start it inside a persistent `tmux` session so it survives, e.g. session `vite-dev-server` running `npm run dev`. It serves at `http://127.0.0.1:5173/` (IPv4-only, `--strictPort`); use `127.0.0.1`, not `localhost`.
- **3D dice roll animation:** during a roll the Three.js dice render as a brief "black screen with a spinning white cube" (a die is a cube) before the board settles. This is the normal roll/loading transition, **not** a crash — the full board reliably returns once the roll settles. Screen recordings often catch this frame at the tail; prefer a settled-board screenshot for clean evidence.
- **No backend / accounts:** the app is fully standalone. All progress (coins, XP, skins) is in `localStorage` via `src/lib/localProfile.js`; there is nothing to seed and no auth to configure.
- **iOS / Capacitor** (`npm run ios:sync`, `ios:open`, `ios:run`) requires macOS + Xcode and cannot run in this Linux cloud VM. Web (`dev`/`build`/`lint`) is the only runnable target here.
