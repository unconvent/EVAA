'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FloatingActions } from "@/components/floating-actions";
import { createClient } from "@/lib/supabase/client";

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  interval: string | null;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        if (!data.user) {
          setUserEmail(null);
          return;
        }
        setUserEmail(data.user.email ?? "");
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("plan,status,interval,created_at")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subError) {
          setError(subError.message);
          return;
        }
        setSubscription(subData as SubscriptionRow | null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const callEndpoint = useCallback(async (path: string) => {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || `Request failed (${res.status})`);
      } else if (typeof data.url === "string") {
        window.location.href = data.url;
      } else {
        alert(data.message || JSON.stringify(data, null, 2));
      }
    } catch (e) {
      alert((e as Error).message);
    }
  }, []);

  const planDescriptor = (() => {
    const plan = subscription?.plan?.toLowerCase();
    const normalizedPlan = plan === "legendary" ? "Legendary" : plan === "pro" ? "Pro" : plan;

    if (!normalizedPlan || normalizedPlan === "free") {
      return "Free";
    }

    const interval = subscription?.interval?.toLowerCase();
    const intervalLabel = interval === "year" ? "Annual" : interval === "month" ? "Monthly" : null;
    return intervalLabel ? `${normalizedPlan} · ${intervalLabel}` : normalizedPlan;
  })();

  const statusLabel = subscription?.status ? subscription.status.toUpperCase() : "INACTIVE";

  if (!supabase) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="text-2xl font-semibold">Dashboard unavailable</h1>
        <p className="mt-2 text-gray-600">
          Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.
        </p>
        <Link href="/pricing" className="mt-6 inline-block rounded-md border px-4 py-2">
          Explore Pricing
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <p className="text-[var(--muted)]">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="text-2xl font-semibold text-white">Dashboard error</h1>
        <p className="mt-2 text-red-400">{error}</p>
        <p className="mt-4 text-[var(--muted)]">
          If you just set up Google OAuth, try signing out and back in from the navbar.
        </p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-slate-100">
        <h1 className="text-2xl font-semibold">Please sign in</h1>
        <p className="mt-2 text-[var(--muted)]">
          Use the “Sign in” button in the navbar (Google OAuth) to load your dashboard. After completing a checkout you can return here to see your plan.
        </p>
        <Link
          href="/pricing"
          className="cta-secondary mt-6 inline-flex rounded-2xl px-4 py-2"
        >
          Go to Pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-slate-100">
      <FloatingActions />
      <div className="rounded-3xl border border-white/10 bg-black/30 px-8 py-12 shadow-[0_40px_90px_rgba(6,8,18,0.5)]">
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Welcome, {userEmail}
        </h1>
        {/* Removed GitHub link */}
        <p className="mt-2 text-[var(--muted)]">
          Current plan: <span className="text-white">{planDescriptor}</span>{" "}
          <span className="uppercase tracking-wider text-[var(--accent)]">
            {statusLabel}
          </span>
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white">Viral Notes (Short‑form Text)</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Create viral Substack Notes tailored to your audience and voice.</p>
            <Link href="/dashboard/viral-notes" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl px-4 py-2 text-base font-semibold border border-white/20 bg-white/10 text-[var(--accent-secondary)] hover:bg-white/15">Open Notes Studio</Link>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white">Viral Post Images & Thumbnails</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Generate scroll‑stopping post images and thumbnails engineered for CTR.</p>
            <Link href="/dashboard/viral-images" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl px-4 py-2 text-base font-semibold border border-white/20 bg-white/10 text-[var(--accent-secondary)] hover:bg-white/15">Open Image Studio</Link>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white">Billing</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Manage payment method and subscription in Stripe portal.
            </p>
          <button
            className="cta-secondary mt-6 inline-flex rounded-2xl px-4 py-2"
            onClick={() => callEndpoint("/api/portal")}
          >
            Update Your Subscription
          </button>
        </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white">Upgrade Plan</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Explore plans and upgrade from the pricing page.
            </p>
          <Link
            href="/pricing"
            className="cta-secondary mt-6 inline-flex rounded-2xl px-4 py-2"
          >
              Upgrade Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
