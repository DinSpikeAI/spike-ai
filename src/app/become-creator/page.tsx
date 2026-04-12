"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Loader2, Check, Globe,
  Film, AlertCircle, X,
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
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [sampleWorkUrl, setSampleWorkUrl] = useState("");

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

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-white/10 animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
      <Film size={32} className="text-white/10 mb-6" />
      <h2 className="text-2xl font-bold text-white mb-3">Sign in to apply</h2>
      <p className="text-white/30 text-sm mb-8">You need an account to become a creator.</p>
      <button onClick={() => router.push("/auth")} className="px-8 py-3 bg-white text-black font-bold text-sm rounded-full">Sign In</button>
    </div>
  );

  if (alreadyCreator) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/15 flex items-center justify-center mb-6">
        <Check size={28} className="text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">You're already a creator!</h2>
      <p className="text-white/30 text-sm mb-8">You can submit films and manage your profile.</p>
      <div className="flex gap-3">
        <button onClick={() => router.push("/submit")} className="px-6 py-3 bg-white text-black font-bold text-sm rounded-full">Submit Film</button>
        <button onClick={() => router.push("/profile")} className="px-6 py-3 bg-white/5 border border-white/10 text-white font-medium text-sm rounded-full">My Profile</button>
      </div>
    </div>
  );

  if (alreadyPending || submitted) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center mb-6">
        <Sparkles size={28} className="text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Application submitted!</h2>
      <p className="text-white/30 text-sm mb-2 max-w-sm text-center">We'll review your application and get back to you soon.</p>
      <p className="text-white/15 text-xs mb-8">Pioneer Creator spots are limited to the first 50.</p>
      <button onClick={() => router.push("/")} className="px-8 py-3 bg-white/5 border border-white/10 text-white font-medium text-sm rounded-full">Back to Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-purple-600/[0.04] blur-[150px]" />
      </div>

      <nav className="relative z-20 px-6 md:px-12 py-6">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Back</span>
        </button>
      </nav>

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 pb-20" style={{ marginLeft: "auto", marginRight: "auto" }}>
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} className="text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Become a Creator</h1>
          <p className="text-white/30 text-sm max-w-sm mx-auto">Join Spike AI as a Pioneer Creator. Share your AI films with a dedicated audience.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Your Name *</label>
            <input
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all"
              placeholder="How you want to be known"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">About You *</label>
            <textarea
              value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all resize-none"
              placeholder="Tell us about your work with AI cinema..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Link to Your Work *</label>
            <div className="relative">
              <Film size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
              <input
                value={sampleWorkUrl} onChange={(e) => setSampleWorkUrl(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all"
                placeholder="YouTube, Vimeo, or portfolio link"
              />
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Website</label>
            <div className="relative">
              <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
              <input
                value={website} onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all"
                placeholder="https://yoursite.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">X / Twitter</label>
              <input
                value={socialX} onChange={(e) => setSocialX(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all"
                placeholder="@handle"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">YouTube</label>
              <input
                value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all"
                placeholder="@channel"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Instagram</label>
              <input
                value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all"
                placeholder="@username"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit} disabled={submitting}
            className="w-full py-4 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {submitting ? "Submitting..." : "Apply as Pioneer Creator"}
          </button>

          <p className="text-center text-white/10 text-[11px]">
            Pioneer Creator badge is permanent. No fees, no contracts.
          </p>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${toast.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}>
          {toast.type === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
          <span className="text-sm">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100"><X size={12} /></button>
        </div>
      )}
    </div>
  );
}
