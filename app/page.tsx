"use client";

import { useEffect, useState } from "react";
import type { LinkItem, CalendarEntry, Supporter } from "@/lib/site-state";

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOT_COLOR: Record<string, string> = {
  Sun: "pink", Mon: "purple", Tue: "purple", Wed: "pink", Thu: "pink", Fri: "cyan", Sat: "cyan",
};

export default function LandingPage() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [calView, setCalView] = useState<"week" | "month">("week");
  const [suggestText, setSuggestText] = useState("");
  const [suggestName, setSuggestName] = useState("");
  const [suggestStatus, setSuggestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [supAmount, setSupAmount] = useState("10");
  const [supName, setSupName] = useState("");
  const [supMessage, setSupMessage] = useState("");
  const [supStatus, setSupStatus] = useState<"idle" | "sending" | "error">("idle");

  useEffect(() => {
    fetch("/api/site/state", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setPhotoUrl(data.photoUrl || "");
        setLinks(data.links || []);
        setCalendar(
          (data.calendar || []).slice().sort(
            (a: CalendarEntry, b: CalendarEntry) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
          )
        );
        setSupporters(
          (data.supporters || []).slice().sort((a: Supporter, b: Supporter) => b.ts - a.ts)
        );
      });
  }, []);

  function formatSpecialDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  }

  async function sendSuggestion() {
    if (!suggestText.trim()) return;
    setSuggestStatus("sending");
    const res = await fetch("/api/site/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: suggestText, name: suggestName }),
    });
    if (res.ok) {
      setSuggestStatus("sent");
      setSuggestText("");
      setSuggestName("");
    } else {
      setSuggestStatus("error");
    }
  }

  async function startSupportCheckout() {
    const amount = Number(supAmount);
    if (!amount || amount < 1) {
      setSupStatus("error");
      return;
    }
    setSupStatus("sending");
    try {
      const res = await fetch("/api/site/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, name: supName, message: supMessage }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setSupStatus("error");
      }
    } catch {
      setSupStatus("error");
    }
  }

  const supportLinks = links.filter((l) => l.section === "support" && l.enabled);
  const socialLinks = links.filter((l) => l.section === "social" && l.enabled);
  const extraLinks = links.filter((l) => l.section === "extras" && l.enabled);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dowToEntries: Record<number, CalendarEntry[]> = {};
  const dateToEntries: Record<string, CalendarEntry[]> = {};
  calendar.forEach((entry) => {
    if (entry.date) {
      if (!dateToEntries[entry.date]) dateToEntries[entry.date] = [];
      dateToEntries[entry.date].push(entry);
    } else {
      const idx = DAY_ORDER.indexOf(entry.day);
      if (!dowToEntries[idx]) dowToEntries[idx] = [];
      dowToEntries[idx].push(entry);
    }
  });

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div
            style={{
              ...styles.avatar,
              ...(photoUrl
                ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}),
            }}
          />
          <h1 style={styles.h1}>Jackie Espada</h1>
          <p style={styles.headerP}>
            Bible study, music, and community — real talk, not a sermon. Pick a show below or send in a request.
          </p>

          {supportLinks.find((l) => l.label.toLowerCase().includes("stripe")) && (
            <a
              href={supportLinks.find((l) => l.label.toLowerCase().includes("stripe"))!.url}
              style={styles.stripeWidget}
            >
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>💜 Support the Show</div>
              <div style={{ fontSize: 12.5, opacity: 0.85, marginBottom: 14 }}>Quick, secure checkout — pick your amount</div>
              <span style={styles.stripeBtn}>Give a Tip</span>
            </a>
          )}

          <div style={styles.supportRow}>
            {supportLinks
              .filter((l) => !l.label.toLowerCase().includes("stripe"))
              .map((l) => (
                <a key={l.id} href={l.url} style={styles.supportBtn}>
                  {l.label}
                </a>
              ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Schedule</div>
          <div style={styles.calToggle}>
            <button
              onClick={() => setCalView("week")}
              style={calView === "week" ? styles.calToggleBtnActive : styles.calToggleBtn}
            >
              Week
            </button>
            <button
              onClick={() => setCalView("month")}
              style={calView === "month" ? styles.calToggleBtnActive : styles.calToggleBtn}
            >
              Month
            </button>
          </div>

          {calView === "week" && (
            <div style={styles.calendar}>
              {calendar.map((entry) => (
                <a
                  key={entry.id}
                  href={entry.linksTo || "#"}
                  style={{ ...styles.calRow, textDecoration: "none", color: "inherit" }}
                >
                  <div style={styles.calDay}>
                    {entry.date ? formatSpecialDate(entry.date) : entry.day.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14 }}>{entry.showName}</div>
                    {entry.note && <div style={styles.calNote}>{entry.note}</div>}
                  </div>
                  <div style={styles.calTime}>{entry.time}</div>
                </a>
              ))}
            </div>
          )}

          {calView === "month" && (
            <div style={styles.calendar}>
              <div style={{ padding: "14px 16px 4px", fontWeight: 700, fontSize: 15 }}>
                {monthNames[month]} {year}
              </div>
              <div style={styles.monthGrid}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} style={styles.dow}>{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={"e" + i} style={{ ...styles.dayCell, background: "transparent" }} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const dow = new Date(year, month, d).getDay();
                  const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
                  const entries = [...(dowToEntries[dow] || []), ...(dateToEntries[dateKey] || [])];
                  return (
                    <div key={d} style={styles.dayCell}>
                      <div style={styles.dayNum}>{d}</div>
                      {entries.length > 0 && (
                        <div style={styles.dotRow}>
                          {entries.map((e) => (
                            <span
                              key={e.id}
                              style={{ ...styles.dot, background: dotColorValue(DOT_COLOR[e.day]) }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={styles.legend}>
                {calendar.map((e) => (
                  <span key={e.id} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ ...styles.dot, background: dotColorValue(DOT_COLOR[e.day]) }} />
                    {e.showName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Become a Monthly Supporter</div>
          <div style={styles.suggestBox}>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#c9b8e0" }}>
              Pick your own monthly amount. You can cancel anytime from the email Stripe sends you.
              Your name and a short message can show up on the wall below (totally optional).
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>$</span>
              <input
                type="number"
                min={1}
                value={supAmount}
                onChange={(e) => setSupAmount(e.target.value)}
                style={{ ...styles.input, marginTop: 0, width: 100 }}
              />
              <span style={{ fontSize: 13, color: "#c9b8e0" }}>/ month</span>
            </div>
            <input
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              placeholder="Your name (optional)"
              style={styles.input}
            />
            <input
              value={supMessage}
              onChange={(e) => setSupMessage(e.target.value)}
              placeholder="A short message for the wall (optional)"
              style={styles.input}
            />
            <button onClick={startSupportCheckout} style={styles.suggestBtn} disabled={supStatus === "sending"}>
              {supStatus === "sending" ? "Redirecting to checkout..." : "Become a Supporter"}
            </button>
            {supStatus === "error" && (
              <div style={{ color: "#ff3fa4", marginTop: 8, fontSize: 12.5 }}>
                Enter an amount of at least $1 and try again.
              </div>
            )}
          </div>

          {supporters.length > 0 && (
            <div style={{ marginTop: 18 }}>
              {supporters.map((s) => (
                <div key={s.id} style={styles.supporterCard}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {s.name || "Anonymous"}{" "}
                    <span style={{ color: "#4dd9e8", fontWeight: 600 }}>
                      · ${(s.amountCents / 100).toFixed(0)}/mo
                    </span>
                  </div>
                  {s.message && (
                    <div style={{ fontSize: 13, color: "#c9b8e0", marginTop: 4 }}>{s.message}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Find Me Elsewhere</div>
          <div style={styles.socials}>
            {socialLinks.map((l) => (
              <a key={l.id} href={l.url} style={styles.socialBtn}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>More to Explore</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="/shop" style={styles.extraCard}>
              <span>🛍️ Shop My Favorites</span>
              <span>›</span>
            </a>
            {extraLinks.map((l) => (
              <a key={l.id} href={l.url} style={styles.extraCard}>
                <span>{l.label}</span>
                <span>›</span>
              </a>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Got an Idea?</div>
          <div style={styles.suggestBox}>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#c9b8e0" }}>
              Segment idea, song pick, question for the show — send it my way.
            </p>
            <textarea
              value={suggestText}
              onChange={(e) => setSuggestText(e.target.value)}
              placeholder="What's on your mind?"
              style={styles.textarea}
            />
            <input
              value={suggestName}
              onChange={(e) => setSuggestName(e.target.value)}
              placeholder="Your name (optional)"
              style={styles.input}
            />
            <button onClick={sendSuggestion} style={styles.suggestBtn} disabled={suggestStatus === "sending"}>
              {suggestStatus === "sending" ? "Sending..." : suggestStatus === "sent" ? "Sent! Thank you 💜" : "Send it in"}
            </button>
            {suggestStatus === "error" && (
              <div style={{ color: "#ff3fa4", marginTop: 8, fontSize: 12.5 }}>
                Something went wrong — try again in a bit.
              </div>
            )}
          </div>
        </div>

        <footer style={styles.footer}>
          © Jackie Espada · jackieespada.com
          <br />
          A Jovial Abundance Enterprise, LLC production
        </footer>
      </div>
    </div>
  );
}

function dotColorValue(name: string) {
  if (name === "pink") return "#ff3fa4";
  if (name === "cyan") return "#4dd9e8";
  return "#b24bff";
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    color: "#fdf6ff",
    fontFamily: "'Poppins', sans-serif",
    paddingBottom: 60,
    background:
      "radial-gradient(circle at 15% 10%, rgba(255,63,164,.30), transparent 40%), radial-gradient(circle at 85% 20%, rgba(77,217,232,.26), transparent 42%), linear-gradient(180deg, #160a2e, #2a0e3d)",
  },
  wrap: { maxWidth: 760, margin: "0 auto", padding: "0 18px" },
  header: { textAlign: "center", padding: "50px 18px 26px" },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: "50%",
    margin: "0 auto 14px",
    background: "conic-gradient(from 0deg, #ff3fa4, #4dd9e8, #ff3fa4, #b24bff, #ff3fa4)",
    border: "3px solid rgba(255,255,255,.4)",
    boxShadow: "0 0 40px rgba(255,63,164,.5), 0 0 60px rgba(77,217,232,.3)",
  },
  h1: {
    margin: "0 0 4px",
    fontSize: 44,
    fontWeight: 700,
    fontFamily: "'Dancing Script', cursive",
    background: "linear-gradient(90deg,#ff3fa4,#4dd9e8)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },
  headerP: { margin: "8px auto 0", color: "#c9b8e0", fontSize: 14.5, maxWidth: 440, lineHeight: 1.55 },
  stripeWidget: {
    maxWidth: 340,
    margin: "24px auto 0",
    background: "linear-gradient(135deg, rgba(255,63,164,.9), rgba(178,75,255,.9))",
    borderRadius: 20,
    padding: "20px 22px",
    textAlign: "center",
    textDecoration: "none",
    display: "block",
    color: "#fff",
    boxShadow: "0 0 40px rgba(255,63,164,.35)",
  },
  stripeBtn: {
    display: "inline-block",
    background: "#fff",
    color: "#160a2e",
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 30px",
    borderRadius: 999,
  },
  supportRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 9, marginTop: 14 },
  supportBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 600,
    fontSize: 12.5,
    padding: "9px 15px",
    borderRadius: 999,
    textDecoration: "none",
    color: "#160a2e",
    background: "#4dd9e8",
  },
  section: { marginTop: 40 },
  sectionTitle: {
    fontSize: 12.5,
    textTransform: "uppercase",
    letterSpacing: ".16em",
    color: "#4dd9e8",
    fontWeight: 700,
    margin: "0 0 12px",
  },
  calToggle: { display: "flex", gap: 8, marginBottom: 14 },
  calToggleBtn: {
    flex: 1,
    padding: 9,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    color: "#c9b8e0",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  calToggleBtnActive: {
    flex: 1,
    padding: 9,
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(90deg,#ff3fa4,#4dd9e8)",
    color: "#160a2e",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  calendar: {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 18,
    overflow: "hidden",
  },
  calRow: {
    display: "grid",
    gridTemplateColumns: "56px 1fr 96px",
    alignItems: "center",
    padding: "13px 16px",
    borderBottom: "1px solid rgba(255,255,255,.14)",
    gap: 10,
  },
  calDay: { fontWeight: 700, color: "#ff3fa4", fontSize: 13 },
  calNote: { fontSize: 11.5, color: "#c9b8e0", marginTop: 2 },
  calTime: { fontSize: 12, color: "#c9b8e0", textAlign: "right" },
  monthGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, padding: "8px 10px 14px" },
  dow: { textAlign: "center", fontSize: 10, color: "#c9b8e0", textTransform: "uppercase", paddingBottom: 4 },
  dayCell: {
    aspectRatio: "1/1",
    borderRadius: 8,
    background: "rgba(255,255,255,.03)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px 2px",
  },
  dayNum: { fontSize: 10.5, color: "#c9b8e0" },
  dotRow: { display: "flex", gap: 2, marginTop: 3, flexWrap: "wrap", justifyContent: "center" },
  dot: { width: 5, height: 5, borderRadius: "50%" },
  legend: { display: "flex", flexWrap: "wrap", gap: "10px 16px", padding: "0 16px 16px", fontSize: 11, color: "#c9b8e0" },
  socials: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 },
  socialBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 16,
    padding: "14px 8px",
    color: "#fdf6ff",
    fontSize: 13.5,
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center",
  },
  extraCard: {
    background: "rgba(255,255,255,.06)",
    border: "1px dashed rgba(255,255,255,.14)",
    borderRadius: 16,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#fdf6ff",
    textDecoration: "none",
    fontSize: 14,
  },
  suggestBox: {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 18,
    padding: 20,
  },
  supporterCard: {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 8,
  },
  textarea: {
    width: "100%",
    minHeight: 70,
    background: "rgba(0,0,0,.25)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 12,
    color: "#fdf6ff",
    padding: 12,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
  },
  input: {
    width: "100%",
    marginTop: 10,
    background: "rgba(0,0,0,.25)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 12,
    color: "#fdf6ff",
    padding: 12,
    fontSize: 14,
  },
  suggestBtn: {
    marginTop: 12,
    width: "100%",
    background: "linear-gradient(90deg,#ff3fa4,#4dd9e8)",
    color: "#160a2e",
    border: "none",
    borderRadius: 999,
    padding: 13,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  footer: { textAlign: "center", color: "#c9b8e0", fontSize: 12, marginTop: 50, paddingTop: 20, lineHeight: 1.7 },
};
