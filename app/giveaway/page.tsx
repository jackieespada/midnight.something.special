"use client";

import { useEffect, useMemo, useState } from "react";

type Level = { min: number; name: string; emoji: string };
type Status = {
  name: string;
  nickname: string;
  refCode: string;
  substack: boolean;
  telegram: boolean;
  wordsUsed: number;
  referralCount: number;
  breakdown: { base: number; substack: number; telegram: number; words: number; referrals: number; bonus: number; total: number };
  level: Level;
  nextLevel: Level | null;
  disqualified: boolean;
  open: boolean;
};
type Board = {
  title: string;
  opensAt: number;
  closesAt: number;
  drawText: string;
  prizes: string[];
  brands: string;
  entrantCount: number;
  totalEntries: number;
  top: { nickname: string; total: number; level: Level }[];
  winners: { nickname: string; prize: string }[];
};

const SUBSTACK_URL = "https://jackieespada.substack.com";
const TELEGRAM_URL = "https://t.me/JackieEspada";
const MAX_WORDS = 5;
const MAX_FRIENDS = 5;

function remember(email: string) {
  try { localStorage.setItem("giveaway-email", email); } catch {}
}
function recall(): string {
  try { return localStorage.getItem("giveaway-email") || ""; } catch { return ""; }
}

