"use client";

import { useEffect, useState } from "react";
import type { LinkItem, CalendarEntry, AffiliateItem, Suggestion, Supporter } from "@/lib/site-state";
import { supporterIsFounding } from "@/lib/founding";

type Tab = "profile" | "links" | "calendar" | "affiliates" | "suggestions" | "supporters" | "giveaway";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SiteAdminPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [photoUrl, setPhotoUrl] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [status, setStatus] = useState("");

  function loadAll() {
    fetch("/api/site/state", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setPhotoUrl(data.photoUrl || "");
        setLinks(data.links || []);
        setCalendar(data.calendar || []);
        setAffiliates(data.affiliates || []);
      });
    fetch("/api/site/suggestions-admin", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions || []));
    fetch("/api/site/supporters-admin", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSupporters(data.supporters || []));
  }

  useEffect(loadAll, []);

  async function savePhoto(next: string) {
    setPhotoUrl(next);
    await fetch("/api/site/photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: next }),
    });
    flash("Photo saved.");
  }

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

  async function editSupporter(id: string, changes: { name?: string; message?: string; founding?: boolean }) {
    const res = await fetch("/api/site/supporters-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "edit", ...changes }),
    });
    const data = await res.json();
    if (data.supporter) {
      setSupporters((prev) => prev.map((s) => (s.id === id ? data.supporter : s)));
    }
  }

  async function deleteSupporter(id: string) {
    setSupporters((prev) => prev.filter((s) => s.id !== id));
    await fetch("/api/site/supporters-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.h1}>Site Admin</h1>
        <p style={styles.sub}>Edit everything on jackieespada.com — changes save instantly.</p>

        <div style={styles.tabs}>
          {(["profile", "links", "calendar", "affiliates", "suggestions", "supporters", "giveaway"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tab === t ? styles.tabActive : styles.tab}
            >
              {t === "profile" && "Profile"}
              {t === "links" && "Links"}
              {t === "calendar" && "Calendar"}
              {t === "affiliates" && "Shop My Favorites"}
              {t === "suggestions" && `Suggestions${suggestions.filter((s) => !s.read).length ? ` (${suggestions.filter((s) => !s.read).length})` : ""}`}
              {t === "supporters" && `Supporters${supporters.length ? ` (${supporters.length})` : ""}`}
              {t === "giveaway" && "Giveaway"}
            </button>
          ))}
        </div>

        {status && <div style={styles.flash}>{status}</div>}

        {tab === "profile" && (
          <ProfileEditor photoUrl={photoUrl} onSave={savePhoto} />
        )}
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
        {tab === "giveaway" && <GiveawayAdmin />}
        {tab === "supporters" && (
          <SupportersList supporters={supporters} onDelete={deleteSupporter} onEdit={editSupporter} />
        )}
      </div>
    </div>
  );
}

