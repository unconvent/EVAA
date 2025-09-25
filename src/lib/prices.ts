import { getStripe } from "@/lib/stripe";
import fs from "fs/promises";
import path from "path";

type Interval = "month" | "year";

const ENV_MAP: Record<string, string | undefined> = {
  pro_month: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_year: process.env.STRIPE_PRICE_PRO_YEARLY,
  legendary_month: process.env.STRIPE_PRICE_LEGENDARY_MONTHLY,
  legendary_year: process.env.STRIPE_PRICE_LEGENDARY_YEARLY,
};

const LOCAL_FILE = path.join(process.cwd(), "local", "stripe.dev.json");

export async function getPriceIdFor(plan: string, interval: Interval): Promise<string | undefined> {
  // 1) Environment variables
  const fromEnv = ENV_MAP[`${plan}_${interval}`];
  if (fromEnv) return fromEnv;

  // 2) Local file cache
  const fromFile = await readLocalPrice(`${plan}_${interval}`);
  if (fromFile) return fromFile;

  // 3) Create dev prices if missing
  await ensureDevPrices();
  return readLocalPrice(`${plan}_${interval}`);
}

export async function getPlanIntervalFromPriceId(
  priceId: string
): Promise<{ plan: string; interval: Interval } | null> {
  const reverseEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(ENV_MAP)) {
    if (value) reverseEnv[value] = key;
  }
  if (reverseEnv[priceId]) {
    const [plan, interval] = reverseEnv[priceId].split("_");
    return { plan, interval: interval === "year" ? "year" : "month" };
  }

  const localMap = await readLocalMap();
  const matched = Object.entries(localMap).find(([, val]) => val === priceId);
  if (matched) {
    const [key] = matched;
    const [plan, interval] = key.split("_");
    return { plan, interval: interval === "year" ? "year" : "month" };
  }

  return null;
}

async function readLocalPrice(key: string): Promise<string | undefined> {
  try {
    const json = await readLocalMap();
    return json[key];
  } catch {
    return undefined;
  }
}

async function readLocalMap(): Promise<Record<string, string>> {
  try {
    const buf = await fs.readFile(LOCAL_FILE, "utf8");
    return JSON.parse(buf) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeLocalPrices(map: Record<string, string>) {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(map, null, 2), "utf8");
}

async function ensureDevPrices() {
  const stripe = getStripe();

  // If any env mappings exist, prefer them and store to file for completeness
  const current: Record<string, string> = {};
  for (const k of Object.keys(ENV_MAP)) {
    const v = ENV_MAP[k];
    if (v) current[k] = v;
  }

  // If all present, just write and exit
  if (
    current.pro_month &&
    current.pro_year &&
    current.legendary_month &&
    current.legendary_year
  ) {
    await writeLocalPrices(current);
    return;
  }

  // Create products and recurring prices (USD) suitable for development
  // Amounts: PRO $19/mo or $190/yr; LEGENDARY $49/mo or $490/yr
  const products = await ensureProducts(stripe);

  const priceMap: Record<string, string> = { ...current };

  // Helper to create a price if not already present
  async function ensurePrice(productId: string, unit_amount: number, interval: Interval) {
    const list = await stripe.prices.list({ product: productId, active: true, limit: 100 });
    const found = list.data.find(
      (p) => p.recurring?.interval === interval && p.unit_amount === unit_amount
    );
    if (found) return found.id;
    const created = await stripe.prices.create({
      product: productId,
      currency: "usd",
      unit_amount,
      recurring: { interval },
      nickname: `${productId === products.pro ? "PRO" : "LEGENDARY"} ${interval}`,
    });
    return created.id;
  }

  priceMap.pro_month =
    priceMap.pro_month || (await ensurePrice(products.pro, 1900, "month"));
  priceMap.pro_year = priceMap.pro_year || (await ensurePrice(products.pro, 19000, "year"));
  priceMap.legendary_month =
    priceMap.legendary_month || (await ensurePrice(products.legendary, 4900, "month"));
  priceMap.legendary_year =
    priceMap.legendary_year || (await ensurePrice(products.legendary, 49000, "year"));

  await writeLocalPrices(priceMap);
}

async function ensureProducts(stripe: ReturnType<typeof getStripe>) {
  // Try to find by exact names first
  const proName = "BoilerKitt PRO";
  const legendaryName = "BoilerKitt LEGENDARY";

  async function findOrCreate(name: string, metadata: Record<string, string>) {
    const list = await stripe.products.list({ active: true, limit: 100 });
    const found = list.data.find((p) => p.name === name);
    if (found) return found.id;
    const created = await stripe.products.create({ name, metadata });
    return created.id;
  }

  const pro = await findOrCreate(proName, { tier: "pro", source: "dev-autocreate" });
  const legendary = await findOrCreate(legendaryName, {
    tier: "legendary",
    source: "dev-autocreate",
  });
  return { pro, legendary };
}
