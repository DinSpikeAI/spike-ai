"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Play, ArrowLeft, Plus, Share2, X,
  Star, Clock, Cpu, ChevronLeft, ChevronRight,
  Sparkles, ExternalLink, Flame, SkipForward,
  Check, Film, Pencil, Save, Loader2, Eye,
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

interface Movie { id: string; title: string; year: number; rating: number; duration: string; poster: string; image?: string; aiModels: string[]; genre?: string; description?: string; tagline?: string; maturity?: string; director?: string; creator?: string; creator_name?: string; video_url?: string; upvotes_count?: number; trailer_url?: string | null; series_name?: string; episode_number?: number; }
interface Creator { id: string; name: string; bio: string; avatar: string; followers: number; films: number; joined: string; specialties: string[]; }

const CREATORS: Creator[] = [
  { id: "cr-default", name: "Independent Creator", bio: "An independent AI filmmaker.", avatar: "https://ui-avatars.com/api/?name=Creator&background=8B5CF6&color=fff&size=200", followers: 0, films: 1, joined: "2025", specialties: ["Film"] },
];

function getCreatorForMovie(m: Movie): Creator {
  if (m.creator_name) {
    return { id: "cr-db", name: m.creator_name, bio: "AI filmmaker on Spike AI.", avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.creator_name)}&background=8B5CF6&color=fff&size=200`, followers: 0, films: 1, joined: "2026", specialties: [m.genre || "Film"] };
  }
  return (m.creator && CREATORS.find(c => c.id === m.creator)) || CREATORS[CREATORS.length - 1];
}

const ALL_MOVIES: Movie[] = [];

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
  const [seriesEpisodes, setSeriesEpisodes] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [viewCount, setViewCount] = useState(0);

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
          setMovie({ id: data.id, title: data.title, year: data.year || 2026, rating: Number(data.rating) || 0, duration: data.duration || "", poster: getSmartPoster(data.poster_url, data.video_url, data.id), image: getSmartHeroImage(data.hero_image, data.video_url, data.poster_url, data.id), aiModels: data.ai_models || [], genre: data.genre || "Sci-Fi", description: data.description || "", tagline: data.tagline || "", maturity: data.maturity || "16+", director: data.creator_name || "AI Creator", creator_name: data.creator_name || "", video_url: data.video_url, upvotes_count: data.upvotes_count || 0, trailer_url: data.trailer_url || null, series_name: data.series_name || undefined, episode_number: data.episode_number || undefined });
          setVotes(data.upvotes_count || 0);
          setViewCount(data.view_count || 0);
          setIsDbMovie(true);
          // Load series episodes
          if (data.series_name) {
            const { data: eps } = await supabase.from("movies").select("*").eq("series_name", data.series_name).eq("status", "approved").order("episode_number", { ascending: true });
            if (eps) setSeriesEpisodes(eps);
          }
          // Check if user owns this movie
          if (supabase) {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (s?.user) {
              const { data: p } = await supabase.from("profiles").select("role, display_name").eq("id", s.user.id).single();
              if (p?.role === "admin" || (p?.display_name && p.display_name === data.creator_name)) setIsOwner(true);
            }
          }
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

  // ── Record View (dedup: 1 per user/session per 24h) ──
  useEffect(() => {
    if (!supabase || !isDbMovie || !movie) return;
    async function recordView() {
      const { data: { session } } = await supabase!.auth.getSession();
      const sessionId = session?.user?.id ? null : (sessionStorage.getItem("spike_session") || (() => { const id = crypto.randomUUID(); sessionStorage.setItem("spike_session", id); return id; })());
      try {
        const { data } = await supabase!.rpc("record_view", {
          p_movie_id: movieId,
          p_user_id: session?.user?.id || null,
          p_session_id: sessionId,
        });
        if (typeof data === "number") setViewCount(data);
      } catch {}
    }
    recordView();
  }, [movieId, isDbMovie, movie]);

  // ── Load User Data ──
  useEffect(() => {
    if (!supabase) return;
    async function loadUser() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) return;
      setUser(session.user);
      // Check ownership
      const { data: profile } = await supabase!.from("profiles").select("role, user_type, display_name").eq("id", session.user.id).single();
      if (profile?.role === "admin") setIsOwner(true);
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
          series_name: row.series_name || undefined, episode_number: row.episode_number || undefined,
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
    } catch {}
  };

  const handleWatchlist = async () => {
    if (!user) { router.push("/auth"); return; }
    const was = saved; setSaved(!was);
    if (!supabase || !isDbMovie) return;
    try {
      if (was) { await supabase.from("watchlist").delete().eq("user_id", user.id).eq("movie_id", movieId); }
      else { await supabase.from("watchlist").insert({ user_id: user.id, movie_id: movieId }); }
    } catch {}
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: movie?.title, text: `Watch "${movie?.title}" on Spike AI`, url }); }
      else { await navigator.clipboard.writeText(url); setShareMsg("Copied!"); setTimeout(() => setShareMsg(null), 2000); }
    } catch {}
  };

  const [creatorProfile, setCreatorProfile] = useState<any>(null);

  // ── Load Creator Profile from DB ──
  useEffect(() => {
    if (!supabase || !movie?.creator_name) return;
    async function loadCreator() {
      const { data } = await supabase!.from("profiles").select("id, display_name, avatar_url, bio, user_type").eq("display_name", movie!.creator_name).single();
      if (data) setCreatorProfile(data);
    }
    loadCreator();
  }, [movie?.creator_name]);

  const creator = creatorProfile
    ? { id: creatorProfile.id, name: creatorProfile.display_name, bio: creatorProfile.bio || "AI filmmaker on Spike AI.", avatar: creatorProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorProfile.display_name)}&background=8B5CF6&color=fff&size=200`, followers: 0, films: 1, joined: "2026", specialties: [movie?.genre || "Film"] }
    : movie ? getCreatorForMovie(movie) : null;
  const moviesPool = dbMovies.length > 0 ? dbMovies : ALL_MOVIES;

  // Up Next: next episode if series, otherwise random
  const nextEpisode = movie?.series_name && seriesEpisodes.length > 0
    ? seriesEpisodes.find((ep: any) => (ep.episode_number || 0) > (movie.episode_number || 0))
    : null;
  const upNextMovie = nextEpisode
    ? { id: nextEpisode.id, title: nextEpisode.title, year: nextEpisode.year || 2026, rating: Number(nextEpisode.rating) || 0, duration: nextEpisode.duration || "", poster: getSmartPoster(nextEpisode.poster_url, nextEpisode.video_url, nextEpisode.id), genre: nextEpisode.genre || "", aiModels: [], upvotes_count: 0 }
    : (() => { const other = moviesPool.filter(m => m.id !== movie?.id && !(movie?.series_name && (m as any).series_name === movie.series_name)); return other.length > 0 ? other[0] : null; })();

  // Similar: exclude same series episodes
  const similarMovies = movie ? moviesPool.filter(m => m.id !== movie.id && m.genre === movie.genre && !(movie.series_name && (m as any).series_name === movie.series_name)).slice(0, 10) : [];
  const embedUrl = movie?.video_url ? getEmbedUrl(movie.video_url, quality) : null;
  const scrollSimilar = (dir: "left" | "right") => { scrollRef.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" }); };

  if (loading) return (<div className="min-h-screen bg-[#060608] relative overflow-hidden flex items-center justify-center">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />
      </div><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" /><p className="text-white/30 text-sm tracking-wider">Loading film...</p></div></div>);
  if (!movie) return (<div className="min-h-screen bg-[#060608] relative overflow-hidden flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-white mb-4">Film Not Found</h1><p className="text-white/30 mb-8">This film doesn&apos;t exist in our universe.</p><button onClick={() => router.push("/")} className="px-6 py-3 bg-white text-black rounded-lg">Back to Home</button></div></div>);

  const startEdit = () => {
    setEditForm({
      title: movie!.title, description: movie!.description || "", tagline: movie!.tagline || "",
      video_url: movie!.video_url || "", genre: movie!.genre || "", duration: movie!.duration || "",
      year: movie!.year || 2026, poster_url: movie!.poster || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!supabase || !editForm) return;
    setEditSaving(true);
    const { error } = await supabase.from("movies").update({
      title: editForm.title, description: editForm.description, tagline: editForm.tagline,
      video_url: editForm.video_url, genre: editForm.genre, duration: editForm.duration,
      year: editForm.year, poster_url: editForm.poster_url, series_name: editForm.series_name || null, episode_number: editForm.episode_number ? parseInt(editForm.episode_number) : null,
    }).eq("id", movieId);
    if (!error) {
      setMovie({ ...movie!, title: editForm.title, description: editForm.description, tagline: editForm.tagline,
        video_url: editForm.video_url, genre: editForm.genre, duration: editForm.duration, year: editForm.year });
      setEditing(false);
    }
    setEditSaving(false);
  };

  const heroImg = movie.image || movie.poster;
  const qLabel = quality === "4k" ? "4K" : quality === "hd" ? "HD" : "Auto";
  const qColor = quality === "4k" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : quality === "hd" ? "text-green-400 border-green-400/30 bg-green-400/10" : "text-white/40 border-white/10 bg-white/5";

  return (
    <div className="min-h-screen bg-[#060608] relative overflow-hidden text-white">
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
            {movie.video_url && (<div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-black/30 group-hover:scale-110 transition-transform duration-300"><Play size={32} fill="white" className="text-white ml-1" /></div></div>)}
          </div>
        )}
      </section>

      {/* ═══ INFO ═══ */}
      <section className="relative z-10 -mt-32 pb-8">
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="hidden md:block flex-shrink-0 w-[220px]"><img src={movie.poster} alt={movie.title} className="w-full aspect-[2/3] object-cover rounded-xl border border-white/10 shadow-2xl shadow-black/60" /></div>
            <div className="flex-1 min-w-0 pt-4 md:pt-8">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3 leading-tight">{movie.title}</h1>
              {movie.tagline && <p className="text-white/40 text-sm md:text-base font-light italic tracking-wide mb-4">&ldquo;{movie.tagline}&rdquo;</p>}

              <div className="flex items-center gap-3 mb-5 flex-wrap">
                {movie.rating > 0 && <span className="text-green-400 font-semibold text-sm">{Math.round(movie.rating * 10)}% Match</span>}
                <span className="text-white/40 text-sm">{movie.year}</span>
                <span className="inline-flex items-center justify-center w-8 h-5 border border-white/20 rounded text-[10px] font-semibold text-white/50">{movie.maturity || "16+"}</span>
                <span className="text-white/40 text-sm flex items-center gap-1"><Clock size={12} />{movie.duration}</span>
                {viewCount > 0 && <span className="text-white/40 text-sm flex items-center gap-1"><Eye size={12} />{viewCount.toLocaleString()} views</span>}
                
                {movie.rating > 0 && <div className="flex items-center gap-1"><Star size={13} className="text-yellow-400" fill="#eab308" /><span className="text-white/60 text-sm font-medium">{movie.rating}</span></div>}
              </div>

              {/* ═══ ACTION BUTTONS ═══ */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {movie.video_url && <button onClick={() => setPlaying(true)} className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold text-sm rounded-full hover:bg-white/90 transition-all"><Play size={16} fill="black" /> Play</button>}
                {movie.trailer_url && <a href={movie.trailer_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-7 py-3.5 bg-white/10 border border-white/20 text-white font-bold text-[15px] rounded-xl hover:bg-white/20 transition-all cursor-pointer"><Play size={18} />Trailer</a>}
                <button onClick={handleUpvote} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border transition-all ${popAnim ? "scale-110" : ""} ${voted ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"}`}><Flame size={16} fill={voted ? "currentColor" : "none"} />{votes > 0 ? votes.toLocaleString() : "Upvote"}</button>
                <button onClick={handleWatchlist} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border transition-all ${saved ? "bg-white/15 border-white/25 text-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"}`}>{saved ? <Check size={16} /> : <Plus size={16} />}{saved ? "In My List" : "My List"}</button>
                <button onClick={handleShare} className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all">{shareMsg ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}{shareMsg || "Share"}</button>
                {isOwner && <button onClick={startEdit} className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"><Pencil size={16} />Edit</button>}
              </div>

              <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-2xl mb-6 whitespace-pre-line">{movie.description || "An AI-generated cinematic experience pushing the boundaries of artificial creativity."}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                {creator && (<div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.04] hover:border-white/10 transition-colors"><div className="flex items-center gap-3 mb-3"><img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full object-cover border border-white/10" /><div><p className="text-sm font-semibold text-white">{creator.name}</p><p className="text-[10px] text-white font-medium tracking-wider uppercase">Creator</p></div></div><div className="flex items-center gap-4 mb-3"><span className="text-xs text-white/20"><span className="text-white font-semibold">{creator.followers.toLocaleString()}</span> followers</span><span className="text-xs text-white/20"><span className="text-white font-semibold">{creator.films}</span> {creator.films === 1 ? "film" : "films"}</span></div><button onClick={() => router.push(`/creator/${creator.id}`)} className="flex items-center gap-1 text-white text-xs font-medium hover:text-[#e0e0e0] transition-colors">View Profile <ExternalLink size={11} /></button></div>)}
                {movie.aiModels && movie.aiModels.length > 0 && (<div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.04] hover:border-white/10 transition-colors"><div className="flex items-center gap-2 mb-3"><Cpu size={16} className="text-white" /><p className="text-xs text-white/20 uppercase tracking-wider font-medium">AI Models Used</p></div><div className="flex flex-wrap gap-2">{movie.aiModels.map((m, i) => (<span key={i} className="px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 rounded-lg border border-white/10">{m}</span>))}</div></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

      {/* ═══ SERIES EPISODES ═══ */}
      {seriesEpisodes.length > 1 && (
        <section className="py-8 md:py-12 px-4 md:px-6">
          <div className="max-w-[1400px] mx-auto">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Film size={18} className="text-white" />
              Episodes
              <span className="text-white/20 text-sm font-normal ml-2">({seriesEpisodes.length} episodes)</span>
            </h2>
            <div className="space-y-2">
              {seriesEpisodes.map((ep: any, i: number) => (
                <div
                  key={ep.id}
                  onClick={() => { if (ep.id !== movieId) router.push(`/movie/${ep.id}`); }}
                  className={`flex items-center gap-4 md:gap-6 p-3 md:p-4 rounded-xl border transition-all ${ep.id === movieId ? "bg-white/[0.06] border-white/[0.1]" : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.1] cursor-pointer"}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <span className={`text-sm font-bold ${ep.id === movieId ? "text-white" : "text-white/30"}`}>{ep.episode_number || i + 1}</span>
                  </div>
                  <div className="relative w-[100px] md:w-[140px] flex-shrink-0 aspect-video rounded-lg overflow-hidden">
                    <img src={ep.poster_url || `https://picsum.photos/seed/${ep.id}/320/180`} alt={ep.title} className="w-full h-full object-cover" />
                    {ep.id === movieId && <div className="absolute inset-0 bg-white/10 flex items-center justify-center"><span className="text-[10px] font-bold tracking-wider uppercase text-white bg-black/60 px-2 py-1 rounded">Playing</span></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm md:text-base font-semibold truncate ${ep.id === movieId ? "text-white" : "text-white/60"}`}>{ep.title}</p>
                    <p className="text-[12px] text-white/20 mt-1 line-clamp-1">{ep.description || ""}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {ep.duration && <span className="text-[11px] text-white/15 flex items-center gap-1"><Clock size={10} />{ep.duration}</span>}
                      <span className="text-[11px] text-white/15">{ep.year || 2026}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* UP NEXT */}
      {upNextMovie && (<section className="py-6 md:py-8 px-4 md:px-6"><div className="max-w-[1400px] mx-auto"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><SkipForward size={18} className="text-white" />Up Next</h2><div onClick={() => router.push(`/movie/${upNextMovie.id}`)} className="flex items-center gap-4 md:gap-6 bg-white/[0.03] border border-white/[0.04] hover:border-white/15 rounded-xl p-3 md:p-4 cursor-pointer transition-all group"><div className="relative w-[70px] md:w-[90px] flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden"><img src={upNextMovie.poster} alt={upNextMovie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={14} fill="white" className="text-white ml-0.5" /></div></div></div><div className="flex-1 min-w-0"><p className="text-xs text-white/20 uppercase tracking-wider font-medium mb-1">{nextEpisode ? `Episode ${nextEpisode.episode_number}` : "Playing Next"}</p><h3 className="text-base md:text-lg font-bold text-white truncate group-hover:text-white transition-colors">{upNextMovie.title}</h3><div className="flex items-center gap-2 mt-1"><span className="text-yellow-400 text-xs flex items-center gap-0.5"><Star size={10} fill="currentColor" />{upNextMovie.rating}</span><span className="text-white/20 text-xs">{upNextMovie.year} · {upNextMovie.genre} · {upNextMovie.duration}</span></div></div><div className="flex-shrink-0 hidden sm:flex"><button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-white/80 transition-all"><Play size={14} fill="white" />Play Next</button></div></div></div></section>)}

      {/* MORE LIKE THIS */}
      {similarMovies.length > 0 && (<section className="py-8 md:py-12 px-4 md:px-6"><div className="max-w-[1400px] mx-auto"><h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Sparkles size={18} className="text-white" />More Like This</h2><div className="relative group"><button onClick={() => scrollSimilar("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button><button onClick={() => scrollSimilar("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button><div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>{similarMovies.map(m => (<div key={m.id} onClick={() => router.push(`/movie/${m.id}`)} className="flex-shrink-0 w-[130px] md:w-[180px] cursor-pointer group/card"><div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-white/[0.04] group-hover/card:border-white/20 transition-all duration-300"><img src={m.poster} alt={m.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" /><div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/50 transition-all flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 scale-75 group-hover/card:scale-100 transition-all shadow-lg shadow-black/30"><Play size={20} fill="white" className="text-white ml-0.5" /></div></div></div><p className="text-sm font-medium text-white/80 group-hover/card:text-white transition-colors truncate">{m.title}</p><div className="flex items-center gap-2 mt-1"><span className="text-yellow-400 text-xs flex items-center gap-0.5"><Star size={10} fill="currentColor" />{m.rating}</span><span className="text-white/20 text-xs">{m.year}</span></div></div>))}</div></div></div></section>)}

      {/* EDIT MODAL */}
      {editing && editForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center px-4" onClick={() => setEditing(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-xl bg-[#0c0c0e] border border-white/[0.06] rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-lg font-bold">Edit Film</h3>
              <button onClick={() => setEditing(false)} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Title</label>
                <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Tagline</label>
                <input value={editForm.tagline} onChange={e => setEditForm({...editForm, tagline: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={4} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Genre</label>
                  <input value={editForm.genre} onChange={e => setEditForm({...editForm, genre: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Duration</label>
                  <input value={editForm.duration} onChange={e => setEditForm({...editForm, duration: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" placeholder="e.g. 5m 19sec" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Year</label>
                  <input type="number" value={editForm.year} onChange={e => setEditForm({...editForm, year: parseInt(e.target.value) || 2026})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Video URL</label>
                <input value={editForm.video_url} onChange={e => setEditForm({...editForm, video_url: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" placeholder="YouTube or Vimeo link" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Poster URL</label>
                <input value={editForm.poster_url} onChange={e => setEditForm({...editForm, poster_url: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" placeholder="Direct image URL" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Series Name</label>
                  <input value={editForm.series_name} onChange={e => setEditForm({...editForm, series_name: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" placeholder="e.g. Breakup Letters AI" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Episode #</label>
                  <input type="number" value={editForm.episode_number} onChange={e => setEditForm({...editForm, episode_number: e.target.value})} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white/[0.12] transition-all" placeholder="1" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3">
              <button onClick={() => setEditing(false)} className="px-5 py-2.5 text-sm text-white/40 hover:text-white transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={editSaving} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all">
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-white/[0.04]"><div className="max-w-[1400px] mx-auto text-center"><span className="text-lg font-semibold tracking-[0.18em] text-white">spike AI</span><p className="text-white/20 text-xs mt-4">&copy; {new Date().getFullYear()} Spike AI. The home for AI-generated cinema.</p><div className="flex justify-center gap-4 mt-3 text-[11px] text-white/15"><a href="/terms" className="hover:text-white/30 transition-colors">Terms</a><a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a><a href="/community-guidelines" className="hover:text-white/30 transition-colors">Guidelines</a></div></div></footer>

      {shareMsg && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] px-5 py-3 rounded-xl bg-[#1a1a1e]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl" style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}><span className="text-[13px] font-medium tracking-wide text-white/80 flex items-center gap-2"><Check size={14} className="text-green-400" />{shareMsg}</span></div>)}
    </div>
  );
}
