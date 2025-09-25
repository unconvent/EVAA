"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type Props = {
  plan?: string;
};

export function ImageEditor({ plan }: Props) {
  const planLower = (plan || "free").toLowerCase();
  const allowed = planLower === "legendary";
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>("qwen/qwen-image-edit");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const selectedFile = useMemo(() => fileInput.current?.files?.[0] ?? null, [fileInput.current?.files]);

  const handleEdit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      if (!allowed) {
        setError("Image editor is available only to LEGENDARY subscribers.");
        return;
      }
      const file = fileInput.current?.files?.[0];
      if (!file) {
        setError("Please choose an image to upload.");
        return;
      }
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("image", file);
      form.append("model", model);
      const res = await fetch("/api/ai/image-edit", {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Image edit failed.");
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
  }, [prompt, allowed]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/30 p-6 text-slate-100 shadow-[0_40px_90px_rgba(6,8,18,0.45)]">
      <h1 className="text-2xl font-semibold text-white">Image Editor</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Edit your image using the Replicate API.</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">Available only to LEGENDARY subscribers</p>
      {!allowed ? (
        <p className="mt-3 text-sm text-yellow-300">Please upgrade your plan to use this feature.</p>
      ) : null}

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="model" className="mb-2 block text-sm text-slate-200">Model</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="qwen/qwen-image-edit">qwen/qwen-image-edit</option>
            <option value="google/nano-banana">google/nano-banana</option>
          </select>
        </div>
        <div>
          <label htmlFor="img-file" className="mb-2 block text-sm text-slate-200">Upload image</label>
          <input
            id="img-file"
            type="file"
            accept="image/*"
            ref={fileInput}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="img-prompt-edit" className="mb-2 block text-sm text-slate-200">Prompt</label>
          <textarea
            id="img-prompt-edit"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how to edit the image (e.g., change background, lighting, mood)"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          onClick={handleEdit}
          disabled={loading || !allowed}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-base ${
            allowed ? "cta-primary" : "cursor-not-allowed bg-white/10 text-white/50"
          }`}
        >
          {loading ? "Editing..." : "Edit Image"}
        </button>
      </div>

      {selectedFile ? (
        <div className="mt-6 text-sm text-[var(--muted)]">Selected: {selectedFile.name}</div>
      ) : null}

      {imageUrl ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Result</h2>
          <img src={imageUrl} alt="Edited" className="h-auto w-full max-w-2xl rounded-2xl border border-white/10" />
        </div>
      ) : null}
    </div>
  );
}
