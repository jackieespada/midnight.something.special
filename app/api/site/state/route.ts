import { NextResponse } from "next/server";
import { getSiteState } from "@/lib/site-state";
import { supporterIsFounding } from "@/lib/founding";

export const dynamic = "force-dynamic";

// Public read-only endpoint. Used by the landing page and the shop page.
// Suggestions are left out on purpose, and so are the private parts of each
// supporter (like a Producer's theme night idea). Only what the public
// wall needs goes out.
export async function GET() {
  const state = await getSiteState();
  return NextResponse.json({
    links: state.links,
    calendar: state.calendar,
    affiliates: state.affiliates,
    photoUrl: state.photoUrl,
    supporters: state.supporters.map((s) => ({
      id: s.id,
      name: s.name,
      message: s.message,
      amountCents: s.amountCents,
      tier: s.tier,
      ts: s.ts,
      founding: supporterIsFounding(s),
    })),
  });
}
