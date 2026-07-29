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

Standalone browser app — there is **no backend, no database, and no required env vars/secrets**. Setup is just `npm install`; the update script runs it on startup. Player progress lives in browser `localStorage` (`src/lib/localProfile.js`), so to reset state clear site data at `http://localhost:5173`.

Run/lint/build commands are already listed under `## Commands`. Notes and gotchas:

- **Manual/GUI testing:** run `npm run dev` and drive the app in a browser at `http://localhost:5173`. Core gameplay flow: Home → `PLAY NOW` → Setup (enter player names) → Game → `ROLL DICE` → click a scoring die (a 1 = +100, a 5 = +50).
- **CI** (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint`, `npm run build` on PRs to `main`.
- **Pre-existing lint failure:** `npm run lint` currently exits non-zero due to an unused import (`DEFAULT_MIC_SETTINGS`) in `src/components/game/portfolio/SoundwaveMicSettingsForm.jsx`. This is unrelated to environment setup, so CI lint on `main` is red independent of your change. `npm run build` passes.
- **Smoke test:** `npm run smoke` (`scripts/smoke-test.mjs`) uses Playwright against a preview build at `127.0.0.1:4173`; start `npm run start` (build + preview) first. Playwright browsers may need `npx playwright install chromium`. It is not part of CI.
- iOS/Capacitor targets (`ios:*`) require macOS + Xcode and cannot run in this Linux cloud VM.
