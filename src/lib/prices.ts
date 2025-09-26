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
const IS_READ_ONLY_FS = Boolean(process.env.VERCEL);
let memoryMap: Record<string, string> | null = null;

export async function getPriceIdFor(
  plan: string,
  interval: Interval
): Promise<string | undefined> {
  const key = `${plan}_${interval}`;

  // 1) Prefer explicit env configuration
  const fromEnv = ENV_MAP[key];
  if (fromEnv) return fromEnv;

  // 2) In-memory cache (survives within a single serverless instance)
  if (memoryMap && memoryMap[key]) return memoryMap[key];

  // 3) Local file cache (skip on read-only FS like Vercel)
  if (!IS_READ_ONLY_FS) {
    const fromFile = await readLocalPrice(key).catch(() => undefined);
    if (fromFile) return fromFile;
  }

  // 4) Find or create prices via Stripe API and cache in-memory
  const ensured = await ensureDevPricesMap();
  memoryMap = ensured; // cache for this runtime

  // 5) Optionally persist locally for dev machines
  if (!IS_READ_ONLY_FS) {
    try {
      await writeLocalPrices(ensured);
    } catch {
      // ignore write errors in environments without writable FS
    }
  }

  return ensured[key];
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

  if (memoryMap) {
    const matched = Object.entries(memoryMap).find(([, val]) => val === priceId);
    if (matched) {
      const [key] = matched;
      const [plan, interval] = key.split("_");
      return { plan, interval: interval === "year" ? "year" : "month" };
    }
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
  if (IS_READ_ONLY_FS) return {};
  try {
    const buf = await fs.readFile(LOCAL_FILE, "utf8");
    return JSON.parse(buf) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeLocalPrices(map: Record<string, string>) {
  if (IS_READ_ONLY_FS) return;
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(map, null, 2), "utf8");
}

async function ensureDevPricesMap(): Promise<Record<string, string>> {
  const stripe = getStripe();

  // If env mappings exist, use them
  const current: Record<string, string> = {};
  for (const k of Object.keys(ENV_MAP)) {
    const v = ENV_MAP[k];
    if (v) current[k] = v;
  }
  if (
    current.pro_month &&
    current.pro_year &&
    current.legendary_month &&
    current.legendary_year
  ) {
    return current;
  }

  // Create products and recurring prices (USD) suitable for development
  // Amounts: PRO $19/mo or $190/yr; LEGENDARY $49/mo or $490/yr
  const products = await ensureProducts(stripe);

  const priceMap: Record<string, string> = { ...current };

  // Helper to create a price if not already present
  async function ensurePrice(
    productId: string,
    unit_amount: number,
    interval: Interval
  ) {
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

  return priceMap;
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
