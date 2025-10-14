import fs from 'fs/promises';
import path from 'path';
import Stripe from 'stripe';
// Load .env.local if present to populate process.env for this script
try {
  const envPath = path.join(process.cwd(), '.env.local');
  const buf = await fs.readFile(envPath, 'utf8');
  for (const rawLine of buf.split(/\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const REQUIRED_ENV = ['STRIPE_SECRET_KEY'];

for (const k of REQUIRED_ENV) {
  if (!process.env[k]) {
    console.error(`Missing ${k} in environment. Add it to .env.local and re-run.`);
    process.exit(1);
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function ensureProductByName(name, metadata = {}) {
  const list = await stripe.products.list({ active: true, limit: 100 });
  const found = list.data.find(p => p.name === name);
  if (found) return found.id;
  const created = await stripe.products.create({ name, metadata });
  return created.id;
}

async function ensureRecurringPrice(productId, unit_amount, interval, nickname) {
  const list = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const found = list.data.find(p => p.recurring?.interval === interval && p.unit_amount === unit_amount);
  if (found) return found.id;
  const created = await stripe.prices.create({
    product: productId,
    currency: 'usd',
    unit_amount,
    recurring: { interval },
    nickname,
  });
  return created.id;
}

async function upsertEnvVars(map) {
  const envPath = path.join(process.cwd(), '.env.local');
  let text = '';
  try {
    text = await fs.readFile(envPath, 'utf8');
  } catch (e) {
    // Create if missing
    text = '';
  }

  const lines = text.split(/\n/);
  const kv = Object.fromEntries(lines.filter(l => l.includes('=')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx).trim(), l.slice(idx + 1)];
  }));

  let changed = false;
  for (const [k, v] of Object.entries(map)) {
    if (!kv[k] || kv[k].trim() !== v) {
      kv[k] = v;
      changed = true;
    }
  }

  if (!changed) return false;

  // Reconstruct preserving non-KV lines
  const preserved = lines.filter(l => !l.includes('='));
  const rendered = Object.entries(kv)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const final = [rendered, ...preserved.filter(Boolean)].join('\n') + '\n';
  await fs.writeFile(envPath, final, 'utf8');
  return true;
}

async function main() {
  const proId = await ensureProductByName('EVAA PRO', { tier: 'pro', source: 'script' });
  const legId = await ensureProductByName('EVAA LEGENDARY', { tier: 'legendary', source: 'script' });

  const proMonth = await ensureRecurringPrice(proId, 990, 'month', 'PRO month');
  const proYear = await ensureRecurringPrice(proId, 9700, 'year', 'PRO year');
  const legMonth = await ensureRecurringPrice(legId, 4997, 'month', 'LEGENDARY month');
  const legYear = await ensureRecurringPrice(legId, 49700, 'year', 'LEGENDARY year');

  const envMap = {
    STRIPE_PRICE_PRO_MONTHLY: proMonth,
    STRIPE_PRICE_PRO_YEARLY: proYear,
    STRIPE_PRICE_LEGENDARY_MONTHLY: legMonth,
    STRIPE_PRICE_LEGENDARY_YEARLY: legYear,
  };

  const wrote = await upsertEnvVars(envMap);

  console.log(JSON.stringify({
    products: { pro: proId, legendary: legId },
    prices: envMap,
    envUpdated: wrote,
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
