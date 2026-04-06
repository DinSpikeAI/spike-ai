"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle,
  Wand2, CheckCircle, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Nav */}
      <nav className="px-6 md:px-12 py-6 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="text-white/30 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <span className="text-[20px] font-semibold tracking-[0.18em] text-white cursor-pointer" onClick={() => router.push("/")}>
          spike AI
        </span>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className={`w-full max-w-[420px] transition-all duration-300 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>

          {magicSent ? (
            <div className="text-center" style={{ animation: "fadeUp 0.5s ease" }}>
              <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-8">
                <Mail size={32} className="text-white/40" />
              </div>
              <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">Check your inbox</h1>
              <p className="text-[15px] text-white/30 mb-1">We sent a magic link to</p>
              <p className="text-[15px] text-white font-medium mb-10">{email}</p>
              <p className="text-[13px] text-white/20 leading-relaxed max-w-xs mx-auto mb-10">Click the link in the email to sign in instantly. No password needed.</p>
              <button onClick={() => switchMode("signin")} className="text-white/40 text-[14px] font-medium hover:text-white transition-colors cursor-pointer">← Back to sign in</button>
            </div>
          ) : signupDone ? (
            <div className="text-center" style={{ animation: "fadeUp 0.5s ease" }}>
              <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-8">
                <CheckCircle size={32} className="text-green-400/60" />
              </div>
              <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">You&apos;re in</h1>
              <p className="text-[15px] text-white/30 mb-1">Confirmation sent to</p>
              <p className="text-[15px] text-white font-medium mb-10">{email}</p>
              <p className="text-[13px] text-white/20 leading-relaxed max-w-xs mx-auto mb-10">Click the link in your email to activate your account, then come back and sign in.</p>
              <button onClick={() => switchMode("signin")} className="px-8 py-3.5 bg-white text-black text-[14px] font-semibold rounded-full hover:bg-white/90 transition-all cursor-pointer">
                Back to Sign In
              </button>
            </div>
          ) : (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div className="mb-10">
                <h1 className="text-4xl font-semibold text-white tracking-tight mb-3">
                  {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Magic link"}
                </h1>
                <p className="text-[16px] text-white/30 leading-relaxed">
                  {mode === "signin" ? "Sign in to your spike AI account." : mode === "signup" ? "Join the future of AI cinema." : "We'll send you a link — no password needed."}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium tracking-widest text-white/25 uppercase mb-2.5">Email</label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }} placeholder="you@email.com"
                    className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-[16px] text-white placeholder-white/15 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all" />
                </div>
                {mode !== "magic" && (
                  <div>
                    <label className="block text-[11px] font-medium tracking-widest text-white/25 uppercase mb-2.5">{mode === "signup" ? "Create password" : "Password"}</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }} placeholder="••••••••"
                        className="w-full px-5 py-4 pr-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-[16px] text-white placeholder-white/15 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all" />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors cursor-pointer" tabIndex={-1}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {mode === "signup" && <p className="text-[11px] text-white/15 mt-2 tracking-wide">Minimum 6 characters</p>}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-3 mt-5 p-4 bg-red-500/[0.06] border border-red-500/10 rounded-2xl">
                  <AlertCircle size={16} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-300/70 leading-relaxed">{error}</p>
                </div>
              )}

              <button onClick={handleAuth} disabled={loading}
                className="w-full mt-8 py-4 bg-white text-black text-[15px] font-semibold tracking-wide rounded-full flex items-center justify-center gap-2.5 disabled:opacity-40 hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer">
                {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "magic" ? <>Send Magic Link</> : mode === "signup" ? <>Create Account</> : <>Sign In <ArrowRight size={16} /></>}
              </button>

              <button onClick={() => switchMode(mode === "magic" ? "signin" : "magic")}
                className="w-full mt-3 py-3.5 text-[13px] text-white/25 hover:text-white/50 font-medium rounded-full border border-white/[0.04] hover:border-white/[0.08] transition-all flex items-center justify-center gap-2 cursor-pointer">
                {mode === "magic" ? <><Lock size={13} /> Use password instead</> : <><Wand2 size={13} /> Sign in with magic link</>}
              </button>

              <div className="flex items-center gap-4 my-8"><div className="flex-1 h-px bg-white/[0.04]" /></div>

              <p className="text-center text-[14px] text-white/20">
                {mode === "signup" ? (<>Already have an account?{" "}<button onClick={() => switchMode("signin")} className="text-white font-medium hover:text-white/80 transition-colors cursor-pointer">Sign in</button></>) : (<>Don&apos;t have an account?{" "}<button onClick={() => switchMode("signup")} className="text-white font-medium hover:text-white/80 transition-colors cursor-pointer">Create one</button></>)}
              </p>
            </div>
          )}

          <p className="text-center mt-10 text-[11px] text-white/[0.1] leading-relaxed tracking-wider">By continuing, you agree to spike AI&apos;s Terms of Service & Privacy Policy</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
