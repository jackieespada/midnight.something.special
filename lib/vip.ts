import Stripe from "stripe";
import { isFoundingTs } from "./founding";

export const VIP_MONTHLY_LIMIT = 3;
const VIP_MIN_CENTS = 1500;
const PRODUCER_MIN_CENTS = 3000;

export type VipStatus =
  | { ok: true; tier: "vip" | "producer"; used: number; left: number; founding: boolean }
  | { ok: false; error: string };

// Calendar month in Eastern time, e.g. "2026-11". Used so the 3 priority
// requests reset on the 1st of each month.
function monthKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }).slice(0, 7);
}

async function getStoreSafe() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore("show-state");
  } catch {
    return null;
  }
}

const memoryUsage: Record<string, number> = {};

function usageKey(email: string): string {
  return `vip-usage:${email}:${monthKey()}`;
}

async function readUsage(email: string): Promise<number> {
  const key = usageKey(email);
  const store = await getStoreSafe();
  if (store) {
    try {
      const raw = await store.get(key);
      return raw ? Number(raw) || 0 : 0;
    } catch {
      return 0;
    }
  }
  return memoryUsage[key] || 0;
}

export async function addUsage(email: string): Promise<void> {
  const key = usageKey(email);
  const current = await readUsage(email);
  const store = await getStoreSafe();
  if (store) {
    await store.set(key, String(current + 1));
    return;
  }
  memoryUsage[key] = current + 1;
}

// Asks Stripe whether this email has an active monthly subscription, and
// returns the tier based on the monthly amount. Stripe is the source of
// truth, so cancelled members lose VIP automatically.
async function findTier(email: string): Promise<{ tier: "vip" | "producer"; founding: boolean } | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  const stripe = new Stripe(secretKey);

  const tries = Array.from(new Set([email, email.toLowerCase()]));
  let best = 0;
  let earliestStart = 0; // earliest start of any active monthly subscription, in ms
  for (const e of tries) {
    const customers = await stripe.customers.list({ email: e, limit: 10 });
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "active", limit: 10 });
      for (const sub of subs.data) {
        const startMs = (sub.start_date || 0) * 1000;
        if (startMs && (!earliestStart || startMs < earliestStart)) earliestStart = startMs;
        for (const item of sub.items.data) {
          const price = item.price;
          const cents = price?.unit_amount || 0;
          if (price?.recurring?.interval === "month" && cents > best) best = cents;
        }
      }
    }
  }
  const founding = isFoundingTs(earliestStart);
  if (best >= PRODUCER_MIN_CENTS) return { tier: "producer", founding };
  if (best >= VIP_MIN_CENTS) return { tier: "vip", founding };
  return null;
}

export async function getVipStatus(rawEmail: string): Promise<VipStatus> {
  const email = rawEmail.trim();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter the email you used to sign up." };
  }
  let found: { tier: "vip" | "producer"; founding: boolean } | null = null;
  try {
    found = await findTier(email);
  } catch {
    return { ok: false, error: "Couldn't check your membership right now. Try again in a moment." };
  }
  if (!found) {
    return { ok: false, error: "We couldn't find an active VIP or Producer membership for that email." };
  }
  const used = await readUsage(email.toLowerCase());
  return { ok: true, tier: found.tier, used, left: Math.max(0, VIP_MONTHLY_LIMIT - used), founding: found.founding };
}
