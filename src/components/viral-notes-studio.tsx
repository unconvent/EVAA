"use client";

import { useCallback, useMemo, useState } from "react";

// Free: 1 run/day (24h); Pro/Legendary: unlimited
const PLAN_COOLDOWNS: Record<string, number> = {
  free: 1000 * 60 * 60 * 24,
  pro: 0,
  legendary: 0,
};

type ViralNotesStudioProps = {
  plan: string;
  interval?: string | null;
  lastRunAt: string | null;
  userId?: string;
};

function formatDateTime(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const suffix = minutes ? ` ${minutes}m` : "";
    return `${hours}h${suffix}`;
  }
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const suffix = seconds ? ` ${seconds}s` : "";
    return `${minutes}m${suffix}`;
  }
  return `${totalSeconds}s`;
}

export function ViralNotesStudio({ plan, interval, lastRunAt, userId }: ViralNotesStudioProps) {
  const planLower = plan?.toLowerCase() ?? "free";
  const normalizedPlan = planLower === "legendary" ? "Legendary" : planLower === "pro" ? "Pro" : planLower;
  const intervalLower = (interval ?? "").toLowerCase();
  const intervalLabel = intervalLower === "year" ? "Annual" : intervalLower === "month" ? "Monthly" : null;
  const cooldownMs = PLAN_COOLDOWNS[planLower] ?? PLAN_COOLDOWNS.free;

  const initialNextRun = useMemo(() => {
    if (lastRunAt) {
      const parsed = new Date(lastRunAt);
      if (!Number.isNaN(parsed.getTime())) return new Date(parsed.getTime() + cooldownMs);
    }
    if (typeof window !== "undefined" && userId) {
      try {
        const key = `notes_last_run_at:${userId}`;
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) {
            return new Date(parsed.getTime() + cooldownMs);
          }
        }
      } catch {}
    }
    return null;
  }, [lastRunAt, cooldownMs, userId]);

  const [topic, setTopic] = useState("");
  const [rawOutput, setRawOutput] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [nextAvailable, setNextAvailable] = useState<Date | null>(initialNextRun);

  const cooldownLabel = useMemo(() => (cooldownMs > 0 ? formatRemaining(cooldownMs) : "None"), [cooldownMs]);
  const nextAvailableLabel = useMemo(() => (cooldownMs > 0 ? formatDateTime(nextAvailable) : null), [nextAvailable, cooldownMs]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError("Please describe your topic, audience, or goal first.");
      return;
    }
    setError(null);
    setGenerating(true);
    setRawOutput("");
    setNotes([]);
    try {
      const res = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Notes generation failed.");
        let message = text || "Notes generation failed.";
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) message = parsed.error;
          if (cooldownMs > 0 && parsed?.retry_at) {
            const retry = new Date(parsed.retry_at);
            if (!Number.isNaN(retry.getTime())) {
              setNextAvailable(retry);
              if (typeof window !== "undefined" && userId) {
                try {
                  const key = `notes_last_run_at:${userId}`;
                  window.localStorage.setItem(key, new Date(retry.getTime() - cooldownMs).toISOString());
                } catch {}
              }
            }
          }
        } catch {}
        setError(message);
        return;
      }

      if (!res.body) {
        setError("No data received from Together AI.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let finalText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        finalText += chunk;
        setRawOutput((prev) => prev + chunk);
      }
      finalText += decoder.decode();
      const sep = /###---###/i;
      const items = (sep.test(finalText) ? finalText.split(sep) : [finalText])
        .map((n) => n.trim())
        .filter(Boolean);
      setNotes(items);
      if (!items.length) {
        setError("Together AI did not return notes.");
      } else {
        if (cooldownMs > 0) {
          const next = new Date(Date.now() + cooldownMs);
          setNextAvailable(next);
          if (typeof window !== "undefined" && userId) {
            try {
              const key = `notes_last_run_at:${userId}`;
              window.localStorage.setItem(key, new Date(Date.now()).toISOString());
            } catch {}
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Notes generation failed.";
      setError(message);
    } finally {
      setGenerating(false);
    }
  }, [topic, cooldownMs, userId]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-slate-100 shadow-[0_40px_90px_rgba(6,8,18,0.45)]">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-semibold text-white">Viral Notes Studio</h1>
        <p className="text-sm text-[var(--muted)]">
          Current plan: <span className="font-semibold text-white">{intervalLabel ? `${normalizedPlan} · ${intervalLabel}` : normalizedPlan}</span> · Cooldown: {cooldownLabel}
        </p>
        {nextAvailableLabel ? (
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Next available run: {nextAvailableLabel}</p>
        ) : null}
      </header>

      <section className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-200" htmlFor="topic">
          Describe your topic, audience, or goal
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Example: A contrarian take on AI productivity myths for indie writers"
          rows={5}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-base bg-[var(--accent-secondary)] text-white shadow-[0_14px_32px_rgba(255,77,0,0.28)] transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? "Generating..." : "Generate Notes"}
        </button>
      </section>

      {(rawOutput || notes.length) ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-white">Output</h2>
          <div className="mt-3 space-y-4">
            {(notes.length
              ? notes
              : (() => {
                  const sep = /###---###/i;
                  const text = rawOutput || "";
                  return (sep.test(text) ? text.split(sep) : [text])
                    .map((n) => n.trim())
                    .filter(Boolean);
                })()
            ).map((note, i) => (
              <article key={`note-${i}`} className="relative rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_8px_24px_rgba(6,8,18,0.35)]">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(note);
                      setCopiedIndex(i);
                      setTimeout(() => setCopiedIndex((v) => (v === i ? null : v)), 1500);
                    } catch {}
                  }}
                  className="absolute right-3 top-3 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/80 transition hover:bg-white/20"
                >
                  {copiedIndex === i ? "Copied!" : "Copy"}
                </button>
                <div className="whitespace-pre-wrap text-sm text-white">{note}</div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
