export type Song = { title: string; artist: string };
export type NowPlaying = Song & { name?: string; message?: string; videoLink?: string };
export type Request = Song & { name?: string; message?: string; ts: number; tipped?: boolean; tipCents?: number; videoLink?: string };
export type PlayedSong = Song & { name?: string; ts: number; videoLink?: string };
export type Episode = { date: string; songs: PlayedSong[] };
export type ShowState = {
  nowPlaying: NowPlaying;
  lastPlayed: Song | null;
  queue: Request[];
  history: PlayedSong[];
  episodes: Episode[];
  theme?: string;
};

export const MAX_QUEUE = 25;

// Every show gets its own Blobs key and its own default state, so they
// never read or write each other's data even though they share this file.
export type ShowId = "midnight-something-special" | "hooks-harmony";

const STATE_KEYS: Record<ShowId, string> = {
  "midnight-something-special": "midnight-something-special:state",
  "hooks-harmony": "hooks-harmony:state",
};

const DEFAULT_STATES: Record<ShowId, ShowState> = {
  "midnight-something-special": {
    nowPlaying: { title: "Le Freak", artist: "Chic" },
    lastPlayed: { title: "September", artist: "Earth, Wind & Fire" },
    queue: [],
    history: [],
    episodes: [],
  },
  "hooks-harmony": {
    nowPlaying: { title: "Dancing Queen", artist: "ABBA" },
    lastPlayed: { title: "September", artist: "Earth, Wind & Fire" },
    queue: [],
    history: [],
    episodes: [],
  },
};

// Inserts a tipped request ahead of all non-tipped requests, but behind any
// requests that were tipped earlier (first tipped, first served). Tipped
// requests are always allowed in, even if the queue is otherwise "full."
export function insertTippedRequest(queue: Request[], req: Request): Request[] {
  const firstNonTippedIndex = queue.findIndex((r) => !r.tipped);
  if (firstNonTippedIndex === -1) {
    return [...queue, req];
  }
  return [...queue.slice(0, firstNonTippedIndex), req, ...queue.slice(firstNonTippedIndex)];
}

// Uses Netlify Blobs (Netlify's built-in key/value store — no separate
// service to set up, it just works once this is deployed on Netlify).
// Falls back to an in-memory object per show for local development, which
// resets on every reload — that's expected locally.
const memoryState: Partial<Record<ShowId, ShowState>> = {};

async function getStoreSafe() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore("show-state");
  } catch {
    return null;
  }
}

export async function getState(show: ShowId): Promise<ShowState> {
  const store = await getStoreSafe();
  if (store) {
    try {
      const raw = await store.get(STATE_KEYS[show]);
      if (raw) {
        const parsed = JSON.parse(raw) as ShowState;
        // Fill in fields for state saved before history/episodes existed
        if (!parsed.history) parsed.history = [];
        if (!parsed.episodes) parsed.episodes = [];
        return parsed;
      }
    } catch {
      // fall through to default below
    }
    return DEFAULT_STATES[show];
  }
  return memoryState[show] ?? DEFAULT_STATES[show];
}

export async function setState(show: ShowId, state: ShowState): Promise<void> {
  const store = await getStoreSafe();
  if (store) {
    await store.set(STATE_KEYS[show], JSON.stringify(state));
    return;
  }
  memoryState[show] = state;
}
