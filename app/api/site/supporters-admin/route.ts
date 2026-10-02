import { NextResponse } from "next/server";
import { getSiteState, setSiteState } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware). Lists supporters and lets Jackie
// delete one (e.g. spam or something inappropriate in the message).

export async function GET() {
  const state = await getSiteState();
  const supporters = [...state.supporters].sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ supporters });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id } = body as { id: string };
  const state = await getSiteState();
  state.supporters = state.supporters.filter((s) => s.id !== id);
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
