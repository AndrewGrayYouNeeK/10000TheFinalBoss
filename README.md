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

Production site: **https://www.roll10000.com** · preview: **https://roll10000.pages.dev**

| Setting | Value |
|---------|-------|
| Pages project | `roll10000` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node | 20 |
| SPA fallback | `public/_redirects` → `/* /index.html 200` |

Publish a production build (requires `npx wrangler login` once):

```bash
npm run deploy:web
```

Optional: in the Cloudflare dashboard, connect GitHub repo `AndrewGrayYouNeeK/10000TheFinalBoss` so pushes to `main` auto-deploy.

**Apex `roll10000.com`:** already added on the Pages project but DNS for `@` is missing (zone nameservers are Cloudflare, but not on the same account as this Pages project). In the Cloudflare account that owns the `roll10000.com` zone → **DNS → Records**, add a proxied **CNAME**:

| Type | Name | Target |
|------|------|--------|
| CNAME | `@` | `roll10000.pages.dev` |

Then (same zone) add a **Redirect Rule**: `http(s)://roll10000.com/*` → `https://www.roll10000.com/$1` (301), so bare domain goes to `www`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run deploy:web` | Build + deploy to Cloudflare Pages (`roll10000`) |
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

Invite-code PvP via a Cloudflare Worker + Durable Object (`server/`).

```bash
# Terminal A
npm run dev
# Terminal B
npm run online:dev
```

Open `/online` on two devices/browsers → Create room / Join with code → Ready.

Production: `npm run online:deploy`, then set `VITE_ONLINE_URL` to the worker URL and rebuild the web app.

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
