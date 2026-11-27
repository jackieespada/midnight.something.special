"use client";

import { useEffect, useState } from "react";

type Info = {
  title: string;
  opensAt: number;
  closesAt: number;
  drawText: string;
  prizes: string[];
  brands: string;
  sponsorName: string;
  sponsorAddress: string;
};

function et(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  }) + " ET";
}

export default function GiveawayRules() {
  const [i, setI] = useState<Info | null>(null);
  useEffect(() => {
    fetch("/api/giveaway/leaderboard", { cache: "no-store" }).then((r) => r.json()).then(setI).catch(() => {});
  }, []);
  if (!i) return <div style={S.page}><div style={S.wrap}>Loading...</div></div>;

  const sponsor = `${i.sponsorName}${i.sponsorAddress ? `, ${i.sponsorAddress}` : ""}`;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <a href="/giveaway" style={S.back}>‹ Back to the giveaway</a>
        <h1 style={S.h1}>Official Rules: {i.title}</h1>

        <p><b>NO PURCHASE OR PAYMENT OF ANY KIND IS NECESSARY TO ENTER OR WIN. A PURCHASE OR PAYMENT WILL NOT INCREASE YOUR CHANCES OF WINNING.</b> Void where prohibited.</p>

        <h2 style={S.h2}>1. Sponsor</h2>
        <p>This giveaway is sponsored by {sponsor} ("Sponsor"). {i.brands} The prize brands are not sponsors of this giveaway and are not responsible for it.</p>

        <h2 style={S.h2}>2. Who can enter</h2>
        <p>Open to legal residents of the 50 United States and D.C. who are 18 or older at the time of entry. Sponsor, its owner, and their immediate family and household members are not eligible.</p>

        <h2 style={S.h2}>3. Entry period</h2>
        <p>The giveaway begins {et(i.opensAt)} and ends {et(i.closesAt)}. Entries received outside this period will not count.</p>

        <h2 style={S.h2}>4. How to enter</h2>
        <p>Fill out the free entry form at jackieespada.com/giveaway for one (1) entry. Limit one entry form per person and per email address. Using multiple emails, fake identities, or automated tools will disqualify you.</p>
        <p>Optional free bonus entries: +1 for subscribing free to Jackie's Substack; +1 for joining Jackie's Telegram group; +1 for each secret word announced on a live show during the entry period and entered on the giveaway page (up to 5); and +2 for each new eligible person who enters using your referral link (up to 10 bonus entries). Bonus entries for Substack and Telegram are based on your honest confirmation and may be checked. No bonus entries are given for purchases, tips, song requests, memberships, reviews, or any other payment.</p>

        <h2 style={S.h2}>5. Prizes</h2>
        <ul>{i.prizes.map((p, n) => <li key={n}>{p}</li>)}</ul>
        <p>One prize per person. Prizes are awarded as is, with no cash alternative, and no substitution except by Sponsor if a prize becomes unavailable, in which case a prize of equal or greater value may be substituted. Winners are responsible for any taxes.</p>

        <h2 style={S.h2}>6. Winner selection</h2>
        <p>Winners will be chosen at random from all eligible entries, {i.drawText}. Each entry is one chance to win. Odds depend on the number of eligible entries received.</p>

        <h2 style={S.h2}>7. Notification and claiming</h2>
        <p>Winners will be announced on the show and contacted at the email they entered with. A winner must reply within 72 hours with a US shipping address, or the prize may be forfeited and an alternate winner chosen. Prizes ship within the United States only.</p>

        <h2 style={S.h2}>8. Privacy</h2>
        <p>Your email is used only to run this giveaway and contact winners. Your leaderboard nickname and entry count are shown publicly. Your email is never shown or sold.</p>

        <h2 style={S.h2}>9. General</h2>
        <p>Sponsor may disqualify anyone who tampers with the giveaway or breaks these rules, and may cancel or change the giveaway if it can't run as planned. By entering, you agree to these rules and Sponsor's decisions, which are final. This giveaway is not sponsored, endorsed, or administered by, or associated with, Substack, Telegram, Rumble, or any social media platform.</p>

        <h2 style={S.h2}>10. Winners list</h2>
        <p>To ask for the winners' names, contact Sponsor through jackieespada.com within 30 days after the drawing.</p>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg, #160a2e, #2a0e3d)", color: "#fdf6ff", fontFamily: "'Poppins', sans-serif", fontSize: 14.5, lineHeight: 1.6, paddingBottom: 60 },
  wrap: { maxWidth: 720, margin: "0 auto", padding: "0 18px" },
  back: { display: "inline-block", marginTop: 18, color: "#c9b8e0", fontSize: 13, textDecoration: "none" },
  h1: { fontSize: 26, margin: "18px 0 14px", color: "#fff" },
  h2: { fontSize: 15, marginTop: 22, color: "#4dd9e8", textTransform: "uppercase", letterSpacing: ".08em" },
};
