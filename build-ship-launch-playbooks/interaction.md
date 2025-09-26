# Interaction & UX Playbook

Purpose: Define end-to-end flows, states, and UX standards so the team ships consistently and confidently.

## Personas & Primary Goals
- Visitor: Understand value quickly, see pricing, social proof.
- New User: Sign in with Google, reach dashboard within 15 seconds.
- Subscriber: Purchase/upgrade/cancel via Stripe reliably.
- Admin: Verify plans, troubleshoot webhooks, monitor errors.

## Core Flows
1) Sign-in (Google / Supabase)
- Trigger from homepage CTA or navbar.
- Redirect URL uses `window.location.origin` to work on localhost, previews, prod.
- Callback exchanges code and navigates to `/dashboard`.

2) Pricing → Checkout (Stripe)
- Signed-in check, else prompt to sign in.
- POST `/api/checkout` with plan + interval → redirect to Stripe Checkout.
- Success: `/dashboard?checkout=success`; Cancel: `/pricing?checkout=cancel`.

3) Webhook → Plan Sync (Stripe → Supabase)
- Listen to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Upsert `subscriptions`, update `profiles.plan`, `plan_status`, `plan_interval`, `stripe_customer_id`.

4) Manage Subscription (Stripe Portal)
- Dashboard action → `/api/portal` → Stripe customer portal.
- On return, reflect status changes on dashboard.

## States & Edge Cases
- Signed out → any gated action prompts sign-in.
- Missing envs → show guarded alerts, no crashes (e.g., auth/Stripe not configured).
- Webhook delay → show optimistic confirmation + “may take a few seconds”.
- Downgrade/cancel → reflect in `plan_status` and gated features.

## Accessibility Checklist (A11y)
- All interactive elements have accessible names/labels.
- Color contrast AA on primary surfaces.
- Keyboard navigation works across navbar, buttons, dialogs.
- Focus rings visible; no focus traps.
- Images include alt text or `aria-hidden` where appropriate.

## Validation & Errors (Copy Guidelines)
- Clear, action-oriented: “You must be signed in to upgrade.”
- Avoid jargon; suggest next step.
- Never expose raw stack traces to end users.

## Observability
- Console warn on missing configuration; avoid runtime crashes.
- Consider adding lightweight analytics events (page_view, sign_in_start, checkout_start, checkout_success, portal_open, webhook_update) behind a config flag.

## Security & Privacy Notes
- Never log secrets. Mask tokens and webhook signatures.
- Use Supabase RLS; server routes verify auth.
- Keep service role key server-only.

## Review Gates (per feature)
- Flow diagram updated
- Empty/error/loading states covered
- A11y pass
- Mobile and desktop screenshots
- Copy reviewed

## SaaS Platform Interaction Design
- Funnel: Landing → Sign in → Dashboard → Subscribe → Use gated features.
- Clear primary actions on every screen; secondary actions are supportive.
- Show plan/status prominently on the dashboard with a single upgrade CTA.

## Core Interactive Components
- Navbar: sign-in/sign-out, dashboard access, docs.
- Pricing Cards: plan toggle (monthly/annual), CTA buttons, upsell copy.
- Dashboard Cards: feature entries with plan gates and clear messaging.
- Toasts/Alerts: concise errors with next steps (e.g., sign-in required).

## User Flow (Happy Paths)
1) Visitor clicks Sign in → selects Google → lands on Dashboard.
2) User clicks Choose PRO → Stripe Checkout → success → Dashboard reflects new plan.
3) User opens Manage Subscription → Stripe Portal → changes plan → Dashboard updates after webhook.

## Multi‑Turn Interaction Loops
- Subject Lines (AI): prompt → stream results → adjust → re-run; cooldowns enforced.
- Image Gen: prompt → generate → review → iterate; limits by plan.
- Portal: change plan → return → status update after webhook → UI reflects.

## Interactive Features
- Plan‑gated endpoints return clear 402/403 copy; UI explains why and how to upgrade.
- Newsletter: simple form with honeypot + math; non-blocking failure modes.
- Avatars/Logos: lightweight endpoints power carousels; fail gracefully.

## Data Visualization (Lightweight)
- Plan status chip: Plan · Interval · Status (e.g., PRO · Monthly ACTIVE).
- Usage/cooldowns: humanized time remaining; hide when irrelevant.
- Consider sparklines or simple bars for usage if you add quotas later.

## Edge Cases & Recovery
- OAuth errors: return to `/` with a gentle retry notice.
- Checkout cancel: explain safely and provide a return to pricing.
- Webhook lag: show pending state; avoid blocking the UI.
