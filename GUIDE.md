# Boilerplate FAQ Guide

Below are the questions people usually ask the first time they run this stack. Every answer is written in plain English and includes the exact steps you can follow.

---

# Zero‑to‑Production on Vercel (Step‑by‑Step)

Follow this exact checklist to deploy BoilerKitt on Vercel with Google sign‑in (Supabase), Stripe subscriptions, and working social previews.

## 0) Prerequisites
- Accounts: GitHub (or GitLab), Supabase, Stripe (Test mode), Google Cloud Platform
- Optional: Node 18+ locally

## 1) Create Supabase project and run schema
1. Create a project at https://supabase.com/.
2. Project Settings → API: copy
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service role key → `SUPABASE_SERVICE_ROLE_KEY` (server‑only)
3. Supabase Studio → SQL Editor → run the contents of `app/supabase/schema.sql` once.

## 2) Configure Google sign‑in
1. Google Cloud Console → APIs & Services → OAuth consent screen → External → Create → fill basics → Save.
2. APIs & Services → Credentials → Create credentials → OAuth client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://YOUR_DOMAIN` (e.g. `https://boiler-kitt.vercel.app`)
   - Authorized redirect URIs:
     - `https://<YOUR_SUPABASE_REF>.supabase.co/auth/v1/callback`
   - Create → copy Client ID and Client secret.
3. Supabase → Authentication → Providers → Google → enable → paste Client ID/Secret → Save.
4. Supabase → Authentication → URL Configuration:
   - Site URL: `https://YOUR_DOMAIN`
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://YOUR_DOMAIN/auth/callback` → Save.

Notes
- The app signs in with `redirectTo: ${window.location.origin}/auth/callback`, so it works on localhost, previews, and production.

## 3) Set Vercel environment variables (Production and Preview)
Auth/App
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://YOUR_DOMAIN`

Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (from Section 5)
- Optional (recommended): `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_LEGENDARY_MONTHLY`, `STRIPE_PRICE_LEGENDARY_YEARLY`

Security
- Put secrets in Vercel envs (do not commit them). Rotate any secrets previously committed.

## 4) Deploy and verify sign‑in
1. Deploy via Vercel.
2. Open the site → click Sign in → choose Google account → you should land on `/dashboard`.
   - If redirected to `localhost`, re‑check Supabase Authentication → URL Configuration.

## 5) Stripe products and webhook (Test mode)
1. Stripe → Products: create PRO and LEGENDARY with Monthly and Yearly recurring prices. Copy each `price_...` ID and add to Vercel envs (or let the app auto‑create test prices at runtime on Vercel).
2. Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://YOUR_DOMAIN/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Save → copy the “Signing secret”.
3. Vercel envs: set `STRIPE_WEBHOOK_SECRET` to that secret → Redeploy.
4. Test: on `/pricing` choose a plan → complete checkout with `4242 4242 4242 4242` test card → redirected to `/dashboard?checkout=success`.
5. Verify: Stripe → Webhooks → your endpoint → Logs show 200; Supabase `subscriptions` upserts a row; `profiles` updates `plan`, `plan_status`, `plan_interval`, `stripe_customer_id`.

If it doesn’t update
- Ensure `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_WEBHOOK_SECRET` are set in Vercel.
- Confirm the endpoint URL is correct and in Test mode.
- Resend the last event from Stripe Logs after fixing envs.

## 6) Social previews (OG/Twitter)
- Programmatic images are included:
  - Open Graph: `https://YOUR_DOMAIN/opengraph-image`
  - Twitter: `https://YOUR_DOMAIN/twitter-image`
- Metadata is configured in `app/src/app/layout.tsx`. Set `NEXT_PUBLIC_APP_URL` so relative image URLs become absolute.
- Prefer a static PNG? Add `public/og.png` (1200×630) and point metadata to it.

---

## 1. What do I need before touching the code?
Make sure you have:
- A GitHub (or GitLab) account to host the repo.
- A Supabase account for auth and the database.
- A Stripe account (use test mode while you build).
- Node.js 18 or newer and npm/yarn on your computer so you can run the Next.js app.

