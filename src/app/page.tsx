"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Rocket, KeyRound, Timer, Image as ImageIcon, Wand2, X } from "lucide-react";
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
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

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
      icon: Sparkles,
      title: "Viral Substack Notes",
      description: "AI‑crafted short‑form posts that hook readers and get shared.",
    },
    {
      icon: ImageIcon,
      title: "Viral Thumbnails & Images",
      description: "Scroll‑stopping Substack images and thumbnails for higher CTR.",
    },
    {
      icon: Wand2,
      title: "High‑Open Titles & Subjects",
      description: "Irresistible titles and email subjects tuned to your ICP.",
    },
    {
      icon: KeyRound,
      title: "Brand Voice Memory",
      description: "Trains on your best content to stay on‑brand across channels.",
    },
    {
      icon: Timer,
      title: "Rapid A/B Testing",
      description: "Test multiple hooks/titles fast to find winners before publishing.",
    },
    {
      icon: Rocket,
      title: "One‑Click Publish",
      description: "Streamline your flow to post everywhere in minutes, not hours.",
    },
  ];

  const faqs = [
    {
      q: "What does EVAA actually generate?",
      a: "Viral short‑form content (Substack Notes), scroll‑stopping thumbnails/post images, and high‑open titles/email subjects tailored to your ICP.",
    },
    {
      q: "Do I own the content EVAA generates?",
      a: "Yes. You own the outputs you generate with EVAA and can publish them on Substack, email, and social.",
    },
    {
      q: "How does EVAA learn my brand voice?",
      a: "Upload or link your best posts. EVAA builds a lightweight voice memory so drafts stay on‑brand across titles, notes, and images.",
    },
    {
      q: "What are the Free plan limits?",
      a: "Notes: 1/day (includes 3 notes). Viral Images: 1/week (includes 3 images). Upgrade to increase limits and speed up iteration.",
    },
    {
      q: "Will EVAA post to Substack for me?",
      a: "You keep full control. EVAA prepares optimized drafts, thumbnails, and titles; you publish with one click from your Substack.",
    },
    {
      q: "Is my data private?",
      a: "Yes. Your uploads are only used to improve your own results. Admin features require server‑side keys and respect RLS.",
    },
    {
      q: "How do upgrades work?",
      a: "Start on Free. When you’re ready, upgrade via Stripe Checkout. Plans unlock higher limits, faster cooldowns, and advanced features.",
    },
  ];

  return (
    <div className="text-slate-100">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,129,255,0.2)_0%,_rgba(12,14,29,0)_55%)]" />
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="pill-tag mx-auto inline-flex items-center gap-2 px-4 py-1 text-xs uppercase tracking-wider">
            <Sparkles size={14} /> <span className="font-semibold text-[var(--accent)]">EVAA</span> AI Growth Engine for Creators
          </div>
          <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
            <div className="flex -space-x-2">
              {(avatars ?? ["/imgs_lightning/1.png", "/imgs_lightning/2.png", "/imgs_lightning/3.png"]).map((src, i) => (
                <span key={`${src}-${i}`} className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white">
                  <Image src={src} alt={`avatar ${i + 1}`} width={32} height={32} className="h-8 w-8 object-cover" />
                </span>
              ))}
            </div>
            <span>creators use EVAA to grow & monetize their newsletters</span>
          </div>
          <h1 className="mt-8 text-6xl font-semibold leading-tight tracking-tight sm:text-7xl">
            <span className="block">Meet the AI Growth Engine</span>
            <span className="block"><span className="text-[var(--accent)]">That Drives Results</span></span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
            Join 65,000+ creators who&apos;ve 2X&apos;d their subscriber growth and tripled their revenue using our AI-powered growth engine.
          </p>
          {/* Primary CTA (acts like Sign in) */}
          <div className="mt-8 flex justify-center">
            <div className="group relative">
              <button
                onClick={handleGoToApp}
                type="button"
                className="relative inline-flex items-center justify-center rounded-[24px] border border-white/20 bg-[var(--accent-secondary)] px-12 py-4 text-2xl font-semibold text-white shadow-[0_24px_48px_rgba(255,77,0,0.28)] transition hover:brightness-110"
              >
                {/* inner highlight */}
                <span className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/10 shadow-inner [box-shadow:inset_0_10px_18px_rgba(255,255,255,0.2),inset_0_-6px_12px_rgba(0,0,0,0.12)]" />
                <span className="relative">🚀 Start Making Viral Content - FREE Trial</span>
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
            {/* Removed GitHub button */}
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

          <div id="services" className="mt-16 text-center">
            <h2 className="text-6xl font-semibold leading-tight tracking-tight sm:text-7xl">
              <span className="block">An AI-Powered Growth Engine</span>
              <span className="block">That <span className="text-[var(--accent)]">Drives Results</span></span>
            </h2>
          </div>
          {/* Benefits: highlight outcomes, not features */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="relative overflow-hidden glass-card p-6 text-left ring-1 ring-[var(--accent)]/20 border border-white/10 bg-[#121a2d]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(6,8,18,0.55)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(120%_120%_at_80%_-10%,_var(--accent)/14,_transparent_60%)]">
              <h3 className="text-lg font-semibold text-white">Viral Short‑Form Content</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Generate Substack Notes that hook readers and get shared. On‑brand drafts in seconds tailored to your voice and audience.</p>
            </div>
            <div className="relative overflow-hidden glass-card p-6 text-left ring-1 ring-[var(--accent)]/20 border border-white/10 bg-[#121a2d]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(6,8,18,0.55)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(120%_120%_at_80%_-10%,_var(--accent)/14,_transparent_60%)]">
              <h3 className="text-lg font-semibold text-white">Viral Thumbnails & Post Images</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Create scroll‑stopping Substack post images and thumbnails engineered for clicks and shares.</p>
            </div>
            <div className="relative overflow-hidden glass-card p-6 text-left ring-1 ring-[var(--accent)]/20 border border-white/10 bg-[#121a2d]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(6,8,18,0.55)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(120%_120%_at_80%_-10%,_var(--accent)/14,_transparent_60%)]">
              <h3 className="text-lg font-semibold text-white">High‑Open Titles & Subjects</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Write irresistible titles and email subjects tuned to your ICP to maximize opens and click‑through rates.</p>
            </div>
          </div>

          {/* Results section with charts */}
          <div className="mt-16 text-center">
            <h2 className="text-6xl font-semibold leading-tight tracking-tight sm:text-7xl">
              <span className="inline-flex items-center justify-center gap-3">
                <span aria-hidden>🔥</span>
                <span>
                  Results Speak <span className="text-[var(--accent)]">For Themselves</span>
                </span>
                <span aria-hidden>👇</span>
              </span>
            </h2>
          </div>
          <div className="mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              { src: "/c1.png", alt: "EVAA growth results chart 1" },
              { src: "/c2.png", alt: "EVAA growth results chart 2" },
            ].map((c) => (
              <button
                key={c.src}
                type="button"
                onClick={() => setZoomSrc(c.src)}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-black/30 ring-1 ring-[var(--accent)]/15 shadow-[0_24px_60px_rgba(6,8,18,0.55)] transition-all hover:shadow-[0_34px_80px_rgba(120,120,255,0.35)] hover:ring-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-zoom-in"
              >
                <div className="relative">
                  <img
                    src={c.src}
                    alt={c.alt}
                    className="h-full w-full origin-center transform object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-tr from-white/5 to-transparent" />
                </div>
              </button>
            ))}
          </div>

          {/* Glance section title */}
          <div className="mt-16 text-center">
            <h2 className="text-6xl font-semibold leading-tight tracking-tight sm:text-7xl">
              <span className="block"><span className="text-[var(--accent-secondary)]">EVAA</span></span>
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
              Real Results from <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Real Creators</span>
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
          </div>
        </div>
      </section>

      {/* Lightbox Modal for charts */}
      {zoomSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomSrc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => setZoomSrc(null)}
              className="absolute -right-2 -top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 backdrop-blur-sm hover:bg-black/80"
            >
              <X size={18} />
            </button>
            <img
              src={zoomSrc}
              alt="Zoomed chart"
              className="max-h-[53vh] max-w-[56vw] rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      ) : null}

      <section id="pricing" className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-24">
          <h2 className="text-center text-3xl font-semibold text-white">Pricing for Creators <span aria-hidden>❤️</span></h2>
          <p className="mt-1 text-center text-xs italic text-[var(--muted)]">Straightforward plans &amp; pricing give you UNLIMITED access to superchange your growth &amp; revenue.</p>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--muted)]">
            Start on FREE plan. Upgrade when you&apos;re commited about growth and turning your Substack into a $10k/month Business
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
      <section id="case-studies" className="border-t border-white/10 bg-transparent">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-6xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
            More From <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Real Creators</span>
          </h2>
          <div className="mt-8">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      {/* CTA only (no heading/image) */}
      <section className="bg-black/10">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="mt-0 flex justify-center">
            <div className="group relative">
              <button
                onClick={handleGoToApp}
                type="button"
                className="relative inline-flex items-center justify-center rounded-[24px] border border-white/20 bg-[var(--accent)] px-12 py-4 text-2xl font-semibold text-[#0c1325] shadow-[0_24px_48px_rgba(120,120,255,0.28)] transition hover:brightness-110"
              >
                <span className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/10 shadow-inner [box-shadow:inset_0_10px_18px_rgba(255,255,255,0.18),inset_0_-6px_12px_rgba(0,0,0,0.12)]" />
                <span className="relative">Start Free — Create Viral Posts Today</span>
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
                    } catch {
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
                  <li><a href="#services" className="hover:text-white">Results</a></li>
                  <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                  <li><a href="#faq" className="hover:text-white">FAQ</a></li>
                  <li><a href="#case-studies" className="hover:text-white">Case Studies</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Legal</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li><a href="/terms" className="hover:text-white">Terms</a></li>
                  <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Socials</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <li><a href="https://howwegrowtoday.substack.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Substack</a></li>
                  <li><a href="https://linkedin.com/in/ana--calin" target="_blank" rel="noopener noreferrer" className="hover:text-white">LinkedIn</a></li>
                  <li><a href="https://x.com/howwegrowtoday" target="_blank" rel="noopener noreferrer" className="hover:text-white">Twitter / X</a></li>
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
