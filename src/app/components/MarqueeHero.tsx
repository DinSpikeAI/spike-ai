"use client";
import { useEffect, useState } from "react";
import { supabase, getSmartHeroImage } from "@/lib/supabase";

type Film = {
  id: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  year?: number | null;
  duration?: number | null;
  genre?: string | null;
  creator_name?: string | null;
  video_url?: string | null;
  poster_url?: string | null;
  hero_image?: string | null;
};

function renderTitleItalic(title: string) {
  if (!title) return null;
  const words = title.trim().split(" ");
  if (words.length < 2) return title;
  const last = words.pop();
  return (
    <>
      {words.join(" ")}{" "}
      <em className="not-italic [font-style:italic] text-white/75 font-light">{last}</em>
    </>
  );
}

export default function MarqueeHero() {
  const [film, setFilm] = useState<Film | null>(null);

  useEffect(() => {
    supabase
      .from("movies")
      .select("id,title,tagline,description,year,duration,genre,creator_name,video_url,poster_url,hero_image")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFilm(data as Film);
      });
  }, []);

  if (!film) return <div style={{ height: "75vh", minHeight: 560, background: "#050505" }} />;

  const heroImg = getSmartHeroImage(film.hero_image, film.video_url, film.poster_url, film.id);
  const note = (film.tagline || film.description || "").substring(0, 240);

  return (
    <section style={{ position: "relative", width: "100%", height: "75vh", minHeight: 560, maxHeight: 820, overflow: "hidden", background: "#050505" }}>
      <img src={heroImg} alt={film.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.05) brightness(0.65)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,5,5,0.55) 0%, transparent 30%, transparent 50%, rgba(5,5,5,0.9) 92%, #050505 100%), linear-gradient(90deg, rgba(5,5,5,0.72) 0%, rgba(5,5,5,0.3) 42%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 40% at 30% 65%, rgba(99,102,241,0.18), transparent 65%)", mixBlendMode: "screen", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1680, margin: "0 auto", height: "100%", padding: "0 48px 100px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, color: "#D4A857", fontSize: 11, letterSpacing: "0.38em", textTransform: "uppercase", fontFamily: "monospace" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4A857", boxShadow: "0 0 12px #D4A857" }} />
          <span style={{ width: 40, height: 1, background: "#D4A857", opacity: 0.6 }} />
          <span>Film of the Week</span>
        </div>

        <h1 className="font-serif font-light" style={{ fontSize: "clamp(48px, 7vw, 112px)", lineHeight: 0.9, letterSpacing: "-0.03em", margin: "0 0 24px", maxWidth: 1200, color: "#FAFAFA" }}>
          {renderTitleItalic(film.title)}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", color: "rgba(250,250,250,0.85)", fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 20 }}>
          {film.year && <span>{film.year}</span>}
          {film.year && film.duration ? <span style={{ opacity: 0.4 }}>·</span> : null}
          {film.duration && <span>{film.duration} min</span>}
          {film.duration && film.genre ? <span style={{ opacity: 0.4 }}>·</span> : null}
          {film.genre && <span>{film.genre}</span>}
          {film.creator_name ? <span style={{ opacity: 0.4 }}>·</span> : null}
          {film.creator_name && <span>{film.creator_name}</span>}
        </div>

        {note && (
          <blockquote className="font-serif" style={{ fontStyle: "italic", fontWeight: 300, fontSize: "clamp(16px, 1.3vw, 20px)", lineHeight: 1.55, color: "rgba(250,250,250,0.9)", borderLeft: "1px solid #D4A857", paddingLeft: 22, margin: "0 0 30px", maxWidth: 680 }}>
            {note}
            <cite style={{ display: "block", fontStyle: "normal", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#D4A857", marginTop: 12, opacity: 0.85 }}>
              — The Curator's Note
            </cite>
          </blockquote>
        )}

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href={`/movie/${film.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "#FAFAFA", color: "#050505", textDecoration: "none", fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", borderRadius: 2 }}>
            Watch {film.duration ? "- " + film.duration + " min" : ""}
          </a>
          <a href={`/movie/${film.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "rgba(10,10,12,0.4)", color: "#FAFAFA", textDecoration: "none", fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(10px)", borderRadius: 2 }}>
            Catalog entry
          </a>
        </div>
      </div>
    </section>
  );
}