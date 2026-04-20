"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const GOLD = "#D4A857";
const INK = "#FAFAFA";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, Monaco, monospace";

// 8 cinematic Unsplash stills - consistent moody/cinematic feel.
// Replace these URLs to customize the marquee.
const STILLS = [
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=640&h=720&q=85",
  "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=640&h=720&q=85",
  "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&w=640&h=720&q=85",
  "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?auto=format&fit=crop&w=640&h=720&q=85",
  "https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?auto=format&fit=crop&w=640&h=720&q=85",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=640&h=720&q=85",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=640&h=720&q=85",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=640&h=720&q=85",
];

export default function MarqueeHero() {
  const router = useRouter();

  const handleStartWatching = () => {
    // Scroll to films section on the same page
    const categorySection = document.querySelector("[data-films-start]") || document.querySelector("main") || document.body;
    const rect = (categorySection as HTMLElement).getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: "smooth" });
  };

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(560px, 82vh, 780px)",
        overflow: "hidden",
        background: "#050505",
      }}
    >
      {/* ── Marquee reel ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          animation: "spike-marquee 80s linear infinite",
          willChange: "transform",
        }}
      >
        {/* Strip 1 */}
        <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>
          {STILLS.map((src, i) => (
            <div key={`a${i}`} style={{ flexShrink: 0, width: 320, height: "100%" }}>
              <img
                src={src}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: "grayscale(0.3) contrast(1.1) brightness(0.85)",
                }}
              />
            </div>
          ))}
        </div>
        {/* Strip 2 - identical duplicate for seamless loop */}
        <div style={{ display: "flex", flexShrink: 0, height: "100%" }} aria-hidden>
          {STILLS.map((src, i) => (
            <div key={`b${i}`} style={{ flexShrink: 0, width: 320, height: "100%" }}>
              <img
                src={src}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: "grayscale(0.3) contrast(1.1) brightness(0.85)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-layer VEIL (the magic for readability) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          backgroundImage: `
            linear-gradient(90deg, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.88) 45%, rgba(5,5,5,0.68) 70%, rgba(5,5,5,0.45) 100%),
            linear-gradient(180deg, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.15) 25%, rgba(5,5,5,0.15) 70%, rgba(5,5,5,0.85) 100%),
            radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.5) 100%)
          `,
        }}
      />

      {/* Grain overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          opacity: 0.06,
          mixBlendMode: "overlay",
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* ── Body content ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 clamp(28px, 6vw, 88px)",
          maxWidth: 1680,
          margin: "0 auto",
        }}
      >
        {/* Kicker */}
        <div
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: GOLD,
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            margin: "0 0 22px",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: GOLD,
              boxShadow: `0 0 12px ${GOLD}`,
              animation: "spike-pulse 2s ease infinite",
              display: "inline-block",
            }}
          />
          <span>Spike AI</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ color: "rgba(250,250,250,0.5)" }}>Vol. I · MMXXVI</span>
        </div>

        {/* Mega heading */}
        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(62px, 10vw, 148px)",
            lineHeight: 0.92,
            letterSpacing: "-0.032em",
            color: INK,
            maxWidth: "14ch",
            textShadow: "0 2px 40px rgba(0,0,0,0.65)",
            margin: "0 0 16px",
            fontWeight: 400,
          }}
        >
          <em style={{ fontStyle: "italic", color: GOLD }}>AI</em>{" "}
          <em style={{ fontStyle: "italic" }}>cinema.</em>
        </h1>

        {/* Subcopy with gold left border */}
        <p
          className="font-serif"
          style={{
            fontSize: "clamp(17px, 1.6vw, 22px)",
            lineHeight: 1.5,
            color: INK,
            fontStyle: "italic",
            maxWidth: 560,
            borderLeft: `2px solid ${GOLD}`,
            paddingLeft: 20,
            margin: "24px 0 40px",
            textShadow: "0 2px 24px rgba(0,0,0,0.7)",
            fontWeight: 300,
          }}
        >
          An editorial home for directors working with generative tools – curated, quietly, in volumes.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={handleStartWatching}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#0A0A0C",
              background: GOLD,
              border: `1px solid ${GOLD}`,
              padding: "16px 26px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 600,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              boxShadow: "0 10px 40px rgba(212,168,87,0.25)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 18px 55px rgba(212,168,87,0.38)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "0 10px 40px rgba(212,168,87,0.25)";
            }}
          >
            <span>▶</span>
            <span>Start Watching</span>
            <span style={{ marginLeft: 4 }}>→</span>
          </button>

          <Link
            href="/creators"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: INK,
              background: "transparent",
              border: "1px solid rgba(250,250,250,0.35)",
              padding: "16px 26px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              fontWeight: 500,
              transition: "border-color 0.3s ease, background 0.3s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(250,250,250,0.7)";
              el.style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(250,250,250,0.35)";
              el.style.background = "transparent";
            }}
          >
            Meet the Pioneers
          </Link>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spike-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes spike-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </section>
  );
}
