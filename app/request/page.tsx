"use client";

import { useEffect, useState } from "react";
import type { Request as QueuedRequest } from "../../lib/state";

export default function RequestPage() {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [name, setName] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [tipStatus, setTipStatus] = useState<"tipped" | "cancelled" | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState("");

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tipped")) setTipStatus("tipped");
    if (params.get("cancelled")) setTipStatus("cancelled");
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
      const res = await fetch("/api/tip-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: song, artist, name, amount }),
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
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px", background: "var(--stage)", minHeight: "100vh" }}>
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

      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 8px var(--gold)", animation: "pulse 1.6s infinite" }} />
        Live now
      </div>
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
        <input style={inputStyle} value={song} onChange={(e) =>
  color: "#1a0f08",
  boxShadow: "0 6px 18px rgba(232,161,60,.35)",
};
