export type ShowId = "midnight-something-special" | "hooks-harmony";

export type Song = { title: string; artist: string };
export type NowPlaying = Song & { name?: string; message?: string; videoUrl?: string };
export type Request = Song & { id: string; name?: string; message?: string; videoUrl?: string; ts: number; tipped?: boolean; tipCents?: number };
export type PlayedSong = Song & { name?: string; message?: string; videoUrl?: string; ts: number };
export type Episode = { date: string; songs: PlayedSong[] };

export type Poll = {
  question: string;
  options: string[];
  votes: Record<string, string>;
};

export type ShowState = {
  nowPlaying: NowPlaying;
  lastPlayed: Song | null;
  queue: Request[];
  history: PlayedSong[];
  episodes: Episode[];
  submitterCounts: Record<string, number>;
  theme?: string;
  poll?: Poll;
};

export const MAX_QUEUE = 20;
export const MAX_PER_PERSON = 2;

const STATE_KEYS: Record<ShowId, string> = {
  "midnight-something-special": "midnight-something-special:state",
  "hooks-harmony": "hooks-harmony:state",
};

function defaultStateFor(showId: ShowId): ShowState {
  if (showId === "hooks-harmony") {
    return {
      nowPlaying: { title: "Waiting on the first request...", artist: "" },
      lastPlayed: null,
      queue: [],
      history: [],
      episodes: [],
      submitterCounts: {},
    };
  }
  return {
    nowPlaying: { title: "Le Freak", artist: "Chic" },
    lastPlayed: { title: "September", artist: "Earth, Wind & Fire" },
    queue: [],
    history: [],
    episodes: [],
    submitterCounts: {},
  };
}

export function insertTippedRequest(queue: Request[], req: Request): Request[] {
  const firstNonTippedIndex = queue.findIndex((r) => !r.tipped);
  if (firstNonTippedIndex === -1) {
    return [...queue, req];
  }
  return [...queue.slice(0, firstNonTippedIndex), req, ...queue.slice(firstNonTippedIndex)];
}

const memoryStates: Partial<Record<ShowId, ShowState>> = {};

async function getStoreSafe() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore("show-state");
  } catch {
    return null;
  }
}

export async function getState(showId: ShowId): Promise<ShowState> {
  const store = await getStoreSafe();
  const key = STATE_KEYS[showId];
  if (store) {
    try {
      const raw = await store.get(key);
      if (raw) {
        const parsed = JSON.parse(raw) as ShowState;
        if (!parsed.history) parsed.history = [];
        if (!parsed.episodes) parsed.episodes = [];
        if (!parsed.submitterCounts) parsed.submitterCounts = {};
        if (parsed.theme === undefined) parsed.theme = "";
        return parsed;
      }
    } catch {
      // fall through to default below
    }
    return defaultStateFor(showId);
  }
  return memoryStates[showId] ?? defaultStateFor(showId);
}

export async function setState(showId: ShowId, state: ShowState): Promise<void> {
  const store = await getStoreSafe();
  const key = STATE_KEYS[showId];
  if (store) {
    await store.set(key, JSON.stringify(state));
    return;
  }
  memoryStates[showId] = state;
}
