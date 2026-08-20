"use client";

import { useEffect, useState, useRef } from "react";
import type { ShowState, Request as QueuedRequest } from "../../lib/state";

type ShowId = "midnight-something-special" | "hooks-harmony";

const SHOW_LABELS: Record<ShowId, string> = {
  "midnight-something-special": "The Midnight Something Special",
  "hooks-harmony": "Hooks + Harmony",
};

const SHOW_THEME: any = {
  "midnight-something-special": {},
  "hooks-harmony": {
    "--gold": "#00c3da",
    "--signal": "#c401b0",
    "--haze": "#692dad",
  },
};

export default function DjPage() {
  const [show, setShow] = useState<ShowId>("midnight-something-special");
  const [state, setState] = useState<ShowState | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [themeInput, setThemeInput] = useState("");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", "", "", ""]);
  const [pollError, setPollError] = useState("");

  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [manualError, setManualError] = useState("");

  const [copyLabel, setCopyLabel] = useState("Copy setlist");

  const [localQueue, setLocalQueue] = useState<QueuedRequest[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const themeInitializedForShow = useRef<ShowId | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editError, setEditError] = useState("");

  const apiPrefix = show === "hooks-harmony" ? "/api/hooks-harmony" : "/api";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("show") === "hooks-harmony") setShow("hooks-harmony");
  }, []);

  async function load() {
    const res = await fetch(`${apiPrefix}/state`);
    const data = await res.json();
    setState(data);
    setLocalQueue(data.queue || []);
    if (themeInitializedForShow.current !== show) {
      setThemeInput(data.theme || "");
      themeInitializedForShow.current = show;
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [show]);

  function switchShow(next: ShowId) {
    setShow(next);
    const url = new URL(window.location.href);
    url.searchParams.set("show", next);
    window.history.replaceState({}, "", url.toString());
  }

  async function saveNowPlaying() {
    await fetch(`${apiPrefix}/now-playing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist }),
    });
    setTitle("");
    setArtist("");
    load();
  }

  async function saveTheme() {
    await fetch(`${apiPrefix}/theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: themeInput }),
    });
    load();
  }

  async function savePoll() {
    setPollError("");
    const cleanOptions = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!pollQuestion.trim() || cleanOptions.length < 2) {
      setPollError("Add a question and at least 2 options.");
      return;
    }
    const res = await fetch("/api/hooks-harmony/poll-set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: pollQuestion, options: cleanOptions }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPollError(data.error || "Something went wrong saving the poll.");
      return;
    }
    load();
  }

  async function advance() {
    await fetch(`${apiPrefix}/advance`, { method: "POST" });
    load();
  }

  async function boostToFront(id: string) {
    await fetch(`${apiPrefix}/queue-boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const [editingId, setEditingId] = useState<string | null>(null);

  function startEdit(index: number, r: QueuedRequest) {
    setEditingIndex(index);
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditArtist(r.artist);
    setEditName(r.name || "");
    setEditMessage(r.message || "");
    setEditVideoUrl(r.videoUrl || "");
    setEditError("");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditError("");
  }

  async function saveEdit() {
    setEditError("");
    if (!editTitle.trim() || !editArtist.trim()) {
      setEditError("Song and artist are required.");
      return;
    }
    const res = await fetch(`${apiPrefix}/queue-edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        title: editTitle,
        artist: editArtist,
        name: editName,
        message: editMessage,
        videoUrl: editVideoUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEditError(data.error || "Something went wrong saving that.");
      return;
    }
    setEditingIndex(null);
    setEditingId(null);
    load();
  }

  async function addManual() {
    setManualError("");
    if (!manualTitle.trim() || !manualArtist.trim()) {
      setManualError("Song and artist are required.");
      return;
    }
    const res = await fetch(`${apiPrefix}/manual-add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: manualTitle, artist: manualArtist, name: manualName, message: manualMessage, videoUrl: manualVideoUrl }),
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
    setManualVideoUrl("");
    load();
  }

  async function startNewEpisode() {
    if (!confirm("Archive this episode's setlist and start fresh for next week?")) return;
    await fetch(`${apiPrefix}/new-episode`, { method: "POST" });
    load();
  }

  function formatSetlist(songs: { title: string; artist: string; name?: string }[]) {
    return songs.map((s, i) => `${i + 1}. ${s.title} — ${s.artist}${s.name ? ` (req. ${s.name})` : ""}`).join("\n");
  }

  async function downloadSetlistPdf(
    dateLabel: string,
    songs: { title: string; artist: string; name?: string; message?: string; videoUrl?: string }[]
  ) {
    if (!songs.length) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const showLabel = SHOW_LABELS[show];

    doc.setFontSize(16);
    doc.text(`${showLabel} — Setlist`, 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(dateLabel, 14, 26);
    doc.setTextColor(0);

    let y = 38;
    songs.forEach((s, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${s.title} — ${s.artist}`, 14, y);
      y += 6;
      if (s.name) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Requested by: ${s.name}`, 20, y);
        doc.setTextColor(0);
        y += 5;
      }
      if (s.message) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        const lines = doc.splitTextToSize(`Message: "${s.message}"`, 170);
        doc.text(lines, 20, y);
        doc.setTextColor(0);
        y += 5 * lines.length;
      }
      if (s.videoUrl) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        const lines = doc.splitTextToSize(`Video: ${s.videoUrl}`, 170);
        doc.text(lines, 20, y);
        doc.setTextColor(0);
        y += 5 * lines.length;
      }
      y += 4;
    });

    const fileDate = dateLabel.replace(/[^0-9-]/g, "") || new Date().toISOString().slice(0, 10);
    doc.save(`${showLabel.replace(/\s+/g, "-").toLowerCase()}-setlist-${fileDate}.pdf`);
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
    await fetch(`${apiPrefix}/queue-reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: localQueue.map((r) => r.id) }),
    });
    load();
  }

  const queueCount = state?.queue?.length || 0;
  const rootStyle = { maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px", background: "var(--stage)", minHeight: "100vh", ...SHOW_THEME[show] };

  return (
    <div style={rootStyle}>
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

      <h1 style={{ fontSize: 24 }}>DJ control panel</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 13.5, marginBottom: 22 }}>
        Not linked from anywhere public — keep this URL to yourself. Advance the queue here while you're live.
      </p>

      <div style={cardStyle}>
        <div style={labelStyle}>Tonight's theme (shown on the request page)</div>
        <input
          style={inputStyle}
          value={themeInput}
          onChange={(e) => setThemeInput(e.target.value)}
          placeholder="e.g. 80s Power Ballads"
        />
        <button style={ghostBtnStyle} onClick={saveTheme}>
          Save theme
        </button>
      </div>

      {show === "hooks-harmony" && (
        <div style={cardStyle}>
          <div style={labelStyle}>Next week's theme poll (Hooks + Harmony only)</div>
          <input
            style={inputStyle}
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="e.g. What should next week's theme be?"
          />
          {pollOptions.map((opt, i) => (
            <input
              key={i}
              style={{ ...inputStyle, marginTop: 8 }}
              value={opt}
              onChange={(e) => {
                const next = [...pollOptions];
                next[i] = e.target.value;
                setPollOptions(next);
              }}
              placeholder={`Option ${i + 1}${i < 2 ? "" : " (optional)"}`}
            />
          ))}
          {pollError && <div style={{ marginTop: 10, fontSize: 13, color: "var(--signal)" }}>{pollError}</div>}
          <button style={ghostBtnStyle} onClick={savePoll}>
            Save poll (resets votes)
          </button>

          {state?.poll && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: "var(--gold)", marginBottom: 8 }}>
                Currently live: "{state.poll.question}"
              </div>
              {(() => {
                const counts: Record<string, number> = {};
                (Object.values(state.poll!.votes) as string[]).forEach((opt: string) => {
                  counts[opt] = (counts[opt] || 0) + 1;
                });
                const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
                return state.poll.options.map((opt) => {
                  const c = counts[opt] || 0;
                  const pct = totalVotes ? Math.round((c / totalVotes) * 100) : 0;
                  return (
                    <div key={opt} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span>{opt}</span>
                        <span style={{ color: "var(--ink-dim)" }}>
                          {c} vote{c === 1 ? "" : "s"} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: 6, background: "var(--wire)", borderRadius: 4, marginTop: 3 }}>
                        <div style={{ height: 6, width: `${pct}%`, background: "var(--gold)", borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

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
        {state?.nowPlaying?.videoUrl && (
          
            href={state.nowPlaying.videoUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-block", marginTop: 10, color: "var(--gold)", fontSize: 13, textDecoration: "underline" }}
          >
            🔗 Open video link
          </a>
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
                draggable={editingIndex !== i}
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--wire)",
                  fontSize: 14,
                  opacity: dragIndex === i ? 0.4 : 1,
                  cursor: editingIndex === i ? "default" : "grab",
                }}
              >
                {editingIndex === i ? (
                  <div style={{ padding: "8px 0" }}>
                    <input style={{ ...inputStyle, marginBottom: 6 }} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Song title" />
                    <input style={{ ...inputStyle, marginBottom: 6 }} value={editArtist} onChange={(e) => setEditArtist(e.target.value)} placeholder="Artist" />
                    <input style={{ ...inputStyle, marginBottom: 6 }} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name (optional)" />
                    <input style={{ ...inputStyle, marginBottom: 6 }} value={editMessage} onChange={(e) => setEditMessage(e.target.value)} placeholder="Message (optional)" />
                    <input style={{ ...inputStyle, marginBottom: 6 }} value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="Video link (optional)" />
                    {editError && <div style={{ color: "var(--signal)", fontSize: 12, marginBottom: 6 }}>{editError}</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={{ flex: 1, background: "var(--gold)", border: "none", color: "#1a0f08", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        onClick={() => saveEdit()}
                      >
                        Save
                      </button>
                      <button
                        style={{ flex: 1, background: "transparent", border: "1px solid var(--wire)", color: "var(--ink)", borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer" }}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                            border: "1px solid var(--wire)",
                            color: "var(--ink-dim)",
                            borderRadius: 8,
                            padding: "3px 8px",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                          onClick={() => startEdit(i, r)}
                        >
                          Edit
                        </button>
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
                          onClick={() => boostToFront(r.id)}
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
                    {r.videoUrl && (
                      
                        href={r.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 2, color: "var(--gold)", fontSize: 12, textDecoration: "underline" }}
                      >
                        🔗 video link
                      </a>
                    )}
                  </>
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
        <input style={{ ...inputStyle, marginTop: 8 }} value={manualVideoUrl} onChange={(e) => setManualVideoUrl(e.target.value)} placeholder="Video link (optional)" />
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
        <button
          style={{ ...ghostBtnStyle, marginTop: 8 }}
          onClick={() => downloadSetlistPdf(new Date().toISOString().slice(0, 10) + " (in progress)", state?.history || [])}
          disabled={!state?.history?.length}
        >
          ⬇ Download PDF
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--gold)" }}>{ep.date}</span>
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
                  onClick={() => downloadSetlistPdf(ep.date, ep.songs)}
                >
                  ⬇ PDF
                </button>
              </div>
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
