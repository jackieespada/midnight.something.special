import { NextResponse } from "next/server";
import { getSiteState, setSiteState, makeSiteId } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Public endpoint — anyone visiting the site can submit a suggestion.
// Reading the list back happens on a separate, protected route
// (/api/site/suggestions-admin) so this one can stay open without exposing
// what other people have submitted.
export async function POST(req: Request) {
  const body = await req.json();
  const text = (body.text || "").toString().trim();
  const name = (body.name || "").toString().trim();
  if (!text) {
    return NextResponse.json({ error: "Suggestion can't be empty." }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: "That's a bit long — try trimming it down." }, { status: 400 });
  }
  const state = await getSiteState();
  state.suggestions.push({
    id: makeSiteId(),
    text,
    name: name || undefined,
    ts: Date.now(),
    read: false,
  });
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
