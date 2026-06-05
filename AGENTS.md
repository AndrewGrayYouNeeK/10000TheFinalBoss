# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Single Base44-hosted React/Vite app: **10,000** (cyberpunk dice game). There is no local backend — only the Vite dev server runs locally; auth, entities, and serverless functions live on Base44.

### Required environment file

Create `.env.local` in the repo root (gitignored). Values come from `base44/.app.jsonc`:

```bash
VITE_BASE44_APP_ID=69e7669b223d37093cd03879
VITE_BASE44_APP_BASE_URL=https://69e7669b223d37093cd03879.base44.app
```

Without `VITE_BASE44_APP_BASE_URL`, the `@base44/vite-plugin` will not proxy `/api` to Base44 and the app will fail to load public settings on startup.

### Running the dev server

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Use a tmux session for long-running dev servers. The app is at `http://127.0.0.1:5173`.

### Lint / typecheck / build

| Command | Notes |
|---------|-------|
| `npm run lint` | Pre-existing unused-import errors in several pages (not introduced by env setup) |
| `npm run typecheck` | Pre-existing JSX/shadcn typing errors across the codebase |
| `npm run build` | Succeeds when `.env.local` is present |

### Testing without auth

**Local hot-seat multiplayer** (`/` → PLAY NOW → `/setup` → `/game`) works without Base44 login. Story, shop persistence, and online modes require authenticated Base44 users.

### Services

| Service | Required? |
|---------|-----------|
| Vite dev server (`npm run dev`) | Yes |
| Base44 cloud backend (via `.env.local` proxy) | Yes |
| Docker / Postgres / Redis | No |
