"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Play, Star, Clock, Film, Users, Calendar,
  Cpu, ExternalLink, Share2, Sparkles, Award
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DATA (standalone)
   ═══════════════════════════════════════════════════════════════ */

interface Creator {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  banner: string;
  followers: number;
  views: number;
  films: number;
  joined: string;
  specialties: string[];
  website?: string;
  social?: string;
}

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
}

const CREATORS: Creator[] = [
  {
    id: "cr1",
    name: "NeonFrame Studios",
    bio: "Pioneering cyberpunk AI cinema with a focus on neo-noir aesthetics and philosophical storytelling. Founded in 2024, NeonFrame has quickly become one of the most recognized names in AI-generated film, known for pushing visual boundaries and exploring the intersection of human consciousness and artificial intelligence.",
    avatar: "https://picsum.photos/seed/creator1/200/200",
    banner: "https://picsum.photos/seed/banner-cr1/1920/600",
    followers: 12400,
    views: 2800000,
    films: 6,
    joined: "2024",
    specialties: ["Cyberpunk", "Anime", "Sci-Fi", "Neo-Noir"],
    website: "neonframe.ai",
  },
  {
    id: "cr2",
    name: "Studio Dreamweave",
    bio: "Blending traditional Japanese art with cutting-edge AI generation to create breathtaking anime worlds. Our mission is to honor the legacy of classic anime while reimagining it through the lens of artificial intelligence. Every frame is crafted with respect for both tradition and innovation.",
    avatar: "https://picsum.photos/seed/creator2/200/200",
    banner: "https://picsum.photos/seed/banner-cr2/1920/600",
    followers: 8900,
    views: 1500000,
    films: 5,
    joined: "2024",
    specialties: ["Anime", "Fantasy", "Art House", "Drama"],
  },
  {
    id: "cr3",
    name: "Titan Forge AI",
    bio: "Creating epic-scale mecha and space opera content that pushes the limits of AI-generated animation. From giant robot battles to interstellar conflicts, Titan Forge AI delivers the kind of spectacle that was once impossible without massive budgets — now brought to life entirely by artificial intelligence.",
    avatar: "https://picsum.photos/seed/creator3/200/200",
    banner: "https://picsum.photos/seed/banner-cr3/1920/600",
    followers: 15200,
    views: 4200000,
    films: 7,
    joined: "2023",
    specialties: ["Anime", "Action", "Sci-Fi", "Mecha"],
    website: "titanforge.ai",
  },
  {
    id: "cr4",
    name: "Mythic Pixel Labs",
    bio: "Where mythology meets technology. Crafting AI films that merge ancient legends with futuristic visions. We believe the oldest stories humanity has ever told deserve to be retold with the newest tools we have. Every project is a bridge between past and future.",
    avatar: "https://picsum.photos/seed/creator4/200/200",
    banner: "https://picsum.photos/seed/banner-cr4/1920/600",
    followers: 6800,
    views: 980000,
    films: 4,
    joined: "2025",
    specialties: ["Fantasy", "Anime", "Horror", "Mythology"],
  },
];

