import { NextResponse } from "next/server";
import { getState } from "../../../lib/state";

export const dynamic = "force-dynamic";

const SHOW = "midnight-something-special" as const;

export async function GET() {
  const state = await getState(SHOW);
  return NextResponse.json(state);
}
