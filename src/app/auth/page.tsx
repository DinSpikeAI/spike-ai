"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle,
  Wand2, CheckCircle, ArrowLeft, Sparkles, User, Camera, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type View = "signin" | "signup" | "magic" | "magic-sent" | "signup-done" | "setup-profile";

/* ═══════════════════════════════════════════════════════════════
   AVATAR OPTIONS — Netflix-style profile pictures
   ═══════════════════════════════════════════════════════════════ */
const AVATARS = [
  { id: "a1", gradient: "from-violet-600 to-indigo-800", emoji: "🎬" },
  { id: "a2", gradient: "from-cyan-500 to-blue-700", emoji: "🚀" },
  { id: "a3", gradient: "from-rose-500 to-pink-700", emoji: "🎭" },
  { id: "a4", gradient: "from-amber-500 to-orange-700", emoji: "⚡" },
  { id: "a5", gradient: "from-emerald-500 to-teal-700", emoji: "🌊" },
  { id: "a6", gradient: "from-fuchsia-500 to-purple-700", emoji: "🔮" },
  { id: "a7", gradient: "from-red-500 to-rose-800", emoji: "🎯" },
  { id: "a8", gradient: "from-sky-400 to-indigo-600", emoji: "✨" },
  { id: "a9", gradient: "from-lime-500 to-green-700", emoji: "🌿" },
  { id: "a10", gradient: "from-orange-400 to-red-600", emoji: "🔥" },
  { id: "a11", gradient: "from-indigo-400 to-violet-700", emoji: "🎵" },
  { id: "a12", gradient: "from-teal-400 to-cyan-700", emoji: "💎" },
];

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Profile setup
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/");
    });
  }, [router]);

  const switchView = (v: View) => {
    setTransitioning(true);
    setTimeout(() => {
      setView(v);
      setError(null);
      setTransitioning(false);
    }, 250);
  };

  const handleAuth = async () => {
    if (!supabase) { setError("Database not connected"); return; }
    if (!email) { setError("Please enter your email"); return; }
    if (view !== "magic" && !password) { setError("Please enter your password"); return; }
    if (view === "signup" && password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError(null);
    try {
      if (view === "magic") {
        const { error: e } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (e) throw e;
        switchView("magic-sent");
      } else if (view === "signup") {
        const { data, error: e } = await supabase.auth.signUp({ email, password, options: { data: { display_name: email.split("@")[0] }, emailRedirectTo: `${window.location.origin}/` } });
        if (e) throw e;
        setDisplayName(email.split("@")[0]);
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
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || newUser?.id;
    
    if (userId) {
      const avatar = selectedAvatar || "a1";
      const avatarConfig = AVATARS.find(a => a.id === avatar);
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || "U")}&backgroundColor=1a1a2e&textColor=ffffff&fontSize=42`;

      await supabase.from("profiles").upsert({
        id: userId,
        display_name: displayName.trim() || email.split("@")[0],
        avatar_url: avatarUrl,
        email: email,
      }, { onConflict: "id" });

      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() || email.split("@")[0], avatar_url: avatarUrl }
      });
    }

    setSavingProfile(false);
    router.push("/");
  };

  const selectedAvatarData = AVATARS.find(a => a.id === selectedAvatar);

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)", animation: "authFloat 20s ease-in-out infinite" }} />
        <div className="absolute bottom-[-30%] left-[-15%] w-[900px] h-[900px] rounded-full opacity-[0.02]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)", animation: "authFloat 25s ease-in-out infinite reverse" }} />
        <div className="absolute top-[30%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.015]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)", animation: "authFloat 15s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ── Nav ── */}
      <nav className={`relative z-20 px-8 md:px-16 py-8 flex items-center transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-5">
          <button onClick={() => view === "setup-profile" ? switchView("signup-done") : router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center text-white/20 hover:text-white hover:border-white/[0.15] transition-all cursor-pointer backdrop-blur-sm">
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
        <div className={`w-full transition-all duration-500 ${view === "setup-profile" ? "max-w-[640px]" : "max-w-[520px]"} ${transitioning ? "opacity-0 scale-[0.97] translate-y-3" : "opacity-100 scale-100 translate-y-0"}`}
          style={{ transitionDelay: mounted ? "200ms" : "0ms" }}>

          {/* ═══════════════════════════════════════
               MAGIC LINK SENT
             ═══════════════════════════════════════ */}
          {view === "magic-sent" && (
            <div className="text-center" style={{ animation: "authReveal 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="relative inline-block mb-10">
                <div className="w-28 h-28 rounded-[28px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Mail size={40} className="text-white/30" />
                </div>
                <div className="absolute -inset-4 rounded-[36px] bg-white/[0.02] blur-xl -z-10" />
              </div>
              <h1 className="text-[40px] md:text-[48px] font-semibold text-white tracking-tight leading-[1.1] mb-4 whitespace-pre-line">{"Check your\ninbox."}</h1>
              <p className="text-[16px] text-white/25 mb-2">We sent a magic link to</p>
              <p className="text-[17px] text-white/70 font-medium mb-12 tracking-wide">{email}</p>
              <p className="text-[14px] text-white/15 leading-[1.8] max-w-sm mx-auto mb-14">Click the link in your email to sign in instantly. No password needed.</p>
              <button onClick={() => switchView("signin")} className="text-white/25 text-[14px] font-medium hover:text-white/50 transition-colors cursor-pointer tracking-wide">← Back to sign in</button>
            </div>
          )}

          {/* ═══════════════════════════════════════
               SIGNUP DONE — Confirm Email
             ═══════════════════════════════════════ */}
          {view === "signup-done" && (
            <div className="text-center" style={{ animation: "authReveal 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="relative inline-block mb-10">
                <div className="w-28 h-28 rounded-[28px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <CheckCircle size={40} className="text-emerald-400/50" />
                </div>
                <div className="absolute -inset-4 rounded-[36px] bg-emerald-500/[0.02] blur-xl -z-10" />
              </div>
              <h1 className="text-[40px] md:text-[48px] font-semibold text-white tracking-tight leading-[1.1] mb-4">You&apos;re in.</h1>
              <p className="text-[16px] text-white/25 mb-2">Confirmation sent to</p>
              <p className="text-[17px] text-white/70 font-medium mb-12 tracking-wide">{email}</p>
              <p className="text-[14px] text-white/15 leading-[1.8] max-w-sm mx-auto mb-14">Click the link in your email to activate, then come back and sign in.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => switchView("setup-profile")}
                  className="auth-primary-btn px-10 py-[16px] text-black text-[15px] font-semibold tracking-wide rounded-full flex items-center gap-3 cursor-pointer transition-all">
                  Set Up Profile <ArrowRight size={16} />
                </button>
                <button onClick={() => switchView("signin")} className="text-white/20 text-[14px] font-medium hover:text-white/40 transition-colors cursor-pointer tracking-wide">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
               PROFILE SETUP — Name + Avatar
             ═══════════════════════════════════════ */}
          {view === "setup-profile" && (
            <div style={{ animation: "authReveal 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="text-center mb-12">
                <h1 className="text-[44px] md:text-[56px] font-semibold text-white tracking-tight leading-[1.05] mb-4">
                  Who&apos;s watching?
                </h1>
                <p className="text-[18px] text-white/25 tracking-wide">
                  Choose your look. You can always change it later.
                </p>
              </div>

              {/* Selected Avatar Preview */}
              <div className="flex justify-center mb-12">
                <div className="relative group">
                  <div className={`w-32 h-32 md:w-36 md:h-36 rounded-[32px] flex items-center justify-center text-5xl shadow-2xl shadow-black/50 transition-all duration-500 border-2 ${selectedAvatar ? "border-white/20" : "border-white/[0.06]"} ${selectedAvatarData ? `bg-gradient-to-br ${selectedAvatarData.gradient}` : "bg-white/[0.04]"}`}>
                    {selectedAvatarData ? (
                      <span className="text-5xl md:text-6xl drop-shadow-lg" style={{ animation: "authPop 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>{selectedAvatarData.emoji}</span>
                    ) : (
                      <User size={48} className="text-white/15" />
                    )}
                  </div>
                  {selectedAvatar && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <Check size={16} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                  <div className={`absolute -inset-6 rounded-[44px] blur-2xl -z-10 transition-opacity duration-500 ${selectedAvatarData ? "opacity-20" : "opacity-0"} ${selectedAvatarData ? `bg-gradient-to-br ${selectedAvatarData.gradient}` : ""}`} />
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="mb-10">
                <p className="text-[11px] font-bold tracking-[0.25em] text-white/15 uppercase mb-5 text-center">Choose your avatar</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-w-[420px] mx-auto">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`aspect-square rounded-2xl flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 border-2 bg-gradient-to-br ${av.gradient} ${selectedAvatar === av.id
                        ? "border-white/40 scale-105 shadow-lg ring-2 ring-white/10"
                        : "border-transparent hover:border-white/15 hover:scale-105"
                      }`}
                    >
                      <span className="drop-shadow-md">{av.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name */}
              <div className="max-w-[420px] mx-auto mb-10">
                <label className="block text-[11px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3 ml-1">Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full px-6 py-[18px] bg-white/[0.03] border border-white/[0.06] rounded-2xl text-[17px] text-white placeholder-white/[0.1] focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all duration-300 tracking-wide text-center"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="auth-primary-btn px-14 py-[18px] text-black text-[16px] font-semibold tracking-[0.05em] rounded-full flex items-center justify-center gap-3 disabled:opacity-30 transition-all duration-300 cursor-pointer active:scale-[0.97]"
                >
                  {savingProfile ? <Loader2 size={20} className="animate-spin text-black/50" /> : <>Let&apos;s Go <ArrowRight size={18} strokeWidth={2.5} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
               SIGN IN / SIGN UP / MAGIC LINK
             ═══════════════════════════════════════ */}
          {(view === "signin" || view === "signup" || view === "magic") && (
            <div style={{ animation: "authReveal 0.6s cubic-bezier(0.16,1,0.3,1)" }}>

              {/* Hero Title */}
              <div className="mb-14">
                <h1 className="text-[52px] md:text-[64px] font-semibold text-white tracking-tight leading-[1.05] mb-5 whitespace-pre-line">
                  {view === "signin" ? "Welcome\nback." : view === "signup" ? "Join the\nfuture." : "Magic\nlink."}
                </h1>
                <p className="text-[18px] md:text-[20px] text-white/25 tracking-wide leading-relaxed">
                  {view === "signin" ? "Sign in to continue to spike AI." : view === "signup" ? "Create your account and start exploring AI cinema." : "No password needed. We'll email you a link."}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-[11px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3 ml-1">Email</label>
                  <div className="relative">
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                      placeholder="you@email.com"
                      className="w-full px-6 py-[18px] bg-white/[0.03] border border-white/[0.06] rounded-2xl text-[17px] text-white placeholder-white/[0.1] focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all duration-300 tracking-wide"
                      style={{ caretColor: "rgba(255,255,255,0.5)" }} />
                    <Mail size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/[0.06] group-focus-within:text-white/[0.15] transition-colors duration-300" />
                  </div>
                </div>

                {view !== "magic" && (
                  <div className="group" style={{ animation: "authSlide 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
                    <label className="block text-[11px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3 ml-1">
                      {view === "signup" ? "Create Password" : "Password"}
                    </label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                        placeholder="••••••••"
                        className="w-full px-6 py-[18px] pr-14 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-[17px] text-white placeholder-white/[0.1] focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all duration-300 tracking-[0.15em]"
                        style={{ caretColor: "rgba(255,255,255,0.5)" }} />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/[0.08] hover:text-white/[0.25] transition-colors cursor-pointer" tabIndex={-1}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {view === "signup" && <p className="text-[11px] text-white/[0.1] mt-3 ml-1 tracking-[0.1em]">Minimum 6 characters</p>}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-4 mt-6 p-5 bg-red-500/[0.04] border border-red-500/[0.08] rounded-2xl" style={{ animation: "authShake 0.5s ease" }}>
                  <AlertCircle size={17} className="text-red-400/50 flex-shrink-0 mt-0.5" />
                  <p className="text-[14px] text-red-300/50 leading-relaxed tracking-wide">{error}</p>
                </div>
              )}

              <button onClick={handleAuth} disabled={loading}
                className="auth-primary-btn w-full mt-10 py-[18px] text-black text-[16px] font-semibold tracking-[0.05em] rounded-full flex items-center justify-center gap-3 disabled:opacity-30 transition-all duration-300 cursor-pointer active:scale-[0.97]">
                {loading ? <Loader2 size={20} className="animate-spin text-black/50" />
                  : view === "magic" ? <>Send Link <Wand2 size={18} /></>
                  : view === "signup" ? <>Create Account <Sparkles size={18} /></>
                  : <>Sign In <ArrowRight size={18} strokeWidth={2.5} /></>}
              </button>

              <button onClick={() => switchView(view === "magic" ? "signin" : "magic")}
                className="w-full mt-4 py-[16px] text-[14px] text-white/15 hover:text-white/35 font-medium rounded-full border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer tracking-wide">
                {view === "magic" ? <><Lock size={14} /> Use password instead</> : <><Wand2 size={14} /> Sign in with magic link</>}
              </button>

              <div className="flex items-center my-10"><div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" /></div>

              <p className="text-center text-[15px] text-white/15 tracking-wide">
                {view === "signup" ? (<>Already have an account?{" "}<button onClick={() => switchView("signin")} className="text-white/50 font-semibold hover:text-white/70 transition-colors cursor-pointer">Sign in</button></>) 
                  : (<>New to spike AI?{" "}<button onClick={() => switchView("signup")} className="text-white/50 font-semibold hover:text-white/70 transition-colors cursor-pointer">Create account</button></>)}
              </p>
            </div>
          )}

          {/* Terms */}
          {view !== "setup-profile" && (
            <p className="text-center mt-14 text-[11px] text-white/[0.06] leading-relaxed tracking-[0.15em]">
              By continuing, you agree to spike AI&apos;s Terms & Privacy Policy
            </p>
          )}
        </div>
      </div>

      {/* ═══ Styles ═══ */}
      <style jsx>{`
        .auth-primary-btn {
          background: linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 4px 20px rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .auth-primary-btn:hover:not(:disabled) {
          background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 8px 40px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
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
        }
        @keyframes authPop {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
