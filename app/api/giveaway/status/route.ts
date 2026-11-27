import { NextResponse } from "next/server";
import { getSettings, getEntrant, saveEntrant, emailKeyFor, isOpen, publicStatus } from "@/lib/giveaway";

export const dynamic = "force-dynamic";

// Look up your entries by email. Also lets someone check the Substack or
// Telegram box later if they join after entering.
export async function POST(req: Request) {
  const body = await req.json();
  const email = (body.email || "").toString();
  if (!email.includes("@")) return NextResponse.json({ error: "Enter the email you entered with." }, { status: 400 });

  const settings = await getSettings();
  const e = await getEntrant(await emailKeyFor(email));
  if (!e) return NextResponse.json({ error: "We couldn't find an entry for that email yet." }, { status: 404 });

  let changed = false;
  if (isOpen(settings)) {
    if (body.substack === true && !e.substack) { e.substack = true; changed = true; }
    if (body.telegram === true && !e.telegram) { e.telegram = true; changed = true; }
  }
  if (changed) await saveEntrant(e);

  return NextResponse.json({ ok: true, status: publicStatus(e, settings) });
}
