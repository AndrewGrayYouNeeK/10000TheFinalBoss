---
name: yourneek-10000-dev
description: >-
  Develop the YouNeeK 10,000 dice game. Use when editing this repo, adding features,
  fixing bugs, working on shop/story/UI, Capacitor iOS, or when the user mentions
  10000, YouNeeK, dice game, or The Final Boss.
---

# YouNeeK 10,000 Development

## Before You Code

1. Read `AGENTS.md` and `.cursor/rules/`.
2. Confirm whether the task touches **game logic** (`gameLogic.js`, `scoring.js`, `powers.js`, `aiOpponent.js`). If yes, only proceed when the user explicitly asked for gameplay changes.
3. Player data is local only — use `src/lib/localProfile.js` and `useCosmetics()`, not remote APIs.

## Common Tasks

### Add a shop item
Edit `src/lib/shopCatalog.js` (skin/felt/badge entry). Add sprite to `public/assets/` if needed. Do not change purchase logic in `useCosmetics` unless fixing a shop bug.

### Add per-skin dice VFX
Add overlay components in `src/components/game/` (see `LightningOverlay`, `FishOverlay`, `SnowGlobeOverlay`) and wire them in `Die.jsx` by `skin.id`. Do not touch game logic.

### Add story boss
Edit `src/lib/storyBosses.js` (metadata/dialogue). Story gameplay uses existing `StoryGame.jsx` + `aiOpponent.js`.

### Web → iOS
```bash
npm run build && npx cap sync ios
npm run ios:open
```

### Verify
```bash
npm run lint && npm run build
```

## Do Not

- Re-add external platform SDKs, auth gates, or cloud matchmaking without explicit request
- Refactor dice rolling, scoring, or turn rules "while you're in there"
- Commit `.env` files with secrets
