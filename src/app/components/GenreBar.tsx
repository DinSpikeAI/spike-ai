"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type GenreCount = { name: string; count: string };

export default function GenreBar() {
  const [genres, setGenres] = useState<GenreCount[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.from("movies").select("genre", { count: "exact" }).eq("status", "approved").then(({ data, count }) => {
      if (!data) return;
      setTotal(count || 0);
      const counts: Record<string, number> = {};
      data.forEach((row: { genre?: string | null }) => {
        if (row.genre) counts[row.genre] = (counts[row.genre] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, c]) => ({ name, count: String(c).padStart(2, "0") }));
      setGenres(sorted);
    });
  }, []);

  if (genres.length === 0) return null;

  return (
    <div style={{ maxWidth: 1680, margin: "72px auto 0", padding: "48px", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", zIndex: 2, display: "grid", gap: 48, gridTemplateColumns: "minmax(180px, 220px) 1fr" }}>
      <div>
        <h2 className="font-serif" style={{ fontWeight: 300, fontSize: 34, margin: 0, letterSpacing: "-0.015em", color: "#FAFAFA" }}>
          By <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>Genre</em>
        </h2>
        <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: "8px 0 0" }}>
          {total} films - {genres.length} categories
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 20, rowGap: 12, alignItems: "center" }}>
        {genres.map((g, i) => (
          <span key={g.name} style={{ display: "inline-flex", alignItems: "center", gap: 20 }}>
            <span className="font-serif" style={{ fontWeight: 300, fontSize: 26, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.01em", position: "relative", paddingRight: 18 }}>
              {g.name}
              <span style={{ position: "absolute", top: 2, right: 0, fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
                {g.count}
              </span>
            </span>
            {i < genres.length - 1 ? <span className="font-serif" style={{ color: "rgba(255,255,255,0.15)" }}>-</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}