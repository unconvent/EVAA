## Live Demo

Live site: https://boiler-kitt.vercel.app/

Boilerplate SaaS stack: Next.js App Router + Supabase Auth + Stripe Subscriptions. Ready for Vercel.

## Getting Started (Quick)

1. Clone this repo and copy envs
   - `cp app/.env.local.example app/.env.local` and fill values.
2. Run the Supabase schema once
   - Paste `app/supabase/schema.sql` into Supabase SQL Editor → Run.
3. Configure Google OAuth and Stripe (Test mode)
   - Follow the zero‑to‑prod guide in `app/GUIDE.md`.
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

3) Stripe setup
- Create two products with recurring prices (monthly and yearly) for PRO and LEGENDARY.
- Copy the Price IDs to the env vars below.
- Create a webhook endpoint in Stripe pointing to `/api/webhooks/stripe` and add the signing secret.

4) Env vars
- Copy `.env.local.example` to `.env.local` and fill:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `NEXT_PUBLIC_APP_URL` (e.g. http://localhost:3000)
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`
  - `STRIPE_PRICE_LEGENDARY_MONTHLY`, `STRIPE_PRICE_LEGENDARY_YEARLY`
  - `TOGETHER_API_KEY` (Together AI key for the subject line generator)

5) Run locally
```bash
npm run dev
```

Open http://localhost:3000 and sign in with Google, test checkout and billing portal.

## Deploy to Vercel
- Import this project in Vercel.
- Add the same env vars in Vercel Project Settings.
- Add a Stripe webhook endpoint for your production domain `/api/webhooks/stripe`.

## Playbooks (Build → Ship → Launch)
- Action‑oriented docs live in `app/build-ship-launch-playbooks/` and are also rendered at `/docs` under Playbooks.
- Start with `outline.md`, then use `design.md`, `interaction.md`, and drive execution with `todo.md`.

## Notes
- Dashboard has demo endpoints: `Pro Feature` and `Legendary Feature` gated by subscription.
- Pricing page triggers Stripe Checkout; Billing opens the Stripe Customer Portal.
- Dashboard also exposes an "AI Subject Line Studio" at `/dashboard/subject-lines` that calls Together AI for 12 high-converting subject lines with plan-based cooldowns (Free 3h · Pro 3m · Legendary 30s).
