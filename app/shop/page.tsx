"use client";

import { useEffect, useState } from "react";
import type { AffiliateItem } from "@/lib/site-state";

export default function ShopPage() {
  const [items, setItems] = useState<AffiliateItem[]>([]);

  useEffect(() => {
    fetch("/api/site/state", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setItems((data.affiliates || []).filter((a: AffiliateItem) => a.enabled)));
  }, []);

  const categories: string[] = [];
  items.forEach((i) => {
    if (!categories.includes(i.category)) categories.push(i.category);
  });

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <a href="/" style={styles.back}>‹ Back to jackieespada.com</a>

        <div style={styles.header}>
          <h1 style={styles.h1}>Shop My Favorites</h1>
          <p style={styles.headerP}>
            The stuff I actually use and love — from skincare to coffee to Bible study tools.
            Using my codes and links supports the shows at no extra cost to you.
          </p>
          <div style={styles.disclosure}>
            Some of these are affiliate links, which means I may earn a small commission if you shop through them.
            I only share things I genuinely use myself.
          </div>
        </div>

        {categories.map((cat) => (
          <div key={cat} style={styles.section}>
            <div style={styles.sectionTitle}>{cat}</div>
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <div key={item.id} style={styles.itemCard}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: 13, color: "#c9b8e0", marginTop: 4, lineHeight: 1.5 }}>
                      {item.description}
                    </div>
                  )}
                  <div style={styles.itemBottom}>
                    {item.code ? <span style={styles.codePill}>CODE: {item.code}</span> : <span />}
                    <a href={item.url} style={styles.shopBtn}>Shop</a>
                  </div>
                </div>
              ))}
          </div>
        ))}

        <footer style={styles.footer}>© Jackie Espada · A Jovial Abundance Enterprise, LLC production</footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    color: "#fdf6ff",
    fontFamily: "'Poppins', sans-serif",
    paddingBottom: 60,
    background:
      "radial-gradient(circle at 15% 10%, rgba(255,63,164,.30), transparent 40%), radial-gradient(circle at 85% 20%, rgba(77,217,232,.26), transparent 42%), linear-gradient(180deg, #160a2e, #2a0e3d)",
  },
  wrap: { maxWidth: 760, margin: "0 auto", padding: "0 18px" },
  back: { display: "inline-block", margin: "20px 0 0", color: "#c9b8e0", fontSize: 13, textDecoration: "none" },
  header: { textAlign: "center", padding: "22px 18px 26px" },
  h1: {
    margin: "0 0 6px",
    fontSize: 38,
    fontWeight: 700,
    fontFamily: "'Dancing Script', cursive",
    background: "linear-gradient(90deg,#ff3fa4,#4dd9e8)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },
  headerP: { margin: "0 auto", maxWidth: 480, color: "#c9b8e0", fontSize: 14, lineHeight: 1.6 },
  disclosure: {
    marginTop: 14,
    fontSize: 11.5,
    color: "#c9b8e0",
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 12,
    padding: "10px 14px",
    maxWidth: 480,
    marginLeft: "auto",
    marginRight: "auto",
  },
  section: { marginTop: 34 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#fdf6ff", margin: "0 0 14px" },
  itemCard: {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  itemBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 10 },
  codePill: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#4dd9e8",
    background: "rgba(77,217,232,.12)",
    border: "1px solid rgba(77,217,232,.35)",
    padding: "5px 10px",
    borderRadius: 999,
  },
  shopBtn: {
    background: "linear-gradient(90deg,#ff3fa4,#4dd9e8)",
    color: "#160a2e",
    fontWeight: 700,
    fontSize: 13,
    padding: "9px 20px",
    borderRadius: 999,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  footer: { textAlign: "center", color: "#c9b8e0", fontSize: 12, marginTop: 50, paddingTop: 20, lineHeight: 1.7 },
};
