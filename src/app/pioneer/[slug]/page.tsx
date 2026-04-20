"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase, getSmartPoster } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const GOLD = "#D4A857";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, Monaco, monospace";
const INK = "#0A0A0C";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

type PressQuote = { outlet: string; quote: string };

type FilmographyItem = {
  num: string;
  title: string;
  titleItalic?: string; // italic portion of title e.g. "Weather" in "Small Weather"
  year: number;
  duration: string;
  note: string;
  thumbnail: string;
  flames?: string; // e.g. "4.2K"
};

type PioneerRich = {
  slug: string;
  name: string;
  nameItalic: string; // second word to italicize (e.g. "duhamel")
  tagline: string;
  kicker: string; // "Duo · Julien Vallée + Eve Duhamel · Montréal, QC · Since 2019"
  pioneerNumber: string; // "01/04"
  avatarUrl: string;
  bannerStills: string[]; // 8 image URLs
  leadBio: string[]; // paragraphs, first letter drop-caps
  craftHeading: string;
  craftQuote: string;
  pressHeading: string;
  pressQuotes: PressQuote[];
  based: { city: string; coords: string };
  representation?: string;
  tools: string[];
  recognition: string[];
  contactEmail?: string;
  socials: { label: string; href: string }[];
  filmography: FilmographyItem[];
};

type Movie = {
  id: string;
  title: string;
  year: number;
  duration: string;
  poster: string;
  upvotes: number;
  genre: string;
};

/* ═══════════════════════════════════════════════════════════════
   HARDCODED PIONEER DATA
   (Replace/extend as more pioneers get their editorial pages)
   ═══════════════════════════════════════════════════════════════ */

