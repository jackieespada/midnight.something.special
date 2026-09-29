import { NextResponse } from "next/server";
import { getSiteState, setSiteState } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware). Saves the URL of an already-hosted
// photo (Imgur, Google Drive share link, etc.) — this doesn't store the
// image itself, just the link to it.
export async function POST(req: Request) {
  const body = await req.json();
  const photoUrl = (body.photoUrl || "").toString().trim();
  const state = await getSiteState();
  state.photoUrl = photoUrl;
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
