import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getPriceIdFor } from "@/lib/prices";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, interval } = body as { plan: string; interval: "month" | "year" };

    const priceId = await getPriceIdFor(plan, interval);
    if (!priceId)
      return NextResponse.json({ error: "Invalid or missing price" }, { status: 400 });

    const supabase = await createServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and keys." },
        { status: 503 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.error("/api/checkout supabase auth error", userError);
      return NextResponse.json({ error: "Authentication lookup failed" }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const email = user.email ?? undefined;

    let stripeCustomerId: string | null = null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    stripeCustomerId = profile?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      stripeCustomerId = existingSub?.stripe_customer_id ?? null;
    }

    const stripe = getStripe();
    let customerId = stripeCustomerId;
    if (!customerId) {
      const created = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      });
      customerId = created.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("id", userId);
    } else {
      await stripe.customers.update(customerId, {
        email,
        metadata: { supabase_user_id: userId },
      });
    }

    const successUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!successUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is required for Stripe redirect URLs" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}/dashboard?checkout=success`,
      cancel_url: `${successUrl}/pricing?checkout=cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { plan, interval, supabase_user_id: userId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("/api/checkout error", error);
    const message =
      error && typeof error === "object" && "message" in error ? String(error.message) : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
