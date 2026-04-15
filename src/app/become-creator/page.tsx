"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Sparkles, Loader2, Check,
  Film, AlertCircle, ArrowRight, Camera,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCreator, setAlreadyCreator] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [sampleWorkUrl, setSampleWorkUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setUser(session.user);
      const { data: profile } = await supabase!.from("profiles").select("*").eq("id", session.user.id).single();
      if (profile) {
        setDisplayName(profile.display_name || session.user.user_metadata?.full_name || "");
        setBio(profile.bio || "");
        setWebsite(profile.website || "");
        setSocialX(profile.social_x || "");
        setSocialYoutube(profile.social_youtube || "");
        setSocialInstagram(profile.social_instagram || "");
        setSampleWorkUrl(profile.sample_work_url || "");
        setAvatarUrl(profile.avatar_url || session.user.user_metadata?.avatar_url || "");
        if (profile.user_type === "creator") setAlreadyCreator(true);
      } else {
        setDisplayName(session.user.user_metadata?.full_name || "");
        setAvatarUrl(session.user.user_metadata?.avatar_url || "");
      }
      setLoading(false);
    }
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setDisplayName(prev => prev || session.user.user_metadata?.full_name || "");
        setAvatarUrl(prev => prev || session.user.user_metadata?.avatar_url || "");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setGoogleLoading(true);
    setError(null);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/become-creator` },
      });
    } catch {
      setError("Sign in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      await supabase.storage.from("media").upload(path, file, { upsert: true });
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    } catch { setError("Upload error"); }
    setUploadingAvatar(false);
  };

  const handleSubmit = async () => {
    if (!supabase || !user) return;
    if (!displayName.trim()) { setError("Please enter your name"); return; }
    if (!sampleWorkUrl.trim()) { setError("Add a link to your work"); return; }
    if (!termsAccepted) { setError("Please accept the terms to continue"); return; }
    setSubmitting(true);
    setError(null);
    const { error: e } = await supabase.from("profiles").update({
      display_name: displayName.trim(), bio: bio.trim(), website: website.trim(),
      social_x: socialX.trim(), social_youtube: socialYoutube.trim(),
      social_instagram: socialInstagram.trim(), sample_work_url: sampleWorkUrl.trim(),
      creator_request: "pending", avatar_url: avatarUrl,
    }).eq("id", user.id);
    if (!e) {
      setSubmitted(true);
      try {
        await fetch("/api/creator-apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: displayName.trim(), email: user.email,
            film_url: sampleWorkUrl.trim(), website: website.trim(),
            social: socialYoutube.trim() || socialX.trim() || socialInstagram.trim(),
            bio: bio.trim(), ai_tools: [],
          }),
        });
      } catch {}
    } else { setError("Something went wrong. Please try again."); }
    setSubmitting(false);
  };

  const inputClass = "w-full px-5 py-[15px] bg-white/[0.03] border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all";

  if (loading) return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-white/10 animate-spin" />
    </div>
  );

  // ─── Already Creator ───
  if (alreadyCreator) return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(52,211,153,0.7) 0%, transparent 70%)" }} />
      </div>
      <nav className="relative z-20 px-8 py-7">
        <div className="max-w-[900px] mx-auto flex items-center gap-5">
          <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all cursor-pointer"><ArrowLeft size={16} /></button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/spike-icon-512.png" alt="Spike AI" width={28} height={28} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-[0.25em] text-white/25 uppercase">spike AI</span>
          </div>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 pb-20 relative z-20">
        <div style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }} className="text-center">
          <div className="relative inline-block mb-12">
            <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-400/15 flex items-center justify-center">
              <Check size={40} className="text-emerald-300/60" />
            </div>
            <div className="absolute -inset-6 rounded-[40px] bg-emerald-500/[0.06] blur-2xl -z-10" />
          </div>
          <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">You&apos;re{"\n"}a creator.</h1>
          <p className="text-[17px] text-white/25 mb-14">Submit films and manage your profile.</p>
          <button onClick={() => router.push("/submit")} className="cta-btn px-12 py-[17px] text-black text-[15px] font-bold rounded-full inline-flex items-center gap-3 cursor-pointer">Submit Film <ArrowRight size={17} strokeWidth={2.5} /></button>
        </div>
      </div>
      <style jsx>{`
        .cta-btn { background: linear-gradient(180deg, #ffffff 0%, #e8e8eb 100%); box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 4px 24px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9); }
        .cta-btn:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 8px 40px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,1); transform: translateY(-2px); }
        @keyframes reveal { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );

  // ─── Application Sent ───
  if (submitted) return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.7) 0%, transparent 70%)" }} />
      </div>
      <nav className="relative z-20 px-8 py-7">
        <div className="max-w-[900px] mx-auto flex items-center gap-5">
          <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all cursor-pointer"><ArrowLeft size={16} /></button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/spike-icon-512.png" alt="Spike AI" width={28} height={28} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-[0.25em] text-white/25 uppercase">spike AI</span>
          </div>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 pb-20 relative z-20">
        <div style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }} className="text-center">
          <div className="relative inline-block mb-12">
            <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-violet-500/30 to-pink-500/20 border border-violet-400/15 flex items-center justify-center">
              <Sparkles size={40} className="text-violet-300/60" />
            </div>
            <div className="absolute -inset-6 rounded-[40px] bg-violet-500/[0.06] blur-2xl -z-10" />
          </div>
          <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">Application{"\n"}sent.</h1>
          <p className="text-[17px] text-white/25 mb-3">We review every application personally and will get back to you within 48 hours.</p>
          <p className="text-[14px] text-white/12 mb-14">Pioneer Creator spots are limited.</p>
          <button onClick={() => router.push("/")} className="text-white/20 text-[14px] hover:text-white/40 transition-colors cursor-pointer">&larr; Back to home</button>
        </div>
      </div>
      <style jsx>{`@keyframes reveal { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );

  const initial = (displayName || user?.email || "U")[0].toUpperCase();

  // ─── Main Form ───
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
          <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/spike-icon-512.png" alt="Spike AI" width={28} height={28} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-[0.25em] text-white/25 uppercase">spike AI</span>
          </div>
        </div>
      </nav>

      {/* ═══ Content ═══ */}
      <div className="flex-1 flex items-start justify-center px-6 pb-20 pt-4 relative z-20">
        <div className={`w-full max-w-[460px] text-center transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>

          {/* Icon */}
          <div className="relative inline-block mb-8">
            <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-violet-500/25 to-blue-500/15 border border-violet-400/12 flex items-center justify-center backdrop-blur-sm">
              <Film size={32} className="text-violet-300/50" />
            </div>
            <div className="absolute -inset-5 rounded-[30px] bg-violet-500/[0.05] blur-2xl -z-10" />
          </div>

          {/* Title */}
          <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-4"
            style={{ textShadow: "0 0 80px rgba(139, 92, 246, 0.12)" }}>
            {user ? <>Apply as{"\n"}creator.</> : <>Join as{"\n"}creator.</>}
          </h1>
          <p className="text-[17px] text-white/25 mb-10">
            {user ? "Complete your profile and start uploading." : "Create your account and apply in one step."}
          </p>

          {/* ═══ Form Card ═══ */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-7 shadow-[0_0_60px_rgba(0,0,0,0.3)] text-left">

            {/* Google Sign In */}
            {!user && (
              <>
                <button onClick={handleGoogleSignIn} disabled={googleLoading}
                  className={`google-btn w-full py-[15px] px-5 rounded-xl text-[15px] font-medium flex items-center justify-center gap-3 bg-white/[0.05] border border-white/[0.1] text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.16] transition-all duration-300 cursor-pointer active:scale-[0.98] ${googleLoading ? "google-pulse" : ""}`}>
                  {googleLoading ? (
                    <span className="flex items-center gap-3"><GoogleIcon className="w-5 h-5" /><span className="text-white/40">Connecting...</span></span>
                  ) : (
                    <><GoogleIcon className="w-5 h-5" /> Sign up with Google</>
                  )}
                </button>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-white/15 uppercase tracking-[0.2em]">then complete below</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
              </>
            )}

            {/* Signed in badge */}
            {user && (
              <div className="flex items-center gap-3 mb-6 p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-800 to-indigo-900 flex items-center justify-center text-sm font-bold text-white/30">{initial}</div>}
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-white/80 truncate">{user.user_metadata?.full_name || user.email}</p>
                  <p className="text-[11px] text-white/25">Signed in with Google</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check size={13} className="text-emerald-400/70" /></div>
              </div>
            )}

            {/* Avatar Upload */}
            {user && (
              <div className="flex justify-center mb-7">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/[0.08] group-hover:border-violet-400/25 transition-all duration-300 shadow-xl shadow-black/30">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-violet-800 to-indigo-900 flex items-center justify-center text-3xl font-bold text-white/25">{initial}</div>}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-white/90 transition-all cursor-pointer active:scale-90">
                    {uploadingAvatar ? <Loader2 size={13} className="text-black/50 animate-spin" /> : <Camera size={13} className="text-black/70" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <div className="absolute -inset-4 rounded-full bg-violet-500/[0.06] blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] text-white/30 uppercase mb-2.5 ml-1">Your Name *</label>
                <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
                  placeholder="How you want to be known" className={inputClass} />
              </div>

              {/* Film Link */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] text-white/30 uppercase mb-2.5 ml-1">Your Best AI Film *</label>
                <input value={sampleWorkUrl} onChange={(e) => { setSampleWorkUrl(e.target.value); setError(null); }}
                  placeholder="YouTube or Vimeo link" className={inputClass} />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] text-white/30 uppercase mb-2.5 ml-1">About Your Work</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  placeholder="What kind of AI films do you make?"
                  className={inputClass + " resize-none"} />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/12 uppercase tracking-[0.2em]">optional</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Socials */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.15em] text-white/20 uppercase mb-2 ml-1">YouTube</label>
                  <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} placeholder="@channel"
                    className="w-full px-3.5 py-[13px] bg-white/[0.03] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.15em] text-white/20 uppercase mb-2 ml-1">X</label>
                  <input value={socialX} onChange={(e) => setSocialX(e.target.value)} placeholder="@handle"
                    className="w-full px-3.5 py-[13px] bg-white/[0.03] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.15em] text-white/20 uppercase mb-2 ml-1">Instagram</label>
                  <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="@user"
                    className="w-full px-3.5 py-[13px] bg-white/[0.03] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 transition-all" />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] text-white/20 uppercase mb-2.5 ml-1">Website</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com" className={inputClass} />
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group" style={{ animation: "slideIn 0.3s ease" }}>
                <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
                  className="mt-0.5 w-4 h-4 rounded accent-purple-500 cursor-pointer flex-shrink-0" />
                <span className="text-[11px] text-white/25 leading-[1.6] group-hover:text-white/35 transition-colors">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-purple-400/60 hover:text-purple-400/80 underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/community-guidelines" target="_blank" className="text-purple-400/60 hover:text-purple-400/80 underline">Community Guidelines</a>.
                  I confirm I own or have rights to all content I upload, and my films do not contain deepfakes of real people without consent.
                </span>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/[0.06] border border-red-500/[0.1] rounded-xl" style={{ animation: "shake 0.4s ease" }}>
                  <AlertCircle size={15} className="text-red-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-300/60 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit */}
              {user ? (
                <button onClick={handleSubmit} disabled={submitting}
                  className="cta-btn w-full mt-2 py-[16px] text-black text-[15px] font-bold tracking-wide rounded-full flex items-center justify-center gap-2.5 disabled:opacity-30 cursor-pointer active:scale-[0.97]">
                  {submitting ? <Loader2 size={19} className="animate-spin text-black/40" /> : <><Sparkles size={16} /> Apply as Pioneer Creator</>}
                </button>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[12px] text-white/15">Sign in with Google above to submit.</p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-8 text-[11px] text-white/[0.08] tracking-[0.1em]">
            Free to join. No fees, no contracts. Pioneer Creator badge is permanent.
          </p>
        </div>
      </div>

      <style jsx>{`
        .cta-btn {
          background: linear-gradient(180deg, #ffffff 0%, #e8e8eb 100%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 4px 24px rgba(255,255,255,0.08), 0 0 80px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cta-btn:hover:not(:disabled) {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 8px 40px rgba(255,255,255,0.12), 0 0 100px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1);
          transform: translateY(-2px);
        }
        .google-pulse { animation: googlePulse 1.5s ease-in-out infinite; }
        @keyframes googlePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); } 50% { box-shadow: 0 0 20px 2px rgba(255,255,255,0.06); } }
        @keyframes reveal { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
        @keyframes glow { 0%,100% { opacity:0.06; transform:translate(-50%,-50%) scale(1) } 50% { opacity:0.09; transform:translate(-50%,-50%) scale(1.1) } }
      `}</style>
    </div>
  );
}
