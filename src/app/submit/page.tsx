"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Upload, Film, Sparkles, Image, Link2,
  Type, AlignLeft, Clock, Tag, Cpu, User, CheckCircle, X, Loader2,
  Layers, Shield, Zap, Play, Eye,
} from "lucide-react";
import { supabase, checkIsAdmin } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   VIDEO EMBED HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const vid = u.searchParams.get("v") || u.pathname.split("/embed/")[1];
      return vid ? `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}?rel=0&modestbranding=1`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const vid = u.pathname.split("/").pop();
      return vid ? `https://player.vimeo.com/video/${vid}?title=0&byline=0` : null;
    }
  } catch {}
  return null;
}

function getVideoThumbnail(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtube.com")) videoId = u.searchParams.get("v") || u.pathname.split("/embed/")[1];
    if (u.hostname === "youtu.be") videoId = u.pathname.slice(1);
    // maxresdefault = highest res thumbnail YouTube offers (1280x720)
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  } catch {}
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const GENRES = [
  "Sci-Fi", "Horror", "Drama", "Thriller", "Fantasy",
  "Action", "Cyberpunk", "Romance", "Art House", "Musical",
  "Documentary", "Animation", "Comedy", "Mystery",
];

const CATEGORIES = [
  "Trending", "Sora Masterpieces", "AI Horror",
  "Sci-Fi Visions", "Award Winning", "AI Anime",
];

const AI_MODELS = [
  "Sora", "Runway Gen-4", "Runway Gen-3", "Midjourney",
  "Stable Diffusion XL", "Stable Video", "Kling AI",
  "Pika Labs", "ElevenLabs", "Other",
];

