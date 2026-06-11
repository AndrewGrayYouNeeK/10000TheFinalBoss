# YouNeeK 10,000 — The Ultimate Roll

A YouNeeK-styled 10,000 dice game with local multiplayer, story mode, shop, and progression. Runs entirely in the browser with no external account or backend required.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Optional: copy `.env.example` to `.env.local` for local overrides (not required).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run ios:sync` | Build web app + sync to iOS (Capacitor) |
| `npm run ios:open` | Open project in Xcode |
| `npm run ios:run` | Sync + run on **iPhone 17** simulator (override with `IOS_SIMULATOR=<uuid>`) |

## Progress & Cosmetics

Coins, XP, unlocked skins, and shop purchases are saved in your browser via `localStorage` (`src/lib/localProfile.js`). No sign-in required.

## iOS / Xcode

This project uses [Capacitor](https://capacitorjs.com/) to wrap the web app as a native iOS app.

**Prerequisites:** Xcode, CocoaPods (`sudo gem install cocoapods` if needed)

```bash
npm install
npm run ios:sync    # first time: builds web + creates/syncs ios/
npm run ios:open    # opens App.xcworkspace in Xcode
```

In Xcode: select **iPhone 17** (or newer) simulator → Run (▶). There is no iPhone 16 simulator on Xcode 26 — picking an missing device causes "build failed" / destination errors.

After any web code change, run `npm run ios:sync` before rebuilding in Xcode.

Bundle ID: `com.yourneek.neon10000`

## Online Multiplayer

Not included in this standalone build. `/online` shows an unavailable page until a game server is added.

## AI / Cursor Setup

- **Agent instructions:** `AGENTS.md`
- **Cursor rules:** `.cursor/rules/`
- **Project skill:** `.cursor/skills/yourneek-10000-dev/SKILL.md`

## Project Structure

```
src/lib/          game logic, scoring, shop, local profile
src/pages/        screens (Home, Game, Shop, Story, …)
src/components/   UI components
public/assets/    images & videos
ios/              Capacitor iOS project (generated after npm run ios:sync)
```

**Sacred files (game rules — do not change casually):** `src/lib/gameLogic.js`, `scoring.js`, `powers.js`, `aiOpponent.js`
