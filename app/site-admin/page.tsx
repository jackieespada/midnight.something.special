"use client";

import { useEffect, useState } from "react";
import type { LinkItem, CalendarEntry, AffiliateItem, Suggestion } from "@/lib/site-state";

type Tab = "links" | "calendar" | "affiliates" | "suggestions";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SiteAdminPage() {
  const [tab, setTab] = useState<Tab>("links");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState("");

  function loadAll() {
    fetch("/api/site/state", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setLinks(data.links || []);
        setCalendar(data.calendar || []);
        setAffiliates(data.affiliates || []);
      });
    fetch("/api/site/suggestions-admin", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions || []));
  }

  useEffect(loadAll, []);

  async function saveLinks(next: LinkItem[]) {
    setLinks(next);
    await fetch("/api/site/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: next }),
    });
    flash("Links saved.");
  }

  async function saveCalendar(next: CalendarEntry[]) {
    setCalendar(next);
    await fetch("/api/site/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar: next }),
    });
    flash("Calendar saved.");
  }

  async function saveAffiliates(next: AffiliateItem[]) {
    setAffiliates(next);
    await fetch("/api/site/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliates: next }),
    });
    flash("Affiliates saved.");
  }

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2000);
  }

  async function markRead(id: string) {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, read: true } : s)));
    await fetch("/api/site/suggestions-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "read" }),
    });
  }

  async function deleteSuggestion(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    await fetch("/api/site/suggestions-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "delete" }),
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.h1}>Site Admin</h1>
        <p style={styles.sub}>Edit everything on jackieespada.com — changes save instantly.</p>

        <div style={styles.tabs}>
          {(["links", "calendar", "affiliates", "suggestions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tab === t ? styles.tabActive : styles.tab}
            >
              {t === "links" && "Links"}
              {t === "calendar" && "Calendar"}
              {t === "affiliates" && "Shop My Favorites"}
              {t === "suggestions" && `Suggestions${suggestions.filter((s) => !s.read).length ? ` (${suggestions.filter((s) => !s.read).length})` : ""}`}
            </button>
          ))}
        </div>

        {status && <div style={styles.flash}>{status}</div>}

        {tab === "links" && (
          <LinksEditor links={links} onSave={saveLinks} />
        )}
        {tab === "calendar" && (
          <CalendarEditor calendar={calendar} onSave={saveCalendar} />
        )}
        {tab === "affiliates" && (
          <AffiliatesEditor affiliates={affiliates} onSave={saveAffiliates} />
        )}
        {tab === "suggestions" && (
          <SuggestionsList suggestions={suggestions} onRead={markRead} onDelete={deleteSuggestion} />
        )}
      </div>
    </div>
  );
}

