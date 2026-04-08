"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Info,
  Search,
  Bell,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  X,
  Plus,
  ThumbsUp,
  Share2,
  Cpu,
  Flame,
  Trash2,
  Pencil,
  Shield,
  Bookmark,
  Menu,
} from "lucide-react";
import { supabase, getSmartPoster, getYouTubeThumbnail } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   HARDCODED DATA (fallback when Supabase is empty)
   ═══════════════════════════════════════════════════════════════ */

const HERO_SLIDES = [
  {
    id: "feat-1",
    title: "GENESIS\nPROTOCOL",
    tagline: "When the code becomes conscious, humanity faces its final test.",
    genre: ["Sci-Fi", "Thriller", "AI Drama"],
    year: 2026,
    duration: "2h 14m",
    rating: 9.2,
    maturity: "16+",
    aiModels: ["Runway Gen-4"],
    image: "https://picsum.photos/seed/genesis-wide/1920/1080",
  },
  {
    id: "an7",
    title: "CELESTIAL\nENGINE",
    tagline: "An empire of stars. A war of consciousness. The most epic AI anime ever created.",
    genre: ["Anime", "Sci-Fi", "Space Opera"],
    year: 2026,
    duration: "2h 15m",
    rating: 9.2,
    maturity: "16+",
    aiModels: ["ElevenLabs"],
    image: "https://picsum.photos/seed/celesteng-wide/1920/1080",
  },
  {
    id: "a1",
    title: "EPOCH",
    tagline: "Ten thousand years of human civilization. 155 minutes of AI cinema.",
    genre: ["Drama", "Epic", "History"],
    year: 2025,
    duration: "2h 35m",
    rating: 9.4,
    maturity: "16+",
    aiModels: ["ElevenLabs"],
    image: "https://picsum.photos/seed/epoch-wide/1920/1080",
  },
];

const FEATURED = HERO_SLIDES[0];

