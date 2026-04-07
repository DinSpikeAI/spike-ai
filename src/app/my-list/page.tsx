"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bookmark, Play, Star, Clock, Trash2,
  Flame, Film, Loader2, LogIn,
} from "lucide-react";
import { supabase, getSmartPoster } from "@/lib/supabase";

interface WatchlistMovie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: string;
  poster: string;
  genre: string;
  description: string;
  aiModels: string[];
  upvotes_count: number;
  video_url?: string;
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
    async function check() {
      const { data: { session } } = await supabase!.auth.getSession();
      setUser(session?.user || null);
      setAuthChecking(false);
    }
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setUser(session?.user || null); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecking || !user || !supabase) return;
    async function fetchList() {
      setLoading(true);
      try {
        const { data: wlRows } = await supabase!.from("watchlist").select("movie_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
        if (!wlRows || wlRows.length === 0) { setMovies([]); setLoading(false); return; }
        const movieIds = wlRows.map((r: any) => r.movie_id);
        const { data: movieData } = await supabase!.from("movies").select("*").in("id", movieIds);
        if (!movieData) { setMovies([]); setLoading(false); return; }
        const movieMap = new Map(movieData.map((m: any) => [m.id, m]));
        const ordered: WatchlistMovie[] = movieIds.filter((id: string) => movieMap.has(id)).map((id: string) => {
          const m = movieMap.get(id)!;
          return { id: m.id, title: m.title, year: m.year || 2026, rating: Number(m.rating) || 0, duration: m.duration || "", poster: getSmartPoster(m.poster_url, m.video_url, m.id), genre: m.genre || "Sci-Fi", description: m.description || "", aiModels: m.ai_models || [], upvotes_count: m.upvotes_count || 0, video_url: m.video_url || undefined };
        });
        setMovies(ordered);
      } catch (err) { console.error("Watchlist fetch error:", err); }
      setLoading(false);
    }
    fetchList();
  }, [user, authChecking]);

  const handleRemove = async (movieId: string, movieTitle: string) => {
    if (!supabase || !user) return;
    setRemoving(movieId);
    try {
      const { error } = await supabase.from("watchlist").delete().eq("user_id", user.id).eq("movie_id", movieId);
      if (!error) { setMovies((prev) => prev.filter((m) => m.id !== movieId)); showToast(`"${movieTitle}" removed`); }
    } catch (err) { console.error(err); }
    setRemoving(null);
  };

  /* ═══════════════════════════════════════════════
     LOADING
     ═══════════════════════════════════════════════ */
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400/40 animate-spin" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     NOT LOGGED IN — Premium centered
     ═══════════════════════════════════════════════ */
  if (!user) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, transparent 70%)" }} />
        </div>
        <nav className="relative z-20 px-8 py-7">
          <div className="max-w-[900px] mx-auto flex items-center gap-5">
            <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer"><ArrowLeft size={15} /></button>
            <span className="text-[15px] font-semibold tracking-[0.2em] text-white/30 cursor-pointer" onClick={() => router.push("/")}>spike AI</span>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 pb-20 relative z-10">
          <div className="text-center" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="relative inline-block mb-10">
              <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-400/10 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                <Bookmark size={42} className="text-indigo-300/40" />
              </div>
              <div className="absolute -inset-8 rounded-[44px] bg-indigo-500/[0.04] blur-2xl -z-10" />
            </div>
            <h1 className="text-[40px] md:text-[48px] font-bold tracking-tight leading-[1.1] mb-4">Your watchlist</h1>
            <p className="text-[16px] text-white/20 leading-[1.8] max-w-sm mx-auto mb-10">Sign in to save your favorite AI films and keep track of what to watch next.</p>
            <button onClick={() => router.push("/auth")}
              className="cta-btn inline-flex items-center gap-3 px-10 py-[16px] text-black text-[15px] font-semibold rounded-full cursor-pointer">
              <LogIn size={17} /> Sign In
            </button>
          </div>
        </div>
        <style jsx>{`
          .cta-btn { background: linear-gradient(180deg, #fff 0%, #e4e4e7 100%); box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 4px 20px rgba(255,255,255,0.06), 0 0 60px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.9); }
          .cta-btn:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 8px 40px rgba(255,255,255,0.1), 0 0 80px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,1); transform: translateY(-2px); }
          @keyframes reveal { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        `}</style>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     MAIN — Logged in
     ═══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer"><ArrowLeft size={15} /></button>
            <div>
              <h1 className="text-[17px] font-semibold tracking-wide flex items-center gap-2">
                <Bookmark size={16} className="text-indigo-400/60" /> My List
              </h1>
              <p className="text-[11px] text-white/15 tracking-wider">{movies.length} {movies.length === 1 ? "film" : "films"} saved</p>
            </div>
          </div>
          <span className="text-[14px] font-semibold tracking-[0.2em] text-white/15">spike AI</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        {loading ? (
          /* Loading */
          <div className="flex items-center justify-center py-32">
            <Loader2 size={24} className="text-indigo-400/40 animate-spin" />
          </div>

        ) : movies.length === 0 ? (
          /* ═══ EMPTY STATE — Premium centered ═══ */
          <div className="flex-1 flex items-center justify-center px-6 py-32" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="text-center">
              <div className="relative inline-block mb-10">
                <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-indigo-500/12 to-violet-500/8 border border-indigo-400/8 flex items-center justify-center">
                  <Film size={36} className="text-indigo-300/30" />
                </div>
                <div className="absolute -inset-8 rounded-[40px] bg-indigo-500/[0.03] blur-2xl -z-10" />
              </div>
              <h2 className="text-[32px] md:text-[38px] font-bold tracking-tight mb-4">Your list is empty</h2>
              <p className="text-[15px] text-white/20 leading-[1.8] max-w-xs mx-auto mb-10">
                Browse films and tap the bookmark icon to save them here for later.
              </p>
              <button onClick={() => router.push("/")}
                className="inline-flex items-center gap-2.5 px-8 py-[14px] text-[14px] font-semibold text-white/50 border border-white/[0.08] hover:border-white/[0.15] hover:text-white/70 rounded-full transition-all cursor-pointer hover:bg-white/[0.02]">
                <Film size={15} /> Browse Films
              </button>
            </div>
          </div>

        ) : (
          /* ═══ FILM GRID ═══ */
          <div className="max-w-[900px] mx-auto px-6 py-10" style={{ animation: "reveal 0.5s ease" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies.map((movie) => (
                <div key={movie.id}
                  className="group bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-500 cursor-pointer backdrop-blur-sm"
                  onClick={() => router.push(`/movie/${movie.id}`)}>
                  <div className="flex gap-4 p-4">
                    {/* Poster */}
                    <div className="relative w-[80px] md:w-[100px] flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden">
                      <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg shadow-black/30">
                          <Play size={16} fill="black" className="text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-white transition-colors">{movie.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-amber-400/80 text-xs flex items-center gap-0.5"><Star size={10} fill="currentColor" />{movie.rating}</span>
                          <span className="text-white/15 text-xs">{movie.year}</span>
                          <span className="text-white/8 text-xs">·</span>
                          <span className="text-white/15 text-xs">{movie.genre}</span>
                          <span className="text-white/8 text-xs">·</span>
                          <span className="text-white/15 text-xs flex items-center gap-0.5"><Clock size={9} />{movie.duration}</span>
                        </div>
                        <p className="text-white/15 text-xs leading-relaxed mt-2 line-clamp-2">{movie.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[10px] text-white/20"><Flame size={10} /> {movie.upvotes_count}</span>
                          <div className="flex gap-1">
                            {movie.aiModels.slice(0, 2).map((m) => (
                              <span key={m} className="text-[8px] font-medium text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.04] uppercase tracking-wider">{m}</span>
                            ))}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(movie.id, movie.title); }} disabled={removing === movie.id}
                          className="p-2 text-white/10 hover:text-red-400/70 hover:bg-red-500/[0.06] rounded-lg transition-all cursor-pointer">
                          {removing === movie.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
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
        <div className="text-center">
          <span className="text-[14px] font-semibold tracking-[0.2em] text-white/[0.04]">spike AI</span>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-white/[0.06] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] px-8 py-4 rounded-full font-medium shadow-2xl" style={{ animation: "reveal 0.3s ease" }}>
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes reveal { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
