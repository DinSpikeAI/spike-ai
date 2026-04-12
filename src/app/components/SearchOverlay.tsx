"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, X } from "lucide-react";
import { Category, Movie } from "./types";

export default function SearchOverlay({
  active,
  onClose,
  categories,
}: {
  active: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [active]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const allMovies = categories.flatMap((c) => c.movies).filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
  const results = query.length > 0
    ? allMovies.filter((m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.genre?.toLowerCase().includes(query.toLowerCase()) ||
        m.aiModels.some((ai) => ai.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className={`search-overlay ${active ? "active" : ""}`}>
      <div className="max-w-4xl mx-auto px-12 pt-28">
        <button
          onClick={onClose}
          className="absolute top-6 right-12 text-white/30 hover:text-white transition-colors"
        >
          <X size={28} />
        </button>

        <div className="flex items-center gap-4 border-b border-white/[0.06] pb-4 mb-8">
          <Search size={24} className="text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            id="search-overlay"
            name="search-overlay"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, genres, AI models..."
            className="search-input"
          />
        </div>

        {query.length > 0 && (
          <div>
            <p className="text-sm font-light tracking-wide text-white/30 mb-6">
              {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {results.map((movie) => (
                <div key={movie.id} className="movie-card" onClick={() => { onClose(); router.push(`/movie/${movie.id}`); }}>
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="card-image"
                    loading="lazy"
                  />
                  <div className="card-overlay">
                    <div className="rating-badge mb-1" style={{ alignSelf: "flex-start" }}>
                      <Star size={9} fill="white" /> {movie.rating}
                    </div>
                    <h4 className="text-sm font-semibold tracking-wide text-white">{movie.title}</h4>
                    <span className="text-[10px] font-light tracking-wider text-white/40">{movie.year} • {movie.genre}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {query.length === 0 && (
          <div className="text-center pt-16">
            <p className="text-white/30 text-lg font-light tracking-wide">Start typing to search across all AI films</p>
            <p className="text-white/20 text-sm font-light tracking-wider mt-2">Try &quot;Horror&quot;, &quot;Sci-Fi&quot;, or &quot;Runway&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
