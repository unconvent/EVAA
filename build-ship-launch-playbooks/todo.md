# Project TODOs

Use this as an execution log. Keep items small and verifiable.

## Authentication
- [ ] Verify Supabase URL/anon key on Vercel
- [ ] Confirm Google OAuth consent screen (external) and test users (if testing)
- [ ] Test sign-in/out flows on desktop and mobile

## Billing (Stripe)
- [ ] Create PRO/LEGENDARY products + monthly/yearly prices
- [ ] Add `STRIPE_PRICE_*` envs on Vercel (or rely on auto-create)
- [ ] Configure webhook endpoint (Test mode)
- [ ] Paste `STRIPE_WEBHOOK_SECRET` into Vercel and redeploy
- [ ] Run test checkout (4242…)
- [ ] Verify subscriptions/profile updated in Supabase
- [ ] Open portal, test upgrade/downgrade/cancel

## Dashboard & Plan Gates
- [ ] Ensure gated features hide/disable for Free
- [ ] Show clear upsell copy for gated cards
- [ ] Handle webhook delay gracefully (status text)

## SEO & Social
- [ ] Update `metadata` title/description in `app/src/app/layout.tsx`
- [ ] Verify `/opengraph-image` and `/twitter-image`
- [ ] Test with Facebook Sharing Debugger and Twitter Card Validator

## Accessibility
- [ ] Keyboard nav through navbar, pricing, dashboard
- [ ] Focus states visible; meaningful labels
- [ ] Color contrast AA on text/buttons

## Observability
- [ ] Add minimal logs for webhook event types in production
- [ ] (Optional) Add analytics page views and key events behind a flag

## Security
- [ ] Secrets only in Vercel envs; rotate any leaked keys
- [ ] Service role key server-only; no logs
- [ ] RLS enabled; verify with a signed-out query attempt

## Docs
- [ ] Keep `GUIDE.md` in sync with latest flows
- [ ] Add screenshots/gifs for sign-in, checkout, portal

## Release Checklist
- [ ] Smoke test: sign-in → checkout → dashboard updates
- [ ] Portal open → plan change reflected
- [ ] Pricing and dashboard responsive on mobile
- [ ] Lighthouse score acceptable on home/pricing

