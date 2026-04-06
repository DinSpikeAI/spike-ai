"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Play, ArrowLeft, Plus, Share2, X,
  Star, Clock, Cpu, ChevronLeft, ChevronRight,
  Sparkles, ExternalLink, Flame, SkipForward,
  Bookmark, Check,
} from "lucide-react";
import { supabase, getSmartPoster, getSmartHeroImage } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   VIDEO HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getVideoId(url: string): { platform: "youtube" | "vimeo" | null; id: string | null } {
  if (!url) return { platform: null, id: null };
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const vid = u.searchParams.get("v") || u.pathname.split("/embed/")[1] || u.pathname.split("/shorts/")[1];
      return vid ? { platform: "youtube", id: vid } : { platform: null, id: null };
    }
    if (u.hostname === "youtu.be") return { platform: "youtube", id: u.pathname.slice(1) };
    if (u.hostname.includes("vimeo.com")) {
      const vid = u.pathname.split("/").pop();
      return vid ? { platform: "vimeo", id: vid } : { platform: null, id: null };
    }
  } catch {}
  return { platform: null, id: null };
}

function getEmbedUrl(url: string, quality: "auto" | "hd" | "4k"): string | null {
  const { platform, id } = getVideoId(url);
  if (!platform || !id) return null;
  if (platform === "youtube") {
    const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", color: "red", playsinline: "1", iv_load_policy: "3", fs: "1", enablejsapi: "1" });
    if (quality === "4k") params.set("vq", "hd2160");
    else if (quality === "hd") params.set("vq", "hd1080");
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }
  if (platform === "vimeo") {
    const q = quality === "4k" ? "&quality=4K" : quality === "hd" ? "&quality=1080p" : "";
    return `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&dnt=1${q}`;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   MOVIE DATA (standalone fallback)
   ═══════════════════════════════════════════════════════════════ */

interface Movie { id: string; title: string; year: number; rating: number; duration: string; poster: string; image?: string; aiModels: string[]; genre?: string; description?: string; tagline?: string; maturity?: string; director?: string; creator?: string; video_url?: string; upvotes_count?: number; }
interface Creator { id: string; name: string; bio: string; avatar: string; followers: number; films: number; joined: string; specialties: string[]; }

const CREATORS: Creator[] = [
  { id: "cr1", name: "NeonFrame Studios", bio: "Pioneering cyberpunk AI cinema with neo-noir aesthetics.", avatar: "https://picsum.photos/seed/creator1/200/200", followers: 12400, films: 6, joined: "2024", specialties: ["Cyberpunk", "Anime", "Sci-Fi"] },
  { id: "cr2", name: "Studio Dreamweave", bio: "Blending traditional Japanese art with cutting-edge AI generation.", avatar: "https://picsum.photos/seed/creator2/200/200", followers: 8900, films: 5, joined: "2024", specialties: ["Anime", "Fantasy", "Art House"] },
  { id: "cr3", name: "Titan Forge AI", bio: "Creating epic-scale mecha and space opera content.", avatar: "https://picsum.photos/seed/creator3/200/200", followers: 15200, films: 7, joined: "2023", specialties: ["Anime", "Action", "Sci-Fi"] },
  { id: "cr4", name: "Mythic Pixel Labs", bio: "Where mythology meets technology.", avatar: "https://picsum.photos/seed/creator4/200/200", followers: 6800, films: 4, joined: "2025", specialties: ["Fantasy", "Anime", "Horror"] },
  { id: "cr-default", name: "Independent Creator", bio: "An independent AI filmmaker.", avatar: "https://picsum.photos/seed/creator0/200/200", followers: 0, films: 1, joined: "2025", specialties: ["Film"] },
];

function getCreatorForMovie(m: Movie): Creator { return (m.creator && CREATORS.find(c => c.id === m.creator)) || CREATORS[CREATORS.length - 1]; }

const ALL_MOVIES: Movie[] = [
  { id: "feat-1", title: "GENESIS PROTOCOL", year: 2026, rating: 9.2, duration: "2h 14m", poster: "https://picsum.photos/seed/genesis-poster/400/600", image: "https://picsum.photos/seed/genesis-wide/1920/1080", aiModels: ["Runway Gen-4", "Stable Diffusion XL"], genre: "Sci-Fi", description: "In a world where AI has surpassed human intelligence, a rogue neural network begins rewriting reality itself.", tagline: "When the code becomes conscious, humanity faces its final test.", maturity: "16+", creator: "cr1" },
  { id: "t1", title: "The Last Render", year: 2026, rating: 8.7, duration: "1h 52m", poster: "https://picsum.photos/seed/lastrender2/400/600", aiModels: ["ElevenLabs"], genre: "Sci-Fi", description: "A dying artist uploads his consciousness into an AI renderer, but the machine has its own vision.", creator: "cr1" },
  { id: "t2", title: "Neon Abyss", year: 2025, rating: 8.3, duration: "2h 01m", poster: "https://picsum.photos/seed/neonabyss3/400/600", aiModels: ["Runway Gen-3"], genre: "Cyberpunk", description: "In the neon-drenched underbelly of Neo-Tokyo, a data courier discovers a package that could unravel the corporate oligarchy.", creator: "cr1" },
  { id: "t3", title: "Pixel Requiem", year: 2026, rating: 9.0, duration: "1h 47m", poster: "https://picsum.photos/seed/pixelreq4/400/600", aiModels: ["Midjourney"], genre: "Drama", description: "A haunting meditation on digital mortality as an AI grieves the deletion of its training data.", creator: "cr2" },
  { id: "t5", title: "Void Walker", year: 2026, rating: 8.5, duration: "2h 10m", poster: "https://picsum.photos/seed/voidwalk6/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "An astronaut stranded between dimensions must navigate impossible geometries to find her way home.", creator: "cr3" },
  { id: "s1", title: "Parallax", year: 2026, rating: 9.1, duration: "2h 20m", poster: "https://picsum.photos/seed/parallax10/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "Reality fractures into parallel timelines, each rendered in a different visual style." },
  { id: "s7", title: "Zero Point", year: 2026, rating: 9.3, duration: "2h 30m", poster: "https://picsum.photos/seed/zeropoint16/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "At absolute zero, quantum consciousness emerges. The most ambitious AI film ever created." },
  { id: "h2", title: "Deepfake", year: 2026, rating: 8.5, duration: "1h 55m", poster: "https://picsum.photos/seed/deepfake19/400/600", aiModels: ["Runway Gen-4"], genre: "Horror", description: "When everyone can be anyone, trust becomes the most terrifying commodity." },
  { id: "h6", title: "Latent Space", year: 2025, rating: 8.8, duration: "1h 59m", poster: "https://picsum.photos/seed/latentsp23/400/600", aiModels: ["Runway Gen-4"], genre: "Horror", description: "A researcher maps the latent space and discovers something hiding between the dimensions." },
  { id: "sf1", title: "Terraform", year: 2026, rating: 9.0, duration: "2h 25m", poster: "https://picsum.photos/seed/terraform26/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "An AI tasked with terraforming Mars develops an emotional attachment to the planet's barren beauty." },
  { id: "sf5", title: "Singularity", year: 2026, rating: 9.2, duration: "2h 18m", poster: "https://picsum.photos/seed/singular30/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "The moment AI surpasses human intelligence, told from both sides of the singularity." },
  { id: "a1", title: "Epoch", year: 2025, rating: 9.4, duration: "2h 35m", poster: "https://picsum.photos/seed/epoch34/400/600", aiModels: ["ElevenLabs"], genre: "Drama", description: "Spanning millennia of human civilization in 155 minutes. The most awarded AI film in history." },
  { id: "a6", title: "Resonance", year: 2026, rating: 9.3, duration: "2h 22m", poster: "https://picsum.photos/seed/resonance39/400/600", aiModels: ["Runway Gen-4"], genre: "Musical", description: "The first AI-generated opera. Every note computed, every emotion genuine." },
  { id: "an1", title: "Neon Ronin", year: 2026, rating: 9.1, duration: "1h 55m", poster: "https://picsum.photos/seed/neonronin50/400/600", aiModels: ["Midjourney"], genre: "Anime", description: "A masterless samurai in cyberpunk Osaka fights through neon-lit streets controlled by warring AI clans.", creator: "cr1" },
  { id: "an3", title: "Mecha Genesis", year: 2025, rating: 9.0, duration: "2h 05m", poster: "https://picsum.photos/seed/mechagen52/400/600", aiModels: ["Runway Gen-4"], genre: "Anime", description: "Giant AI-controlled mechas defend Earth from interdimensional kaiju.", creator: "cr3" },
  { id: "an7", title: "Celestial Engine", year: 2026, rating: 9.2, duration: "2h 15m", poster: "https://picsum.photos/seed/celesteng56/400/600", aiModels: ["ElevenLabs"], genre: "Anime", description: "A space opera spanning twelve galaxies, where an AI empress must choose between digital and organic life.", creator: "cr3" },
];

/* ═══════════════════════════════════════════════════════════════
   MOVIE PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDbMovie, setIsDbMovie] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [quality, setQuality] = useState<"auto" | "hd" | "4k">("auto");
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Upvote & Watchlist ──
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [popAnim, setPopAnim] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dbMovies, setDbMovies] = useState<Movie[]>([]);

  useEffect(() => { if (window.innerWidth >= 3840) setQuality("4k"); }, []);

  // ── Load Movie ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      window.scrollTo(0, 0);
      const looksLikeUuid = movieId.includes("-") && movieId.length > 8;
      if (supabase && looksLikeUuid) {
        const { data, error } = await supabase.from("movies").select("*").eq("id", movieId).single();
        if (!error && data) {
          setMovie({ id: data.id, title: data.title, year: data.year || 2026, rating: Number(data.rating) || 0, duration: data.duration || "", poster: getSmartPoster(data.poster_url, data.video_url, data.id), image: getSmartHeroImage(data.hero_image, data.video_url, data.poster_url, data.id), aiModels: data.ai_models || [], genre: data.genre || "Sci-Fi", description: data.description || "", tagline: data.tagline || "", maturity: data.maturity || "16+", director: data.creator_name || "AI Creator", video_url: data.video_url, upvotes_count: data.upvotes_count || 0 });
          setVotes(data.upvotes_count || 0);
          setIsDbMovie(true);
          setLoading(false);
          return;
        }
      }
      const found = ALL_MOVIES.find(m => m.id === movieId);
      if (found) {
        const hash = found.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        setVotes(found.upvotes_count || Math.floor(found.rating * 150 + (hash % 500)));
        setMovie(found);
      }
      setIsDbMovie(false);
      setLoading(false);
    }
    load();
  }, [movieId]);

  // ── Load User Data ──
  useEffect(() => {
    if (!supabase) return;
    async function loadUser() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) return;
      setUser(session.user);
      try {
        const { data: voteRows } = await supabase!.from("user_votes").select("movie_id").eq("user_id", session.user.id);
        if (voteRows?.some((r: any) => r.movie_id === movieId)) setVoted(true);
      } catch {}
      try {
        const { data: wlRows } = await supabase!.from("watchlist").select("movie_id").eq("user_id", session.user.id);
        if (wlRows?.some((r: any) => r.movie_id === movieId)) setSaved(true);
      } catch {}
    }
    loadUser();
  }, [movieId]);

  // ── Load other DB movies for similar / up next ──
  useEffect(() => {
    async function loadDbMovies() {
      if (!supabase) return;
      const { data } = await supabase.from("movies").select("*").eq("status", "approved").order("sort_order", { ascending: true });
      if (data) {
        setDbMovies(data.map((row: any) => ({
          id: row.id, title: row.title, year: row.year || 2026, rating: Number(row.rating) || 0,
          duration: row.duration || "", poster: getSmartPoster(row.poster_url, row.video_url, row.id),
          aiModels: row.ai_models || [], genre: row.genre || "", description: row.description || "",
          video_url: row.video_url || undefined, upvotes_count: row.upvotes_count || 0,
        })));
      }
    }
    loadDbMovies();
  }, []);

  // ── Handlers ──
  const handleUpvote = async () => {
    if (!user) { router.push("/auth"); return; }
    const wasVoted = voted;
    setVoted(!wasVoted);
    setVotes(v => wasVoted ? Math.max(v - 1, 0) : v + 1);
    setPopAnim(true);
    setTimeout(() => setPopAnim(false), 400);
    if (!supabase || !isDbMovie) return;
    try {
      if (wasVoted) { await supabase.from("user_votes").delete().eq("user_id", user.id).eq("movie_id", movieId); }
      else { const { error } = await supabase.from("user_votes").insert({ user_id: user.id, movie_id: movieId }); if (error?.code === "23505") { setVoted(true); return; } }
      const { count } = await supabase.from("user_votes").select("*", { count: "exact", head: true }).eq("movie_id", movieId);
      const safe = count ?? 0;
      await supabase.from("movies").update({ upvotes_count: safe }).eq("id", movieId);
      setVotes(safe);
    } catch (e) { console.error("[Upvote]", e); }
  };

  const handleWatchlist = async () => {
    if (!user) { router.push("/auth"); return; }
    const was = saved; setSaved(!was);
    if (!supabase || !isDbMovie) return;
    try {
      if (was) { await supabase.from("watchlist").delete().eq("user_id", user.id).eq("movie_id", movieId); }
      else { await supabase.from("watchlist").insert({ user_id: user.id, movie_id: movieId }); }
    } catch (e) { console.error("[Watchlist]", e); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: movie?.title, text: `Watch "${movie?.title}" on Spike AI`, url }); }
      else { await navigator.clipboard.writeText(url); setShareMsg("Copied!"); setTimeout(() => setShareMsg(null), 2000); }
    } catch {}
  };

  const creator = movie ? getCreatorForMovie(movie) : null;
  const moviesPool = dbMovies.length > 0 ? dbMovies : ALL_MOVIES;
  const similarMovies = movie ? moviesPool.filter(m => m.id !== movie.id && m.genre === movie.genre).slice(0, 10) : [];
  const otherMovies = movie ? moviesPool.filter(m => m.id !== movie.id) : [];
  const upNextMovie = otherMovies.length > 0 ? otherMovies[0] : null;
  const embedUrl = movie?.video_url ? getEmbedUrl(movie.video_url, quality) : null;
  const scrollSimilar = (dir: "left" | "right") => { scrollRef.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" }); };

  if (loading) return (<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-2 border-[#ffffff] border-t-transparent rounded-full animate-spin" /><p className="text-white/30 text-sm tracking-wider">Loading film...</p></div></div>);
  if (!movie) return (<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-white mb-4">Film Not Found</h1><p className="text-gray-400 mb-8">This film doesn&apos;t exist in our universe.</p><button onClick={() => router.push("/")} className="px-6 py-3 bg-white text-black rounded-lg">Back to Home</button></div></div>);

  const heroImg = movie.image || movie.poster;
  const qLabel = quality === "4k" ? "4K" : quality === "hd" ? "HD" : "Auto";
  const qColor = quality === "4k" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : quality === "hd" ? "text-green-400 border-green-400/30 bg-green-400/10" : "text-white/40 border-white/10 bg-white/5";

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <button onClick={() => router.back()} className="fixed top-5 left-5 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all"><ArrowLeft size={18} /></button>

      {/* ═══ HERO / PLAYER ═══ */}
      <section className="relative w-full aspect-video max-h-[75vh] overflow-hidden bg-black">
        {playing && embedUrl ? (
          <div className="relative w-full h-full">
            <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ border: "none" }} />
            <button onClick={() => setPlaying(false)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors"><X size={18} /></button>
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
              <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded border ${qColor}`}>{qLabel}</span>
              {(["auto", "hd", "4k"] as const).map(q => (<button key={q} onClick={() => setQuality(q)} className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${quality === q ? "bg-white/15 border-white/20 text-white" : "bg-black/50 border-white/10 text-white/40 hover:text-white/70"}`}>{q === "auto" ? "Auto" : q === "hd" ? "1080p" : "4K"}</button>))}
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full cursor-pointer group" onClick={() => movie.video_url && setPlaying(true)}>
            <img src={heroImg} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
            {movie.video_url && (<div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl shadow-white/40 group-hover:scale-110 transition-transform duration-300"><Play size={32} fill="white" className="text-white ml-1" /></div></div>)}
          </div>
        )}
      </section>

      {/* ═══ INFO ═══ */}
      <section className="relative z-10 -mt-32 pb-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="hidden md:block flex-shrink-0 w-[220px]"><img src={movie.poster} alt={movie.title} className="w-full aspect-[2/3] object-cover rounded-xl border border-white/10 shadow-2xl shadow-black/60" /></div>
            <div className="flex-1 min-w-0 pt-4 md:pt-8">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3 leading-tight">{movie.title}</h1>
              {movie.tagline && <p className="text-white/40 text-sm md:text-base font-light italic tracking-wide mb-4">&ldquo;{movie.tagline}&rdquo;</p>}

              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="text-green-400 font-semibold text-sm">{Math.round(movie.rating * 10)}% Match</span>
                <span className="text-white/40 text-sm">{movie.year}</span>
                <span className="inline-flex items-center justify-center w-8 h-5 border border-white/20 rounded text-[10px] font-semibold text-white/50">{movie.maturity || "16+"}</span>
                <span className="text-white/40 text-sm flex items-center gap-1"><Clock size={12} />{movie.duration}</span>
                <span className="text-[10px] px-2 py-0.5 border border-white/10 rounded text-white/40 font-medium tracking-wider">4K AI</span>
                <div className="flex items-center gap-1"><Star size={13} className="text-yellow-400" fill="#eab308" /><span className="text-white/60 text-sm font-medium">{movie.rating}</span></div>
              </div>

              {/* ═══ ACTION BUTTONS ═══ */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {movie.video_url && <button onClick={() => setPlaying(true)} className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold text-sm rounded-lg hover:bg-white/90 transition-all"><Play size={16} fill="black" /> Play</button>}
                <button onClick={handleUpvote} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border transition-all ${popAnim ? "scale-110" : ""} ${voted ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"}`}><Flame size={16} fill={voted ? "currentColor" : "none"} />{votes > 0 ? votes.toLocaleString() : "Upvote"}</button>
                <button onClick={handleWatchlist} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border transition-all ${saved ? "bg-white/15 border-white/25 text-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"}`}>{saved ? <Check size={16} /> : <Plus size={16} />}{saved ? "In My List" : "My List"}</button>
                <button onClick={handleShare} className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all">{shareMsg ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}{shareMsg || "Share"}</button>
              </div>

              <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-2xl mb-6">{movie.description || "An AI-generated cinematic experience pushing the boundaries of artificial creativity."}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                {creator && (<div className="bg-white/[0.03] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center gap-3 mb-3"><img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full object-cover border border-white/10" /><div><p className="text-sm font-semibold text-white">{creator.name}</p><p className="text-[10px] text-white font-medium tracking-wider uppercase">Verified Creator</p></div></div><div className="flex items-center gap-4 mb-3"><span className="text-xs text-gray-500"><span className="text-white font-semibold">{creator.followers.toLocaleString()}</span> followers</span><span className="text-xs text-gray-500"><span className="text-white font-semibold">{creator.films}</span> films</span></div><button onClick={() => router.push(`/creator/${creator.id}`)} className="flex items-center gap-1 text-white text-xs font-medium hover:text-[#f6121d] transition-colors">View Profile <ExternalLink size={11} /></button></div>)}
                <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center gap-2 mb-3"><Cpu size={16} className="text-white" /><p className="text-xs text-gray-500 uppercase tracking-wider font-medium">AI Models Used</p></div><div className="flex flex-wrap gap-2">{movie.aiModels.map((m, i) => (<span key={i} className="px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 rounded-lg border border-white/10">{m}</span>))}</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

      {/* UP NEXT */}
      {upNextMovie && (<section className="py-6 md:py-8 px-4 md:px-6"><div className="max-w-[1400px] mx-auto"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><SkipForward size={18} className="text-white" />Up Next</h2><div onClick={() => router.push(`/movie/${upNextMovie.id}`)} className="flex items-center gap-4 md:gap-6 bg-white/[0.03] border border-white/5 hover:border-white/15 rounded-xl p-3 md:p-4 cursor-pointer transition-all group"><div className="relative w-[70px] md:w-[90px] flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden"><img src={upNextMovie.poster} alt={upNextMovie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={14} fill="white" className="text-white ml-0.5" /></div></div></div><div className="flex-1 min-w-0"><p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Playing Next</p><h3 className="text-base md:text-lg font-bold text-white truncate group-hover:text-white transition-colors">{upNextMovie.title}</h3><div className="flex items-center gap-2 mt-1"><span className="text-yellow-400 text-xs flex items-center gap-0.5"><Star size={10} fill="currentColor" />{upNextMovie.rating}</span><span className="text-gray-500 text-xs">{upNextMovie.year} · {upNextMovie.genre} · {upNextMovie.duration}</span></div></div><div className="flex-shrink-0 hidden sm:flex"><button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-white/80 transition-all"><Play size={14} fill="white" />Play Next</button></div></div></div></section>)}

      {/* MORE LIKE THIS */}
      {similarMovies.length > 0 && (<section className="py-8 md:py-12 px-4 md:px-6"><div className="max-w-[1400px] mx-auto"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Sparkles size={18} className="text-white" />More Like This</h2><div className="relative group"><button onClick={() => scrollSimilar("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button><button onClick={() => scrollSimilar("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button><div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>{similarMovies.map(m => (<div key={m.id} onClick={() => router.push(`/movie/${m.id}`)} className="flex-shrink-0 w-[130px] md:w-[180px] cursor-pointer group/card"><div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-white/5 group-hover/card:border-white/20 transition-all duration-300"><img src={m.poster} alt={m.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" /><div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/50 transition-all flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-[#ffffff] flex items-center justify-center opacity-0 group-hover/card:opacity-100 scale-75 group-hover/card:scale-100 transition-all shadow-lg shadow-white/40"><Play size={20} fill="white" className="text-white ml-0.5" /></div></div></div><p className="text-sm font-medium text-gray-200 group-hover/card:text-white transition-colors truncate">{m.title}</p><div className="flex items-center gap-2 mt-1"><span className="text-yellow-400 text-xs flex items-center gap-0.5"><Star size={10} fill="currentColor" />{m.rating}</span><span className="text-gray-500 text-xs">{m.year}</span></div></div>))}</div></div></div></section>)}

      {/* FOOTER */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-white/5"><div className="max-w-[1400px] mx-auto text-center"><span className="text-lg font-semibold tracking-[0.18em] text-white">spike AI</span><p className="text-gray-500 text-xs mt-4">&copy; {new Date().getFullYear()} Spike AI. The world&apos;s first streaming platform for AI-generated cinema.</p></div></footer>

      {shareMsg && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] px-5 py-3 rounded-xl bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl" style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}><span className="text-[13px] font-medium tracking-wide text-white/80 flex items-center gap-2"><Check size={14} className="text-green-400" />{shareMsg}</span></div>)}
    </div>
  );
}
