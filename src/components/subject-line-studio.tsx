"use client";

import { useCallback, useMemo, useState } from "react";

const PLAN_COOLDOWNS: Record<string, number> = {
  free: 1000 * 60 * 60 * 3,
  pro: 1000 * 60 * 3,
  legendary: 1000 * 30,
};

type SubjectLineStudioProps = {
  plan: string;
  interval?: string | null;
  lastRunAt: string | null;
  userId?: string; // used for localStorage fallback across sessions
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

export function SubjectLineStudio({ plan, interval, lastRunAt, userId }: SubjectLineStudioProps) {
  const planLower = plan?.toLowerCase() ?? "free";
  const normalizedPlan = planLower === "legendary" ? "Legendary" : planLower === "pro" ? "Pro" : planLower;
  const intervalLower = (interval ?? "").toLowerCase();
  const intervalLabel = intervalLower === "year" ? "Annual" : intervalLower === "month" ? "Monthly" : null;
  const cooldownMs = PLAN_COOLDOWNS[planLower] ?? PLAN_COOLDOWNS.free;

  const initialNextRun = useMemo(() => {
    // Prefer server-sourced timestamp
    if (lastRunAt) {
      const parsed = new Date(lastRunAt);
      if (!Number.isNaN(parsed.getTime())) return new Date(parsed.getTime() + cooldownMs);
    }

    // Fallback to localStorage if server value missing/unavailable
    if (typeof window !== "undefined" && userId) {
      try {
        const key = `subject_last_run_at:${userId}`;
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) {
            return new Date(parsed.getTime() + cooldownMs);
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return null;
  }, [lastRunAt, cooldownMs, userId]);

  const [audiencePrompt, setAudiencePrompt] = useState("");
  const [rawSubjectOutput, setRawSubjectOutput] = useState("");
  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [nextAvailable, setNextAvailable] = useState<Date | null>(initialNextRun);

  const cooldownLabel = useMemo(() => formatRemaining(cooldownMs), [cooldownMs]);
  const nextAvailableLabel = useMemo(() => formatDateTime(nextAvailable), [nextAvailable]);

  const handleGenerate = useCallback(async () => {
    if (!audiencePrompt.trim()) {
      setError("Please describe your audience, niche, or offer first.");
      return;
    }

    setError(null);
    setGenerating(true);
    setRawSubjectOutput("");
    setSubjectLines([]);

    try {
      const res = await fetch("/api/ai/subject-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience: audiencePrompt }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Subject line generation failed.");
        let message = text || "Subject line generation failed.";

        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) {
            message = parsed.error;
          }
          if (parsed?.retry_at) {
            const retry = new Date(parsed.retry_at);
            if (!Number.isNaN(retry.getTime())) {
              setNextAvailable(retry);
              if (typeof window !== "undefined" && userId) {
                try {
                  const key = `subject_last_run_at:${userId}`;
                  window.localStorage.setItem(key, new Date(retry.getTime() - cooldownMs).toISOString());
                } catch {
                  // ignore storage errors
                }
              }
            }
          }
        } catch {
          // no-op
        }

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
        setRawSubjectOutput((prev) => prev + chunk);
      }

      finalText += decoder.decode();

      const lines = finalText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      setSubjectLines(lines);

      if (!lines.length) {
        setError("Together AI did not return subject lines.");
      } else {
        const next = new Date(Date.now() + cooldownMs);
        setNextAvailable(next);
        if (typeof window !== "undefined" && userId) {
          try {
            const key = `subject_last_run_at:${userId}`;
            window.localStorage.setItem(key, new Date(Date.now()).toISOString());
          } catch {
            // ignore storage errors
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Subject line generation failed.";
      setError(message);
    } finally {
      setGenerating(false);
    }
  }, [audiencePrompt, cooldownMs, userId]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/30 px-6 py-8 text-slate-100 shadow-[0_40px_90px_rgba(6,8,18,0.45)]">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-semibold text-white">AI Subject Line Studio</h1>
        <p className="text-sm text-[var(--muted)]">
          Current plan: <span className="font-semibold text-white">{intervalLabel ? `${normalizedPlan} · ${intervalLabel}` : normalizedPlan}</span> · Cooldown: {cooldownLabel}
        </p>
        {nextAvailableLabel ? (
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
            Next available run: {nextAvailableLabel}
          </p>
        ) : null}
      </header>

      <section className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-200" htmlFor="audience">
          Describe the audience, pain point, or offer
        </label>
        <textarea
          id="audience"
          value={audiencePrompt}
          onChange={(event) => setAudiencePrompt(event.target.value)}
          placeholder="Example: Busy SaaS founders who need an AI assistant to draft investor updates"
          rows={5}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="cta-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-base"
        >
          {generating ? "Generating..." : "Generate Subject Lines"}
        </button>
      </section>

      {(rawSubjectOutput || subjectLines.length) ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-white">Output</h2>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-5">
            <ol className="list-decimal space-y-3 pl-5 text-sm text-white">
              {(subjectLines.length
                ? subjectLines
                : rawSubjectOutput.split(/\n+/).map((line) => line.trim()).filter(Boolean)
              ).map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </div>
  );
}
