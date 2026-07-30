import { NextResponse } from "next/server";
import { getState } from "../../../../lib/state";

const SHOW = "hooks-harmony" as const;

export async function GET() {
  const state = await getState(SHOW);
  return NextResponse.json(state);
}
