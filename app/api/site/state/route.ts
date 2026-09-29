import { NextResponse } from "next/server";
import { getSiteState } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Public read-only endpoint. Used by the landing page and the shop page.
// Suggestions are left out on purpose — those are only for Jackie to read,
// not for the public site to display.
export async function GET() {
  const state = await getSiteState();
  return NextResponse.json({
    links: state.links,
    calendar: state.calendar,
    affiliates: state.affiliates,
  });
}
