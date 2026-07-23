import { NextResponse } from "next/server";
import { getState, setState } from "../../../lib/state";

export async function POST() {
  const state = await getState();

  if (state.history.length > 0) {
    const date = new Date().toISOString().slice(0, 10);
    state.episodes.unshift({ date, songs: state.history });
  }

  state.history = [];
  await setState(state);

  return NextResponse.json({ ok: true, state });
}