const ALL_MOVIES: Movie[] = [
  { id: "feat-1", title: "GENESIS PROTOCOL", year: 2026, rating: 9.2, duration: "2h 14m", poster: "https://picsum.photos/seed/genesis-poster/400/600", aiModels: ["Sora", "Runway Gen-4"], genre: "Sci-Fi", creator: "cr1" },
  { id: "t1", title: "The Last Render", year: 2026, rating: 8.7, duration: "1h 52m", poster: "https://picsum.photos/seed/lastrender2/400/600", aiModels: ["Sora", "ElevenLabs"], genre: "Sci-Fi", creator: "cr1" },
  { id: "t2", title: "Neon Abyss", year: 2025, rating: 8.3, duration: "2h 01m", poster: "https://picsum.photos/seed/neonabyss3/400/600", aiModels: ["Runway Gen-3"], genre: "Cyberpunk", creator: "cr1" },
  { id: "t3", title: "Pixel Requiem", year: 2026, rating: 9.0, duration: "1h 47m", poster: "https://picsum.photos/seed/pixelreq4/400/600", aiModels: ["Sora", "Midjourney"], genre: "Drama", creator: "cr2" },
  { id: "t4", title: "Synth Hearts", year: 2025, rating: 7.9, duration: "1h 38m", poster: "https://picsum.photos/seed/synthhearts5/400/600", aiModels: ["Kling AI"], genre: "Romance", creator: "cr4" },
  { id: "t5", title: "Void Walker", year: 2026, rating: 8.5, duration: "2h 10m", poster: "https://picsum.photos/seed/voidwalk6/400/600", aiModels: ["Sora"], genre: "Sci-Fi", creator: "cr3" },
  { id: "t6", title: "Chrome Dawn", year: 2026, rating: 8.1, duration: "1h 55m", poster: "https://picsum.photos/seed/chromedawn7/400/600", aiModels: ["Runway Gen-4"], genre: "Action", creator: "cr3" },
  { id: "t8", title: "Neural Bloom", year: 2026, rating: 8.8, duration: "2h 05m", poster: "https://picsum.photos/seed/neuralbloom9/400/600", aiModels: ["Sora"], genre: "Drama", creator: "cr2" },
  { id: "an1", title: "Neon Ronin", year: 2026, rating: 9.1, duration: "1h 55m", poster: "https://picsum.photos/seed/neonronin50/400/600", aiModels: ["Sora", "Midjourney"], genre: "Anime", creator: "cr1" },
  { id: "an2", title: "Sakura Override", year: 2026, rating: 8.8, duration: "1h 44m", poster: "https://picsum.photos/seed/sakuraover51/400/600", aiModels: ["Sora"], genre: "Anime", creator: "cr2" },
  { id: "an3", title: "Mecha Genesis", year: 2025, rating: 9.0, duration: "2h 05m", poster: "https://picsum.photos/seed/mechagen52/400/600", aiModels: ["Runway Gen-4", "Sora"], genre: "Anime", creator: "cr3" },
  { id: "an4", title: "Ghost Protocol Zero", year: 2026, rating: 8.6, duration: "1h 48m", poster: "https://picsum.photos/seed/ghostprot53/400/600", aiModels: ["Kling AI"], genre: "Anime", creator: "cr1" },
  { id: "an5", title: "Dragon Circuit", year: 2026, rating: 8.9, duration: "2h 01m", poster: "https://picsum.photos/seed/dragoncir54/400/600", aiModels: ["Sora"], genre: "Anime", creator: "cr4" },
  { id: "an6", title: "Pixel Samurai", year: 2025, rating: 8.4, duration: "1h 38m", poster: "https://picsum.photos/seed/pixelsam55/400/600", aiModels: ["Stable Diffusion XL"], genre: "Anime", creator: "cr2" },
  { id: "an7", title: "Celestial Engine", year: 2026, rating: 9.2, duration: "2h 15m", poster: "https://picsum.photos/seed/celesteng56/400/600", aiModels: ["Sora", "ElevenLabs"], genre: "Anime", creator: "cr3" },
  { id: "an8", title: "Oni.exe", year: 2025, rating: 8.7, duration: "1h 42m", poster: "https://picsum.photos/seed/oniexe57/400/600", aiModels: ["Runway Gen-4"], genre: "Anime", creator: "cr4" },
];

