"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Info, Star, Clock, Volume2, VolumeX } from "lucide-react";
import ParticleField from "./ParticleField";
import { HeroSlide, HERO_SLIDES } from "./types";

export default function HeroSection({ dbSlides }: { dbSlides: HeroSlide[] }) {
  const router = useRouter();
  const slides = dbSlides.length > 0 ? dbSlides : HERO_SLIDES;
  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [muted, setMuted] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slide = slides[activeSlide] || slides[0];
  const prevSlideData = slides[prevSlide] || slides[0];

  // Auto-rotate every 6 seconds
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      goToNext();
    }, 6000);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setPrevSlide((prev) => prev);
    setActiveSlide((prev) => {
      setPrevSlide(prev);
      return slides.length > 0 ? (prev + 1) % slides.length : 0;
    });
    setTimeout(() => setIsTransitioning(false), 1200);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    if (index === activeSlide) return;
    setIsTransitioning(true);
    setPrevSlide(activeSlide);
    setActiveSlide(index);
    setTimeout(() => setIsTransitioning(false), 1200);
    startTimer(); // Reset timer on manual navigation
  };

  useEffect(() => {
    if (slides.length === 0) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        const bgs = heroRef.current.querySelectorAll(".hero-bg-layer") as NodeListOf<HTMLElement>;
        bgs.forEach((bg) => {
          bg.style.transform = `scale(1.1) translateY(${scrollY * 0.12}px)`;
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Preload next image
  useEffect(() => {
    if (slides.length === 0) return;
    const nextIdx = (activeSlide + 1) % slides.length;
    const img = new Image();
    img.src = slides[nextIdx].image;
  }, [activeSlide, slides]);

  return slides.length === 0 ? null : (
    <section className="hero-section" ref={heroRef}>
      {/* ── Dual-Layer Crossfade Background ── */}
      {/* Previous slide — fading out */}
      <div
        className="hero-bg-layer absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
        style={{
          backgroundImage: `url(${prevSlideData.image})`,
          opacity: isTransitioning ? 0 : 0,
          zIndex: 1,
        }}
      />
      {/* Active slide — fading in */}
      <div
        className="hero-bg-layer absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${slide.image})`,
          animation: "heroCrossfade 1.2s ease-in-out",
          zIndex: 2,
        }}
        key={`hero-bg-${activeSlide}`}
      />

      <div className="hero-gradient" style={{ zIndex: 3 }} />
      <div className="hero-vignette" style={{ zIndex: 3 }} />
      <div className="hero-grain" style={{ zIndex: 3 }} />
      <div style={{ zIndex: 3 }}><ParticleField /></div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full px-5 md:px-12 pb-[4vh] max-w-3xl" style={{ zIndex: 10 }}>
        {/* Top Badge */}
        <div key={`badge-${activeSlide}`} className="animate-fade-in-up flex items-center gap-2 md:gap-3 mb-4 md:mb-5" style={{ animationDelay: "0.05s", animationFillMode: "backwards" }}>
          {slide.rank && (
            <span className="text-[9px] md:text-[10px] font-black tracking-[0.15em] uppercase px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm text-white/90 border border-white/10">
              TOP {slide.rank}
            </span>
          )}
          <span className="text-[9px] md:text-[10px] font-light tracking-[0.2em] uppercase text-white/25">
            {slide.year}
          </span>
          <span className="maturity-badge">{slide.maturity}</span>
        </div>

        {/* Title */}
        <h2
          key={`title-${activeSlide}`}
          className="animate-fade-in-up text-4xl sm:text-6xl md:text-8xl font-bold text-white tracking-wider leading-[0.9] mb-4 md:mb-5"
          style={{
            textShadow: "0 4px 30px rgba(0,0,0,0.6), 0 0 80px rgba(229,9,20,0.1)",
            whiteSpace: "pre-line",
            animationDelay: "0.15s",
            animationFillMode: "backwards",
          }}
        >
          {slide.title}
        </h2>

        {/* Meta */}
        <div key={`meta-${activeSlide}`} className="animate-fade-in-up flex items-center gap-4 mb-3 flex-wrap" style={{ animationDelay: "0.25s", animationFillMode: "backwards" }}>
          <div className="rating-badge">
            <Star size={11} fill="white" />
            {slide.rating}
          </div>
          <span className="text-sm font-light tracking-wider text-white/40 flex items-center gap-1.5">
            <Clock size={13} />
            {slide.duration}
          </span>
          <span className="text-sm font-light tracking-wider text-white/30">
            {slide.genre.join(" · ")}
          </span>
        </div>

        {/* Tagline */}
        <p key={`tag-${activeSlide}`} className="animate-fade-in-up text-[13px] md:text-[15px] font-light tracking-wide text-white/55 leading-relaxed mb-3 md:mb-4 max-w-lg" style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}>
          {slide.tagline}
        </p>

        {/* AI Models */}
        {slide.aiModels && slide.aiModels.length > 0 && (
        <div key={`ai-${activeSlide}`} className="animate-fade-in-up hidden sm:flex items-center gap-2 mb-6 flex-wrap" style={{ animationDelay: "0.35s", animationFillMode: "backwards" }}>
          <span className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-light mr-1">Made with</span>
          {slide.aiModels.map((model) => (
            <span key={model} className="ai-tag">{model}</span>
          ))}
        </div>
        )}

        {/* Buttons */}
        <div key={`btns-${activeSlide}`} className="animate-fade-in-up flex items-center gap-3 mb-6" style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}>
          <button className="btn-play" onClick={() => router.push(`/movie/${slide.id}`)}>
            <Play size={20} fill="black" /> Play
          </button>
          <button className="btn-info" onClick={() => router.push(`/movie/${slide.id}`)}>
            <Info size={20} /> More Info
          </button>
        </div>

        {/* Slide Indicators — progress bars */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`hero-indicator ${i === activeSlide ? "active" : ""}`}
              style={{ width: slides.length > 5 ? "24px" : "32px" }}
            />
          ))}
          <span className="ml-3 text-[10px] text-white/15 font-medium tracking-wider">
            {activeSlide + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Mute Button */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute bottom-[4vh] right-4 md:right-12 z-10 w-10 h-10 rounded-full border border-white/[0.12] flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all bg-black/30 backdrop-blur-sm"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </section>
  );
}