## 2. How do I create the Supabase project and grab my keys?
1. Go to https://supabase.com/ and create/sign in to your account.
2. Click **New project**. Pick the free plan for now and choose any strong database password (Supabase needs it for its internal database; we do not use it again).
3. Wait for the project to finish provisioning. When it is ready, open **Project Settings → API**.
4. Copy the **Project URL** (this becomes `NEXT_PUBLIC_SUPABASE_URL`).
5. Copy the **anon public key** and the **service role key**. Store them securely; we will paste them into `.env.local` soon.

## 3. Which Supabase SQL do I need to run?
1. In the left sidebar choose **SQL Editor**.
2. Open `supabase/schema.sql` from the repo and copy everything.
3. Paste it into a new SQL query tab and click **Run**.
4. The script creates `profiles` and `subscriptions`, adds row-level security, and installs a trigger that gives every new user a default “Free” subscription. Without these tables the Stripe webhook will fail, so make sure the query finishes without errors.

## 4. How do I register Google OAuth in Google Cloud?
1. Visit https://console.cloud.google.com/ and sign in with the Google account you want to use.
2. Click **Select project → New Project**. Give it a name like `My SaaS Auth` and click **Create**, then switch to that project.
3. In the left sidebar open **APIs & Services → OAuth consent screen**. Pick **External**, then **Create**.
4. Fill in the basic details (app name, support email) and add your email under **Developer contact information**. You can leave scopes and test users empty for now; click **Save and Continue** until the consent screen is saved.
5. Go to **APIs & Services → Credentials** and click **Create credentials → OAuth client ID**.
6. Choose **Web application**. Under **Authorized JavaScript origins** add:
   - `http://localhost:3000`
   - Your production origin (for example `https://my-saas.com`) once you have it.
7. Under **Authorized redirect URIs** add:
   - `http://localhost:3000/auth/callback`
   - `https://my-saas.com/auth/callback` (or your future production domain).
8. Click **Create**. Google will show a **Client ID** and **Client secret**. Keep this modal open or copy the values to a safe place; we will paste them into Supabase next.

## 5. How do I plug the Google credentials into Supabase?
1. Back in Supabase, open **Authentication → Providers**.
2. Find **Google**, click the toggle to enable it, and paste the **Client ID** and **Client secret** from the Google Cloud modal.
3. Supabase asks for redirect URLs as well—add the same two URLs you used above (`http://localhost:3000/auth/callback` and your production URL).
4. Click **Save**. Google sign-in is now enabled.

## 6. How should I configure Stripe (products, webhook, billing portal)?
1. Sign in at https://dashboard.stripe.com/test (stay in **Test mode** while you experiment).
2. Create the products and prices:
   - Go to **Products → + Add product**. Name it `Pro`, set **Pricing model** to **Standard pricing**, choose **Recurring** and set the **Billing period** to **Monthly** with a price (for example USD 19.00). Click **Save price**.
   - On the same product page click **Add another price**, choose **Recurring → Yearly**, and set the annual amount (for example USD 190.00). Save.
   - Repeat the same steps to create a `Legendary` product with monthly and yearly prices (e.g., USD 49.00 and USD 490.00).
   - After saving, copy every **Price ID**; we will paste them into the environment variables.
3. Set up the webhook:
   - Open **Developers → Webhooks → + Add endpoint**.
   - For local testing use `http://localhost:3000/api/webhooks/stripe`. For production use `https://your-domain.com/api/webhooks/stripe`.
   - Under **Events to send**, select `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Click **Add endpoint**.
   - Copy the **Signing secret** that appears after saving.
4. Configure the Billing Portal (needed for “Update Your Subscription”):
   - Go to **Billing → Customer portal**. In test mode, click **Start setup** (or **Edit** if you already saved it) and make sure all four prices are allowed under **Products**.
   - Decide which actions customers can take (upgrade, downgrade, cancel) and click **Save**. Until you save at least once, Stripe refuses to create portal sessions in test mode.

## 7. Where do the environment variables go?
1. In the project root copy `.env.local.example` to `.env.local`.
2. Paste the values you collected (server‑only keys have no `NEXT_PUBLIC_`):
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key (server‑only)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_LEGENDARY_MONTHLY`, `STRIPE_PRICE_LEGENDARY_YEARLY`
   - `TOGETHER_API_KEY` = Together AI key (server‑only)
   - `REPLICATE_API_TOKEN` = Replicate key (server‑only)
   - `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` while developing, or your production domain when deployed
