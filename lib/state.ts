export type Song = { title: string; artist: string };
export type NowPlaying = Song & { name?: string; message?: string };
export type Request = Song & { name?: string; message?: string; ts: number; tipped?: boolean; tipCents?: number };
export type PlayedSong = Song & { name?: string; ts: number };
export type Episode = { date: string; songs: PlayedSong[] };

export type ShowState = {
  nowPlaying: NowPlaying;
  lastPlayed: Song | null;
  queue: Request[];
  history: PlayedSong[];
  episodes: Episode[];
};

export const MAX_QUEUE = 25;

const STATE_KEY = "midnight-something-special:state";

const defaultState: ShowState = {
  nowPlaying: { title: "Le Freak", artist: "Chic" },
  lastPlayed: { title: "September", artist: "Earth, Wind & Fire" },
  queue: [],
  history: [],
  episodes: [],
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
// Falls back to an in-memory object for local development, which resets
// on every reload — that's expected locally.
let memoryState: ShowState | null = null;

async function getStoreSafe() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore("show-state");
  } catch {
    return null;
  }
}

export async function getState(): Promise<ShowState> {
  const store = await getStoreSafe();
  if (store) {
    try {
      const raw = await store.get(STATE_KEY);
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
    return defaultState;
  }
  return memoryState ?? defaultState;
}

export async function setState(state: ShowState): Promise<void> {
  const store = await getStoreSafe();
  if (store) {
    await store.set(STATE_KEY, JSON.stringify(state));
    return;
  }
  memoryState = state;
}
