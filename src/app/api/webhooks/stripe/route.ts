import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getPlanIntervalFromPriceId } from "@/lib/prices";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type Interval = "month" | "year";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return NextResponse.json({ received: true });

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return new NextResponse("Bad signature", { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    console.warn("Supabase admin client unavailable; skipping webhook persistence.");
    return NextResponse.json({ received: true, skipped: "supabase-disabled" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | undefined;
        if (!subscriptionId) break;
        const customerId = session.customer as string | undefined;
        const supabaseUserId = session.metadata?.supabase_user_id ?? null;
        const planRaw = session.metadata?.plan ?? undefined;
        const intervalRaw = session.metadata?.interval ?? undefined;
        const customerEmail = session.customer_details?.email ?? undefined;

        let planInfo = normalizePlanInterval(planRaw, intervalRaw);
        if (!planInfo && subscriptionId) {
          planInfo = await resolvePlanFromStripe(stripe, subscriptionId);
        }

        const userId = await resolveUserId({
          supabase,
          supabaseUserId,
          customerId,
          email: customerEmail,
        });

        await persistSubscription({
          supabase,
          subscriptionId,
          customerId,
          userId,
          plan: planInfo?.plan ?? "free",
          interval: planInfo?.interval ?? "month",
          status: "active",
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const supabaseUserId = sub.metadata?.supabase_user_id ?? null;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        const price = sub.items.data[0]?.price;
        let planInfo = normalizePlanInterval(sub.metadata?.plan, sub.metadata?.interval);
        if (!planInfo && price?.id) {
          planInfo = await getPlanIntervalFromPriceId(price.id);
        }
        if (!planInfo) {
          planInfo = await resolvePlanFromStripe(stripe, sub.id, price?.id, price?.nickname);
        }
        const userId = await resolveUserId({
          supabase,
          supabaseUserId,
          customerId,
          email: undefined,
        });

        const resolvedPlan = planInfo?.plan ?? slugFromNickname(price?.nickname) ?? "free";
        const resolvedInterval =
          planInfo?.interval ?? (price?.recurring?.interval === "year" ? "year" : "month");

        await persistSubscription({
          supabase,
          subscriptionId: sub.id,
          customerId,
          userId,
          plan: resolvedPlan,
          interval: resolvedInterval,
          status: sub.status,
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook processing error", e);
    return new NextResponse("Webhook error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type PersistInput = {
  supabase: SupabaseClient;
  subscriptionId: string;
  customerId?: string;
  userId: string | null;
  plan: string;
  interval: string;
  status: string;
};

async function persistSubscription({
  supabase,
  subscriptionId,
  customerId,
  userId,
  plan,
  interval,
  status,
}: PersistInput) {
  const payload = {
    id: subscriptionId,
    stripe_customer_id: customerId,
    user_id: userId ?? undefined,
    plan,
    interval,
    status,
  };

  const { error } = await supabase.from("subscriptions").upsert(payload, {
    onConflict: "id",
  });
  if (error) {
    throw new Error(`Failed to persist subscription: ${error.message}`);
  }

  if (userId) {
    const profileUpdate = {
      plan,
      plan_status: status,
      plan_interval: interval,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) {
      const message = profileError.message?.toLowerCase() ?? "";
      const missingSchema = ["plan", "plan_status", "plan_interval"].some((field) =>
        message.includes(field) && message.includes("column")
      );

      if (!missingSchema) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      const { error: fallbackError } = await supabase
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (fallbackError) {
        throw new Error(`Failed to update profile: ${fallbackError.message}`);
      }
    }
  }
}

async function resolvePlanFromStripe(
  stripe: Stripe,
  subscriptionId: string,
  priceId?: string | null,
  nickname?: string | null
): Promise<{ plan: string; interval: Interval } | null> {
  const resolveFromPrice = async (
    price: Stripe.Price | string | null | undefined
  ): Promise<{ plan: string; interval: Interval } | null> => {
    if (!price) return null;

    let hydrated: Stripe.Price;
    if (typeof price === "string") {
      try {
        hydrated = await stripe.prices.retrieve(price);
      } catch (error) {
        console.warn(
          `Unable to retrieve price ${price} while resolving subscription ${subscriptionId}.`,
          error
        );
        return null;
      }
    } else {
      hydrated = price;
    }

    if (hydrated.id) {
      const mapped = await getPlanIntervalFromPriceId(hydrated.id);
      if (mapped) return mapped;
    }

    if (hydrated.nickname) {
      const plan = slugFromNickname(hydrated.nickname);
      if (plan) {
        const interval = (hydrated.recurring?.interval as Interval | undefined) ?? "month";
        return { plan, interval };
      }
    }

    return null;
  };

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });

    const normalized = normalizePlanInterval(
      subscription.metadata?.plan,
      subscription.metadata?.interval
    );
    if (normalized) return normalized;

    const firstItem = subscription.items.data[0];
    const fromItemPrice = await resolveFromPrice(firstItem?.price ?? null);
    if (fromItemPrice) return fromItemPrice;

    const productId =
      typeof firstItem?.price?.product === "string"
        ? firstItem?.price?.product
        : firstItem?.price?.product?.id;
    if (productId) {
      try {
        const product = await stripe.products.retrieve(productId);
        const plan = product.metadata?.tier ?? slugFromNickname(product.name);
        if (plan) {
          const interval = (firstItem?.price?.recurring?.interval as Interval | undefined) ?? "month";
          return { plan, interval };
        }
      } catch (productError) {
        console.warn(
          `Unable to resolve product ${productId} while resolving subscription ${subscriptionId}.`,
          productError
        );
      }
    }
  } catch (subscriptionError) {
    console.error(
      `Failed to retrieve subscription ${subscriptionId} while resolving plan information.`,
      subscriptionError
    );
  }

  const fallbackFromPriceId = await resolveFromPrice(priceId ?? null);
  if (fallbackFromPriceId) return fallbackFromPriceId;

  if (nickname) {
    const plan = slugFromNickname(nickname);
    if (plan) {
      return { plan, interval: "month" };
    }
  }

  return null;
}

async function resolveUserId({
  supabase,
  supabaseUserId,
  customerId,
  email,
}: {
  supabase: SupabaseClient;
  supabaseUserId: string | null;
  customerId?: string |
    undefined;
  email?: string;
}): Promise<string | null> {
  if (supabaseUserId) return supabaseUserId;

  if (customerId) {
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .not("user_id", "is", null)
      .maybeSingle();
    if (data?.user_id) return data.user_id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (profile?.id) return profile.id;
  }

  if (email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (profile?.id) return profile.id;
  }

  return null;
}

function normalizePlanInterval(
  plan?: string | null,
  interval?: string | null
): { plan: string; interval: Interval } | null {
  if (plan && interval) {
    return { plan: plan.toLowerCase(), interval: interval === "year" ? "year" : "month" };
  }
  return null;
}

function slugFromNickname(nickname?: string | null): string | null {
  if (!nickname) return null;
  return nickname.toLowerCase().includes("legendary") ? "legendary" : "pro";
}
