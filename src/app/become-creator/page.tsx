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
    if (!termsAccepted) { setError("Please accept the terms"); return; }
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

  const inputClass = "w-full px-5 py-[15px] bg-white/[0.04] border border-white/[0.07] rounded-xl text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-300";

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
      <nav className={`relative z-20 px-6 py-5 transition-all duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-[640px] mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft size={15} />
          </button>
          <span className="text-[15px] font-semibold tracking-[0.18em] text-white/30 cursor-pointer" onClick={() => router.push("/")}>spike AI</span>
        </div>
      </nav>
      <div className="flex-1 flex items-start justify-center px-5 pb-20 pt-4 relative z-20">
        <div className={`w-full max-w-[640px] transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {children}
        </div>
      </div>
    </div>
  );

  if (loading) return <Shell><div className="flex justify-center py-20"><Loader2 className="w-5 h-5 text-white/10 animate-spin" /></div></Shell>;

  if (alreadyCreator) return (
    <Shell>
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6"><Check size={32} className="text-white/40" /></div>
        <h1 className="text-3xl font-bold text-white mb-3">You&apos;re already a creator</h1>
        <p className="text-white/30 text-[15px] mb-10">Start uploading your AI films.</p>
        <button onClick={() => router.push("/submit")} className="px-10 py-4 bg-white text-black text-[14px] font-bold rounded-full cursor-pointer hover:bg-white/90 transition-all">Submit Film</button>
      </div>
    </Shell>
  );

  if (submitted) return (
    <Shell>
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6"><Sparkles size={32} className="text-white/40" /></div>
        <h1 className="text-3xl font-bold text-white mb-3">Application sent</h1>
        <p className="text-white/30 text-[15px] mb-3">We review every application personally and will get back to you within 48 hours.</p>
        <p className="text-white/15 text-[13px] mb-10">Pioneer Creator spots are limited.</p>
        <button onClick={() => router.push("/")} className="text-white/20 text-[14px] hover:text-white/40 transition-colors cursor-pointer">&larr; Back to home</button>
      </div>
    </Shell>
  );

  const initial = (displayName || user?.email || "U")[0].toUpperCase();

  return (
    <Shell>
      <div className="text-center mb-8">
        <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight text-white mb-2">Join as Creator</h1>
        <p className="text-[15px] text-white/30">{user ? "Fill in your details and apply." : "Create your account and apply in one step."}</p>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 md:p-8">

        {!user && (
          <div className="mb-8">
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-3">Step 1 - Create Account</label>
            <button onClick={handleGoogleSignIn} disabled={googleLoading}
              className="w-full py-4 bg-white text-black text-[14px] font-semibold rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:bg-white/90 transition-all disabled:opacity-50">
              {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <><GoogleIcon className="w-5 h-5" /> Sign in with Google</>}
            </button>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-white/15 uppercase tracking-[0.15em]">then fill your details below</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
              : <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-bold text-white/30">{initial}</div>}
            <div className="text-left">
              <p className="text-[13px] font-medium text-white/70">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-[11px] text-white/25">Signed in</p>
            </div>
            <Check size={16} className="text-green-400/50 ml-auto" />
          </div>
        )}

        {user && (
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-white/[0.08] group-hover:border-white/20 transition-all">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-2xl font-bold text-white/20">{initial}</div>}
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-white/90 transition-all cursor-pointer">
                {uploadingAvatar ? <Loader2 size={12} className="text-black/50 animate-spin" /> : <Camera size={12} className="text-black/70" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase mb-2">Your Name / Studio Name *</label>
            <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setError(null); }} placeholder="e.g. Daniel Overton or Ovey Studios" className={inputClass} />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase mb-2">Link to Your Best AI Film *</label>
            <input value={sampleWorkUrl} onChange={(e) => { setSampleWorkUrl(e.target.value); setError(null); }} placeholder="YouTube or Vimeo link" className={inputClass} />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase mb-2">About You</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="What kind of AI films do you make?" className={inputClass + " resize-none"} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] text-white/15 uppercase mb-2">YouTube</label>
              <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} placeholder="@channel"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] rounded-xl text-[13px] text-white placeholder-white/15 focus:outline-none focus:border-white/20 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] text-white/15 uppercase mb-2">X / Twitter</label>
              <input value={socialX} onChange={(e) => setSocialX(e.target.value)} placeholder="@handle"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] rounded-xl text-[13px] text-white placeholder-white/15 focus:outline-none focus:border-white/20 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] text-white/15 uppercase mb-2">Instagram</label>
              <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="@user"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.07] rounded-xl text-[13px] text-white placeholder-white/15 focus:outline-none focus:border-white/20 transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-white/15 uppercase mb-2">Website (optional)</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" className={inputClass} />
          </div>

          <div className="mt-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
            <p className="text-[11px] text-white/25 leading-relaxed mb-3">
              By applying, you confirm: you own or have rights to all content you upload. Your films do not contain deepfakes of real people without consent. You grant Spike AI a non-exclusive license to display and promote your content. You will tag all AI tools used in each film.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
                className="mt-0.5 w-4 h-4 accent-white flex-shrink-0" />
              <span className="text-[12px] text-white/40 leading-relaxed">
                I agree to the <a href="/terms" target="_blank" className="text-white/60 underline">Terms of Service</a> and <a href="/community-guidelines" target="_blank" className="text-white/60 underline">Community Guidelines</a>.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/[0.06] border border-red-500/[0.12] rounded-xl">
              <AlertCircle size={15} className="text-red-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-300/60">{error}</p>
            </div>
          )}

          {user ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-4 bg-white text-black text-[14px] font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer hover:bg-white/90 transition-all mt-2">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> Apply as Creator</>}
            </button>
          ) : (
            <p className="text-center text-[12px] text-white/20 py-2">Sign in with Google above to submit your application.</p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-white/10 text-center mt-6">Free to join. No fees, no contracts.</p>
    </Shell>
  );
}
