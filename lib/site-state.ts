// Data model for the jackieespada.com landing page + site-admin panel.
// Separate from lib/state.ts (which handles the two shows' song-request
// queues) — this file is only for the links list, calendar, and suggestions
// that live on the public homepage.

export type LinkItem = {
  id: string;
  label: string;   // e.g. "Ko-fi", "TikTok", "Bible Personality Quiz"
  url: string;
  section: "shows" | "social" | "support" | "extras"; // which group it renders under
  enabled: boolean; // lets Jackie hide a link without deleting it
};

export type CalendarEntry = {
  id: string;
  day: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  time: string;       // display string, e.g. "12:00 PM ET"
  showName: string;    // e.g. "Bible Study for Overthinkers"
  note?: string;        // e.g. "with BayTheaterDave", "on Badlands Media", "not consistently run"
  linksTo?: string;      // optional path, e.g. "/request" or "/hooks-harmony"
  date?: string;          // "YYYY-MM-DD" — if set, this is a ONE-TIME special on that exact date instead of a weekly recurring show
};

export type Suggestion = {
  id: string;
  text: string;
  name?: string;
  ts: number;
  read: boolean; // lets Jackie mark suggestions as seen
};

export type AffiliateItem = {
  id: string;
  category: string; // e.g. "Wellness + Beauty Must-Haves" — groups items on the Shop My Favorites page
  name: string;
  description?: string;
  code?: string;        // e.g. "JACKIE10 — 10% off"
  url: string;
  enabled: boolean;
};

export type Supporter = {
  id: string;
  name?: string;
  message?: string;
  amountCents: number;
  ts: number;
};

export type SiteState = {
  links: LinkItem[];
  calendar: CalendarEntry[];
  suggestions: Suggestion[];
  affiliates: AffiliateItem[];
  photoUrl?: string;
  supporters: Supporter[];
};

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Seeded with everything Jackie has already told us about, so the site
// looks real the moment it goes live instead of starting blank. All of this
// is editable from /site-admin afterward.
function defaultSiteState(): SiteState {
  return {
    photoUrl: "",
    supporters: [],
    links: [
      { id: makeId(), label: "Ko-fi — Support the Show", url: "https://ko-fi.com/", section: "support", enabled: true },
      { id: makeId(), label: "TikTok", url: "https://tiktok.com/", section: "social", enabled: true },
      { id: makeId(), label: "YouTube", url: "https://youtube.com/", section: "social", enabled: true },
      { id: makeId(), label: "Rumble", url: "https://rumble.com/", section: "social", enabled: true },
      { id: makeId(), label: "Instagram", url: "https://instagram.com/", section: "social", enabled: true },
      { id: makeId(), label: "Substack", url: "https://substack.com/", section: "social", enabled: true },
      { id: makeId(), label: "Telegram", url: "https://t.me/", section: "social", enabled: true },
      { id: makeId(), label: "X", url: "https://x.com/", section: "social", enabled: true },
      { id: makeId(), label: "Bible Personality Quiz", url: "#", section: "extras", enabled: true },
      { id: makeId(), label: "30-Day Challenge (coming soon)", url: "#", section: "extras", enabled: true },
    ],
    calendar: [
      { id: makeId(), day: "Sun", time: "12:00 PM ET", showName: "Bible Study for Overthinkers", linksTo: undefined },
      { id: makeId(), day: "Sun", time: "7:00 PM ET", showName: "The Good Book Sessions", note: "with BayTheaterDave" },
      { id: makeId(), day: "Mon", time: "3:00 PM ET", showName: "Alphas Make Sandwiches", note: "on Badlands Media" },
      { id: makeId(), day: "Tue", time: "7:00 PM ET", showName: "Light Work", note: "not consistently run" },
      { id: makeId(), day: "Wed", time: "12:30 AM ET (9:30 PM PT)", showName: "The Midnight Something Special", linksTo: "/request" },
      { id: makeId(), day: "Sat", time: "3:00 PM ET", showName: "Hooks + Harmony", linksTo: "/hooks-harmony" },
    ],
    suggestions: [],
    affiliates: [
      { id: makeId(), category: "Amazon Storefront", name: "My Amazon Storefront", description: "Wellness, Bible study tools, kitchen must-haves, creator gear, and home items I actually use.", url: "https://amazon.com/", enabled: true },
      { id: makeId(), category: "Wellness + Beauty Must-Haves", name: "All Good Co.", description: "Tallow products and hair mask.", code: "JACKIE — 5% off, free shipping $75+", url: "#", enabled: true },
      { id: makeId(), category: "Wellness + Beauty Must-Haves", name: "Health y Sol", description: "Tallow soaps, great for eczema-sensitive skin.", code: "JACKIE10 — 10% off", url: "#", enabled: true },
      { id: makeId(), category: "Wellness + Beauty Must-Haves", name: "Tamarac Garden", description: "Handcrafted herbal remedies, teas, and skincare from North Idaho.", code: "JACKIEESPADA — 10% off", url: "#", enabled: true },
      { id: makeId(), category: "Wellness + Beauty Must-Haves", name: "Mountain Rose Herbs", description: "High-quality herbs, teas, and essential oils.", url: "#", enabled: true },
      { id: makeId(), category: "Wellness + Beauty Must-Haves", name: "Soft Disclosure", description: "Deodorant, lotion, tallow bars, lip balm, and beard oil from a Colorado farm.", code: "JACKIE — 10% off", url: "#", enabled: true },
      { id: makeId(), category: "Food + Drink Favorites", name: "Loaded Gun Coffee", description: "Bold, smooth coffee.", code: "JackieEspada — 10% off", url: "#", enabled: true },
      { id: makeId(), category: "Lifestyle + Everyday Favorites", name: "In His Word", description: "Women-owned Christian apparel and home goods.", code: "JACKIEESPADA — $10 off $70+", url: "#", enabled: true },
      { id: makeId(), category: "Lifestyle + Everyday Favorites", name: "Brave & Courageous", url: "#", enabled: true },
    ],
  };
}

const STATE_KEY = "site:state";
let memoryState: SiteState | null = null;

async function getStoreSafe() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore("show-state");
  } catch {
    return null;
  }
}

export async function getSiteState(): Promise<SiteState> {
  const store = await getStoreSafe();
  if (store) {
    try {
      const raw = await store.get(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SiteState;
        if (!parsed.links) parsed.links = [];
        if (!parsed.calendar) parsed.calendar = [];
        if (!parsed.suggestions) parsed.suggestions = [];
        if (!parsed.affiliates) parsed.affiliates = [];
        if (!parsed.supporters) parsed.supporters = [];
        return parsed;
      }
    } catch {
      // fall through to default below
    }
    const seeded = defaultSiteState();
    await store.set(STATE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  if (!memoryState) memoryState = defaultSiteState();
  return memoryState;
}

export async function setSiteState(state: SiteState): Promise<void> {
  const store = await getStoreSafe();
  if (store) {
    await store.set(STATE_KEY, JSON.stringify(state));
    return;
  }
  memoryState = state;
}

export { makeId as makeSiteId };
