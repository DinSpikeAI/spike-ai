"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Play, Award, Globe, ExternalLink,
  Sparkles, Film, Star, Clock, Share2, Check,
} from "lucide-react";
import { supabase, getSmartPoster } from "@/lib/supabase";

interface StudioData {
  name: string; role: string; bio: string; highlight: string;
  avatar: string; toolkit: string[];
  works: { title: string; type: string; note: string }[];
  stats: { label: string; value: string }[];
  links: { label: string; url: string }[];
  website: string;
}

interface MovieData {
  id: string; title: string; poster: string; genre: string;
  year: number; duration: string; rating: number;
  video_url: string; ai_models: string[]; upvotes_count: number;
}

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string || "").replace(/-/g, " ");
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      let match: any = null;
      const { data: d1 } = await supabase.from("pioneer_creators").select("*").eq("visible", true).ilike("name", `%${slug}%`).limit(1);
      if (d1 && d1.length > 0) match = d1[0];
      if (!match) {
        const { data: all } = await supabase.from("pioneer_creators").select("*").eq("visible", true);
        const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        match = (all || []).find((c: any) => normalize(c.name) === normalize(slug));
      }
      if (!match) { setLoading(false); return; }
      const links: { label: string; url: string }[] = [];
      if (match.website) links.push({ label: "Website", url: match.website });
      if (match.social_instagram) links.push({ label: "Instagram", url: `https://instagram.com/${match.social_instagram.replace("@", "")}` });
      if (match.social_youtube) links.push({ label: "YouTube", url: match.social_youtube.startsWith("http") ? match.social_youtube : `https://youtube.com/${match.social_youtube}` });
      if (match.social_facebook) links.push({ label: "Facebook", url: match.social_facebook.startsWith("http") ? match.social_facebook : `https://facebook.com/${match.social_facebook}` });
      if (match.social_x) links.push({ label: "X", url: `https://x.com/${match.social_x.replace("@", "")}` });
      setStudio({
        name: match.name, role: match.role || "AI Creator", bio: match.bio || "",
        highlight: match.highlight || "", avatar: match.avatar_url || "",
        toolkit: match.toolkit || [], works: match.works || [],
        stats: match.custom_stats || [{ label: "Tools", value: String((match.toolkit || []).length) }, { label: "Role", value: "Creator" }, { label: "Status", value: "Pioneer" }],
        links, website: match.website || "",
      });
      const { data: films } = await supabase.from("movies").select("*").eq("status", "approved").ilike("creator_name", `%${match.name}%`).order("sort_order", { ascending: true });
      if (films) setMovies(films.map((f: any) => ({ id: f.id, title: f.title, poster: getSmartPoster(f.poster_url, f.video_url, f.id), genre: f.genre || "", year: f.year || 2026, duration: f.duration || "", rating: Number(f.rating) || 0, video_url: f.video_url || "", ai_models: f.ai_models || [], upvotes_count: f.upvotes_count || 0 })));
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: `${studio?.name} on Spike AI`, url }); }
      else { await navigator.clipboard.writeText(url); setShareMsg("Copied!"); setTimeout(() => setShareMsg(""), 2000); }
    } catch {}
  };

  if (loading) return <div style={S.loadingPage}><div style={S.spinner} /></div>;
  if (!studio) return (
    <div style={S.loadingPage}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Studio not found</h1>
      <button onClick={() => router.push("/creators")} style={{ background: "none", border: "none", color: gold(0.6), fontSize: 14, cursor: "pointer" }}>&larr; Back to creators</button>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Ambient */}
      <div style={S.ambientWrap}>
        <div style={{ ...S.ambientOrb, top: "10%", left: "50%", transform: "translateX(-50%)", width: 900, height: 600, opacity: 0.05, background: `radial-gradient(ellipse, ${gold(0.8)} 0%, ${gold(0.3)} 35%, transparent 70%)` }} />
        <div style={{ ...S.ambientOrb, bottom: "10%", right: "20%", width: 500, height: 400, opacity: 0.03, background: `radial-gradient(ellipse, ${gold(0.5)} 0%, transparent 70%)` }} />
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => router.push("/creators")} style={S.backBtn}><ArrowLeft size={15} /></button>
            <span style={{ fontSize: 14, fontWeight: 500, color: gold(0.4) }}>Studio</span>
          </div>
          <button onClick={handleShare} style={S.shareBtn}>
            {shareMsg ? <><Check size={12} /> {shareMsg}</> : <><Share2 size={12} /> Share</>}
          </button>
        </div>
      </nav>

      {/* ═══ All Content — Single Centered Column ═══ */}
      <div style={S.mainColumn}>

        {/* ── Hero ── */}
        <div style={{ ...S.section, paddingTop: 64, paddingBottom: 48 }}>
          {/* Avatar */}
          <div style={{ position: "relative", marginBottom: 28 }}>
            <div style={{ position: "absolute", inset: -12, borderRadius: "50%", opacity: 0.7, background: "linear-gradient(145deg, #d4a84b, #f5d77a, #b8862d, #e8c65a)", filter: "blur(10px)" }} />
            <div style={{ position: "relative", width: 220, height: 220, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(212,168,83,0.4)", boxShadow: "0 0 60px rgba(212,168,83,0.2), 0 20px 60px rgba(0,0,0,0.5)" }}>
              <img src={studio.avatar} alt={studio.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 50, background: "linear-gradient(145deg, #d4a84b, #f5d77a, #b8862d)", boxShadow: "0 2px 12px rgba(180,130,40,0.5), inset 0 1px 1px rgba(255,235,170,0.5)" }}>
                <Award size={11} style={{ color: "#5c3d0e" }} />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "#5c3d0e" }}>Featured Creator</span>
              </div>
            </div>
          </div>

          {/* Name */}
          <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.02em", background: "linear-gradient(180deg, #f5d77a 0%, #d4a853 40%, #b8862d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>{studio.name}</h1>
          <p style={{ fontSize: 15, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: gold(0.4), marginBottom: 32 }}>{studio.role}</p>

          {/* Highlight */}
          {studio.highlight && (
            <div style={{ maxWidth: 520, padding: "24px 32px", borderRadius: 16, border: `1px solid ${gold(0.1)}`, background: gold(0.03), marginBottom: 32 }}>
              <Sparkles size={14} style={{ color: gold(0.4), marginBottom: 12 }} />
              <p style={{ fontSize: 15, lineHeight: 1.8, fontStyle: "italic", color: gold(0.5) }}>{studio.highlight}</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
            {studio.stats.map((s) => (
              <div key={s.label} style={{ padding: "16px 28px", borderRadius: 16, border: `1px solid ${gold(0.1)}`, background: gold(0.02), minWidth: 120, textAlign: "center" as const }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: gold(0.8), marginBottom: 4 }}>{s.value}</p>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: gold(0.25) }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, justifyContent: "center" }}>
            {studio.links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 50, fontSize: 12, fontWeight: 500, border: `1px solid ${gold(0.15)}`, color: gold(0.5), textDecoration: "none" }}>
                <ExternalLink size={12} /> {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={S.divider} />

        {/* ── Films ── */}
        {movies.length > 0 && (
          <div style={S.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
              <Film size={18} style={{ color: gold(0.4) }} />
              <h2 style={{ fontSize: 28, fontWeight: 700, color: gold(0.7) }}>Films</h2>
              <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 50, border: `1px solid ${gold(0.15)}`, color: gold(0.35) }}>{movies.length} films</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "center", gap: 24 }}>
              {movies.map((movie) => (
                <div key={movie.id} onClick={() => router.push(`/movie/${movie.id}`)}
                  style={{ width: 300, borderRadius: 12, overflow: "hidden", border: `1px solid ${gold(0.08)}`, background: gold(0.02), cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                  <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                    <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {movie.genre && (
                      <span style={{ position: "absolute", bottom: 8, left: 8, padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, background: "rgba(0,0,0,0.7)", color: gold(0.7), border: `1px solid ${gold(0.15)}` }}>{movie.genre}</span>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>{movie.title}</h3>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: gold(0.3) }}>
                      {movie.rating > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={10} /> {movie.rating}</span>}
                      <span>{movie.year}</span>
                      {movie.duration && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {movie.duration}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div style={S.divider} />

        {/* ── About ── */}
        <div style={{ ...S.section, maxWidth: 600 }}>
          <h2 style={S.sectionTitle}>About</h2>
          <p style={{ fontSize: 15, lineHeight: 2, color: "rgba(255,255,255,0.35)", textAlign: "center" as const, marginBottom: 48 }}>{studio.bio}</p>

          {studio.works.length > 0 && (
            <>
              <h2 style={S.sectionTitle}>Selected Works</h2>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginBottom: 48, width: "100%" }}>
                {studio.works.map((work) => (
                  <div key={work.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12, border: `1px solid ${gold(0.06)}`, background: gold(0.02) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: gold(0.06), border: `1px solid ${gold(0.1)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Award size={16} style={{ color: gold(0.4) }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{work.title}</p>
                        <p style={{ fontSize: 11, color: gold(0.25), marginTop: 2 }}>{work.type}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: gold(0.2) }}>{work.note}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 style={S.sectionTitle}>Toolkit</h2>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, justifyContent: "center" }}>
            {studio.toolkit.map((tool) => (
              <span key={tool} style={{ padding: "8px 16px", borderRadius: 50, fontSize: 12, fontWeight: 500, border: `1px solid ${gold(0.12)}`, color: gold(0.45), background: gold(0.03) }}>{tool}</span>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ ...S.divider, marginTop: 48 }} />
        <div style={{ textAlign: "center" as const, padding: "40px 0" }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", color: gold(0.12) }}>spike AI</span>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", marginTop: 12 }}>&copy; 2026 Spike AI. The home for AI-generated cinema.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Gold helper ───
function gold(opacity: number): string {
  return `rgba(212,168,83,${opacity})`;
}

// ─── Styles ───
const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#08080a", color: "white", overflow: "hidden" },
  loadingPage: { minHeight: "100vh", background: "#08080a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  spinner: { width: 32, height: 32, border: "2px solid rgba(212,168,83,0.3)", borderTopColor: "rgba(212,168,83,1)", borderRadius: "50%", animation: "spin 1s linear infinite" },
  ambientWrap: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 },
  ambientOrb: { position: "absolute", borderRadius: "50%" },
  nav: { position: "sticky", top: 0, zIndex: 50, background: "rgba(8,8,10,0.7)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(212,168,83,0.08)" },
  navInner: { maxWidth: 800, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(212,168,83,0.15)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(212,168,83,0.4)", cursor: "pointer" },
  shareBtn: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 50, border: "1px solid rgba(212,168,83,0.15)", background: "none", color: "rgba(212,168,83,0.4)", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  mainColumn: { position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px" },
  section: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", maxWidth: 800, padding: "48px 0" },
  sectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,168,83,0.3)", marginBottom: 24 },
  divider: { width: "100%", maxWidth: 800, height: 1, background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.15), transparent)" },
};
