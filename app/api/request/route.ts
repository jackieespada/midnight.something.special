import { NextResponse } from "next/server";
import { getState, setState, MAX_QUEUE } from "../../../lib/state";

const SHOW = "midnight-something-special" as const;

export async function POST(req: Request) {
  const body = await req.json();
  const title = (body.title || "").toString().trim();
  const artist = (body.artist || "").toString().trim();
  const name = (body.name || "").toString().trim();
  const message = (body.message || "").toString().trim().slice(0, 200);
  if (!title || !artist) {
    return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
  }
  const state = await getState(SHOW);
  if (state.queue.length >= MAX_QUEUE) {
    return NextResponse.json(
      { error: "Requests are full for tonight — but you can still tip to jump the line!" },
      { status: 400 }
    );
  }
  state.queue.push({
    title,
    artist,
    name: name || undefined,
    message: message || undefined,
    ts: Date.now(),
  });
  await setState(SHOW, state);
  return NextResponse.json({ ok: true });
}
