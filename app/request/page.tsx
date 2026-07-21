"use client";

import { useEffect, useState } from "react";
import type { Request as QueuedRequest } from "../../lib/state";

export default function RequestPage() {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [name, setName] = useState("");
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [showToast, setShowToast] = useState(false);

  async function loadQueue() {
    const res = await fetch("/api/state");
    const data = await res.json();
    setQueue(data.queue || []);
  }

  useEffect(() => {
    loadQueue();
    const id = setInterval(loadQueue, 4000);
    return () => clearInterval(id);
  }, []);

  async function submit() {
    if (!song.trim() || !artist.trim()) return;
    await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: song, artist, name }),
    });
    setSong("");
    setArtist("");
    setName("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    loadQueue();
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px" }}>
      <div
        style={{
          border: "2px solid var(--gold)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,.4)",
        }}
      >
        {/* Replace /thumbnail.jpg in /public with your real show art if you want it updated */}
        <img src="/thumbnail.jpg" alt="The Midnight Something Special" style={{ display: "block", width: "100%" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 8px var(--gold)", animation: "pulse 1.6s infinite" }} />
        Live now
      </div>
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Request the next song</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 13.5, marginBottom: 22, lineHeight: 1.5 }}>
        Type a song and artist. It drops into the queue and shows up on stream.
      </p>

      <div style={cardStyle}>
        <label style={labelStyle}>Song title</label>
        <input style={inputStyle} value={song} onChange={(e) => setSong(e.target.value)} placeholder="e.g. Le Freak" />
        <label style={labelStyle}>Artist</label>
        <input style={inputStyle} value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="e.g. Chic" />
        <label style={labelStyle}>Your name (optional, shown on stream)</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jamie from Ohio" />
        <button style={btnStyle} onClick={submit}>
          Submit request
        </button>
        {showToast && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--gold)" }}>
            Added to the queue — watch for it on stream.
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 10.5, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
          Queue right now
        </div>
        {queue.length === 0 ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13, padding: "8px 0" }}>Nothing queued yet.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {queue.map((r, i) => (
              <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--wire)", fontSize: 14 }}>
                <span>
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
