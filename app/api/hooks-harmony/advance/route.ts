import { NextResponse } from "next/server";
import { getState, setState } from "../../../../lib/state";

const SHOW = "hooks-harmony" as const;

export async function POST() {
  const state = await getState(SHOW);
  const next = state.queue.shift();
  if (!next) {
    return NextResponse.json({ error: "queue is empty" }, { status: 400 });
  }
  if (state.nowPlaying?.title) {
    state.history.push({
      title: state.nowPlaying.title,
      artist: state.nowPlaying.artist,
      name: state.nowPlaying.name,
      videoLink: state.nowPlaying.videoLink,
      ts: Date.now(),
    });
  }
  state.lastPlayed = state.nowPlaying;
  state.nowPlaying = {
    title: next.title,
    artist: next.artist,
    name: next.name,
    message: next.message,
    videoLink: next.videoLink,
  };
  await setState(SHOW, state);
  return NextResponse.json({ ok: true, state });
}
