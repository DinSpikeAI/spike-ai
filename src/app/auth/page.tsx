"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle,
  Sparkles, Wand2, CheckCircle, Film, Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   SPIKE AI — PREMIUM AUTH EXPERIENCE
   Cinematic · Glassmorphism · Netflix/Apple/Disney+ hybrid
   ═══════════════════════════════════════════════════════════════ */

type AuthMode = "signin" | "signup" | "magic";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/");
    });
  }, [router]);

  // Smooth mode transition
  const switchMode = (newMode: AuthMode) => {
    setTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setError(null);
      setMagicSent(false);
      setSignupDone(false);
      setTransitioning(false);
    }, 200);
  };

  const handleAuth = async () => {
    if (!supabase) { setError("Database not connected"); return; }
    if (!email) { setError("Please enter your email address"); return; }
    if (mode !== "magic" && !password) { setError("Please enter your password"); return; }
    if (mode === "signup" && password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    setError(null);

    try {
      if (mode === "magic") {
        const { error: e } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (e) throw e;
        setMagicSent(true);
      } else if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (e) throw e;
        setSignupDone(true);
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

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">

      {/* ── Cinematic Background (HBO/Disney+ Style) ── */}
      <div className="fixed inset-0">
        {/* Hero Image — blurred cinematic */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://picsum.photos/seed/spike-cinema/1920/1080)`,
            filter: "blur(2px) brightness(0.25) saturate(1.3)",
            transform: "scale(1.05)",
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Red atmospheric glow */}
        <div className="absolute top-[-15%] left-[20%] w-[700px] h-[700px] rounded-full bg-white/[0.06] blur-[200px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-900/[0.04] blur-[180px] pointer-events-none" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none" />

        {/* Edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Film grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-20 px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
          <span className="text-[20px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>
        </div>

        {/* Top-right subtle CTA */}
        <div className="hidden sm:flex items-center gap-2 text-[13px] text-white/30">
          <Film size={14} className="text-[#ffffff]/50" />
          <span className="font-light tracking-wide">The future of cinema starts here</span>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="flex-1 flex items-center justify-center px-5 pb-12 md:pb-20 relative z-20">
        <div
          ref={cardRef}
          className={`w-full max-w-[460px] transition-all duration-300 ${transitioning ? "opacity-0 scale-[0.97] translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}
        >

          {/* ═════ Glassmorphism Card ═════ */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(229,9,20,0.03), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Card glass background */}
            <div className="absolute inset-0 bg-[#0a0a0c]/75 backdrop-blur-2xl" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl pointer-events-none" />

            {/* Card content */}
            <div className="relative z-10 p-8 md:p-10">

              {/* ═════ Magic Link Sent ═════ */}
              {magicSent ? (
                <div className="text-center py-6" style={{ animation: "authFadeIn 0.5s ease" }}>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ffffff]/20 to-[#ffffff]/5 border border-[#ffffff]/15 flex items-center justify-center mx-auto mb-6 rotate-3">
                    <Mail size={32} className="text-[#ffffff] -rotate-3" />
                  </div>
                  <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Check Your Inbox</h1>
                  <p className="text-white/40 text-sm mb-1">We sent a magic link to</p>
                  <p className="text-white font-semibold text-base mb-8">{email}</p>
                  <p className="text-white/20 text-xs leading-relaxed max-w-xs mx-auto mb-8">Click the link in the email to sign in instantly.<br />No password needed.</p>
                  <button onClick={() => switchMode("signin")} className="text-[#ffffff] text-sm font-semibold hover:text-[#ff1a25] transition-colors tracking-wide">
                    ← Back to Sign In
                  </button>
                </div>

              /* ═════ Signup Done ═════ */
              ) : signupDone ? (
                <div className="text-center py-6" style={{ animation: "authFadeIn 0.5s ease" }}>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/15 flex items-center justify-center mx-auto mb-6 -rotate-3">
                    <CheckCircle size={32} className="text-green-400 rotate-3" />
                  </div>
                  <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Welcome to the Club</h1>
                  <p className="text-white/40 text-sm mb-1">Confirmation sent to</p>
                  <p className="text-white font-semibold text-base mb-8">{email}</p>
                  <p className="text-white/20 text-xs leading-relaxed max-w-xs mx-auto mb-8">Click the link in your email to activate your account, then come back and sign in.</p>
                  <button onClick={() => switchMode("signin")} className="px-8 py-3 bg-white text-white font-bold text-sm rounded-xl hover:bg-[#f6121d] transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#ffffff]/20">
                    Back to Sign In
                  </button>
                </div>

              /* ═════ Main Form ═════ */
              ) : (
                <div style={{ animation: "authFadeIn 0.4s ease" }}>
                  {/* Title */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffffff] to-[#b00710] flex items-center justify-center shadow-lg shadow-[#ffffff]/20">
                        {mode === "magic" ? <Wand2 size={15} className="text-white" /> : mode === "signup" ? <Sparkles size={15} className="text-white" /> : <Zap size={15} className="text-white" />}
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-[1.75rem] font-black text-white tracking-tight leading-none">
                          {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Magic Link"}
                        </h1>
                      </div>
                    </div>
                    <p className="text-white/30 text-[13px] leading-relaxed pl-[42px]">
                      {mode === "signin"
                        ? "Welcome back to the AI cinema experience."
                        : mode === "signup"
                          ? "Join thousands of AI film enthusiasts."
                          : "We'll send you a link. No password needed."}
                    </p>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    {/* Email */}
                    <div className="relative group">
                      <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                        focusedField === "email" || email
                          ? "top-2 text-[9px] font-bold tracking-[0.15em] uppercase text-[#ffffff]/70"
                          : "top-1/2 -translate-y-1/2 text-sm text-white/20"
                      }`}>
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(null); }}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                          className={`w-full pt-6 pb-3 px-4 bg-white/[0.04] rounded-xl text-white text-[15px] font-light outline-none transition-all duration-300 border ${
                            focusedField === "email"
                              ? "border-[#ffffff]/50 bg-white/[0.06] shadow-[0_0_20px_rgba(229,9,20,0.08)]"
                              : "border-white/[0.06] hover:border-white/[0.1]"
                          }`}
                        />
                        <Mail size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === "email" ? "text-[#ffffff]/50" : "text-white/10"}`} />
                      </div>
                    </div>

                    {/* Password */}
                    {mode !== "magic" && (
                      <div className="relative group" style={{ animation: "authSlideDown 0.3s ease" }}>
                        <label className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
                          focusedField === "password" || password
                            ? "top-2 text-[9px] font-bold tracking-[0.15em] uppercase text-[#ffffff]/70"
                            : "top-1/2 -translate-y-1/2 text-sm text-white/20"
                        }`}>
                          {mode === "signup" ? "Create Password" : "Password"}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(null); }}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => setFocusedField(null)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                            className={`w-full pt-6 pb-3 px-4 pr-12 bg-white/[0.04] rounded-xl text-white text-[15px] font-light outline-none transition-all duration-300 border ${
                              focusedField === "password"
                                ? "border-[#ffffff]/50 bg-white/[0.06] shadow-[0_0_20px_rgba(229,9,20,0.08)]"
                                : "border-white/[0.06] hover:border-white/[0.1]"
                            }`}
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {mode === "signup" && (
                          <p className="text-[10px] text-white/15 mt-1.5 pl-1 tracking-wide">Minimum 6 characters</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2.5 mt-5 p-4 bg-red-500/[0.06] border border-red-500/10 rounded-xl" style={{ animation: "authShake 0.4s ease" }}>
                      <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] text-red-300/80 leading-relaxed">{error}</p>
                    </div>
                  )}

                  {/* ═════ Hero Button (Netflix + Apple gloss) ═════ */}
                  <button
                    onClick={handleAuth}
                    disabled={loading}
                    className="auth-hero-btn w-full mt-7 py-4 text-white font-bold text-[15px] tracking-wide rounded-xl flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : mode === "magic" ? (
                      <><Wand2 size={16} /> Send Magic Link</>
                    ) : mode === "signup" ? (
                      <><Sparkles size={16} /> Create Account</>
                    ) : (
                      <>Sign In <ArrowRight size={16} /></>
                    )}
                  </button>

                  {/* ═════ Magic Link Toggle (Glass secondary button) ═════ */}
                  <button
                    onClick={() => switchMode(mode === "magic" ? "signin" : "magic")}
                    className="w-full mt-3 py-3.5 text-[13px] text-white/30 hover:text-white/70 font-medium rounded-xl border border-white/[0.04] hover:border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {mode === "magic" ? (
                      <><Lock size={13} /> Use Password Instead</>
                    ) : (
                      <><Wand2 size={13} /> Sign in with Magic Link</>
                    )}
                  </button>

                  {/* ═════ Divider ═════ */}
                  <div className="flex items-center gap-4 my-7">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </div>

                  {/* ═════ Mode Toggle ═════ */}
                  <p className="text-center text-[14px] text-white/25">
                    {mode === "signup" ? (
                      <>Already a member?{" "}
                        <button onClick={() => switchMode("signin")} className="text-white font-semibold hover:text-[#ffffff] transition-colors duration-200">
                          Sign In
                        </button>
                      </>
                    ) : (
                      <>New to Spike AI?{" "}
                        <button onClick={() => switchMode("signup")} className="text-white font-semibold hover:text-[#ffffff] transition-colors duration-200">
                          Join Now
                        </button>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═════ Terms (Below card) ═════ */}
          <p className="text-center mt-6 text-[10px] text-white/[0.12] leading-relaxed tracking-wider">
            By continuing, you agree to Spike AI&apos;s Terms of Service & Privacy Policy
          </p>
        </div>
      </div>

      {/* ═════ Inline Styles for Animations ═════ */}
      <style jsx>{`
        .auth-hero-btn {
          background: linear-gradient(180deg, #ffffff 0%, #b00710 100%);
          box-shadow:
            0 4px 15px rgba(229, 9, 20, 0.3),
            0 1px 0 rgba(255,255,255,0.1) inset,
            0 -1px 0 rgba(0,0,0,0.2) inset;
        }
        .auth-hero-btn:hover:not(:disabled) {
          background: linear-gradient(180deg, #f6121d 0%, #c4080f 100%);
          box-shadow:
            0 8px 30px rgba(229, 9, 20, 0.4),
            0 1px 0 rgba(255,255,255,0.15) inset,
            0 -1px 0 rgba(0,0,0,0.2) inset;
        }

        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authSlideDown {
          from { opacity: 0; transform: translateY(-8px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 200px; }
        }
        @keyframes authShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