3. When you deploy to Vercel, repeat these values in **Project Settings → Environment Variables** so the hosted app has the same configuration.

## 8. How do I run the project locally?
1. Install dependencies the first time: `npm install`.
2. Start the dev server: `npm run dev`.
3. Open http://localhost:3000. You should see the marketing page with pricing cards. The terminal will show any errors if env variables are missing.

## 9. How do I confirm Supabase auth works end-to-end?
1. On http://localhost:3000 click **Sign in** in the navbar.
2. Complete the Google OAuth flow you set up earlier. When Google sends you back, you should land on the site with your session active.
3. Visit http://localhost:3000/dashboard. You should see your email and the plan line should read “Free”. This proves Supabase cookies are flowing to the server.

## 10. How do I test Stripe checkout?
1. From the pricing page click a plan, e.g., **Choose PRO**.
2. You will be redirected to Stripe Checkout. Use the standard test card (`4242 4242 4242 4242` with any future date, any CVC, any ZIP). Submit the form.
3. Stripe will bounce you back to `/dashboard?checkout=success`. Wait a few seconds for the webhook to run.
4. Refresh the dashboard. The plan line should now display something like “Pro · Monthly ACTIVE”. Supabase `subscriptions` should contain a new row and `profiles` should show the same plan if your schema includes those columns.

## 11. How do I open the billing portal and let users manage plans?
1. On the dashboard click **Update Your Subscription**.
2. The app posts to `/api/portal`. If Stripe is correctly configured, you will be redirected to the Customer Portal you saved earlier.
3. Inside the portal you (and your customers) can upgrade, downgrade, or cancel. Stripe handles prorations automatically when you switch plans inside the portal.

## 12. How do I configure the Together AI subject line generator?
1. Create or log into your Together AI account at https://www.together.ai/ and open the API Keys page. Click **Create API key** and copy the value (it usually starts with `together_`).
2. In the project root, add the key to `.env.local` as `TOGETHER_API_KEY=your_key_here`. Remember to add the same variable in Vercel when you deploy so production can call the API.
3. Restart the dev server (`npm run dev`) if it was running so Next.js picks up the new environment variable.
4. Open the dashboard and click the **AI Subject Line Studio** card. This links to `/dashboard/subject-lines`, which requires the user to be signed in.
5. On that page describe your audience or offer and press **Generate Subject Lines**. The studio streams 12 lines directly from Together AI and enforces cooldowns (Free: 3 hours, Pro: 3 minutes, Legendary: 30 seconds).
6. If the request fails, check the terminal output for Together AI errors (invalid key, usage limits, or networking issues).

## 13. How do I deploy this to Vercel?
1. Push the repo to GitHub (or connect directly from Vercel if you already forked it).
2. In Vercel click **New Project**, select the repo, and follow the prompts.
3. Before deploying, add every environment variable from `.env.local` into **Settings → Environment Variables**. Do this for both **Preview** and **Production** environments so webhooks work everywhere.
4. Deploy. After the first build finishes, visit the live site, sign in, run a checkout with Stripe test cards, and confirm the plan updates. Remember to create a separate webhook endpoint in Stripe for your production URL.

## 14. How do I change plans or pricing later?
1. Update or create new prices in Stripe first.
2. Paste the new price IDs into `.env.local` (and Vercel).
3. Redeploy. The checkout API uses those environment variables, so no code change is needed.
4. If you want in-app upgrades/downgrades with prorations (instead of forcing users through the portal), replace the checkout endpoint with a call to `stripe.subscriptions.update` and pass `proration_behavior: 'create_prorations'`. Stripe’s portal already handles this automatically if you keep plan switching enabled, which is the easiest option.

## 15. Where do I look when something breaks?
- **Next.js terminal**: shows server-side errors, missing env vars, or Supabase warnings.
- **Stripe Dashboard → Developers → Logs**: every webhook delivery and Checkout session appears here with payloads and error messages.
- **Supabase Logs → Database**: view SQL errors or row-level security denials.
- If webhooks fail with column errors, double-check that `supabase/schema.sql` was applied or rerun it.

