import { NextResponse } from "next/server";
import { getSiteState, setSiteState } from "@/lib/site-state";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware). Lists supporters and lets Jackie
// edit or delete one (e.g. spam or something inappropriate in the message).

export async function GET() {
  const state = await getSiteState();
  const supporters = [...state.supporters].sort((a, b) => b.ts - a.ts);
  return NextResponse.json({ supporters });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, action } = body as { id: string; action?: string };
  const state = await getSiteState();

  // Edit: fix a supporter's display name or message (for example someone who
  // signed up anonymously and later shares their name), or turn their
  // Founding VIP badge on or off by hand.
  if (action === "edit") {
    const s = state.supporters.find((x) => x.id === id);
    if (!s) return NextResponse.json({ error: "Supporter not found." }, { status: 404 });
    if (typeof body.name === "string") s.name = body.name.trim().slice(0, 60) || undefined;
    if (typeof body.message === "string") s.message = body.message.trim().slice(0, 300) || undefined;
    if (typeof body.founding === "boolean") s.founding = body.founding;
    await setSiteState(state);
    return NextResponse.json({ ok: true, supporter: s });
  }

  state.supporters = state.supporters.filter((s) => s.id !== id);
  await setSiteState(state);
  return NextResponse.json({ ok: true });
}
