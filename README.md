# YouNeeK 10,000 — The Ultimate Roll

A YouNeeK-styled 10,000 dice game with local multiplayer, story mode, shop, and progression. Runs entirely in the browser with no external account or backend required.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and **leave that Terminal window open** while you work.

If you use Cursor agents to edit code, run `npm run dev` yourself in a normal Terminal — not inside an agent session. Agent-started dev servers stop when the agent finishes, which looks like “localhost stopped working after every code change.”

Optional: copy `.env.example` to `.env.local` for local overrides (not required).

## Web hosting (Cloudflare Pages)

- Live now: **https://roll10000.pages.dev**
- Custom domain (after DNS below): **https://www.roll10000.com**

| Setting | Value |
|---------|-------|
| Pages project | `roll10000` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node | 20 |
| SPA fallback | `public/_redirects` → `/* /index.html 200` |

### DNS for www.roll10000.com

The Pages project is on the Cloudflare account used for deploy. The `roll10000.com` **zone** must point at that project. In the Cloudflare dashboard where **Websites → roll10000.com** appears, add (or fix) these DNS records (Proxied / orange cloud):

| Type | Name | Target |
|------|------|--------|
| CNAME | `www` | `roll10000.pages.dev` |
| CNAME | `@` (apex) | `roll10000.pages.dev` |

Optional: a Redirect Rule so `https://roll10000.com` → `https://www.roll10000.com`.

Until those CNAMEs exist, custom-domain SSL stays pending (`CNAME record not set`). The `*.pages.dev` URL works immediately.

### Public site vs creator tools

Do **not** put Cloudflare Access on the whole domain — that blocks players with a Cloudflare login. Instead, creator tools are gated in-app with `VITE_LAB_GATE_PASSWORD` (see `.env.example`).

Protected routes (password wall in production): Sprite Lab, Felt Lab, Ice/Shark labs, Video Assets, Fish Showcase, Preview Dice.

Stay public for players: Shop, Game, Story, Held Style, Soundwave Mic, etc.

- Local `npm run dev`: labs unlock automatically.
- Production: set `VITE_LAB_GATE_PASSWORD` in `.env.local` (or Pages env), rebuild, deploy; open `/sprite-lab` and enter the password (session unlock for that tab).

If `roll10000.com` still shows **Sign in · Cloudflare Access**, remove the Access application for that hostname in the **youneekartifacts** Zero Trust dashboard (Access → Applications).

### Deploy updates

```bash
npm run build && npx wrangler pages deploy dist --project-name=roll10000
```

Or connect the GitHub repo in **Workers & Pages → roll10000 → Settings → Builds** for auto-deploy on push to `main`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run ios:sync` | Build web app + sync to iOS (Capacitor) |
| `npm run ios:fix` | Clean DerivedData, reinstall pods, sync, open workspace |
| `npm run ios:open` | Open **App.xcworkspace** in Xcode (not `.xcodeproj`) |
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

**Important:** Always open `ios/App/App.xcworkspace`, **never** `App.xcodeproj`. Opening the `.xcodeproj` alone skips CocoaPods and causes errors like `Search path .../Capacitor not found`. If that happens, run:

```bash
npm run ios:fix
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
