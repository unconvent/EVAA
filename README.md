## Live Demo

Live site: https://evaa-orcin.vercel.app/

EVAA is an AI growth engine for newsletters. It ships a production‑ready stack (Next.js App Router + Supabase Auth + Stripe Subscriptions) and two core creator tools:

- Viral Notes (short‑form text) powered by Pollinations
- Viral Post Images & Thumbnails powered by Replicate (google/nano-banana)

## Getting Started (Quick)

1. Clone and set env vars
   - Create `.env.local` in the repo root and fill the variables listed below.
2. Seed the database schema (once)
   - Paste `supabase/schema.sql` into the Supabase SQL Editor → Run.
3. Configure Google OAuth (Supabase) and Stripe (Test Mode)
   - See the Setup sections below.
4. Start locally
   - `npm install && npm run dev` → open http://localhost:3000

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USER/YOUR_REPO&project-name=boilerkitt&repository-name=boilerkitt)

## Setup

1) Create a Supabase project and configure Google OAuth
- In Supabase Auth > URL config, set Site URL to your Vercel domain and `http://localhost:3000` for local.
- Enable Google provider and set redirect to `/auth/callback`.

2) Create database tables
- Run the SQL in `supabase/schema.sql` in the SQL editor.
  - This creates profiles, subscriptions, RLS, and auto-assigns every new user a perpetual Free plan (inserted on signup).

3) Stripe (Test Mode)
- Create two products with recurring prices for PRO and LEGENDARY (Monthly + Yearly).
- Copy the Price IDs into the env vars below.
- Create a Webhook endpoint pointing to `https://YOUR_DOMAIN/api/webhooks/stripe` and copy the signing secret.

4) Env vars (.env.local)
  - `NEXT_PUBLIC_APP_URL` (e.g. http://localhost:3000 or your Vercel URL)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server‑only)
  - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`
  - `STRIPE_PRICE_LEGENDARY_MONTHLY`, `STRIPE_PRICE_LEGENDARY_YEARLY`
  - `POLLINATIONS_API_TOKEN` (Viral Notes)
  - `REPLICATE_API_TOKEN` (Viral Images)

5) Run locally
```bash
npm run dev
```

Open http://localhost:3000, sign in with Google, run a test checkout, and open the billing portal.

## Deploy to Vercel
- Import this project in Vercel and add the same environment variables (Production).
- Set `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g., https://evaa-orcin.vercel.app).
- In Stripe Test Mode, add a webhook endpoint → `https://YOUR_DOMAIN/api/webhooks/stripe` and paste the signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.

## Features
- Google Sign‑In via Supabase Auth.
- Stripe Subscriptions (Free by default; Pro and Legendary plans).
- Viral Notes Studio (`/dashboard/viral-notes`)
  - Pollinations model with streaming output.
  - Cooldowns: Free 1/day; Pro/Legendary unlimited.
- Viral Post Images & Thumbnails (`/dashboard/viral-images`)
  - Replicate: `google/nano-banana`, outputs PNG, 2 images per run.
  - Cooldowns: Free weekly; Pro 48h; Legendary unlimited.

## Notes
- Pricing triggers Stripe Checkout; Billing opens the Stripe Customer Portal.
- Webhook endpoint is `/api/webhooks/stripe` and must return 200 in Stripe event delivery logs.
- Subject line example route remains available in the codebase if you want to extend it.

---

Live site: https://evaa-orcin.vercel.app/
