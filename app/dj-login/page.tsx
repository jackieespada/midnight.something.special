"use client";

import { useState } from "react";

export default function DjLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Incorrect password.");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/dj";
    window.location.href = next;
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 16px", minHeight: "100vh", background: "#1f130f" }}>
      <h1 style={{ fontSize: 22, color: "#fbeedd", marginBottom: 4 }}>DJ Panel</h1>
      <p style={{ color: "#c2a488", fontSize: 13.5, marginBottom: 20 }}>Enter the password to continue.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Password"
        style={{
          width: "100%",
          padding: "12px 15px",
          borderRadius: 14,
          border: "1px solid #5a3a24",
          background: "#150d09",
          color: "#fbeedd",
          fontSize: 15,
        }}
      />
      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 14,
          padding: 14,
          borderRadius: 999,
          border: "none",
          background: "#e8a13c",
          color: "#1a0f08",
          fontWeight: 700,
          fontSize: 14.5,
          cursor: "pointer",
        }}
      >
        {loading ? "Checking..." : "Log in"}
      </button>
      {error && <div style={{ color: "#c104b0", marginTop: 12, fontSize: 13 }}>{error}</div>}
    </div>
  );
}
