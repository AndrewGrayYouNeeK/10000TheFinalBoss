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

Production site: [www.roll10000.com](https://www.roll10000.com) · preview: [roll10000.pages.dev](https://roll10000.pages.dev)

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

Then (same zone) add a **Redirect Rule** from `roll10000.com/*` to `https://www.roll10000.com/$1` (301), so bare domain goes to `www`.

### Troubleshooting

This app deploys to **Cloudflare Pages** (`roll10000`), not a standalone Worker. `npm run deploy:web` publishes to `roll10000.pages.dev`.

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `roll10000.pages.dev` works but `www.roll10000.com` returns `{"error":"Not found"}` | Custom domain points at a **Worker** or API, not Pages | Cloudflare dashboard → **Workers & Pages** → **roll10000** → **Custom domains** → ensure `www.roll10000.com` is listed and **Active**. Remove conflicting **Worker routes** on `www.roll10000.com/*` (Workers → your worker → Triggers → Routes). |
| `roll10000.com` shows Cloudflare Access login | **Zero Trust** policy on apex | Zero Trust → **Access** → Applications → remove or bypass public access for `roll10000.com` / `www.roll10000.com`, or add a Bypass policy for everyone. |
| Site loads but routes 404 on refresh | Missing SPA fallback | Confirm `dist/_redirects` contains `/* /index.html 200` after build. |

Quick check:

```bash
curl -sI https://roll10000.pages.dev | head -3    # expect HTTP/2 200, text/html
curl -s https://www.roll10000.com                  # should be HTML, not {"error":"Not found"}
```


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
