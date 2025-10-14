"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type Plan = "free" | "pro" | "legendary";

type Props = {
  plan: Plan;
  interval?: string | null;
  lastRunAt?: string | null; // optional for future use
};

function formatDateTime(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ViralImagesStudio({ plan }: Props) {
  const planLower = (plan || "free").toLowerCase() as Plan;
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "3:2" | "1:1">("16:9");
  const [keywords, setKeywords] = useState("");
  const [lessVirality, setLessVirality] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [images, setImages] = useState<(string | null)[]>([null, null]);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [retryAt, setRetryAt] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cooldownLabel = useMemo(() => {
    return "Cooldown: Free 7d · Pro 48h · Legendary None";
  }, []);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setRetryAt(null);
    setImages([null, null]);
    setPromptPreview(null);

    if (!title.trim() || !style.trim()) {
      setError("Please provide a title and select a style.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      const res = await fetch("/api/ai/viral-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, style, aspectRatio, keywords, lessVirality }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let msg = "Generation failed.";
        try {
          const json = await res.json();
          if (json?.retry_at) {
            const d = new Date(json.retry_at);
            if (!Number.isNaN(d.getTime())) setRetryAt(d);
          }
          if (json?.error) msg = json.error;
        } catch {}
        setError(msg);
        setStreaming(false);
        return;
      }

      if (!res.body) {
        setError("No stream available.");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        // Process SSE lines
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const packet = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!packet) continue;
          const line = packet.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const json = JSON.parse(payload);
            if (json.status === "prompt") {
              setPromptPreview(json.prompt || null);
            } else if (json.status === "success" && typeof json.index === "number" && json.imageUrl) {
              setImages((prev) => {
                const next = [...prev];
                next[Math.max(0, Math.min(1, json.index))] = String(json.imageUrl);
                return next;
              });
            } else if (json.status === "error" && json.message) {
              setError(json.message);
            } else if (json.status === "complete") {
              // done
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [title, style, aspectRatio, keywords, lessVirality]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-slate-100 shadow-[0_40px_90px_rgba(6,8,18,0.45)]">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-semibold text-white">Viral Post Images & Thumbnails</h1>
        <p className="text-sm text-[var(--muted)]">{cooldownLabel}</p>
        {retryAt ? (
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Next available run: {formatDateTime(retryAt)}</p>
        ) : null}
      </header>

      <section className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-200" htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Example: Why 99% of creators quit before compounding starts"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />

        <label className="block text-sm font-medium text-slate-200" htmlFor="style">Style</label>
        <select
          id="style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="">Select a style…</option>
          <option value="Minimal bold‑text style; high‑contrast title on a clean solid/gradient background maximizing readability.">Minimal bold‑text style</option>
          <option value="Clean photorealistic background with expressive texture or subtle depth; only the title overlaid, no other graphic elements, no stickers, no emojis, no borders — minimal, high-contrast typography with ample negative space.">Clean photorealistic w/ minimal title</option>
          <option value="Split-screen comparison visual: negative state on the left and positive state on the right; examples include Before/After, Other Brands vs Us, and Without X vs With X. Use a clear divider, strong contrast, consistent framing across both sides, minimal ornaments, and bold labels integrated with the title to highlight the transformation.">Split-screen comparison</option>
          <option value="Generalistic style covering diverse topics with balanced, accessible presentation.">Generalistic</option>
          <option value="Abstract style with minimalistic elements and clean design.">Abstract minimal</option>
          <option value="Design/Illustration style emphasizing polished visuals, thoughtful typography, and strong composition.">Design/Illustration polished</option>
          <option value="Realistic and engaging style centered on authentic storytelling, relatable scenarios, and dynamic pacing.">Realistic storytelling</option>
          <option value="High-energy, colorful style with shocked expressions and bold text.">High‑energy colorful</option>
          <option value="Business-focused, minimalist style with strong personal branding.">Business minimalist</option>
          <option value="Tech-focused, clean style with product shots and minimal text.">Tech clean</option>
          <option value="Gaming and meme culture with expressive reactions style.">Gaming/meme reactions</option>
          <option value="Aesthetic, vintage-inspired style with film photography vibes.">Aesthetic vintage/film</option>
          <option value="Challenge-based style with dynamic action shots.">Challenge action</option>
          <option value="Educational style with scientific visuals and clear explanations.">Educational scientific</option>
          <option value="Sports tricks style with explosive action and celebration moments.">Sports tricks</option>
          <option value="Animated educational style with distinctive vector art.">Animated educational (vector)</option>
          <option value="Adventure and travel style with inspiring landscapes.">Adventure & travel</option>
          <option value="Minimal vector illustration style with topic‑specific icons, solid fills, no textures/3D, and a centered high‑contrast title ribbon.">Minimal vector icons + ribbon</option>
          <option value="Minimal niche illustration style with flat shapes, brand‑color background, zero clutter, and a centered title banner.">Minimal niche illustration</option>
          <option value="Fine-art black-and-white, medium-format film photography style with a widescreen composition, soft natural light, gentle contrast, subtle grain, shallow depth of field, and clean negative space.">Fine‑art B&W film</option>
        </select>

        <label className="block text-sm font-medium text-slate-200">Aspect Ratio</label>
        <div className="flex flex-wrap gap-2 text-sm">
          {(["16:9", "4:3", "3:2", "1:1"] as const).map((ar) => (
            <button
              key={ar}
              type="button"
              onClick={() => setAspectRatio(ar)}
              className={`rounded-2xl border px-3 py-1.5 ${aspectRatio === ar ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-black/30"}`}
            >
              {ar}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-slate-200" htmlFor="keywords">Keywords (optional)</label>
        <input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., founder, newsletter, momentum, habit, long game"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />

        <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={lessVirality} onChange={(e) => setLessVirality(e.target.checked)} />
          Less virality tone (softer wording)
        </label>

        {/* extra spacing row between the checkbox and the generate button */}
        <div className="h-4" />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          onClick={handleGenerate}
          disabled={streaming}
          className="cta-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-base"
        >
          {streaming ? "Generating…" : "Generate 2 Images"}
        </button>
      </section>

      {promptPreview ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-white">Prompt Preview</h2>
          <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-[var(--muted)]">
            {promptPreview}
          </div>
        </section>
      ) : null}

      {(images[0] || images[1]) ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-white">Results</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {images.map((src, i) => (
              <div key={`img-${i}`} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                {src ? (
                  <button
                    type="button"
                    onClick={() => setZoomSrc(src)}
                    className="group block w-full cursor-zoom-in"
                    title="Click to zoom"
                  >
                    <img src={src} alt={`Generated ${i + 1}`} className="w-full rounded-xl border border-white/10 transition group-hover:brightness-110" />
                  </button>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 text-xs text-[var(--muted)]">
                    {streaming ? `Generating ${i + 1}/2…` : "No image yet"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Zoom modal */}
      {zoomSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomSrc(null)}
        >
          <div className="relative max-h-[90vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -right-2 -top-10 flex gap-2">
              <a
                href={zoomSrc}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm hover:bg-black/80"
                title="Download full resolution"
              >
                Download PNG
              </a>
              <button
                onClick={() => setZoomSrc(null)}
                className="inline-flex items-center rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm hover:bg-black/80"
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <img src={zoomSrc} alt="Zoomed" className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
