"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bookmark, Play, Star, Clock, Trash2,
  Flame, Film, Loader2, LogIn, X,
} from "lucide-react";
import { supabase, getSmartPoster } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   MY LIST PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function MyListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── Auth Check ──
  useEffect(() => {
    if (!supabase) { setAuthChecking(false); return; }
    async function check() {
      const { data: { session } } = await supabase!.auth.getSession();
      setUser(session?.user || null);
      setAuthChecking(false);
    }
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch Watchlist ──
  useEffect(() => {
    if (authChecking || !user || !supabase) return;
    async function fetchList() {
      setLoading(true);
      try {
        // Get watchlist movie IDs
        const { data: wlRows, error: wlErr } = await supabase!
          .from("watchlist")
          .select("movie_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (wlErr || !wlRows || wlRows.length === 0) {
          setMovies([]);
          setLoading(false);
          return;
        }

        const movieIds = wlRows.map((r: any) => r.movie_id);

        // Fetch movie details
        const { data: movieData, error: movieErr } = await supabase!
          .from("movies")
          .select("*")
          .in("id", movieIds);

        if (movieErr || !movieData) {
          setMovies([]);
          setLoading(false);
          return;
        }

        // Maintain watchlist order
        const movieMap = new Map(movieData.map((m: any) => [m.id, m]));
        const ordered: WatchlistMovie[] = movieIds
          .filter((id: string) => movieMap.has(id))
          .map((id: string) => {
            const m = movieMap.get(id)!;
            return {
              id: m.id,
              title: m.title,
              year: m.year || 2026,
              rating: Number(m.rating) || 0,
              duration: m.duration || "",
              poster: getSmartPoster(m.poster_url, m.video_url, m.id),
              genre: m.genre || "Sci-Fi",
              description: m.description || "",
              aiModels: m.ai_models || [],
              upvotes_count: m.upvotes_count || 0,
              video_url: m.video_url || undefined,
            };
          });

        setMovies(ordered);
      } catch (err) {
        console.error("Watchlist fetch error:", err);
      }
      setLoading(false);
    }
    fetchList();
  }, [user, authChecking]);

  // ── Remove from Watchlist ──
  const handleRemove = async (movieId: string, movieTitle: string) => {
    if (!supabase || !user) return;
    setRemoving(movieId);
    try {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movieId);

      if (!error) {
        setMovies((prev) => prev.filter((m) => m.id !== movieId));
        showToast(`"${movieTitle}" removed from My List`);
      }
    } catch (err) {
      console.error("Remove error:", err);
    }
    setRemoving(null);
  };

  // ── Loading State ──
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Not Logged In ──
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <Bookmark size={32} className="text-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Sign in to see your list</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Save your favorite AI films and keep track of what you want to watch next.
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E50914] text-white font-bold text-sm rounded-xl hover:bg-[#f6121d] transition-all shadow-lg shadow-[#E50914]/20"
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            onClick={() => router.push("/")}
            className="block mx-auto mt-4 text-white/30 text-sm hover:text-white/60 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:border-white/15 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Bookmark size={20} className="text-[#E50914]" />
                My List
              </h1>
              <p className="text-xs text-white/30 tracking-wider mt-0.5">
                {movies.length} {movies.length === 1 ? "film" : "films"} saved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              
              <span className="text-sm font-semibold tracking-[0.15em] text-white/80 hidden sm:inline">spike</span>
              <span className="text-sm font-semibold tracking-[0.15em] text-white hidden sm:inline" style={{ marginLeft: "-3px" }}>AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={24} className="text-[#E50914] animate-spin" />
              <p className="text-white/30 text-sm tracking-wider">Loading your list...</p>
            </div>
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-6">
              <Film size={40} className="text-white/10" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your list is empty</h2>
            <p className="text-gray-500 text-sm max-w-sm mb-8">
              Browse films and click &ldquo;My List&rdquo; to save them here for later.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-[#E50914] text-white font-semibold text-sm rounded-lg hover:bg-[#f6121d] transition-all"
            >
              Browse Films
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden hover:border-white/[0.08] transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/movie/${movie.id}`)}
              >
                <div className="flex gap-4 p-4">
                  {/* Poster */}
                  <div className="relative w-[80px] md:w-[100px] flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#E50914] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg shadow-[#E50914]/40">
                        <Play size={16} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white truncate group-hover:text-[#E50914] transition-colors">{movie.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-yellow-400 text-xs flex items-center gap-0.5"><Star size={10} fill="currentColor" />{movie.rating}</span>
                        <span className="text-gray-500 text-xs">{movie.year}</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-500 text-xs">{movie.genre}</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-500 text-xs flex items-center gap-0.5"><Clock size={9} />{movie.duration}</span>
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed mt-2 line-clamp-2">{movie.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] text-white/30">
                          <Flame size={10} /> {movie.upvotes_count}
                        </span>
                        <div className="flex gap-1">
                          {movie.aiModels.slice(0, 2).map((m) => (
                            <span key={m} className="text-[8px] font-medium text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.04] uppercase tracking-wider">{m}</span>
                          ))}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(movie.id, movie.title);
                        }}
                        disabled={removing === movie.id}
                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remove from My List"
                      >
                        {removing === movie.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="py-8 px-4 md:px-6 border-t border-white/5 mt-8">
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            
            <span className="text-lg font-semibold tracking-[0.15em] text-white/80">spike</span>
            <span className="text-lg font-semibold tracking-[0.15em] text-white" >AI</span>
          </div>
          <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} Spike AI. The world&apos;s first streaming platform for AI-generated cinema.</p>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] px-5 py-3 rounded-xl bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl"
          style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <span className="text-[13px] font-medium tracking-wide text-white/80">{toast}</span>
        </div>
      )}
    </div>
  );
}
