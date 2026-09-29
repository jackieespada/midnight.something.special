import { NextResponse } from "next/server";
import { getSiteState, setSiteState, AffiliateItem } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware). Same pattern again — replaces the
// whole affiliates list. This is what lets Jackie add/remove sponsors
// from the "Shop My Favorites" page without touching code.
export async function POST(req: Request) {
  const body = await req.json();
  const affiliates = body.affiliates as AffiliateItem[];
  if (!Array.isArray(affiliates)) {
    return NextResponse.json({ error: "affiliates must be an array" }, { status: 400 });
  }
  const state = await getSiteState();
  state.affiliates = affiliates;
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
