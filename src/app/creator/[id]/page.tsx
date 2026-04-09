"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Play, Star, Clock, Film, Users,
  Cpu, ExternalLink, Share2, Sparkles, Award,
 Globe, Flame,
} from "lucide-react";
import { supabase, getSmartPoster } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface CreatorProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string;
  website: string;
  social_x: string;
  social_youtube: string;
  social_instagram: string;
  is_creator: boolean;
  creator_slug: string;
  created_at: string;
}

interface CreatorMovie {
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
   CREATOR PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function CreatorPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [movies, setMovies] = useState<CreatorMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // ── Load Creator from DB ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      window.scrollTo(0, 0);

      if (!supabase) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Try to find by UUID first, then by slug
      let profile: CreatorProfile | null = null;
      const isUuid = creatorId.includes("-") && creatorId.length > 8;

      if (isUuid) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", creatorId)
          .single();
        if (data) profile = data as CreatorProfile;
      }

      if (!profile) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("creator_slug", creatorId)
          .single();
        if (data) profile = data as CreatorProfile;
      }

      if (!profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCreator(profile);

      // Load creator's movies
      const { data: movieData } = await supabase
        .from("movies")
        .select("*")
        .eq("creator_id", profile.id)
        .eq("status", "approved")
        .order("upvotes_count", { ascending: false });

      if (movieData) {
        setMovies(
          movieData.map((m: any) => ({
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
          }))
        );
      }

      // Count total upvotes as "followers" for now
      const totalUpvotes = movieData?.reduce((sum: number, m: any) => sum + (m.upvotes_count || 0), 0) || 0;
      setFollowerCount(totalUpvotes);

      setLoading(false);
      setTimeout(() => setIsLoaded(true), 100);
    }

    load();
  }, [creatorId]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: creator?.display_name || "Spike AI Creator", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Copied!");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {}
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] relative overflow-hidden flex items-center justify-center">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />
      </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm tracking-wider">Loading creator...</p>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (notFound || !creator) {
    return (
      <div className="min-h-screen bg-[#060608] relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Creator Not Found</h1>
          <p className="text-white/30 mb-8">This creator profile doesn&apos;t exist.</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-all">Back to Home</button>
        </div>
      </div>
    );
  }

  const avgRating = movies.length > 0
    ? (movies.reduce((sum, m) => sum + m.rating, 0) / movies.length).toFixed(1)
    : "0";

  const totalUpvotes = movies.reduce((sum, m) => sum + m.upvotes_count, 0);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.display_name || "Creator")}&size=200&background=333333&color=fff&bold=true`;
  const defaultBanner = `https://picsum.photos/seed/${creator.id}/1920/600`;

  return (
    <div className="min-h-screen bg-[#060608] relative overflow-hidden text-white">
      {/* Back Button */}
      <button onClick={() => router.back()} className="fixed top-5 left-5 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all">
        <ArrowLeft size={18} />
      </button>

      {/* Banner */}
      <div className="relative h-[200px] md:h-[300px] overflow-hidden">
        <img
          src={creator.banner_url || defaultBanner}
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080a]/60 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-16 md:-mt-24 relative z-10">
        <div className={`flex flex-col md:flex-row gap-6 items-start transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Avatar */}
          <div className="relative">
            <img
              src={creator.avatar_url || defaultAvatar}
              alt={creator.display_name}
              className="w-24 h-24 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-[#08080a] shadow-2xl shadow-black/60"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-[#08080a]">
              <Award size={14} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1">{creator.display_name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-[#ffffff]" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#ffffff]">
                    {creator.is_creator ? "Creator" : "Member"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFollowing(!following)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    following
                      ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                      : "bg-white text-black hover:bg-white/90 shadow-lg shadow-black/20"
                  }`}
                >
                  {following ? "Following" : "Follow"}
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-5">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-[#ffffff]" />
                <span className="text-white font-bold">{totalUpvotes.toLocaleString()}</span>
                <span className="text-white/20 text-sm">total upvotes</span>
              </div>
              <div className="flex items-center gap-2">
                <Film size={14} className="text-white/20" />
                <span className="text-white font-bold">{movies.length}</span>
                <span className="text-white/20 text-sm">films</span>
              </div>
              {movies.length > 0 && (
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-yellow-400" fill="currentColor" />
                  <span className="text-white font-bold">{avgRating}</span>
                  <span className="text-white/20 text-sm">avg rating</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {creator.bio && (
              <p className="text-white/30 text-sm leading-relaxed max-w-2xl mb-5">{creator.bio}</p>
            )}

            {/* Social Links */}
            <div className="flex flex-wrap gap-3">
              {creator.website && (
                <a href={creator.website.startsWith("http") ? creator.website : `https://${creator.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 rounded-lg border border-white/10 hover:border-white/20 hover:text-white transition-all">
                  <Globe size={12} /> Website
                </a>
              )}
              {creator.social_x && (
                <a href={creator.social_x.startsWith("http") ? creator.social_x : `https://x.com/${creator.social_x}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 rounded-lg border border-white/10 hover:border-white/20 hover:text-white transition-all">
                  <Twitter size={12} /> X / Twitter
                </a>
              )}
              {creator.social_youtube && (
                <a href={creator.social_youtube.startsWith("http") ? creator.social_youtube : `https://youtube.com/@${creator.social_youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 rounded-lg border border-white/10 hover:border-white/20 hover:text-white transition-all">
                  <Youtube size={12} /> YouTube
                </a>
              )}
              {creator.social_instagram && (
                <a href={creator.social_instagram.startsWith("http") ? creator.social_instagram : `https://instagram.com/${creator.social_instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 text-gray-300 rounded-lg border border-white/10 hover:border-white/20 hover:text-white transition-all">
                  <Instagram size={12} /> Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

        {/* Filmography */}
        <div className={`transition-all duration-700 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Film size={18} className="text-[#ffffff]" />
            Filmography
            <span className="text-white/15 text-sm font-normal ml-2">({movies.length} films)</span>
          </h2>

          {movies.length === 0 ? (
            <div className="text-center py-16">
              <Film size={40} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/20 text-sm">No films published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((m) => (
                <div
                  key={m.id}
                  onClick={() => router.push(`/movie/${m.id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 border border-white/[0.04] group-hover:border-white/30 transition-all duration-300">
                    <img
                      src={m.poster}
                      alt={m.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-black/40">
                        <Play size={20} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                    {/* Rating badge */}
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-yellow-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star size={10} fill="currentColor" />
                      {m.rating}
                    </div>
                    {/* Upvotes */}
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-[#ffffff] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Flame size={10} fill="currentColor" />
                      {m.upvotes_count}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/20 text-xs">{m.year}</span>
                    <span className="text-white/15 text-xs">·</span>
                    <span className="text-white/20 text-xs">{m.genre}</span>
                    <span className="text-white/15 text-xs">·</span>
                    <span className="text-white/20 text-xs flex items-center gap-0.5"><Clock size={9} />{m.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-white/[0.03][0.04] mt-12 md:mt-16">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            
            <span className="text-lg font-semibold tracking-[0.15em] text-white/80">spike</span>
            <span className="text-lg font-semibold tracking-[0.15em] text-white" >AI</span>
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/15 mb-4">AI Cinema</p>
          <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} Spike AI. The world&apos;s first streaming platform for AI-generated cinema.</p>
        </div>
      </footer>

      {/* Share Toast */}
      {shareMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] px-5 py-3 rounded-xl bg-[#1a1a1e]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl" style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
          <span className="text-[13px] font-medium tracking-wide text-white/80">{shareMsg}</span>
        </div>
      )}
    </div>
  );
}
