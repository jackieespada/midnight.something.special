import { NextResponse } from "next/server";
import { getState, setState } from "../../../lib/state";

export async function POST(req: Request) {
  const body = await req.json();
  const index = Number(body.index);

  const state = await getState();

  if (Number.isNaN(index) || index < 0 || index >= state.queue.length) {
    return NextResponse.json({ error: "Invalid queue position." }, { status: 400 });
  }

  const [item] = state.queue.splice(index, 1);
  item.tipped = true;
  if (!item.tipCents) item.tipCents = 0;
  state.queue.unshift(item);

  await setState(state);

  return NextResponse.json({ ok: true, state });
}
