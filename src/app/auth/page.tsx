"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle,
  Wand2, CheckCircle, ArrowLeft, Zap, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   SPIKE AI — AUTH
   Ultra-refined · Luxury tech aesthetic
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
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/");
    });
  }, [router]);

  const switchMode = (newMode: AuthMode) => {
    setTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setError(null);
      setMagicSent(false);
      setSignupDone(false);
      setTransitioning(false);
    }, 250);
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
        const { error: e } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (e) throw e;
        setMagicSent(true);
      } else if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { display_name: email.split("@")[0] }, emailRedirectTo: `${window.location.origin}/` } });
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

  const modeConfig = {
    signin: { title: "Welcome\nback.", subtitle: "Sign in to continue to spike AI.", buttonText: "Continue", buttonIcon: <ArrowRight size={18} strokeWidth={2.5} /> },
    signup: { title: "Join the\nfuture.", subtitle: "Create your spike AI account.", buttonText: "Create Account", buttonIcon: <Sparkles size={18} /> },
    magic: { title: "Magic\nlink.", subtitle: "No password needed. We'll email you a link.", buttonText: "Send Link", buttonIcon: <Wand2 size={18} /> },
  };

  const cfg = modeConfig[mode];

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)", animation: "authFloat 20s ease-in-out infinite" }} />
        <div className="absolute bottom-[-30%] left-[-15%] w-[900px] h-[900px] rounded-full opacity-[0.02]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)", animation: "authFloat 25s ease-in-out infinite reverse" }} />
        <div className="absolute top-[30%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.015]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)", animation: "authFloat 15s ease-in-out infinite" }} />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ── Nav ── */}
      <nav className={`relative z-20 px-8 md:px-16 py-8 flex items-center justify-between transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-5">
          <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center text-white/20 hover:text-white hover:border-white/[0.15] transition-all cursor-pointer backdrop-blur-sm">
            <ArrowLeft size={16} />
          </button>
          <div className="h-5 w-px bg-white/[0.06]" />
          <span className="text-[18px] font-semibold tracking-[0.2em] text-white/40 cursor-pointer hover:text-white/60 transition-colors" onClick={() => router.push("/")}>
            spike AI
          </span>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16 relative z-20">
        <div className={`w-full max-w-[520px] transition-all duration-500 ${transitioning ? "opacity-0 scale-[0.97] translate-y-3" : "opacity-100 scale-100 translate-y-0"} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: mounted ? "200ms" : "0ms" }}>

          {/* ═══ Success States ═══ */}
          {(magicSent || signupDone) ? (
            <div className="text-center" style={{ animation: "authReveal 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="relative inline-block mb-10">
                <div className="w-28 h-28 rounded-[28px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center backdrop-blur-xl">
                  {magicSent ? <Mail size={40} className="text-white/30" /> : <CheckCircle size={40} className="text-emerald-400/50" />}
                </div>
                <div className="absolute -inset-4 rounded-[36px] bg-white/[0.02] blur-xl -z-10" />
              </div>
              <h1 className="text-[40px] md:text-[48px] font-semibold text-white tracking-tight leading-[1.1] mb-4">
                {magicSent ? "Check your\ninbox." : "You're in."}
              </h1>
              <p className="text-[16px] text-white/25 mb-2">
                {magicSent ? "We sent a magic link to" : "Confirmation sent to"}
              </p>
              <p className="text-[17px] text-white/70 font-medium mb-12 tracking-wide">{email}</p>
              <p className="text-[14px] text-white/15 leading-[1.8] max-w-sm mx-auto mb-14">
                {magicSent
                  ? "Click the link in your email to sign in instantly. No password needed — just pure magic."
                  : "Click the link in your email to activate your account, then come back and sign in."}
              </p>
              <button onClick={() => switchMode("signin")}
                className="text-white/25 text-[14px] font-medium hover:text-white/50 transition-colors cursor-pointer tracking-wide">
                ← Back to sign in
              </button>
            </div>

          /* ═══ Main Form ═══ */
          ) : (
            <div style={{ animation: "authReveal 0.6s cubic-bezier(0.16,1,0.3,1)" }}>

              {/* Hero Title */}
              <div className="mb-14">
                <h1 className="text-[52px] md:text-[64px] font-semibold text-white tracking-tight leading-[1.05] mb-5 whitespace-pre-line">
                  {cfg.title}
                </h1>
                <p className="text-[18px] md:text-[20px] text-white/25 tracking-wide leading-relaxed">
                  {cfg.subtitle}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-5">
                {/* Email Field */}
                <div className="group">
                  <label className="block text-[11px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3 ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                      placeholder="you@email.com"
                      className="w-full px-6 py-[18px] bg-white/[0.03] border border-white/[0.06] rounded-2xl text-[17px] text-white placeholder-white/[0.1] focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all duration-300 tracking-wide"
                      style={{ caretColor: "rgba(255,255,255,0.5)" }}
                    />
                    <Mail size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/[0.06] group-focus-within:text-white/[0.15] transition-colors duration-300" />
                  </div>
                </div>

                {/* Password Field */}
                {mode !== "magic" && (
                  <div className="group" style={{ animation: "authSlide 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
                    <label className="block text-[11px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3 ml-1">
                      {mode === "signup" ? "Create Password" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                        placeholder="••••••••"
                        className="w-full px-6 py-[18px] pr-14 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-[17px] text-white placeholder-white/[0.1] focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all duration-300 tracking-[0.15em]"
                        style={{ caretColor: "rgba(255,255,255,0.5)" }}
                      />
                      <button onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/[0.08] hover:text-white/[0.25] transition-colors cursor-pointer" tabIndex={-1}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {mode === "signup" && (
                      <p className="text-[11px] text-white/[0.1] mt-3 ml-1 tracking-[0.1em]">Minimum 6 characters</p>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-4 mt-6 p-5 bg-red-500/[0.04] border border-red-500/[0.08] rounded-2xl" style={{ animation: "authShake 0.5s ease" }}>
                  <AlertCircle size={17} className="text-red-400/50 flex-shrink-0 mt-0.5" />
                  <p className="text-[14px] text-red-300/50 leading-relaxed tracking-wide">{error}</p>
                </div>
              )}

              {/* Primary Button */}
              <button
                onClick={handleAuth}
                disabled={loading}
                className="auth-primary-btn w-full mt-10 py-[18px] text-black text-[16px] font-semibold tracking-[0.05em] rounded-full flex items-center justify-center gap-3 disabled:opacity-30 transition-all duration-300 cursor-pointer active:scale-[0.97]"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin text-black/50" />
                ) : (
                  <>{cfg.buttonText} {cfg.buttonIcon}</>
                )}
              </button>

              {/* Secondary Button */}
              <button
                onClick={() => switchMode(mode === "magic" ? "signin" : "magic")}
                className="w-full mt-4 py-[16px] text-[14px] text-white/15 hover:text-white/35 font-medium rounded-full border border-white/[0.04] hover:border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.02] backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer tracking-wide"
              >
                {mode === "magic"
                  ? <><Lock size={14} /> Use password instead</>
                  : <><Wand2 size={14} /> Sign in with magic link</>
                }
              </button>

              {/* Divider */}
              <div className="flex items-center my-10">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
              </div>

              {/* Toggle */}
              <p className="text-center text-[15px] text-white/15 tracking-wide">
                {mode === "signup" ? (
                  <>Already have an account?{" "}
                    <button onClick={() => switchMode("signin")} className="text-white/50 font-semibold hover:text-white/70 transition-colors cursor-pointer">
                      Sign in
                    </button>
                  </>
                ) : (
                  <>New to spike AI?{" "}
                    <button onClick={() => switchMode("signup")} className="text-white/50 font-semibold hover:text-white/70 transition-colors cursor-pointer">
                      Create account
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Terms */}
          <p className="text-center mt-14 text-[11px] text-white/[0.06] leading-relaxed tracking-[0.15em]">
            By continuing, you agree to spike AI&apos;s Terms & Privacy Policy
          </p>
        </div>
      </div>

      {/* ═══ Styles ═══ */}
      <style jsx>{`
        .auth-primary-btn {
          background: linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.1),
            0 4px 20px rgba(255,255,255,0.06),
            0 1px 3px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .auth-primary-btn:hover:not(:disabled) {
          background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.15),
            0 8px 40px rgba(255,255,255,0.08),
            0 2px 6px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.9);
          transform: translateY(-1px);
        }

        @keyframes authReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes authShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          75% { transform: translateX(-2px); }
        }
      `}</style>
    </div>
  );
}
