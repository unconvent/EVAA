import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// Creates a Customer (if needed), an Ephemeral Key for that Customer,
// and a PaymentIntent, returning their client secrets for React Native PaymentSheet.
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();

    // Optional: allow overriding amount/currency via JSON body for testing
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const amount = typeof body.amount === "number" ? body.amount : undefined;
    const currency = typeof body.currency === "string" ? body.currency : undefined;
    const customerId = typeof body.customerId === "string" ? body.customerId : undefined;

    // Create or reuse a Stripe customer
    let customerIdFinal: string;
    if (customerId) {
      customerIdFinal = customerId;
    } else {
      const created = await stripe.customers.create();
      customerIdFinal = created.id;
    }

    // Create an ephemeral key for the mobile SDK
    // Use the latest Stripe mobile SDK API version per Stripe docs.
    const ekey = await stripe.ephemeralKeys.create(
      { customer: customerIdFinal },
      { apiVersion: "2025-08-27.basil" }
    );

    // Create a PaymentIntent for one-off payments (PaymentSheet)
    const pi = await stripe.paymentIntents.create({
      amount: amount ?? 1099,
      currency: (currency ?? "usd") as string,
      customer: customerIdFinal,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      paymentIntent: pi.client_secret,
      ephemeralKey: ekey.secret,
      customer: customerIdFinal,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("/api/payment-sheet error", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
