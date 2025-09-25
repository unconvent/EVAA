"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Zap, Rocket, KeyRound, Lock, Webhook, LayoutDashboard, Timer, Image as ImageIcon, Wand2 } from "lucide-react";
import { Pricing } from "@/components/pricing";
import { LogoCarousel } from "@/components/logo-carousel";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [avatars, setAvatars] = useState<string[] | null>(null);
  const [compactGap, setCompactGap] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [hp, setHp] = useState("");
  const [formStart, setFormStart] = useState<number>(() => Date.now());
  const [challengeA, setChallengeA] = useState<number>(0);
  const [challengeB, setChallengeB] = useState<number>(0);
  const [challengeAns, setChallengeAns] = useState<string>("");

  const handleGoToApp = useCallback(async () => {
    if (!supabase) {
      window.location.href = "/dashboard";
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      window.location.href = "/dashboard";
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, [supabase]);

  // Load avatars from /public/avatars and randomly pick 3–4
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/avatars");
        const json = await res.json().catch(() => ({ files: [] }));
        const files: string[] = Array.isArray(json.files) ? json.files : [];
        // De-dupe and build the pool
        const poolRaw = files.length ? files : [
          "/imgs_lightning/1.png",
          "/imgs_lightning/2.png",
          "/imgs_lightning/3.png",
        ];
        const pool = Array.from(new Set(poolRaw));
        // Shuffle (Fisher-Yates)
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const desired = Math.min(pool.length, Math.random() < 0.5 ? 3 : 4);
        const chosen = pool.slice(0, desired);
        if (active) setAvatars(chosen);
      } catch {
        if (active) setAvatars(["/imgs_lightning/1.png", "/imgs_lightning/2.png", "/imgs_lightning/3.png"]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Init simple challenge and start time
  useEffect(() => {
    setFormStart(Date.now());
    const a = 2 + Math.floor(Math.random() * 5); // 2..6
    const b = 3 + Math.floor(Math.random() * 6); // 3..8
    setChallengeA(a);
    setChallengeB(b);
  }, []);

  // Shrink the gap between the carousel and the benefits headline on scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setCompactGap(y > 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const featureBlocks = [
    {
      icon: Zap,
      title: "Supabase Auth",
      description: "Production-ready auth with row-level security and instant profile sync.",
    },
    {
      icon: Rocket,
      title: "Stripe Billing",
      description: "Subscription-ready Stripe integration with Checkout, Portal, and webhooks.",
    },
    {
      icon: Sparkles,
      title: "App Router",
      description: "Modern Next.js architecture, React Server Components, and SSR baked in.",
    },
    { icon: KeyRound, title: "Google Sign‑in", description: "Let users sign in with Google in one click." },
    { icon: Lock, title: "Plan‑Gated Features", description: "Limit features to Free, Pro, or Legendary with server checks." },
    { icon: Webhook, title: "Stripe Webhooks Sync", description: "Plans and status stay in sync after upgrades or cancellations." },
    { icon: LayoutDashboard, title: "Dashboard & Portal", description: "Show current plan and open Stripe’s portal to manage billing." },
    { icon: Sparkles, title: "AI Subject Lines", description: "Generate 12 subject lines with Together AI and live streaming." },
    { icon: Timer, title: "Smart Cooldowns", description: "Wait times depend on plan; enforced on the server and shown in the UI." },
    { icon: ImageIcon, title: "Simple Image Gen", description: "Create high‑quality images from a prompt using Replicate." },
    { icon: Wand2, title: "Image Editor (Legendary)", description: "Upload an image and transform it with a prompt (Legendary only)." },
  ];

  const faqs = [
    {
      q: "Is BoilerKitt really free and open source?",
      a: "Yes. It’s free and open source forever. Use it for personal or commercial projects, modify it, and ship your product without vendor lock‑in.",
    },
    {
      q: "Is this a hosted service or a codebase?",
      a: "It’s a starter codebase. You run it locally, deploy it yourself, and bring your own Supabase/Stripe keys. The pricing page and plan logic are example code.",
    },
    {
      q: "What’s included out of the box?",
      a: "Google sign‑in, Supabase profiles + RLS, Stripe subscriptions with Checkout + Portal, plan gating, example AI features (Together AI + Replicate), and a polished Next.js UI.",
    },
    {
      q: "Can I remove or change the AI features?",
      a: "Absolutely. They’re examples to show server‑side gating and streaming. Keep them, swap the models, or delete them entirely.",
    },
    {
      q: "What happens after I click Let’s Go?",
      a: "You sign in and land on the dashboard where you can try the sample features and explore the plan logic. In your fork you can replace this flow with your own onboarding.",
    },
  ];

  return (
    <div className="text-slate-100">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,129,255,0.2)_0%,_rgba(12,14,29,0)_55%)]" />
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="pill-tag mx-auto inline-flex items-center gap-2 px-4 py-1 text-xs uppercase tracking-wider">
            <Sparkles size={14} /> <span className="font-semibold text-[var(--accent)]">FREE</span> Boilerplate SaaS ready for shipping
          </div>
          <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
            <div className="flex -space-x-2">
              {(avatars ?? ["/imgs_lightning/1.png", "/imgs_lightning/2.png", "/imgs_lightning/3.png"]).map((src, i) => (
                <span key={`${src}-${i}`} className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white">
                  <Image src={src} alt={`avatar ${i + 1}`} width={32} height={32} className="h-8 w-8 object-cover" />
                </span>
              ))}
            </div>
            <span>+500 builders use boilerkitt to ship quality fast</span>
          </div>
          <h1 className="mt-8 text-6xl font-semibold leading-tight tracking-tight sm:text-7xl">
            <span className="block">Ship you SaaS</span>
            <span className="block">in <span className="text-[var(--accent)]">days</span>, not months</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
            Authentication, billing, subscriptions, and a polished UI powered by Next.js, Supabase,
            and Stripe. Iterate on your product while the fundamentals are ready on day one.
          </p>
          {/* Let's Go CTA (acts like Sign in) */}
          <div className="mt-8 flex justify-center">
            <div className="group relative">
              <button
                onClick={handleGoToApp}
                type="button"
                className="relative inline-flex items-center justify-center rounded-[24px] border border-white/20 bg-[var(--accent-secondary)] px-12 py-4 text-2xl font-semibold text-white shadow-[0_24px_48px_rgba(255,77,0,0.28)] transition hover:brightness-110"
              >
                {/* inner highlight */}
                <span className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/10 shadow-inner [box-shadow:inset_0_10px_18px_rgba(255,255,255,0.2),inset_0_-6px_12px_rgba(0,0,0,0.12)]" />
                <span className="relative">Let&apos;s Go</span>
              </button>
              {/* Left squiggles */}
              <div className="pointer-events-none absolute left-[-84px] top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100 md:flex" style={{ color: 'var(--accent-secondary)' }}>
                {[0,1,2].map((i) => (
                  <svg
                    key={`l-${i}`}
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${i===0? '-rotate-12' : i===2? 'rotate-12' : ''}`}
                  >
                    <path d="M2 12c3-3 6 3 9 0s6 3 11 0" />
                  </svg>
                ))}
              </div>
              {/* Right squiggles */}
              <div className="pointer-events-none absolute right-[-84px] top-1/2 hidden -translate-y-1/2 flex-col items-start gap-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:flex" style={{ color: 'var(--accent-secondary)' }}>
                {[0,1,2].map((i) => (
                  <svg
                    key={`r-${i}`}
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${i===0? 'rotate-12' : i===2? '-rotate-12' : ''}`}
                  >
                    <path d="M2 12c3-3 6 3 9 0s6 3 11 0" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Sliding logo carousel */}
          <LogoCarousel />
          {/* Dynamic spacer between carousel and benefits title */}
          <div
            className={`mx-auto w-full transition-all duration-300 ${
              compactGap ? "h-8 sm:h-10" : "h-16 sm:h-20"
            }`}
          />
          {/* CTA moved below feature cards */}

          <div className="mt-16 text-center">
            <h2 className="text-6xl font-semibold leading-tight tracking-tight sm:text-7xl">
              <span className="block">A Boilerplate</span>
              <span className="block">That <span className="text-[var(--accent)]">Drives Results</span></span>
            </h2>
          </div>
          {/* Benefits: highlight outcomes, not features */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="relative overflow-hidden glass-card p-6 text-left ring-1 ring-[var(--accent)]/20 border border-white/10 bg-[#121a2d]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(6,8,18,0.55)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(120%_120%_at_80%_-10%,_var(--accent)/14,_transparent_60%)]">
              <h3 className="text-lg font-semibold text-white">Ship in Days</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Auth, billing, plan gates, and example AI features are pre‑wired so you can launch weeks faster.</p>
            </div>
            <div className="relative overflow-hidden glass-card p-6 text-left ring-1 ring-[var(--accent)]/20 border border-white/10 bg-[#121a2d]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(6,8,18,0.55)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(120%_120%_at_80%_-10%,_var(--accent)/14,_transparent_60%)]">
              <h3 className="text-lg font-semibold text-white">Lower Costs</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Free to start, sane defaults, and dev tooling that reduces trial‑and‑error and wasted spend.</p>
            </div>
            <div className="relative overflow-hidden glass-card p-6 text-left ring-1 ring-[var(--accent)]/20 border border-white/10 bg-[#121a2d]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(6,8,18,0.55)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(120%_120%_at_80%_-10%,_var(--accent)/14,_transparent_60%)]">
              <h3 className="text-lg font-semibold text-white">Production‑Ready</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Stripe + Supabase best practices, server‑enforced limits, and clean RLS make shipping safer.</p>
            </div>
          </div>

          {/* Glance section title */}
          <div className="mt-16 text-center">
            <h2 className="text-6xl font-semibold leading-tight tracking-tight sm:text-7xl">
              <span className="block">BoilerKitt</span>
              <span className="block">At a Glance</span>
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {featureBlocks.map((f) => (
              <div key={f.title} className="glass-card h-full p-6 text-left">
                <div className="inline-flex items-center justify-center rounded-full bg-white/10 p-3 text-[var(--accent)]">
                  <f.icon size={20} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-auto my-12 h-px w-full max-w-6xl bg-white/10" />

          {/* Testimonials */}
          <section className="mt-6">
            <h2 className="text-center text-6xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
              What Builders Say
            </h2>
            <div className="mt-8">
              <TestimonialsCarousel />
            </div>
          </section>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#pricing"
              className="cta-primary cta-compact inline-flex items-center gap-2 px-6 py-3 text-base"
            >
              View Pricing <ArrowRight size={16} />
            </Link>
            <button
              onClick={handleGoToApp}
              className="cta-secondary cta-compact inline-flex items-center gap-2 px-6 py-3 text-base"
              type="button"
            >
              Go to App
            </button>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <h2 className="text-center text-3xl font-semibold text-white">Example Pricing (Demo)</h2>
          <p className="mt-1 text-center text-xs italic text-[var(--muted)]">Sample plans to demonstrate Stripe and plan gating. This boilerplate is free and open‑source.</p>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--muted)]">
            Start on the perpetual Free tier, upgrade with Stripe Checkout when you’re ready.
          </p>
          <div className="mt-12">
            <Pricing />
          </div>
        </div>
      </section>

      {/* FAQs (after pricing) */}
      <section id="faq" className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-6xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">FAQs</h2>
          <div className="mx-auto mt-8 max-w-3xl divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10">
            {faqs.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="bg-black/30">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-white hover:bg-white/5"
                    aria-expanded={open}
                    aria-controls={`faq-${i}`}
                  >
                    <span className="text-sm font-medium">{item.q}</span>
                    <svg
                      className={`h-4 w-4 flex-none transition-transform ${open ? "rotate-180" : "rotate-0"}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {open ? (
                    <div id={`faq-${i}`} className="px-5 pb-5 text-sm text-[var(--muted)]">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* More Testimonials */}
      <section className="border-t border-white/10 bg-transparent">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-6xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
            More From Builders
          </h2>
          <div className="mt-8">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      {/* Big CRO CTA */}
      <section className="bg-black/10">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-6xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
            Launch Your SaaS This Week
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--muted)]">
            Skip the boilerplate. Ship features. Free & open source.
          </p>
          <div className="mx-auto mt-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 ring-1 ring-[var(--accent-secondary)]/15 shadow-[0_36px_90px_var(--accent-secondary)/25]">
            <img
              src="/wireframe1.png"
              alt="SaaS dashboard wireframe"
              className="h-full w-full object-cover"
              style={{ aspectRatio: '3 / 2' }}
            />
          </div>
          <p className="mt-2 text-center text-xs italic text-[var(--muted)]">(replace this with an actual wireframe or screenshot or animated demo of your SaaS!!!)</p>

          {/* Primary accent CTA (cloned from Let's Go) */}
          <div className="mt-10 flex justify-center">
            <div className="group relative">
              <button
                onClick={handleGoToApp}
                type="button"
                className="relative inline-flex items-center justify-center rounded-[24px] border border-white/20 bg-[var(--accent)] px-12 py-4 text-2xl font-semibold text-[#0c1325] shadow-[0_24px_48px_rgba(120,120,255,0.28)] transition hover:brightness-110"
              >
                <span className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/10 shadow-inner [box-shadow:inset_0_10px_18px_rgba(255,255,255,0.18),inset_0_-6px_12px_rgba(0,0,0,0.12)]" />
                <span className="relative">Start Building Now — It’s Free</span>
              </button>
              {/* Left squiggles */}
              <div className="pointer-events-none absolute left-[-84px] top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100 md:flex" style={{ color: 'var(--accent)' }}>
                {[0,1,2].map((i) => (
                  <svg
                    key={`l2-${i}`}
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${i===0? '-rotate-12' : i===2? 'rotate-12' : ''}`}
                  >
                    <path d="M2 12c3-3 6 3 9 0s6 3 11 0" />
                  </svg>
                ))}
              </div>
              {/* Right squiggles */}
              <div className="pointer-events-none absolute right-[-84px] top-1/2 hidden -translate-y-1/2 flex-col items-start gap-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:flex" style={{ color: 'var(--accent)' }}>
                {[0,1,2].map((i) => (
                  <svg
                    key={`r2-${i}`}
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${i===0? 'rotate-12' : i===2? '-rotate-12' : ''}`}
                  >
                    <path d="M2 12c3-3 6 3 9 0s6 3 11 0" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs italic text-[var(--muted)]">(replace this with a CRO‑focused CTA specific to your SaaS)</p>
          <div className="mx-auto my-12 h-px w-full max-w-6xl bg-white/10" />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#0c1325]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            {/* Newsletter */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold text-white">Stay in the loop</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Get occasional updates about BoilerKitt and new examples.</p>
              {subscribed ? (
                <p className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-emerald-300">Thanks! You’re on the list.</p>
              ) : (
                <>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const email = newsletterEmail.trim();
                    if (!email) return;
                    try {
                      const res = await fetch("/api/newsletter/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email,
                          hp,
                          elapsedMs: Date.now() - formStart,
                          a: challengeA,
                          b: challengeB,
                          answer: Number(challengeAns),
                        }),
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        alert(data?.error || "Subscription failed. Try again later.");
                        return;
                      }
                      setSubscribed(true);
                    } catch (err) {
                      alert("Network error. Please try again later.");
                    }
                  }}
                  className="mt-4 flex max-w-md gap-2"
                >
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  {/* honeypot (visually hidden, still tabbable for screen readers) */}
                  <input
                    type="text"
                    value={hp}
                    onChange={(e) => setHp(e.target.value)}
                    aria-label="Leave this field empty"
                    className="absolute left-[-10000px] top-auto h-0 w-0 opacity-0"
                    tabIndex={-1}
                  />
                  <button
                    type="submit"
                    className="rounded-2xl border border-white/10 bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0c1325] transition hover:brightness-110"
                  >
                    Sign up
                  </button>
                </form>
                {/* Simple math challenge */}
                <div className="mt-3 flex max-w-md items-center gap-3 text-xs text-[var(--muted)]">
                  <label htmlFor="challenge" className="whitespace-nowrap">{challengeA} + {challengeB} =</label>
                  <input
                    id="challenge"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={challengeAns}
                    onChange={(e) => setChallengeAns(e.target.value)}
                    className="w-16 rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-center text-white focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                </>
              )}
            </div>

            {/* Links */}
            <div className="grid grid-cols-3 gap-8 md:col-span-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Menu</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li><a href="#services" className="hover:text-white">Our Services</a></li>
                  <li><a href="/pricing" className="hover:text-white">Pricing (Demo)</a></li>
                  <li><a href="#faq" className="hover:text-white">FAQ</a></li>
                  <li><a href="#case-studies" className="hover:text-white">Case Studies</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Legal</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li><a href="#" className="hover:text-white">Terms</a></li>
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                  <li><a href="#" className="hover:text-white">License (MIT)</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Socials</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li><a href="#" className="hover:text-white">Twitter / X</a></li>
                  <li><a href="#" className="hover:text-white">GitHub</a></li>
                  <li><a href="#" className="hover:text-white">YouTube</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-[var(--muted)]">
            <span>© {new Date().getFullYear()} BoilerKitt. Free & Open Source.</span>
            <span>Made for builders.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
