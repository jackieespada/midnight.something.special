"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { ShowState } from "../../lib/state";

// Set this to your real request page URL once deployed, e.g.
// https://midnightsomethingspecial.vercel.app/request
const REQUEST_URL_FALLBACK = "https://jackieespada.com/request";

export default function OverlayPage() {
  const [state, setState] = useState<ShowState | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [requestUrl, setRequestUrl] = useState(REQUEST_URL_FALLBACK);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRequestUrl(`${window.location.origin}/request`);
    }
  }, []);

  useEffect(() => {
    if (!requestUrl) return;
    QRCode.toDataURL(requestUrl, { margin: 1, color: { dark: "#1f130f", light: "#ffffff" } }).then(setQrDataUrl);
  }, [requestUrl]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/state");
      const data = await res.json();
      setState(data);
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const upNext = state?.queue?.[0] || null;

  return (
    <div style={{ width: "1920px", height: "1080px", position: "relative", background: "transparent", overflow: "hidden" }}>
      <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
        {/* Put your background video at /public/bg.webm */}
        <source src="/bg.webm" type="video/webm" />
      </video>

      <div style={{ position: "absolute", inset: 0 }}>
        {/* Left panel: now playing / last played / up next */}
        <div style={panelStyle("left")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <span style={dotStyle} />
            <span style={tagStyle}>Now playing</span>
            <span style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 16, marginLeft: 4 }}>
              {[0, 1, 2, 3].map((i) => (
                <i key={i} style={{ width: 3.5, background: "var(--gold)", display: "block", borderRadius: 1, animation: `eq 1s ease-in-out infinite ${i * 0.15}s` }} />
              ))}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 30, lineHeight: 1.15, color: "#fff" }}>{state?.nowPlaying?.title || "—"}</div>
          <div style={{ color: "#e7c9a8", fontSize: 20, marginTop: 6 }}>{state?.nowPlaying?.artist || ""}</div>

          <div style={{ height: 1, background: "rgba(232,161,60,.35)", margin: "18px 0" }} />

          <div style={miniPillStyle}>
            <div style={miniTagStyle}>Last played</div>
            <div style={miniTitleStyle}>{state?.lastPlayed?.title || "—"}</div>
            <div style={miniArtistStyle}>{state?.lastPlayed?.artist || ""}</div>
          </div>
          <div style={{ ...miniPillStyle, marginTop: 12 }}>
            <div style={miniTagStyle}>Up next</div>
            <div style={miniTitleStyle}>{upNext?.title || "—"}</div>
            <div style={miniArtistStyle}>{upNext?.artist || ""}</div>
          </div>
        </div>

        {/* Right panel: QR code */}
        <div style={panelStyle("right")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
            <span style={dotStyle} />
            <span style={tagStyle}>Request</span>
          </div>
          {qrDataUrl && <img src={qrDataUrl} alt="QR code to request a song" style={{ width: "100%", borderRadius: 6 }} />}
          <div style={{ color: "var(--ink-dim)", fontSize: 14, marginTop: 10, wordBreak: "break-all" }}>{requestUrl.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    </div>
  );
}

function panelStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: "1%",
    background: "rgba(12,7,5,.9)",
    border: "3px solid var(--gold)",
    borderRadius: 18,
    padding: 28,
    width: "34%",
    maxWidth: 320,
    boxShadow: "0 0 20px rgba(232,161,60,.4)",
    textAlign: "center",
  } as React.CSSProperties;
}

const dotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "var(--gold)",
  boxShadow: "0 0 8px var(--gold)",
  animation: "pulse 1.6s infinite",
};

const tagStyle: React.CSSProperties = {
  fontSize: 18,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--gold)",
  fontWeight: 700,
};

const miniPillStyle: React.CSSProperties = {
  background: "rgba(0,0,0,.3)",
  border: "1px solid rgba(232,161,60,.3)",
  borderRadius: 10,
  padding: "10px 14px",
  textAlign: "center",
};

const miniTagStyle: React.CSSProperties = {
  fontSize: 15,
  letterSpacing: ".04em",
  color: "var(--gold)",
  textTransform: "uppercase",
  fontWeight: 700,
};

const miniTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#fff",
  lineHeight: 1.2,
  marginTop: 3,
};

const miniArtistStyle: React.CSSProperties = {
  fontSize: 18,
  color: "#c9a98a",
  marginTop: 2,
};
