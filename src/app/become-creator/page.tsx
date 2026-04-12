"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Sparkles, Loader2, Check,
  Film, AlertCircle, ArrowRight, Camera,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCreator, setAlreadyCreator] = useState(false);
  const [alreadyPending, setAlreadyPending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [sampleWorkUrl, setSampleWorkUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setUser(session.user);
      const { data: profile } = await supabase!.from("profiles").select("*").eq("id", session.user.id).single();
      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setWebsite(profile.website || "");
        setSocialX(profile.social_x || "");
        setSocialYoutube(profile.social_youtube || "");
        setSocialInstagram(profile.social_instagram || "");
        setSampleWorkUrl(profile.sample_work_url || "");
        setAvatarUrl(profile.avatar_url || session.user.user_metadata?.avatar_url || "");
        if (profile.user_type === "creator") setAlreadyCreator(true);
        if (profile.creator_request === "pending") setAlreadyPending(true);
      } else {
        setAvatarUrl(session.user.user_metadata?.avatar_url || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (upErr) { setError("Upload failed"); setUploadingAvatar(false); return; }
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    } catch { setError("Upload error"); }
    setUploadingAvatar(false);
  };

  const handleSubmit = async () => {
    if (!supabase || !user) return;
    if (!displayName.trim()) { setError("Please enter your name"); return; }
    if (!bio.trim()) { setError("Tell us about yourself and your work"); return; }
    if (!sampleWorkUrl.trim()) { setError("Add a link to your work so we can review it"); return; }
    setSubmitting(true);
    setError(null);
    const { error: e } = await supabase.from("profiles").update({
      display_name: displayName.trim(), bio: bio.trim(), website: website.trim(),
      social_x: socialX.trim(), social_youtube: socialYoutube.trim(),
      social_instagram: socialInstagram.trim(), sample_work_url: sampleWorkUrl.trim(),
      creator_request: "pending", avatar_url: avatarUrl,
    }).eq("id", user.id);
    if (!e) { setSubmitted(true); } else { setError("Something went wrong. Please try again."); }
    setSubmitting(false);
  };

  const inputClass = "w-full px-5 py-[15px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 focus:bg-white/[0.07] focus:shadow-[0_0_25px_rgba(139,92,246,0.1)] transition-all duration-300";

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#07070a] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.8) 0%, transparent 70%)", animation: "glow 10s ease-in-out infinite" }} />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)", animation: "glow 14s ease-in-out infinite reverse" }} />
        <div className="absolute top-[60%] left-[60%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.7) 0%, transparent 70%)", animation: "glow 18s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>
      <nav className={`relative z-20 px-8 py-7 transition-all duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-[1000px] mx-auto flex items-center gap-5">
          <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/spike-icon-512.png" alt="Spike AI" width={28} height={28} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-[0.25em] text-white/25 uppercase">spike AI</span>
          </div>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 pb-20 relative z-20">
        <div className={`transition-all duration-1000 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {children}
        </div>
      </div>
    </div>
  );

  if (loading) return <Shell><Loader2 className="w-5 h-5 text-white/10 animate-spin" /></Shell>;

  if (!user) return (
    <Shell>
      <div className="text-center">
        <div className="relative inline-block mb-12">
          <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-violet-500/30 to-blue-500/20 border border-violet-400/15 flex items-center justify-center">
            <Film size={40} className="text-violet-300/60" />
          </div>
          <div className="absolute -inset-6 rounded-[40px] bg-violet-500/[0.06] blur-2xl -z-10" />
        </div>
        <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">Sign in{"\n"}to apply.</h1>
        <p className="text-[17px] text-white/30 mb-14">You need an account to become a creator.</p>
        <button onClick={() => router.push("/auth")} className="px-12 py-[17px] bg-white text-black text-[15px] font-bold rounded-full inline-flex items-center gap-3 cursor-pointer hover:bg-white/90 transition-all active:scale-[0.97]">Sign In <ArrowRight size={17} strokeWidth={2.5} /></button>
      </div>
    </Shell>
  );

  if (alreadyCreator) return (
    <Shell>
      <div className="text-center">
        <div className="relative inline-block mb-12">
          <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-400/15 flex items-center justify-center">
            <Check size={40} className="text-emerald-300/60" />
          </div>
          <div className="absolute -inset-6 rounded-[40px] bg-emerald-500/[0.06] blur-2xl -z-10" />
        </div>
        <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">You&apos;re{"\n"}a creator.</h1>
        <p className="text-[17px] text-white/30 mb-14">Submit films and manage your profile.</p>
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => router.push("/submit")} className="px-12 py-[17px] bg-white text-black text-[15px] font-bold rounded-full inline-flex items-center gap-3 cursor-pointer hover:bg-white/90 transition-all active:scale-[0.97]">Submit Film <ArrowRight size={17} strokeWidth={2.5} /></button>
          <button onClick={() => router.push("/profile")} className="text-white/20 text-[13px] hover:text-white/40 transition-colors cursor-pointer">Go to profile</button>
        </div>
      </div>
    </Shell>
  );

  if (alreadyPending || submitted) return (
    <Shell>
      <div className="text-center">
        <div className="relative inline-block mb-12">
          <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-violet-500/30 to-pink-500/20 border border-violet-400/15 flex items-center justify-center">
            <Sparkles size={40} className="text-violet-300/60" />
          </div>
          <div className="absolute -inset-6 rounded-[40px] bg-violet-500/[0.06] blur-2xl -z-10" />
        </div>
        <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">Application{"\n"}sent.</h1>
        <p className="text-[17px] text-white/30 mb-3">We&apos;ll review and get back to you soon.</p>
        <p className="text-[14px] text-white/12 mb-14">Pioneer Creator spots are limited to the first 50.</p>
        <button onClick={() => router.push("/")} className="text-white/20 text-[14px] hover:text-white/40 transition-colors cursor-pointer">&larr; Back to home</button>
      </div>
    </Shell>
  );

  const initial = (displayName || user?.email || "U")[0].toUpperCase();

  return (
    <Shell>
      <div className="w-full max-w-[560px] text-center">

        {/* Title */}
        <h1 className="text-[46px] md:text-[58px] font-bold tracking-[-0.03em] leading-[1.06] text-white mb-3"
          style={{ textShadow: "0 0 80px rgba(139, 92, 246, 0.15)" }}>
          Become a creator.
        </h1>
        <p className="text-[16px] text-white/25 mb-10">Join as a Pioneer Creator and share your AI films.</p>

        {/* ═══ Form Card ═══ */}
        <div className="max-w-[520px] mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-500/25 via-blue-500/15 to-pink-500/15" />
            <div className="relative rounded-2xl bg-[#0c0c14]/95 backdrop-blur-2xl p-8">

              {/* Avatar Upload */}
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/[0.1] shadow-xl shadow-black/40 group-hover:border-violet-400/30 transition-all duration-300">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-800 to-indigo-900 flex items-center justify-center text-2xl font-bold text-white/30">{initial}</div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-white/90 transition-all cursor-pointer active:scale-90"
                  >
                    {uploadingAvatar ? <Loader2 size={13} className="text-black/50 animate-spin" /> : <Camera size={13} className="text-black/70" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <div className="absolute -inset-3 rounded-full bg-violet-500/[0.06] blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>

              <div className="space-y-5 text-left">

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-violet-300/35 uppercase mb-2.5 ml-1">Your Name *</label>
                  <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
                    placeholder="How you want to be known" className={inputClass} />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-violet-300/35 uppercase mb-2.5 ml-1">About You *</label>
                  <textarea value={bio} onChange={(e) => { setBio(e.target.value); setError(null); }} rows={3}
                    placeholder="Tell us about your work with AI cinema..."
                    className={inputClass + " resize-none"} />
                </div>

                {/* Sample Work */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-violet-300/35 uppercase mb-2.5 ml-1">Link to Your Work *</label>
                  <input value={sampleWorkUrl} onChange={(e) => { setSampleWorkUrl(e.target.value); setError(null); }}
                    placeholder="YouTube, Vimeo, or portfolio" className={inputClass} />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <span className="text-[10px] text-white/12 uppercase tracking-[0.2em]">optional</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-violet-300/35 uppercase mb-2.5 ml-1">Website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yoursite.com" className={inputClass} />
                </div>

                {/* Socials */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold tracking-[0.15em] text-violet-300/25 uppercase mb-2 ml-1">X</label>
                    <input value={socialX} onChange={(e) => setSocialX(e.target.value)} placeholder="@handle"
                      className="w-full px-3.5 py-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 transition-all duration-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold tracking-[0.15em] text-violet-300/25 uppercase mb-2 ml-1">YouTube</label>
                    <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} placeholder="@channel"
                      className="w-full px-3.5 py-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 transition-all duration-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold tracking-[0.15em] text-violet-300/25 uppercase mb-2 ml-1">Instagram</label>
                    <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="@user"
                      className="w-full px-3.5 py-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 transition-all duration-300" />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/[0.08] border border-red-500/[0.15] rounded-xl" style={{ animation: "shake 0.4s ease" }}>
                    <AlertCircle size={15} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-red-300/70 leading-relaxed">{error}</p>
                  </div>
                )}

                {/* CTA — WHITE */}
                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full mt-3 py-[17px] bg-white text-black text-[15px] font-bold tracking-wide rounded-full flex items-center justify-center gap-2.5 disabled:opacity-30 cursor-pointer active:scale-[0.97] hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all">
                  {submitting ? <Loader2 size={19} className="animate-spin text-black/40" /> : <><Sparkles size={16} /> Apply as Pioneer Creator</>}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-white/10 text-center mt-7">
            Pioneer Creator badge is permanent. No fees, no contracts.
          </p>
        </div>
      </div>
    </Shell>
  );
}
