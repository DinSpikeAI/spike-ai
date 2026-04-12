"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Star, Clock, Flame, Trash2, Pencil, Bookmark, Share2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Movie } from "./types";

export default function MovieCard({
  movie,
  rank,
  isAdmin,
  onDelete,
  userVoted: initialVoted,
  inWatchlist: initialInWatchlist,
  onWatchlistToggle,
}: {
  movie: Movie;
  rank?: number;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  userVoted?: boolean;
  inWatchlist?: boolean;
  onWatchlistToggle?: (id: string) => void;
}) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [votes, setVotes] = useState(() => {
    if (movie.upvotes_count > 0) return movie.upvotes_count;
    const hash = movie.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Math.floor(movie.rating * 150 + (hash % 500));
  });
  const [voted, setVoted] = useState(initialVoted || false);
  const [saved, setSaved] = useState(initialInWatchlist || false);
  const [showFloat, setShowFloat] = useState(false);
  const [popAnim, setPopAnim] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Sync props → state when data loads after mount
  useEffect(() => { if (initialVoted !== undefined) setVoted(initialVoted); }, [initialVoted]);
  useEffect(() => { if (initialInWatchlist !== undefined) setSaved(initialInWatchlist); }, [initialInWatchlist]);

  const isDbMovie = movie.id.includes("-") && movie.id.length > 8;

  /* ── UPVOTE HANDLER ── */
  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();


    // Optimistic UI — always works, even without DB
    const wasVoted = voted;
    setVoted(!wasVoted);
    setVotes((v) => wasVoted ? Math.max(v - 1, 0) : v + 1);
    setPopAnim(true);
    if (!wasVoted) setShowFloat(true);
    setTimeout(() => setPopAnim(false), 400);
    setTimeout(() => setShowFloat(false), 700);

    // DB operations — only for real DB movies with logged-in user
    if (!supabase || !isDbMovie) {

      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {

      router.push("/auth");
      return;
    }

    const userId = session.user.id;
    

    try {
      if (wasVoted) {
        const { error } = await supabase.from("user_votes").delete()
          .eq("user_id", userId).eq("movie_id", movie.id);

      } else {
        const { error } = await supabase.from("user_votes")
          .insert({ user_id: userId, movie_id: movie.id });


        if (error?.code === "23505") { setVoted(true); return; }
      }

      // Recount from user_votes (race-condition safe)
      const { count } = await supabase
        .from("user_votes")
        .select("*", { count: "exact", head: true })
        .eq("movie_id", movie.id);

      const safeCount = count ?? 0;
      await supabase.from("movies")
        .update({ upvotes_count: safeCount })
        .eq("id", movie.id);


      setVotes(safeCount);
    } catch {}
  };

  /* ── SAVE / MY LIST HANDLER ── */
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSaved(!saved);
    onWatchlistToggle?.(movie.id);
  };

  /* ── SHARE HANDLER ── */
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/movie/${movie.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: movie.title, text: `Watch "${movie.title}" on Spike AI`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Copied!");
        setTimeout(() => setShareMsg(null), 1500);
      }
    } catch {}
  };

  return (
    <div className="movie-card group" onClick={(e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      router.push(`/movie/${movie.id}`);
    }}>
      {rank && rank <= 10 && <div className="top10-badge">TOP {rank}</div>}

      {imgError ? (
        <div className="w-full aspect-[2/3] bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center card-image">
          <span className="text-xs font-light tracking-wide text-white/25 text-center px-3">{movie.title}</span>
        </div>
      ) : (
        <img src={movie.poster} alt={movie.title} className="card-image" loading="lazy" onError={() => setImgError(true)} />
      )}

      <div className="card-play-icon">
        <Play size={18} fill="white" className="text-white ml-0.5" />
      </div>

      {/* Genre Badge */}
      {movie.genre && (
        <div className="absolute z-20 pointer-events-none" style={{ bottom: 8, left: 8 }}>
          <span className="px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase bg-black/60 backdrop-blur-sm border border-white/10 text-white/70">
            {movie.genre}
          </span>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-30 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/admin/dashboard`); }}
            className="w-7 h-7 rounded-md bg-blue-500/80 backdrop-blur-sm flex items-center justify-center hover:bg-blue-400 transition-all shadow-lg"
            title="Edit in Dashboard"
          >
            <Pencil size={12} className="text-white" />
          </button>
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
              setDeleting(true);
              if (supabase) {
                const { error } = await supabase.from("movies").delete().eq("id", movie.id);
                if (!error && onDelete) onDelete(movie.id);
              }
              setDeleting(false);
            }}
            disabled={deleting}
            className="w-7 h-7 rounded-md bg-white/20/80 backdrop-blur-sm flex items-center justify-center hover:bg-white/15 transition-all shadow-lg disabled:opacity-50"
            title="Delete Film"
          >
            <Trash2 size={12} className="text-white" />
          </button>
        </div>
      )}

      <div className="card-overlay">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="rating-badge"><Star size={9} fill="white" />{movie.rating}</div>
            <span className="text-[10px] font-light tracking-wider text-white/40">{movie.year}</span>
          </div>
          {/* Upvote Button */}
          <div className="relative" style={{ zIndex: 50 }}>
            {showFloat && (
              <span className="upvote-float text-[#ffffff]"><Flame size={14} fill="currentColor" /></span>
            )}
            <button
              onClick={handleUpvote}
              style={{ position: "relative", zIndex: 51 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${popAnim ? "upvote-pop" : ""} ${
                voted
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-white/[0.06] text-white/40 border border-white/[0.06] hover:text-white/70 hover:border-white/[0.15]"
              }`}
            >
              <Flame size={10} fill={voted ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <h4 className="text-[13px] font-semibold tracking-wide text-white leading-tight mb-1">{movie.title}</h4>
        <div className="flex items-center gap-1.5 text-[10px] font-light tracking-wider text-white/35 mb-2">
          <Clock size={9} />{movie.duration}{movie.genre && <span>· {movie.genre}</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {movie.aiModels.slice(0, 2).map((model) => (
            <span key={model} className="ai-tag">{model}</span>
          ))}
        </div>

        {/* Watchlist + Share */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.04]" style={{ position: "relative", zIndex: 50 }}>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium transition-all cursor-pointer ${
              saved ? "bg-white/15 text-white border border-white/20" : "bg-white/[0.04] text-white/30 border border-white/[0.04] hover:text-white/60"
            }`}
          >
            <Bookmark size={9} fill={saved ? "currentColor" : "none"} />
            {saved ? "Listed" : "My List"}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium bg-white/[0.04] text-white/30 border border-white/[0.04] hover:text-white/60 transition-all cursor-pointer"
          >
            <Share2 size={9} />{shareMsg || "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
