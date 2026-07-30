import { NextResponse } from "next/server";
import { getState, setState } from "../../../../lib/state";

const SHOW = "hooks-harmony" as const;

export async function POST(req: Request) {
  const body = await req.json();
  const title = (body.title || "").toString().trim();
  const artist = (body.artist || "").toString().trim();
  const state = await getState(SHOW);
  state.nowPlaying = {
    title: title || state.nowPlaying.title,
    artist: artist || state.nowPlaying.artist,
  };
  await setState(SHOW, state);
  return NextResponse.json({ ok: true, state });
}
