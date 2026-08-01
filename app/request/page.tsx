"use client";

import { useEffect, useState } from "react";
import type { Request as QueuedRequest } from "../../lib/state";

type ShowId = "midnight-something-special" | "hooks-harmony";

const SHOWS: {
  id: ShowId;
  label: string;
  tagline: string;
  apiBase: string;
  thumbnail: { type: "image"; src: string; alt: string };
  songPlaceholder: string;
  artistPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  theme: React.CSSProperties;
}[] = [
  {
    id: "midnight-something-special",
    label: "Midnight Special",
    tagline: "Live Thursdays at 12:30AM ET on Rumble",
    apiBase: "/api",
    thumbnail: { type: "image", src: "/thumbnail.jpg", alt: "The Midnight Something Special" },
    songPlaceholder: "e.g. Le Freak",
    artistPlaceholder: "e.g. Chic",
    messageLabel: "Message for me to read on air (optional, 200 characters)",
    messagePlaceholder: "Shoutout, dedication, whatever you want me to say on stream",
    theme: {
      "--stage": "#1f130f",
      "--stage2": "#2a1a13",
      "--haze": "#692dad",
      "--wire": "#5a3a24",
      "--live": "#4bc4d1",
      "--signal": "#c104b0",
      "--gold": "#e8a13c",
      "--ink": "#fbeedd",
      "--ink-dim": "#c2a488",
    } as React.CSSProperties,
  },
  {
    id: "hooks-harmony",
    label: "Hooks + Harmony",
    tagline: "Live Saturdays at 3pm ET",
    apiBase: "/api/hooks-harmony",
    thumbnail: { type: "image", src: "/hooks-harmony-thumbnail.png", alt: "Hooks + Harmony with Jackie Espada" },
    songPlaceholder: "e.g. Dancing Queen",
    artistPlaceholder: "e.g. ABBA",
    messageLabel: "Dedication or story (optional, 200 characters)",
    messagePlaceholder: "Tell us why this song, or who it's for",
    theme: {
      "--stage": "#0d1117",
      "--stage2": "#161c26",
      "--haze": "#692dad",
      "--wire": "#234249",
      "--live": "#00c3da",
      "--signal": "#c401b0",
      "--gold": "#00c3da",
      "--ink": "#eaf6f8",
      "--ink-dim": "#7fa3ab",
    } as React.CSSProperties,
  },
];

function initialShowFromUrl(): ShowId {
  if (typeof window === "undefined") return "midnight-something-special";
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("show");
  return requested === "hooks-harmony" ? "hooks-harmony" : "midnight-something-special";
}

export default function RequestPage() {
  const [showId, setShowId] = useState<ShowId>("midnight-something-special");
  const [hydrated, setHydrated] = useState(false);
  const show = SHOWS.find((s) => s.id === showId)!;

  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [theme, setTheme] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [tipStatus, setTipStatus] = useState<"tipped" | "cancelled" | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState("");

  // Read ?show=hooks-harmony (or omit for Midnight Special) once on mount,
  // so each show's own QR code / stream link opens directly on its tab.
  useEffect(() => {
    setShowId(initialShowFromUrl());
    setHydrated(true);
  }, []);

  async function loadQueue() {
    const res = await fetch(`${show.apiBase}/state`);
    const data = await res.json();
    setQueue(data.queue || []);
    setTheme(data.theme || "");
  }

  useEffect(() => {
    if (!hydrated) return;
    loadQueue();
    const id = setInterval(loadQueue, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId, hydrated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tipped")) setTipStatus("tipped");
    if (params.get("cancelled")) setTipStatus("cancelled");
  }, []);

  function switchShow(id: ShowId) {
    setShowId(id);
    setSong("");
    setArtist("");
    setName("");
    setMessage("");
    setVideoLink("");
    setTipAmount("");
    setSubmitError("");
    setTipError("");
    setTipStatus(null);
    const url = new URL(window.location.href);
    url.searchParams.set("show", id);
    url.searchParams.delete("tipped");
    url.searchParams.delete("cancelled");
    window.history.replaceState({}, "", url.toString());
  }

  async function submit() {
    setSubmitError("");
    if (!song.trim() || !artist.trim()) return;
    const res = await fetch(`${show.apiBase}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: song, artist, name, message, videoLink }),
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
    setVideoLink("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    loadQueue();
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
      const res = await fetch(`${show.apiBase}/tip-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: song, artist, name, message, amount, videoLink }),
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
    <div style={{ ...show.theme, maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px", background: "var(--stage)", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {SHOWS.map((s) => (
          <button
            key={s.id}
            onClick={() => switchShow(s.id)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              border: s.id === showId ? "1px solid var(--gold)" : "1px solid var(--wire)",
              background: s.id === showId ? "rgba(255,255,255,.06)" : "transparent",
              color: s.id === showId ? "var(--gold)" : "var(--ink-dim)",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        style={{
          border: "2px solid var(--gold)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,.4)",
        }}
      >
        <img src={show.thumbnail.src} alt={show.thumbnail.alt} style={{ display: "block", width: "100%" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 8px var(--gold)", animation: "pulse 1.6s infinite" }} />
        {show.tagline}
      </div>

      {theme && (
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--gold)",
            border: "1px solid var(--gold)",
            borderRadius: 999,
            padding: "8px 14px",
            marginBottom: 14,
          }}
        >
          Tonight's theme: {theme}
        </div>
      )}

      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Request the next song</h1>

      <p style={{ color: "var(--ink-dim)", fontSize: 13.5, marginBottom: 22, lineHeight: 1.5 }}>
        Type a song and artist. It drops into the queue and shows up on stream. Add a tip to bump your song ahead of the regular line.
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
        <input style={inputStyle} value={song} onChange={(e) => setSong(e.target.value)} placeholder={show.songPlaceholder} />
        <label style={labelStyle}>Artist</label>
        <input style={inputStyle} value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={show.artistPlaceholder} />
        <label style={labelStyle}>Your name (optional, shown on stream)</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jamie from Ohio" />
        <label style={labelStyle}>{show.messageLabel}</label>
        <textarea
          style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder={show.messagePlaceholder}
        />
        <label style={labelStyle}>Link to your video (optional)</label>
        <input
          style={inputStyle}
          value={videoLink}
          onChange={(e) => setVideoLink(e.target.value.slice(0, 500))}
          placeholder="Paste a YouTube or video link here"
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
          Queue right now ({queue.length}/25)
        </div>
        {queue.length === 0 ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13, padding: "8px 0" }}>Nothing queued yet.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {queue.map((r, i) => (
              <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--wire)", fontSize: 14 }}>
                <span>
                  {r.tipped && <span style={{ color: "var(--gold)" }}>★ ${((r.tipCents || 0)
