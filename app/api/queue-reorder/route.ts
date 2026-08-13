import { NextResponse } from "next/server";
import { getState, setState } from "../../../lib/state";

export async function POST(req: Request) {
  const body = await req.json();
  const order = body.order;

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order must be an array" }, { status: 400 });
  }

  const state = await getState();
  state.queue = order;
  await setState(state);

  return NextResponse.json({ ok: true, state });
}