/* ═══════════════════════════════════════════════════════════════
   CREATOR PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function CreatorPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;
  const creator = CREATORS.find((c) => c.id === creatorId);
  const creatorMovies = ALL_MOVIES.filter((m) => m.creator === creatorId);

  const [isLoaded, setIsLoaded] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    window.scrollTo(0, 0);
  }, [creatorId]);

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Creator Not Found</h1>
          <p className="text-gray-400 mb-8">This creator profile doesn&apos;t exist.</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-[#E50914] text-white rounded-lg hover:bg-[#f6121d] transition-all">Back to Home</button>
        </div>
      </div>
    );
  }

  const avgRating = creatorMovies.length > 0
    ? (creatorMovies.reduce((sum, m) => sum + m.rating, 0) / creatorMovies.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-b from-black/90 to-transparent">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors group">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>
            <div className="h-5 w-px bg-gray-700" />
            <div className="cursor-pointer flex items-center gap-2" onClick={() => router.push("/")}>
              <img src="/mascot.png" alt="Spike" className="h-7 w-auto" />
              <span className="text-[16px] font-black tracking-tight text-white">spike</span>
              <span className="text-[16px] font-black tracking-tight text-[#E50914]" style={{ marginLeft: "-4px" }}>AI</span>
            </div>
          </div>
        </div>
      </nav>

      {/* BANNER */}
      <div className="relative h-[200px] md:h-[340px]">
        <img src={creator.banner} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.4)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080a]/60 to-transparent" />
      </div>

      {/* PROFILE INFO */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-16 md:-mt-24 relative z-10">
        <div className={`flex flex-col md:flex-row gap-6 items-start transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Avatar */}
          <div className="relative">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-24 h-24 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-[#08080a] shadow-2xl shadow-black/60"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center border-2 border-[#08080a]">
              <Award size={14} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1">{creator.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-[#E50914]" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#E50914]">Verified Creator</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFollowing(!following)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    following
                      ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                      : "bg-[#E50914] text-white hover:bg-[#f6121d] shadow-lg shadow-[#E50914]/20"
                  }`}
                >
                  {following ? "Following" : "Follow"}
                </button>
                <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all">
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-5">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-500" />
                <span className="text-white font-bold">{creator.followers.toLocaleString()}</span>
                <span className="text-gray-500 text-sm">followers</span>
              </div>
              <div className="flex items-center gap-2">
                <Film size={14} className="text-gray-500" />
                <span className="text-white font-bold">{creatorMovies.length}</span>
                <span className="text-gray-500 text-sm">films</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={14} className="text-yellow-400" fill="currentColor" />
                <span className="text-white font-bold">{avgRating}</span>
                <span className="text-gray-500 text-sm">avg rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-gray-400 text-sm">Joined {creator.joined}</span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-gray-400 text-sm leading-relaxed max-w-2xl mb-5">{creator.bio}</p>

            {/* Specialties */}
            <div className="flex flex-wrap gap-2">
              {creator.specialties.map((s) => (
                <span key={s} className="px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 rounded-lg border border-white/10">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

        {/* FILMOGRAPHY */}
        <div className={`transition-all duration-700 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Film size={18} className="text-[#E50914]" />
            Filmography
            <span className="text-gray-600 text-sm font-normal ml-2">({creatorMovies.length} films)</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {creatorMovies.map((m) => (
              <div
                key={m.id}
                onClick={() => router.push(`/movie/${m.id}`)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-white/5 group-hover:border-[#E50914]/30 transition-all duration-300">
                  <img
                    src={m.poster}
                    alt={m.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#E50914] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-[#E50914]/40">
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {/* Rating badge */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-yellow-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Star size={10} fill="currentColor" />
                    {m.rating}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">{m.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-xs">{m.year}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{m.genre}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs flex items-center gap-0.5"><Clock size={9} />{m.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-white/5 mt-12 md:mt-16">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/mascot.png" alt="Spike" className="h-8 w-auto" />
            <span className="text-lg font-black tracking-tight text-white">spike</span>
            <span className="text-lg font-black tracking-tight text-[#E50914]" style={{ marginLeft: "-4px" }}>AI</span>
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-4">AI Cinema</p>
          <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} Spike AI. The world&apos;s first streaming platform for AI-generated cinema.</p>
        </div>
      </footer>
    </div>
  );
}