// ---------- Links ----------
function LinksEditor({ links, onSave }: { links: LinkItem[]; onSave: (l: LinkItem[]) => void }) {
  const [local, setLocal] = useState(links);
  useEffect(() => setLocal(links), [links]);

  function update(id: string, field: keyof LinkItem, value: any) {
    setLocal((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }
  function remove(id: string) {
    setLocal((prev) => prev.filter((l) => l.id !== id));
  }
  function add() {
    setLocal((prev) => [...prev, { id: newId(), label: "New Link", url: "#", section: "extras", enabled: true }]);
  }

  return (
    <div>
      {local.map((l) => (
        <div key={l.id} style={styles.row}>
          <input style={styles.input} value={l.label} onChange={(e) => update(l.id, "label", e.target.value)} placeholder="Label" />
          <input style={styles.input} value={l.url} onChange={(e) => update(l.id, "url", e.target.value)} placeholder="URL" />
          <select style={styles.select} value={l.section} onChange={(e) => update(l.id, "section", e.target.value)}>
            <option value="support">Support</option>
            <option value="social">Social</option>
            <option value="extras">Extras</option>
          </select>
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={l.enabled} onChange={(e) => update(l.id, "enabled", e.target.checked)} /> Shown
          </label>
          <button style={styles.removeBtn} onClick={() => remove(l.id)}>Remove</button>
        </div>
      ))}
      <button style={styles.addBtn} onClick={add}>+ Add Link</button>
      <button style={styles.saveBtn} onClick={() => onSave(local)}>Save Links</button>
    </div>
  );
}

// ---------- Calendar ----------
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function CalendarEditor({ calendar, onSave }: { calendar: CalendarEntry[]; onSave: (c: CalendarEntry[]) => void }) {
  const [local, setLocal] = useState(calendar);
  useEffect(() => setLocal(calendar), [calendar]);

  function update(id: string, field: keyof CalendarEntry, value: any) {
    setLocal((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }
  function remove(id: string) {
    setLocal((prev) => prev.filter((c) => c.id !== id));
  }
  function add() {
    setLocal((prev) => [...prev, { id: newId(), day: "Sun", time: "12:00 PM ET", showName: "New Show" }]);
  }

  return (
    <div>
      {local.map((c) => (
        <div key={c.id} style={styles.row}>
          <select style={styles.select} value={c.day} onChange={(e) => update(c.id, "day", e.target.value)}>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input style={styles.input} value={c.time} onChange={(e) => update(c.id, "time", e.target.value)} placeholder="Time" />
          <input style={styles.input} value={c.showName} onChange={(e) => update(c.id, "showName", e.target.value)} placeholder="Show name" />
          <input style={styles.input} value={c.note || ""} onChange={(e) => update(c.id, "note", e.target.value)} placeholder="Note (optional)" />
          <input style={styles.input} value={c.linksTo || ""} onChange={(e) => update(c.id, "linksTo", e.target.value)} placeholder="Links to (e.g. /request)" />
          <button style={styles.removeBtn} onClick={() => remove(c.id)}>Remove</button>
        </div>
      ))}
      <button style={styles.addBtn} onClick={add}>+ Add Show</button>
      <button style={styles.saveBtn} onClick={() => onSave(local)}>Save Calendar</button>
    </div>
  );
}

// ---------- Affiliates ----------
function AffiliatesEditor({ affiliates, onSave }: { affiliates: AffiliateItem[]; onSave: (a: AffiliateItem[]) => void }) {
  const [local, setLocal] = useState(affiliates);
  useEffect(() => setLocal(affiliates), [affiliates]);

  function update(id: string, field: keyof AffiliateItem, value: any) {
    setLocal((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }
  function remove(id: string) {
    setLocal((prev) => prev.filter((a) => a.id !== id));
  }
  function add() {
    setLocal((prev) => [...prev, { id: newId(), category: "Lifestyle + Everyday Favorites", name: "New Sponsor", url: "#", enabled: true }]);
  }

  return (
    <div>
      {local.map((a) => (
        <div key={a.id} style={styles.row}>
          <input style={styles.input} value={a.category} onChange={(e) => update(a.id, "category", e.target.value)} placeholder="Category" />
          <input style={styles.input} value={a.name} onChange={(e) => update(a.id, "name", e.target.value)} placeholder="Name" />
          <input style={styles.input} value={a.description || ""} onChange={(e) => update(a.id, "description", e.target.value)} placeholder="Description" />
          <input style={styles.input} value={a.code || ""} onChange={(e) => update(a.id, "code", e.target.value)} placeholder="Discount code" />
          <input style={styles.input} value={a.url} onChange={(e) => update(a.id, "url", e.target.value)} placeholder="URL" />
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={a.enabled} onChange={(e) => update(a.id, "enabled", e.target.checked)} /> Shown
          </label>
          <button style={styles.removeBtn} onClick={() => remove(a.id)}>Remove</button>
        </div>
      ))}
      <button style={styles.addBtn} onClick={add}>+ Add Sponsor</button>
      <button style={styles.saveBtn} onClick={() => onSave(local)}>Save Shop Page</button>
    </div>
  );
}

// ---------- Suggestions ----------
function SuggestionsList({
  suggestions,
  onRead,
  onDelete,
}: {
  suggestions: Suggestion[];
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (suggestions.length === 0) {
    return <p style={{ color: "#c2a488" }}>No suggestions yet.</p>;
  }
  return (
    <div>
      {suggestions.map((s) => (
        <div key={s.id} style={{ ...styles.row, flexDirection: "column", alignItems: "flex-start", opacity: s.read ? 0.6 : 1 }}>
          <div style={{ fontSize: 14 }}>{s.text}</div>
          <div style={{ fontSize: 12, color: "#c2a488", marginTop: 6 }}>
            {s.name ? `— ${s.name}` : "— anonymous"} · {new Date(s.ts).toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {!s.read && <button style={styles.addBtn} onClick={() => onRead(s.id)}>Mark read</button>}
            <button style={styles.removeBtn} onClick={() => onDelete(s.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#1f130f", color: "#fbeedd", fontFamily: "sans-serif", padding: "40px 16px" },
  wrap: { maxWidth: 720, margin: "0 auto" },
  h1: { fontSize: 24, margin: "0 0 4px" },
  sub: { color: "#c2a488", fontSize: 13.5, marginBottom: 20 },
  tabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tab: {
    padding: "9px 16px", borderRadius: 999, border: "1px solid #5a3a24",
    background: "#150d09", color: "#c2a488", fontSize: 13, cursor: "pointer",
  },
  tabActive: {
    padding: "9px 16px", borderRadius: 999, border: "none",
    background: "#e8a13c", color: "#1a0f08", fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  flash: { background: "#2c1c14", border: "1px solid #5a3a24", borderRadius: 10, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: "#e8a13c" },
  row: {
    display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
    background: "#241610", border: "1px solid #4a3220", borderRadius: 12, padding: 12, marginBottom: 10,
  },
  input: { flex: "1 1 140px", padding: "9px 11px", borderRadius: 8, border: "1px solid #5a3a24", background: "#150d09", color: "#fbeedd", fontSize: 13 },
  select: { padding: "9px 11px", borderRadius: 8, border: "1px solid #5a3a24", background: "#150d09", color: "#fbeedd", fontSize: 13 },
  checkLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#c2a488" },
  removeBtn: { padding: "8px 14px", borderRadius: 999, border: "1px solid #7a3a3a", background: "transparent", color: "#e88a8a", fontSize: 12.5, cursor: "pointer" },
  addBtn: { padding: "9px 16px", borderRadius: 999, border: "1px solid #5a3a24", background: "transparent", color: "#e8a13c", fontSize: 13, cursor: "pointer", marginRight: 10 },
  saveBtn: { padding: "9px 20px", borderRadius: 999, border: "none", background: "#e8a13c", color: "#1a0f08", fontWeight: 700, fontSize: 13, cursor: "pointer" },
};
