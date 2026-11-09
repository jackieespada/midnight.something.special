import type { CSSProperties } from "react";

export const metadata = {
  title: "Stream Soundtrack | Jackie Espada",
  description:
    "The music you hear on my streams before we go live. Listen anytime on Pixabay.",
};

const PLAYLIST_URL =
  "https://pixabay.com/playlists/music-used-on-streams-34640715/";

type Track = {
  show: string;
  title: string;
  artist: string;
  length: string;
  url: string;
  accent: string;
};

const TRACKS: Track[] = [
  {
    show: "The Midnight Something Special",
    title: "Late Night Jazz - Midnight Club Music",
    artist: "alex-morgan",
    length: "2:34",
    url: "https://pixabay.com/music/modern-jazz-late-night-jazz-midnight-club-music-564261/",
    accent: "#d4af37",
  },
  {
    show: "Hooks + Harmony",
    title: "Upbeat Background Music",
    artist: "SigmaMusicArt",
    length: "1:47",
    url: "https://pixabay.com/music/upbeat-upbeat-background-music-514577/",
    accent: "#e0369b",
  },
  {
    show: "Sunday Bible Study",
    title: "Jazz No Copyright Music",
    artist: "AbsoluteSound",
    length: "2:55",
    url: "https://pixabay.com/music/introoutro-jazz-no-copyright-music-560572/",
    accent: "#7762f6",
  },
  {
    show: "Light Work",
    title: "No Copyright Music",
    artist: "moodmode",
    length: "2:16",
    url: "https://pixabay.com/music/funk-no-copyright-music-201745/",
    accent: "#f2c94c",
  },
  {
    show: "Everything Else",
    title: "Inspiring Cinematic Music",
    artist: "Tunetank",
    length: "2:12",
    url: "https://pixabay.com/music/main-title-inspiring-cinematic-music-409347/",
    accent: "#f5922f",
  },
];

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #1d1630 0%, #0c0a14 70%)",
  color: "#f4f1fa",
  fontFamily:
    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  padding: "56px 20px 80px",
};

const wrapStyle: CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
};

const eyebrowStyle: CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#1fbfb8",
  margin: 0,
};

const titleStyle: CSSProperties = {
  fontSize: "clamp(32px, 6vw, 48px)",
  lineHeight: 1.1,
  margin: "10px 0 14px",
  fontWeight: 800,
};

const introStyle: CSSProperties = {
  fontSize: 17,
  lineHeight: 1.6,
  color: "#cfc8de",
  margin: "0 0 28px",
};

const bigButtonStyle: CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(90deg, #e0369b, #7b3fe4)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 17,
  padding: "14px 26px",
  borderRadius: 999,
  boxShadow: "0 6px 24px rgba(224, 54, 155, 0.35)",
};

const listStyle: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "40px 0 0",
  display: "grid",
  gap: 14,
};

const showLabelBase: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 700,
  margin: 0,
};

const songStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "6px 0 2px",
};

const artistStyle: CSSProperties = {
  fontSize: 14,
  color: "#a79fba",
  margin: 0,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const footerStyle: CSSProperties = {
  marginTop: 40,
  fontSize: 14,
  lineHeight: 1.6,
  color: "#8f87a3",
};

const footerLinkStyle: CSSProperties = {
  color: "#cfc8de",
};

function cardStyle(accent: string): CSSProperties {
  return {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderLeft: `4px solid ${accent}`,
    borderRadius: 14,
    padding: "18px 20px",
  };
}

function listenStyle(accent: string): CSSProperties {
  return {
    color: accent,
    border: `1px solid ${accent}`,
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  };
}

export default function SoundtrackPage() {
  return (
    <main style={pageStyle}>
      <div style={wrapStyle}>
        <p style={eyebrowStyle}>Starting Soon</p>
        <h1 style={titleStyle}>The Stream Soundtrack</h1>
        <p style={introStyle}>
          You asked, so here it is. These are the songs playing while you wait
          for me to go live. Every show has its own song, so pick your
          favorite (or play all of them while you work, study, or pretend to
          clean your kitchen).
        </p>

        <a
          href={PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={bigButtonStyle}
        >
          Play the whole playlist
        </a>

        <ul style={listStyle}>
          {TRACKS.map((t) => (
            <li key={t.url} style={cardStyle(t.accent)}>
              <div style={rowStyle}>
                <div>
                  <p style={{ ...showLabelBase, color: t.accent }}>{t.show}</p>
                  <p style={songStyle}>{t.title}</p>
                  <p style={artistStyle}>
                    by {t.artist} · {t.length}
                  </p>
                </div>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={listenStyle(t.accent)}
                >
                  Listen
                </a>
              </div>
            </li>
          ))}
        </ul>

        <p style={footerStyle}>
          All music is royalty free from{" "}
          <a
            href="https://pixabay.com/music/"
            target="_blank"
            rel="noopener noreferrer"
            style={footerLinkStyle}
          >
            Pixabay
          </a>
          . Huge thanks to the artists who made it. Go show them some love!
        </p>
      </div>
    </main>
  );
}
