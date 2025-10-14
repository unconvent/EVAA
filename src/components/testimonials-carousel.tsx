"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

const PLACEHOLDER_QUOTES = [
  {
    quote:
      "AI titles and hooks consistently beat mine. Click‑throughs jumped overnight.",
    name: "Jamie R.",
    role: "Substack Creator",
  },
  {
    quote:
      "Thumbnail ideas are instant bangers. More clicks, more subs, less guesswork.",
    name: "Omar T.",
    role: "YouTuber",
  },
  {
    quote:
      "Notes take minutes now. Posting daily 3×ed my list in 6 weeks.",
    name: "Lila P.",
    role: "Newsletter Operator",
  },
  {
    quote:
      "Subjects match my ICP perfectly. Open rates are finally predictable.",
    name: "Victor M.",
    role: "B2B Creator",
  },
  {
    quote:
      "The image generator nails the vibe. Shares spiked across my posts.",
    name: "Ava S.",
    role: "Writer",
  },
  {
    quote:
      "EVAA is my silent co‑writer and designer. Publishing is fun again.",
    name: "Chris D.",
    role: "Indie Publisher",
  },
];

export function TestimonialsCarousel() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0); // px, negative values move left
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const measureRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/avatars");
        const json = await res.json().catch(() => ({ files: [] }));
        const files: string[] = Array.isArray(json.files) ? json.files : [];
        const pool = Array.from(new Set(files));

        const six = Array(6)
          .fill(0)
          .map((_, i) => pool[i % Math.max(pool.length, 1)] || "/imgs_lightning/1.png");

        const mapped: Testimonial[] = PLACEHOLDER_QUOTES.map((q, i) => ({
          ...q,
          avatar: six[i] ?? six[0],
        }));

        if (active) setItems(mapped);
      } catch {
        if (active)
          setItems(
            PLACEHOLDER_QUOTES.map((q, i) => ({
              ...q,
              avatar: [
                "/imgs_lightning/1.png",
                "/imgs_lightning/2.png",
                "/imgs_lightning/3.png",
              ][i % 3],
            }))
          );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const marquee = [...items, ...items];

  const setMeasureRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      if (i < items.length) measureRefs.current[i] = el;
    },
    [items.length]
  );

  // Auto-scroll with requestAnimationFrame so we can pause and step
  useEffect(() => {
    let raf: number | null = null;
    let last = performance.now();
    const speed = 30; // px per second

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused && marquee.length) {
        setOffset((prev) => {
          const next = prev - speed * dt;
          const CARD = 452; // ~ card width (420) + gap (32)
          const half = Math.max(1, Math.ceil(marquee.length / 2)) * CARD;
          // wrap into [-half, 0)
          let wrapped = next % half;
          if (wrapped > 0) wrapped -= half;
          return wrapped;
        });
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [paused, marquee.length]);

  // Measure tallest card among the first set and pin that height for all
  useEffect(() => {
    if (!items.length) return;
    // Allow layout to settle
    const id = requestAnimationFrame(() => {
      const heights = measureRefs.current
        .slice(0, items.length)
        .map((el) => (el ? el.getBoundingClientRect().height : 0));
      const max = Math.max(0, ...heights);
      if (max) setCardHeight(Math.ceil(max));
    });
    return () => cancelAnimationFrame(id);
  }, [items]);

  const nudge = (dir: 1 | -1) => {
    const CARD = 452; // match wrap calc
    const amount = CARD * dir;
    setOffset((prev) => {
      const half = Math.max(1, Math.ceil(marquee.length / 2)) * CARD;
      const next = prev + amount;
      // wrap into [-half, 0)
      let wrapped = next % half;
      if (wrapped > 0) wrapped -= half;
      return wrapped;
    });
    setPaused(true);
  };

  return (
    <div className="group relative mx-auto w-full overflow-hidden">
      {/* Gradient edges (lower opacity + more blur) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0b0f1e]/40 to-transparent backdrop-blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0b0f1e]/40 to-transparent backdrop-blur-2xl" />

      {/* Track */}
      <div
        className="flex w-max items-stretch gap-8 opacity-80 transition-transform duration-300"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {marquee.map((t, idx) => (
          <article
            key={`${t.name}-${idx}`}
            className="relative h-full w-[420px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-[#0e1222]/80 ring-1 ring-white/5 shadow-[0_28px_70px_rgba(6,8,18,0.55)]"
            style={cardHeight ? { height: `${cardHeight}px` } : undefined}
          >
            <div ref={idx < items.length ? setMeasureRef(idx) : undefined} className="flex h-full flex-col p-7">
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={`${t.name} avatar`}
                  className="h-12 w-12 rounded-full border border-white/20 object-cover"
                />
                <div className="text-xs text-[var(--muted)]">{t.name} · {t.role}</div>
              </div>
              <div className="mt-3 text-amber-400" aria-label="5 out of 5 stars" role="img">
                {"★★★★★"}
              </div>
              <div className="flex flex-1 items-center">
                <p className="text-base leading-relaxed text-white">“{t.quote}”</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Controls */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <button
          onClick={() => nudge(-1)}
          aria-label="Previous testimonials"
          className="pointer-events-auto hidden h-10 w-10 rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition hover:text-white md:inline-flex items-center justify-center"
        >
          ‹
        </button>
        <button
          onClick={() => nudge(1)}
          aria-label="Next testimonials"
          className="pointer-events-auto hidden h-10 w-10 rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition hover:text-white md:inline-flex items-center justify-center"
        >
          ›
        </button>
      </div>
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => setPaused((p) => !p)}
          className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur-sm transition hover:text-white"
        >
          {paused ? "Play" : "Pause"}
        </button>
        <button
          onClick={() => { setOffset(0); setPaused(false); }}
          className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur-sm transition hover:text-white"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
