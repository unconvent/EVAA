import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const { email, hp, elapsedMs, a, b, answer } = (await req.json().catch(() => ({}))) as {
      email?: string;
      hp?: string; // honeypot; must be empty
      elapsedMs?: number; // time gate
      a?: number; b?: number; answer?: number; // simple math challenge
    };
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Honeypot: reject if filled
    if (typeof hp === "string" && hp.trim() !== "") {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    // Time gate: require at least 2s, allow up to 15 minutes
    const minMs = 2000; const maxMs = 15 * 60 * 1000;
    if (typeof elapsedMs !== "number" || !(elapsedMs >= minMs && elapsedMs <= maxMs)) {
      return NextResponse.json({ error: "Please try again." }, { status: 400 });
    }

    // Math challenge
    const aa = Number.isFinite(a) ? Number(a) : NaN;
    const bb = Number.isFinite(b) ? Number(b) : NaN;
    const ans = Number.isFinite(answer) ? Number(answer) : NaN;
    if (!Number.isFinite(aa) || !Number.isFinite(bb) || !Number.isFinite(ans) || aa + bb !== ans) {
      return NextResponse.json({ error: "Challenge failed. Please try again." }, { status: 400 });
    }

    // Prefer admin client for newsletter so RLS doesn't block anonymous signups
    const admin = createAdminClient();
    if (!admin) {
      // fallback to server client if admin not configured
      const supabase = await createServerSupabase();
      if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
      }
      const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0]?.trim();
      const userAgent = req.headers.get("user-agent") || undefined;
      const normalized = email.trim().toLowerCase();
      const { error } = await supabase
        .from("subscribers")
        .upsert({ email: normalized, ip: ip || null, user_agent: userAgent }, { onConflict: "email" });
      if (error) {
        const msg = typeof (error as { message?: string })?.message === "string" ? error.message : "Subscription failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") || undefined;
    const normalized = email.trim().toLowerCase();
    const { error } = await admin
      .from("subscribers")
      .upsert({ email: normalized, ip: ip || null, user_agent: userAgent }, { onConflict: "email" });

    if (error) {
      // Unique violation or other DB error
      const msg = typeof (error as { message?: string })?.message === "string" ? error.message : "Subscription failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
