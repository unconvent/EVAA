# What This Boilerplate Can Do

This project gives you a head start for building and selling a SaaS. It includes sign‑in, plans, payments, and AI examples, so you can focus on your product instead of wiring everything together.

Important: BoilerKitt is totally free and open source — and it will remain free and open source.

Highlights

- Sign in with Google in one click.
- Secure user accounts stored in Supabase.
- A default Free plan is created for every new user automatically.
- Stripe subscriptions with two paid plans (Pro and Legendary), each available monthly or annually.
- Ready‑made checkout and a customer portal so users can manage billing.
- Webhooks keep your database in sync when someone upgrades, downgrades, or cancels.
- A dashboard that shows the user’s current plan, interval, and status.
- Features can be limited by plan (examples included for Pro and Legendary).
- An example AI feature: “Subject Line Studio” that streams 12 subject lines from Together AI.
- Plan‑based cooldowns for the AI feature (Free: longer wait, paid plans: shorter waits). The server enforces this and the UI reflects it.
- A pricing page wired to Stripe so you can start charging right away.

New in this version

- Simple Image Gen using Replicate (`qwen/qwen-image`) with a dedicated page. Available to Pro and Legendary.
- Image Editor using Replicate (`qwen/qwen-image-edit` and `google/nano-banana`) with model selection. Legendary only.
- Pricing UX guards sign‑in on upgrade, with a clear message when not signed in.
- Homepage polish: founders badge with unique avatars, logo carousel from `public/logos`, and a “Let’s Go” CTA that triggers sign‑in.
 - Benefit cards that clearly state outcomes (Ship in days, Lower costs, Production‑ready)
 - Testimonials carousel (avatars from `public/avatars`), FAQs, and a final CRO section with a visual and CTA

What’s inside (plain English)

- Accounts and profiles
  - Sign in with Google.
  - A profile record is created for each user.
  - Only the signed‑in user can see their own profile data (database rules are set for this).

- Plans and payments
  - Two paid plans: Pro and Legendary.
  - Monthly and annual options for both.
  - Stripe Checkout for buying and a customer portal for managing the subscription.
  - Webhooks listen to Stripe events and update the database so your app always knows the user’s plan.

- Feature access by plan
  - Example endpoints that only run if the user has the right plan (Pro or Legendary).
  - The dashboard and feature pages read the same subscription data, so what you see matches what you can do.

- Example AI feature
  - “AI Subject Line Studio” that calls Together AI to generate 12 subject lines.
  - Results stream into the page as they are created.
  - Cooldowns depend on plan and are checked on the server. The UI shows when you can run it again.
  - Two image demos with Replicate: prompt‑to‑image (Pro+) and prompt‑based editing (Legendary).

- Developer experience
  - Clear environment variables in `.env.local`.
  - A SQL script to set up tables and rules (profiles, subscriptions, and a trigger to give new users a Free plan).
  - If Stripe price IDs aren’t set, dev prices can be created for you so you can test locally.
  - Organized Next.js app with API routes for billing, plan checks, and the AI feature.
  - TypeScript and linting ready to go.

Benefits at a glance

- Time to market: ship weeks faster because auth, plans, billing, and working AI examples are already wired.
- Lower risk and cost: fewer moving pieces to integrate and fewer pitfalls (webhooks, RLS, product/price mapping).
- Production‑ready posture: server‑enforced limits, plan parity across pages, and secure key handling by default.

Marketing page building blocks you can reuse

- Above the fold: tight headline, 3 benefit bullets, single CTA, product screenshot, trust (logos/badge)
- Body: benefits trio → “At a Glance” grid → testimonials → Example Pricing (Demo) → FAQs → final CRO block + CTA

Newsletter capture

- Footer newsletter form posts to `/api/newsletter/subscribe` and stores emails in `public.subscribers`.
- Anti‑bot measures without external CAPTCHA: honeypot, time gate (≥ 2s), and a small math challenge.

In short: this boilerplate handles sign‑in, plans, payments, and real AI features with plan limits. You can add your own features on top without rebuilding the basics.
