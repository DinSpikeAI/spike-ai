"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, Check, AlertCircle, ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   BECOME CREATOR — Clean, spacious one-step registration
   Matches the spike_apply_en.html design language
   ═══════════════════════════════════════════════════════════════ */

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

const AI_TOOLS = [
  "Runway Gen-4", "Kling AI", "Sora", "Pika Labs", "Hailuo", "Midjourney",
  "ElevenLabs", "Seedance", "Veo", "Luma", "Google Gemini", "Other",
];

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCreator, setAlreadyCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [sampleWorkUrl, setSampleWorkUrl] = useState("");
  const [country, setCountry] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
        setSocialYoutube(profile.social_youtube || "");
        setSampleWorkUrl(profile.sample_work_url || "");
        if (profile.user_type === "creator") setAlreadyCreator(true);
      } else {
        setDisplayName(session.user.user_metadata?.full_name || "");
      }
      setLoading(false);
    }
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setDisplayName(prev => prev || session.user.user_metadata?.full_name || "");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/become-creator` },
      });
    } catch {
      setError("Sign in failed.");
      setGoogleLoading(false);
    }
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async () => {
    if (!supabase || !user) return;
    if (!displayName.trim()) { setError("Please enter your name."); return; }
    if (!sampleWorkUrl.trim()) { setError("Please add a link to your work."); return; }
    if (selectedTools.length === 0) { setError("Please select at least one AI tool."); return; }
    if (!termsAccepted) { setError("Please accept the Creator Agreement."); return; }
    setSubmitting(true);
    setError(null);
    const { error: e } = await supabase.from("profiles").update({
      display_name: displayName.trim(), bio: bio.trim(), website: website.trim(),
      social_youtube: socialYoutube.trim(), sample_work_url: sampleWorkUrl.trim(),
      creator_request: "pending",
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
            social: socialYoutube.trim(), bio: bio.trim(),
            country: country.trim(), ai_tools: selectedTools,
          }),
        });
      } catch {}
    } else { setError("Something went wrong. Please try again."); }
    setSubmitting(false);
  };

  // ─── Loading ───
  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-white/10 animate-spin" />
    </div>
  );

  // ─── Already Creator ───
  if (alreadyCreator) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
        <Check size={28} className="text-white/40" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3 text-center">You&apos;re already a creator</h1>
      <p className="text-white/30 text-[15px] mb-10">Start uploading your AI films.</p>
      <button onClick={() => router.push("/submit")}
        className="px-10 py-4 bg-white text-black text-[14px] font-bold rounded-full cursor-pointer hover:bg-white/90 transition-all">
        Submit Film
      </button>
    </div>
  );

  // ─── Success ───
  if (submitted) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
        <span className="text-2xl">&#10003;</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4 text-center">Application Received</h1>
      <p className="text-white/35 text-[15px] text-center max-w-md leading-relaxed mb-3">
        Thanks for applying to Spike AI. We review every application personally and will get back to you within 48 hours.
      </p>
      <p className="text-white/20 text-[13px] mb-10">- Dean Moshe, Founder of Spike AI</p>
      <button onClick={() => router.push("/")}
        className="text-white/20 text-[14px] hover:text-white/40 transition-colors cursor-pointer">
        &larr; Back to home
      </button>
    </div>
  );

  // ─── Main Form ───
  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-[640px] mx-auto px-6 py-16 md:py-20">

        {/* Logo */}
        <div className="text-center mb-12">
          <span className="text-[20px] font-semibold tracking-[0.18em] text-white/50"
            style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            spike AI
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[32px] md:text-[38px] font-extrabold text-white tracking-tight mb-4">Join as Creator</h1>
        <p className="text-[15px] text-white/35 leading-relaxed mb-10 max-w-lg">
          Spike AI is the home for AI-generated cinema. We give creators a dedicated space to showcase their work, reach new audiences, and get recognized. Free to join, free to upload.
        </p>

        {/* Google Sign In (if not signed in) */}
        {!user && (
          <div className="mb-10">
            <button onClick={handleGoogleSignIn} disabled={googleLoading}
              className="w-full py-4 bg-white/[0.06] border border-white/[0.1] text-white/80 text-[15px] font-medium rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.1] hover:border-white/[0.16] transition-all disabled:opacity-50">
              {googleLoading ? <Loader2 size={18} className="animate-spin text-white/40" /> : <><GoogleIcon className="w-5 h-5" /> Sign in with Google to apply</>}
            </button>
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-white/15 uppercase tracking-[0.15em]">fill your details below</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
          </div>
        )}

        {/* Signed in badge */}
        {user && (
          <div className="flex items-center gap-3 mb-10 px-4 py-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            <span className="text-[14px] text-white/60">{user.user_metadata?.full_name || user.email}</span>
            <span className="text-[12px] text-white/20 ml-auto">signed in</span>
          </div>
        )}

        {/* ═══ Form Fields ═══ */}
        <div className="space-y-7">

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Your Name / Studio Name <span className="text-white/40">*</span></label>
            <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
              placeholder="e.g. Daniel Overton or Ovey Studios"
              className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.15] transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Your Best AI Film (YouTube or Vimeo) <span className="text-white/40">*</span></label>
            <input value={sampleWorkUrl} onChange={(e) => { setSampleWorkUrl(e.target.value); setError(null); }}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.15] transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">YouTube Channel or Social Link</label>
            <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.15] transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Tell Us About Your Work</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
              placeholder="What kind of AI films do you make? What's your creative vision?"
              className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.15] transition-all resize-none" />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United Kingdom"
              className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.15] transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Website / Portfolio (optional)</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[14px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.15] transition-all" />
          </div>

          {/* AI Tools Grid */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-4">AI Tools You Use <span className="text-white/40">*</span></label>
            <div className="grid grid-cols-3 gap-2.5">
              {AI_TOOLS.map((tool) => (
                <button key={tool} onClick={() => toggleTool(tool)} type="button"
                  className={`py-3 px-3 rounded-lg border text-[12px] font-medium text-center cursor-pointer transition-all select-none ${
                    selectedTools.includes(tool)
                      ? "border-white/30 bg-white/[0.1] text-white"
                      : "border-white/[0.06] bg-white/[0.03] text-white/40 hover:border-white/[0.15] hover:text-white/70"
                  }`}>
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] my-2" />

          {/* Creator Agreement */}
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-6">
            <h3 className="text-[14px] font-semibold text-white/60 mb-4">Creator Agreement</h3>
            <p className="text-[12px] text-white/25 leading-relaxed mb-2.5">By submitting this application, you confirm that:</p>
            <div className="space-y-2.5 text-[12px] text-white/30 leading-relaxed">
              <p>1. You own or have the rights to all content you upload to Spike AI.</p>
              <p>2. Your films do not contain deepfakes of real people without their consent.</p>
              <p>3. You grant Spike AI a non-exclusive license to display, promote, and distribute your content on the platform and associated marketing channels.</p>
              <p>4. You will tag all AI tools used in the creation of each film.</p>
              <p>5. Spike AI may feature your work in platform showcases, social media, and creator spotlights.</p>
            </div>
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAccepted}
              onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
              className="mt-1 w-4 h-4 accent-white flex-shrink-0 cursor-pointer" />
            <span className="text-[13px] text-white/40 leading-relaxed">
              I have read and agree to the Creator Agreement above, the{" "}
              <a href="/terms" target="_blank" className="text-white/60 underline hover:text-white/80">Terms of Service</a>, and the{" "}
              <a href="/community-guidelines" target="_blank" className="text-white/60 underline hover:text-white/80">Community Guidelines</a>.
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/[0.06] border border-red-500/[0.1] rounded-xl">
              <AlertCircle size={15} className="text-red-400/60 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-300/60">{error}</p>
            </div>
          )}

          {/* Submit */}
          {user ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-4 bg-white text-black text-[15px] font-bold rounded-xl flex items-center justify-center gap-2.5 disabled:opacity-30 cursor-pointer hover:bg-white/90 transition-all">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : "Submit Application"}
            </button>
          ) : (
            <p className="text-center text-[13px] text-white/20 py-2">Sign in with Google above to submit your application.</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-white/[0.04]">
          <p className="text-[11px] text-white/15">&copy; 2026 Spike AI. The home for AI-generated cinema.</p>
          <div className="flex justify-center gap-4 mt-3 text-[11px] text-white/10">
            <a href="/terms" className="hover:text-white/25 transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white/25 transition-colors">Privacy</a>
            <a href="/community-guidelines" className="hover:text-white/25 transition-colors">Guidelines</a>
          </div>
        </div>

      </div>
    </div>
  );
}
