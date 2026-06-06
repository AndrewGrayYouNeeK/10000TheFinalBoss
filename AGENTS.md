# AGENTS.md — YouNeeK 10,000 (The Final Boss)

Instructions for AI coding agents working in this repository.

## What This Is

YouNeeK 10,000 — The Ultimate Roll. A browser-first dice game with local multiplayer, story mode, shop/cosmetics, and mystery boxes. Runs fully offline. Player progress is stored in `localStorage` via `src/lib/localProfile.js`.

## Hard Rules

1. **Do not modify game logic** unless the user explicitly requests a gameplay change. Sacred files: `src/lib/gameLogic.js`, `src/lib/scoring.js`, `src/lib/powers.js`, `src/lib/aiOpponent.js`.
2. **No Base44** — do not reintroduce `@base44/sdk`, cloud auth, subscription checks, or external platform CDNs.
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
