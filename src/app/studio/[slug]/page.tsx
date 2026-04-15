"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Play, Award, Globe, ExternalLink,
  Sparkles, Film, Star, Clock, Share2, Check,
} from "lucide-react";
import { supabase, getSmartPoster } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   GOLD STUDIO PAGE — Premium creator showcase
   Route: /studio/[slug]
   Loads from pioneer_creators (by name match) + their movies
   ═══════════════════════════════════════════════════════════════ */

interface StudioData {
  name: string;
  role: string;
  bio: string;
  highlight: string;
  avatar: string;
  toolkit: string[];
  works: { title: string; type: string; note: string }[];
  stats: { label: string; value: string }[];
  links: { label: string; url: string }[];
  website: string;
}

interface MovieData {
  id: string;
  title: string;
  poster: string;
  genre: string;
  year: number;
  duration: string;
  rating: number;
  description: string;
  video_url: string;
  ai_models: string[];
  upvotes_count: number;
}

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string || "").replace(/-/g, " ");

  const [studio, setStudio] = useState<StudioData | null>(null);
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      // Try multiple ways to find the creator
      let match: any = null;

      // Try 1: direct ilike match
      const { data: d1 } = await supabase
        .from("pioneer_creators")
        .select("*")
        .eq("visible", true)
        .ilike("name", `%${slug}%`)
        .limit(1);
      if (d1 && d1.length > 0) match = d1[0];

      // Try 2: load all and normalize (handles accented chars)
      if (!match) {
        const { data: all } = await supabase
          .from("pioneer_creators")
          .select("*")
          .eq("visible", true);
        const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        match = (all || []).find((c: any) => normalize(c.name) === normalize(slug));
      }

      if (!match) { setLoading(false); return; }

      // Build links
      const links: { label: string; url: string }[] = [];
      if (match.website) links.push({ label: "Website", url: match.website });
      if (match.social_instagram) links.push({ label: "Instagram", url: `https://instagram.com/${match.social_instagram.replace("@", "")}` });
      if (match.social_youtube) links.push({ label: "YouTube", url: match.social_youtube.startsWith("http") ? match.social_youtube : `https://youtube.com/${match.social_youtube}` });
      if (match.social_facebook) links.push({ label: "Facebook", url: match.social_facebook.startsWith("http") ? match.social_facebook : `https://facebook.com/${match.social_facebook}` });
      if (match.social_x) links.push({ label: "X", url: `https://x.com/${match.social_x.replace("@", "")}` });

      setStudio({
        name: match.name,
        role: match.role || "AI Creator",
        bio: match.bio || "",
        highlight: match.highlight || "",
        avatar: match.avatar_url || "",
        toolkit: match.toolkit || [],
        works: match.works || [],
        stats: match.custom_stats || [
          { label: "Tools", value: String((match.toolkit || []).length) },
          { label: "Role", value: "Creator" },
          { label: "Status", value: "Pioneer" },
        ],
        links,
        website: match.website || "",
      });

      // Load their films
      const { data: films } = await supabase
        .from("movies")
        .select("*")
        .eq("status", "approved")
        .ilike("creator_name", `%${match.name}%`)
        .order("sort_order", { ascending: true });

      if (films) {
        setMovies(films.map((f: any) => ({
          id: f.id,
          title: f.title,
          poster: getSmartPoster(f.poster_url, f.video_url, f.id),
          genre: f.genre || "",
          year: f.year || 2026,
          duration: f.duration || "",
          rating: Number(f.rating) || 0,
          description: f.description || "",
          video_url: f.video_url || "",
          ai_models: f.ai_models || [],
          upvotes_count: f.upvotes_count || 0,
        })));
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${studio?.name} on Spike AI`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Copied!");
        setTimeout(() => setShareMsg(""), 2000);
      }
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#d4a853]/30 border-t-[#d4a853] rounded-full animate-spin" />
    </div>
  );

  if (!studio) return (
    <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-white/50 mb-4">Studio not found</h1>
      <button onClick={() => router.push("/creators")} className="text-[#d4a853]/60 text-sm hover:text-[#d4a853] transition-colors cursor-pointer">&larr; Back to creators</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08080a] text-white overflow-hidden">

      {/* ═══ Gold Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, rgba(212,168,83,0.8) 0%, rgba(180,130,40,0.3) 35%, transparent 70%)", animation: "studioGlow 15s ease-in-out infinite" }} />
        <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(ellipse, rgba(212,168,83,0.5) 0%, transparent 70%)", animation: "studioGlow 20s ease-in-out infinite reverse" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
        <div className="absolute inset-0 opacity-[0.012]"
          style={{ backgroundImage: "linear-gradient(rgba(212,168,83,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 bg-[#08080a]/70 backdrop-blur-2xl border-b border-[#d4a853]/[0.08]">
        <div className="max-w-[1000px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/creators")} className="w-9 h-9 rounded-full border border-[#d4a853]/15 flex items-center justify-center text-[#d4a853]/40 hover:text-[#d4a853] hover:border-[#d4a853]/30 transition-all cursor-pointer">
              <ArrowLeft size={15} />
            </button>
            <span className="text-[14px] font-medium tracking-wide text-[#d4a853]/40">Studio</span>
          </div>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4a853]/15 text-[#d4a853]/40 text-[12px] font-medium hover:border-[#d4a853]/30 hover:text-[#d4a853]/70 transition-all cursor-pointer">
            {shareMsg ? <><Check size={12} /> {shareMsg}</> : <><Share2 size={12} /> Share</>}
          </button>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <div className="relative z-10" style={{ animation: "studioReveal 1s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="max-w-[1000px] mx-auto px-6 pt-16 md:pt-24 pb-12 text-center">

          {/* Avatar — large with gold ring */}
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-3 rounded-full opacity-70"
              style={{ background: "linear-gradient(145deg, #d4a84b, #f5d77a, #b8862d, #e8c65a)", filter: "blur(10px)" }} />
            <div className="relative w-48 h-48 md:w-60 md:h-60 rounded-full overflow-hidden border-[3px] border-[#d4a853]/40 shadow-2xl"
              style={{ boxShadow: "0 0 60px rgba(212,168,83,0.2), 0 20px 60px rgba(0,0,0,0.5)" }}>
              <img src={studio.avatar} alt={studio.name} className="w-full h-full object-cover" />
            </div>
            {/* Gold badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-5 py-2 rounded-full"
                style={{
                  background: "linear-gradient(145deg, #d4a84b, #f5d77a, #b8862d)",
                  boxShadow: "0 2px 12px rgba(180,130,40,0.5), inset 0 1px 1px rgba(255,235,170,0.5)",
                }}>
                <Award size={11} style={{ color: "#5c3d0e" }} />
                <span className="text-[9px] font-extrabold tracking-[0.3em] uppercase" style={{ color: "#5c3d0e" }}>Featured Creator</span>
              </div>
            </div>
          </div>

          {/* Name */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-3"
            style={{ background: "linear-gradient(180deg, #f5d77a 0%, #d4a853 40%, #b8862d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textShadow: "none" }}>
            {studio.name}
          </h1>
          <p className="text-[14px] md:text-[16px] tracking-[0.3em] uppercase mb-8"
            style={{ color: "rgba(212,168,83,0.4)" }}>
            {studio.role}
          </p>

          {/* Highlight quote */}
          {studio.highlight && (
            <div className="max-w-xl mx-auto mb-10 px-8 py-6 rounded-2xl border border-[#d4a853]/10 bg-[#d4a853]/[0.03]">
              <Sparkles size={14} className="mx-auto mb-3" style={{ color: "rgba(212,168,83,0.4)" }} />
              <p className="text-[15px] leading-[1.8] italic" style={{ color: "rgba(212,168,83,0.5)" }}>
                {studio.highlight}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-4 md:gap-6 mb-10">
            {studio.stats.map((stat) => (
              <div key={stat.label} className="px-6 py-4 rounded-2xl border border-[#d4a853]/10 bg-[#d4a853]/[0.02] min-w-[120px]">
                <p className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "rgba(212,168,83,0.8)" }}>{stat.value}</p>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(212,168,83,0.25)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-3">
            {studio.website && (
              <a href={studio.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-semibold tracking-wide border transition-all"
                style={{ borderColor: "rgba(212,168,83,0.2)", color: "rgba(212,168,83,0.6)" }}>
                <Globe size={13} /> Website
              </a>
            )}
            {studio.links.filter(l => l.label !== "Website").map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-medium tracking-wide border transition-all"
                style={{ borderColor: "rgba(212,168,83,0.12)", color: "rgba(212,168,83,0.4)" }}>
                <ExternalLink size={12} /> {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Gold Divider ═══ */}
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.15), transparent)" }} />
      </div>

      {/* ═══ Films Section ═══ */}
      {movies.length > 0 && (
        <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 md:py-20" style={{ animation: "studioReveal 1s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}>
          <div className="flex items-center justify-center gap-3 mb-10">
            <Film size={18} style={{ color: "rgba(212,168,83,0.4)" }} />
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "rgba(212,168,83,0.7)" }}>Films</h2>
            <span className="text-[12px] font-medium px-3 py-1 rounded-full border" style={{ borderColor: "rgba(212,168,83,0.15)", color: "rgba(212,168,83,0.35)" }}>
              {movies.length} {movies.length === 1 ? "film" : "films"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-[800px] mx-auto">
            {movies.map((movie) => (
              <div key={movie.id} onClick={() => router.push(`/movie/${movie.id}`)}
                className="group cursor-pointer rounded-xl overflow-hidden border border-[#d4a853]/[0.08] hover:border-[#d4a853]/25 transition-all duration-500 bg-[#d4a853]/[0.02]"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                <div className="relative aspect-video overflow-hidden">
                  <img src={movie.poster} alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all"
                      style={{ background: "linear-gradient(145deg, #d4a84b, #f5d77a)", boxShadow: "0 4px 20px rgba(212,168,83,0.4)" }}>
                      <Play size={18} fill="#5c3d0e" className="ml-0.5" style={{ color: "#5c3d0e" }} />
                    </div>
                  </div>
                  {movie.genre && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase"
                        style={{ background: "rgba(0,0,0,0.7)", color: "rgba(212,168,83,0.7)", border: "1px solid rgba(212,168,83,0.15)" }}>
                        {movie.genre}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-white/80 group-hover:text-white transition-colors mb-1.5 truncate">{movie.title}</h3>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: "rgba(212,168,83,0.3)" }}>
                    {movie.rating > 0 && <span className="flex items-center gap-1"><Star size={10} fill="currentColor" /> {movie.rating}</span>}
                    <span>{movie.year}</span>
                    {movie.duration && <span className="flex items-center gap-1"><Clock size={10} /> {movie.duration}</span>}
                  </div>
                  {movie.ai_models.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {movie.ai_models.slice(0, 3).map((m) => (
                        <span key={m} className="text-[9px] font-medium px-2 py-0.5 rounded-full border"
                          style={{ borderColor: "rgba(212,168,83,0.1)", color: "rgba(212,168,83,0.35)" }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Gold Divider ═══ */}
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.15), transparent)" }} />
      </div>

      {/* ═══ About ═══ */}
      <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 md:py-20" style={{ animation: "studioReveal 1s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-6" style={{ color: "rgba(212,168,83,0.3)" }}>About</h2>
          <p className="text-[15px] leading-[2] mb-12 text-left" style={{ color: "rgba(255,255,255,0.35)" }}>{studio.bio}</p>

          {/* Selected Works */}
          {studio.works.length > 0 && (
            <div className="mb-12">
              <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-6 text-center" style={{ color: "rgba(212,168,83,0.3)" }}>Selected Works</h2>
              <div className="space-y-3">
                {studio.works.map((work) => (
                  <div key={work.title} className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:border-[#d4a853]/15"
                    style={{ borderColor: "rgba(212,168,83,0.06)", background: "rgba(212,168,83,0.02)" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(212,168,83,0.06)", border: "1px solid rgba(212,168,83,0.1)" }}>
                        <Award size={16} style={{ color: "rgba(212,168,83,0.4)" }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white/70">{work.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(212,168,83,0.25)" }}>{work.type}</p>
                      </div>
                    </div>
                    <span className="text-[11px] hidden sm:block" style={{ color: "rgba(212,168,83,0.2)" }}>{work.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toolkit */}
          <div>
            <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-6 text-center" style={{ color: "rgba(212,168,83,0.3)" }}>Toolkit</h2>
            <div className="flex flex-wrap gap-2">
              {studio.toolkit.map((tool) => (
                <span key={tool} className="px-4 py-2 rounded-full text-[12px] font-medium border"
                  style={{ borderColor: "rgba(212,168,83,0.12)", color: "rgba(212,168,83,0.45)", background: "rgba(212,168,83,0.03)" }}>
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 py-10 border-t" style={{ borderColor: "rgba(212,168,83,0.06)" }}>
        <div className="text-center">
          <span className="text-[14px] font-semibold tracking-[0.2em]" style={{ color: "rgba(212,168,83,0.12)" }}>spike AI</span>
          <p className="text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.1)" }}>&copy; 2026 Spike AI. The home for AI-generated cinema.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes studioReveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes studioGlow {
          0%, 100% { opacity: 0.04; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 0.07; transform: translate(-50%, 0) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
