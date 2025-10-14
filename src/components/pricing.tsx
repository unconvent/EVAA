"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const plans = [
  {
    name: "PRO",
    description: "Core features for growing creators.",
    monthlyEnv: "STRIPE_PRICE_PRO_MONTHLY",
    yearlyEnv: "STRIPE_PRICE_PRO_YEARLY",
    priceMonthly: "$9.90",
    priceYearly: "$97",
    features: [
      "Unlimited Notes (viral short-form text content)",
      "Viral Image Generation — 1/week",
    ],
  },
  {
    name: "LEGENDARY",
    description: "Everything unlimited for serious growth.",
    monthlyEnv: "STRIPE_PRICE_LEGENDARY_MONTHLY",
    yearlyEnv: "STRIPE_PRICE_LEGENDARY_YEARLY",
    priceMonthly: "$49.97",
    priceYearly: "$497",
    features: [
      "Unlimited Notes",
      "Unlimited Viral images",
      "Unlimited Everything",
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);

  // Initialize a 48h countdown, persisted in localStorage so it doesn't reset every refresh
  useEffect(() => {
    const KEY = "boilerkitt_launch_sale_ends_at";
    try {
      const fromStorage = localStorage.getItem(KEY);
      let endAt = fromStorage ? parseInt(fromStorage, 10) : NaN;
      if (!Number.isFinite(endAt) || endAt < Date.now()) {
        endAt = Date.now() + 48 * 60 * 60 * 1000; // 48h from now
        localStorage.setItem(KEY, String(endAt));
      }
      setDeadline(endAt);
      setRemaining(Math.max(0, endAt - Date.now()));
    } catch {
      const endAt = Date.now() + 48 * 60 * 60 * 1000;
      setDeadline(endAt);
      setRemaining(Math.max(0, endAt - Date.now()));
    }
  }, []);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, (deadline ?? 0) - Date.now());
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const countdownLabel = (() => {
    const ms = remaining;
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(totalSec % 60)
      .toString()
      .padStart(2, "0");
    return `${hrs}h ${mins}m ${secs}s`;
  })();

  const handleCheckout = async (plan: string, interval: "month" | "year") => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    if (!res.ok) {
      const message = await res.text().catch(() => "");
      console.error("Checkout error", res.status, message);
      if (res.status === 401) {
        alert("You must be signed in to upgrade your account.");
      } else {
        alert("Checkout could not be started yet. Configure Supabase/Stripe and try again.");
      }
      return;
    }
    const data = await res.json().catch(() => null);
    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert("No checkout URL returned. Verify server configuration.");
    }
  };

  const handleSignInThenCheckout = async (plan: string, interval: "month" | "year") => {
    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        alert("You must be signed in to upgrade your account.");
        return;
      }
    }
    await handleCheckout(plan, interval);
  };

  return (
    <div className="text-sm text-slate-100">
      {/* Urgency banner */}
      <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-red-500/30 bg-[linear-gradient(135deg,#ef4444_0%,#f59e0b_100%)] px-4 py-3 text-center text-sm text-white shadow-[0_18px_40px_rgba(239,68,68,0.35)]">
        <div className="font-semibold">
          <span className="mr-1 inline-block animate-bounce">🔥</span>
          Limited Time Launch Sale: <span className="underline">Special Introductory Pricing on All Plans</span>
          {deadline ? (
            <>
              {" "}· Ends in <span className="tabular-nums">{countdownLabel}</span>
            </>
          ) : null}
        </div>
        <div className="mt-1 text-xs opacity-90">Prices will double when this counter runs out!</div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className={!annual ? "font-semibold text-white" : "text-[var(--muted)]"}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className="relative h-6 w-12 rounded-2xl bg-white/15 transition"
          aria-label="Toggle annual"
        >
          <span
            className={`absolute top-[3px] h-5 w-5 rounded-xl bg-[var(--accent)] shadow transition ${annual ? "left-[calc(100%-1.45rem)]" : "left-[6px]"}`}
          />
        </button>
        <span className={annual ? "font-semibold text-white" : "text-[var(--muted)]"}>
          Annual
        </span>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {plans.map((p) => {
          const interval = annual ? "year" : "month";
          const isLegendary = p.name === "LEGENDARY";
          return (
            <div
              key={p.name}
              className={`relative glass-card flex h-full flex-col justify-between p-6 text-left ${
                isLegendary ? "ring-2 ring-red-500/60 shadow-[0_28px_70px_rgba(239,68,68,0.35)]" : ""
              }`}
            >
              {isLegendary ? (
                <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(239,68,68,0.45)]">
                  <span className="inline-block animate-bounce">🔥</span>
                  Recommended
                </div>
              ) : null}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-secondary)]">
                  {p.name}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {p.description}
                </h3>
                <div className="mt-5 text-4xl font-semibold text-white">
                  {annual ? p.priceYearly : p.priceMonthly}
                  <span className="ml-1 text-sm font-normal text-[var(--muted)]">
                    {annual ? "/yr" : "/mo"}
                  </span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                  {p.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSignInThenCheckout(p.name.toLowerCase(), interval)}
                className="mt-8 w-full rounded-2xl bg-[var(--accent)] px-4 py-2 text-base font-semibold text-[#0c1325] shadow-[0_14px_32px_rgba(91,124,255,0.28)] transition hover:brightness-110"
              >
                Choose {p.name}
              </button>
            </div>
          );
        })}
      </div>
      {/* Free plan limitations note */}
      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-500/50 bg-black/20 p-4 text-center text-sm text-red-200">
        <div className="font-semibold text-red-400">Limitations of Free Plan</div>
        <ul className="mx-auto mt-2 max-w-xl space-y-1 text-left">
          <li>• Basic Access to Core Features</li>
          <li>• Notes Generation — Only 1/day (includes 3 notes)</li>
          <li>• Viral Image Generation — Only 1/week (includes 3 images)</li>
        </ul>
      </div>
    </div>
  );
}
