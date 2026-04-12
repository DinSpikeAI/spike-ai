"use client";

import { useEffect } from "react";
import {
  Play, Plus, ThumbsUp, Share2, X, Star, Clock, Cpu,
} from "lucide-react";
import { Movie } from "./types";

export default function MovieModal({
  movie,
  onClose,
}: {
  movie: Movie | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (movie) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [movie]);

  if (!movie) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-10 pb-10 overflow-y-auto"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" style={{ animation: "fadeIn 0.3s ease" }} />

      <div
        className="relative z-10 w-full max-w-3xl rounded-xl overflow-hidden bg-[#0c0c0e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1)" }}
      >
        <div className="relative h-[400px]">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#0c0c0e] flex items-center justify-center hover:bg-[#1a1a1e] transition-colors"
          >
            <X size={18} className="text-white/70" />
          </button>

          <div className="absolute bottom-6 left-8 right-8">
            <h2 className="text-4xl font-bold tracking-wide text-white mb-4 drop-shadow-lg">
              {movie.title}
            </h2>
            <div className="flex items-center gap-3">
              <button className="btn-play" style={{ padding: "10px 28px", fontSize: "14px" }}>
                <Play size={16} fill="black" /> Play
              </button>
              <button className="w-10 h-10 rounded-full border border-white/[0.12] flex items-center justify-center hover:border-white/30 transition-colors">
                <Plus size={18} className="text-white/70" />
              </button>
              <button className="w-10 h-10 rounded-full border border-white/[0.12] flex items-center justify-center hover:border-white/30 transition-colors">
                <ThumbsUp size={16} className="text-white/70" />
              </button>
              <button className="w-10 h-10 rounded-full border border-white/[0.12] flex items-center justify-center hover:border-white/30 transition-colors">
                <Share2 size={16} className="text-white/70" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-green-400 font-medium text-sm tracking-wide">
                  {Math.round(movie.rating * 10)}% Match
                </span>
                <span className="text-white/40 text-sm font-light tracking-wider">{movie.year}</span>
                <span className="maturity-badge">16+</span>
                <span className="text-white/40 text-sm font-light tracking-wider flex items-center gap-1">
                  <Clock size={12} /> {movie.duration}
                </span>
                <span className="text-[10px] px-2 py-0.5 border border-white/[0.1] rounded text-white/40 font-medium tracking-[0.1em]">
                </span>
              </div>
              <p className="text-white/55 text-sm font-light leading-relaxed tracking-wide">
                {movie.description || "An AI-generated cinematic experience pushing the boundaries of artificial creativity."}
              </p>
            </div>

            <div className="w-48 flex-shrink-0">
              <p className="text-xs text-white/30 mb-1 font-light tracking-wider">Genre:</p>
              <p className="text-sm text-white/60 mb-3 font-normal tracking-wide">{movie.genre || "Sci-Fi"}</p>

              <p className="text-xs text-white/30 mb-1 font-light tracking-wider">Rating:</p>
              <div className="flex items-center gap-1 mb-3">
                <Star size={12} className="text-yellow-500" fill="#eab308" />
                <span className="text-sm text-white/60 font-light tracking-wide">{movie.rating} / 10</span>
              </div>

              <p className="text-xs text-white/30 mb-1 font-light tracking-wider flex items-center gap-1">
                <Cpu size={10} /> AI Models:
              </p>
              <div className="flex flex-wrap gap-1">
                {movie.aiModels.map((model) => (
                  <span key={model} className="ai-tag">{model}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════ */

