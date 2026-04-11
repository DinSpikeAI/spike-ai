"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bookmark, Play, Star, Clock, Trash2,
  Flame, Film, Loader2, LogIn, ArrowRight,
} from "lucide-react";
import { supabase, getSmartPoster } from "@/lib/supabase";

interface WatchlistMovie {
  id: string; title: string; year: number; rating: number; duration: string;
  poster: string; genre: string; description: string; aiModels: string[];
  upvotes_count: number; video_url?: string;
}

export default function MyListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (!supabase) { setAuthChecking(false); return; }
    supabase!.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setAuthChecking(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user || null); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecking || !user || !supabase) return;
    async function fetchList() {
      setLoading(true);
      try {
        const { data: wl } = await supabase!.from("watchlist").select("movie_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
        if (!wl || wl.length === 0) { setMovies([]); setLoading(false); return; }
        const ids = wl.map((r: any) => r.movie_id);
        const { data: md } = await supabase!.from("movies").select("*").in("id", ids);
        if (!md) { setMovies([]); setLoading(false); return; }
        const map = new Map(md.map((m: any) => [m.id, m]));
        setMovies(ids.filter((id: string) => map.has(id)).map((id: string) => {
          const m = map.get(id)!;
          return { id: m.id, title: m.title, year: m.year || 2026, rating: Number(m.rating) || 0, duration: m.duration || "", poster: getSmartPoster(m.poster_url, m.video_url, m.id), genre: m.genre || "Sci-Fi", description: m.description || "", aiModels: m.ai_models || [], upvotes_count: m.upvotes_count || 0, video_url: m.video_url || undefined };
        }));
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    fetchList();
  }, [user, authChecking]);

  const handleRemove = async (movieId: string, title: string) => {
    if (!supabase || !user) return;
    setRemoving(movieId);
    const { error } = await supabase.from("watchlist").delete().eq("user_id", user.id).eq("movie_id", movieId);
    if (!error) { setMovies((p) => p.filter((m) => m.id !== movieId)); showToast(`"${title}" removed`); }
    setRemoving(null);
  };

  /* ═══ LOADING ═══ */
  if (authChecking) return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-indigo-400/30 animate-spin" />
    </div>
  );

  /* ═══ NOT SIGNED IN — dead center ═══ */
  if (!user) return (
    <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, rgba(139,92,246,0.3) 40%, transparent 70%)", animation: "glow 14s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>
      {/* Nav */}
      <nav className="relative z-20 px-8 py-7">
        <div className="max-w-[900px] mx-auto flex items-center gap-5">
          <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/20 hover:text-white transition-all cursor-pointer"><ArrowLeft size={16} /></button>
          <span className="text-[17px] font-semibold tracking-[0.2em] text-white/25 cursor-pointer" onClick={() => router.push("/")}>spike AI</span>
        </div>
      </nav>
      {/* Center */}
      <div className="flex-1 flex items-center justify-center px-6 pb-24 relative z-10">
        <div className="text-center" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
          <div className="relative inline-block mb-10">
            <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-400/10 flex items-center justify-center">
              <Bookmark size={52} className="text-indigo-300/40" />
            </div>
            <div className="absolute -inset-8 rounded-[48px] bg-indigo-500/[0.05] blur-3xl -z-10" />
          </div>
          <h1 className="text-[46px] md:text-[56px] font-bold tracking-[-0.02em] leading-[1.08] mb-5">
            Your <span className="bg-gradient-to-r from-indigo-300/60 to-violet-400/50 bg-clip-text text-transparent">watchlist</span>
          </h1>
          <p className="text-[17px] text-white/20 leading-[1.8] max-w-sm mx-auto mb-12">Sign in to save your favorite AI films and keep track of what to watch next.</p>
          <button onClick={() => router.push("/auth")} className="cta-btn inline-flex items-center gap-3 px-12 py-[17px] text-black text-[16px] font-bold rounded-full cursor-pointer">
            <LogIn size={18} /> Sign In
          </button>
        </div>
      </div>
      <style jsx>{`
        .cta-btn{background:linear-gradient(180deg,#fff 0%,#e8e8eb 100%);box-shadow:0 0 0 1px rgba(255,255,255,0.12),0 4px 24px rgba(255,255,255,0.08),0 0 80px rgba(99,102,241,0.06),inset 0 1px 0 rgba(255,255,255,0.9)}
        .cta-btn:hover{box-shadow:0 0 0 1px rgba(255,255,255,0.2),0 8px 40px rgba(255,255,255,0.12),0 0 100px rgba(99,102,241,0.1),inset 0 1px 0 rgba(255,255,255,1);transform:translateY(-2px)}
        @keyframes reveal{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:0.06;transform:translate(-50%,0) scale(1)}50%{opacity:0.09;transform:translate(-50%,0) scale(1.12)}}
      `}</style>
    </div>
  );

  /* ═══ LOGGED IN ═══ */
  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, transparent 70%)", animation: "glow 14s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer"><ArrowLeft size={15} /></button>
            <div>
              <h1 className="text-[17px] font-semibold tracking-wide flex items-center gap-2"><Bookmark size={16} className="text-indigo-400/60" /> My List</h1>
              <p className="text-[11px] text-white/15 tracking-wider">{movies.length} {movies.length === 1 ? "film" : "films"} saved</p>
            </div>
          </div>
          <span className="text-[14px] font-semibold tracking-[0.2em] text-white/10">spike AI</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-40"><Loader2 size={28} className="text-indigo-400/30 animate-spin" /></div>
        ) : movies.length === 0 ? (

          /* ═══ EMPTY — DEAD CENTER ═══ */
          <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-6">
            <div className="text-center" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="relative inline-block mb-10">
                <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-indigo-500/12 to-violet-500/8 border border-indigo-400/8 flex items-center justify-center">
                  <Film size={44} className="text-indigo-300/25" />
                </div>
                <div className="absolute -inset-8 rounded-[44px] bg-indigo-500/[0.04] blur-3xl -z-10" />
              </div>
              <h2 className="text-[38px] md:text-[46px] font-bold tracking-[-0.02em] mb-4">
                Your list is <span className="bg-gradient-to-r from-indigo-300/60 to-violet-400/50 bg-clip-text text-transparent">empty</span>
              </h2>
              <p className="text-[16px] text-white/20 leading-[1.8] max-w-sm mx-auto mb-12">
                Browse films and tap the bookmark icon to save them here for later.
              </p>
              <button onClick={() => router.push("/")}
                className="inline-flex items-center gap-3 px-10 py-[16px] text-[15px] font-semibold text-white/60 border border-white/[0.08] hover:border-white/[0.15] hover:text-white hover:bg-white/[0.03] rounded-full transition-all cursor-pointer">
                <Film size={17} /> Browse Films <ArrowRight size={15} />
              </button>
            </div>
          </div>

        ) : (
          /* ═══ FILM GRID — centered container ═══ */
          <div className="max-w-[900px] mx-auto px-6 py-10" style={{ animation: "reveal 0.5s ease" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies.map((movie) => (
                <div key={movie.id}
                  className="group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-500 cursor-pointer"
                  style={{ backdropFilter: "blur(12px)" }}
                  onClick={() => router.push(`/movie/${movie.id}`)}>
                  {/* Poster */}
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-transparent to-transparent" />
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-2xl shadow-black/50 scale-75 group-hover:scale-100 transition-transform">
                        <Play size={22} fill="black" className="text-black ml-1" />
                      </div>
                    </div>
                    {/* Genre badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white/70">{movie.genre}</span>
                    </div>
                    {/* Remove button */}
                    <button onClick={(e) => { e.stopPropagation(); handleRemove(movie.id, movie.title); }} disabled={removing === movie.id}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                      {removing === movie.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-[15px] font-bold truncate mb-1.5">{movie.title}</h3>
                    <div className="flex items-center gap-2.5 text-[11px] text-white/25">
                      <span className="text-amber-400/70 flex items-center gap-0.5"><Star size={10} fill="currentColor" />{movie.rating}</span>
                      <span>{movie.year}</span>
                      <span className="flex items-center gap-0.5"><Clock size={9} />{movie.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="flex items-center gap-1 text-[10px] text-white/15"><Flame size={10} />{movie.upvotes_count}</span>
                      {movie.aiModels.slice(0, 2).map((m) => (
                        <span key={m} className="text-[8px] font-bold text-white/15 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.04] uppercase tracking-wider">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-white/[0.03] mt-auto">
        <div className="text-center"><span className="text-[14px] font-semibold tracking-[0.2em] text-white/[0.04]">spike AI</span>
        <div className="flex justify-center gap-4 mt-3 text-[11px] text-white/15"><a href="/terms" className="hover:text-white/30 transition-colors">Terms</a><a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a><a href="/community-guidelines" className="hover:text-white/30 transition-colors">Guidelines</a></div></div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-white/[0.06] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] px-8 py-4 rounded-full font-medium shadow-2xl" style={{ animation: "reveal 0.3s ease" }}>{toast}</div>
      )}

      <style jsx>{`
        @keyframes reveal{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:0.04;transform:translate(-50%,0) scale(1)}50%{opacity:0.07;transform:translate(-50%,0) scale(1.12)}}
      `}</style>
    </div>
  );
}
