import { NextResponse } from "next/server";
import { getState, setState } from "../../../../lib/state";

const SHOW = "hooks-harmony" as const;

export async function POST() {
  const state = await getState(SHOW);
  if (state.history.length > 0) {
    const date = new Date().toISOString().slice(0, 10);
    state.episodes.unshift({ date, songs: state.history });
  }
  state.history = [];
  await setState(SHOW, state);
  return NextResponse.json({ ok: true, state });
}
