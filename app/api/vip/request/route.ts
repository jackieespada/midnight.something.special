import { NextResponse } from "next/server";
import { getState, setState, insertVipRequest, ShowId } from "@/lib/state";
import { makeId } from "@/lib/api-handlers";
import { getVipStatus, addUsage } from "@/lib/vip";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const showId: ShowId = body.show === "hooks-harmony" ? "hooks-harmony" : "midnight-something-special";
  const title = (body.title || "").toString().trim();
  const artist = (body.artist || "").toString().trim();
  const name = (body.name || "").toString().trim();
  const message = (body.message || "").toString().trim().slice(0, 200);
  const videoUrl = (body.videoUrl || "").toString().trim().slice(0, 500);
  const email = (body.email || "").toString().trim();

  if (!title || !artist) {
    return NextResponse.json({ error: "Song and artist are required." }, { status: 400 });
  }

  const status = await getVipStatus(email);
  if (!status.ok) {
    return NextResponse.json({ error: status.error }, { status: 400 });
  }
  if (status.left <= 0) {
    return NextResponse.json(
      { error: "You've used all 3 of your priority requests this month. They reset on the 1st!" },
      { status: 400 }
    );
  }

  const state = await getState(showId);
  if (state.requestsOpen === false) {
    return NextResponse.json({ error: "Requests are closed for tonight." }, { status: 400 });
  }

  state.queue = insertVipRequest(state.queue, {
    id: makeId(),
    title,
    artist,
    name: name || undefined,
    message: message || undefined,
    videoUrl: videoUrl || undefined,
    ts: Date.now(),
    vip: true,
  });
  await setState(showId, state);
  await addUsage(email.toLowerCase());

  return NextResponse.json({ ok: true, left: status.left - 1, tier: status.tier });
}
