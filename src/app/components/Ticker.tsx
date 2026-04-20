"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Film = { id: string; title: string; creator_name?: string | null };

export default function Ticker() {
  const [latest, setLatest] = useState<Film | null>(null);
  const [total, setTotal] = useState(25);

  useEffect(() => {
    supabase.from("movies").select("id,title,creator_name").eq("status", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      if (data) setLatest(data as Film);
    });
    supabase.from("movies").select("id", { count: "exact", head: true }).eq("status", "approved").then(({ count }) => {
      if (count) setTotal(count);
    });
  }, []);

  const items = [
    { kind: "NOW PLAYING", body: latest ? `${latest.title}${latest.creator_name ? " - " + latest.creator_name : ""}` : "AI cinema, curated" },
    { kind: "NEW", body: "Fresh films added weekly" },
    { kind: "PIONEER COHORT 02", body: "Open for nomination" },
    { kind: "CATALOG", body: `${total} films - curated AI cinema` },
  ];
  const loop = [...items, ...items, ...items];

  return (
    <div style={{ position: "relative", zIndex: 4, background: "#050505", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 48, padding: "16px 0", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", animation: "spike-tick 58s linear infinite" }}>
        {loop.map((it, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 48, flexShrink: 0 }}>
            <b style={{ fontWeight: 500, color: "#D4A857" }}>{it.kind}</b>
            <span>- {it.body}</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "inline-block" }} />
          </span>
        ))}
      </div>
      <style>{`@keyframes spike-tick { to { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}