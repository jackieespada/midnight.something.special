import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/state";

export async function POST() {
  const state = await getState();
  const next = state.queue.shift();

  if (!next) {
    return NextResponse.json({ error: "queue is empty" }, { status: 400 });
  }

  state.lastPlayed = state.nowPlaying;
  state.nowPlaying = { title: next.title, artist: next.artist };
  await setState(state);

  return NextResponse.json({ ok: true, state });
}
