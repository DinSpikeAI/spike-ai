"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import { Category } from "./types";

export default function CategoryRow({
  category,
  index,
  isAdmin,
  onDeleteMovie,
  userVotedIds,
  watchlistIds,
  onWatchlistToggle,
}: {
  category: Category;
  index: number;
  isAdmin?: boolean;
  onDeleteMovie?: (id: string) => void;
  userVotedIds?: Set<string>;
  watchlistIds?: Set<string>;
  onWatchlistToggle?: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [visible, setVisible] = useState(false);

  const checkScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 20);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Handle bfcache: page restored with element already in viewport
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setVisible(true);
    };
    window.addEventListener("pageshow", handlePageShow);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);

    // Immediate check: element might already be in viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollButtons, { passive: true });
    checkScrollButtons();
    return () => el.removeEventListener("scroll", checkScrollButtons);
  }, []);

  const isFirstRow = index === 0;

  return (
    <div
      ref={sectionRef}
      className={`category-section ${visible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <div className="category-title">
        {category.title}
        <span className="explore-arrow">Explore All ›</span>
      </div>

      <div className="relative group">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="scroll-arrow left group-hover:opacity-70"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}

        <div ref={scrollRef} className="scroll-row">
          {category.movies.map((movie, i) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rank={isFirstRow ? i + 1 : undefined}
              isAdmin={isAdmin}
              onDelete={onDeleteMovie}
              userVoted={userVotedIds?.has(movie.id)}
              inWatchlist={watchlistIds?.has(movie.id)}
              onWatchlistToggle={onWatchlistToggle}
            />
          ))}
        </div>

        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="scroll-arrow right group-hover:opacity-70"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