function countdown(ms: number) {
  if (ms <= 0) return "0d 0h 0m";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

export default function GiveawayPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [now, setNow] = useState(Date.now());
  const [telegramUrl, setTelegramUrl] = useState(TELEGRAM_URL);

  const [mode, setMode] = useState<"enter" | "check">("enter");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [adult, setAdult] = useState(false);
  const [us, setUs] = useState(false);
  const [rules, setRules] = useState(false);
  const [substack, setSubstack] = useState(false);
  const [telegram, setTelegram] = useState(false);
  const [ref, setRef] = useState("");
  const [honey, setHoney] = useState("");

  const [status, setStatus] = useState<Status | null>(null);
  const [myEmail, setMyEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [word, setWord] = useState("");
  const [wordMsg, setWordMsg] = useState("");
  const [copied, setCopied] = useState(false);

  function loadBoard() {
    fetch("/api/giveaway/leaderboard", { cache: "no-store" }).then((r) => r.json()).then(setBoard).catch(() => {});
  }

  useEffect(() => {
    loadBoard();
    const t = setInterval(() => setNow(Date.now()), 1000);
    const b = setInterval(loadBoard, 30000);
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) setRef(r.toUpperCase());
    fetch("/api/site/state", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        const l = (d.links || []).find((x: { label: string; url: string }) => x.label.toLowerCase().includes("telegram"));
        if (l) setTelegramUrl(l.url);
      })
      .catch(() => {});
    const saved = recall();
    if (saved) lookup(saved, true);
    return () => { clearInterval(t); clearInterval(b); };
  }, []);

  async function lookup(e: string, quiet = false) {
    setBusy(true);
    try {
      const res = await fetch("/api/giveaway/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
        setMyEmail(e);
        remember(e);
        setMsg("");
      } else if (!quiet) {
        setMsg(data.error || "Something went wrong.");
      }
    } catch {
      if (!quiet) setMsg("Something went wrong. Try again in a moment.");
    }
    setBusy(false);
  }

  async function enter() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/giveaway/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname, email, adult, us, rules, substack, telegram, ref, website: honey }),
      });
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
        setMyEmail(email);
        remember(email);
        if (data.alreadyEntered) setMsg("You're already in! Here are your entries.");
        loadBoard();
      } else {
        setMsg(data.error || "Something went wrong.");
      }
    } catch {
      setMsg("Something went wrong. Try again in a moment.");
    }
    setBusy(false);
  }

  async function claim(field: "substack" | "telegram") {
    const res = await fetch("/api/giveaway/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: myEmail, [field]: true }),
    });
    const data = await res.json();
    if (data.status) { setStatus(data.status); loadBoard(); }
  }

  async function redeemWord() {
    setWordMsg("");
    const res = await fetch("/api/giveaway/word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: myEmail, word }),
    });
    const data = await res.json();
    if (data.status) {
      setStatus(data.status);
      setWord("");
      setWordMsg("🎉 +1 entry! See you at the next show.");
      loadBoard();
    } else {
      setWordMsg(data.error || "That didn't work.");
    }
  }

  const shareLink = useMemo(
    () => (status && typeof window !== "undefined" ? `${window.location.origin}/giveaway?ref=${status.refCode}` : ""),
    [status]
  );

  function copyLink() {
    try {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const notYet = board && now < board.opensAt;
  const closed = board && now >= board.closesAt;

  const progress = status?.nextLevel
    ? Math.min(100, Math.round(((status.breakdown.total - status.level.min) / (status.nextLevel.min - status.level.min)) * 100))
    : 100;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <a href="/" style={S.back}>‹ Back to jackieespada.com</a>

        <header style={S.header}>
          <div style={S.kicker}>FREE HOLIDAY GIVEAWAY</div>
          <h1 style={S.h1}>{board?.title || "12 Days of Christmas with Jackie"}</h1>
          <p style={S.lead}>Free to enter. Earn bonus entries all 12 days. Winners drawn {board?.drawText || "live on the show"}.</p>
          {board && (
            <div style={S.countdown}>
              {notYet && <>Entries open in <b>{countdown(board.opensAt - now)}</b></>}
              {!notYet && !closed && <>Entries close in <b>{countdown(board.closesAt - now)}</b></>}
              {closed && <>Entries are closed. Thanks for playing! 💜</>}
            </div>
          )}
          {board && (
            <div style={S.stats}>
              <div><b style={{ fontSize: 22, color: "#fff", display: "block" }}>{board.entrantCount}</b><span>players</span></div>
              <div><b style={{ fontSize: 22, color: "#fff", display: "block" }}>{board.totalEntries}</b><span>total entries</span></div>
            </div>
          )}
        </header>

        {board && board.winners.length > 0 && (
          <section style={S.card}>
            <div style={S.title}>🏆 Winners</div>
            {board.winners.map((w, i) => (
              <div key={i} style={S.row}><b>{w.nickname}</b><span style={S.muted}>{w.prize}</span></div>
            ))}
          </section>
        )}

        <section style={S.card}>
          <div style={S.title}>🎁 The prizes</div>
          {(board?.prizes || []).map((p, i) => <div key={i} style={S.prize}>{p}</div>)}
          {board?.brands && <p style={S.small}>{board.brands}</p>}
        </section>

        {status ? (
          <section style={{ ...S.card, borderColor: "#ff3fa4" }}>
            <div style={S.title}>Your entries, {status.nickname}</div>
            {status.disqualified && <p style={{ color: "#ff3fa4" }}>This entry isn't eligible. Reach out to Jackie if you think that's a mistake.</p>}
            <div style={S.bigRow}>
              <div style={S.big}>{status.breakdown.total}</div>
              <div>
                <div style={S.levelPill}>{status.level.emoji} {status.level.name}</div>
                <div style={S.small}>
                  {status.nextLevel
                    ? `${status.nextLevel.min - status.breakdown.total} more to ${status.nextLevel.emoji} ${status.nextLevel.name}`
                    : "Top level unlocked. You're a legend!"}
                </div>
              </div>
            </div>
            <div style={S.bar}><div style={{ ...S.barFill, width: `${progress}%` }} /></div>

            <div style={S.quest}>
              <Check done /> <span style={S.qText}>Entered the giveaway</span><span style={S.pts}>+1</span>
            </div>

            <div style={S.quest}>
              <Check done={status.substack} />
              <span style={S.qText}>
                Subscribe free on <a href={SUBSTACK_URL} target="_blank" rel="noreferrer" style={S.link}>Substack</a>
              </span>
              {status.substack ? <span style={S.pts}>+1</span> : status.open && <button style={S.mini} onClick={() => claim("substack")}>I did it</button>}
            </div>

            <div style={S.quest}>
              <Check done={status.telegram} />
              <span style={S.qText}>
                Join the{" "}
                {telegramUrl ? <a href={telegramUrl} target="_blank" rel="noreferrer" style={S.link}>Telegram group</a> : "Telegram group"}
              </span>
              {status.telegram ? <span style={S.pts}>+1</span> : status.open && <button style={S.mini} onClick={() => claim("telegram")}>I did it</button>}
            </div>

            <div style={S.quest}>
              <Check done={status.wordsUsed >= MAX_WORDS} />
              <span style={S.qText}>Secret words from live shows ({status.wordsUsed}/{MAX_WORDS})</span>
              <span style={S.pts}>+{status.breakdown.words}</span>
            </div>
            {status.open && status.wordsUsed < MAX_WORDS && (
              <div style={{ display: "flex", gap: 8, margin: "4px 0 10px 34px" }}>
                <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Tonight's secret word" style={{ ...S.input, marginTop: 0 }} />
                <button style={S.mini} onClick={redeemWord} disabled={!word.trim()}>Add</button>
              </div>
            )}
            {wordMsg && <div style={{ ...S.small, marginLeft: 34, color: wordMsg.startsWith("🎉") ? "#4dd9e8" : "#ff3fa4" }}>{wordMsg}</div>}

            <div style={S.quest}>
              <Check done={status.referralCount >= MAX_FRIENDS} />
              <span style={S.qText}>Bring a friend: +2 each ({status.referralCount}/{MAX_FRIENDS} friends)</span>
              <span style={S.pts}>+{status.breakdown.referrals}</span>
            </div>
            <div style={{ display: "flex", gap: 8, margin: "4px 0 6px 34px", alignItems: "center" }}>
              <input readOnly value={shareLink} style={{ ...S.input, marginTop: 0, fontSize: 12 }} onFocus={(e) => e.target.select()} />
              <button style={S.mini} onClick={copyLink}>{copied ? "Copied!" : "Copy"}</button>
            </div>
            <div style={{ ...S.small, marginLeft: 34 }}>Your friend counts when they enter with your link.</div>

            {status.breakdown.bonus !== 0 && (
              <div style={S.quest}><Check done /><span style={S.qText}>Bonus from Jackie</span><span style={S.pts}>{status.breakdown.bonus > 0 ? "+" : ""}{status.breakdown.bonus}</span></div>
            )}

            <button style={S.linkBtn} onClick={() => { setStatus(null); setMyEmail(""); try { localStorage.removeItem("giveaway-email"); } catch {} }}>
              Not you? Switch email
            </button>
          </section>
        ) : (
          <section style={S.card}>
            <div style={S.toggle}>
              <button style={mode === "enter" ? S.tabOn : S.tab} onClick={() => setMode("enter")}>Enter</button>
              <button style={mode === "check" ? S.tabOn : S.tab} onClick={() => setMode("check")}>Check my entries</button>
            </div>

            {mode === "enter" ? (
              notYet ? (
                <p style={S.muted}>Entries open December 1. Come back then and get in early! 🎄</p>
              ) : closed ? (
                <p style={S.muted}>Entries are closed. Thanks for playing!</p>
              ) : (
                <>
                  <input style={S.input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                  <input style={S.input} placeholder="Leaderboard nickname (optional)" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                  <input style={S.input} type="email" placeholder="Email (only used to contact winners)" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input style={{ display: "none" }} tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} name="website" />
                  {ref && <div style={S.small}>Invited by a friend (code {ref}) 💌</div>}

                  <div style={S.boxTitle}>Bonus entries (optional)</div>
                  <label style={S.check}><input type="checkbox" checked={substack} onChange={(e) => setSubstack(e.target.checked)} /> I subscribed free on <a href={SUBSTACK_URL} target="_blank" rel="noreferrer" style={S.link}>Substack</a> (+1)</label>
                  <label style={S.check}><input type="checkbox" checked={telegram} onChange={(e) => setTelegram(e.target.checked)} /> I joined the {telegramUrl ? <a href={telegramUrl} target="_blank" rel="noreferrer" style={S.link}>Telegram group</a> : "Telegram group"} (+1)</label>

                  <div style={S.boxTitle}>The fine print</div>
                  <label style={S.check}><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /> I'm 18 or older</label>
                  <label style={S.check}><input type="checkbox" checked={us} onChange={(e) => setUs(e.target.checked)} /> I live in the United States</label>
                  <label style={S.check}><input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} /> I agree to the <a href="/giveaway/rules" target="_blank" style={S.link}>official rules</a></label>

                  <button style={S.cta} onClick={enter} disabled={busy}>{busy ? "Entering..." : "Enter for FREE 🎁"}</button>
                </>
              )
            ) : (
              <>
                <input style={S.input} type="email" placeholder="The email you entered with" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button style={S.cta} onClick={() => lookup(email)} disabled={busy}>{busy ? "Looking..." : "Show my entries"}</button>
              </>
            )}
            {msg && <div style={{ color: "#ff3fa4", marginTop: 10, fontSize: 13 }}>{msg}</div>}
          </section>
        )}

        <section style={S.card}>
          <div style={S.title}>🏅 Leaderboard</div>
          {board && board.top.length > 0 ? (
            board.top.map((r, i) => (
              <div key={i} style={S.lbRow}>
                <span style={S.rank}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{r.nickname}</span>
                <span style={S.muted}>{r.level.emoji}</span>
                <span style={S.lbTotal}>{r.total}</span>
              </div>
            ))
          ) : (
            <p style={S.muted}>Be the first name on the board!</p>
          )}
          <p style={S.small}>More entries means more chances, not a guaranteed win. Every winner is picked at random.</p>
        </section>

        <section style={S.card}>
          <div style={S.title}>How to earn entries</div>
          <div style={S.how}><b>+1</b> Enter (free!)</div>
          <div style={S.how}><b>+1</b> Subscribe free on Substack</div>
          <div style={S.how}><b>+1</b> Join the Telegram group</div>
          <div style={S.how}><b>+1</b> Each secret word said on a live show (up to 5)</div>
          <div style={S.how}><b>+2</b> Each friend who enters with your link (up to 5 friends)</div>
          <p style={S.small}>
            No purchase necessary. Buying something, tipping, or being a VIP never adds entries. US residents 18+.
            Void where prohibited. See the <a href="/giveaway/rules" style={S.link}>official rules</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

function Check({ done }: { done?: boolean }) {
  return <span style={{ ...S.checkDot, background: done ? "#4dd9e8" : "transparent" }}>{done ? "✓" : ""}</span>;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    color: "#fdf6ff",
    fontFamily: "'Poppins', sans-serif",
    paddingBottom: 60,
    background:
      "radial-gradient(circle at 15% 10%, rgba(255,63,164,.30), transparent 40%), radial-gradient(circle at 85% 20%, rgba(77,217,232,.26), transparent 42%), linear-gradient(180deg, #160a2e, #2a0e3d)",
  },
  wrap: { maxWidth: 640, margin: "0 auto", padding: "0 18px" },
  back: { display: "inline-block", marginTop: 18, color: "#c9b8e0", fontSize: 13, textDecoration: "none" },
  header: { textAlign: "center", padding: "26px 0 10px" },
  kicker: { fontSize: 12, letterSpacing: ".2em", color: "#4dd9e8", fontWeight: 700 },
  h1: {
    margin: "8px 0", fontSize: 34, lineHeight: 1.15, fontWeight: 800,
    background: "linear-gradient(90deg,#ff3fa4,#4dd9e8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
  },
  lead: { color: "#c9b8e0", fontSize: 14.5, margin: "0 auto", maxWidth: 460, lineHeight: 1.55 },
  countdown: {
    display: "inline-block", marginTop: 16, padding: "10px 18px", borderRadius: 999,
    background: "rgba(255,63,164,.16)", border: "1px solid rgba(255,63,164,.5)", fontSize: 14,
  },
  stats: { display: "flex", justifyContent: "center", gap: 28, marginTop: 16, fontSize: 12, color: "#c9b8e0" },
  card: {
    marginTop: 18, background: "rgba(0,0,0,.28)", border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 18, padding: "18px 18px",
  },
  title: { fontSize: 13, textTransform: "uppercase", letterSpacing: ".14em", color: "#4dd9e8", fontWeight: 700, marginBottom: 12 },
  prize: { padding: "10px 12px", background: "rgba(255,255,255,.06)", borderRadius: 12, marginBottom: 8, fontSize: 14 },
  small: { fontSize: 12, color: "#c9b8e0", marginTop: 8, lineHeight: 1.5 },
  muted: { color: "#c9b8e0", fontSize: 13 },
  row: { display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", fontSize: 14 },
  toggle: { display: "flex", gap: 8, marginBottom: 12 },
  tab: { flex: 1, padding: 9, borderRadius: 999, border: "1px solid rgba(255,255,255,.18)", background: "transparent", color: "#c9b8e0", cursor: "pointer", fontFamily: "inherit" },
  tabOn: { flex: 1, padding: 9, borderRadius: 999, border: "none", background: "#ff3fa4", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  input: {
    width: "100%", boxSizing: "border-box", marginTop: 8, padding: "11px 13px", borderRadius: 12,
    border: "1px solid rgba(255,255,255,.18)", background: "rgba(0,0,0,.3)", color: "#fdf6ff", fontSize: 14, fontFamily: "inherit",
  },
  boxTitle: { marginTop: 16, fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#ff9fd2" },
  check: { display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, marginTop: 8 },
  link: { color: "#4dd9e8" },
  cta: {
    width: "100%", marginTop: 16, padding: "13px 0", borderRadius: 999, border: "none", fontWeight: 700, fontSize: 15,
    color: "#fff", background: "linear-gradient(90deg,#ff3fa4,#b24bff)", cursor: "pointer", fontFamily: "inherit",
  },
  bigRow: { display: "flex", alignItems: "center", gap: 16 },
  big: { fontSize: 54, fontWeight: 800, lineHeight: 1, color: "#fff" },
  levelPill: { display: "inline-block", padding: "4px 12px", borderRadius: 999, background: "#e8a13c", color: "#1a0f08", fontWeight: 800, fontSize: 13 },
  bar: { height: 10, borderRadius: 999, background: "rgba(255,255,255,.1)", margin: "14px 0 16px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff3fa4,#4dd9e8)", transition: "width .4s" },
  quest: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,.07)" },
  qText: { flex: 1, fontSize: 14 },
  pts: { fontWeight: 800, color: "#4dd9e8", fontSize: 14 },
  checkDot: {
    width: 24, height: 24, borderRadius: "50%", border: "2px solid #4dd9e8", display: "inline-flex",
    alignItems: "center", justifyContent: "center", fontSize: 13, color: "#160a2e", fontWeight: 800, flexShrink: 0,
  },
  mini: {
    padding: "7px 14px", borderRadius: 999, border: "none", background: "#4dd9e8", color: "#160a2e",
    fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  },
  linkBtn: { marginTop: 14, background: "none", border: "none", color: "#c9b8e0", fontSize: 12, textDecoration: "underline", cursor: "pointer", padding: 0 },
  lbRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderTop: "1px solid rgba(255,255,255,.07)" },
  rank: { width: 30, textAlign: "center", fontWeight: 700, color: "#c9b8e0" },
  lbTotal: { minWidth: 34, textAlign: "right", fontWeight: 800, color: "#4dd9e8" },
  how: { display: "flex", gap: 12, padding: "6px 0", fontSize: 14 },
};
