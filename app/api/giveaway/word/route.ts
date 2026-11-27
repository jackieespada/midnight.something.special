import { NextResponse } from "next/server";
import { getSettings, getEntrant, saveEntrant, emailKeyFor, isOpen, publicStatus, MAX_WORD_ENTRIES } from "@/lib/giveaway";

export const dynamic = "force-dynamic";

// Redeem the secret word said on a live show.
export async function POST(req: Request) {
  const body = await req.json();
  const email = (body.email || "").toString();
  const guess = (body.word || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
  if (!guess) return NextResponse.json({ error: "Type the secret word from the show." }, { status: 400 });

  const settings = await getSettings();
  if (!isOpen(settings)) return NextResponse.json({ error: "Entries are closed right now." }, { status: 400 });

  const e = await getEntrant(await emailKeyFor(email));
  if (!e) return NextResponse.json({ error: "Enter the giveaway first, then add your secret words." }, { status: 404 });

  const match = settings.words.find((w) => w.active && w.word.trim().toLowerCase() === guess);
  if (!match) return NextResponse.json({ error: "Hmm, that's not tonight's word. Listen close!" }, { status: 400 });
  if (e.wordsRedeemed.includes(match.id)) {
    return NextResponse.json({ error: "You already used that one. Catch the next show for a new word!" }, { status: 400 });
  }
  if (e.wordsRedeemed.length >= MAX_WORD_ENTRIES) {
    return NextResponse.json({ error: `You've maxed out your ${MAX_WORD_ENTRIES} secret word entries. Overachiever!` }, { status: 400 });
  }

  e.wordsRedeemed.push(match.id);
  await saveEntrant(e);
  return NextResponse.json({ ok: true, status: publicStatus(e, settings) });
}
