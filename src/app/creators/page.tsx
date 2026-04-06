"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Film, Star, Flame, Sparkles, Search, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CreatorCard {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_creator: boolean;
  creator_slug: string;
  film_count: number;
  total_upvotes: number;
}

export default function CreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<CreatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      // Get all creator profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_creator", true)
        .order("display_name");

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      // For each creator, count their films and total upvotes
      const creatorCards: CreatorCard[] = [];

      for (const p of profiles) {
        const { data: movies } = await supabase
          .from("movies")
          .select("upvotes_count")
          .eq("creator_id", p.id)
          .eq("status", "approved");

        const filmCount = movies?.length || 0;
        const totalUpvotes = movies?.reduce((sum: number, m: any) => sum + (m.upvotes_count || 0), 0) || 0;

        creatorCards.push({
          id: p.id,
          display_name: p.display_name || "Unknown Creator",
          avatar_url: p.avatar_url,
          bio: p.bio || "",
          is_creator: p.is_creator,
          creator_slug: p.creator_slug || p.id,
          film_count: filmCount,
          total_upvotes: totalUpvotes,
        });
      }

      setCreators(creatorCards);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.length > 0
    ? creators.filter(c => c.display_name.toLowerCase().includes(search.toLowerCase()) || c.bio.toLowerCase().includes(search.toLowerCase()))
    : creators;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:border-white/15 transition-all">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles size={20} className="text-[#E50914]" />
                Creators & Studios
              </h1>
              <p className="text-xs text-white/30 tracking-wider mt-0.5">
                {creators.length} {creators.length === 1 ? "creator" : "creators"} on Spike AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            
            <span className="text-sm font-semibold tracking-[0.15em] text-white/80 hidden sm:inline">spike</span>
            <span className="text-sm font-semibold tracking-[0.15em] text-white hidden sm:inline" style={{ marginLeft: "-3px" }}>AI</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            id="creator-search"
            name="creator-search"
            type="text"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-[#E50914]/40 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/30 text-sm">Loading creators...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto mb-6">
              <Sparkles size={32} className="text-white/10" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {search ? "No creators found" : "No creators yet"}
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {search ? `No results for "${search}"` : "Be the first to submit a film and become a creator."}
            </p>
            {!search && (
              <button onClick={() => router.push("/submit")} className="mt-6 px-6 py-3 bg-[#E50914] text-white font-semibold text-sm rounded-lg hover:bg-[#f6121d] transition-all">
                Submit a Film
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((creator) => {
              const initials = (creator.display_name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

              return (
                <div
                  key={creator.id}
                  onClick={() => router.push(`/creator/${creator.creator_slug}`)}
                  className="group cursor-pointer bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-300"
                >
                  {/* Top gradient bar */}
                  <div className="h-24 bg-gradient-to-br from-[#E50914]/20 via-[#1a0a0a] to-[#0a0a12] relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-[#E50914]/[0.08] blur-[40px]" />
                  </div>

                  <div className="px-5 pb-5 -mt-10">
                    {/* Avatar */}
                    <div className="relative mb-4">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={creator.display_name} className="w-16 h-16 rounded-full object-cover border-[3px] border-[#050505] shadow-xl shadow-black/60" />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-[3px] border-[#050505] shadow-xl shadow-black/60 bg-gradient-to-br from-[#E50914] to-[#8b0000] flex items-center justify-center">
                          <span className="text-lg font-black text-white/90">{initials}</span>
                        </div>
                      )}
                      {creator.is_creator && (
                        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center border-2 border-[#050505]">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="text-base font-bold text-white group-hover:text-[#E50914] transition-colors mb-1">{creator.display_name}</h3>

                    {/* Badge */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <Sparkles size={10} className="text-[#E50914]" />
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#E50914]">Verified Creator</span>
                    </div>

                    {/* Bio */}
                    {creator.bio && (
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4">{creator.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04]">
                      <div className="flex items-center gap-1.5">
                        <Film size={11} className="text-gray-600" />
                        <span className="text-xs text-gray-400"><span className="text-white font-semibold">{creator.film_count}</span> films</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame size={11} className="text-gray-600" />
                        <span className="text-xs text-gray-400"><span className="text-white font-semibold">{creator.total_upvotes}</span> upvotes</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-10 px-4 md:px-6 border-t border-white/[0.04] mt-8">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            
            <span className="text-lg font-semibold tracking-[0.15em] text-white/80">spike</span>
            <span className="text-lg font-semibold tracking-[0.15em] text-white" >AI</span>
          </div>
          <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} Spike AI. AI-generated cinema.</p>
        </div>
      </footer>
    </div>
  );
}
