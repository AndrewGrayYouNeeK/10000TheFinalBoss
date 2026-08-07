# Web shop, community & launch cutover

## Pre-launch (current default)

- `www.roll10000.com/` → marketing landing
- `/play` → full game hub (testers)
- `/shop` → USD web shop UI
- `/community` → Talk / Help / Ideas
- `/account` → magic-link sign-in + sync

`VITE_WEB_PLAY_ENABLED` defaults to **true** when unset.

## Enable cloud features

1. Create a Supabase project.
2. Run `supabase/migrations/20260328120000_initial.sql` in the SQL editor (or `supabase db push`).
3. Enable Email auth (magic link). Add redirect URL `https://www.roll10000.com/account` (and `http://127.0.0.1:5173/account` for local).
4. Put in `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Create Stripe account; set secrets on Edge Functions:
   - `supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_... SITE_URL=https://www.roll10000.com`
6. Deploy functions:
   - `supabase functions deploy create-checkout`
   - `supabase functions deploy stripe-webhook --no-verify-jwt`
7. Point Stripe webhook to `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook` for `checkout.session.completed`.

## Launch cutover (remove web play)

When the App Store build ships and you want the domain to be landing + shop + community only:

```bash
# .env.production or Cloudflare Pages env
VITE_WEB_PLAY_ENABLED=false
npm run deploy:web
```

Play routes (`/play`, `/game`, `/setup`, …) redirect to `/`. Landing shows **Get the App** instead of **Play Now**.

## Sync model

Purchases write `entitlements` rows. Web + iOS call `syncEntitlementsFromCloud()` on sign-in and merge into `localStorage` profile (**add-only** — never wipes coins/XP).

## Private labs

All editors live under **`/labs`** (Dev Labs hub). Individual routes still work; start from the hub.

- Local: `npm run dev` → open `/labs` (or **Labs** on the game hub)
- Production: set `VITE_LAB_ADMIN_EMAILS=your@email.com`, sign in, then `/labs`
- Shop no longer scatters Sprite/Felt/Preview lab buttons — one **Labs** entry for admins only
