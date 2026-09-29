import { NextResponse } from "next/server";
import { getSiteState, setSiteState, LinkItem } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware). Replaces the whole links list with
// whatever the admin page sends — the admin page always sends the full,
// edited list back, not a single item.
export async function POST(req: Request) {
  const body = await req.json();
  const links = body.links as LinkItem[];
  if (!Array.isArray(links)) {
    return NextResponse.json({ error: "links must be an array" }, { status: 400 });
  }
  const state = await getSiteState();
  state.links = links;
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