// ---------- Profile ----------
function ProfileEditor({ photoUrl, onSave }: { photoUrl: string; onSave: (url: string) => void }) {
  const [local, setLocal] = useState(photoUrl);
  useEffect(() => setLocal(photoUrl), [photoUrl]);

  return (
    <div>
      <p style={{ color: "#c2a488", fontSize: 13.5, marginBottom: 14 }}>
        Paste a link to a photo that's already hosted somewhere (Imgur, a Google Drive share link, etc.).
        This is what shows up as your profile picture on jackieespada.com.
      </p>
      {local && (
        <img
          src={local}
          alt="Preview"
          style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 14, border: "2px solid #5a3a24" }}
        />
      )}
      <input
        style={{ ...styles.input, width: "100%", marginBottom: 12 }}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="https://..."
      />
      <button style={styles.saveBtn} onClick={() => onSave(local)}>Save Photo</button>
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
      <p style={{ color: "#c2a488", fontSize: 13, marginBottom: 14 }}>
        Leave "One-time date" blank for a show that repeats every week. Fill in a date to add a single
        special that shows up only on that day (like a guest episode) without repeating.
      </p>
      {local.map((c) => (
        <div key={c.id} style={styles.row}>
          <select style={styles.select} value={c.day} onChange={(e) => update(c.id, "day", e.target.value)}>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input style={styles.input} value={c.time} onChange={(e) => update(c.id, "time", e.target.value)} placeholder="Time" />
          <input style={styles.input} value={c.showName} onChange={(e) => update(c.id, "showName", e.target.value)} placeholder="Show name" />
          <input style={styles.input} value={c.note || ""} onChange={(e) => update(c.id, "note", e.target.value)} placeholder="Note (optional)" />
          <input
            style={styles.input}
            type="date"
            value={c.date || ""}
            onChange={(e) => update(c.id, "date", e.target.value)}
            title="One-time date (optional) — leave blank for a weekly recurring show"
          />
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

// ---------- Supporters ----------
function SupportersList({
  supporters,
  onDelete,
  onEdit,
}: {
  supporters: Supporter[];
  onDelete: (id: string) => void;
  onEdit: (id: string, changes: { name?: string; message?: string; founding?: boolean }) => Promise<void>;
}) {
  if (supporters.length === 0) {
    return <p style={{ color: "#c2a488" }}>No monthly supporters yet.</p>;
  }
  return (
    <div>
      <p style={{ color: "#c2a488", fontSize: 13, marginBottom: 14 }}>
        These are the people currently showing up on your public supporter wall.
        Edit a name or message here (like when someone joined anonymously), or delete one if
        something needs to be taken down. Everyone who signs up before January 1, 2027 gets the
        Founding VIP badge automatically.
      </p>
      {supporters.map((s) => (
        <SupporterRow key={s.id} s={s} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
}

function SupporterRow({
  s,
  onDelete,
  onEdit,
}: {
  s: Supporter;
  onDelete: (id: string) => void;
  onEdit: (id: string, changes: { name?: string; message?: string; founding?: boolean }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name || "");
  const [message, setMessage] = useState(s.message || "");
  const [founding, setFounding] = useState(supporterIsFounding(s));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onEdit(s.id, { name, message, founding });
    setSaving(false);
    setEditing(false);
  }

  return (
    <div style={{ ...styles.row, flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>
        {supporterIsFounding(s) && <span style={{ color: "#e8a13c" }}>★ FOUNDING VIP · </span>}
        {s.name || "Anonymous"}{s.tier ? ` [${s.tier.toUpperCase()}]` : ""} - ${(s.amountCents / 100).toFixed(2)}/mo
      </div>
      {s.themeIdea && (
        <div style={{ fontSize: 13, color: "#e8a13c", marginTop: 4 }}>Theme night idea: {s.themeIdea}</div>
      )}
      {!editing && s.message && (
        <div style={{ fontSize: 13, color: "#fbeedd", marginTop: 4 }}>{s.message}</div>
      )}
      <div style={{ fontSize: 12, color: "#c2a488", marginTop: 6 }}>
        {new Date(s.ts).toLocaleString()}
      </div>

      {editing ? (
        <div style={{ width: "100%", marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name (leave blank for Anonymous)" />
          <input style={styles.input} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message for the wall (optional)" />
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={founding} onChange={(e) => setFounding(e.target.checked)} />
            Founding VIP badge
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.saveBtn} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button style={styles.addBtn} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button style={styles.addBtn} onClick={() => setEditing(true)}>Edit</button>
          <button style={styles.removeBtn} onClick={() => onDelete(s.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ---------- Giveaway ----------
type GSettings = {
  title: string; opensAt: number; closesAt: number; drawText: string; prizes: string[];
  sponsorName: string; sponsorAddress: string; brands: string;
  words: { id: string; word: string; label: string; addedAt: number; active: boolean }[];
  winners: { emailKey: string; nickname: string; name: string; email: string; prize: string; drawnAt: number }[];
};
type GEntrant = {
  emailKey: string; email: string; name: string; nickname: string; refCode: string; substack: boolean; telegram: boolean;
  wordsRedeemed: string[]; referrals: string[]; bonus: number; disqualified?: boolean; createdAt: number;
  breakdown: { base: number; substack: number; telegram: number; words: number; referrals: number; bonus: number; total: number };
};

function toLocalInput(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function GiveawayAdmin() {
  const [settings, setSettings] = useState<GSettings | null>(null);
  const [entrants, setEntrants] = useState<GEntrant[]>([]);
  const [prizesText, setPrizesText] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [drawPrize, setDrawPrize] = useState("");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const data = await fetch("/api/giveaway/admin", { cache: "no-store" }).then((r) => r.json());
    if (data.settings) {
      setSettings(data.settings);
      setPrizesText((data.settings.prizes || []).join("\n"));
      setDrawPrize((p) => p || data.settings.prizes?.[0] || "");
    }
    setEntrants(data.entrants || []);
  }
  useEffect(() => { load(); }, []);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/giveaway/admin", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) setNote(data.error);
    return data;
  }

  if (!settings) return <p style={{ color: "#c2a488" }}>Loading giveaway...</p>;

  const totalEntries = entrants.filter((e) => !e.disqualified).reduce((n, e) => n + e.breakdown.total, 0);
  const shown = entrants.filter((e) =>
    !search || `${e.name} ${e.nickname} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {note && <div style={styles.flash}>{note}</div>}
      {!settings.sponsorAddress && (
        <div style={{ ...styles.flash, color: "#e88a8a" }}>
          Add your business mailing address below. The official rules need it before entries open.
        </div>
      )}
      <p style={{ color: "#c2a488", fontSize: 13 }}>
        {entrants.length} players · {totalEntries} entries · public page at <a href="/giveaway" style={{ color: "#e8a13c" }}>/giveaway</a>
      </p>

      <h3 style={{ color: "#e8a13c", fontSize: 15 }}>🔑 Secret words</h3>
      <p style={{ color: "#c2a488", fontSize: 12.5 }}>Add tonight's word right before you say it on air. Turn old words off so they stop working.</p>
      <div style={styles.row}>
        <input style={styles.input} placeholder="Secret word" value={newWord} onChange={(e) => setNewWord(e.target.value)} />
        <input style={styles.input} placeholder="Label (e.g. Dec 3 Midnight)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        <button style={styles.saveBtn} onClick={async () => {
          const d = await post({ action: "addWord", word: newWord, label: newLabel });
          if (d.settings) { setSettings(d.settings); setNewWord(""); setNewLabel(""); setNote(`Added "${newWord}"`); }
        }}>Add</button>
      </div>
      {[...settings.words].reverse().map((w) => (
        <div key={w.id} style={styles.row}>
          <b style={{ flex: 1 }}>{w.word}</b>
          <span style={{ color: "#c2a488", fontSize: 12.5 }}>{w.label}</span>
          <span style={{ fontSize: 12.5, color: "#c2a488" }}>{entrants.filter((e) => e.wordsRedeemed.includes(w.id)).length} used</span>
          <button style={w.active ? styles.removeBtn : styles.addBtn} onClick={async () => {
            const d = await post({ action: "toggleWord", id: w.id }); if (d.settings) setSettings(d.settings);
          }}>{w.active ? "Turn off" : "Turn on"}</button>
        </div>
      ))}

      <h3 style={{ color: "#e8a13c", fontSize: 15, marginTop: 26 }}>🎲 Draw winners</h3>
      <div style={styles.row}>
        <select style={styles.select} value={drawPrize} onChange={(e) => setDrawPrize(e.target.value)}>
          {settings.prizes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button style={styles.saveBtn} onClick={async () => {
          if (!confirm(`Draw a random winner for: ${drawPrize}?`)) return;
          const d = await post({ action: "draw", prize: drawPrize });
          if (d.winner) { setSettings(d.settings); setNote(`🎉 Winner: ${d.winner.nickname} (${d.winner.name})`); }
        }}>Draw a winner</button>
      </div>
      {settings.winners.map((w) => (
        <div key={w.emailKey} style={{ ...styles.row, flexDirection: "column", alignItems: "flex-start" }}>
          <b>🏆 {w.nickname} · {w.name}</b>
          <span style={{ fontSize: 12.5, color: "#c2a488" }}>{w.email} · {w.prize}</span>
          <button style={{ ...styles.removeBtn, marginTop: 8 }} onClick={async () => {
            if (!confirm("Remove this winner (for example, if they didn't claim in time)?")) return;
            const d = await post({ action: "removeWinner", emailKey: w.emailKey }); if (d.settings) setSettings(d.settings);
          }}>Remove winner</button>
        </div>
      ))}

      <h3 style={{ color: "#e8a13c", fontSize: 15, marginTop: 26 }}>👥 Players</h3>
      <input style={{ ...styles.input, width: "100%", marginBottom: 10 }} placeholder="Search name, nickname, or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      {shown.map((e) => (
        <div key={e.emailKey} style={{ ...styles.row, flexDirection: "column", alignItems: "flex-start", opacity: e.disqualified ? 0.5 : 1 }}>
          <div style={{ fontWeight: 700 }}>{e.breakdown.total} entries · {e.nickname} <span style={{ fontWeight: 400, color: "#c2a488" }}>({e.name}, {e.email})</span></div>
          <div style={{ fontSize: 12, color: "#c2a488", marginTop: 4 }}>
            base 1 · substack {e.breakdown.substack} · telegram {e.breakdown.telegram} · words {e.breakdown.words} · friends {e.breakdown.referrals} · bonus {e.breakdown.bonus}
            {" · "}joined {new Date(e.createdAt).toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button style={styles.addBtn} onClick={async () => { await post({ action: "adjust", emailKey: e.emailKey, bonus: (e.bonus || 0) + 1 }); load(); }}>+1 bonus</button>
            <button style={styles.addBtn} onClick={async () => { await post({ action: "adjust", emailKey: e.emailKey, bonus: (e.bonus || 0) - 1 }); load(); }}>-1</button>
            <button style={styles.removeBtn} onClick={async () => { await post({ action: "adjust", emailKey: e.emailKey, disqualified: !e.disqualified }); load(); }}>
              {e.disqualified ? "Reinstate" : "Disqualify"}
            </button>
            <button style={styles.removeBtn} onClick={async () => {
              if (!confirm(`Permanently delete ${e.nickname}'s entry? Use this for test entries.`)) return;
              await post({ action: "delete", emailKey: e.emailKey }); load();
            }}>Delete</button>
          </div>
        </div>
      ))}

      <h3 style={{ color: "#e8a13c", fontSize: 15, marginTop: 26 }}>⚙️ Settings</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={styles.checkLabel}>Title</label>
        <input style={styles.input} value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} />
        <label style={styles.checkLabel}>Entries open (your local time)</label>
        <input type="datetime-local" style={styles.input} value={toLocalInput(settings.opensAt)} onChange={(e) => setSettings({ ...settings, opensAt: new Date(e.target.value).getTime() })} />
        <label style={styles.checkLabel}>Entries close (your local time)</label>
        <input type="datetime-local" style={styles.input} value={toLocalInput(settings.closesAt)} onChange={(e) => setSettings({ ...settings, closesAt: new Date(e.target.value).getTime() })} />
        <label style={styles.checkLabel}>When and where you draw</label>
        <input style={styles.input} value={settings.drawText} onChange={(e) => setSettings({ ...settings, drawText: e.target.value })} />
        <label style={styles.checkLabel}>Prizes (one per line)</label>
        <textarea style={{ ...styles.input, minHeight: 80 }} value={prizesText} onChange={(e) => setPrizesText(e.target.value)} />
        <label style={styles.checkLabel}>Brand disclosure</label>
        <input style={styles.input} value={settings.brands} onChange={(e) => setSettings({ ...settings, brands: e.target.value })} />
        <label style={styles.checkLabel}>Sponsor (your LLC)</label>
        <input style={styles.input} value={settings.sponsorName} onChange={(e) => setSettings({ ...settings, sponsorName: e.target.value })} />
        <label style={styles.checkLabel}>Sponsor mailing address (shown in the official rules)</label>
        <input style={styles.input} value={settings.sponsorAddress} onChange={(e) => setSettings({ ...settings, sponsorAddress: e.target.value })} placeholder="A business address or PO box is fine" />
        <button style={{ ...styles.saveBtn, alignSelf: "flex-start" }} onClick={async () => {
          const d = await post({ action: "saveSettings", settings: { ...settings, prizes: prizesText.split("\n").map((p) => p.trim()).filter(Boolean) } });
          if (d.settings) { setSettings(d.settings); setNote("Giveaway settings saved."); }
        }}>Save settings</button>
      </div>
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