## 16. What is the quickest smoke test after configuration?
1. Run `npm run dev`.
2. Sign in with Google.
3. Purchase a plan with the test card.
4. Reload the dashboard and confirm the new plan label (e.g., “Legendary · Annual ACTIVE”).
5. Click **Update Your Subscription** and ensure the portal loads.
6. Optionally use the portal to switch plans, then refresh the dashboard to confirm the interval changes.

If all of those steps work, your local environment matches production and you are ready to customize the product.

---

## What’s new in BoilerKitt

- Homepage refresh
  - Centered navbar with Docs; brand fixed to “BoilerKitt”; solid dark top bar.
  - Founders badge (unique avatars), larger logo, and a “Let’s Go” CTA for quick sign‑in.
  - Sliding logo carousel that reads images from `public/logos`.
  - Benefits section (“A Boilerplate / That Drives Results”) and a “BoilerKitt at a Glance” grid.
  - Testimonials marquee with looping, pause/play, arrow controls, equal‑height cards, and gold star ratings.
  - Second testimonials section + end‑page CRO block with wireframe visual and CTA.

- Pricing UX
  - If a signed‑out user clicks a plan on `/pricing`, the page shows “You must be signed in to upgrade your account.”
  - Example pricing now includes an urgency banner and a live 48‑hour countdown (persists in localStorage).
  - LEGENDARY plan is highlighted with a “Recommended” badge; buttons have a consistent style across plans.

- AI demos
  - Subject Line Studio (Together AI) with server‑enforced cooldowns (Free 3h · Pro 3m · Legendary 30s).
  - Simple Image Gen (Replicate `qwen/qwen-image`) — Pro and Legendary only.
  - Image Editor (Replicate `qwen/qwen-image-edit` and `google/nano-banana`) — Legendary only, with model dropdown.

- Secrets
  - All AI and Stripe keys are server‑only env vars (`process.env` in API routes). `.env.local` is git‑ignored.
  - A `LICENSE.md` (MIT) is included; BoilerKitt is free and open source.

---

## Newsletter signups (subscribers)

The footer includes a newsletter form that posts to `/api/newsletter/subscribe` and stores emails in `public.subscribers`.

- Anti‑bot measures:
  - Honeypot field
  - Time gate (≥ 2s to submit)
  - One‑line math challenge
- Server insert uses the Supabase admin client (service role) if configured, so RLS won’t block anonymous signups.

If your project predates the table, run the “Subscribers” SQL from `supabase/schema.sql` (or see code comments there) to create the table, grants, and policy.

---

## Example Pricing (Demo)

The pricing section demonstrates Stripe Checkout, intervals, and plan gates. BoilerKitt itself is free and open source; swap the price IDs to match your own product when you use this template.
It now includes an urgency banner with a live countdown. The countdown persists locally so it doesn’t reset on refresh.

---

## Demos & plan gating

- Subject Line Studio (Together AI): Free 3h • Pro 3m • Legendary 30s cooldown, enforced server‑side
- Simple Image Gen (Replicate): Pro & Legendary
- Image Editor (Replicate): Legendary only; model selector (`qwen/qwen-image-edit`, `google/nano-banana`)

---

## Landing page structure you can adapt

Above the fold: 4–6 word headline • 3 benefit bullets • 1 CTA • screenshot • trust

Body: Benefits trio • “BoilerKitt at a Glance” grid • testimonials carousel • Example Pricing (Demo) • FAQs • final CRO section + CTA

---

## Docs page

- The docs page `/docs` renders two sources:
  - `WHAT-THIS-BOILERPLATE-CAN-DO.md` (Overview)
  - `GUIDE.md` (this guide)
- It also clones the Frequently Asked Questions from the homepage and includes a floating quick‑nav widget (Overview / Guide / FAQs) for smooth scrolling.

---

## License

BoilerKitt ships with an MIT license in `LICENSE.md`. You can use it commercially, modify it, and redistribute. Please keep the license file with your distributions.

---

## Free and Open Source

BoilerKitt is totally free and open source — and it will remain that way. You can use it for personal or commercial projects, modify it, and ship products on top of it. If you find it useful, consider sharing it or contributing improvements.
