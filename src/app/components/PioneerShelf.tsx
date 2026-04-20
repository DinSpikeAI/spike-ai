"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Creator = {
  id: string;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
  highlight?: string | null;
  role?: string | null;
  films_count?: number | null;
};

const PRIORITY_NAMES = ["Vallée Duhamel", "Maya Shoshani", "Yuval Avadya", "Victor Leonativ", "Dreamshot AI Studio"];

export default function PioneerShelf() {
  const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    supabase
      .from("pioneer_creators")
      .select("*")
      .eq("visible", true)
      .then(({ data }) => {
        if (!data) return;
        const all = data as Creator[];
        const priority = PRIORITY_NAMES.map(n => all.find(c => c.name === n)).filter(Boolean) as Creator[];
        const fill = all.filter(c => !PRIORITY_NAMES.includes(c.name)).slice(0, 5 - priority.length);
        setCreators([...priority, ...fill].slice(0, 5));
      });
  }, []);

  if (creators.length === 0) return null;

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <section style={{ position: "relative", padding: "100px 48px 80px", marginTop: 40 }}>
      <div style={{ maxWidth: 1680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 50, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.34em", textTransform: "uppercase", color: "#D4A857", margin: "0 0 12px" }}>
              - The prestige tier - awarded, not applied for
            </p>
            <h2 className="font-serif font-light" style={{ fontSize: 52, lineHeight: 1, letterSpacing: "-0.02em", margin: 0, color: "#FAFAFA" }}>
              Pioneer <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)", fontWeight: 300 }}>Creators</em>
            </h2>
          </div>
          <Link href="/creators" style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#D4A857", textDecoration: "none", borderBottom: "1px solid rgba(212,168,87,0.4)", paddingBottom: 3 }}>
            Meet the pioneers -&gt;
          </Link>
        </div>

        {/* Creators grid - SQUARE IMAGES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24 }}>
          {creators.map((c) => (
            <div key={c.id} style={{ display: "flex", flexDirection: "column" }}>

              {/* Square image */}
              <div style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.08)" }}>
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; const fb = t.nextElementSibling as HTMLElement; if (fb) fb.style.opacity = "1"; }} />
                ) : null}
                <div className="font-serif" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 300, color: "#D4A857", opacity: c.avatar_url ? 0 : 1 }}>
                  {getInitials(c.name)}
                </div>

                {/* Pioneer badge - top-right corner */}
                <div style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 8, letterSpacing: "0.32em", textTransform: "uppercase", color: "#D4A857", background: "rgba(5,5,5,0.75)", border: "1px solid rgba(212,168,87,0.4)", padding: "5px 10px", backdropFilter: "blur(8px)" }}>
                  { ">{" }
                </div>
              </div>

              {/* Info below */}
              <div style={{ paddingTop: 16 }}>
                <h3 className="font-serif" style={{ fontWeight: 400, fontSize: 18, lineHeight: 1.2, margin: "0 0 10px", color: "#FAFAFA", letterSpacing: "-0.01em" }}>
                  {c.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "monospace", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                  <span style={{ color: "#D4A857" }}>Pioneer</span>
                  <span style={{ opacity: 0.3 }}>-</span>
                  <span>{c.role || "Director"}</span>
                  {c.films_count ? (<><span style={{ opacity: 0.3 }}>-</span><span>{String(c.films_count).padStart(2, "0")} films</span></>) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}