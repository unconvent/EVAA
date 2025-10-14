"use client";

import { useCallback, useState } from "react";

type Props = { plan?: string; title?: string; subtitle?: string };

export function SimpleImageGen({ plan, title, subtitle }: Props) {
  const planLower = (plan || "free").toLowerCase();
  const allowed = planLower === "pro" || planLower === "legendary";
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    if (!allowed) {
      setError("Please upgrade your plan to use this feature.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/ai/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Image generation failed.");
        return;
      }
      const url = Array.isArray(json.images) && json.images[0];
      if (!url) {
        setError("No image URL returned.");
        return;
      }
      setImageUrl(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/30 p-6 text-slate-100 shadow-[0_40px_90px_rgba(6,8,18,0.45)]">
      <h1 className="text-2xl font-semibold text-white">{title || "Simple Image Gen"}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{subtitle || "Generate an image using the Replicate API."}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">
        Available only to PRO and LEGENDARY subscribers
      </p>
      {!allowed ? (
        <p className="mt-3 text-sm text-yellow-300">Please upgrade your plan to use this feature.</p>
      ) : null}

      <div className="mt-6 space-y-3">
        <label htmlFor="img-prompt" className="text-sm text-slate-200">Prompt</label>
        <textarea
          id="img-prompt"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          onClick={handleGenerate}
          disabled={loading || !allowed}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-base ${
            allowed ? "cta-primary" : "cursor-not-allowed bg-white/10 text-white/50"
          }`}
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </div>

      {imageUrl ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Result</h2>
          {/* Medium-large thumbnail */}
          <img
            src={imageUrl}
            alt="Generated"
            className="h-auto w-full max-w-2xl rounded-2xl border border-white/10"
          />
        </div>
      ) : null}
    </div>
  );
}
