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

Standalone Vite + React app; npm only (a `package-lock.json` is committed). The startup update script runs `npm install`, so dependencies are already present — run/build/lint/test directly.

- **Run / build / lint**: see the `## Commands` section above. Dev server is `npm run dev` → `http://localhost:5173`.
- **iOS / Capacitor (`npm run ios:*`) does NOT work here.** It requires macOS + Xcode; this is a Linux VM. Skip all iOS commands and test the web app instead.
- **Smoke test (`npm run smoke`)**: a Playwright script (`scripts/smoke-test.mjs`) that checks `/`, `/shop`, `/setup`, `/rules`. It needs (a) the Chromium browser installed once via `npx playwright install chromium`, and (b) a server reachable at `http://127.0.0.1:4173` (start with `npm run build` then `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`). Override the target with `BASE_URL`. It does NOT exercise the `/game` route.
