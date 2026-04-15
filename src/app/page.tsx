"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, getSmartPoster } from "@/lib/supabase";
import { Movie, Category, HeroSlide, COLLECTIONS, FALLBACK_CATEGORIES } from "./components/types";
import CategoryRow from "./components/CategoryRow";
import Navbar from "./components/Navbar";
import SearchOverlay from "./components/SearchOverlay";
import HeroSection from "./components/HeroSection";
import MovieCard from "./components/MovieCard";
import { GenreFilter, AiModelFilter } from "./components/Filters";
import Footer from "./components/Footer";

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE — Supabase-Connected
   ═══════════════════════════════════════════════════════════════ */

// Module-level cache — survives component re-mounts (Back navigation)
let __cache: {
  categories: Category[] | null;
  heroSlides: HeroSlide[] | null;
  votedIds: Set<string> | null;
  watchlistIds: Set<string> | null;
  isAdmin: boolean;
  isCreator: boolean;
} = { categories: null, heroSlides: null, votedIds: null, watchlistIds: null, isAdmin: false, isCreator: false };

export default function HomePage() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedModel, setSelectedModel] = useState("All");
  const [showSplash, setShowSplash] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [splashChecked, setSplashChecked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Supabase Data Layer (initialized from cache if available) ───
  const [liveCategories, setLiveCategories] = useState<Category[]>(__cache.categories || []);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(__cache.heroSlides || []);
  const [dbReady, setDbReady] = useState(__cache.categories !== null);
  const [isAdmin, setIsAdmin] = useState(__cache.isAdmin);
  const [isCreator, setIsCreator] = useState(__cache.isCreator);
  const [userVotedIds, setUserVotedIds] = useState<Set<string>>(__cache.votedIds || new Set());
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(__cache.watchlistIds || new Set());

  // ─── Sync state → module cache (for instant Back navigation) ───
  useEffect(() => {
    if (liveCategories.length > 0) __cache.categories = liveCategories;
    if (heroSlides.length > 0) __cache.heroSlides = heroSlides;
    if (userVotedIds.size > 0) __cache.votedIds = userVotedIds;
    if (watchlistIds.size > 0) __cache.watchlistIds = watchlistIds;
    __cache.isAdmin = isAdmin;
    __cache.isCreator = isCreator;
  }, [liveCategories, heroSlides, userVotedIds, watchlistIds, isAdmin, isCreator]);

  // ─── Admin Role Check + Load User Data ───
  useEffect(() => {
    if (!supabase) return;
    async function checkRole() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) {
        // User signed out — clear all user-specific state + cache
        setIsAdmin(false);
        setIsCreator(false);
        setUserVotedIds(new Set());
        setWatchlistIds(new Set());
        __cache.votedIds = null;
        __cache.watchlistIds = null;
        __cache.isAdmin = false;
        __cache.isCreator = false;
        return;
      }
      const { data: profile } = await supabase!
        .from("profiles")
        .select("role, user_type")
        .eq("id", session.user.id)
        .single();
      if (profile?.role === "admin") setIsAdmin(true);
      if (profile?.user_type === "creator" || profile?.role === "admin") setIsCreator(true);

      // Load user's existing votes (direct query — no RPC needed)
      try {
        const { data: voteRows, error: voteErr } = await supabase!
          .from("user_votes")
          .select("movie_id")
          .eq("user_id", session.user.id);
        if (voteErr) {

        } else if (voteRows) {
          setUserVotedIds(new Set(voteRows.map((r: any) => r.movie_id)));
        }
      } catch {}

      // Load user's watchlist (direct query — no RPC needed)
      try {
        const { data: wlRows, error: wlErr } = await supabase!
          .from("watchlist")
          .select("movie_id")
          .eq("user_id", session.user.id);
        if (wlErr) {

        } else if (wlRows) {
          setWatchlistIds(new Set(wlRows.map((r: any) => r.movie_id)));
        }
      } catch {}
    }
    checkRole();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { checkRole(); });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Delete Movie Handler (admin) ───
  const handleDeleteMovie = (movieId: string) => {
    setLiveCategories((cats) =>
      cats.map((cat) => ({
        ...cat,
        movies: cat.movies.filter((m) => m.id !== movieId),
      })).filter((cat) => cat.movies.length > 0)
    );
  };

  // ─── Watchlist Toggle ───
  const handleWatchlistToggle = async (movieId: string) => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push("/auth");
      return;
    }

    const isInList = watchlistIds.has(movieId);

    // Optimistic update (works for all movies)
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (isInList) next.delete(movieId);
      else next.add(movieId);
      return next;
    });

    // DB update (only for real DB movies with UUID IDs)
    const isDbMovie = movieId.includes("-") && movieId.length > 8;
    if (!isDbMovie) return;

    try {
      if (isInList) {
        const { error } = await supabase.from("watchlist").delete().eq("user_id", session.user.id).eq("movie_id", movieId);

      } else {
        const { error } = await supabase.from("watchlist").insert({ user_id: session.user.id, movie_id: movieId });

      }
    } catch {}
  };

  // Fetch approved movies from Supabase on mount
  useEffect(() => {
    // Skip fetch if cache is warm (Back navigation)
    if (__cache.categories && __cache.categories.length > 0) {
      setDbReady(true);
      return;
    }

    async function loadFromSupabase() {
      if (!supabase) {
        setLiveCategories(FALLBACK_CATEGORIES);
        setDbReady(true);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("movies")
          .select("*")
          .eq("status", "approved")
          .order("sort_order", { ascending: true })
          .order("upvotes_count", { ascending: false });

        if (error || !data || data.length === 0) {
          // No DB movies — use hardcoded fallback
          setLiveCategories(FALLBACK_CATEGORIES);
          setDbReady(true);
          return;
        }

        // Genre → category mapping (so a Trending+Horror movie also shows in AI Horror)
        const GENRE_TO_CATEGORY: Record<string, string> = {
          "Horror": "AI Horror",
          "Sci-Fi": "Sci-Fi Visions",
          "Anime": "AI Anime",
          "Action": "Action",
          "Drama": "Award Winning",
          "Fantasy": "Fantasy",
          "Thriller": "Sci-Fi Visions",
          "Cyberpunk": "Sci-Fi Visions",
          "Documentary": "AI Documentary",
        };

        const categoryMap: Record<string, Movie[]> = {};
        data.forEach((row: any) => {
          const cat = row.category || "Uncategorized";
          const movieObj: Movie = {
            id: row.id,
            title: row.title,
            year: row.year || 2026,
            rating: Number(row.rating) || 0,
            duration: row.duration || "",
            poster: getSmartPoster(row.poster_url, row.video_url, row.id),
            aiModels: row.ai_models || [],
            genre: row.genre || "",
            description: row.description || "",
            upvotes_count: row.upvotes_count || 0,
            view_count: row.view_count || 0,
            video_url: row.video_url || undefined,
            sort_order: row.sort_order || 0,
            series_name: row.series_name || undefined,
            episode_number: row.episode_number || undefined,
          };

          // Add to primary category
          if (!categoryMap[cat]) categoryMap[cat] = [];
          categoryMap[cat].push(movieObj);

          // Also add to genre-matching category (if different from primary)
          const genre = row.genre || "";
          const genreCat = GENRE_TO_CATEGORY[genre];
          if (genreCat && genreCat !== cat) {
            if (!categoryMap[genreCat]) categoryMap[genreCat] = [];
            // Avoid duplicates
            if (!categoryMap[genreCat].some((m) => m.id === movieObj.id)) {
              categoryMap[genreCat].push(movieObj);
            }
          }
        });

        const DB_CATEGORY_ORDER = [
          { key: "Trending", title: "Trending in AI Cinema", slug: "trending" },
          { key: "Runway Masterpieces", title: "Runway Masterpieces", slug: "sora" },
          { key: "AI Horror", title: "AI Horror", slug: "horror" },
          { key: "Sci-Fi Visions", title: "Sci-Fi Visions", slug: "scifi" },
          { key: "AI Documentary", title: "AI Documentary", slug: "documentary" },
          { key: "Award Winning", title: "Award Winning", slug: "awards" },
          { key: "AI Anime", title: "AI Anime", slug: "anime" },
          { key: "Action", title: "Action & Thriller", slug: "action" },
          { key: "Fantasy", title: "Fantasy Worlds", slug: "fantasy" },
        ];

        const dbCategories: Category[] = DB_CATEGORY_ORDER
          .filter((c) => categoryMap[c.key] && categoryMap[c.key].length > 0)
          .map((c) => ({
            title: c.title,
            slug: c.slug,
            genre: c.key === "Trending" ? "Trending" : c.key === "Runway Masterpieces" ? "Runway Gen-4" : c.key,
            movies: categoryMap[c.key],
          }));

        if (dbCategories.length > 0) {
          setLiveCategories(dbCategories);
        } else {
          setLiveCategories(FALLBACK_CATEGORIES);
        }

        // Build Top 5 Hero Slides from sort_order (admin-controlled)
        const top5 = data
          .filter((r: any) => (r.sort_order || 0) > 0)
          .sort((a: any, b: any) => (a.sort_order || 999) - (b.sort_order || 999))
          .slice(0, 5)
          .map((row: any, idx: number) => ({
            id: row.id,
            title: row.title.toUpperCase().replace(/ /g, "\n").slice(0, 30),
            tagline: row.description?.slice(0, 120) || "An AI-generated cinematic masterpiece.",
            genre: [row.genre || "Sci-Fi"],
            year: row.year || 2026,
            duration: row.duration || "",
            rating: Number(row.rating) || 0,
            maturity: row.maturity || "16+",
            aiModels: row.ai_models || [],
            image: getSmartPoster(row.poster_url, row.video_url, row.id),
            rank: idx + 1,
          }));

        if (top5.length > 0) {
          setHeroSlides(top5);
        }

        setDbReady(true);
      } catch {
        setLiveCategories(FALLBACK_CATEGORIES);
        setDbReady(true);
      }
    }

    loadFromSupabase();
  }, []);

  // ─── Auto-Start Splash (Zero-Click) ───
  useEffect(() => {
    setMounted(true);

    // Return to page after OAuth (e.g., become-creator)
    const returnTo = sessionStorage.getItem("returnTo");
    if (returnTo) {
      sessionStorage.removeItem("returnTo");
      router.push(returnTo);
      return;
    }

    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (hasSeenIntro) {
      setSplashChecked(true);
      return;
    }

    // Auto-start splash immediately
    setShowSplash(true);
    sessionStorage.setItem("hasSeenIntro", "true");

    // Play splash sound (works in PWA, may be blocked in browser — that's ok)
    try {
      const audio = new Audio("/logo-sound.mp3");
      audio.volume = 0.7;
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch {}

    // End splash after animation
    setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => {
        setShowSplash(false);
        setSplashChecked(true);
      }, 800);
    }, 3200);
  }, []);

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show once ever — after 5 min on homepage
      const dismissed = localStorage.getItem("installDismissed");
      if (dismissed) return;
      setTimeout(() => setShowInstallBanner(true), 300000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [splashChecked]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  // ─── Filtering (Genre + AI Model) — flat list, no category rows ───
  const allMovies = liveCategories.flatMap((cat) => cat.movies);
  // Deduplicate by id
  const uniqueMoviesMap = new Map<string, Movie>();
  allMovies.forEach((m) => { if (!uniqueMoviesMap.has(m.id)) uniqueMoviesMap.set(m.id, m); });
  const uniqueMovies = Array.from(uniqueMoviesMap.values());
  
  // Split: positioned (sort_order > 0) vs unpositioned
  const positioned = uniqueMovies.filter(m => (m.sort_order || 0) > 0).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const unpositioned = uniqueMovies.filter(m => !(m.sort_order || 0)).sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
  
  // Merge: place positioned movies at their exact index, fill rest with unpositioned
  const merged: Movie[] = [];
  let uIdx = 0;
  const maxPos = positioned.length > 0 ? Math.max(...positioned.map(m => m.sort_order || 0)) : 0;
  const totalSlots = Math.max(maxPos, positioned.length + unpositioned.length);
  
  for (let i = 1; i <= totalSlots; i++) {
    const atPos = positioned.find(m => m.sort_order === i);
    if (atPos) {
      merged.push(atPos);
    } else if (uIdx < unpositioned.length) {
      merged.push(unpositioned[uIdx++]);
    }
  }
  // Add remaining unpositioned
  while (uIdx < unpositioned.length) {
    merged.push(unpositioned[uIdx++]);
  }

  // Hide non-first episodes from grid (series show only ep1)
  const gridMovies = merged.filter((m) => {
    if (m.series_name && m.episode_number && m.episode_number > 1) return false;
    return true;
  });

  const filteredMovies = gridMovies.filter((m) => {
    const genreMatch =
      selectedGenre === "All" ||
      m.genre?.toLowerCase() === selectedGenre.toLowerCase();

    const modelMatch =
      selectedModel === "All" ||
      m.aiModels.some((ai) => ai.toLowerCase() === selectedModel.toLowerCase());

    return genreMatch && modelMatch;
  });

  const activeFilterLabel =
    selectedGenre !== "All" && selectedModel !== "All"
      ? `${selectedGenre} + ${selectedModel}`
      : selectedGenre !== "All"
        ? selectedGenre
        : selectedModel !== "All"
          ? selectedModel
          : "";

  const isFiltering = selectedGenre !== "All" || selectedModel !== "All";

  // ─── Build rows for streaming layout ───
  const buildRows = (): Category[] => {
    if (gridMovies.length === 0) return [];
    const result: Category[] = [];

    // Row 1: Trending (by upvotes)
    const trending = [...gridMovies].sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
    result.push({ title: "Trending Now", slug: "trending", genre: "All", movies: trending });

    // Row 2: New on Spike AI - only when 15+ films
    if (gridMovies.length >= 15) {
      const newest = [...gridMovies].reverse();
      result.push({ title: "New on Spike AI", slug: "new", genre: "All", movies: newest });
    }

    // Genre rows (films appear in multiple rows like Netflix)
    const genreMap = {};
    gridMovies.forEach((m) => {
      const genres = (m.genre || "Other").split(",").map(g => g.trim());
      genres.forEach((g) => {
        if (!genreMap[g]) genreMap[g] = [];
        if (!genreMap[g].some(x => x.id === m.id)) genreMap[g].push(m);
      });
    });

    Object.entries(genreMap)
      .filter(([, movies]) => movies.length >= 3 && gridMovies.length >= 15)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([genre, movies]) => {
        result.push({ title: genre, slug: genre.toLowerCase().replace(/\s+/g, "-"), genre, movies });
      });

    return result;
  };

  const rows = buildRows();

  // ─── Pre-mount: black screen to prevent splash double-flash ───
  if (!mounted) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  return (
    <main>
      {/* Splash Screen — Auto-Start, Zero-Click */}
      {showSplash && (
        <div className={`splash-screen ${splashFading ? "fade-out" : ""}`}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-[150px]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px] translate-y-[-80px]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[200px] h-[200px] rounded-full bg-white/[0.04] blur-[60px] translate-y-[40px]" />
          </div>

          <div className="splash-logo relative flex flex-col items-center">
            <div className="select-none">
              <span className="splash-text-spike text-7xl sm:text-8xl md:text-[9rem] font-semibold tracking-[0.15em] text-white" style={{ fontStyle: "normal", fontFamily: "'Inter', -apple-system, sans-serif" }}>
                spike AI
              </span>
            </div>
          </div>
          <div className="splash-subtitle text-[10px] md:text-[11px] tracking-[0.6em] uppercase text-white/20 font-extralight mt-8">
            AI Cinema
          </div>
          <div className="splash-line" />
        </div>
      )}

      <div className={`transition-opacity duration-500 ${splashChecked ? "opacity-100" : "opacity-0"}`}>
      <Navbar onSearchOpen={() => setSearchOpen(true)} categories={liveCategories} isAdmin={isAdmin} isCreator={isCreator} />
      <SearchOverlay active={searchOpen} onClose={() => setSearchOpen(false)} categories={liveCategories} />

      <HeroSection dbSlides={heroSlides} />

      {/* Genre Filters + Category Rows */}
      <div className="relative z-10 -mt-2 pt-10">
        {dbReady && (
          <>
            <GenreFilter selected={selectedGenre} onChange={setSelectedGenre} />
            <AiModelFilter selected={selectedModel} onChange={setSelectedModel} />
          </>
        )}

        <div className="mt-8 md:mt-14 px-4 md:px-12">
          {/* Shimmer loading while fetching from DB */}
          {!dbReady && merged.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
                <div key={card}>
                  <div className="aspect-[2/3] rounded-lg bg-white/[0.03] shimmer-card" />
                  <div className="h-3 w-3/4 bg-white/[0.03] rounded mt-3 shimmer-card" />
                  <div className="h-2 w-1/2 bg-white/[0.02] rounded mt-2 shimmer-card" />
                </div>
              ))}
            </div>
          )}

          {/* ═══ STREAMING ROWS (no filter active) ═══ */}
          {dbReady && !isFiltering && rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((row, idx) => (
                <CategoryRow
                  key={row.slug}
                  category={row}
                  index={idx}
                  isAdmin={isAdmin}
                  onDeleteMovie={handleDeleteMovie}
                  userVotedIds={userVotedIds}
                  watchlistIds={watchlistIds}
                  onWatchlistToggle={handleWatchlistToggle}
                />
              ))}
            </div>
          )}

          {/* ═══ FILTERED GRID (when genre/model filter active) ═══ */}
          {dbReady && isFiltering && filteredMovies.length > 0 && (
            <>
              <h2 className="text-lg md:text-xl font-semibold mb-6 text-white/70 tracking-wide">
                {activeFilterLabel}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {filteredMovies.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    rank={index < 10 ? index + 1 : undefined}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteMovie}
                    userVoted={userVotedIds.has(movie.id)}
                    inWatchlist={watchlistIds.has(movie.id)}
                    onWatchlistToggle={handleWatchlistToggle}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {dbReady && ((isFiltering && filteredMovies.length === 0) || (!isFiltering && rows.length === 0 && gridMovies.length === 0)) && (
          <div className="text-center py-24">
            <p className="text-white/30 text-lg font-light tracking-wide">
              No films found{activeFilterLabel ? ` for "${activeFilterLabel}"` : ""}
            </p>
            <button
              onClick={() => { setSelectedGenre("All"); setSelectedModel("All"); }}
              className="mt-4 text-white/60 text-sm font-normal tracking-wide hover:text-white/60 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Collections Row (Disney+ Style) */}
      <div className="px-4 md:px-12 py-16 md:py-24">
        <h2 className="text-lg md:text-xl font-semibold mb-8 text-white/70 tracking-wide">Browse Collections ✦</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {COLLECTIONS.map((col) => (
            <div
              key={col.id}
              className="collection-tile"
              onClick={() => setSelectedGenre(col.genre === "Runway Gen-4" ? "All" : col.genre)}
            >
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <h3 className="text-sm md:text-base font-semibold tracking-wide text-white">{col.title}</h3>
                <p className="text-[10px] md:text-xs font-light tracking-wider text-white/35 mt-0.5">{col.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      {/* Fixed Install Button — always visible at bottom right */}
      {installPrompt && !showInstallBanner && (
        <button
          onClick={handleInstall}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl shadow-black/60 hover:bg-white/10 hover:border-white/20 transition-all group"
          style={{ animation: "installPulse 4s ease-in-out infinite" }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="22" width="4" height="10" rx="1.5" fill="white" opacity="0.3"/>
              <rect x="12" y="16" width="4" height="16" rx="1.5" fill="white" opacity="0.55"/>
              <rect x="18" y="6" width="5" height="26" rx="2" fill="white"/>
              <rect x="25" y="14" width="4" height="18" rx="1.5" fill="white" opacity="0.55"/>
              <rect x="31" y="20" width="4" height="12" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors tracking-wide">Install App</p>
            <p className="text-[10px] text-white/30 font-light tracking-wider">spike AI for desktop</p>
          </div>
        </button>
      )}
      </div>
    </main>
  );
}
