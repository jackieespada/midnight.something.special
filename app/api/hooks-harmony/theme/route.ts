import { NextResponse } from "next/server";
import { getState, setState } from "../../../../lib/state";

const SHOW = "hooks-harmony" as const;

export async function POST(req: Request) {
  const body = await req.json();
  const theme = (body.theme || "").toString().trim().slice(0, 80);
  const state = await getState(SHOW);
  state.theme = theme;
  await setState(SHOW, state);
  return NextResponse.json({ ok: true, state });
}
