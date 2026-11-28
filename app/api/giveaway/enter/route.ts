import { NextResponse } from "next/server";
import {
  getSettings, getEntrant, saveEntrant, lookupRef, saveRef, emailKeyFor, normalizeEmail,
  makeRefCode, isOpen, publicStatus, Entrant,
} from "@/lib/giveaway";

export const dynamic = "force-dynamic";

// Free entry. No purchase necessary, ever.
export async function POST(req: Request) {
  const body = await req.json();

  // Honeypot: real people never fill this hidden field.
  if (body.website) return NextResponse.json({ ok: true });

  const settings = await getSettings();
  if (Date.now() < settings.opensAt) {
    return NextResponse.json({ error: "Entries aren't open yet. Come back December 1!" }, { status: 400 });
  }
  if (!isOpen(settings)) {
    return NextResponse.json({ error: "Entries are closed. Thanks for playing!" }, { status: 400 });
  }

  const name = (body.name || "").toString().trim().slice(0, 60);
  const nickname = (body.nickname || "").toString().trim().slice(0, 24);
  const email = normalizeEmail((body.email || "").toString()).slice(0, 120);
  const refCode = (body.ref || "").toString().trim().toUpperCase().slice(0, 12);

  if (!name) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please add a valid email." }, { status: 400 });
  }
  if (!body.adult || !body.us || !body.rules) {
    return NextResponse.json(
      { error: "Please confirm you're 18+, live in the US, and agree to the official rules." },
      { status: 400 }
    );
  }

  const emailKey = await emailKeyFor(email);
  const existing = await getEntrant(emailKey);
  if (existing) {
    return NextResponse.json({ alreadyEntered: true, status: publicStatus(existing, settings) });
  }

  let code = makeRefCode();
  while (await lookupRef(code)) code = makeRefCode();

  const entrant: Entrant = {
    emailKey,
    email,
    name,
    nickname: nickname || `${name.split(" ")[0]} ${(name.split(" ")[1] || "").charAt(0)}`.trim(),
    refCode: code,
    substack: !!body.substack,
    telegram: !!body.telegram,
    telegramName: (body.telegramName || "").toString().trim().slice(0, 40) || undefined,
    wordsRedeemed: [],
    referrals: [],
    bonus: 0,
    createdAt: Date.now(),
  };

  // Credit the friend who referred them (never yourself, only once per new entrant).
  if (refCode) {
    const referrerKey = await lookupRef(refCode);
    if (referrerKey && referrerKey !== emailKey) {
      const referrer = await getEntrant(referrerKey);
      if (referrer && !referrer.referrals.includes(emailKey)) {
        referrer.referrals.push(emailKey);
        await saveEntrant(referrer);
        entrant.referredBy = refCode;
      }
    }
  }

  await saveEntrant(entrant);
  await saveRef(code, emailKey);
  return NextResponse.json({ ok: true, status: publicStatus(entrant, settings) });
}