/* ═══════════════════════════════════════════════════════════════
   SUBMIT PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth-based admin detection
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const urlKey = searchParams.get("admin");
      const result = await checkIsAdmin(urlKey);
      setIsAdmin(result.isAdmin);
      setAdminChecked(true);
      // Clean URL if auth-based admin
      if (result.isAdmin && result.method === "auth" && urlKey) {
        window.history.replaceState({}, "", "/submit");
      }
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

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    category: "",
    duration: "",
    creatorName: "",
    videoUrl: "",
    posterUrl: "",
    trailerUrl: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-fill poster from YouTube thumbnail when user pastes a video URL
      // Only if poster is empty or was auto-filled (not manually overridden)
      if (field === "videoUrl") {
        const thumb = getVideoThumbnail(value);
        if (thumb && (!prev.posterUrl || prev.posterUrl.includes("img.youtube.com"))) {
          updated.posterUrl = thumb;
          setPosterError(false);
        }
      }

      return updated;
    });
    setError(null);
    if (field === "posterUrl") setPosterError(false);
  };

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  /* ── SUBMIT HANDLER ── */
  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.genre || !form.creatorName || !form.category) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!supabase) {
      setError("Database not connected. Add Supabase keys to .env.local and restart.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Admin → approved instantly | Public → pending review
    const status = isAdmin ? "approved" : "pending";

    try {
      const { error: insertError } = await supabase
        .from("movies")
        .insert({
          title: form.title,
          description: form.description,
          genre: form.genre,
          category: form.category,
          duration: form.duration || null,
          creator_name: form.creatorName,
          video_url: form.videoUrl || null,
          trailer_url: form.trailerUrl || null,
          poster_url: form.posterUrl || null,
          ai_models: selectedModels.length > 0 ? selectedModels : [],
          status,
        });

      if (insertError) throw insertError;
      setSubmitted(true);
      if (isAdmin) setPublishedLive(true);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Computed
  const videoEmbed = getVideoEmbedUrl(form.videoUrl);
  const videoThumb = getVideoThumbnail(form.videoUrl);

  /* ═════════════ SUCCESS SCREEN ═════════════ */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${publishedLive ? "bg-green-500/10 border border-green-500/30" : "bg-[#E50914]/10 border border-[#E50914]/30"}`}>
            {publishedLive ? <Zap size={40} className="text-green-400" /> : <CheckCircle size={40} className="text-[#E50914]" />}
          </div>
          <h1 className="text-3xl font-black text-white mb-3">
            {publishedLive ? "Published Live!" : "Film Submitted!"}
          </h1>
          <p className="text-gray-400 mb-2 text-lg">&ldquo;{form.title}&rdquo;</p>
          <p className="text-gray-500 text-sm mb-8">
            {publishedLive
              ? "Your film is now live on the platform. Visit the home page to see it."
              : "Your film has been submitted for review. Our team will review it within 48 hours."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false);
                setPublishedLive(false);
                setForm({ title: "", description: "", genre: "", category: "", duration: "", creatorName: "", videoUrl: "", posterUrl: "", trailerUrl: "" });
                setSelectedModels([]);
              }}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-medium"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push("/")}
              className={`px-6 py-3 text-white rounded-lg transition-all font-bold ${publishedLive ? "bg-green-600 hover:bg-green-500" : "bg-[#E50914] hover:bg-[#f6121d]"}`}
            >
              {publishedLive ? "View on Home" : "Back to Home"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════ FORM ═════════════ */
  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 bg-[#08080a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={() => router.push("/")} className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors group">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>
            <div className="h-5 w-px bg-gray-700" />
            <div className="cursor-pointer flex items-center gap-2" onClick={() => router.push("/")}>
              <img src="/mascot.png" alt="Spike" className="h-7 w-auto" />
              <span className="text-[16px] font-black tracking-tight text-white">spike</span>
              <span className="text-[16px] font-black tracking-tight text-[#E50914]" style={{ marginLeft: "-4px" }}>AI</span>
            </div>
          </div>
          {/* Admin Badge */}
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <Shield size={13} className="text-green-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-green-400">Admin Mode</span>
            </div>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-[900px] mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-12 md:pb-20">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#E50914]" />
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#E50914]">For Creators</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Submit Your Film
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl leading-relaxed">
            Share your AI-generated masterpiece with the world.
            {isAdmin ? " As admin, your films go live instantly." : " Our team will review your submission."}
          </p>
          {!supabase && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">⚠ Database not connected. Add Supabase keys to <code className="bg-white/10 px-1 rounded">.env.local</code> and restart.</p>
            </div>
          )}
        </div>

        {/* FORM */}
        <div className="space-y-8">

          {/* Film Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <Type size={14} className="text-[#E50914]" />
              Film Title <span className="text-[#E50914]">*</span>
            </label>
            <input id="film-title" name="film-title" type="text" value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Enter your film title" className="submit-input" />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <AlignLeft size={14} className="text-[#E50914]" />
              Description <span className="text-[#E50914]">*</span>
            </label>
            <textarea id="film-desc" name="film-desc" value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Describe your film — story, vision, what makes it unique..." className="submit-textarea" rows={5} />
          </div>

          {/* Genre + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                <Tag size={14} className="text-[#E50914]" />
                Genre <span className="text-[#E50914]">*</span>
              </label>
              <select id="film-genre" name="film-genre" value={form.genre} onChange={(e) => handleChange("genre", e.target.value)} className="submit-select">
                <option value="">Select genre</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                <Layers size={14} className="text-[#E50914]" />
                Category <span className="text-[#E50914]">*</span>
              </label>
              <select id="film-cat" name="film-cat" value={form.category} onChange={(e) => handleChange("category", e.target.value)} className="submit-select">
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Duration + Creator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                <Clock size={14} className="text-[#E50914]" />
                Duration
              </label>
              <input id="film-dur" name="film-dur" type="text" value={form.duration} onChange={(e) => handleChange("duration", e.target.value)} placeholder="e.g. 1h 45m or 12m" className="submit-input" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                <User size={14} className="text-[#E50914]" />
                Creator / Studio <span className="text-[#E50914]">*</span>
              </label>
              <input id="film-creator" name="film-creator" type="text" value={form.creatorName} onChange={(e) => handleChange("creatorName", e.target.value)} placeholder="Your name or studio name" className="submit-input" />
            </div>
          </div>

          {/* AI Models */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Cpu size={14} className="text-[#E50914]" />
              AI Models Used
            </label>
            <div className="flex flex-wrap gap-2">
              {AI_MODELS.map((model) => (
                <button key={model} onClick={() => toggleModel(model)} className={`px-4 py-2 text-sm rounded-lg border transition-all ${selectedModels.includes(model) ? "bg-[#E50914]/15 border-[#E50914] text-white" : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"}`}>
                  {selectedModels.includes(model) && <span className="mr-1">✓</span>}
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Media Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Link2 size={18} className="text-[#E50914]" />
              Media Links
            </h3>

            <div className="space-y-5">
              {/* Video URL + Smart Preview */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                  <Film size={14} className="text-gray-500" />
                  Film Video URL
                </label>
                <input id="film-video" name="film-video" type="url" value={form.videoUrl} onChange={(e) => handleChange("videoUrl", e.target.value)} placeholder="YouTube or Vimeo link to your full film" className="submit-input" />
                <p className="text-[11px] text-gray-600 mt-1">Paste any YouTube or Vimeo link — we auto-detect the embed</p>

                {/* Smart Video Embed Preview */}
                {videoEmbed && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.06] bg-black">
                    {showVideoPreview ? (
                      <div className="relative aspect-video">
                        <iframe src={videoEmbed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ border: "none" }} />
                        <button onClick={() => setShowVideoPreview(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative aspect-video cursor-pointer group" onClick={() => setShowVideoPreview(true)}>
                        {videoThumb && <img src={videoThumb} alt="Video thumbnail" className="w-full h-full object-cover" />}
                        {!videoThumb && <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800" />}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-[#E50914] flex items-center justify-center shadow-lg shadow-[#E50914]/30 group-hover:scale-110 transition-transform">
                            <Play size={22} fill="white" className="text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <Eye size={12} className="text-white/50" />
                          <span className="text-[11px] text-white/50 font-medium">Click to preview</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trailer URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                  <Film size={14} className="text-gray-500" />
                  Trailer URL (optional)
                </label>
                <input id="film-trailer" name="film-trailer" type="url" value={form.trailerUrl} onChange={(e) => handleChange("trailerUrl", e.target.value)} placeholder="Short trailer or teaser link" className="submit-input" />
              </div>

              {/* Poster URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                  <Image size={14} className="text-gray-500" />
                  Poster Image URL (optional)
                </label>
                <input id="film-poster" name="film-poster" type="url" value={form.posterUrl} onChange={(e) => handleChange("posterUrl", e.target.value)} placeholder="Direct link to poster image (2:3 ratio recommended)" className="submit-input" />
                <p className="text-[11px] text-gray-600 mt-1">Paste an image URL and see it instantly in the preview below</p>
              </div>
            </div>
          </div>

          {/* ═════════════ LIVE PREVIEW CARD ═════════════ */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-[#E50914]" />
              Live Preview
            </h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6">
              {/* Poster — real-time from URL */}
              <div className="w-[100px] sm:w-[140px] flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center border border-white/5 relative">
                {form.posterUrl && !posterError ? (
                  <img
                    src={form.posterUrl}
                    alt="Poster preview"
                    className="w-full h-full object-cover"
                    onError={() => setPosterError(true)}
                  />
                ) : videoThumb && !form.posterUrl ? (
                  <img src={videoThumb} alt="Auto thumbnail" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="text-center p-3">
                    <Image size={24} className="text-gray-700 mx-auto mb-2" />
                    <span className="text-[10px] text-gray-600">{posterError ? "Invalid URL" : "No poster"}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-black text-white mb-1 truncate">{form.title || "Your Film Title"}</h4>
                {form.creatorName && <p className="text-sm text-gray-400 mb-2">by {form.creatorName}</p>}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {form.genre && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-[#E50914]/10 text-[#E50914] rounded-full border border-[#E50914]/20">{form.genre}</span>
                  )}
                  {form.category && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-white/5 text-gray-400 rounded-full border border-white/10">{form.category}</span>
                  )}
                  {form.duration && (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} /> {form.duration}</span>
                  )}
                </div>
                {form.description ? (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{form.description.slice(0, 150)}{form.description.length > 150 ? "..." : ""}</p>
                ) : (
                  <p className="text-sm text-gray-700 italic">Start typing to see your description here...</p>
                )}
                {selectedModels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedModels.map((m) => <span key={m} className="ai-tag">{m}</span>)}
                  </div>
                )}
                {form.videoUrl && videoEmbed && (
                  <div className="flex items-center gap-2 mt-3">
                    <Play size={10} className="text-green-400" />
                    <span className="text-[11px] text-green-400/70 font-medium">Video detected — will embed on movie page</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <X size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button — changes for admin */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-4 text-white font-bold text-lg rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${
                isAdmin
                  ? "bg-green-600 hover:bg-green-500 shadow-green-500/20 hover:shadow-green-500/40"
                  : "bg-[#E50914] hover:bg-[#f6121d] shadow-[#E50914]/20 hover:shadow-[#E50914]/40"
              }`}
            >
              {submitting ? (
                <><Loader2 size={20} className="animate-spin" /> {isAdmin ? "Publishing..." : "Submitting..."}</>
              ) : isAdmin ? (
                <><Zap size={20} /> Publish Live Instantly</>
              ) : (
                <><Upload size={20} /> Submit Film for Review</>
              )}
            </button>
            <p className="text-center text-[11px] text-gray-600 mt-3">
              {isAdmin
                ? "Admin mode — film will appear on the home page immediately after publish."
                : "By submitting, you confirm this is your original AI-generated work."}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-8 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/mascot.png" alt="Spike" className="h-8 w-auto" />
            <span className="text-lg font-black tracking-tight text-white">spike</span>
            <span className="text-lg font-black tracking-tight text-[#E50914]" style={{ marginLeft: "-4px" }}>AI</span>
          </div>
          <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} Spike AI. The world&apos;s first streaming platform for AI-generated cinema.</p>
        </div>
      </footer>
    </div>
  );
}
