"use client";

import { useEffect, useState } from "react";
import type { Request as QueuedRequest } from "../../lib/state";

type ShowId = "midnight-something-special" | "hooks-harmony";

const SHOW_LABELS: Record<ShowId, string> = {
  "midnight-something-special": "The Midnight Something Special",
  "hooks-harmony": "Hooks + Harmony",
};

const SHOW_SCHEDULE: Record<ShowId, string> = {
  "midnight-something-special": "Thursdays 12:30AM ET",
  "hooks-harmony": "Saturdays 3PM ET",
};

// Overrides the shared CSS custom properties per show, since every color in
// this page is already written as var(--gold) / var(--signal) / var(--haze) —
// this just swaps what those variables point to based on which show is active.
const SHOW_THEME: Record<ShowId, React.CSSProperties> = {
  "midnight-something-special": {},
  "hooks-harmony": {
    ["--gold" as any]: "#00c3da",
    ["--signal" as any]: "#c401b0",
    ["--haze" as any]: "#692dad",
  },
};

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("msss-visitor-id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem("msss-visitor-id", id);
  }
  return id;
}

export default function RequestPage() {
  const [show, setShow] = useState<ShowId>("midnight-something-special");
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [theme, setEpisodeTheme] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [tipStatus, setTipStatus] = useState<"tipped" | "cancelled" | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState("");

  const apiPrefix = show === "hooks-harmony" ? "/api/hooks-harmony" : "/api";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("show");
    if (s === "hooks-harmony") setShow("hooks-harmony");
    if (params.get("tipped")) setTipStatus("tipped");
    if (params.get("cancelled")) setTipStatus("cancelled");
  }, []);

  async function loadState() {
    const res = await fetch(`${apiPrefix}/state`);
    const data = await res.json();
    setQueue(data.queue || []);
    setEpisodeTheme(data.theme || "");
  }

  useEffect(() => {
    loadState();
    const id = setInterval(loadState, 4000);
    return () => clearInterval(id);
  }, [show]);

  function switchShow(next: ShowId) {
    setShow(next);
    const url = new URL(window.location.href);
    url.searchParams.set("show", next);
    window.history.replaceState({}, "", url.toString());
  }

  async function submit() {
    setSubmitError("");
    if (!song.trim() || !artist.trim()) return;
    const res = await fetch(`${apiPrefix}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: song, artist, name, message, visitorId: getVisitorId() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error || "Something went wrong submitting your request.");
      return;
    }
    setSong("");
    setArtist("");
    setName("");
    setMessage("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    loadState();
  }

  async function submitWithTip() {
    setTipError("");
    if (!song.trim() || !artist.trim()) {
      setTipError("Fill in the song and artist first.");
      return;
    }
    const amount = Number(tipAmount);
    if (!amount || amount < 1) {
      setTipError("Enter a tip amount of at least $1.");
      return;
    }
    setTipLoading(true);
    try {
      const res = await fetch(`${apiPrefix}/tip-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: song, artist, name, message, amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setTipError(data.error || "Something went wrong starting checkout.");
        setTipLoading(false);
      }
    } catch {
      setTipError("Something went wrong starting checkout.");
      setTipLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px", background: "var(--stage)", minHeight: "100vh", ...SHOW_THEME[show] }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(0,0,0,.25)", borderRadius: 14, padding: 5 }}>
        {(Object.keys(SHOW_LABELS) as ShowId[]).map((s) => (
          <button
            key={s}
            onClick={() => switchShow(s)}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: 10,
              border: "none",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: show === s ? "var(--gold)" : "transparent",
              color: show === s ? "#1a0f08" : "var(--ink-dim)",
            }}
          >
            {SHOW_LABELS[s]}
          </button>
        ))}
      </div>

      {show === "midnight-something-special" ? (
        <div
          style={{
            border: "2px solid var(--gold)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 20,
            boxShadow: "0 6px 20px rgba(0,0,0,.4)",
          }}
        >
          <img src="/thumbnail.jpg" alt="The Midnight Something Special" style={{ display: "block", width: "100%" }} />
        </div>
      ) : (
        <div
          style={{
            border: "2px solid var(--gold)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 20,
            boxShadow: "0 6px 20px rgba(0,0,0,.4)",
          }}
        >
          <img src="/hooks-harmony-thumbnail.png" alt="Hooks + Harmony with Jackie Espada" style={{ display: "block", width: "100%" }} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }} />
        Airs {SHOW_SCHEDULE[show]}
      </div>
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Request the next song</h1>
      {theme && (
        <div
          style={{
            display: "inline-block",
            marginBottom: 12,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(232,161,60,.14)",
            border: "1px solid rgba(232,161,60,.4)",
            color: "var(--gold)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          🎨 Tonight's theme: {theme}
        </div>
      )}
      <p style={{ color: "var(--ink-dim)", fontSize: 13.5, marginBottom: 22, lineHeight: 1.5 }}>
        Type a song and artist. It drops into the queue and shows up on stream. Limit 2 free requests per person — tip to add more or bump ahead of the line.
      </p>

      {tipStatus === "tipped" && (
        <div style={{ ...cardStyle, borderColor: "var(--gold)", color: "var(--gold)", fontSize: 14 }}>
          Thanks for the tip — your song just jumped the line.
        </div>
      )}
      {tipStatus === "cancelled" && (
        <div style={{ ...cardStyle, fontSize: 14, color: "var(--ink-dim)" }}>
          Tip checkout was cancelled — no charge was made. You can still submit a regular request below.
        </div>
      )}

      <div style={cardStyle}>
        <label style={labelStyle}>Song title</label>
        <input style={inputStyle} value={song} onChange={(e) => setSong(e.target.value)} placeholder="e.g. Le Freak" />
        <label style={labelStyle}>Artist</label>
        <input style={inputStyle} value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="e.g. Chic" />
        <label style={labelStyle}>Your name (optional, shown on stream)</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jamie from Ohio" />
        <label style={labelStyle}>Message for me to read on air (optional, 200 characters)</label>
        <textarea
          style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder="Shoutout, dedication, whatever you want me to say on stream"
        />
        <button style={btnStyle} onClick={submit}>
          Submit request
        </button>
        {showToast && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--gold)" }}>
            Added to the queue — watch for it on stream.
          </div>
        )}
        {submitError && <div style={{ marginTop: 12, fontSize: 13, color: "var(--signal)" }}>{submitError}</div>}

        <div style={{ height: 1, background: "var(--wire)", margin: "20px 0" }} />

        <label style={labelStyle}>Tip to bump ahead of the line (optional)</label>
        <input
          style={inputStyle}
          value={tipAmount}
          onChange={(e) => setTipAmount(e.target.value)}
          placeholder="Enter an amount, e.g. 5"
          inputMode="decimal"
        />
        <button style={ghostBtnStyle} onClick={submitWithTip} disabled={tipLoading}>
          {tipLoading ? "Starting checkout…" : "Tip and bump my song"}
        </button>
        {tipError && <div style={{ marginTop: 10, fontSize: 13, color: "var(--signal)" }}>{tipError}</div>}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 10.5, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
          Queue right now ({queue.length}/20)
        </div>
        {queue.length === 0 ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13, padding: "8px 0" }}>Nothing queued yet.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {queue.map((r, i) => (
              <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--wire)", fontSize: 14 }}>
                <span>
                  {r.tipped && <span style={{ color: "var(--gold)" }}>★ ${((r.tipCents || 0) / 100).toFixed(2)} </span>}
                  {r.title} — {r.artist}
                </span>
                <span style={{ color: "var(--ink-dim)", fontSize: 12 }}>{r.name || "anon"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0))",
  border: "1px solid var(--wire)",
  borderRadius: 22,
  padding: 18,
  marginBottom: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: "var(--ink-dim)",
  margin: "14px 0 6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--stage)",
  border: "1px solid var(--wire)",
  borderRadius: 14,
  padding: "12px 15px",
  color: "var(--ink)",
  fontSize: 15,
  fontFamily: "inherit",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  border: "none",
  borderRadius: 999,
  padding: 14,
  fontSize: 14.5,
  fontWeight: 700,
  letterSpacing: ".02em",
  cursor: "pointer",
  background: "linear-gradient(90deg, var(--gold), var(--signal) 65%, var(--haze))",
  color: "#1a0f08",
  boxShadow: "0 6px 18px rgba(232,161,60,.35)",
};

const ghostBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: "transparent",
  border: "1px solid var(--gold)",
  color: "var(--gold)",
  boxShadow: "none",
};
