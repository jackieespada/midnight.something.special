import { NextResponse } from "next/server";
import { getState, setState } from "../../../lib/state";

export async function POST(req: Request) {
  const body = await req.json();
  const title = (body.title || "").toString().trim();
  const artist = (body.artist || "").toString().trim();
  const name = (body.name || "").toString().trim();

  if (!title || !artist) {
    return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
  }

  const state = await getState();
  state.queue.push({ title, artist, name: name || undefined, ts: Date.now() });
  await setState(state);

  return NextResponse.json({ ok: true });
}