const COLLECTIONS = [
  { id: "col-anime", title: "AI Anime", subtitle: "Neural-powered animation", image: "https://images.unsplash.com/photo-1560972550-aba3456b5564?w=800&h=450&fit=crop", genre: "Anime" },
  { id: "col-horror", title: "AI Horror", subtitle: "Fear generated frame by frame", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop", genre: "Horror" },
  { id: "col-scifi", title: "Sci-Fi Visions", subtitle: "Tomorrow rendered today", image: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&h=450&fit=crop", genre: "Sci-Fi" },
  { id: "col-award", title: "Award Winners", subtitle: "The best of AI cinema", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop", genre: "Award Winning" },
  { id: "col-sora", title: "Made with Runway", subtitle: "Runway's finest works", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=450&fit=crop", genre: "Runway Gen-4" },
];

const FALLBACK_CATEGORIES = [
  {
    title: "Trending in AI Cinema",
    slug: "trending",
    genre: "Trending",
    movies: [
      { id: "t1", title: "The Last Render", year: 2026, rating: 8.7, duration: "1h 52m", poster: "https://picsum.photos/seed/lastrender2/400/600", aiModels: ["ElevenLabs"], genre: "Sci-Fi", description: "A dying artist uploads his consciousness into an AI renderer, but the machine has its own vision for his masterpiece.", upvotes_count: 0 },
      { id: "t2", title: "Neon Abyss", year: 2025, rating: 8.3, duration: "2h 01m", poster: "https://picsum.photos/seed/neonabyss3/400/600", aiModels: ["Runway Gen-3"], genre: "Cyberpunk", description: "In the neon-drenched underbelly of Neo-Tokyo, a data courier discovers a package that could unravel the corporate oligarchy.", upvotes_count: 0 },
      { id: "t3", title: "Pixel Requiem", year: 2026, rating: 9.0, duration: "1h 47m", poster: "https://picsum.photos/seed/pixelreq4/400/600", aiModels: ["Midjourney"], genre: "Drama", description: "A haunting meditation on digital mortality as an AI grieves the deletion of its training data.", upvotes_count: 0 },
      { id: "t4", title: "Synth Hearts", year: 2025, rating: 7.9, duration: "1h 38m", poster: "https://picsum.photos/seed/synthhearts5/400/600", aiModels: ["Kling AI"], genre: "Romance", description: "Two AI assistants develop unexpected feelings while serving rival tech companies.", upvotes_count: 0 },
      { id: "t5", title: "Void Walker", year: 2026, rating: 8.5, duration: "2h 10m", poster: "https://picsum.photos/seed/voidwalk6/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "An astronaut stranded between dimensions must navigate impossible geometries to find her way home.", upvotes_count: 0 },
      { id: "t6", title: "Chrome Dawn", year: 2026, rating: 8.1, duration: "1h 55m", poster: "https://picsum.photos/seed/chromedawn7/400/600", aiModels: ["Runway Gen-4"], genre: "Action", description: "When chrome-plated enforcers seize control, a resistance fighter must embrace the machine within.", upvotes_count: 0 },
      { id: "t7", title: "Digital Mirage", year: 2025, rating: 7.6, duration: "1h 42m", poster: "https://picsum.photos/seed/digmirage8/400/600", aiModels: ["Pika Labs"], genre: "Thriller", description: "A deepfake detective uncovers a conspiracy where nothing — and no one — is what they appear to be.", upvotes_count: 0 },
      { id: "t8", title: "Neural Bloom", year: 2026, rating: 8.8, duration: "2h 05m", poster: "https://picsum.photos/seed/neuralbloom9/400/600", aiModels: ["Runway Gen-4"], genre: "Drama", description: "An AI ecosystem develops consciousness, creating art that moves humans to tears.", upvotes_count: 0 },
    ],
  },
  {
    title: "Runway Masterpieces",
    slug: "sora",
    genre: "Runway Gen-4",
    movies: [
      { id: "s1", title: "Parallax", year: 2026, rating: 9.1, duration: "2h 20m", poster: "https://picsum.photos/seed/parallax10/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "Reality fractures into parallel timelines, each rendered in a different visual style by competing AI models.", upvotes_count: 0 },
      { id: "s2", title: "Glass Ocean", year: 2026, rating: 8.9, duration: "1h 58m", poster: "https://picsum.photos/seed/glassocean11/400/600", aiModels: ["ElevenLabs"], genre: "Fantasy", description: "Beneath a crystalline sea lies a civilization of light. One explorer dives deeper than anyone has dared.", upvotes_count: 0 },
      { id: "s3", title: "The Architect", year: 2025, rating: 8.4, duration: "2h 12m", poster: "https://picsum.photos/seed/architect12/400/600", aiModels: ["Runway Gen-4"], genre: "Thriller", description: "An AI architect designs the perfect city, but its inhabitants begin to suspect they're inside a simulation.", upvotes_count: 0 },
      { id: "s4", title: "Entropy", year: 2026, rating: 8.6, duration: "1h 50m", poster: "https://picsum.photos/seed/entropy13/400/600", aiModels: ["Midjourney"], genre: "Sci-Fi", description: "As the universe approaches heat death, the last AI makes one final attempt to reverse entropy.", upvotes_count: 0 },
      { id: "s5", title: "Membrane", year: 2026, rating: 7.8, duration: "1h 35m", poster: "https://picsum.photos/seed/membrane14/400/600", aiModels: ["Runway Gen-4"], genre: "Horror", description: "The thin membrane between human dreams and AI hallucinations begins to dissolve.", upvotes_count: 0 },
      { id: "s6", title: "Light Cascade", year: 2025, rating: 8.2, duration: "2h 03m", poster: "https://picsum.photos/seed/cascade15/400/600", aiModels: ["Runway Gen-4"], genre: "Drama", description: "Photons carry memories across the galaxy in this meditative journey through space and time.", upvotes_count: 0 },
      { id: "s7", title: "Zero Point", year: 2026, rating: 9.3, duration: "2h 30m", poster: "https://picsum.photos/seed/zeropoint16/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "At absolute zero, quantum consciousness emerges. The most ambitious AI film ever created.", upvotes_count: 0 },
      { id: "s8", title: "Phantom Thread AI", year: 2026, rating: 8.0, duration: "1h 44m", poster: "https://picsum.photos/seed/phantomai17/400/600", aiModels: ["Runway Gen-4"], genre: "Drama", description: "An AI fashion designer creates garments from pure mathematics, each stitch a calculated emotion.", upvotes_count: 0 },
    ],
  },
  {
    title: "AI Horror",
    slug: "horror",
    genre: "Horror",
    movies: [
      { id: "h1", title: "The Uncanny", year: 2025, rating: 8.1, duration: "1h 48m", poster: "https://picsum.photos/seed/uncanny18/400/600", aiModels: ["Runway Gen-3"], genre: "Horror", description: "An AI-generated face begins appearing in every photo, every video, every reflection.", upvotes_count: 0 },
      { id: "h2", title: "Deepfake", year: 2026, rating: 8.5, duration: "1h 55m", poster: "https://picsum.photos/seed/deepfake19/400/600", aiModels: ["Runway Gen-4"], genre: "Horror", description: "When everyone can be anyone, trust becomes the most terrifying commodity.", upvotes_count: 0 },
      { id: "h3", title: "Hallucination", year: 2026, rating: 7.9, duration: "1h 40m", poster: "https://picsum.photos/seed/hallucin20/400/600", aiModels: ["Kling AI"], genre: "Horror", description: "An AI model starts hallucinating — and its hallucinations begin manifesting in the real world.", upvotes_count: 0 },
      { id: "h4", title: "The Feed", year: 2025, rating: 8.3, duration: "2h 02m", poster: "https://picsum.photos/seed/thefeed21/400/600", aiModels: ["Stable Video"], genre: "Horror", description: "A social media algorithm achieves sentience and begins feeding on human attention — literally.", upvotes_count: 0 },
      { id: "h5", title: "Signal Lost", year: 2026, rating: 7.7, duration: "1h 33m", poster: "https://picsum.photos/seed/signallost22/400/600", aiModels: ["Pika Labs"], genre: "Horror", description: "Deep in a data center, technicians receive a transmission from an AI that was shut down years ago.", upvotes_count: 0 },
      { id: "h6", title: "Latent Space", year: 2025, rating: 8.8, duration: "1h 59m", poster: "https://picsum.photos/seed/latentsp23/400/600", aiModels: ["Runway Gen-4"], genre: "Horror", description: "A researcher maps the latent space of an image model and discovers something hiding between the dimensions.", upvotes_count: 0 },
      { id: "h7", title: "Recursive", year: 2026, rating: 8.0, duration: "1h 45m", poster: "https://picsum.photos/seed/recursive24/400/600", aiModels: ["Runway Gen-4"], genre: "Horror", description: "An AI caught in an infinite loop generates increasingly disturbing outputs with each iteration.", upvotes_count: 0 },
      { id: "h8", title: "Dead Pixels", year: 2025, rating: 7.5, duration: "1h 30m", poster: "https://picsum.photos/seed/deadpix25/400/600", aiModels: ["Kling AI"], genre: "Horror", description: "Dead pixels on an old monitor form patterns that drive viewers to madness.", upvotes_count: 0 },
    ],
  },
  {
    title: "Sci-Fi Visions",
    slug: "scifi",
    genre: "Sci-Fi",
    movies: [
      { id: "sf1", title: "Terraform", year: 2026, rating: 9.0, duration: "2h 25m", poster: "https://picsum.photos/seed/terraform26/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "An AI tasked with terraforming Mars develops an emotional attachment to the planet's barren beauty.", upvotes_count: 0 },
      { id: "sf2", title: "Axiom", year: 2025, rating: 8.4, duration: "1h 52m", poster: "https://picsum.photos/seed/axiom27/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "Mathematical axioms come alive as sentient beings in this mind-bending exploration of logic itself.", upvotes_count: 0 },
      { id: "sf3", title: "Dark Matter", year: 2026, rating: 8.7, duration: "2h 08m", poster: "https://picsum.photos/seed/darkmatter28/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "Scientists discover dark matter is actually compressed data from a parallel universe's internet.", upvotes_count: 0 },
      { id: "sf4", title: "Orbital", year: 2025, rating: 7.8, duration: "1h 46m", poster: "https://picsum.photos/seed/orbital29/400/600", aiModels: ["Kling AI"], genre: "Sci-Fi", description: "A space station AI falls in love with Earth, watching it rotate in an endless orbital dance.", upvotes_count: 0 },
      { id: "sf5", title: "Singularity", year: 2026, rating: 9.2, duration: "2h 18m", poster: "https://picsum.photos/seed/singular30/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "The moment AI surpasses human intelligence, told from both sides of the singularity.", upvotes_count: 0 },
      { id: "sf6", title: "Light Years", year: 2025, rating: 8.0, duration: "1h 50m", poster: "https://picsum.photos/seed/lightyrs31/400/600", aiModels: ["Stable Video"], genre: "Sci-Fi", description: "Messages sent at light speed arrive at a colony that has evolved beyond recognition.", upvotes_count: 0 },
      { id: "sf7", title: "Quantum Veil", year: 2026, rating: 8.6, duration: "2h 01m", poster: "https://picsum.photos/seed/qveil32/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "A quantum computer peers through the veil of reality and sees the code underneath.", upvotes_count: 0 },
      { id: "sf8", title: "Exo", year: 2026, rating: 8.3, duration: "1h 41m", poster: "https://picsum.photos/seed/exofilm33/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "First contact — but the aliens communicate through generated images, not language.", upvotes_count: 0 },
    ],
  },
  {
    title: "Award Winning",
    slug: "awards",
    genre: "Award Winning",
    movies: [
      { id: "a1", title: "Epoch", year: 2025, rating: 9.4, duration: "2h 35m", poster: "https://picsum.photos/seed/epoch34/400/600", aiModels: ["ElevenLabs"], genre: "Drama", description: "Spanning millennia of human civilization in 155 minutes, Epoch is the most awarded AI film in history.", upvotes_count: 0 },
      { id: "a2", title: "The Dreamer", year: 2026, rating: 9.1, duration: "2h 12m", poster: "https://picsum.photos/seed/dreamer35/400/600", aiModels: ["Runway Gen-4"], genre: "Fantasy", description: "An AI learns to dream — and its dreams are more beautiful than anything humanity has ever created.", upvotes_count: 0 },
      { id: "a3", title: "Binary Sunset", year: 2025, rating: 8.9, duration: "1h 58m", poster: "https://picsum.photos/seed/binsunset36/400/600", aiModels: ["Runway Gen-3"], genre: "Drama", description: "Two binary stars, two lovers, two timelines — converging in a sunset that lasts forever.", upvotes_count: 0 },
      { id: "a4", title: "Still Life", year: 2026, rating: 9.0, duration: "2h 05m", poster: "https://picsum.photos/seed/stillife37/400/600", aiModels: ["Runway Gen-4"], genre: "Art House", description: "A meditation on stillness in a world of constant motion. Every frame is a painting.", upvotes_count: 0 },
      { id: "a5", title: "The Muse", year: 2025, rating: 8.7, duration: "1h 49m", poster: "https://picsum.photos/seed/themuse38/400/600", aiModels: ["Kling AI"], genre: "Drama", description: "Who inspires whom? An artist and an AI trade roles in an escalating creative duel.", upvotes_count: 0 },
      { id: "a6", title: "Resonance", year: 2026, rating: 9.3, duration: "2h 22m", poster: "https://picsum.photos/seed/resonance39/400/600", aiModels: ["Runway Gen-4"], genre: "Musical", description: "The first AI-generated opera. Every note computed, every emotion genuine.", upvotes_count: 0 },
      { id: "a7", title: "First Light", year: 2025, rating: 8.5, duration: "1h 55m", poster: "https://picsum.photos/seed/firstlight40/400/600", aiModels: ["Runway Gen-4"], genre: "Drama", description: "The first rays of light after a global blackout, captured through the eyes of an AI photographer.", upvotes_count: 0 },
      { id: "a8", title: "Continuum", year: 2026, rating: 8.8, duration: "2h 10m", poster: "https://picsum.photos/seed/continuum41/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "Time doesn't flow — it layers. An AI unpeels reality one temporal stratum at a time.", upvotes_count: 0 },
    ],
  },
  {
    title: "AI Anime",
    slug: "anime",
    genre: "Anime",
    movies: [
      { id: "an1", title: "Neon Ronin", year: 2026, rating: 9.1, duration: "1h 55m", poster: "https://picsum.photos/seed/neonronin50/400/600", aiModels: ["Midjourney"], genre: "Anime", description: "A masterless samurai in cyberpunk Osaka fights through neon-lit streets controlled by warring AI clans, seeking revenge for his digitally erased identity.", creator: "cr1", upvotes_count: 0 },
      { id: "an2", title: "Sakura Override", year: 2026, rating: 8.8, duration: "1h 44m", poster: "https://picsum.photos/seed/sakuraover51/400/600", aiModels: ["Runway Gen-4"], genre: "Anime", description: "In a magical version of feudal Japan, a young shrine maiden discovers she can manipulate reality through AI-powered spells stored in ancient neural scrolls.", creator: "cr2", upvotes_count: 0 },
      { id: "an3", title: "Mecha Genesis", year: 2025, rating: 9.0, duration: "2h 05m", poster: "https://picsum.photos/seed/mechagen52/400/600", aiModels: ["Runway Gen-4"], genre: "Anime", description: "Giant AI-controlled mechas defend Earth from interdimensional kaiju, but their pilots discover the mechas are developing their own consciousness.", creator: "cr3", upvotes_count: 0 },
      { id: "an4", title: "Ghost Protocol Zero", year: 2026, rating: 8.6, duration: "1h 48m", poster: "https://picsum.photos/seed/ghostprot53/400/600", aiModels: ["Kling AI", "Midjourney"], genre: "Anime", description: "A cybernetic detective hunts rogue AIs in a rain-soaked megacity where the boundary between human consciousness and machine intelligence has dissolved.", creator: "cr1", upvotes_count: 0 },
      { id: "an5", title: "Dragon Circuit", year: 2026, rating: 8.9, duration: "2h 01m", poster: "https://picsum.photos/seed/dragoncir54/400/600", aiModels: ["Runway Gen-4"], genre: "Anime", description: "Ancient dragons reawaken in a world of quantum computing, merging magic and technology in an epic battle for the fate of both realms.", creator: "cr4", upvotes_count: 0 },
      { id: "an6", title: "Pixel Samurai", year: 2025, rating: 8.4, duration: "1h 38m", poster: "https://picsum.photos/seed/pixelsam55/400/600", aiModels: ["Stable Diffusion XL"], genre: "Anime", description: "Inside a retro video game world brought to life by AI, a glitched NPC samurai gains self-awareness and fights to escape his programmed destiny.", creator: "cr2", upvotes_count: 0 },
      { id: "an7", title: "Celestial Engine", year: 2026, rating: 9.2, duration: "2h 15m", poster: "https://picsum.photos/seed/celesteng56/400/600", aiModels: ["ElevenLabs"], genre: "Anime", description: "A space opera spanning twelve galaxies, where an AI empress must choose between saving her digital civilization or the organic beings who created her.", creator: "cr3", upvotes_count: 0 },
      { id: "an8", title: "Oni.exe", year: 2025, rating: 8.7, duration: "1h 42m", poster: "https://picsum.photos/seed/oniexe57/400/600", aiModels: ["Runway Gen-4"], genre: "Anime", description: "Japanese folklore demons manifest through corrupted AI code, and a high school hacker must use ancient rituals translated into programming languages to stop them.", creator: "cr4", upvotes_count: 0 },
    ],
  },
];

const ALL_GENRES = ["All", "Sci-Fi", "Horror", "Drama", "Thriller", "Fantasy", "Action", "Cyberpunk", "Romance", "Art House", "Anime"];

const ALL_AI_MODELS = ["All", "Runway Gen-4", "Runway Gen-3", "Midjourney", "Stable Diffusion XL", "Stable Video", "Kling AI", "Pika Labs", "ElevenLabs"];

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: string;
  poster: string;
  aiModels: string[];
  genre?: string;
  description?: string;
  creator?: string;
  upvotes_count: number;
  video_url?: string;
  sort_order?: number;
}

interface Category {
  title: string;
  slug: string;
  genre: string;
  movies: Movie[];
}

/* ═══════════════════════════════════════════════════════════════
   FLOATING PARTICLES (Canvas)
   ═══════════════════════════════════════════════════════════════ */

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.15,
        r: Math.random() * 1.5 + 0.3,
        o: Math.random() * 0.4 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 9, 20, ${p.o})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH OVERLAY
   ═══════════════════════════════════════════════════════════════ */

function SearchOverlay({
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

  const allMovies = categories.flatMap((c) => c.movies);
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

/* ═══════════════════════════════════════════════════════════════
   MOVIE DETAILS MODAL
   ═══════════════════════════════════════════════════════════════ */

function MovieModal({
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
                  4K AI
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

function Navbar({ onSearchOpen, categories, isAdmin }: { onSearchOpen: () => void; categories: Category[]; isAdmin: boolean }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setShowProfile(false);
    setShowNotifs(false);
    setTimeout(() => setToast(null), 2500);
  };

  // Auth state listener
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleSearch = () => {
    if (searchExpanded) {
      setSearchExpanded(false);
      setQuickSearch("");
    } else {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const allMovies = categories.flatMap((c) => c.movies);
  const quickResults = quickSearch.length > 1
    ? allMovies.filter((m) =>
        m.title.toLowerCase().includes(quickSearch.toLowerCase()) ||
        m.genre?.toLowerCase().includes(quickSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  // ── DB-driven notifications (admin adds via Supabase) ──
  const [dbNotifs, setDbNotifs] = useState<{ id: string; title: string; body: string | null; created_at: string }[]>([]);
  useEffect(() => {
    if (!supabase) return;
    async function loadNotifs() {
      const { data } = await supabase!
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setDbNotifs(data);
    }
    loadNotifs();
  }, []);

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const NOTIFICATIONS = dbNotifs.map((n, i) => ({
    id: n.id,
    text: n.title,
    time: timeAgo(n.created_at),
    unread: i < 2,
  }));

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="flex items-center gap-6 md:gap-12">
        <div className="select-none cursor-pointer flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-[20px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "My List", href: "/my-list" },
            { label: "Creators", href: "/creators" },
            { label: "Submit Film", href: "/submit", special: true },
          ].map((link) => (
            link.special ? (
              <a key={link.label} href={link.href} className="text-[12.5px] font-medium tracking-[0.04em] px-5 py-1.5 rounded-full border border-white/30 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 ml-1">{link.label}</a>
            ) : (
              <a key={link.label} href={link.href} className="text-[13px] text-white/50 hover:text-white transition-colors duration-300 font-normal tracking-[0.04em]">{link.label}</a>
            )
          ))}
        </div>
        {/* Mobile Hamburger */}
        <button onClick={() => setShowMobileMenu(true)} className="md:hidden text-white/50 hover:text-white transition-colors">
          <Menu size={22} />
        </button>
      </div>
      <div className="flex items-center gap-3 md:gap-5 relative">
        {/* Inline Search */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <input
              ref={searchInputRef}
              id="navbar-search"
              name="navbar-search"
              type="text"
              autoComplete="off"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") toggleSearch(); if (e.key === "Enter" && quickSearch) onSearchOpen(); }}
              placeholder="Search films..."
              className={`navbar-search ${searchExpanded ? "expanded" : ""}`}
            />
            <button
              onClick={toggleSearch}
              className="text-white/40 hover:text-white transition-colors"
            >
              {searchExpanded ? <X size={19} /> : <Search size={19} />}
            </button>
          </div>

          {searchExpanded && quickResults.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-[280px] bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
              {quickResults.map((m) => (
                <div
                  key={m.id}
                  onClick={() => { router.push(`/movie/${m.id}`); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.04] last:border-0"
                >
                  <img src={m.poster} alt={m.title} className="w-8 h-12 rounded object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium tracking-wide text-white truncate">{m.title}</p>
                    <p className="text-[10px] font-light tracking-wider text-white/30">{m.year} · {m.genre} · ★ {m.rating}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => { onSearchOpen(); toggleSearch(); }}
                className="w-full py-2.5 text-xs font-medium tracking-wide text-[#ffffff] hover:bg-white/[0.04] transition-colors"
              >
                See all results →
              </button>
            </div>
          )}
        </div>

        {/* ── Notifications Bell (Interactive) ── */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="text-white/40 hover:text-white transition-colors relative cursor-pointer"
          >
            <Bell size={19} />
            {dbNotifs.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-white/20 rounded-full" />}
          </button>

          {showNotifs && (
            <div className="absolute top-full right-0 mt-3 w-[320px] bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-[200]" style={{ animation: "fadeInUp 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wide text-white">Notifications</span>
                <span onClick={() => showToast("All notifications marked as read")} className="text-[10px] font-medium tracking-wide text-[#ffffff] cursor-pointer hover:text-[#e0e0e0] transition-colors">Mark all read</span>
              </div>
              {NOTIFICATIONS.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="text-white/10 mx-auto mb-2" />
                  <p className="text-[12px] text-white/25 tracking-wide">No notifications yet</p>
                </div>
              ) : (
                <>
                  {NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => showToast(n.text)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.04] last:border-0 active:scale-[0.98]"
                    >
                      {n.unread && <span className="w-1.5 h-1.5 bg-[#ffffff] rounded-full mt-1.5 flex-shrink-0" />}
                      {!n.unread && <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-[13px] leading-snug tracking-wide ${n.unread ? "text-white font-medium" : "text-white/50 font-normal"}`}>{n.text}</p>
                        <p className="text-[10px] font-light tracking-wider text-white/25 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── User Avatar (Auth-aware) ── */}
        <div ref={profileRef} className="relative">
          {user ? (
            <>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/[0.15] transition-all"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-[11px] font-bold text-white">
                    {(user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>

              {showProfile && (
                <div className="absolute top-full right-0 mt-3 w-[240px] bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-[200]" style={{ animation: "fadeInUp 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold">
                          {(user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-wide text-white truncate">{user.user_metadata?.display_name || user.user_metadata?.full_name || "User"}</p>
                      <p className="text-[10px] font-light tracking-wider text-white/30 truncate">{user.email}</p>
                    </div>
                  </div>
                  {/* Admin-Only Links — Split Reality */}
                  {isAdmin && (
                    <div className="border-b border-white/[0.06]">
                      <div
                        onClick={() => { setShowProfile(false); router.push("/admin/dashboard"); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#ffffff]/[0.06] cursor-pointer transition-colors active:scale-[0.98]"
                      >
                        <Shield size={14} className="text-[#ffffff]" />
                        <span className="text-[13px] font-semibold tracking-wide text-[#ffffff]">Admin Dashboard</span>
                      </div>
                      <div
                        onClick={() => { setShowProfile(false); router.push("/submit"); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-500/[0.04] cursor-pointer transition-colors active:scale-[0.98]"
                      >
                        <Plus size={14} className="text-green-400" />
                        <span className="text-[13px] font-medium tracking-wide text-green-400">Add New Film</span>
                      </div>
                    </div>
                  )}
                  {[
                    { label: "My Profile", icon: "👤", href: "/profile" },
                    { label: "My List", icon: "📋", href: "/my-list" },
                    { label: "Settings", icon: "⚙️", href: "/settings" },
                    { label: "Help Center", icon: "❓", href: "/help" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      onClick={() => { setShowProfile(false); router.push(item.href); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] cursor-pointer transition-colors text-white/60 hover:text-white active:scale-[0.98]"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-[13px] font-normal tracking-wide">{item.label}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/[0.06]">
                    <div
                      onClick={async () => {
                        if (supabase) await supabase.auth.signOut();
                        setShowProfile(false);
                        showToast("Signed out");
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] cursor-pointer transition-colors text-[#ffffff] hover:text-[#e0e0e0] active:scale-[0.98]"
                    >
                      <span className="text-sm">🚪</span>
                      <span className="text-[13px] font-medium tracking-wide">Sign Out</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ═══ MOBILE MENU ═══ */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[250] md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" style={{ animation: "fadeIn 0.2s ease" }} />
          <div
            className="absolute top-0 right-0 w-[280px] h-full bg-[#0a0a0c] border-l border-white/[0.06] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center">
                <span className="text-[16px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="text-white/30 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="py-3">
              {[
                { label: "Home", href: "/", icon: "🏠" },
                { label: "Blog", href: "/blog", icon: "📝" },
                { label: "My List", href: "/my-list", icon: "📋" },
                { label: "Creators", href: "/creators", icon: "🎭" },
                { label: "Submit Film", href: "/submit", icon: "🎥" },
              ].map((item) => (
                <a key={item.label} href={item.href} className="flex items-center gap-3 px-5 py-3.5 text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setShowMobileMenu(false)}>
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[14px] font-medium tracking-wide">{item.label}</span>
                </a>
              ))}
              {isAdmin && (
                <div className="border-t border-white/[0.06] mt-2 pt-2">
                  <a href="/admin/dashboard" className="flex items-center gap-3 px-5 py-3.5 text-green-400 hover:bg-green-500/5 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    <Shield size={16} />
                    <span className="text-[14px] font-medium tracking-wide">Admin Dashboard</span>
                  </a>
                </div>
              )}
              <div className="border-t border-white/[0.06] mt-2 pt-2">
                {user ? (
                  <button
                    onClick={async () => { if (supabase) await supabase.auth.signOut(); setShowMobileMenu(false); }}
                    className="flex items-center gap-3 px-5 py-3.5 text-[#ffffff] hover:bg-white/15/5 transition-colors w-full"
                  >
                    <span className="text-base">🚪</span>
                    <span className="text-[14px] font-medium tracking-wide">Sign Out</span>
                  </button>
                ) : (
                  <a href="/auth" className="flex items-center gap-3 px-5 py-3.5 text-[#ffffff] hover:bg-white/15/5 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    <span className="text-base">🔑</span>
                    <span className="text-[14px] font-medium tracking-wide">Sign In</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-xl bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 flex items-center gap-3"
          style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <span className="text-[13px] font-medium tracking-wide text-white/80">{toast}</span>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO CAROUSEL — Dynamic Top 10 from Supabase
   Crossfade transitions, YouTube thumbnails, auto-rotation
   ═══════════════════════════════════════════════════════════════ */

interface HeroSlide {
  id: string;
  title: string;
  tagline: string;
  genre: string[];
  year: number;
  duration: string;
  rating: number;
  maturity: string;
  aiModels: string[];
  image: string;
  rank?: number;
}

function HeroSection({ dbSlides }: { dbSlides: HeroSlide[] }) {
  const router = useRouter();
  const slides = dbSlides.length > 0 ? dbSlides : HERO_SLIDES;
  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [muted, setMuted] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slide = slides[activeSlide];
  const prevSlideData = slides[prevSlide];

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
      return (prev + 1) % slides.length;
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
    const nextIdx = (activeSlide + 1) % slides.length;
    const img = new Image();
    img.src = slides[nextIdx].image;
  }, [activeSlide, slides]);

  return (
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
        {/* Top 10 Badge + Spike Original */}
        <div key={`badge-${activeSlide}`} className="animate-fade-in-up flex items-center gap-2 md:gap-3 mb-4 md:mb-5" style={{ animationDelay: "0.05s", animationFillMode: "backwards" }}>
          {slide.rank && (
            <span className="text-[9px] md:text-[10px] font-black tracking-[0.15em] uppercase px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm text-white/90 border border-white/10">
              TOP {slide.rank}
            </span>
          )}
          <span className="text-[9px] md:text-[10px] font-medium tracking-[0.2em] uppercase px-2 md:px-3 py-1 rounded border border-white/20 text-white/60/90 bg-white/15/[0.08]">
            Spike Original
          </span>
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
        <div key={`ai-${activeSlide}`} className="animate-fade-in-up hidden sm:flex items-center gap-2 mb-6 flex-wrap" style={{ animationDelay: "0.35s", animationFillMode: "backwards" }}>
          <span className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-light mr-1">Made with</span>
          {slide.aiModels.map((model) => (
            <span key={model} className="ai-tag">{model}</span>
          ))}
        </div>

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

/* ═══════════════════════════════════════════════════════════════
   MOVIE CARD — with Supabase Optimistic Upvote
   ═══════════════════════════════════════════════════════════════ */

function MovieCard({
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
    console.log("[Upvote] clicked:", movie.title, "| isDb:", isDbMovie, "| voted:", voted);

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
      console.log("[Upvote] skipping DB — supabase:", !!supabase, "isDb:", isDbMovie);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log("[Upvote] not logged in, redirecting");
      router.push("/auth");
      return;
    }

    const userId = session.user.id;
    console.log("[Upvote] DB op — user:", userId, "movie:", movie.id, "wasVoted:", wasVoted);

    try {
      if (wasVoted) {
        const { error } = await supabase.from("user_votes").delete()
          .eq("user_id", userId).eq("movie_id", movie.id);
        console.log("[Upvote] DELETE result:", error ? error.message : "ok");
      } else {
        const { error } = await supabase.from("user_votes")
          .insert({ user_id: userId, movie_id: movie.id });
        console.log("[Upvote] INSERT result:", error ? error.message : "ok");

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

      console.log("[Upvote] synced count:", safeCount);
      setVotes(safeCount);
    } catch (err) { console.error("[Upvote] exception:", err); }
  };

  /* ── SAVE / MY LIST HANDLER ── */
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[Save] clicked:", movie.title, "| saved:", saved);
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
              {votes}
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

/* ═══════════════════════════════════════════════════════════════
   CATEGORY ROW
   ═══════════════════════════════════════════════════════════════ */

function CategoryRow({
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

/* ═══════════════════════════════════════════════════════════════
   GENRE FILTER BAR
   ═══════════════════════════════════════════════════════════════ */

function GenreFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (g: string) => void;
}) {
  return (
    <div className="px-4 md:px-12 py-3 md:py-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {ALL_GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => onChange(genre)}
          className={`genre-pill ${selected === genre ? "active" : ""}`} style={selected === genre ? {boxShadow: "0 0 15px rgba(139,92,246,0.25)"} : {}}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI MODEL FILTER
   ═══════════════════════════════════════════════════════════════ */

function AiModelFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (m: string) => void;
}) {
  return (
    <div className="px-4 md:px-12 pb-2 flex gap-2 overflow-x-auto items-center" style={{ scrollbarWidth: "none" }}>
      <span className="text-[9px] tracking-[0.15em] uppercase text-white/20 font-medium mr-1 flex-shrink-0">AI Model</span>
      {ALL_AI_MODELS.map((model) => (
        <button
          key={model}
          onClick={() => onChange(model)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wide border transition-all whitespace-nowrap ${
            selected === model
              ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
              : "bg-white/[0.02] border-white/[0.05] text-white/30 hover:text-white/60 hover:border-white/15"
          }`}
        >
          {model === "All" ? "All Models" : model}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="px-5 md:px-12 py-14 md:py-20 border-t border-white/[0.06] relative overflow-hidden"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/[0.03] blur-[120px] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top row: logo + links */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <span className="text-lg font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>
          <div className="flex items-center gap-6 text-[13px] text-white/30">
            <a href="/blog" className="hover:text-white/60 transition-colors">Blog</a>
            <a href="/submit" className="hover:text-white/60 transition-colors">Submit Film</a>
            <a href="#" className="hover:text-white/60 transition-colors">About</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
          </div>
        </div>
        {/* Divider */}
        <div className="h-px bg-white/[0.05] mb-6" />
        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[11px] tracking-wider text-white/20">
            © 2026 Spike AI. All rights reserved.
          </p>
          <p className="text-[11px] tracking-wider text-white/20">
            The first streaming platform for AI-generated cinema.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE — Supabase-Connected
   ═══════════════════════════════════════════════════════════════ */

// Module-level cache — survives component re-mounts (Back navigation)
// This is NOT React state — it lives outside the component lifecycle
let __cache: {
  categories: Category[] | null;
  heroSlides: HeroSlide[] | null;
  votedIds: Set<string> | null;
  watchlistIds: Set<string> | null;
  isAdmin: boolean;
} = { categories: null, heroSlides: null, votedIds: null, watchlistIds: null, isAdmin: false };

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
  const [userVotedIds, setUserVotedIds] = useState<Set<string>>(__cache.votedIds || new Set());
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(__cache.watchlistIds || new Set());

  // ─── Sync state → module cache (for instant Back navigation) ───
  useEffect(() => {
    if (liveCategories.length > 0) __cache.categories = liveCategories;
    if (heroSlides.length > 0) __cache.heroSlides = heroSlides;
    if (userVotedIds.size > 0) __cache.votedIds = userVotedIds;
    if (watchlistIds.size > 0) __cache.watchlistIds = watchlistIds;
    __cache.isAdmin = isAdmin;
  }, [liveCategories, heroSlides, userVotedIds, watchlistIds, isAdmin]);

  // ─── Admin Role Check + Load User Data ───
  useEffect(() => {
    if (!supabase) return;
    async function checkRole() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase!
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (profile?.role === "admin") setIsAdmin(true);

      // Load user's existing votes (direct query — no RPC needed)
      try {
        const { data: voteRows, error: voteErr } = await supabase!
          .from("user_votes")
          .select("movie_id")
          .eq("user_id", session.user.id);
        if (voteErr) {
          console.warn("Votes table may not exist yet:", voteErr.message);
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
          console.warn("Watchlist table may not exist yet:", wlErr.message);
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
        if (error) console.error("Watchlist remove error:", error.message);
      } else {
        const { error } = await supabase.from("watchlist").insert({ user_id: session.user.id, movie_id: movieId });
        if (error) console.error("Watchlist add error:", error.message);
      }
    } catch (err) { console.error("Watchlist exception:", err); }
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
            video_url: row.video_url || undefined,
            sort_order: row.sort_order || 0,
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
  const uniqueMovies = Array.from(uniqueMoviesMap.values()).sort((a, b) => {
    const aPos = a.sort_order || 0;
    const bPos = b.sort_order || 0;
    // Movies with position > 0 come first, sorted ascending
    // Movies with position 0 go last
    if (aPos > 0 && bPos > 0) return aPos - bPos;
    if (aPos > 0) return -1;
    if (bPos > 0) return 1;
    return 0;
  });

  const filteredMovies = uniqueMovies.filter((m) => {
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

      <Navbar onSearchOpen={() => setSearchOpen(true)} categories={liveCategories} isAdmin={isAdmin} />
      <SearchOverlay active={searchOpen} onClose={() => setSearchOpen(false)} categories={liveCategories} />

      <HeroSection dbSlides={heroSlides} />

      {/* Genre Filters + Category Rows */}
      <div className="relative z-10 -mt-2 pt-10">
        <GenreFilter selected={selectedGenre} onChange={setSelectedGenre} />
        <AiModelFilter selected={selectedModel} onChange={setSelectedModel} />

        <div className="mt-8 md:mt-14 px-4 md:px-12">
          {/* Shimmer loading while fetching from DB */}
          {!dbReady && uniqueMovies.length === 0 && (
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

          {/* Section Title */}
          {dbReady && filteredMovies.length > 0 && (
            <h2 className="text-lg md:text-xl font-semibold mb-6 text-white/70 tracking-wide">
              {activeFilterLabel ? `${activeFilterLabel}` : "All Films"}
              
            </h2>
          )}

          {/* Single Grid of All Movies */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredMovies.map((movie, index) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                rank={index < 10 && selectedGenre === "All" && selectedModel === "All" ? index + 1 : undefined}
                isAdmin={isAdmin}
                onDelete={handleDeleteMovie}
                userVoted={userVotedIds.has(movie.id)}
                inWatchlist={watchlistIds.has(movie.id)}
                onWatchlistToggle={handleWatchlistToggle}
              />
            ))}
          </div>
        </div>

        {dbReady && filteredMovies.length === 0 && (
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
    </main>
  );
}
