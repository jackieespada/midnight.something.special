"use client";

import { useEffect, useState } from "react";
import type { ShowState } from "../../lib/state";

export default function DjPage() {
  const [state, setState] = useState<ShowState | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  async function load() {
    const res = await fetch("/api/state");
    const data = await res.json();
    setState(data);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  async function saveNowPlaying() {
    await fetch("/api/now-playing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist }),
    });
    setTitle("");
    setArtist("");
    load();
  }

  async function advance() {
    await fetch("/api/advance", { method: "POST" });
    load();
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px", background: "var(--stage)", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 24 }}>DJ control panel</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 13.5, marginBottom: 22 }}>
        Not linked from anywhere public — keep this URL to yourself. Advance the queue here while you're live.
      </p>

      <div style={cardStyle}>
        <div style={labelStyle}>Now playing</div>
        <div style={{ marginBottom: 10 }}>
          {state?.nowPlaying?.title} — {state?.nowPlaying?.artist}
        </div>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Override song title" />
        <input style={{ ...inputStyle, marginTop: 8 }} value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Override artist" />
        <button style={ghostBtnStyle} onClick={saveNowPlaying}>
          Save now playing
        </button>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Pending queue</div>
        {!state?.queue?.length ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>Nothing queued.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {state.queue.map((r, i) => (
              <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--wire)", fontSize: 14 }}>
                <span>
                  {i === 0 ? "▶ " : ""}
                  {r.tipped && <span style={{ color: "var(--gold)" }}>★ </span>}
                  {r.title} — {r.artist}
                </span>
                <span style={{ color: "var(--ink-dim)", fontSize: 12 }}>{r.name || "anon"}</span>
              </li>
            ))}
          </ul>
        )}
        <button style={btnStyle} onClick={advance}>
          Pull next request → Now playing
        </button>
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
  fontSize: 10.5,
  color: "var(--ink-dim)",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  marginBottom: 6,
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
  marginTop: 12,
  border: "none",
  borderRadius: 999,
  padding: 14,
  fontSize: 14.5,
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(90deg, var(--gold), var(--signal) 65%, var(--haze))",
  color: "#1a0f08",
};

const ghostBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: "transparent",
  border: "1px solid var(--wire)",
  color: "var(--ink)",
};
