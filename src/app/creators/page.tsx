"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Film, ArrowRight, ExternalLink, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Creator {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  website: string;
  social_x: string;
  social_youtube: string;
  social_instagram: string;
  toolkit: string[];
  created_at: string;
  film_count: number;
}

export default function CreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      // Fetch all creators
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, website, social_x, social_youtube, social_instagram, toolkit, created_at")
        .eq("user_type", "creator")
        .order("created_at", { ascending: true });

      if (!profiles || profiles.length === 0) { setLoading(false); return; }

      // Fetch film counts for each creator
      const { data: movies } = await supabase
        .from("movies")
        .select("creator_name")
        .eq("status", "approved");

      const filmCounts: Record<string, number> = {};
      (movies || []).forEach((m: any) => {
        const name = m.creator_name || "";
        filmCounts[name] = (filmCounts[name] || 0) + 1;
      });

      const creatorList: Creator[] = profiles.map((p: any) => ({
        id: p.id,
        display_name: p.display_name || "Creator",
        avatar_url: p.avatar_url,
        bio: p.bio || "",
        website: p.website || "",
        social_x: p.social_x || "",
        social_youtube: p.social_youtube || "",
        social_instagram: p.social_instagram || "",
        toolkit: p.toolkit || [],
        created_at: p.created_at,
        film_count: filmCounts[p.display_name] || 0,
      }));

      setCreators(creatorList);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-purple-600/[0.04] blur-[180px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 px-6 md:px-12 py-6 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Back</span>
        </button>
        <button onClick={() => router.push("/become-creator")} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all">
          <Sparkles size={14} /> Apply as Creator
        </button>
      </nav>

      {/* Header */}
      <div className="relative z-10 text-center px-6 pt-8 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-6">
          <Sparkles size={12} /> Pioneer Creators
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Our Creators</h1>
        <p className="text-white/25 text-base md:text-lg max-w-lg mx-auto">
          The filmmakers shaping the future of AI cinema.
          {creators.length > 0 && <span className="text-white/40"> {creators.length} creators and counting.</span>}
        </p>
      </div>

      {/* Creators Grid */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-white/20" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <Film size={32} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/20 mb-2">No creators yet</p>
            <p className="text-white/10 text-sm">Be the first to join.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {creators.map((creator, index) => (
              <div
                key={creator.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-300"
                style={{ animation: `reveal 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s backwards` }}
              >
                <div
                  className="flex items-center gap-5 p-6 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === creator.id ? null : creator.id)}
                >
                  {/* Avatar */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/[0.08] shadow-lg shadow-black/40">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-2xl font-bold text-white/40">
                        {creator.display_name[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{creator.display_name}</h2>
                      <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-[0.12em] uppercase bg-gradient-to-r from-yellow-600/80 to-amber-500/80 text-white shadow-sm">
                        Pioneer Creator
                      </span>
                    </div>
                    {creator.bio && (
                      <p className="text-white/35 text-sm leading-relaxed line-clamp-2">{creator.bio}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-white/20">
                        <span className="text-white/50 font-semibold">{creator.film_count}</span> {creator.film_count === 1 ? "film" : "films"}
                      </span>
                      {creator.toolkit.length > 0 && (
                        <span className="text-xs text-white/20">
                          {creator.toolkit.slice(0, 3).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className={`flex-shrink-0 text-white/15 transition-transform duration-300 ${expandedId === creator.id ? "rotate-90" : ""}`}>
                    <ArrowRight size={18} />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === creator.id && (
                  <div className="px-6 pb-6 border-t border-white/[0.04] pt-5" style={{ animation: "reveal 0.3s ease" }}>
                    {creator.bio && (
                      <p className="text-white/40 text-sm leading-relaxed mb-5">{creator.bio}</p>
                    )}

                    {/* Toolkit */}
                    {creator.toolkit.length > 0 && (
                      <div className="mb-5">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-white/15 uppercase mb-2">AI Toolkit</p>
                        <div className="flex flex-wrap gap-2">
                          {creator.toolkit.map(tool => (
                            <span key={tool} className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.06] text-white/40">{tool}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-3 mb-5">
                      {creator.website && (
                        <a href={creator.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-purple-400/70 hover:text-purple-300 transition-colors">
                          <ExternalLink size={11} /> Website
                        </a>
                      )}
                      {creator.social_instagram && (
                        <a href={`https://instagram.com/${creator.social_instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-purple-400/70 hover:text-purple-300 transition-colors">
                          <ExternalLink size={11} /> Instagram
                        </a>
                      )}
                      {creator.social_youtube && (
                        <a href={`https://youtube.com/${creator.social_youtube.replace("@", "@")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-purple-400/70 hover:text-purple-300 transition-colors">
                          <ExternalLink size={11} /> YouTube
                        </a>
                      )}
                      {creator.social_x && (
                        <a href={`https://x.com/${creator.social_x.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-purple-400/70 hover:text-purple-300 transition-colors">
                          <ExternalLink size={11} /> X
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/creator/${creator.id}`)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
                    >
                      <Film size={14} /> View Full Profile & Films
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Coming Soon */}
        {!loading && (
          <div className="text-center pt-16 pb-8">
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border border-dashed border-white/[0.08] flex items-center justify-center text-white/10 text-lg">?</div>
              ))}
            </div>
            <p className="text-white/20 text-sm mb-1">More creators joining soon</p>
            <p className="text-white/10 text-xs mb-6">Applications are open</p>
            <button
              onClick={() => router.push("/become-creator")}
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 rounded-full text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
            >
              Apply as Creator <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-lg font-semibold tracking-[0.18em] text-white">spike AI</span>
          <p className="text-white/15 text-xs mt-3">&copy; {new Date().getFullYear()} Spike AI. The home for AI-generated cinema.</p>
          <div className="flex justify-center gap-4 mt-2 text-[11px] text-white/10">
            <a href="/terms" className="hover:text-white/25 transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white/25 transition-colors">Privacy</a>
            <a href="/community-guidelines" className="hover:text-white/25 transition-colors">Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
