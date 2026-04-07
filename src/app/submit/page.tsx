"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Upload, Film, Sparkles, Image, Link2,
  Type, AlignLeft, Clock, Tag, Cpu, User, CheckCircle, X, Loader2,
  Layers, Shield, Zap, Play, Eye,
} from "lucide-react";
import { supabase, checkIsAdmin } from "@/lib/supabase";

/* ═══ Helpers ═══ */
function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) { const v = u.searchParams.get("v") || u.pathname.split("/embed/")[1]; return v ? `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1` : null; }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}?rel=0&modestbranding=1`;
    if (u.hostname.includes("vimeo.com")) { const v = u.pathname.split("/").pop(); return v ? `https://player.vimeo.com/video/${v}?title=0&byline=0` : null; }
  } catch {} return null;
}
function getVideoThumbnail(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url); let vid: string | null = null;
    if (u.hostname.includes("youtube.com")) vid = u.searchParams.get("v") || u.pathname.split("/embed/")[1];
    if (u.hostname === "youtu.be") vid = u.pathname.slice(1);
    if (vid) return `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`;
  } catch {} return null;
}

const GENRES = ["Sci-Fi","Horror","Drama","Thriller","Fantasy","Action","Cyberpunk","Romance","Art House","Musical","Documentary","Animation","Comedy","Mystery"];
const CATEGORIES = ["Trending","Sora Masterpieces","AI Horror","Sci-Fi Visions","Award Winning","AI Anime"];
const AI_MODELS = ["Runway Gen-4","Runway Gen-3","Midjourney","Stable Diffusion XL","Stable Video","Kling AI","Pika Labs","ElevenLabs","Other"];

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const urlKey = searchParams.get("admin");
      const result = await checkIsAdmin(urlKey);
      setIsAdmin(result.isAdmin); setAdminChecked(true);
      if (result.isAdmin && result.method === "auth" && urlKey) window.history.replaceState({}, "", "/submit");
    }
    checkAdmin();
  }, [searchParams]);

  const [submitted, setSubmitted] = useState(false);
  const [publishedLive, setPublishedLive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [posterError, setPosterError] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  const [form, setForm] = useState({ title: "", description: "", genre: "", category: "", duration: "", creatorName: "", videoUrl: "", posterUrl: "", trailerUrl: "" });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "videoUrl") { const t = getVideoThumbnail(value); if (t && (!prev.posterUrl || prev.posterUrl.includes("img.youtube.com"))) { updated.posterUrl = t; setPosterError(false); } }
      return updated;
    });
    setError(null);
    if (field === "posterUrl") setPosterError(false);
  };

  const toggleModel = (m: string) => setSelectedModels((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.genre || !form.creatorName || !form.category) { setError("Please fill in all required fields."); return; }
    if (!supabase) { setError("Database not connected."); return; }
    setSubmitting(true); setError(null);
    const status = isAdmin ? "approved" : "pending";
    try {
      const { error: e } = await supabase.from("movies").insert({
        title: form.title, description: form.description, genre: form.genre, category: form.category,
        duration: form.duration || null, creator_name: form.creatorName, video_url: form.videoUrl || null,
        trailer_url: form.trailerUrl || null, poster_url: form.posterUrl || null,
        ai_models: selectedModels.length > 0 ? selectedModels : [], status,
        creator_id: (await supabase.auth.getSession()).data.session?.user?.id || null,
      });
      if (e) throw e;
      setSubmitted(true); if (isAdmin) setPublishedLive(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const slug = form.creatorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          await supabase.from("profiles").update({ is_creator: true, creator_slug: slug || session.user.id }).eq("id", session.user.id);
        }
      } catch {}
    } catch (err: any) { setError(err.message || "Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const videoEmbed = getVideoEmbedUrl(form.videoUrl);
  const videoThumb = getVideoThumbnail(form.videoUrl);

  /* ═══ SUCCESS ═══ */
  if (submitted) return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center relative overflow-hidden px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[25%] left-[50%] -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, transparent 70%)" }} />
      </div>
      <div className="text-center relative z-10" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${publishedLive ? "bg-emerald-500/15 border border-emerald-400/20" : "bg-indigo-500/15 border border-indigo-400/20"}`}>
          {publishedLive ? <Zap size={40} className="text-emerald-400/70" /> : <CheckCircle size={40} className="text-indigo-300/70" />}
        </div>
        <h1 className="text-[42px] md:text-[52px] font-bold tracking-[-0.02em] mb-4">{publishedLive ? "Published!" : "Submitted!"}</h1>
        <p className="text-[18px] text-white/40 mb-2">&ldquo;{form.title}&rdquo;</p>
        <p className="text-[15px] text-white/20 mb-12 max-w-sm mx-auto">{publishedLive ? "Your film is now live on spike AI." : "Our team will review your submission within 48 hours."}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => { setSubmitted(false); setPublishedLive(false); setForm({ title:"",description:"",genre:"",category:"",duration:"",creatorName:"",videoUrl:"",posterUrl:"",trailerUrl:"" }); setSelectedModels([]); }}
            className="px-8 py-[14px] text-[14px] font-semibold text-white/40 border border-white/[0.08] hover:border-white/[0.15] rounded-full hover:bg-white/[0.02] transition-all cursor-pointer">Submit Another</button>
          <button onClick={() => router.push("/")} className="cta-btn px-8 py-[14px] text-black text-[14px] font-bold rounded-full cursor-pointer">
            {publishedLive ? "View Home" : "Back Home"}
          </button>
        </div>
      </div>
      <style jsx>{`.cta-btn{background:linear-gradient(180deg,#fff 0%,#e8e8eb 100%);box-shadow:0 4px 24px rgba(255,255,255,0.08),0 0 60px rgba(99,102,241,0.06),inset 0 1px 0 rgba(255,255,255,0.9)} @keyframes reveal{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );

  /* ═══ FORM ═══ */
  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.3) 40%, transparent 70%)", animation: "glow 14s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[900px] mx-auto px-8 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer"><ArrowLeft size={15} /></button>
            <span className="text-[17px] font-semibold tracking-[0.2em] text-white/25 cursor-pointer" onClick={() => router.push("/")}>spike AI</span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Shield size={13} className="text-emerald-400" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-400">Admin</span>
            </div>
          )}
        </div>
      </nav>

      {/* ═══ CENTERED CONTENT ═══ */}
      <div className="max-w-[900px] mx-auto px-8 md:px-12 pt-36 md:pt-40 pb-20 relative z-10" style={{ animation: "reveal 0.6s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Header — centered */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/[0.08] border border-indigo-400/[0.12] text-[11px] font-bold tracking-[0.25em] text-indigo-300/60 uppercase mb-8">
            <Sparkles size={13} /> For Creators
          </div>
          <h1 className="text-[46px] md:text-[60px] font-bold tracking-[-0.02em] leading-[1.05] mb-5">
            Submit your{" "}
            <span className="bg-gradient-to-r from-indigo-300/60 to-violet-400/50 bg-clip-text text-transparent">film.</span>
          </h1>
          <p className="text-[17px] text-white/20 max-w-lg mx-auto leading-relaxed">
            Share your AI-generated masterpiece with the world.
            {isAdmin ? " As admin, your films go live instantly." : " Our team will review your submission."}
          </p>
        </div>

        {/* ═══ TWO COLUMN LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

          {/* ═══ LEFT — Form Fields ═══ */}
          <div className="space-y-8">

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase mb-3 ml-1">Film Title <span className="text-indigo-400/60">*</span></label>
              <input type="text" value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Enter your film title"
                className="s-input" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase mb-3 ml-1">Description <span className="text-indigo-400/60">*</span></label>
              <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Describe your film — story, vision, what makes it unique..." rows={5}
                className="s-input resize-none" />
            </div>

            {/* Genre + Category — side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase mb-3 ml-1">Genre <span className="text-indigo-400/60">*</span></label>
                <select value={form.genre} onChange={(e) => handleChange("genre", e.target.value)} className="s-input">
                  <option value="">Select genre</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase mb-3 ml-1">Category <span className="text-indigo-400/60">*</span></label>
                <select value={form.category} onChange={(e) => handleChange("category", e.target.value)} className="s-input">
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Duration + Creator — side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase mb-3 ml-1">Duration</label>
                <input type="text" value={form.duration} onChange={(e) => handleChange("duration", e.target.value)} placeholder="e.g. 1h 45m" className="s-input" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase mb-3 ml-1">Creator / Studio <span className="text-indigo-400/60">*</span></label>
                <input type="text" value={form.creatorName} onChange={(e) => handleChange("creatorName", e.target.value)} placeholder="Your name or studio" className="s-input" />
              </div>
            </div>

            {/* AI Models — interactive pills */}
            <div>
              <label className="block text-[11px] font-bold tracking-[0.3em] text-white/20 uppercase mb-4 ml-1">AI Models Used</label>
              <div className="flex flex-wrap gap-2">
                {AI_MODELS.map((model) => (
                  <button key={model} onClick={() => toggleModel(model)}
                    className={`px-5 py-3 text-[13px] font-semibold rounded-full border-2 transition-all cursor-pointer ${
                      selectedModels.includes(model)
                        ? "bg-indigo-500/25 border-indigo-400/40 text-indigo-200 shadow-lg shadow-indigo-500/15"
                        : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:border-white/[0.15] hover:text-white/50 hover:bg-white/[0.05]"
                    }`}>
                    {selectedModels.includes(model) && <span className="mr-1.5">✓</span>}
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Media Links */}
            <div>
              <h3 className="text-[12px] font-bold tracking-[0.3em] text-white/25 uppercase mb-6 ml-1">Media Links</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.2em] text-white/15 uppercase mb-2.5 ml-1">Film Video URL</label>
                  <input type="url" value={form.videoUrl} onChange={(e) => handleChange("videoUrl", e.target.value)} placeholder="YouTube or Vimeo link" className="s-input" />
                  <p className="text-[11px] text-white/10 mt-2 ml-1">We auto-detect the embed from YouTube and Vimeo</p>
                  {videoEmbed && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/[0.06]">
                      {showVideoPreview ? (
                        <div className="relative aspect-video">
                          <iframe src={videoEmbed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ border: "none" }} />
                          <button onClick={() => setShowVideoPreview(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="relative aspect-video cursor-pointer group" onClick={() => setShowVideoPreview(true)}>
                          {videoThumb ? <img src={videoThumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-900" />}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"><Play size={22} fill="black" className="text-black ml-1" /></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.2em] text-white/15 uppercase mb-2.5 ml-1">Trailer URL <span className="text-white/10">(optional)</span></label>
                  <input type="url" value={form.trailerUrl} onChange={(e) => handleChange("trailerUrl", e.target.value)} placeholder="Short trailer or teaser" className="s-input" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.2em] text-white/15 uppercase mb-2.5 ml-1">Poster Image URL <span className="text-white/10">(optional)</span></label>
                  <input type="url" value={form.posterUrl} onChange={(e) => handleChange("posterUrl", e.target.value)} placeholder="Direct link to poster image (2:3)" className="s-input" />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-5 bg-red-500/[0.04] border border-red-500/[0.08] rounded-2xl">
                <X size={16} className="text-red-400/50 flex-shrink-0 mt-0.5" />
                <p className="text-[14px] text-red-300/50">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button onClick={handleSubmit} disabled={submitting}
                className={`submit-hero-btn w-full py-[18px] text-[16px] font-bold rounded-full flex items-center justify-center gap-3 disabled:opacity-40 cursor-pointer transition-all active:scale-[0.97] ${isAdmin ? "admin-btn" : "user-btn"}`}>
                {submitting ? <><Loader2 size={20} className="animate-spin" /> {isAdmin ? "Publishing..." : "Submitting..."}</>
                  : isAdmin ? <><Zap size={20} /> Publish Live Instantly</>
                  : <><Upload size={20} /> Submit Film for Review</>}
              </button>
              <p className="text-center text-[11px] text-white/10 mt-4">
                {isAdmin ? "Admin mode — film goes live immediately." : "By submitting, you confirm this is your original AI-generated work."}
              </p>
            </div>
          </div>

          {/* ═══ RIGHT — Sticky Live Preview ═══ */}
          <div className="lg:sticky lg:top-20 hidden lg:block">
            <p className="text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-4 ml-1">Live Preview</p>
            <div className="preview-card rounded-2xl overflow-hidden">
              {/* Poster */}
              <div className="relative aspect-[2/3] bg-gradient-to-br from-zinc-900 to-zinc-800">
                {form.posterUrl && !posterError ? (
                  <img src={form.posterUrl} alt="" className="w-full h-full object-cover" onError={() => setPosterError(true)} />
                ) : videoThumb ? (
                  <img src={videoThumb} alt="" className="w-full h-full object-cover opacity-50" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Image size={32} className="text-white/10" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
                {form.genre && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white/70">{form.genre}</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-5 -mt-10 relative z-10">
                <h4 className="text-[18px] font-bold truncate mb-1">{form.title || "Your Film Title"}</h4>
                {form.creatorName && <p className="text-[13px] text-white/25 mb-3">by {form.creatorName}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.category && <span className="px-2.5 py-0.5 text-[10px] font-medium bg-white/[0.04] text-white/25 rounded-full border border-white/[0.06]">{form.category}</span>}
                  {form.duration && <span className="text-[11px] text-white/15 flex items-center gap-1"><Clock size={10} />{form.duration}</span>}
                </div>
                {form.description ? (
                  <p className="text-[12px] text-white/15 leading-relaxed line-clamp-3">{form.description.slice(0, 120)}{form.description.length > 120 ? "..." : ""}</p>
                ) : (
                  <p className="text-[12px] text-white/8 italic">Start typing to see your description...</p>
                )}
                {selectedModels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedModels.map((m) => <span key={m} className="text-[9px] font-bold text-indigo-300/40 bg-indigo-500/[0.08] px-2 py-0.5 rounded-full border border-indigo-400/10 uppercase tracking-wider">{m}</span>)}
                  </div>
                )}
                {videoEmbed && (
                  <div className="flex items-center gap-2 mt-3"><Play size={10} className="text-emerald-400/60" /><span className="text-[11px] text-emerald-400/40 font-medium">Video detected</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-white/[0.03]">
        <div className="text-center"><span className="text-[14px] font-semibold tracking-[0.2em] text-white/[0.04]">spike AI</span></div>
      </footer>

      <style jsx>{`
        .s-input {
          width: 100%;
          padding: 18px 22px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          color: white;
          font-size: 16px;
          letter-spacing: 0.02em;
          transition: all 0.3s ease;
          outline: none;
          backdrop-filter: blur(12px);
        }
        .s-input::placeholder { color: rgba(255,255,255,0.1); }
        .s-input:focus {
          border-color: rgba(99,102,241,0.4);
          background: rgba(255,255,255,0.04);
          box-shadow: 0 0 30px rgba(99,102,241,0.08);
        }
        .s-input option { background: #111; color: white; }
        .preview-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 100px rgba(99,102,241,0.05);
        }
        .admin-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 24px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .admin-btn:hover:not(:disabled) { box-shadow: 0 8px 40px rgba(99,102,241,0.4); transform: translateY(-1px); }
        .user-btn {
          background: linear-gradient(180deg, #fff 0%, #e8e8eb 100%);
          color: black;
          box-shadow: 0 4px 24px rgba(255,255,255,0.08), 0 0 60px rgba(99,102,241,0.04), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .user-btn:hover:not(:disabled) { box-shadow: 0 8px 40px rgba(255,255,255,0.12); transform: translateY(-1px); }
        .cta-btn{background:linear-gradient(180deg,#fff 0%,#e8e8eb 100%);box-shadow:0 4px 24px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.9)}
        @keyframes reveal{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:0.05;transform:translate(-50%,0) scale(1)}50%{opacity:0.08;transform:translate(-50%,0) scale(1.1)}}
      `}</style>
    </div>
  );
}
