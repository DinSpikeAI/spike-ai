"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   SPLASH SCREEN — Aurora · Delicate
   First-visit only (uses localStorage). Dismissible.
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "spike.splash.seen";
const HOLD_MS = 3800;
const FADE_MS = 700;

export default function SplashScreenNew() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // First-visit gate
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen) return;
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // if localStorage unavailable, still show once
    }

    setShow(true);

    // Auto-dismiss after hold
    const t = setTimeout(() => setFading(true), HOLD_MS);
    const t2 = setTimeout(() => setShow(false), HOLD_MS + FADE_MS);

    // Dismiss on any key / click
    const dismiss = () => {
      setFading(true);
      setTimeout(() => setShow(false), FADE_MS);
    };
    window.addEventListener("keydown", dismiss, { once: true });
    window.addEventListener("pointerdown", dismiss, { once: true });

    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Instrument+Serif:ital@0;1&display=swap"
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#050610",
          overflow: "hidden",
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
          pointerEvents: fading ? "none" : "auto",
        }}
      >
        {/* ── Aurora background ── */}
        <div style={{ position: "absolute", inset: 0, background: "#050610" }}>
          {/* 4 colored radial blobs that drift */}
          <div
            style={{
              position: "absolute",
              inset: "-20%",
              backgroundImage: `
                radial-gradient(ellipse 60% 50% at 30% 30%, rgba(99,102,241,0.50) 0%, transparent 55%),
                radial-gradient(ellipse 50% 60% at 70% 70%, rgba(236,72,153,0.35) 0%, transparent 55%),
                radial-gradient(ellipse 45% 55% at 50% 90%, rgba(20,184,166,0.30) 0%, transparent 50%),
                radial-gradient(ellipse 45% 40% at 80% 20%, rgba(139,92,246,0.35) 0%, transparent 55%)
              `,
              filter: "blur(80px)",
              opacity: 0,
              animation:
                "spike-aurora-in 3s ease 0.1s forwards, spike-aurora-drift 20s ease-in-out 0.1s infinite alternate",
            }}
          />

          {/* Dark vignette + top/bottom fade for contrast */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(ellipse at center, transparent 30%, rgba(5,6,16,0.75) 80%),
                linear-gradient(180deg, rgba(5,6,16,0.35) 0%, transparent 30%, transparent 70%, rgba(5,6,16,0.7) 100%)
              `,
            }}
          />

          {/* Noise */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.06,
              mixBlendMode: "overlay",
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'1.4\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />
        </div>

        {/* ── Wordmark (only) ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: "90%",
          }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(84px, 12vw, 180px)",
              lineHeight: 1,
              letterSpacing: "0.04em",
              color: "#FAFAFA",
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: "0.32em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                letterSpacing: "0.12em",
                opacity: 0,
                transform: "translateY(16px)",
                filter: "blur(6px)",
                animation: "spike-blur-in 2s cubic-bezier(.22,1,.36,1) 1.0s forwards",
              }}
            >
              spike
            </span>
            <span
              style={{
                display: "inline-block",
                fontStyle: "italic",
                fontWeight: 300,
                letterSpacing: "0.04em",
                backgroundImage: "linear-gradient(135deg, #FAFAFA 0%, #C4B5FD 80%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                opacity: 0,
                transform: "translateY(16px)",
                filter: "blur(6px)",
                animation: "spike-blur-in 2s cubic-bezier(.22,1,.36,1) 1.4s forwards",
              }}
            >
              Ai
            </span>
          </div>
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes spike-aurora-in { to { opacity: 1; } }
          @keyframes spike-aurora-drift {
            0%   { transform: translate(0, 0) scale(1); }
            100% { transform: translate(4%, -2%) scale(1.08); }
          }
          @keyframes spike-blur-in {
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
        `}</style>
      </div>
    </>
  );
}
