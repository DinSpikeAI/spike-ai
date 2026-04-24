"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, getSmartPoster } from "@/lib/supabase";

const GOLD = "#D4A857";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, Monaco, monospace";
const INK = "#0A0A0C";

type Creator = {
  id: string;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
  highlight?: string | null;
  role?: string | null;
  films_count?: number | null;
  toolkit?: string[] | null;
  website?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_facebook?: string | null;
  social_x?: string | null;
  tagline?: string | null;
  recognition?: string[] | null;
};

type FilmItem = {
  id: string;
  num: string;
  title: string;
  year: number;
  duration: string;
  thumbnail: string;
  flames: string;
};

type SocialLink = { label: string; href: string };

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

function buildSocials(c: Creator): SocialLink[] {
  const out: SocialLink[] = [];
  if (c.website) {
    out.push({ label: "Website", href: c.website.startsWith("http") ? c.website : `https://${c.website}` });
  }
  if (c.social_instagram) {
    const h = c.social_instagram.replace("@", "");
    out.push({ label: "Instagram", href: h.startsWith("http") ? h : `https://instagram.com/${h}` });
  }
  if (c.social_youtube) {
    const h = c.social_youtube.replace("@", "");
    out.push({ label: "YouTube", href: h.startsWith("http") ? h : `https://youtube.com/${h}` });
  }
  if (c.social_facebook) {
    const h = c.social_facebook.replace("@", "");
    out.push({ label: "Facebook", href: h.startsWith("http") ? h : `https://facebook.com/${h}` });
  }
  if (c.social_x) {
    const h = c.social_x.replace("@", "");
    out.push({ label: "X", href: h.startsWith("http") ? h : `https://x.com/${h}` });
  }
  return out;
}

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || "";

  const [creator, setCreator] = useState<Creator | null>(null);
  const [films, setFilms] = useState<FilmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filmHover, setFilmHover] = useState<string | null>(null);

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

      setCreator(match as Creator);

      const { data: movieData } = await supabase
        .from("movies")
        .select("*")
        .eq("status", "approved")
        .ilike("creator_name", `%${match.name}%`)
        .order("year", { ascending: false });

      if (movieData && movieData.length > 0) {
        const mapped: FilmItem[] = movieData.map((f: any, i: number) => ({
          id: f.id,
          num:
            i === 0
              ? `${String(movieData.length - i).padStart(2, "0")} · Latest`
              : String(movieData.length - i).padStart(2, "0"),
          title: f.title,
          year: f.year || 2026,
          duration: f.duration || "—",
          thumbnail: getSmartPoster(f.poster_url, f.video_url, f.id),
          flames: formatFlames(f.upvotes_count || 0),
        }));
        setFilms(mapped);
      } else {
        setFilms([]);
      }

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
            width: 28, height: 28,
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

  if (notFound || !creator) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: "#FAFAFA", margin: "0 0 14px" }}>
          Studio not found
        </h1>
        <Link
          href="/creators"
          style={{
            fontFamily: MONO, fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: GOLD, textDecoration: "none",
            borderBottom: `1px solid rgba(212,168,87,0.4)`,
            paddingBottom: 4,
          }}
        >
          ← Back to creators
        </Link>
      </div>
    );
  }

  const { name: firstName, italic: lastName } = splitName(creator.name);
  const socials = buildSocials(creator);
  const tools = creator.toolkit || [];
  const recognition = creator.recognition || [];
  const tagline = creator.tagline || creator.highlight || "";
  const kicker = creator.role || "";
  const totalFilms = films.length;
  const filmYears = films.map((f) => f.year);
  const minYear = filmYears.length ? Math.min(...filmYears) : 0;
  const maxYear = filmYears.length ? Math.max(...filmYears) : 0;
  const initials = creator.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // Split bio into paragraphs (by blank lines or sentences)
  const bioParagraphs = creator.bio
    ? creator.bio.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ minHeight: "100vh", background: INK, color: "#FAFAFA", position: "relative", overflow: "hidden" }}>
      {/* Grain */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          opacity: 0.035, zIndex: 1,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }}
      />

      {/* ═══ BANNER — fallback gradient with blurred avatar ═══ */}
      <section style={{ position: "relative", height: 320, width: "100%", overflow: "hidden", zIndex: 2 }}>
        <div
          style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse at center, rgba(212,168,87,0.12) 0%, transparent 60%), linear-gradient(180deg, #0f0f13 0%, ${INK} 100%)`,
          }}
        >
          {creator.avatar_url && (
            <img
              src={creator.avatar_url}
              alt=""
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                opacity: 0.22,
                filter: "grayscale(0.5) blur(3px)",
              }}
            />
          )}
        </div>

        {/* Scrims */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 80, background: "linear-gradient(to bottom, rgba(10,10,12,0.75) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: "linear-gradient(to top, rgba(10,10,12,1) 0%, transparent 100%)", pointerEvents: "none" }} />

        {/* Name overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: "0 24px" }}>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(56px, 12vw, 200px)",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              margin: 0, fontWeight: 300,
              color: "#FAFAFA",
              textTransform: "lowercase",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 1s ease, transform 1s ease",
              textAlign: "center",
            }}
          >
            {firstName.toLowerCase()}
            {lastName && (
              <>
                {" "}
                <em style={{ fontStyle: "italic", opacity: 0.88, fontWeight: 300 }}>
                  {lastName.toLowerCase()}
                </em>
              </>
            )}
          </h1>
          {tagline && (
            <p
              className="font-serif"
              style={{
                marginTop: 14,
                fontSize: "clamp(13px, 1.2vw, 17px)",
                lineHeight: 1.5,
                fontStyle: "italic",
                color: GOLD, fontWeight: 300,
                opacity: isLoaded ? 0.95 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 1.2s ease 0.25s, transform 1.2s ease 0.25s",
                textShadow: "0 2px 18px rgba(0,0,0,0.6)",
                textAlign: "center",
                maxWidth: "80%",
              }}
            >
              {tagline}
            </p>
          )}
        </div>

        {/* Top nav */}
        <div style={{ position: "absolute", top: 24, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5, flexWrap: "wrap", gap: 10 }}>
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
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Catalog</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link href="/creators" style={{ color: "inherit", textDecoration: "none" }}>Pioneers</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: GOLD }}>{creator.name}</span>
          </div>
        </div>
      </section>

      {/* ═══ IDENTITY ROW ═══ */}
      <section style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "28px 40px 0", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0, background: "#111" }}>
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creator.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.05)" }} />
            ) : (
              <div className="font-serif" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 24 }}>
                {initials}
              </div>
            )}
          </div>

          <div style={{ flex: "1 1 440px", minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <h2 className="font-serif" style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.01em", margin: 0, color: "#FAFAFA", fontWeight: 500 }}>
                {firstName}
                {lastName && (<> <em style={{ fontStyle: "italic", opacity: 0.75, fontWeight: 400 }}>{lastName}</em></>)}
              </h2>
              <span
                style={{
                  fontFamily: MONO, fontSize: 9,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: GOLD,
                  border: "1px solid rgba(212,168,87,0.4)",
                  padding: "5px 9px",
                  display: "inline-flex",
                  alignItems: "center", gap: 6,
                  background: "rgba(212,168,87,0.05)",
                }}
              >
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
                Pioneer
              </span>
            </div>
            {kicker && (
              <p style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                {kicker}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
            {socials[0] && (
              <a
                href={socials[0].href}
                target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, background: "transparent", border: `1px solid ${GOLD}`, padding: "12px 22px", textDecoration: "none", transition: "background 0.3s ease" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(212,168,87,0.08)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                {socials[0].label}
              </a>
            )}
            <button
              style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: INK, background: "#FAFAFA", border: "1px solid #FAFAFA", padding: "12px 22px", cursor: "pointer", transition: "opacity 0.3s ease" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              + Follow
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)", marginTop: 32 }} />
      </section>

      {/* ═══ BODY GRID ═══ */}
      <section
        style={{
          position: "relative", maxWidth: 1160,
          margin: "0 auto", padding: "44px 40px 0",
          zIndex: 2, display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 240px",
          gap: 56,
        }}
      >
        {/* ── Bio left ── */}
        <div>
          {bioParagraphs.length > 0 ? (
            bioParagraphs.map((para, i) => (
              <p
                key={i}
                className="font-serif"
                style={{
                  fontSize: 15, lineHeight: 1.75,
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
            ))
          ) : (
            <p className="font-serif" style={{ fontSize: 15, fontStyle: "italic", color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Bio coming soon.
            </p>
          )}
        </div>

        {/* ── Aside right ── */}
        <aside style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 28 }}>
          {tools.length > 0 && (
            <AsideBlock heading="Toolkit">
              {tools.map((t, i) => (
                <div key={i} className="font-serif" style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", fontWeight: 400, lineHeight: 1.6 }}>
                  {t}
                </div>
              ))}
            </AsideBlock>
          )}

          {recognition.length > 0 && (
            <AsideBlock heading="Recognition">
              {recognition.map((r, i) => {
                const parts = r.split("·");
                return (
                  <div key={i} className="font-serif" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.88)", lineHeight: 1.5, marginBottom: 6 }}>
                    {parts[0]?.trim()}{" "}
                    {parts[1] ? (
                      <em style={{ fontStyle: "italic", opacity: 0.65 }}>· {parts[1]?.trim()}</em>
                    ) : null}
                  </div>
                );
              })}
            </AsideBlock>
          )}

          {socials.length > 0 && (
            <AsideBlock heading="Follow" isLast>
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    fontFamily: "inherit",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.85)",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    textDecorationColor: "rgba(212,168,87,0.4)",
                    marginBottom: 6,
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = GOLD)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)")}
                >
                  {s.label}
                </a>
              ))}
            </AsideBlock>
          )}

          {tools.length === 0 && recognition.length === 0 && socials.length === 0 && (
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
              Profile in progress
            </div>
          )}
        </aside>
      </section>

      {/* ═══ FILMOGRAPHY ═══ */}
      <section style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "80px 40px 0", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: 22, letterSpacing: "-0.01em", margin: 0, fontWeight: 500, color: "#FAFAFA" }}>
              Film<em style={{ fontStyle: "italic", color: GOLD, fontWeight: 300 }}>ography</em>
              {totalFilms > 0 && (
                <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginLeft: 16, fontWeight: 400 }}>
                  {String(totalFilms).padStart(2, "0")} {totalFilms === 1 ? "Film" : "Films"}{minYear ? ` · ${minYear}${minYear !== maxYear ? ` → ${maxYear}` : ""}` : ""}
                </span>
              )}
            </h2>
          </div>
        </div>

        {totalFilms === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <p className="font-serif" style={{ fontSize: 15, fontStyle: "italic", color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Films coming soon.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
            {films.map((f) => {
              const isHover = filmHover === f.id;
              return (
                <div
                  key={f.id}
                  onMouseEnter={() => setFilmHover(f.id)}
                  onMouseLeave={() => setFilmHover(null)}
                  onClick={() => router.push(`/movie/${f.id}`)}
                  style={{ cursor: "pointer" }}
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
                      alt={f.title}
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover", display: "block",
                        filter: isHover ? "grayscale(0) contrast(1.05)" : "grayscale(0.45) contrast(1.08) brightness(0.85)",
                        transform: isHover ? "scale(1.04)" : "scale(1)",
                        transition: "filter 0.5s ease, transform 0.6s cubic-bezier(.22,1,.36,1)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute", top: 8, left: 8,
                        fontFamily: MONO, fontSize: 8,
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
                    {f.duration && f.duration !== "—" && (
                      <div
                        style={{
                          position: "absolute", bottom: 8, right: 8,
                          fontFamily: MONO, fontSize: 8,
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
                    )}
                  </div>
                  <div style={{ paddingTop: 10 }}>
                    <h4 className="font-serif" style={{ fontSize: 15, margin: 0, fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.01em" }}>
                      {f.title}
                    </h4>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                      <span>{f.year}</span>
                      {f.flames && f.flames !== "0" && (
                        <>
                          <span style={{ opacity: 0.4 }}>·</span>
                          <span style={{ color: GOLD }}>△ {f.flames}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ position: "relative", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "28px 40px", maxWidth: 1160, margin: "100px auto 0", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div className="font-serif" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>
          spike <em style={{ fontStyle: "italic" }}>AI</em> <span style={{ opacity: 0.4 }}>·</span>{" "}
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em" }}>© 2026</span>
        </div>
        {socials.length > 0 && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.3s ease" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = GOLD)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
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

function AsideBlock({ heading, children, isLast }: { heading: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
      <h4 style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 10px", fontWeight: 500 }}>
        {heading}
      </h4>
      <div>{children}</div>
    </div>
  );
}