const PIONEER_DATA: Record<string, PioneerRich> = {
  "vallee-duhamel": {
    slug: "vallee-duhamel",
    name: "Vallée",
    nameItalic: "Duhamel",
    tagline: "Storytelling with an AI twist",
    kicker: "Duo · Julien Vallée + Eve Duhamel · Montréal, QC · Since 2019",
    pioneerNumber: "01/04",
    avatarUrl: "/creators/vallee-duhamel.jpg",
    bannerStills: [
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=640&q=70",
      "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=640&q=70",
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&q=70",
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=640&q=70",
      "https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=640&q=70",
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=640&q=70",
      "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=640&q=70",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&q=70",
    ],
    leadBio: [
      "Vallée Duhamel is the shared name of Julien Vallée and Eve Duhamel, a Montréal duo working in generative video since late 2024. Before Spike, they directed titles for Frieze and a short for MoMA's Department of Film.",
      "Their first AI-native work, Small Weather, was acquired by the Cinémathèque québécoise – the first AI film to enter its permanent collection. They tend to work slowly, in long takes, with one editor and no agency.",
    ],
    craftHeading: "On Craft",
    craftQuote:
      "\"We don't prompt a model. We conduct it – the way a cinematographer conducts weather, or a conductor conducts a room that is already playing.\" Their process begins on paper, photographed not scanned, and ends in a single offline edit.",
    pressHeading: "Selected Press",
    pressQuotes: [
      { outlet: "The New Yorker", quote: "the first AI film that remembers to leave things out." },
      { outlet: "Sight & Sound", quote: "a house style inside tools that are allergic to style." },
      { outlet: "Cahiers du Cinéma", quote: "a patience for accident – the oldest craft – ported into latent space." },
    ],
    based: { city: "Montréal, QC", coords: "45.5°N · 73.5°W" },
    representation: "Caviar",
    tools: ["Runway Gen-3", "Sora", "ElevenLabs · Suno"],
    recognition: [
      "Spike Pioneer · 2026",
      "Cinémathèque QC · 2025",
      "SXSW Jury · 2025",
    ],
    contactEmail: "studio@vd.com",
    socials: [
      { label: "Instagram", href: "#" },
      { label: "Vimeo", href: "#" },
      { label: "Website", href: "#" },
    ],
    filmography: [
      { num: "08 · Latest", title: "Small ", titleItalic: "Weather", year: 2026, duration: "11 min", note: "Cinémathèque QC acquisition", thumbnail: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=640&q=80", flames: "4.2K" },
      { num: "07", title: "Paper ", titleItalic: "Birds", year: 2025, duration: "6 min", note: "A folded-paper bestiary", thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&q=80", flames: "3.1K" },
      { num: "06", title: "Field", titleItalic: "notes", year: 2025, duration: "8 min", note: "Ten minutes collected, then slowed (SXSW)", thumbnail: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=640&q=80", flames: "5.4K" },
      { num: "05", title: "Room ", titleItalic: "Tone", year: 2025, duration: "4 min", note: "Silence, described", thumbnail: "https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=640&q=80", flames: "2.8K" },
      { num: "04", title: "North ", titleItalic: "Face", year: 2024, duration: "7 min", note: "A mountain that refuses to stay still", thumbnail: "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=640&q=80", flames: "3.6K" },
      { num: "03", title: "Quiet ", titleItalic: "Hours", year: 2024, duration: "5 min", note: "Between 3 and 5 a.m., light behaves differently", thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=640&q=80", flames: "2.1K" },
      { num: "02", title: "A/B ", titleItalic: "Tests", year: 2024, duration: "3 min", note: "Two versions of the same afternoon", thumbnail: "https://images.unsplash.com/photo-1511497584788-876760111969?w=640&q=80", flames: "1.7K" },
      { num: "01", title: "First ", titleItalic: "Light", year: 2024, duration: "6 min", note: "First attempt, kept for the record", thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&q=80", flames: "1.3K" },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function PioneerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || "";

  const [pioneer, setPioneer] = useState<PioneerRich | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [bannerHover, setBannerHover] = useState<number | null>(null);
  const [filmHover, setFilmHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "features" | "short">("all");

  useEffect(() => {
    const data = PIONEER_DATA[slug];
    if (data) {
      setPioneer(data);
      loadMovies(data.name + " " + data.nameItalic);
    } else {
      setPioneer(null);
    }
    setTimeout(() => setIsLoaded(true), 80);
  }, [slug]);

  async function loadMovies(creatorName: string) {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("movies")
        .select("*")
        .eq("creator_name", creatorName)
        .eq("status", "approved")
        .order("year", { ascending: false });
      if (data && data.length > 0) {
        setMovies(
          data.map((m: any) => ({
            id: m.id,
            title: m.title,
            year: m.year || 2026,
            duration: m.duration || "",
            poster: getSmartPoster(m.poster_url, m.video_url, m.id),
            upvotes: m.upvotes_count || 0,
            genre: m.genre || "",
          }))
        );
      }
    } catch {}
  }

  if (!pioneer) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontFamily: MONO, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase" }}>
        Pioneer not found
      </div>
    );
  }

  const filmsVisible = filter === "all"
    ? pioneer.filmography
    : filter === "features"
    ? pioneer.filmography.filter((f) => parseInt(f.duration) >= 10)
    : pioneer.filmography.filter((f) => parseInt(f.duration) < 10);

  const totalFilms = pioneer.filmography.length;
  const filmYears = pioneer.filmography.map((f) => f.year);
  const minYear = Math.min(...filmYears);
  const maxYear = Math.max(...filmYears);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: INK,
        color: "#FAFAFA",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.035,
          zIndex: 1,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }}
      />

      {/* ═══════════════════════════════════════════════════════════
          BANNER (320px) - 8 film stills grid + huge name overlay
         ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          height: 320,
          width: "100%",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        {/* 8 stills grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 2,
          }}
        >
          {pioneer.bannerStills.map((src, i) => (
            <div
              key={i}
              onMouseEnter={() => setBannerHover(i)}
              onMouseLeave={() => setBannerHover(null)}
              style={{
                position: "relative",
                overflow: "hidden",
                background: "#111",
                transform: bannerHover === i ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.6s cubic-bezier(.22,1,.36,1)",
              }}
            >
              <img
                src={src}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter:
                    bannerHover === i
                      ? "grayscale(0) contrast(1.05) brightness(0.95)"
                      : "grayscale(0.3) contrast(1.05) brightness(0.72)",
                  transition: "filter 0.5s ease",
                }}
              />
            </div>
          ))}
        </div>

        {/* Top & bottom scrims */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 80,
            background:
              "linear-gradient(to bottom, rgba(10,10,12,0.75) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 120,
            background:
              "linear-gradient(to top, rgba(10,10,12,1) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Huge name overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(72px, 13vw, 220px)",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              margin: 0,
              fontWeight: 300,
              color: "#FAFAFA",
              textTransform: "lowercase",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 1s ease, transform 1s ease",
            }}
          >
            {pioneer.name.toLowerCase()}{" "}
            <em style={{ fontStyle: "italic", opacity: 0.88, fontWeight: 300 }}>
              {pioneer.nameItalic.toLowerCase()}
            </em>
          </h1>
          <p
            className="font-serif"
            style={{
              marginTop: 14,
              fontSize: 16,
              lineHeight: 1.5,
              fontStyle: "italic",
              color: GOLD,
              fontWeight: 300,
              opacity: isLoaded ? 0.95 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 1.2s ease 0.25s, transform 1.2s ease 0.25s",
              textShadow: "0 2px 18px rgba(0,0,0,0.6)",
            }}
          >
            {pioneer.tagline}
          </p>
        </div>

        {/* Top nav - breadcrumb */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 32,
            right: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pointerEvents: "auto",
            zIndex: 5,
          }}
        >
          {/* Brandmark */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 32 32" style={{ display: "block" }}>
              <rect x="6" y="6" width="4" height="20" fill="#8B5CF6" rx="0.5" />
              <rect x="14" y="6" width="4" height="20" fill="#6366F1" rx="0.5" opacity="0.9" />
              <rect x="22" y="6" width="4" height="20" fill="#6366F1" rx="0.5" opacity="0.75" />
            </svg>
            <span
              className="font-serif"
              style={{
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              spike <em style={{ fontStyle: "italic", opacity: 0.85 }}>AI</em>
            </span>
          </Link>
          {/* Breadcrumb */}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              Catalog
            </Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link href="/creators" style={{ color: "inherit", textDecoration: "none" }}>
              Pioneers
            </Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: GOLD }}>{pioneer.name} {pioneer.nameItalic}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          IDENTITY ROW
         ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          maxWidth: 1160,
          margin: "0 auto",
          padding: "28px 40px 0",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              flexShrink: 0,
              background: "#111",
            }}
          >
            <img
              src={pioneer.avatarUrl}
              alt={pioneer.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "grayscale(1) contrast(1.05)",
              }}
            />
          </div>

          {/* Name + meta */}
          <div style={{ flex: "1 1 440px", minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <h2
                className="font-serif"
                style={{
                  fontSize: 30,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  color: "#FAFAFA",
                  fontWeight: 500,
                }}
              >
                {pioneer.name}{" "}
                <em style={{ fontStyle: "italic", opacity: 0.75, fontWeight: 400 }}>
                  {pioneer.nameItalic}
                </em>
              </h2>
              {/* Pioneer chip */}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: GOLD,
                  border: "1px solid rgba(212,168,87,0.4)",
                  padding: "5px 9px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(212,168,87,0.05)",
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: GOLD,
                    boxShadow: `0 0 8px ${GOLD}`,
                  }}
                />
                Pioneer · {pioneer.pioneerNumber}
              </span>
            </div>
            <p
              style={{
                marginTop: 8,
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {pioneer.kicker}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: GOLD,
                background: "transparent",
                border: `1px solid ${GOLD}`,
                padding: "12px 22px",
                cursor: "pointer",
                transition: "background 0.3s ease",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "rgba(212,168,87,0.08)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "transparent")}
            >
              Commission
            </button>
            <button
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: INK,
                background: "#FAFAFA",
                border: "1px solid #FAFAFA",
                padding: "12px 22px",
                cursor: "pointer",
                transition: "opacity 0.3s ease",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
            >
              + Follow
            </button>
          </div>
        </div>

        {/* Separator */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
            marginTop: 32,
          }}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BODY GRID: bio (1fr) + aside (240px)
         ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          maxWidth: 1160,
          margin: "0 auto",
          padding: "44px 40px 0",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 240px",
          gap: 56,
        }}
      >
        {/* ── Bio left ── */}
        <div>
          {pioneer.leadBio.map((para, i) => (
            <p
              key={i}
              className="font-serif"
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                fontWeight: 300,
                color: "rgba(255,255,255,0.72)",
                margin: i === 0 ? "0 0 20px" : "0 0 20px",
              }}
            >
              {i === 0 ? (
                <>
                  <span
                    className="font-serif"
                    style={{
                      float: "left",
                      fontSize: 58,
                      lineHeight: 0.9,
                      fontWeight: 400,
                      color: GOLD,
                      marginRight: 10,
                      marginTop: 4,
                      fontStyle: "italic",
                    }}
                  >
                    {para.charAt(0)}
                  </span>
                  {para.slice(1)}
                </>
              ) : (
                para
              )}
            </p>
          ))}

          {/* On Craft */}
          <div style={{ marginTop: 32 }}>
            <h3
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: GOLD,
                margin: "0 0 14px",
                fontWeight: 500,
              }}
            >
              {pioneer.craftHeading}
            </h3>
            <p
              className="font-serif"
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                fontWeight: 300,
                color: "rgba(255,255,255,0.72)",
                margin: 0,
              }}
            >
              {pioneer.craftQuote}
            </p>
          </div>

          {/* Selected Press */}
          <div style={{ marginTop: 32 }}>
            <h3
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: GOLD,
                margin: "0 0 14px",
                fontWeight: 500,
              }}
            >
              {pioneer.pressHeading}
            </h3>
            <p
              className="font-serif"
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                fontWeight: 300,
                color: "rgba(255,255,255,0.72)",
                margin: 0,
              }}
            >
              {pioneer.pressQuotes.map((pq, i) => (
                <span key={i}>
                  <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.88)" }}>
                    {pq.outlet}
                  </em>{" "}
                  called their work{" "}
                  <em style={{ fontStyle: "italic" }}>&ldquo;{pq.quote}&rdquo;</em>
                  {i < pioneer.pressQuotes.length - 1 ? "  " : ""}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* ── Aside right ── */}
        <aside style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 28 }}>
          <AsideBlock heading="Based">
            <span className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", fontWeight: 400 }}>
              {pioneer.based.city}
            </span>
            <br />
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.12em",
                fontStyle: "italic",
              }}
            >
              {pioneer.based.coords}
            </span>
          </AsideBlock>

          {pioneer.representation && (
            <AsideBlock heading="Representation">
              <span className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(255,255,255,0.2)" }}>
                {pioneer.representation}
              </span>
            </AsideBlock>
          )}

          <AsideBlock heading="Tools">
            {pioneer.tools.map((t, i) => {
              const [a, b] = t.split(" ");
              return (
                <div key={i} className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", fontWeight: 400, lineHeight: 1.6 }}>
                  {a}
                  {b ? (
                    <> <em style={{ fontStyle: "italic", opacity: 0.7 }}>{b}</em></>
                  ) : null}
                </div>
              );
            })}
          </AsideBlock>

          <AsideBlock heading="Recognition">
            {pioneer.recognition.map((r, i) => {
              const parts = r.split("·");
              return (
                <div key={i} className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>
                  {parts[0]?.trim()}{" "}
                  {parts[1] ? (
                    <em style={{ fontStyle: "italic", opacity: 0.7 }}>· {parts[1]?.trim()}</em>
                  ) : null}
                </div>
              );
            })}
          </AsideBlock>

          {pioneer.contactEmail && (
            <AsideBlock heading="Contact" isLast>
              <a
                href={`mailto:${pioneer.contactEmail}`}
                className="font-serif"
                style={{
                  fontSize: 14,
                  color: GOLD,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  textDecorationColor: "rgba(212,168,87,0.4)",
                }}
              >
                {pioneer.contactEmail}
              </a>
            </AsideBlock>
          )}
        </aside>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FILMOGRAPHY
         ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          maxWidth: 1160,
          margin: "0 auto",
          padding: "80px 40px 0",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              className="font-serif"
              style={{
                fontSize: 22,
                letterSpacing: "-0.01em",
                margin: 0,
                fontWeight: 500,
                color: "#FAFAFA",
              }}
            >
              Film<em style={{ fontStyle: "italic", color: GOLD, fontWeight: 300 }}>ography</em>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginLeft: 16,
                  fontWeight: 400,
                }}
              >
                {String(totalFilms).padStart(2, "0")} Films · {minYear} → {maxYear}
              </span>
            </h2>
          </div>
          {/* Filter pills */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "features", "short"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: filter === f ? INK : "rgba(255,255,255,0.55)",
                  background: filter === f ? "#FAFAFA" : "transparent",
                  border: `1px solid ${filter === f ? "#FAFAFA" : "rgba(255,255,255,0.15)"}`,
                  padding: "8px 14px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 16,
          }}
        >
          {filmsVisible.map((f) => {
            const isHover = filmHover === f.num;
            return (
              <div
                key={f.num}
                onMouseEnter={() => setFilmHover(f.num)}
                onMouseLeave={() => setFilmHover(null)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    overflow: "hidden",
                    border: isHover
                      ? `1px solid ${GOLD}`
                      : "1px solid rgba(255,255,255,0.06)",
                    background: "#0d0d11",
                    transition: "border 0.3s ease",
                  }}
                >
                  <img
                    src={f.thumbnail}
                    alt={f.title + (f.titleItalic || "")}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: isHover
                        ? "grayscale(0) contrast(1.05)"
                        : "grayscale(0.45) contrast(1.08) brightness(0.8)",
                      transform: isHover ? "scale(1.04)" : "scale(1)",
                      transition:
                        "filter 0.5s ease, transform 0.6s cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                  {/* film-num top-left */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      fontFamily: MONO,
                      fontSize: 8,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: f.num.includes("Latest") ? GOLD : "rgba(255,255,255,0.85)",
                      background: "rgba(5,5,7,0.7)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      padding: "4px 7px",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {f.num}
                  </div>
                  {/* duration bottom-right */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      fontFamily: MONO,
                      fontSize: 8,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.85)",
                      background: "rgba(5,5,7,0.7)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      padding: "4px 7px",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {f.duration}
                  </div>
                </div>
                <div style={{ paddingTop: 10 }}>
                  <h4
                    className="font-serif"
                    style={{
                      fontSize: 15,
                      margin: 0,
                      fontWeight: 500,
                      color: "#FAFAFA",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {f.title}
                    {f.titleItalic ? (
                      <em style={{ fontStyle: "italic", opacity: 0.75, fontWeight: 400 }}>
                        {f.titleItalic}
                      </em>
                    ) : null}
                  </h4>
                  <div
                    style={{
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <span>{f.year}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ color: GOLD }}>△ {f.flames}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════════════════════ */}
      <footer
        style={{
          position: "relative",
          marginTop: 100,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "28px 40px",
          maxWidth: 1160,
          margin: "100px auto 0",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          className="font-serif"
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            fontWeight: 400,
          }}
        >
          spike <em style={{ fontStyle: "italic" }}>AI</em>{" "}
          <span style={{ opacity: 0.4 }}>·</span>{" "}
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em" }}>
            © 2026
          </span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {pioneer.socials.map((s, i) => (
            <a
              key={i}
              href={s.href}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = GOLD)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
            >
              {s.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ASIDE BLOCK
   ═══════════════════════════════════════════════════════════════ */

function AsideBlock({
  heading,
  children,
  isLast,
}: {
  heading: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
      <h4
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          margin: "0 0 8px",
          fontWeight: 500,
        }}
      >
        {heading}
      </h4>
      <div>{children}</div>
    </div>
  );
}
