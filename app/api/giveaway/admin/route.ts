import { NextResponse } from "next/server";
import {
  getSettings, saveSettings, allEntrants, getEntrant, saveEntrant, deleteEntrant, breakdown, makeId, GiveawaySettings,
} from "@/lib/giveaway";

export const dynamic = "force-dynamic";

// Admin-only (protected by middleware).
export async function GET() {
  const settings = await getSettings();
  const entrants = (await allEntrants())
    .map((e) => ({ ...e, breakdown: breakdown(e) }))
    .sort((a, b) => b.breakdown.total - a.breakdown.total || a.createdAt - b.createdAt);
  return NextResponse.json({ settings, entrants });
}

function pickWeighted<T extends { weight: number }>(items: T[]): T | null {
  const total = items.reduce((n, i) => n + i.weight, 0);
  if (total <= 0) return null;
  const r = new Uint32Array(1);
  crypto.getRandomValues(r);
  let ticket = (r[0] / 2 ** 32) * total;
  for (const i of items) {
    if (ticket < i.weight) return i;
    ticket -= i.weight;
  }
  return items[items.length - 1];
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = (body.action || "").toString();
  const settings = await getSettings();

  if (action === "saveSettings") {
    const s = body.settings as Partial<GiveawaySettings>;
    const next: GiveawaySettings = {
      ...settings,
      title: (s.title ?? settings.title).toString().slice(0, 80),
      opensAt: Number(s.opensAt) || settings.opensAt,
      closesAt: Number(s.closesAt) || settings.closesAt,
      drawText: (s.drawText ?? settings.drawText).toString().slice(0, 160),
      prizes: Array.isArray(s.prizes) ? s.prizes.map((p) => p.toString().slice(0, 160)).filter(Boolean) : settings.prizes,
      sponsorName: (s.sponsorName ?? settings.sponsorName).toString().slice(0, 120),
      sponsorAddress: (s.sponsorAddress ?? settings.sponsorAddress).toString().slice(0, 200),
      brands: (s.brands ?? settings.brands).toString().slice(0, 300),
    };
    await saveSettings(next);
    return NextResponse.json({ ok: true, settings: next });
  }

  if (action === "addWord") {
    const word = (body.word || "").toString().trim().slice(0, 40);
    const label = (body.label || "").toString().trim().slice(0, 80);
    if (!word) return NextResponse.json({ error: "Type a word." }, { status: 400 });
    if (settings.words.some((w) => w.word.toLowerCase() === word.toLowerCase())) {
      return NextResponse.json({ error: "You already used that word." }, { status: 400 });
    }
    settings.words.push({ id: makeId(), word, label, addedAt: Date.now(), active: true });
    await saveSettings(settings);
    return NextResponse.json({ ok: true, settings });
  }

  if (action === "toggleWord") {
    const w = settings.words.find((x) => x.id === body.id);
    if (w) w.active = !w.active;
    await saveSettings(settings);
    return NextResponse.json({ ok: true, settings });
  }

  if (action === "adjust") {
    const e = await getEntrant((body.emailKey || "").toString());
    if (!e) return NextResponse.json({ error: "Entrant not found." }, { status: 404 });
    if (typeof body.bonus === "number") e.bonus = Math.max(-50, Math.min(50, Math.round(body.bonus)));
    if (typeof body.disqualified === "boolean") e.disqualified = body.disqualified;
    if (typeof body.nickname === "string") e.nickname = body.nickname.trim().slice(0, 24) || e.nickname;
    // Fact-checking: setting either one also marks it as checked.
    if (typeof body.substack === "boolean") { e.substack = body.substack; e.substackChecked = true; }
    if (typeof body.telegram === "boolean") { e.telegram = body.telegram; e.telegramChecked = true; }
    await saveEntrant(e);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const e = await getEntrant((body.emailKey || "").toString());
    if (!e) return NextResponse.json({ error: "Entrant not found." }, { status: 404 });
    // Take back the referral credit they gave someone, if any.
    if (e.referredBy) {
      for (const other of await allEntrants()) {
        if (other.referrals.includes(e.emailKey)) {
          other.referrals = other.referrals.filter((k) => k !== e.emailKey);
          await saveEntrant(other);
        }
      }
    }
    await deleteEntrant(e);
    return NextResponse.json({ ok: true });
  }

  if (action === "draw") {
    const prize = (body.prize || "").toString().slice(0, 160);
    const already = new Set(settings.winners.map((w) => w.emailKey));
    const pool = (await allEntrants())
      .filter((e) => !e.disqualified && !already.has(e.emailKey))
      .map((e) => ({ e, weight: breakdown(e).total }));
    const picked = pickWeighted(pool);
    if (!picked) return NextResponse.json({ error: "No eligible entrants left." }, { status: 400 });
    settings.winners.push({
      emailKey: picked.e.emailKey,
      nickname: picked.e.nickname,
      name: picked.e.name,
      email: picked.e.email,
      prize,
      drawnAt: Date.now(),
    });
    await saveSettings(settings);
    return NextResponse.json({ ok: true, winner: settings.winners[settings.winners.length - 1], settings });
  }

  if (action === "removeWinner") {
    settings.winners = settings.winners.filter((w) => w.emailKey !== body.emailKey);
    await saveSettings(settings);
    return NextResponse.json({ ok: true, settings });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
