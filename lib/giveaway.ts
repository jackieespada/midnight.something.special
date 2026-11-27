// 12 Days of Christmas with Jackie: the free giveaway.
//
// Every entry is FREE. Nothing here is tied to payments, VIP tiers, or song
// requests, so paying can never improve anyone's odds.
//
// Each entrant is saved under their own key so a rush of people typing the
// secret word at the same moment can't overwrite each other.

export type GiveawaySettings = {
  title: string;
  opensAt: number;       // ms
  closesAt: number;      // ms
  drawText: string;      // e.g. "December 12, live on The Midnight Something Special"
  prizes: string[];
  sponsorName: string;
  sponsorAddress: string;
  brands: string;        // partner disclosure line
  words: SecretWord[];
  winners: Winner[];
};

export type SecretWord = { id: string; word: string; label: string; addedAt: number; active: boolean };
export type Winner = { emailKey: string; nickname: string; name: string; email: string; prize: string; drawnAt: number };

export type Entrant = {
  emailKey: string;
  email: string;
  name: string;
  nickname: string;
  refCode: string;
  referredBy?: string;    // refCode of the person who referred them
  substack: boolean;
  telegram: boolean;
  wordsRedeemed: string[]; // SecretWord ids
  referrals: string[];     // emailKeys of friends who entered with their code
  bonus: number;           // manual adjustment by Jackie (can be negative)
  disqualified?: boolean;
  createdAt: number;
};

export const MAX_WORD_ENTRIES = 5;
export const REFERRAL_ENTRIES_EACH = 2;
export const MAX_REFERRAL_ENTRIES = 10;

export const LEVELS = [
  { min: 1, name: "Cocoa Sipper", emoji: "☕" },
  { min: 4, name: "Tinsel Trooper", emoji: "✨" },
  { min: 8, name: "Jingle Jammer", emoji: "🔔" },
  { min: 12, name: "Merry Maven", emoji: "🎁" },
  { min: 16, name: "North Star", emoji: "⭐" },
];

export function defaultSettings(): GiveawaySettings {
  return {
    title: "12 Days of Christmas with Jackie",
    opensAt: Date.parse("2026-12-01T05:00:00Z"),  // Dec 1, 12:00 AM ET
    closesAt: Date.parse("2026-12-12T17:00:00Z"), // Dec 12, 12:00 PM ET (before the live draw)
    drawText: "December 12, live on The Midnight Something Special",
    prizes: [
      "Unwind Bundle: Pranamat travel hedgehog + a Revelation Candle",
      "Cozy Bundle: Brave and Courageous candle + Loaded Gun Coffee",
    ],
    sponsorName: "Jovial Abundance Enterprise, LLC",
    sponsorAddress: "1240 Johnson Ferry Place, Suite A-50, Marietta, GA 30068",
    brands: "Prizes from my partners Pranamat, Revelation Candle, Brave and Courageous, and Loaded Gun Coffee.",
    words: [],
    winners: [],
  };
}

export function breakdown(e: Entrant) {
  const words = Math.min(e.wordsRedeemed.length, MAX_WORD_ENTRIES);
  const referrals = Math.min(e.referrals.length * REFERRAL_ENTRIES_EACH, MAX_REFERRAL_ENTRIES);
  const parts = {
    base: 1,
    substack: e.substack ? 1 : 0,
    telegram: e.telegram ? 1 : 0,
    words,
    referrals,
    bonus: e.bonus || 0,
  };
  const total = Math.max(0, parts.base + parts.substack + parts.telegram + parts.words + parts.referrals + parts.bonus);
  return { ...parts, total };
}

export function levelFor(total: number) {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (total >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  return { current, next };
}

export function isOpen(s: GiveawaySettings, now = Date.now()) {
  return now >= s.opensAt && now < s.closesAt;
}

export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function emailKeyFor(email: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeEmail(email));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export function makeRefCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---------- storage ----------

const SETTINGS_KEY = "giveaway:settings";
const ENTRANT_PREFIX = "giveaway:e:";
const REF_PREFIX = "giveaway:ref:";
const mem = new Map<string, string>();

async function store() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: "show-state", consistency: "strong" });
  } catch {
    return null;
  }
}

async function getRaw(key: string): Promise<string | null> {
  const s = await store();
  if (s) {
    try {
      return (await s.get(key)) ?? null;
    } catch {
      return null;
    }
  }
  return mem.get(key) ?? null;
}

async function setRaw(key: string, value: string) {
  const s = await store();
  if (s) return void (await s.set(key, value));
  mem.set(key, value);
}

async function listKeys(prefix: string): Promise<string[]> {
  const s = await store();
  if (s) {
    const res = await s.list({ prefix });
    return res.blobs.map((b) => b.key);
  }
  return Array.from(mem.keys()).filter((k) => k.startsWith(prefix));
}

export async function getSettings(): Promise<GiveawaySettings> {
  const raw = await getRaw(SETTINGS_KEY);
  if (raw) {
    try {
      return { ...defaultSettings(), ...JSON.parse(raw) };
    } catch {
      // fall through
    }
  }
  return defaultSettings();
}

export async function saveSettings(s: GiveawaySettings) {
  await setRaw(SETTINGS_KEY, JSON.stringify(s));
}

export async function getEntrant(emailKey: string): Promise<Entrant | null> {
  const raw = await getRaw(ENTRANT_PREFIX + emailKey);
  return raw ? (JSON.parse(raw) as Entrant) : null;
}

export async function saveEntrant(e: Entrant) {
  await setRaw(ENTRANT_PREFIX + e.emailKey, JSON.stringify(e));
}

async function delRaw(key: string) {
  const s = await store();
  if (s) return void (await s.delete(key));
  mem.delete(key);
}

// Permanently removes an entrant (for clearing out test entries).
export async function deleteEntrant(e: Entrant) {
  await delRaw(ENTRANT_PREFIX + e.emailKey);
  await delRaw(REF_PREFIX + e.refCode);
}

export async function lookupRef(code: string): Promise<string | null> {
  return getRaw(REF_PREFIX + code.trim().toUpperCase());
}

export async function saveRef(code: string, emailKey: string) {
  await setRaw(REF_PREFIX + code, emailKey);
}

export async function allEntrants(): Promise<Entrant[]> {
  const keys = await listKeys(ENTRANT_PREFIX);
  const out: Entrant[] = [];
  for (const k of keys) {
    const raw = await getRaw(k);
    if (raw) {
      try {
        out.push(JSON.parse(raw));
      } catch {
        // skip a broken record
      }
    }
  }
  return out;
}

// Public view of one entrant: never includes their email.
export function publicStatus(e: Entrant, s: GiveawaySettings) {
  const b = breakdown(e);
  const { current, next } = levelFor(b.total);
  return {
    name: e.name,
    nickname: e.nickname,
    refCode: e.refCode,
    substack: e.substack,
    telegram: e.telegram,
    wordsUsed: e.wordsRedeemed.length,
    referralCount: e.referrals.length,
    breakdown: b,
    level: current,
    nextLevel: next,
    disqualified: !!e.disqualified,
    open: isOpen(s),
  };
}
