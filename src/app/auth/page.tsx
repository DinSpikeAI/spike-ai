"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle,
  Wand2, CheckCircle, ArrowLeft, Sparkles, User, Check,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type View = "signin" | "signup" | "magic" | "magic-sent" | "signup-done" | "setup-profile";

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

/* Google "G" SVG icon */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) router.push("/"); });
  }, [router]);

  const switchView = (v: View) => {
    setTransitioning(true);
    setTimeout(() => { setView(v); setError(null); setTransitioning(false); }, 250);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    if (view === "signup" && !termsAccepted) { setError("Please accept the Terms of Service to create an account"); return; }
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
      setError(err.message || "Google sign-in failed. Make sure Google provider is enabled in Supabase Dashboard → Authentication → Providers.");
      setGoogleLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!supabase) { setError("Database not connected"); return; }
    if (!email) { setError("Please enter your email"); return; }
    if (view !== "magic" && !password) { setError("Please enter your password"); return; }
    if (view === "signup" && password.length < 6) { setError("Min 6 characters"); return; }
    if (view === "signup" && !termsAccepted) { setError("Please accept the Terms of Service to create an account"); return; }
    setLoading(true); setError(null);
    try {
      if (view === "magic") {
        const { error: e } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (e) throw e; switchView("magic-sent");
      } else if (view === "signup") {
        const { data, error: e } = await supabase.auth.signUp({ email, password, options: { data: { display_name: email.split("@")[0] }, emailRedirectTo: `${window.location.origin}/` } });
        if (e) throw e; setDisplayName(email.split("@")[0]); setNewUser(data.user); switchView("signup-done");
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e; router.push("/");
      }
    } catch (err: any) { setError(err.message || "Something went wrong"); }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!supabase) return;
    setSavingProfile(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || newUser?.id;
    if (userId) {
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || "U")}&backgroundColor=1a1a2e&textColor=ffffff&fontSize=42`;
      await supabase.from("profiles").upsert({ id: userId, display_name: displayName.trim() || email.split("@")[0], avatar_url: avatarUrl, email }, { onConflict: "id" });
      await supabase.auth.updateUser({ data: { display_name: displayName.trim() || email.split("@")[0], avatar_url: avatarUrl } });
    }
    setSavingProfile(false);
    router.push("/");
  };

  const selAv = AVATARS.find(a => a.id === selectedAvatar);

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">

      {/* ═══ Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.3) 30%, transparent 70%)", animation: "glow 12s ease-in-out infinite" }} />
        <div className="absolute bottom-[5%] left-[35%] w-[500px] h-[300px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.5) 0%, transparent 70%)", animation: "glow 20s ease-in-out infinite reverse" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ═══ Nav ═══ */}
      <nav className={`relative z-20 px-8 py-7 transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-[900px] mx-auto flex items-center gap-5">
          <button onClick={() => view === "setup-profile" ? switchView("signup-done") : router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/spike-icon-512.png" alt="Spike AI" width={28} height={28} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-[0.25em] text-white/25 uppercase">spike AI</span>
          </div>
        </div>
      </nav>

      {/* ═══ Main — CENTERED ═══ */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20 relative z-20">
        <div className={`w-full max-w-[440px] text-center transition-all duration-500 ${transitioning ? "opacity-0 scale-[0.96]" : "opacity-100 scale-100"}`}>

          {/* ═══ MAGIC SENT ═══ */}
          {view === "magic-sent" && (
            <div style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="relative inline-block mb-12">
                <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-400/10 flex items-center justify-center backdrop-blur-sm">
                  <Mail size={40} className="text-blue-300/50" />
                </div>
                <div className="absolute -inset-6 rounded-[40px] bg-blue-500/[0.04] blur-2xl -z-10" />
              </div>
              <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">Check your inbox</h1>
              <p className="text-[16px] text-white/25 mb-2">We sent a magic link to</p>
              <p className="text-[18px] text-white/70 font-medium mb-14">{email}</p>
              <p className="text-[14px] text-white/15 leading-[1.9] max-w-xs mx-auto mb-14">Click the link in your email to sign in. No password needed.</p>
              <button onClick={() => switchView("signin")} className="text-white/20 text-[14px] hover:text-white/40 transition-colors cursor-pointer">← Back to sign in</button>
            </div>
          )}

          {/* ═══ SIGNUP DONE ═══ */}
          {view === "signup-done" && (
            <div style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="relative inline-block mb-12">
                <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-400/10 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle size={40} className="text-emerald-300/50" />
                </div>
                <div className="absolute -inset-6 rounded-[40px] bg-emerald-500/[0.04] blur-2xl -z-10" />
              </div>
              <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">You&apos;re in</h1>
              <p className="text-[16px] text-white/25 mb-2">Confirmation sent to</p>
              <p className="text-[18px] text-white/70 font-medium mb-14">{email}</p>
              <div className="flex flex-col items-center gap-4">
                <button onClick={() => switchView("setup-profile")} className="cta-btn px-12 py-[17px] text-black text-[15px] font-bold rounded-full flex items-center gap-3 cursor-pointer">Set Up Profile <ArrowRight size={17} /></button>
                <button onClick={() => switchView("signin")} className="text-white/15 text-[13px] hover:text-white/30 transition-colors cursor-pointer">Skip for now</button>
              </div>
            </div>
          )}

          {/* ═══ PROFILE SETUP ═══ */}
          {view === "setup-profile" && (
            <div style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }} className="max-w-[520px] mx-auto">
              <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-3">Who&apos;s watching?</h1>
              <p className="text-[17px] text-white/20 mb-14">Pick your avatar and name.</p>
              <div className="flex justify-center mb-12">
                <div className="relative">
                  <div className={`w-32 h-32 rounded-[30px] flex items-center justify-center text-5xl transition-all duration-500 border-2 shadow-2xl ${selectedAvatar ? `border-white/20 bg-gradient-to-br ${selAv?.gradient}` : "border-white/[0.06] bg-white/[0.04]"}`}>
                    {selAv ? <span style={{ animation: "pop 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>{selAv.emoji}</span> : <User size={44} className="text-white/12" />}
                  </div>
                  {selectedAvatar && <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-lg"><Check size={15} className="text-black" strokeWidth={3} /></div>}
                  {selAv && <div className={`absolute -inset-8 rounded-[46px] blur-3xl -z-10 opacity-25 bg-gradient-to-br ${selAv.gradient}`} />}
                </div>
              </div>
              <p className="text-[11px] font-bold tracking-[0.3em] text-white/12 uppercase mb-5">Choose Avatar</p>
              <div className="grid grid-cols-6 gap-2.5 max-w-[340px] mx-auto mb-12">
                {AVATARS.map((av) => (
                  <button key={av.id} onClick={() => setSelectedAvatar(av.id)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all duration-300 bg-gradient-to-br ${av.gradient} ${selectedAvatar === av.id ? "ring-2 ring-white/40 scale-110 shadow-lg" : "opacity-60 hover:opacity-100 hover:scale-110"}`}>
                    {av.emoji}
                  </button>
                ))}
              </div>
              <div className="max-w-[340px] mx-auto mb-12">
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name"
                  className="w-full px-6 py-[17px] bg-white/[0.04] border border-white/[0.08] rounded-2xl text-[17px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all text-center tracking-wide" />
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="cta-btn px-14 py-[17px] text-black text-[16px] font-bold rounded-full inline-flex items-center gap-3 disabled:opacity-30 cursor-pointer">
                {savingProfile ? <Loader2 size={19} className="animate-spin text-black/40" /> : <>Let&apos;s Go <ArrowRight size={17} strokeWidth={2.5} /></>}
              </button>
            </div>
          )}

          {/* ═══ SIGN IN / SIGN UP / MAGIC ═══ */}
          {(view === "signin" || view === "signup" || view === "magic") && (
            <div style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>

              {/* Spike AI Logo */}
              <div className="inline-block mb-8">
                <Image
                  src="/spike-icon-512.png"
                  alt="Spike AI"
                  width={64}
                  height={64}
                  className="rounded-2xl"
                />
              </div>

              {/* Title — WHITE */}
              <h1 className="text-[50px] md:text-[62px] font-bold tracking-[-0.03em] leading-[1.06] text-white mb-4"
                style={{ textShadow: "0 0 80px rgba(139, 92, 246, 0.12)" }}>
                {view === "signin" ? <>Welcome{"\n"}back.</> : view === "signup" ? <>Create{"\n"}account.</> : <>Magic{"\n"}link.</>}
              </h1>
              <p className="text-[17px] text-white/25 mb-12">
                {view === "signin" ? "Sign in to continue to spike AI." : view === "signup" ? "Join the future of AI cinema." : "We'll email you a sign-in link."}
              </p>

              {/* ═══ Form Card — Glassmorphic ═══ */}
              <div className="max-w-[380px] mx-auto">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-7 shadow-[0_0_60px_rgba(0,0,0,0.3)]">

                  {/* ── Google Button (Primary) ── */}
                  {view !== "magic" && (
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className={`
                        google-btn w-full py-[15px] px-5 rounded-xl text-[15px] font-medium
                        flex items-center justify-center gap-3
                        bg-white/[0.05] border border-white/[0.1]
                        text-white/80 hover:text-white
                        hover:bg-white/[0.08] hover:border-white/[0.16]
                        transition-all duration-300 cursor-pointer
                        active:scale-[0.98]
                        ${googleLoading ? "google-pulse" : ""}
                      `}
                    >
                      {googleLoading ? (
                        <span className="flex items-center gap-3">
                          <GoogleIcon className="w-5 h-5" />
                          <span className="text-white/40">Connecting...</span>
                        </span>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5" />
                          Continue with Google
                        </>
                      )}
                    </button>
                  )}

                  {/* ── OR Divider ── */}
                  {view !== "magic" && (
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[10px] text-white/15 uppercase tracking-[0.2em]">or</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                  )}

                  <div className="space-y-5 text-left">
                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[0.2em] text-white/30 uppercase mb-2.5 ml-1">Email</label>
                      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                        placeholder="you@email.com"
                        className="w-full px-5 py-[15px] bg-white/[0.03] border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all" />
                    </div>

                    {/* Password */}
                    {view !== "magic" && (
                      <div style={{ animation: "slideIn 0.3s ease" }}>
                        <label className="block text-[11px] font-semibold tracking-[0.2em] text-white/30 uppercase mb-2.5 ml-1">{view === "signup" ? "Create Password" : "Password"}</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                            placeholder="••••••••"
                            className="w-full px-5 py-[15px] pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all" />
                          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/12 hover:text-white/30 transition-colors cursor-pointer" tabIndex={-1}>
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                        {view === "signup" && <p className="text-[11px] text-white/12 mt-2 ml-1">Minimum 6 characters</p>}
                      </div>
                    )}

                    {/* Terms Checkbox — signup only */}
                    {view === "signup" && (
                      <label className="flex items-start gap-3 cursor-pointer group" style={{ animation: "slideIn 0.3s ease" }}>
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
                          className="mt-0.5 w-4 h-4 rounded accent-purple-500 cursor-pointer flex-shrink-0"
                        />
                        <span className="text-[11px] text-white/25 leading-[1.6] group-hover:text-white/35 transition-colors">
                          I agree to the{" "}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-purple-400/60 hover:text-purple-400/80 underline">Terms of Service</a>
                          {" "}and{" "}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400/60 hover:text-purple-400/80 underline">Privacy Policy</a>.
                          I confirm I am at least 18 years old.
                        </span>
                      </label>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="flex items-start gap-3 p-4 bg-red-500/[0.06] border border-red-500/[0.1] rounded-xl text-left" style={{ animation: "shake 0.4s ease" }}>
                        <AlertCircle size={15} className="text-red-400/60 flex-shrink-0 mt-0.5" />
                        <p className="text-[13px] text-red-300/60 leading-relaxed">{error}</p>
                      </div>
                    )}

                    {/* Email/Password CTA */}
                    <button onClick={handleAuth} disabled={loading}
                      className="cta-btn w-full mt-2 py-[16px] text-black text-[15px] font-bold tracking-wide rounded-full flex items-center justify-center gap-2.5 disabled:opacity-30 cursor-pointer active:scale-[0.97]">
                      {loading ? <Loader2 size={19} className="animate-spin text-black/40" />
                        : view === "magic" ? <>Send Link <Wand2 size={16} /></>
                        : view === "signup" ? <>Create Account <Sparkles size={16} /></>
                        : <>Sign In <ArrowRight size={17} strokeWidth={2.5} /></>}
                    </button>

                    {/* Terms note for sign-in */}
                    {view !== "signup" && (
                      <p className="text-[10px] text-white/10 text-center mt-3">
                        By continuing, you agree to our{" "}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/30 underline">Terms</a>
                        {" "}and{" "}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/30 underline">Privacy Policy</a>.
                      </p>
                    )}
                  </div>

                  {/* Divider before magic link */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[10px] text-white/15 uppercase tracking-[0.2em]">or</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  {/* Magic link / Password toggle */}
                  <button onClick={() => switchView(view === "magic" ? "signin" : "magic")}
                    className="w-full py-[14px] text-[14px] text-white/25 hover:text-white/45 font-medium rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                    {view === "magic" ? <><Lock size={14} /> Use password</> : <><Wand2 size={14} className="text-purple-400/60" /> Magic link</>}
                  </button>
                </div>

                {/* Toggle sign in / sign up */}
                <p className="text-center text-[14px] text-white/20 mt-8">
                  {view === "signup" ? (
                    <>Already have an account?{" "}
                      <button onClick={() => switchView("signin")} className="text-white/60 font-bold hover:text-white transition-colors cursor-pointer underline underline-offset-4 decoration-white/20 hover:decoration-white/40">
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>New to spike AI?{" "}
                      <button onClick={() => switchView("signup")} className="text-white/60 font-bold hover:text-white transition-colors cursor-pointer underline underline-offset-4 decoration-white/20 hover:decoration-white/40">
                        Create account
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {view !== "setup-profile" && (
            <p className="mt-14 text-[11px] text-white/[0.08] tracking-[0.1em]">By continuing you agree to spike AI&apos;s Terms & Privacy</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .cta-btn {
          background: linear-gradient(180deg, #ffffff 0%, #e8e8eb 100%);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.12),
            0 4px 24px rgba(255,255,255,0.08),
            0 0 80px rgba(139,92,246,0.06),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cta-btn:hover:not(:disabled) {
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.2),
            0 8px 40px rgba(255,255,255,0.12),
            0 0 100px rgba(139,92,246,0.1),
            inset 0 1px 0 rgba(255,255,255,1);
          transform: translateY(-2px);
        }
        .google-pulse {
          animation: googlePulse 1.5s ease-in-out infinite;
        }
        @keyframes googlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
          50% { box-shadow: 0 0 20px 2px rgba(255,255,255,0.06); }
        }
        @keyframes reveal { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pop { from { transform:scale(0.4); opacity:0 } to { transform:scale(1); opacity:1 } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
        @keyframes glow { 0%,100% { opacity:0.06; transform:translate(-50%,-50%) scale(1) } 50% { opacity:0.09; transform:translate(-50%,-50%) scale(1.1) } }
      `}</style>
    </div>
  );
}
