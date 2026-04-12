"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Sparkles, Loader2, Check, Globe,
  Film, AlertCircle, X, ArrowRight,
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
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [sampleWorkUrl, setSampleWorkUrl] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setUser(session.user);

      const { data: profile } = await supabase!
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setWebsite(profile.website || "");
        setSocialX(profile.social_x || "");
        setSocialYoutube(profile.social_youtube || "");
        setSocialInstagram(profile.social_instagram || "");
        setSampleWorkUrl(profile.sample_work_url || "");

        if (profile.user_type === "creator") setAlreadyCreator(true);
        if (profile.creator_request === "pending") setAlreadyPending(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async () => {
    if (!supabase || !user) return;
    if (!displayName.trim()) { setToast({ msg: "Name is required", type: "error" }); return; }
    if (!bio.trim()) { setToast({ msg: "Tell us about yourself", type: "error" }); return; }
    if (!sampleWorkUrl.trim()) { setToast({ msg: "Add a link to your work", type: "error" }); return; }

    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim(),
      bio: bio.trim(),
      website: website.trim(),
      social_x: socialX.trim(),
      social_youtube: socialYoutube.trim(),
      social_instagram: socialInstagram.trim(),
      sample_work_url: sampleWorkUrl.trim(),
      creator_request: "pending",
    }).eq("id", user.id);

    if (!error) {
      setSubmitted(true);
    } else {
      setToast({ msg: "Something went wrong. Try again.", type: "error" });
    }
    setSubmitting(false);
  };

  const inputClass = "w-full px-6 py-[17px] bg-white/[0.04] border border-white/[0.08] rounded-2xl text-[17px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all tracking-wide";
  const smallInputClass = "w-full px-4 py-[17px] bg-white/[0.04] border border-white/[0.08] rounded-2xl text-[15px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all tracking-wide";
  const labelClass = "block text-[11px] font-bold tracking-[0.3em] text-white/12 uppercase mb-3";

  if (loading) return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-white/10 animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center px-6">
      <div className="relative inline-block mb-12">
        <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-400/10 flex items-center justify-center backdrop-blur-sm">
          <Film size={40} className="text-purple-300/50" />
        </div>
        <div className="absolute -inset-6 rounded-[40px] bg-purple-500/[0.04] blur-2xl -z-10" />
      </div>
      <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">Sign in to apply</h1>
      <p className="text-[16px] text-white/25 mb-14">You need an account to become a creator.</p>
      <button onClick={() => router.push("/auth")} className="cta-btn px-12 py-[17px] text-black text-[15px] font-bold rounded-full flex items-center gap-3 cursor-pointer">Sign In <ArrowRight size={17} /></button>
    </div>
  );

  if (alreadyCreator) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center px-6">
      <div className="relative inline-block mb-12">
        <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-400/10 flex items-center justify-center backdrop-blur-sm">
          <Check size={40} className="text-emerald-300/50" />
        </div>
        <div className="absolute -inset-6 rounded-[40px] bg-emerald-500/[0.04] blur-2xl -z-10" />
      </div>
      <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">You&apos;re a creator</h1>
      <p className="text-[16px] text-white/25 mb-14">You can submit films and manage your profile.</p>
      <div className="flex gap-4">
        <button onClick={() => router.push("/submit")} className="cta-btn px-10 py-[17px] text-black text-[15px] font-bold rounded-full flex items-center gap-3 cursor-pointer">Submit Film <ArrowRight size={17} /></button>
        <button onClick={() => router.push("/profile")} className="px-8 py-[17px] bg-white/[0.04] border border-white/[0.08] text-white/60 text-[15px] font-medium rounded-full hover:bg-white/[0.08] transition-all cursor-pointer">My Profile</button>
      </div>
    </div>
  );

  if (alreadyPending || submitted) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center px-6">
      <div className="relative inline-block mb-12">
        <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-400/10 flex items-center justify-center backdrop-blur-sm">
          <Sparkles size={40} className="text-purple-300/50" />
        </div>
        <div className="absolute -inset-6 rounded-[40px] bg-purple-500/[0.04] blur-2xl -z-10" />
      </div>
      <h1 className="text-[44px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-5">Application sent</h1>
      <p className="text-[16px] text-white/25 mb-3">We&apos;ll review your application and get back to you soon.</p>
      <p className="text-[14px] text-white/10 mb-14">Pioneer Creator spots are limited to the first 50.</p>
      <button onClick={() => router.push("/")} className="text-white/20 text-[14px] hover:text-white/40 transition-colors cursor-pointer">&larr; Back to Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">

      {/* ═══ Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.7) 0%, rgba(99,102,241,0.3) 30%, transparent 70%)", animation: "glow 12s ease-in-out infinite" }} />
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

      {/* ═══ Main — CENTERED ═══ */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20 relative z-20">
        <div className="w-full max-w-[520px]" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>

          {/* Header */}
          <div className="text-center mb-14">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-400/10 flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={36} className="text-purple-300/50" />
              </div>
              <div className="absolute -inset-6 rounded-[36px] bg-purple-500/[0.04] blur-2xl -z-10" />
            </div>
            <h1 className="text-[40px] md:text-[48px] font-bold tracking-[-0.02em] leading-[1.08] text-white mb-4">Become a Creator</h1>
            <p className="text-[16px] text-white/20 leading-relaxed">Share your AI films with a dedicated audience.<br />Pioneer Creator spots are limited.</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Your Name *</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="How you want to be known" />
            </div>

            <div>
              <label className={labelClass}>About You *</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="Tell us about your work with AI cinema..." />
            </div>

            <div>
              <label className={labelClass}>Link to Your Work *</label>
              <input value={sampleWorkUrl} onChange={(e) => setSampleWorkUrl(e.target.value)} className={inputClass} placeholder="YouTube, Vimeo, or portfolio link" />
            </div>

            <div className="pt-4">
              <div className="h-px bg-white/[0.04] mb-8" />
              <label className={labelClass}>Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://yoursite.com" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>X / Twitter</label>
                <input value={socialX} onChange={(e) => setSocialX(e.target.value)} className={smallInputClass} placeholder="@handle" />
              </div>
              <div>
                <label className={labelClass}>YouTube</label>
                <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} className={smallInputClass} placeholder="@channel" />
              </div>
              <div>
                <label className={labelClass}>Instagram</label>
                <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} className={smallInputClass} placeholder="@username" />
              </div>
            </div>

            <div className="pt-6">
              <button onClick={handleSubmit} disabled={submitting}
                className="cta-btn w-full py-[17px] text-black text-[16px] font-bold rounded-full flex items-center justify-center gap-3 disabled:opacity-30 cursor-pointer">
                {submitting ? <Loader2 size={19} className="animate-spin text-black/40" /> : <><Sparkles size={17} /> Apply as Pioneer Creator</>}
              </button>
            </div>

            <p className="text-center text-white/10 text-[12px] pt-2">
              Pioneer Creator badge is permanent. No fees, no contracts.
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${toast.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}
          style={{ animation: "reveal 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
          {toast.type === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
          <span className="text-sm font-medium">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 cursor-pointer"><X size={12} /></button>
        </div>
      )}
    </div>
  );
}
