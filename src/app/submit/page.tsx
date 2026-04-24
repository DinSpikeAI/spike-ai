"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const LAV = "#C4B5FD";
const VIOLET = "#8B5CF6";
const INK = "#F2F1FA";
const BG = "#02020A";
const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";
const SERIF = "'Fraunces', 'Instrument Serif', Georgia, serif";
const ITALIC = "'Instrument Serif', 'Fraunces', Georgia, serif";
const SANS = "'Inter Tight', system-ui, -apple-system, sans-serif";

const AI_MODELS = [
  "Runway Gen-4", "Runway Gen-3", "Midjourney", "Stable Diffusion XL",
  "Sora", "Kling AI", "Pika Labs", "Stable Video", "ElevenLabs",
  "Hailuo", "Luma Dream Machine", "Seedance", "Veo3", "Wan 2.6", "Other",
];

const GENRES = [
  "Sci-Fi", "Drama", "Horror", "Comedy", "Dark Comedy", "Action", "Thriller",
  "Romance", "Documentary", "Fantasy", "Animation", "Experimental", "Music Video",
  "Cyberpunk", "Mystery", "Art House", "Anime", "Musical", "Satire", "Psychological",
];

const CATEGORIES = [
  "Trending", "AI Horror", "Sci-Fi Visions", "Award Winning",
  "AI Anime", "AI Documentary", "Action", "Fantasy", "Runway Masterpieces",
];

/* ═══════════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════════ */

