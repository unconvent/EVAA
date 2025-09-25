import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export function priceIdFor(plan: string, interval: "month" | "year") {
  const map: Record<string, string | undefined> = {
    pro_month: process.env.STRIPE_PRICE_PRO_MONTHLY,
    pro_year: process.env.STRIPE_PRICE_PRO_YEARLY,
    legendary_month: process.env.STRIPE_PRICE_LEGENDARY_MONTHLY,
    legendary_year: process.env.STRIPE_PRICE_LEGENDARY_YEARLY,
  };
  return map[`${plan}_${interval}`];
}
