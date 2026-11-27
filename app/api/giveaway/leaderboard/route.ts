import { NextResponse } from "next/server";
import { getSettings, allEntrants, breakdown, levelFor } from "@/lib/giveaway";

export const dynamic = "force-dynamic";

let cache: { at: number; body: unknown } | null = null;

// Public: top 10 by entries, nicknames only (never emails or full names),
// plus the public giveaway details for the page.
export async function GET() {
  if (cache && Date.now() - cache.at < 20_000) return NextResponse.json(cache.body);

  const settings = await getSettings();
  const entrants = (await allEntrants()).filter((e) => !e.disqualified);
  const ranked = entrants
    .map((e) => ({ nickname: e.nickname, total: breakdown(e).total, createdAt: e.createdAt }))
    .sort((a, b) => b.total - a.total || a.createdAt - b.createdAt);

  const body = {
    title: settings.title,
    opensAt: settings.opensAt,
    closesAt: settings.closesAt,
    drawText: settings.drawText,
    prizes: settings.prizes,
    brands: settings.brands,
    sponsorName: settings.sponsorName,
    sponsorAddress: settings.sponsorAddress,
    entrantCount: entrants.length,
    totalEntries: ranked.reduce((n, r) => n + r.total, 0),
    top: ranked.slice(0, 10).map((r) => ({ nickname: r.nickname, total: r.total, level: levelFor(r.total).current })),
    winners: settings.winners.map((w) => ({ nickname: w.nickname, prize: w.prize })),
  };
  cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