function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "warning"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const color =
    type === "success" ? "#34D399" :
    type === "error" ? "#F87171" :
    "#FBBF24";

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        padding: "12px 20px",
        borderRadius: 3,
        border: `1px solid ${color}40`,
        background: "rgba(2,2,10,0.92)",
        backdropFilter: "blur(14px)",
        color,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: SANS,
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{type === "success" ? "✓" : "!"}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{ marginLeft: 6, background: "transparent", border: 0, color: "inherit", opacity: 0.6, cursor: "pointer", fontSize: 14 }}
      >
        ×
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function SubmitPage() {
  const [form, setForm] = useState({
    title: "", description: "", genre: "", category: "",
    duration: "", creator_name: "", video_url: "",
    trailer_url: "", poster_url: "", tagline: "", series_name: "", episode_number: "",
  });
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
  const [accessChecking, setAccessChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Creator/Admin Gate ──
  useEffect(() => {
    async function checkAccess() {
      if (!supabase) { setAccessChecking(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setAccessChecking(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, user_type")
        .eq("id", session.user.id)
        .single();
      if (profile?.role === "admin" || profile?.user_type === "creator") {
        setHasAccess(true);
      }
      setAccessChecking(false);
    }
    checkAccess();
  }, []);

  const isValid = !!(form.title && form.description && selectedGenres.length > 0 && form.category && form.creator_name);
  const filledCount = [form.title, form.description, selectedGenres.length > 0 ? "yes" : "", form.category, form.creator_name].filter(Boolean).length;
  const progress = Math.round((filledCount / 5) * 100);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => prev.includes(genre) ? prev.filter((g) => g !== genre) : prev.length < 2 ? [...prev, genre] : prev);
  };

  const toggleModel = (model: string) => {
    setSelectedModels((prev) => prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]);
  };

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (form.video_url && !form.video_url.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//)) {
      setToast({ message: "Video URL must be a YouTube or Vimeo link", type: "warning" });
      return;
    }

    if (!isValid) {
      const missing: string[] = [];
      if (!form.title) missing.push("Title");
      if (!form.description) missing.push("Description");
      if (selectedGenres.length === 0) missing.push("Genre");
      if (!form.category) missing.push("Category");
      if (!form.creator_name) missing.push("Creator");
      setToast({ message: `Missing: ${missing.join(", ")}`, type: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      if (!supabase) throw new Error("Service unavailable");
      const { error } = await supabase.from("movies").insert({
        title: form.title,
        description: form.description,
        genre: selectedGenres.join(", "),
        category: form.category,
        duration: form.duration || null,
        creator_name: form.creator_name,
        creator_id: (await supabase.auth.getSession()).data.session?.user?.id || null,
        video_url: form.video_url || null,
        trailer_url: form.trailer_url || null,
        poster_url: form.poster_url || null,
        tagline: form.tagline || null,
        ai_models: selectedModels,
        status: "pending",
        series_name: form.series_name || null,
        episode_number: form.episode_number ? parseInt(form.episode_number) : null,
      });
      if (error) throw error;
      setSubmitted(true);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    } catch (err) {
      setToast({ message: "Submission failed. Please try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const [vimeoThumb, setVimeoThumb] = useState<string | null>(null);

  const getYtThumb = (url: string) => {
    try {
      const u = new URL(url);
      let id = "";
      if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v") || "";
      else if (u.hostname === "youtu.be") id = u.pathname.slice(1);
      return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
    } catch { return null; }
  };

  const getVimeoId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("vimeo.com")) return u.pathname.split("/").pop() || null;
      return null;
    } catch { return null; }
  };

  useEffect(() => {
    if (!form.video_url) { setVimeoThumb(null); return; }
    const vid = getVimeoId(form.video_url);
    if (!vid) { setVimeoThumb(null); return; }
    fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vid}`)
      .then((r) => r.json())
      .then((data) => { if (data.thumbnail_url) setVimeoThumb(data.thumbnail_url); })
      .catch(() => setVimeoThumb(null));
  }, [form.video_url]);

  const posterSrc = form.poster_url || (form.video_url ? (getYtThumb(form.video_url) || vimeoThumb) : null);

  /* ── Loading Access Check ── */
  if (accessChecking) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;1,9..144,200;1,9..144,300&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@200;300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap" />
        <div style={{ width: 24, height: 24, border: `1px solid ${LAV}40`, borderTopColor: LAV, borderRadius: "50%", animation: "spike-spin 1s linear infinite" }} />
        <style>{`@keyframes spike-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Access Denied ── */
  if (!hasAccess) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", color: INK, position: "relative", overflow: "hidden" }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;1,9..144,200;1,9..144,300&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@200;300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap" />
        <AmbientBg />
        <div style={{ maxWidth: 480, textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.42em", textTransform: "uppercase", color: LAV, marginBottom: 22 }}>
            § Creator access only
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 200, fontSize: "clamp(48px, 6vw, 72px)", lineHeight: 0.92, letterSpacing: "-0.04em", margin: "0 0 22px", color: INK }}>
            apply <em style={{ fontFamily: ITALIC, fontStyle: "italic", fontWeight: 300, backgroundImage: `linear-gradient(135deg, #FFF 0%, ${LAV} 55%, ${VIOLET} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>first.</em>
          </h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 17, color: "rgba(242,241,250,0.55)", margin: "0 0 36px", lineHeight: 1.6 }}>
            Submitting films is reserved for approved creators. Apply to join the pioneer cohort.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/become-creator"
              style={{
                padding: "14px 28px",
                background: `linear-gradient(135deg, #E8DEFF 0%, ${LAV} 40%, ${VIOLET} 100%)`,
                color: "#0A0818",
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 3,
                boxShadow: `0 12px 32px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.2)`,
              }}
            >
              Apply as Creator
            </a>
            <Link
              href="/"
              style={{
                padding: "14px 28px",
                background: "transparent",
                border: `1px solid rgba(242,241,250,0.15)`,
                color: "rgba(242,241,250,0.6)",
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 3,
              }}
            >
              ← Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", color: INK, position: "relative", overflow: "hidden" }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;1,9..144,200;1,9..144,300&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@200;300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap" />
        <AmbientBg />
        <div style={{ maxWidth: 480, textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.42em", textTransform: "uppercase", color: LAV, marginBottom: 22 }}>
            § Submitted
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 200, fontSize: "clamp(56px, 7vw, 96px)", lineHeight: 0.92, letterSpacing: "-0.05em", margin: "0 0 22px", color: INK }}>
            received <em style={{ fontFamily: ITALIC, fontStyle: "italic", fontWeight: 300, backgroundImage: `linear-gradient(135deg, #FFF 0%, ${LAV} 55%, ${VIOLET} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>with thanks.</em>
          </h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 17, color: "rgba(242,241,250,0.55)", margin: "0 0 36px", lineHeight: 1.6 }}>
            Your film is under editorial review. We&apos;ll notify you once it has been approved and added to the catalog.
          </p>
          <Link
            href="/"
            style={{
              padding: "14px 28px",
              background: "transparent",
              border: `1px solid rgba(196,181,253,0.4)`,
              color: LAV,
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 3,
              display: "inline-block",
            }}
          >
            ← Back to Spike AI
          </Link>
        </div>
      </div>
    );
  }

  /* ═══ MAIN FORM ═══ */

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, position: "relative", overflow: "hidden", fontFamily: SANS }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;1,9..144,200;1,9..144,300&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@200;300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <AmbientBg />

      {/* ═══ TOP BAR ═══ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "18px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(180deg, rgba(2,2,10,0.9), rgba(2,2,10,0.5) 60%, transparent)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(242,241,250,0.45)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
          ← Cancel
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 32 32" style={{ display: "block" }}>
            <rect x="6" y="6" width="4" height="20" fill={VIOLET} rx="0.5" />
            <rect x="14" y="6" width="4" height="20" fill="#6366F1" rx="0.5" opacity="0.9" />
            <rect x="22" y="6" width="4" height="20" fill="#6366F1" rx="0.5" opacity="0.75" />
          </svg>
          <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: "rgba(242,241,250,0.75)" }}>
            spike <em style={{ fontFamily: ITALIC, fontStyle: "italic", color: LAV, fontWeight: 400 }}>Ai.</em>
          </span>
        </div>
        <div
          style={{
            padding: "6px 14px",
            background: "rgba(196,181,253,0.06)",
            border: `1px solid rgba(196,181,253,0.2)`,
            borderRadius: 100,
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: LAV,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>{progress}%</span>
          <span style={{ width: 52, height: 2, background: "rgba(196,181,253,0.15)", position: "relative", overflow: "hidden" }}>
            <span style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${progress}%`, background: `linear-gradient(90deg, ${LAV}, #FFF)`, boxShadow: `0 0 8px ${LAV}`, transition: "width 0.3s ease" }} />
          </span>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "72px 24px 56px",
          maxWidth: 1100,
          margin: "0 auto",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 1s ease, transform 1s ease",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.42em", textTransform: "uppercase", color: LAV, display: "inline-flex", alignItems: "center", gap: 16, margin: "0 auto 28px" }}>
          <span style={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, rgba(196,181,253,0.55), transparent)` }} />
          <span>Submit · Volume I · MMXXVI</span>
          <span style={{ width: 48, height: 1, background: `linear-gradient(90deg, transparent, rgba(196,181,253,0.55), transparent)` }} />
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 200,
            fontSize: "clamp(56px, 9vw, 128px)",
            lineHeight: 0.92,
            letterSpacing: "-0.055em",
            textAlign: "center",
            margin: "0 0 22px",
            color: INK,
          }}
        >
          a new{" "}
          <em
            style={{
              fontFamily: ITALIC,
              fontStyle: "italic",
              fontWeight: 300,
              backgroundImage: `linear-gradient(135deg, #FFF 0%, ${LAV} 55%, ${VIOLET} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 0 40px rgba(139,92,246,0.4))`,
            }}
          >
            film.
          </em>
        </h1>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(15px, 1.4vw, 18px)",
            lineHeight: 1.55,
            color: "rgba(242,241,250,0.55)",
            maxWidth: 540,
            margin: "0 auto",
          }}
        >
          Five sections. A few details. The editorial desk will take it from there.
        </p>
      </section>

      {/* ═══ LANTERN ═══ */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1100,
          margin: "0 auto 60px",
          padding: "clamp(32px, 5vw, 68px) clamp(24px, 5vw, 72px) 60px",
          background: "linear-gradient(180deg, rgba(18,16,38,0.85), rgba(10,8,24,0.88))",
          border: `1px solid rgba(196,181,253,0.14)`,
          borderRadius: 4,
          backdropFilter: "blur(28px) saturate(1.2)",
          WebkitBackdropFilter: "blur(28px) saturate(1.2)",
          boxShadow: "0 60px 120px rgba(0,0,0,0.7), 0 0 120px rgba(139,92,246,0.1), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(139,92,246,0.06) inset",
        }}
      >
        {/* Top light-bleed */}
        <div
          style={{
            position: "absolute",
            top: -1,
            left: "12%",
            right: "12%",
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(196,181,253,0.8), transparent)`,
          }}
        />
        {/* Halo */}
        <div
          style={{
            position: "absolute",
            top: -28,
            left: "25%",
            right: "25%",
            height: 56,
            background: `radial-gradient(ellipse 50% 100% at 50% 100%, rgba(196,181,253,0.3), transparent 70%)`,
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        {/* Corner marks */}
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* ── Section 01: Film Details ── */}
        <Section num="01" total="05" title="Film · Identity" sub="The title, the pitch, the crew.">
          <Field label="Film Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="What is it called?"
              style={inpStyle()}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          <Field label="Description" required>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Story, vision, what makes it unique…"
              rows={4}
              style={taStyle()}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          <Field label="Tagline" hint="A short line for the hero card">
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="e.g. A cathedral of pixels."
              style={inpStyle()}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Creator / Studio" required>
              <input
                type="text"
                value={form.creator_name}
                onChange={(e) => update("creator_name", e.target.value)}
                placeholder="Your name or studio"
                style={inpStyle()}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
            <Field label="Duration" hint="e.g. 14m">
              <input
                type="text"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="14m"
                style={inpStyle()}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Series Name" hint="Optional – for episodic work">
              <input
                type="text"
                value={form.series_name}
                onChange={(e) => update("series_name", e.target.value)}
                placeholder="e.g. Breakup Letters AI"
                style={inpStyle()}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
            <Field label="Episode #">
              <input
                type="text"
                value={form.episode_number}
                onChange={(e) => update("episode_number", e.target.value)}
                placeholder="01"
                style={inpStyle()}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
          </div>
        </Section>

        {/* ── Section 02: Genre + Category ── */}
        <Section num="02" total="05" title="Genre · Shelf" sub="Where it lives in the catalog.">
          <Field label="Genre" required hint="Up to two">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {GENRES.map((g) => {
                const on = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    style={chipStyle(on)}
                  >
                    {on && <span style={{ width: 4, height: 4, borderRadius: "50%", background: LAV, boxShadow: `0 0 8px ${LAV}`, display: "inline-block" }} />}
                    {g}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Category" required hint="Which shelf on the homepage">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => {
                const on = form.category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("category", c)}
                    style={chipStyle(on)}
                  >
                    {on && <span style={{ width: 4, height: 4, borderRadius: "50%", background: LAV, boxShadow: `0 0 8px ${LAV}`, display: "inline-block" }} />}
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {/* ── Section 03: Tools ── */}
        <Section num="03" total="05" title="Tools · Credits" sub="Which models and platforms made this possible.">
          <Field label="AI Tools Used" hint="Select all that apply">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {AI_MODELS.map((m) => {
                const on = selectedModels.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleModel(m)}
                    style={toolStyle(on)}
                  >
                    <span style={{ fontFamily: SANS, fontSize: 13, color: on ? INK : "rgba(242,241,250,0.55)" }}>{m}</span>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: `1px solid ${on ? LAV : "rgba(242,241,250,0.3)"}`,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: on ? `linear-gradient(135deg, ${LAV}, ${VIOLET})` : "transparent",
                        color: "#02020A",
                        fontSize: 8,
                        fontWeight: 700,
                        boxShadow: on ? `0 0 12px rgba(196,181,253,0.6)` : "none",
                        flexShrink: 0,
                      }}
                    >
                      {on && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {/* ── Section 04: Media Links ── */}
        <Section num="04" total="05" title="Media · Links" sub="YouTube, Vimeo, a poster if you have one.">
          <Field label="Film Video URL" hint="YouTube or Vimeo – auto-detected embed & poster">
            <input
              type="text"
              value={form.video_url}
              onChange={(e) => update("video_url", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              style={inpStyle()}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Trailer URL" hint="Optional – short teaser">
              <input
                type="text"
                value={form.trailer_url}
                onChange={(e) => update("trailer_url", e.target.value)}
                placeholder="Optional teaser link"
                style={inpStyle()}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
            <Field label="Poster Image URL" hint="Optional – 2:3 vertical">
              <input
                type="text"
                value={form.poster_url}
                onChange={(e) => update("poster_url", e.target.value)}
                placeholder="Direct image link"
                style={inpStyle()}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
          </div>

          {/* Preview */}
          {posterSrc && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(242,241,250,0.45)", marginBottom: 12 }}>
                · Preview
              </div>
              <div style={{ maxWidth: 320, aspectRatio: "16/9", overflow: "hidden", border: `1px solid rgba(196,181,253,0.2)`, borderRadius: 3, background: "#0a0812" }}>
                <img src={posterSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            </div>
          )}
        </Section>

        {/* ── Section 05: Submit ── */}
        <Section num="05" total="05" title="Submit · Review" sub="Final check before sending to the editorial desk." isLast>
          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px",
              background: isValid ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.015)",
              border: `1px solid ${isValid ? "rgba(52,211,153,0.25)" : "rgba(242,241,250,0.08)"}`,
              borderRadius: 3,
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isValid ? "#34D399" : "rgba(242,241,250,0.15)",
                  boxShadow: isValid ? "0 0 12px rgba(52,211,153,0.6)" : "none",
                }}
              />
              <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: isValid ? "#34D399" : "rgba(242,241,250,0.4)" }}>
                {isValid ? "Ready to submit" : "Fill required fields"}
              </span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: "rgba(242,241,250,0.35)" }}>
              {filledCount} / 5
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || cooldown}
            style={{
              width: "100%",
              padding: "18px 28px",
              background: isValid && !submitting
                ? `linear-gradient(135deg, #E8DEFF 0%, ${LAV} 40%, ${VIOLET} 100%)`
                : "rgba(242,241,250,0.04)",
              color: isValid && !submitting ? "#0A0818" : "rgba(242,241,250,0.25)",
              border: `1px solid ${isValid && !submitting ? "rgba(196,181,253,0.4)" : "rgba(242,241,250,0.08)"}`,
              borderRadius: 3,
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: submitting || cooldown ? "default" : "pointer",
              boxShadow: isValid && !submitting
                ? `0 12px 32px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.2), 0 1px 0 rgba(255,255,255,0.3) inset`
                : "none",
              transition: "transform 0.2s ease, box-shadow 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
            onMouseEnter={(e) => {
              if (isValid && !submitting) {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            {submitting ? "Submitting…" : "Submit Film"}
            {isValid && !submitting && (
              <span style={{ fontFamily: ITALIC, fontStyle: "italic", fontWeight: 300, fontSize: 18 }}>→</span>
            )}
          </button>

          <p
            style={{
              textAlign: "center",
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 12.5,
              color: "rgba(242,241,250,0.35)",
              marginTop: 16,
              lineHeight: 1.6,
            }}
          >
            By submitting, you confirm this is your original AI-generated work and agree to our{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: LAV, textDecoration: "underline", textUnderlineOffset: 2 }}>
              Terms of Service
            </a>
            .
          </p>
        </Section>
      </section>

      {/* Seal */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          paddingBottom: 60,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 13,
          color: "rgba(242,241,250,0.38)",
          display: "flex",
          justifyContent: "center",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: LAV, fontSize: 10 }}>✦</span>
        <span>spike ai · folio iv · mmxxvi</span>
        <span style={{ color: LAV, fontSize: 10 }}>✦</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function AmbientBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          top: -100,
          left: "12%",
          borderRadius: "50%",
          filter: "blur(110px)",
          background: `radial-gradient(circle at 40% 40%, rgba(139,92,246,0.30), transparent 60%)`,
          animation: "spike-drift1 28s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          top: "20%",
          right: "-10%",
          borderRadius: "50%",
          filter: "blur(110px)",
          background: `radial-gradient(circle at 50% 50%, rgba(196,181,253,0.14), transparent 65%)`,
          animation: "spike-drift2 34s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 540,
          height: 540,
          bottom: -60,
          left: "30%",
          borderRadius: "50%",
          filter: "blur(110px)",
          background: `radial-gradient(circle at 50% 50%, rgba(91,33,182,0.22), transparent 65%)`,
          animation: "spike-drift3 40s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          mixBlendMode: "overlay",
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'1.2\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
      <style>{`
        @keyframes spike-drift1 { to { transform: translate(60px, 40px) scale(1.08); } }
        @keyframes spike-drift2 { to { transform: translate(-80px, 30px) scale(1.05); } }
        @keyframes spike-drift3 { to { transform: translate(40px, -30px) scale(1.1); } }
      `}</style>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 14,
    height: 14,
    border: `1px solid rgba(196,181,253,0.35)`,
  };
  if (pos === "tl") { s.top = -1; s.left = -1; s.borderRight = 0; s.borderBottom = 0; }
  if (pos === "tr") { s.top = -1; s.right = -1; s.borderLeft = 0; s.borderBottom = 0; }
  if (pos === "bl") { s.bottom = -1; s.left = -1; s.borderRight = 0; s.borderTop = 0; }
  if (pos === "br") { s.bottom = -1; s.right = -1; s.borderLeft = 0; s.borderTop = 0; }
  return <div style={s} />;
}

function Section({ num, total, title, sub, children, isLast }: { num: string; total: string; title: string; sub: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 220px) 1fr",
        gap: 60,
        padding: "38px 0",
        borderBottom: isLast ? "none" : "1px solid rgba(242,241,250,0.08)",
      }}
      className="spike-section"
    >
      <div style={{ position: "sticky", top: 120, alignSelf: "start" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 200,
            fontSize: 72,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            backgroundImage: `linear-gradient(180deg, ${LAV} 0%, rgba(139,92,246,0.35) 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 0 20px rgba(139,92,246,0.25))`,
            marginBottom: 6,
          }}
        >
          {num}
          <span style={{ fontStyle: "normal", fontSize: 14, color: "rgba(242,241,250,0.38)", letterSpacing: "0.1em", marginLeft: 6, verticalAlign: 22, WebkitBackgroundClip: "initial", WebkitTextFillColor: "rgba(242,241,250,0.38)" }}>
            /{total}
          </span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: INK, marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 14, lineHeight: 1.5, color: "rgba(242,241,250,0.58)", maxWidth: "22ch" }}>
          {sub}
        </div>
        <div style={{ width: 28, height: 1, background: `linear-gradient(90deg, ${LAV}, transparent)`, marginTop: 16 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
        {children}
      </div>
      <style>{`
        @media (max-width: 760px) {
          .spike-section {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .spike-section > div:first-child {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(242,241,250,0.58)" }}>
          {label}
          {required && <span style={{ color: LAV, marginLeft: 6 }}>*</span>}
        </span>
        {hint && (
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 12.5, color: "rgba(242,241,250,0.38)" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INPUT STYLES
   ═══════════════════════════════════════════════════════════════ */

function inpStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(255,255,255,0.018)",
    border: "1px solid rgba(242,241,250,0.09)",
    borderRadius: 3,
    color: INK,
    padding: "14px 18px",
    fontFamily: SERIF,
    fontWeight: 300,
    fontSize: 18,
    letterSpacing: "-0.01em",
    outline: "none",
    transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
  };
}

function taStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(255,255,255,0.018)",
    border: "1px solid rgba(242,241,250,0.09)",
    borderRadius: 3,
    color: INK,
    padding: "14px 18px",
    fontFamily: SANS,
    fontWeight: 400,
    fontSize: 15,
    lineHeight: 1.6,
    outline: "none",
    transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
    minHeight: 110,
    resize: "vertical",
  };
}

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  const el = e.target as HTMLElement;
  el.style.borderColor = "rgba(196,181,253,0.55)";
  el.style.background = "rgba(196,181,253,0.045)";
  el.style.boxShadow = "0 0 0 4px rgba(139,92,246,0.1), 0 0 40px rgba(139,92,246,0.18)";
}

function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  const el = e.target as HTMLElement;
  el.style.borderColor = "rgba(242,241,250,0.09)";
  el.style.background = "rgba(255,255,255,0.018)";
  el.style.boxShadow = "none";
}

function chipStyle(on: boolean): React.CSSProperties {
  return {
    padding: "10px 16px",
    background: on
      ? `linear-gradient(135deg, rgba(196,181,253,0.18), rgba(139,92,246,0.1))`
      : "rgba(255,255,255,0.015)",
    border: `1px solid ${on ? "rgba(196,181,253,0.55)" : "rgba(242,241,250,0.1)"}`,
    borderRadius: 100,
    color: on ? INK : "rgba(242,241,250,0.58)",
    fontFamily: SANS,
    fontWeight: on ? 500 : 400,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    transition: "all 0.18s ease",
    boxShadow: on ? "0 0 24px rgba(139,92,246,0.2)" : "none",
  };
}

function toolStyle(on: boolean): React.CSSProperties {
  return {
    padding: "12px 14px",
    background: on
      ? `linear-gradient(135deg, rgba(196,181,253,0.1), rgba(139,92,246,0.05))`
      : "rgba(255,255,255,0.015)",
    border: `1px solid ${on ? "rgba(196,181,253,0.35)" : "rgba(242,241,250,0.08)"}`,
    borderRadius: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.18s ease",
  };
}
