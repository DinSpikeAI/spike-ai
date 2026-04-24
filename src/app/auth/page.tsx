"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type View = "signin" | "signup" | "magic" | "magic-sent" | "signup-done" | "setup-profile";

const GOLD = "#D4A857";
const ACCENT = "#C4B5FD";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, Monaco, monospace";
const SERIF = "'Fraunces', 'Instrument Serif', Georgia, serif";
const SANS = "'Inter Tight', system-ui, -apple-system, sans-serif";

const POSTER_IMAGE =
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1400&q=85";

const AVATARS = [
  { id: "a1", gradient: "from-violet-500 to-indigo-700", emoji: "🎬" },
  { id: "a2", gradient: "from-cyan-400 to-blue-600", emoji: "🚀" },
  { id: "a3", gradient: "from-rose-400 to-pink-600", emoji: "🎭" },
  { id: "a4", gradient: "from-amber-400 to-orange-600", emoji: "⚡" },
  { id: "a5", gradient: "from-emerald-400 to-teal-600", emoji: "🌊" },
  { id: "a6", gradient: "from-fuchsia-400 to-purple-600", emoji: "🔮" },
  { id: "a7", gradient: "from-red-400 to-rose-700", emoji: "🎯" },
  { id: "a8", gradient: "from-sky-300 to-indigo-500", emoji: "✨" },
  { id: "a9", gradient: "from-lime-400 to-green-600", emoji: "🌿" },
  { id: "a10", gradient: "from-orange-300 to-red-500", emoji: "🔥" },
  { id: "a11", gradient: "from-indigo-300 to-violet-600", emoji: "🎵" },
  { id: "a12", gradient: "from-teal-300 to-cyan-600", emoji: "💎" },
];

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        try {
          const returnTo = sessionStorage.getItem("returnTo");
          if (returnTo) {
            sessionStorage.removeItem("returnTo");
            window.location.replace(returnTo);
            return;
          }
        } catch {}
        router.push("/");
      }
    });
  }, [router]);

  const switchView = (v: View) => {
    setView(v);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    if (view === "signup" && !termsAccepted) {
      setError("Please accept the Terms of Service to create an account");
      return;
    }
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!supabase) {
      setError("Database not connected");
      return;
    }
    if (!email) {
      setError("Please enter your email");
      return;
    }
    if (view !== "magic" && !password) {
      setError("Please enter your password");
      return;
    }
    if (view === "signup" && password.length < 6) {
      setError("Min 6 characters");
      return;
    }
    if (view === "signup" && !termsAccepted) {
      setError("Please accept the Terms of Service to create an account");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (view === "magic") {
        const { error: e } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (e) throw e;
        switchView("magic-sent");
      } else if (view === "signup") {
        const seedName = fullName.trim() || email.split("@")[0];
        const { data, error: e } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: seedName },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (e) throw e;
        setDisplayName(seedName);
        setNewUser(data.user);
        switchView("signup-done");
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!supabase) return;
    setSavingProfile(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || newUser?.id;
    if (userId) {
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        displayName || "U"
      )}&backgroundColor=1a1a2e&textColor=ffffff&fontSize=42`;
      const finalName = displayName.trim() || email.split("@")[0];
      await supabase
        .from("profiles")
        .upsert(
          { id: userId, display_name: finalName, avatar_url: avatarUrl, email },
          { onConflict: "id" }
        );
      await supabase.auth.updateUser({
        data: { display_name: finalName, avatar_url: avatarUrl },
      });
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        if (s?.access_token) {
          await fetch("/api/new-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-supabase-auth": s.access_token,
            },
            body: JSON.stringify({ display_name: finalName, email, provider: "email" }),
          });
        }
      } catch {}
    }
    setSavingProfile(false);
    router.push("/");
  };

  const selAv = AVATARS.find((a) => a.id === selectedAvatar);

  // ═══════════════════════════════════════════════════════════════
  //   SIGNUP-DONE / MAGIC-SENT / SETUP-PROFILE — full-screen centered
  // ═══════════════════════════════════════════════════════════════

  if (view === "magic-sent" || view === "signup-done" || view === "setup-profile") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050610",
          color: "#FAFAFA",
          fontFamily: SANS,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />

        {/* Ambient aurora */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.35,
            background:
              "radial-gradient(ellipse 50% 40% at 30% 30%, rgba(99,102,241,0.3) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 70% 70%, rgba(196,181,253,0.22) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />

        <div style={{ maxWidth: 480, textAlign: "center", position: "relative", zIndex: 2 }}>
          {view === "magic-sent" && (
            <>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 22 }}>
                § Check your inbox
              </div>
              <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(44px, 5vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.025em", margin: "0 0 20px" }}>
                <em style={{ fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>Sent.</em>
              </h1>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 17, color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>
                We've sent a magic link to
              </p>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", margin: "0 0 40px", fontWeight: 500 }}>{email}</p>
              <button
                onClick={() => switchView("signin")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderBottom: `1px solid rgba(196,181,253,0.4)`,
                  paddingBottom: 4,
                }}
              >
                ← Back to sign in
              </button>
            </>
          )}

          {view === "signup-done" && (
            <>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 22 }}>
                § Welcome
              </div>
              <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(44px, 5vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.025em", margin: "0 0 20px" }}>
                You're <em style={{ fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>in.</em>
              </h1>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 17, color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>
                Confirmation sent to
              </p>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.88)", margin: "0 0 40px", fontWeight: 500 }}>{email}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
                <button
                  onClick={() => switchView("setup-profile")}
                  style={{
                    background: "#FAFAFA",
                    color: "#0A0A0C",
                    border: "none",
                    padding: "14px 32px",
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: 2,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  Set up profile
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300 }}>→</span>
                </button>
                <button
                  onClick={() => switchView("signin")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Skip for now
                </button>
              </div>
            </>
          )}

          {view === "setup-profile" && (
            <>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 22 }}>
                § Member profile
              </div>
              <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(44px, 5vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.025em", margin: "0 0 14px" }}>
                Who's <em style={{ fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>watching?</em>
              </h1>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 17, color: "rgba(255,255,255,0.55)", margin: "0 0 40px" }}>
                Pick your avatar and name.
              </p>

              <div style={{ marginBottom: 36, display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: selAv
                      ? `linear-gradient(135deg, ${ACCENT} 0%, ${GOLD} 100%)`
                      : "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 48,
                  }}
                >
                  {selAv ? selAv.emoji : "◯"}
                </div>
              </div>

              <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 18 }}>
                Choose avatar
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, maxWidth: 340, margin: "0 auto 36px" }}>
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`bg-gradient-to-br ${av.gradient}`}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      cursor: "pointer",
                      border: "none",
                      outline: selectedAvatar === av.id ? "2px solid rgba(255,255,255,0.6)" : "none",
                      outlineOffset: 2,
                      opacity: selectedAvatar === av.id ? 1 : 0.6,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>

              <div style={{ maxWidth: 340, margin: "0 auto 32px" }}>
                <label style={{ display: "block", fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textAlign: "left", marginBottom: 8 }}>
                  Your name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  style={{
                    width: "100%",
                    padding: "12px 4px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.2)",
                    color: "#FAFAFA",
                    fontFamily: SANS,
                    fontSize: 15,
                    outline: "none",
                    textAlign: "center",
                  }}
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                style={{
                  background: "#FAFAFA",
                  color: "#0A0A0C",
                  border: "none",
                  padding: "14px 36px",
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: savingProfile ? "default" : "pointer",
                  borderRadius: 2,
                  opacity: savingProfile ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {savingProfile ? "Saving…" : "Let's go"}
                {!savingProfile && <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300 }}>→</span>}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //   SIGNIN / SIGNUP / MAGIC — Split Poster layout
  // ═══════════════════════════════════════════════════════════════

  const titleNode =
    view === "signin" ? (
      <>
        Return<em style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>.</em>
      </>
    ) : view === "signup" ? (
      <>
        Join<em style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>.</em>
      </>
    ) : (
      <>
        Magic <em style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>link.</em>
      </>
    );

  const ledeText =
    view === "signin"
      ? "your seat has been held."
      : view === "signup"
      ? "an editorial home for generative cinema."
      : "we'll send you a one-time link.";

  const eyebrowText =
    view === "signin" ? "§ Member access" : view === "signup" ? "§ Create account" : "§ Passwordless";

  const submitLabel = view === "signin" ? "Sign in" : view === "signup" ? "Create account" : "Send link";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050610",
        color: "#FAFAFA",
        fontFamily: SANS,
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
      }}
      className="auth-grid"
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      />

      {/* ═══ LEFT: POSTER ═══ */}
      <div
        className="auth-poster"
        style={{
          position: "relative",
          backgroundImage: `linear-gradient(180deg, rgba(5,6,16,0.2), rgba(5,6,16,0.75)), url('${POSTER_IMAGE}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
          minHeight: 320,
        }}
      >
        {/* Purple tint in top-left corner */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 30% 30%, rgba(139,92,246,0.2), transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Top row: masthead + vol */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 48,
            right: 48,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <div
            onClick={() => router.push("/")}
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 22,
              letterSpacing: "-0.01em",
              color: "#FAFAFA",
              cursor: "pointer",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            spike
            <em style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: ACCENT, fontWeight: 400, marginLeft: 4 }}>Ai.</em>
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Vol · I · MMXXVI
          </div>
        </div>

        {/* Bottom: film credit */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 48,
            right: 48,
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              marginBottom: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ width: 6, height: 6, background: GOLD, borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
            Featured · This Week
          </div>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: "clamp(38px, 4vw, 58px)",
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              color: "#FAFAFA",
              maxWidth: "13ch",
              margin: "0 0 22px",
            }}
          >
            Express your{" "}
            <em style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: ACCENT, fontWeight: 400 }}>
              Art
            </em>
          </h2>
          <div
            className="auth-credits"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 24px",
            }}
          >
            <div>
              <strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, marginRight: 8 }}>New</strong>
              Directors Welcome
            </div>
            <div>
              <strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, marginRight: 8 }}>Tools</strong>
              Runway · Sora · Kling
            </div>
            <div>
              <strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, marginRight: 8 }}>Free</strong>
              Always
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: FORM ═══ */}
      <div
        className="auth-right"
        style={{
          padding: "72px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#050610",
          position: "relative",
        }}
      >
        {/* Top-right tabs */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 48,
            display: "inline-flex",
            gap: 2,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 3,
            borderRadius: 3,
          }}
        >
          {(["signin", "signup", "magic"] as const).map((v) => {
            const label = v === "signin" ? "Sign in" : v === "signup" ? "Create" : "Link";
            const active = view === v;
            return (
              <button
                key={v}
                onClick={() => switchView(v)}
                style={{
                  appearance: "none",
                  border: 0,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: active ? "#FAFAFA" : "rgba(255,255,255,0.4)",
                  padding: "7px 12px",
                  cursor: "pointer",
                  borderRadius: 2,
                  fontWeight: active ? 600 : 500,
                  transition: "color 0.2s ease, background 0.2s ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 18,
            }}
          >
            {eyebrowText}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: "clamp(44px, 4.2vw, 64px)",
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              margin: "0 0 14px",
              color: "#FAFAFA",
            }}
          >
            {titleNode}
          </h1>

          {/* Lede */}
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 34px",
              maxWidth: "32ch",
            }}
          >
            {ledeText}
          </p>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Google button */}
            {view !== "magic" && (
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "13px 16px",
                  background: "#FAFAFA",
                  color: "#111",
                  border: 0,
                  borderRadius: 2,
                  fontFamily: SANS,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: googleLoading ? "default" : "pointer",
                  opacity: googleLoading ? 0.6 : 1,
                  transition: "transform .15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!googleLoading) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <GoogleIcon size={16} />
                {googleLoading ? "Connecting…" : view === "signup" ? "Sign up with Google" : "Continue with Google"}
              </button>
            )}

            {/* Divider */}
            {view !== "magic" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  margin: "2px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                or
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>
            )}

            {/* Full Name — signup only */}
            {view === "signup" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 8,
                  }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Jane Doe"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "transparent",
                    border: 0,
                    borderBottom: "1px solid rgba(255,255,255,0.2)",
                    color: "#FAFAFA",
                    fontFamily: SANS,
                    fontSize: 15,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderBottomColor = "rgba(196,181,253,0.8)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.2)")}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAuth();
                }}
                placeholder="you@email.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "transparent",
                  border: 0,
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  color: "#FAFAFA",
                  fontFamily: SANS,
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => ((e.target as HTMLElement).style.borderBottomColor = "rgba(196,181,253,0.8)")}
                onBlur={(e) => ((e.target as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.2)")}
              />
            </div>

            {/* Password */}
            {view !== "magic" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 8,
                  }}
                >
                  {view === "signup" ? "Password · 8+ chars" : "Password"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAuth();
                    }}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 14px",
                      background: "transparent",
                      border: 0,
                      borderBottom: "1px solid rgba(255,255,255,0.2)",
                      color: "#FAFAFA",
                      fontFamily: SANS,
                      fontSize: 15,
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => ((e.target as HTMLElement).style.borderBottomColor = "rgba(196,181,253,0.8)")}
                    onBlur={(e) => ((e.target as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.2)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: 0,
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      padding: 8,
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {/* Terms checkbox — signup only */}
            {view === "signup" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    setError(null);
                  }}
                  style={{ marginTop: 3, width: 15, height: 15, accentColor: ACCENT, flexShrink: 0, cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "underline", textUnderlineOffset: 2 }}>
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "underline", textUnderlineOffset: 2 }}>
                    Privacy Policy
                  </a>
                  . I am at least 18.
                </span>
              </label>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "rgba(252,165,165,0.9)",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  borderRadius: 2,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleAuth}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "#FAFAFA",
                color: "#111",
                border: 0,
                borderRadius: 2,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.04em",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "transform .15s ease",
                marginTop: 6,
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {loading ? "…" : submitLabel}
              {!loading && (
                <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300 }}>→</span>
              )}
            </button>

            {/* Magic link toggle */}
            {view !== "magic" && (
              <button
                onClick={() => switchView("magic")}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  color: "#FAFAFA",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 2,
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                ✧ Send a magic link instead
              </button>
            )}

            {/* Foot line */}
            <div
              style={{
                marginTop: 10,
                fontSize: 12.5,
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
              }}
            >
              {view === "signin" ? (
                <>
                  New here?{" "}
                  <button
                    onClick={() => switchView("signup")}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "rgba(255,255,255,0.85)",
                      textDecoration: "none",
                      borderBottom: `1px solid rgba(196,181,253,0.4)`,
                      paddingBottom: 1,
                      cursor: "pointer",
                      fontSize: "inherit",
                      fontFamily: "inherit",
                    }}
                  >
                    Create an account →
                  </button>
                </>
              ) : view === "signup" ? (
                <>
                  Already a member?{" "}
                  <button
                    onClick={() => switchView("signin")}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "rgba(255,255,255,0.85)",
                      textDecoration: "none",
                      borderBottom: `1px solid rgba(196,181,253,0.4)`,
                      paddingBottom: 1,
                      cursor: "pointer",
                      fontSize: "inherit",
                      fontFamily: "inherit",
                    }}
                  >
                    Sign in →
                  </button>
                </>
              ) : (
                <button
                  onClick={() => switchView("signin")}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    fontSize: "inherit",
                    fontFamily: MONO,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                  }}
                >
                  ← Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 960px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-poster { min-height: 280px !important; }
          .auth-right { padding: 48px 28px !important; }
        }
      `}</style>
    </div>
  );
}
