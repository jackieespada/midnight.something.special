import { NextResponse } from "next/server";
import { getState, setState } from "../../../lib/state";

export async function POST() {
  const state = await getState();
  const next = state.queue.shift();

  if (!next) {
    return NextResponse.json({ error: "queue is empty" }, { status: 400 });
  }

  // Log the song that was just playing into this episode's history
  if (state.nowPlaying?.title) {
    state.history.push({
      title: state.nowPlaying.title,
      artist: state.nowPlaying.artist,
      name: state.nowPlaying.name,
      ts: Date.now(),
    });
  }

  state.lastPlayed = state.nowPlaying;
  state.nowPlaying = {
    title: next.title,
    artist: next.artist,
    name: next.name,
    message: next.message,
  };
  await setState(state);

  return NextResponse.json({ ok: true, state });
}
