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

- **Marketing site (web):** `/` landing → `/shop` (USD) → `/community` → `/account` (Supabase sync)
- **Local game (pre-launch web):** Landing → `/play` hub → Setup → Game (`sessionStorage` for player names)
- **Local game (native):** Home `/` → Setup → Game
- **Story mode:** Hub → Story → StoryGame (AI opponent via `aiOpponent.js`)
- **In-app coin shop:** `/shop` native or `/play/shop` on web (`useCosmetics().buyItem()`)
- **Online:** `/online` shows unavailable page (no server yet)

**Launch cutover:** set `VITE_WEB_PLAY_ENABLED=false` and redeploy — see `docs/WEB_SHOP_LAUNCH.md`.

## Cursor Rules

Project rules live in `.cursor/rules/*.mdc`. Project skill: `.cursor/skills/yourneek-10000-dev/SKILL.md`.

## iOS / Xcode

Capacitor wraps the Vite build. After web changes:

```bash
npm run ios:sync
npm run ios:open   # builds in Xcode, run on simulator or device
```

Bundle ID: `com.yourneek.neon10000`
