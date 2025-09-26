# Project Outline & Architecture

## Objectives
- Ship a production-ready SaaS starter with Auth, Billing, and Plan Gating.
- Keep code approachable; sensible defaults; secure by design.

## Scope (v1)
- Marketing site (home, pricing, docs)
- Auth via Supabase (Google)
- Stripe subscriptions (Checkout + Portal + webhooks)
- Dashboard with plan-gated examples (AI demos optional)

## High-Level Architecture
- Next.js App Router (server components + edge where appropriate)
- Supabase: auth, profiles, subscriptions (RLS enabled)
- Stripe: products/prices, checkout sessions, portal, webhooks
- API routes:
  - `/api/checkout` → creates Checkout session
  - `/api/portal` → creates Portal session
  - `/api/webhooks/stripe` → persists subscription events

## Data Model (core)
- profiles(id, email, plan, plan_status, plan_interval, stripe_customer_id, timestamps)
- subscriptions(id, user_id, stripe_customer_id, plan, interval, status, current_period_end, created_at)

## Security
- RLS: users select only their own rows
- Server routes verify Supabase session
- Webhook uses Supabase service role key (server-only)

## Environments
- Local: `.env.local`, http://localhost:3000
- Vercel Preview: branch deploys; optional webhook endpoints per preview
- Vercel Production: primary domain; Stripe webhook points here

## Dependencies
- `@supabase/ssr`, `@supabase/supabase-js`
- `stripe`
- `next/og`
- `lucide-react`

## Milestones
1. Supabase + Google OAuth working locally
2. Deploy to Vercel (envs configured)
3. Stripe products/prices; checkout OK in test mode
4. Webhook delivers and updates Supabase
5. Portal session and plan switches verified
6. SEO/OG configs complete; lighthouse pass for core pages

## Risks & Mitigations
- Misconfigured URLs (OAuth/redirects/webhooks) → Add explicit checklists and runtime warnings
- Missing envs on Vercel → Guarded code paths + docs
- Webhook failures → Resend from Stripe; log minimal diagnostics

## File Structure
```
app/
  README.md, GUIDE.md, WHAT-THIS-BOILERPLATE-CAN-DO.md
  public/                 # static assets (imgs, logos, avatars)
  supabase/               # SQL schema and helpers
  src/
    app/                  # Next.js App Router
      page.tsx            # Home/landing
      pricing/page.tsx    # Pricing page (demo checkout)
      docs/page.tsx       # Docs aggregator (renders README/guide)
      auth/callback/page.tsx  # Supabase OAuth code exchange
      dashboard/          # Signed-in area and feature demos
        page.tsx
        image-gen/page.tsx
        image-editor/page.tsx
      api/                # Route handlers (server)
        checkout/route.ts         # Stripe Checkout session
        portal/route.ts           # Stripe Portal session
        webhooks/stripe/route.ts  # Stripe webhooks
        newsletter/subscribe/route.ts
        avatars/route.ts, logos/route.ts
        ai/image-edit/route.ts
    components/           # UI components (navbar, pricing, etc.)
    lib/                  # supabase, stripe, prices helpers
  build-ship-launch-playbooks/  # team playbooks (this folder)
```

## Page Breakdown
- `/` Home: marketing hero, features, testimonials, pricing teaser, newsletter
- `/pricing` Pricing: PRO vs LEGENDARY, monthly/annual, starts Checkout
- `/docs` Docs: renders overview and deployment guide
- `/auth/callback` Callback: exchanges OAuth code → session → redirect `/dashboard`
- `/dashboard` Dashboard: plan status, links to demos and portal
- `/dashboard/image-gen` Simple Image Gen demo (plan-gated)
- `/dashboard/image-editor` Image Editor demo (Legendary only)
- API
  - `/api/checkout` Creates Stripe Checkout session
  - `/api/portal` Creates Stripe Customer Portal session
  - `/api/webhooks/stripe` Handles subscription events and updates Supabase
  - `/api/newsletter/subscribe` Stores subscriber
  - `/api/avatars`, `/api/logos` Utility endpoints for marketing UI
