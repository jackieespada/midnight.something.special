"use client";

import { useEffect, useState } from "react";
import type { ShowState } from "../../lib/state";

type ShowId = "midnight-something-special" | "hooks-harmony";

const SHOWS: { id: ShowId; label: string; apiBase: string; theme: React.CSSProperties }[] = [
  {
    id: "midnight-something-special",
    label: "Midnight Special",
    apiBase: "/api",
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
    apiBase: "/api/hooks-harmony",
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

export default function DjPage() {
  const [showId, setShowId] = useState<ShowId>("midnight-something-special");
  const show = SHOWS.find((s) => s.id === showId)!;

  const [state, setState] = useState<ShowState | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [manualError, setManualError] = useState("");

  const [copyLabel, setCopyLabel] = useState("Copy setlist");

  const [themeInput, setThemeInput] = useState("");
  const [themeSaved, setThemeSaved] = useState(false);

  async function load() {
    const res = await fetch(`${show.apiBase}/state`);
    const data = await res.json();
    setState(data);
    setThemeInput(data.theme || "");
  }

  // Reload whenever the selected show changes, and clear anything that
  // was specific to the previously selected show's in-progress edits.
  useEffect(() => {
    setState(null);
    setTitle("");
    setArtist("");
    setManualTitle("");
    setManualArtist("");
    setManualName("");
    setManualMessage("");
    setManualError("");
    setCopyLabel("Copy setlist");
    setThemeInput("");
    setThemeSaved(false);
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId]);

  async function saveTheme() {
    await fetch(`${show.apiBase}/theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: themeInput }),
    });
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
    load();
  }

  async function saveNowPlaying() {
    await fetch(`${show.apiBase}/now-playing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist }),
    });
    setTitle("");
    setArtist("");
    load();
  }

  async function advance() {
    await fetch(`${show.apiBase}/advance`, { method: "POST" });
    load();
  }

  async function boostToFront(index: number) {
    await fetch(`${show.apiBase}/queue-boost`, {
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
    const res = await fetch(`${show.apiBase}/manual-add`, {
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
    if (!confirm(`Archive ${show.label}'s setlist and start fresh for next episode?`)) return;
    await fetch(`${show.apiBase}/new-episode`, { method: "POST" });
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

  const queueCount = state?.queue?.length || 0;

  return (
    <div style={{ ...show.theme, maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px", background: "var(--stage)", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {SHOWS.map((s) => (
          <button
            key={s.id}
            onClick={() => setShowId(s.id)}
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

      <h1 style={{ fontSize: 24 }}>DJ control panel</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 13.5, marginBottom: 22 }}>
        Not linked from anywhere public — keep this URL to yourself. Advance the queue here while you're live.
      </p>

      <div style={cardStyle}>
        <div style={labelStyle}>Theme for this episode ({show.label})</div>
        <input
          style={inputStyle}
          value={themeInput}
          onChange={(e) => setThemeInput(e.target.value.slice(0, 80))}
          placeholder="e.g. Christmas in July, Songs of Summer"
        />
        <button style={ghostBtnStyle} onClick={saveTheme}>
          Save theme
        </button>
        {themeSaved && <div style={{ marginTop: 10, fontSize: 13, color: "var(--gold)" }}>Saved — now showing on the request page and overlay.</div>}
      </div>

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
              background: "rgba(255,255,255,.06)",
              border: "1px solid var(--wire)",
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
          <span>Pending queue</span>
          <span style={{ color: queueCount >= 25 ? "var(--signal)" : "var(--ink-dim)" }}>{queueCount}/25</span>
        </div>
        {!state?.queue?.length ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>Nothing queued.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {state.queue.map((r, i) => (
              <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--wire)", fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>
                    {i === 0 ? "▶ " : ""}
                    {r.tipped && (
                      <span style={{ color: "var(--gold)" }}>★ ${((r.tipCents || 0) / 100).toFixed(2)} </span>
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
        <div style={labelStyle}>
          Add a request manually {show.id === "midnight-something-special" ? "(e.g. from Rumble chat)" : "(e.g. from Rumble chat)"}
        </div>
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
          <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>Nothing played yet.</div>
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
