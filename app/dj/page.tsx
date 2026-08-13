"use client";

import { useEffect, useState } from "react";
import type { ShowState, Request as QueuedRequest } from "../../lib/state";

export default function DjPage() {
  const [state, setState] = useState<ShowState | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [manualError, setManualError] = useState("");

  const [copyLabel, setCopyLabel] = useState("Copy setlist");

  // Local queue used only for smooth drag-and-drop; synced from server state,
  // and pushed back to the server the moment a drag ends.
  const [localQueue, setLocalQueue] = useState<QueuedRequest[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/state");
    const data = await res.json();
    setState(data);
    setLocalQueue(data.queue || []);
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

  async function boostToFront(index: number) {
    await fetch("/api/queue-boost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    load();
  }

  async function addManual() {
    setManualError("");
    if (!manualTitle.trim() || !manualArtist.trim()) {
      setManualError("Song and artist are required.");
      return;
    }
    const res = await fetch("/api/manual-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: manualTitle, artist: manualArtist, name: manualName, message: manualMessage }),
    });
    const data = await res.json();
    if (!res.ok) {
      setManualError(data.error || "Something went wrong adding that.");
      return;
    }
    setManualTitle("");
    setManualArtist("");
    setManualName("");
    setManualMessage("");
    load();
  }

  async function startNewEpisode() {
    if (!confirm("Archive this episode's setlist and start fresh for next week?")) return;
    await fetch("/api/new-episode", { method: "POST" });
    load();
  }

  function formatSetlist(songs: { title: string; artist: string; name?: string }[]) {
    return songs.map((s, i) => `${i + 1}. ${s.title} — ${s.artist}${s.name ? ` (req. ${s.name})` : ""}`).join("\n");
  }

  async function copySetlist() {
    if (!state?.history?.length) return;
    const text = formatSetlist(state.history);
    await navigator.clipboard.writeText(text);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy setlist"), 2000);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setLocalQueue((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(index);
  }

  async function handleDragEnd() {
    setDragIndex(null);
    await fetch("/api/queue-reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: localQueue }),
    });
    load();
  }

  const queueCount = state?.queue?.length || 0;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px", background: "var(--stage)", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 24 }}>DJ control panel</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 13.5, marginBottom: 22 }}>
        Not linked from anywhere public — keep this URL to yourself. Advance the queue here while you're live.
      </p>

      <div style={cardStyle}>
        <div style={labelStyle}>Now playing</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>
          {state?.nowPlaying?.title} — {state?.nowPlaying?.artist}
        </div>
        {state?.nowPlaying?.name && (
          <div style={{ color: "var(--gold)", fontSize: 13, marginTop: 4 }}>Requested by {state.nowPlaying.name}</div>
        )}
        {state?.nowPlaying?.message && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "rgba(232,161,60,.1)",
              border: "1px solid rgba(232,161,60,.35)",
              borderRadius: 10,
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            📖 Read on air: "{state.nowPlaying.message}"
          </div>
        )}

        <div style={{ height: 1, background: "var(--wire)", margin: "16px 0" }} />

        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Override song title" />
        <input style={{ ...inputStyle, marginTop: 8 }} value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Override artist" />
        <button style={ghostBtnStyle} onClick={saveNowPlaying}>
          Save now playing
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
          <span>Pending queue (drag ☰ to reorder)</span>
          <span style={{ color: queueCount >= 20 ? "var(--signal)" : "var(--ink-dim)" }}>{queueCount}/20</span>
        </div>
        {!localQueue.length ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>Nothing queued.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {localQueue.map((r, i) => (
              <li
                key={`${r.ts}-${r.title}`}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--wire)",
                  fontSize: 14,
                  opacity: dragIndex === i ? 0.4 : 1,
                  cursor: "grab",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--ink-dim)" }}>☰</span>
                    {i === 0 ? "▶ " : ""}
                    {r.tipped && (
                      <span style={{ color: "var(--gold)" }}>★ ${((r.tipCents || 0) / 100).toFixed(2)}</span>
                    )}
                    {r.title} — {r.artist}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--ink-dim)", fontSize: 12 }}>{r.name || "anon"}</span>
                    <button
                      style={{
                        background: "transparent",
                        border: "1px solid var(--gold)",
                        color: "var(--gold)",
                        borderRadius: 8,
                        padding: "3px 8px",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                      onClick={() => boostToFront(i)}
                    >
                      ⬆ Boost
                    </button>
                  </span>
                </div>
                {r.message && (
                  <div style={{ color: "var(--gold)", fontSize: 12, marginTop: 2, fontStyle: "italic" }}>
                    💬 {r.message}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <button style={btnStyle} onClick={advance}>
          Pull next request → Now playing
        </button>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Add a request manually (e.g. from Rumble chat)</div>
        <input style={inputStyle} value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Song title" />
        <input style={{ ...inputStyle, marginTop: 8 }} value={manualArtist} onChange={(e) => setManualArtist(e.target.value)} placeholder="Artist" />
        <input style={{ ...inputStyle, marginTop: 8 }} value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Name (optional)" />
        <input style={{ ...inputStyle, marginTop: 8 }} value={manualMessage} onChange={(e) => setManualMessage(e.target.value)} placeholder="Message to read (optional)" />
        <button style={ghostBtnStyle} onClick={addManual}>
          Add to queue
        </button>
        {manualError && <div style={{ marginTop: 10, fontSize: 13, color: "var(--signal)" }}>{manualError}</div>}
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Tonight's setlist so far ({state?.history?.length || 0} played)</div>
        {!state?.history?.length ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>Nothing played yet tonight.</div>
        ) : (
          <ol style={{ margin: "0 0 12px", paddingLeft: 20, fontSize: 14 }}>
            {state.history.map((s, i) => (
              <li key={i} style={{ padding: "4px 0" }}>
                {s.title} — {s.artist}
                {s.name && <span style={{ color: "var(--ink-dim)" }}> (req. {s.name})</span>}
              </li>
            ))}
          </ol>
        )}
        <button style={ghostBtnStyle} onClick={copySetlist} disabled={!state?.history?.length}>
          {copyLabel}
        </button>
        <button style={{ ...btnStyle, marginTop: 8 }} onClick={startNewEpisode}>
          Start new episode (archive this setlist)
        </button>
      </div>

      {state && state.episodes.length > 0 && (
        <div style={cardStyle}>
          <div style={labelStyle}>Past episodes</div>
          {state.episodes.map((ep, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "var(--gold)", marginBottom: 4 }}>{ep.date}</div>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--ink-dim)" }}>
                {ep.songs.map((s, j) => (
                  <li key={j}>
                    {s.title} — {s.artist}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
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
