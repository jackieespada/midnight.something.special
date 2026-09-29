import { NextResponse } from "next/server";
import { getSiteState, setSiteState, CalendarEntry } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware). Same pattern as /api/site/links —
// replaces the whole calendar list at once.
export async function POST(req: Request) {
  const body = await req.json();
  const calendar = body.calendar as CalendarEntry[];
  if (!Array.isArray(calendar)) {
    return NextResponse.json({ error: "calendar must be an array" }, { status: 400 });
  }
  const state = await getSiteState();
  state.calendar = calendar;
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
