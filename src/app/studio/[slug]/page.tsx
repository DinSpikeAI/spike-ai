"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
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

type FilmItem = {
  id?: string;
  num: string;
  title: string;
  titleItalic?: string;
  year: number;
  duration: string;
  thumbnail: string;
  flames?: string;
};

type PioneerRich = {
  tagline?: string;
  kicker?: string;
  pioneerNumber?: string;
  bannerStills?: string[];
  leadBio?: string[];
  craftHeading?: string;
  craftQuote?: string;
  pressHeading?: string;
  pressQuotes?: PressQuote[];
  based?: { city: string; coords: string };
  representation?: string;
  tools?: string[];
  recognition?: string[];
  contactEmail?: string;
  socials?: { label: string; href: string }[];
  filmography?: FilmItem[];
};

type PioneerFull = PioneerRich & {
  name: string;
  nameItalic: string;
  avatarUrl: string;
  bioFallback: string;
};

/* ═══════════════════════════════════════════════════════════════
   HARDCODED RICH OVERRIDES - keyed by normalized slug
   Extend as more pioneers get editorial content.
   ═══════════════════════════════════════════════════════════════ */

const RICH_OVERRIDES: Record<string, PioneerRich> = {
  "vallee-duhamel": {
    tagline: "Storytelling with an AI twist",
    kicker: "Duo · Julien Vallée + Eve Duhamel · Montréal, QC · Since 2019",
    pioneerNumber: "01/04",
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
      { num: "08 · Latest", title: "Small ", titleItalic: "Weather", year: 2026, duration: "11 min", thumbnail: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=640&q=80", flames: "4.2K" },
      { num: "07", title: "Paper ", titleItalic: "Birds", year: 2025, duration: "6 min", thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&q=80", flames: "3.1K" },
      { num: "06", title: "Field", titleItalic: "notes", year: 2025, duration: "8 min", thumbnail: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=640&q=80", flames: "5.4K" },
      { num: "05", title: "Room ", titleItalic: "Tone", year: 2025, duration: "4 min", thumbnail: "https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=640&q=80", flames: "2.8K" },
      { num: "04", title: "North ", titleItalic: "Face", year: 2024, duration: "7 min", thumbnail: "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=640&q=80", flames: "3.6K" },
      { num: "03", title: "Quiet ", titleItalic: "Hours", year: 2024, duration: "5 min", thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=640&q=80", flames: "2.1K" },
      { num: "02", title: "A/B ", titleItalic: "Tests", year: 2024, duration: "3 min", thumbnail: "https://images.unsplash.com/photo-1511497584788-876760111969?w=640&q=80", flames: "1.7K" },
      { num: "01", title: "First ", titleItalic: "Light", year: 2024, duration: "6 min", thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&q=80", flames: "1.3K" },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════ */

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function splitName(fullName: string): { name: string; italic: string } {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return { name: parts[0], italic: "" };
  return { name: parts[0], italic: parts.slice(1).join(" ") };
}

function formatFlames(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || "";

  const [pioneer, setPioneer] = useState<PioneerFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [bannerHover, setBannerHover] = useState<number | null>(null);
  const [filmHover, setFilmHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "features" | "short">("all");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadData() {
    setLoading(true);
    if (!supabase) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      // Fetch all visible pioneers and match slug
      const { data: all } = await supabase
        .from("pioneer_creators")
        .select("*")
        .eq("visible", true);

      const match = (all || []).find((c: any) => normalize(c.name) === slug);

      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Optional rich override for editorial content
      const rich = RICH_OVERRIDES[slug] || {};
      const { name: firstName, italic: lastName } = splitName(match.name);

      // Fetch movies from DB by creator_name
      const { data: films } = await supabase
        .from("movies")
        .select("*")
        .eq("status", "approved")
        .ilike("creator_name", `%${match.name}%`)
        .order("year", { ascending: false });

      let filmography: FilmItem[] = rich.filmography || [];
      if ((!filmography || filmography.length === 0) && films && films.length > 0) {
        filmography = films.map((f: any, i: number) => ({
          id: f.id,
          num:
            i === 0
              ? `${String(films.length - i).padStart(2, "0")} · Latest`
              : String(films.length - i).padStart(2, "0"),
          title: f.title,
          year: f.year || 2026,
          duration: f.duration || "—",
          thumbnail: getSmartPoster(f.poster_url, f.video_url, f.id),
          flames: formatFlames(f.upvotes_count || 0),
        }));
      }

      const full: PioneerFull = {
        name: firstName,
        nameItalic: lastName,
        avatarUrl: match.avatar_url || "",
        bioFallback: match.bio || "",
        tagline: rich.tagline || match.highlight || "",
        kicker: rich.kicker || match.role || "",
        pioneerNumber: rich.pioneerNumber,
        bannerStills: rich.bannerStills,
        leadBio: rich.leadBio || (match.bio ? [match.bio] : []),
        craftHeading: rich.craftHeading,
        craftQuote: rich.craftQuote,
        pressHeading: rich.pressHeading,
        pressQuotes: rich.pressQuotes,
        based: rich.based,
        representation: rich.representation,
        tools: rich.tools,
        recognition: rich.recognition,
        contactEmail: rich.contactEmail,
        socials: rich.socials,
        filmography,
      };

      setPioneer(full);
      setLoading(false);
      setTimeout(() => setIsLoaded(true), 80);
    } catch (err) {
      console.error("Studio load error:", err);
      setNotFound(true);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 28,
            height: 28,
            border: `1px solid rgba(212,168,87,0.3)`,
            borderTopColor: GOLD,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !pioneer) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: "#FAFAFA", margin: "0 0 14px" }}>
          Studio not found
        </h1>
        <Link
          href="/creators"
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: GOLD,
            textDecoration: "none",
            borderBottom: `1px solid rgba(212,168,87,0.4)`,
            paddingBottom: 4,
          }}
        >
          ← Back to creators
        </Link>
      </div>
    );
  }

  // Filter films
  const filmsVisible =
    filter === "all"
      ? pioneer.filmography || []
      : filter === "features"
      ? (pioneer.filmography || []).filter((f) => parseInt(f.duration) >= 10)
      : (pioneer.filmography || []).filter((f) => parseInt(f.duration) < 10);

  const films = pioneer.filmography || [];
  const totalFilms = films.length;
  const filmYears = films.map((f) => f.year);
  const minYear = filmYears.length ? Math.min(...filmYears) : 0;
  const maxYear = filmYears.length ? Math.max(...filmYears) : 0;

  const hasStills = pioneer.bannerStills && pioneer.bannerStills.length >= 4;
  const stills = pioneer.bannerStills || [];

  return (
    <div style={{ minHeight: "100vh", background: INK, color: "#FAFAFA", position: "relative", overflow: "hidden" }}>
      {/* Grain */}
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
          BANNER
         ═══════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", height: 320, width: "100%", overflow: "hidden", zIndex: 2 }}>
        {hasStills ? (
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
            {stills.slice(0, 8).map((src, i) => (
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
                    filter: bannerHover === i ? "grayscale(0) contrast(1.05) brightness(0.95)" : "grayscale(0.3) contrast(1.05) brightness(0.72)",
                    transition: "filter 0.5s ease",
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          // Simpler hero: gradient + avatar bg
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, rgba(212,168,87,0.12) 0%, transparent 60%), linear-gradient(180deg, #0f0f13 0%, ${INK} 100%)` }}>
            {pioneer.avatarUrl && (
              <img
                src={pioneer.avatarUrl}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.18,
                  filter: "grayscale(0.6) blur(2px)",
                }}
              />
            )}
          </div>
        )}

        {/* Top & bottom scrims */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 80, background: "linear-gradient(to bottom, rgba(10,10,12,0.75) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: "linear-gradient(to top, rgba(10,10,12,1) 0%, transparent 100%)", pointerEvents: "none" }} />

        {/* Name + tagline overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: "0 24px" }}>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(56px, 12vw, 200px)",
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
              textAlign: "center",
            }}
          >
            {pioneer.name.toLowerCase()}
            {pioneer.nameItalic ? (
              <>
                {" "}
                <em style={{ fontStyle: "italic", opacity: 0.88, fontWeight: 300 }}>
                  {pioneer.nameItalic.toLowerCase()}
                </em>
              </>
            ) : null}
          </h1>
          {pioneer.tagline && (
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
                textAlign: "center",
              }}
            >
              {pioneer.tagline}
            </p>
          )}
        </div>

        {/* Top nav */}
        <div style={{ position: "absolute", top: 24, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "auto", zIndex: 5 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
            <svg width="22" height="22" viewBox="0 0 32 32" style={{ display: "block" }}>
              <rect x="6" y="6" width="4" height="20" fill="#8B5CF6" rx="0.5" />
              <rect x="14" y="6" width="4" height="20" fill="#6366F1" rx="0.5" opacity="0.9" />
              <rect x="22" y="6" width="4" height="20" fill="#6366F1" rx="0.5" opacity="0.75" />
            </svg>
            <span className="font-serif" style={{ fontSize: 14, fontWeight: 500, letterSpacing: "0.02em", color: "rgba(255,255,255,0.85)" }}>
              spike <em style={{ fontStyle: "italic", opacity: 0.85 }}>AI</em>
            </span>
          </Link>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              Catalog
            </Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link href="/creators" style={{ color: "inherit", textDecoration: "none" }}>
              Pioneers
            </Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: GOLD }}>
              {pioneer.name} {pioneer.nameItalic}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          IDENTITY ROW
         ═══════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "28px 40px 0", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ position: "relative", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0, background: "#111" }}>
            {pioneer.avatarUrl ? (
              <img src={pioneer.avatarUrl} alt={pioneer.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.05)" }} />
            ) : (
              <div className="font-serif" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 24 }}>
                {pioneer.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: "1 1 440px", minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <h2 className="font-serif" style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.01em", margin: 0, color: "#FAFAFA", fontWeight: 500 }}>
                {pioneer.name}
                {pioneer.nameItalic ? (
                  <>
                    {" "}
                    <em style={{ fontStyle: "italic", opacity: 0.75, fontWeight: 400 }}>{pioneer.nameItalic}</em>
                  </>
                ) : null}
              </h2>
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
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
                Pioneer{pioneer.pioneerNumber ? ` · ${pioneer.pioneerNumber}` : ""}
              </span>
            </div>
            {pioneer.kicker && (
              <p style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                {pioneer.kicker}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button
              style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, background: "transparent", border: `1px solid ${GOLD}`, padding: "12px 22px", cursor: "pointer", transition: "background 0.3s ease" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "rgba(212,168,87,0.08)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "transparent")}
            >
              Commission
            </button>
            <button
              style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: INK, background: "#FAFAFA", border: "1px solid #FAFAFA", padding: "12px 22px", cursor: "pointer", transition: "opacity 0.3s ease" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
            >
              + Follow
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)", marginTop: 32 }} />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BODY GRID: bio + aside
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
          {(pioneer.leadBio || []).map((para, i) => (
            <p
              key={i}
              className="font-serif"
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                fontWeight: 300,
                color: "rgba(255,255,255,0.72)",
                margin: "0 0 20px",
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

          {(!pioneer.leadBio || pioneer.leadBio.length === 0) && pioneer.bioFallback && (
            <p className="font-serif" style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 300, color: "rgba(255,255,255,0.72)", margin: 0 }}>
              {pioneer.bioFallback}
            </p>
          )}

          {pioneer.craftQuote && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.3em", textTransform: "uppercase", color: GOLD, margin: "0 0 14px", fontWeight: 500 }}>
                {pioneer.craftHeading || "On Craft"}
              </h3>
              <p className="font-serif" style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 300, color: "rgba(255,255,255,0.72)", margin: 0 }}>
                {pioneer.craftQuote}
              </p>
            </div>
          )}

          {pioneer.pressQuotes && pioneer.pressQuotes.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.3em", textTransform: "uppercase", color: GOLD, margin: "0 0 14px", fontWeight: 500 }}>
                {pioneer.pressHeading || "Selected Press"}
              </h3>
              <p className="font-serif" style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 300, color: "rgba(255,255,255,0.72)", margin: 0 }}>
                {pioneer.pressQuotes.map((pq, i) => (
                  <span key={i}>
                    <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.88)" }}>{pq.outlet}</em> called their work <em style={{ fontStyle: "italic" }}>&ldquo;{pq.quote}&rdquo;</em>
                    {i < (pioneer.pressQuotes!.length - 1) ? "  " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        {/* ── Aside right ── */}
        <aside style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 28 }}>
          {pioneer.based && (
            <AsideBlock heading="Based">
              <span className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", fontWeight: 400 }}>
                {pioneer.based.city}
              </span>
              <br />
              <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", fontStyle: "italic" }}>
                {pioneer.based.coords}
              </span>
            </AsideBlock>
          )}

          {pioneer.representation && (
            <AsideBlock heading="Representation">
              <span className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(255,255,255,0.2)" }}>
                {pioneer.representation}
              </span>
            </AsideBlock>
          )}

          {pioneer.tools && pioneer.tools.length > 0 && (
            <AsideBlock heading="Tools">
              {pioneer.tools.map((t, i) => {
                const parts = t.split(" ");
                const a = parts[0];
                const b = parts.slice(1).join(" ");
                return (
                  <div key={i} className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", fontWeight: 400, lineHeight: 1.6 }}>
                    {a}
                    {b ? (
                      <>
                        {" "}
                        <em style={{ fontStyle: "italic", opacity: 0.7 }}>{b}</em>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </AsideBlock>
          )}

          {pioneer.recognition && pioneer.recognition.length > 0 && (
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
          )}

          {pioneer.contactEmail && (
            <AsideBlock heading="Contact" isLast>
              <a
                href={`mailto:${pioneer.contactEmail}`}
                className="font-serif"
                style={{ fontSize: 14, color: GOLD, textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(212,168,87,0.4)" }}
              >
                {pioneer.contactEmail}
              </a>
            </AsideBlock>
          )}

          {/* If no aside data at all, show a single "No additional info" placeholder */}
          {!pioneer.based && !pioneer.representation && (!pioneer.tools || pioneer.tools.length === 0) && (!pioneer.recognition || pioneer.recognition.length === 0) && !pioneer.contactEmail && (
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
              Profile in progress
            </div>
          )}
        </aside>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FILMOGRAPHY
         ═══════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "80px 40px 0", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: 22, letterSpacing: "-0.01em", margin: 0, fontWeight: 500, color: "#FAFAFA" }}>
              Film<em style={{ fontStyle: "italic", color: GOLD, fontWeight: 300 }}>ography</em>
              {totalFilms > 0 && (
                <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginLeft: 16, fontWeight: 400 }}>
                  {String(totalFilms).padStart(2, "0")} Films{minYear ? ` · ${minYear} → ${maxYear}` : ""}
                </span>
              )}
            </h2>
          </div>
          {totalFilms > 0 && (
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
          )}
        </div>

        {totalFilms === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <p className="font-serif" style={{ fontSize: 15, fontStyle: "italic", color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Films coming soon.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {filmsVisible.map((f) => {
              const isHover = filmHover === f.num;
              return (
                <div
                  key={f.num + f.title}
                  onMouseEnter={() => setFilmHover(f.num)}
                  onMouseLeave={() => setFilmHover(null)}
                  onClick={() => f.id && router.push(`/movie/${f.id}`)}
                  style={{ cursor: f.id ? "pointer" : "default" }}
                >
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "1 / 1",
                      overflow: "hidden",
                      border: isHover ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.06)",
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
                        filter: isHover ? "grayscale(0) contrast(1.05)" : "grayscale(0.45) contrast(1.08) brightness(0.8)",
                        transform: isHover ? "scale(1.04)" : "scale(1)",
                        transition: "filter 0.5s ease, transform 0.6s cubic-bezier(.22,1,.36,1)",
                      }}
                    />
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
                    <h4 className="font-serif" style={{ fontSize: 15, margin: 0, fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.01em" }}>
                      {f.title}
                      {f.titleItalic ? (
                        <em style={{ fontStyle: "italic", opacity: 0.75, fontWeight: 400 }}>{f.titleItalic}</em>
                      ) : null}
                    </h4>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                      <span>{f.year}</span>
                      {f.flames ? (
                        <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span style={{ color: GOLD }}>△ {f.flames}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════════════════════ */}
      <footer style={{ position: "relative", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "28px 40px", maxWidth: 1160, margin: "100px auto 0", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div className="font-serif" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>
          spike <em style={{ fontStyle: "italic" }}>AI</em> <span style={{ opacity: 0.4 }}>·</span>{" "}
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em" }}>© 2026</span>
        </div>
        {pioneer.socials && pioneer.socials.length > 0 && (
          <div style={{ display: "flex", gap: 20 }}>
            {pioneer.socials.map((s, i) => (
              <a
                key={i}
                href={s.href}
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.3s ease" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = GOLD)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
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
      <h4 style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 8px", fontWeight: 500 }}>
        {heading}
      </h4>
      <div>{children}</div>
    </div>
  );
}
