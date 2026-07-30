"use client";

import { useEffect, useState } from "react";
import type { ShowState } from "../../../lib/state";

export default function HooksHarmonyVideoScenePage() {
  const [state, setState] = useState<ShowState | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/hooks-harmony/state");
      const data = await res.json();
      setState(data);
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const upNext = state?.queue?.[0] || null;
  const nowPlayingText = state?.nowPlaying
    ? `NOW PLAYING: ${state.nowPlaying.title} — ${state.nowPlaying.artist}` +
      (state.nowPlaying.name ? ` (req. ${state.nowPlaying.name})` : "") +
      (state.nowPlaying.message ? ` — "${state.nowPlaying.message}"` : "")
    : null;
  const tickerText = [
    nowPlayingText,
    state?.lastPlayed ? `LAST PLAYED: ${state.lastPlayed.title} — ${state.lastPlayed.artist}` : null,
    upNext ? `UP NEXT: ${upNext.title} — ${upNext.artist}` : "UP NEXT: —",
  ]
    .filter(Boolean)
    .join("      •      ");

  return (
    <div style={{ width: "1920px", height: "1080px", position: "relative", background: "transparent", overflow: "hidden" }}>
      {/* Jukebox background at /public/hooks-harmony-tv-bg.png — the screen area is already
          cut fully transparent so a window capture of your video source shows through it
          when this source sits above the capture in OBS. */}
      <img
        src="/hooks-harmony-tv-bg.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(90deg, rgba(0,195,218,.6), rgba(13,17,23,.94))",
          padding: "20px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            display: "inline-block",
            paddingLeft: "100%",
            animation: "scrollTicker 55s linear infinite",
            fontSize: 32,
            fontWeight: 600,
            color: "#eaf6f8",
          }}
        >
          {tickerText}
        </div>
      </div>
      <style>{`
        @keyframes scrollTicker {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
