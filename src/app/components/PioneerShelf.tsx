"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

// 3 confirmed portrait creators. A 4th will be auto-filled from the DB.
const PRIORITY_NAMES = ["Vallée Duhamel", "Maya Shoshani", "Yuval Avadya", "Ovey Studios"];

// Pretty role display override. Falls back to DB role if not listed.
const ROLE_OVERRIDES: Record<string, string> = {
  "Vallée Duhamel": "Duo · Montréal · Anthology / Music Video",
  "Maya Shoshani": "Director · Tel Aviv · Drama / Art House",
  "Yuval Avadya": "Director · Berlin · Documentary / Essay",
};

const GOLD = "#D4A857";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, Monaco, monospace";
const BW_FILTER = "grayscale(1) contrast(1.12) brightness(0.82) sepia(0.08)";
const COLOR_FILTER = "grayscale(0) contrast(1.06) brightness(0.98) sepia(0)";

export default function PioneerShelf() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from("pioneer_creators")
      .select("*")
      .eq("visible", true)
      .then(({ data }) => {
        if (!data) return;
        const all = data as Creator[];
        const priority = PRIORITY_NAMES
          .map((n) => all.find((c) => c.name === n))
          .filter(Boolean) as Creator[];
        const fill = all
          .filter((c) => !PRIORITY_NAMES.includes(c.name))
          .slice(0, 4 - priority.length);
        setCreators([...priority, ...fill].slice(0, 4));
      });
  }, []);

  if (creators.length === 0) return null;

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <section
      style={{
        position: "relative",
        padding: "88px 40px 64px",
        overflow: "visible",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", overflow: "visible" }}>
        {/* Header */}
        <div style={{ marginBottom: 40, overflow: "visible" }}>
          {/* Kicker */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 10px ${GOLD}`, flexShrink: 0 }} />
            <span style={{ width: 40, height: 1, background: `linear-gradient(to right, ${GOLD}, transparent)`, flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD }}>
              The Prestige Tier · Awarded, Not Applied For
            </span>
          </div>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 480 }}>
              <h2
                className="font-serif"
                style={{
                  fontSize: 48,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  margin: "0 0 14px",
                  paddingTop: 6,
                  color: "#FAFAFA",
                  fontWeight: 400,
                  overflow: "visible",
                }}
              >
                Pioneer{" "}
                <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.72)", fontWeight: 300 }}>
                  Creators
                </em>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    letterSpacing: "0.2em",
                    color: "rgba(212,168,87,0.5)",
                    marginLeft: 12,
                    verticalAlign: "top",
                    fontWeight: 400,
                  }}
                >
                  {String(creators.length).padStart(2, "0")}
                </span>
              </h2>
              <p
                className="font-serif"
                style={{ fontSize: 14.5, lineHeight: 1.55, fontStyle: "italic", color: "rgba(255,255,255,0.52)", margin: 0, fontWeight: 300 }}
              >
                The first cohort of filmmakers shaping AI cinema&apos;s vocabulary – hand-picked by the editorial desk for craft, consistency, and voice.
              </p>
            </div>
            <Link
              href="/creators"
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: GOLD,
                textDecoration: "none",
                borderBottom: "1px solid rgba(212,168,87,0.35)",
                paddingBottom: 4,
              }}
            >
              Meet the Pioneers →
            </Link>
          </div>
        </div>

        {/* Grid - 4 up */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 22,
            maxWidth: 1040,
            margin: "0 auto",
          }}
        >
          {creators.map((c, idx) => {
            const isHover = hovered === c.id;
            const hasError = imgError[c.id];
            const showImage = c.avatar_url && !hasError;
            const displayRole = ROLE_OVERRIDES[c.name] || c.role;
            return (
              <Link
                key={c.id}
                href="/creators"
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  color: "inherit",
                  transform: isHover ? "translateY(-4px)" : "translateY(0)",
                  transition: "transform 0.5s cubic-bezier(.22,1,.36,1)",
                }}
              >
                {/* Portrait frame */}
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "3 / 4",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #0a0a0c 0%, #151519 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: isHover
                      ? "0 22px 60px rgba(212,168,87,0.22), 0 0 0 1px rgba(212,168,87,0.28)"
                      : "0 2px 10px rgba(0,0,0,0.4)",
                    transition: "box-shadow 0.5s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  {showImage ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        transform: isHover ? "scale(1.04)" : "scale(1)",
                        filter: isHover ? COLOR_FILTER : BW_FILTER,
                        transition:
                          "transform 0.8s cubic-bezier(.22,1,.36,1), filter 0.6s ease",
                      }}
                    >
                      <Image
                        src={c.avatar_url as string}
                        alt={c.name}
                        fill
                        sizes="(max-width: 900px) 50vw, 260px"
                        style={{ objectFit: "cover" }}
                        quality={90}
                        priority={idx < 2}
                        onError={() => setImgError((e) => ({ ...e, [c.id]: true }))}
                      />
                    </div>
                  ) : (
                    <div
                      className="font-serif"
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 54,
                        fontWeight: 300,
                        color: GOLD,
                      }}
                    >
                      {getInitials(c.name)}
                    </div>
                  )}

                  {/* Radial vignette + bottom fade */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.35) 100%), linear-gradient(180deg, transparent 40%, rgba(5,5,5,0.65) 82%, rgba(5,5,5,0.95) 100%)",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />

                  {/* Pioneer badge - top-left, small */}
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: MONO,
                      fontSize: 7.5,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: GOLD,
                      background: "rgba(10,10,14,0.78)",
                      border: "1px solid rgba(212,168,87,0.35)",
                      padding: "5px 7px",
                      backdropFilter: "blur(8px)",
                      zIndex: 3,
                    }}
                  >
                    <span style={{ color: "rgba(212,168,87,0.55)" }}>\</span>
                    <span>Pioneer</span>
                    <span style={{ color: "rgba(212,168,87,0.55)" }}>/</span>
                  </div>

                  {/* Corner rule - top-right (L-shape) */}
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 18,
                      height: 18,
                      borderTop: `1px solid ${GOLD}`,
                      borderRight: `1px solid ${GOLD}`,
                      opacity: 0.85,
                      zIndex: 3,
                    }}
                  />
                </div>

                {/* Caption block */}
                <div style={{ paddingTop: 12 }}>
                  <h3
                    className="font-serif"
                    style={{
                      fontWeight: 500,
                      fontSize: 16,
                      lineHeight: 1.2,
                      margin: "0 0 4px",
                      color: "#FAFAFA",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {c.name}
                  </h3>
                  {displayRole ? (
                    <p
                      className="font-serif"
                      style={{
                        fontSize: 11.5,
                        lineHeight: 1.35,
                        fontStyle: "italic",
                        color: "rgba(255,255,255,0.55)",
                        margin: "0 0 8px",
                        fontWeight: 300,
                      }}
                    >
                      {displayRole}
                    </p>
                  ) : (
                    <div style={{ height: 18 }} />
                  )}
                  <div
                    style={{
                      height: 1,
                      background: `linear-gradient(to right, ${GOLD}, rgba(212,168,87,0.08))`,
                      width: "100%",
                      opacity: 0.75,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: MONO,
                      fontSize: 8.5,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(212,168,87,0.85)",
                    }}
                  >
                    <span>
                      {c.films_count
                        ? `${String(c.films_count).padStart(2, "0")} Films`
                        : "New"}
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>Since 2026</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
