import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";

function stripeCustomerMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  const message = maybeError.message?.toLowerCase() ?? "";
  if (maybeError.code === "resource_missing" && message.includes("customer")) {
    return true;
  }
  if (message.includes("no such customer")) {
    return true;
  }
  return false;
}

export async function POST() {
  const supabase = await createServerSupabase();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = getStripe();

  let customerId: string | undefined;

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.stripe_customer_id) {
    customerId = profile.stripe_customer_id;
  }

  if (!customerId) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    }
  }

  if (!customerId) {
    const email = user.email ?? undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      customerId = customers.data[0]?.id;
    }
  }

  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "No Stripe customer found for this user. Start a checkout first so we can create one for you.",
      },
      { status: 404 }
    );
  }

  try {
    await stripe.customers.retrieve(customerId);
  } catch (error) {
    console.error("Stripe customer lookup failed", error);
    const status = stripeCustomerMissing(error) ? 404 : 500;
    const message = stripeCustomerMissing(error)
      ? "Stripe customer missing for this user. Start a checkout to create one."
      : "Unable to verify Stripe customer. Please contact support.";
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Stripe billing portal error", error);
    const status = stripeCustomerMissing(error) ? 404 : 500;
    const message = stripeCustomerMissing(error)
      ? "Stripe customer missing for this user. Start a checkout to create one."
      : typeof error === "object" && error && "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
        ? ((error as { message?: string }).message as string)
        : "Unable to open billing portal. Please contact support.";
    return NextResponse.json({ error: message }, { status });
  }
}
