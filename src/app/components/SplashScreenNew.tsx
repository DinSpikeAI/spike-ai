"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "spike.splash.seen";
const HOLD_MS = 2400;
const FADE_MS = 500;

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    setMounted(true);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dismiss = () => {
      setFading(true);
      setTimeout(() => {
        setMounted(false);
        try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
      }, FADE_MS);
    };
    const t = setTimeout(dismiss, HOLD_MS);
    const onInteract = () => dismiss();
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("pointerdown", onInteract, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("pointerdown", onInteract);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "center", overflow: "hidden", background: "#030303", opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}>
      <div style={{ position: "absolute", width: 1100, height: 700, left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.92})`, opacity: visible ? 1 : 0, transition: "opacity 900ms ease, transform 1400ms cubic-bezier(.22,1,.36,1)", background: "radial-gradient(ellipse at center, rgba(99,102,241,0.28) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)", filter: "blur(8px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center", padding: "0 24px" }}>
        <svg width="56" height="56" viewBox="0 0 60 60" style={{ borderRadius: 14, background: "#0a0a10", opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 12}px)`, transition: "opacity 700ms ease 100ms, transform 900ms cubic-bezier(.22,1,.36,1) 100ms" }}>
          <rect x="20" y="20" width="4" height="20" rx="1" fill="#8B5CF6" />
          <rect x="28" y="16" width="4" height="28" rx="1" fill="#6366F1" />
          <rect x="36" y="23" width="4" height="14" rx="1" fill="#6366F1" opacity="0.75" />
        </svg>

        <div className="font-serif font-light" style={{ fontSize: "clamp(56px, 9vw, 96px)", letterSpacing: "-0.02em", lineHeight: 1, color: "#FAFAFA", opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 18}px)`, transition: "opacity 900ms ease 250ms, transform 1100ms cubic-bezier(.22,1,.36,1) 250ms" }}>
          spike<em style={{ fontStyle: "italic", marginLeft: "0.08em", fontWeight: 300, opacity: 0.8 }}>AI</em>
        </div>

        <span aria-hidden style={{ display: "block", height: 1, background: "#D4A857", width: visible ? 72 : 0, opacity: visible ? 1 : 0, transition: "width 900ms cubic-bezier(.22,1,.36,1) 650ms, opacity 600ms ease 650ms" }} />

        <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.36em", textTransform: "uppercase", color: "#D4A857", opacity: visible ? 0.95 : 0, transform: `translateY(${visible ? 0 : 8}px)`, transition: "opacity 700ms ease 900ms, transform 900ms ease 900ms" }}>
          AI&nbsp;&nbsp;CINEMA
        </div>
      </div>
    </div>
  );
}