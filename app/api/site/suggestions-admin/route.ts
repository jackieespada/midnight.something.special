import { NextResponse } from "next/server";
import { getSiteState, setSiteState } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware). Reading and managing suggestions
// lives on its own path, separate from the public submit route, so
// middleware can protect just this one.

export async function GET() {
  const state = await getSiteState();
  // newest first
  const suggestions = [...state.suggestions].sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ suggestions });
}

export async function POST(req: Request) {
  // Used by the admin page to mark a suggestion as read, or to delete one.
  const body = await req.json();
  const { id, action } = body as { id: string; action: "read" | "delete" };
  const state = await getSiteState();
  if (action === "delete") {
    state.suggestions = state.suggestions.filter((s) => s.id !== id);
  } else if (action === "read") {
    const found = state.suggestions.find((s) => s.id === id);
    if (found) found.read = true;
  }
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
