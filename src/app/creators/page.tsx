"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Film, ArrowRight,
  ChevronDown, ExternalLink, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   CREATOR INTERFACE
   ═══════════════════════════════════════════════════════════════ */

interface Creator {
  id: string;
  name: string;
  badge: string;
  role: string;
  avatar: string;
  bio: string;
  highlight: string;
  toolkit: string[];
  works: { title: string; type: string; note: string }[];
  links: { label: string; url: string }[];
  stats: { label: string; value: string }[];
  featured: boolean;
}

function mapDbToCreator(row: any): Creator {
  const links: { label: string; url: string }[] = [];
  if (row.website) links.push({ label: "Website", url: row.website });
  if (row.social_instagram) links.push({ label: "Instagram", url: `https://instagram.com/${row.social_instagram.replace("@", "")}` });
  if (row.social_youtube) links.push({ label: "YouTube", url: row.social_youtube.startsWith("http") ? row.social_youtube : `https://youtube.com/${row.social_youtube}` });
  if (row.social_facebook) links.push({ label: "Facebook", url: `https://facebook.com/${row.social_facebook}` });
  if (row.social_x) links.push({ label: "X", url: `https://x.com/${row.social_x.replace("@", "")}` });
  if (row.email) links.push({ label: "Email", url: `mailto:${row.email}` });

  return {
    id: row.id,
    name: row.name,
    badge: "Pioneer Creator",
    role: row.role || "AI Creator",
    avatar: row.avatar_url || "",
    bio: row.bio || "",
    highlight: row.highlight || row.bio || "",
    toolkit: row.toolkit || [],
    works: (row.works || []).map((w: any) => ({ title: w.title || "", type: w.type || "", note: w.note || "" })),
    links,
    stats: row.custom_stats || [
      { label: "AI tools", value: String((row.toolkit || []).length) },
      { label: "Role", value: (row.role || "Creator").split(" · ")[0] },
      { label: "Status", value: "Pioneer" },
    ],
    featured: row.featured || false,
  };
}

/* ═══════════════════════════════════════════════════════════════
   CREATOR CARD
   ═══════════════════════════════════════════════════════════════ */

function CreatorCard({ creator }: { creator: Creator }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
    const handleResize = () => {
      if (contentRef.current && expanded) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [expanded]);

  return (
    <div className="flex flex-col items-center">
      {/* ── Collapsed: Photo + Name + Badge ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="group cursor-pointer flex flex-col items-center text-center focus:outline-none"
      >
        {/* Avatar — premium circular container */}
        <div className="relative mb-5">
          {/* Outer glow ring */}
          <div className={`absolute -inset-1 rounded-full transition-all duration-700 ${
            expanded
              ? "opacity-100 shadow-[0_0_30px_rgba(212,168,75,0.25)]"
              : "opacity-0 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(212,168,75,0.15)]"
          }`}
            style={{ background: "linear-gradient(145deg, #d4a84b, #f5d77a, #b8862d, #e8c65a)" }}
          />
          {/* Photo container */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-[3px] border-[#0c0c12] shadow-2xl shadow-black/60">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.classList.add("avatar-fallback");
              }}
            />
            {/* Fallback initials (shown if image fails) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 avatar-initials pointer-events-none">
              <span className="text-3xl md:text-4xl font-bold text-white/80">
                {creator.name.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 flex items-center justify-center">
              <ChevronDown
                size={20}
                className={`text-white/0 group-hover:text-white/60 transition-all duration-500 ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {/* Gold Badge — positioned below avatar */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 gold-badge">
            <div className="relative flex items-center justify-center px-4 py-1.5 rounded-[4px]"
              style={{
                background: "linear-gradient(145deg, #d4a84b 0%, #f5d77a 20%, #c9953c 40%, #f5d77a 55%, #b8862d 75%, #e8c65a 100%)",
                boxShadow: "0 2px 8px rgba(180,130,40,0.4), 0 1px 2px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,235,170,0.5), inset 0 -1px 1px rgba(120,80,20,0.3)",
                border: "1px solid rgba(218,175,80,0.6)",
              }}>
              <div className="absolute inset-0 rounded-[4px] opacity-[0.08]"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.15) 1px, rgba(255,255,255,0.15) 2px)" }} />
              <div className="absolute inset-0 rounded-[4px] opacity-30"
                style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,245,200,0.4) 45%, transparent 55%)" }} />
              <div className="absolute top-[3px] right-[5px] w-[5px] h-[5px] rotate-45"
                style={{ background: "linear-gradient(135deg, #2a2a2a 0%, #555 40%, #1a1a1a 100%)", boxShadow: "0 0 3px rgba(255,220,120,0.5)" }} />
              <span className="relative text-[8px] md:text-[9px] font-extrabold tracking-[0.25em] uppercase pr-1"
                style={{ color: "#8b6914", textShadow: "0 1px 0 rgba(255,235,170,0.5), 0 -0.5px 0 rgba(80,50,10,0.4)" }}>
                {creator.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Name */}
        <h3 className="text-2xl md:text-[32px] font-bold tracking-tight text-white/90 group-hover:text-white transition-colors mt-2">
          {creator.name}
        </h3>
        <p className="text-[12px] md:text-[13px] text-white/20 tracking-widest uppercase mt-1.5">{creator.role}</p>

        {/* Tap hint */}
        <div className={`flex items-center gap-1.5 mt-4 transition-all duration-500 ${
          expanded ? "text-white/25" : "text-white/10 group-hover:text-white/25"
        }`}>
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase">
            {expanded ? "Tap to close" : "Tap to explore"}
          </span>
          <ChevronDown size={12} className={`transition-transform duration-500 ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`} />
        </div>
      </button>

      {/* ── Expanded: Full Profile ── */}
      <div
        className="w-full max-w-[620px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ maxHeight: expanded ? `${contentHeight}px` : "0px", opacity: expanded ? 1 : 0 }}
      >
        <div ref={contentRef} className="pt-10 pb-6">

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-10" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {creator.stats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center min-h-[110px] flex flex-col items-center justify-center">
                <p className="text-lg md:text-xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-2 leading-tight break-words">{stat.value}</p>
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/20">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Highlight */}
          <div className="mb-10 px-6 py-6 rounded-2xl bg-gradient-to-br from-amber-500/[0.04] to-yellow-500/[0.02] border border-amber-500/[0.08]">
            <Sparkles size={14} className="text-amber-400/40 mb-3" />
            <p className="text-[15px] text-white/50 leading-[1.8] italic">
              &quot;{creator.highlight}&quot;
            </p>
          </div>

          {/* Bio */}
          <div className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/15 mb-4">About</p>
            <p className="text-[14px] text-white/35 leading-[1.8]">{creator.bio}</p>
          </div>

          {/* Toolkit */}
          <div className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/15 mb-4">AI Toolkit</p>
            <div className="flex flex-wrap justify-center gap-2">
              {creator.toolkit.map((tool) => (
                <span key={tool} className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-white/45 bg-white/[0.04] border border-white/[0.06] hover:border-amber-500/20 hover:text-amber-200/50 transition-all duration-300 cursor-default">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Selected Works */}
          {creator.works.length > 0 && (
          <div className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/15 mb-4">Selected Works</p>
            <div className="space-y-3">
              {creator.works.map((work) => (
                <div key={work.title} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group/work">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Film size={16} className="text-amber-400/40" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-white/70 group-hover/work:text-white/90 transition-colors">{work.title}</p>
                      <p className="text-[11px] text-white/20 mt-0.5">{work.type}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-white/15 hidden sm:block">{work.note}</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-3">
            {creator.links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium text-white/30 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:text-white/50 transition-all duration-300">
                <ExternalLink size={12} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEATURED CREATOR CARD — Large, centered, expandable
   ═══════════════════════════════════════════════════════════════ */

function FeaturedCreatorCard({ creator }: { creator: Creator }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
    const handleResize = () => { if (contentRef.current && expanded) setContentHeight(contentRef.current.scrollHeight); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [expanded]);

  return (
    <div className="flex flex-col items-center w-full max-w-[700px]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group cursor-pointer flex flex-col items-center text-center focus:outline-none"
      >
        {/* Avatar — extra large with gold glow */}
        <div className="relative mb-7">
          <div className={`absolute -inset-3 rounded-full transition-all duration-700 ${
            expanded
              ? "opacity-100 shadow-[0_0_50px_rgba(212,168,75,0.35)]"
              : "opacity-60 group-hover:opacity-100 group-hover:shadow-[0_0_40px_rgba(212,168,75,0.25)]"
          }`}
            style={{ background: "linear-gradient(145deg, #d4a84b, #f5d77a, #b8862d, #e8c65a)" }}
          />
          <div className="relative w-52 h-52 md:w-64 md:h-64 rounded-full overflow-hidden border-[4px] border-[#0c0c12] shadow-2xl shadow-black/60">
            <img src={`/creators/${creator.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-")}-featured.jpg`}
              alt={creator.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = creator.avatar; }} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 flex items-center justify-center">
              <ChevronDown size={24} className={`text-white/0 group-hover:text-white/60 transition-all duration-500 ${expanded ? "rotate-180" : ""}`} />
            </div>
          </div>
          {/* Large Gold Badge */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 gold-badge">
            <div className="relative flex items-center justify-center px-6 py-2.5 rounded-[5px]"
              style={{
                background: "linear-gradient(145deg, #d4a84b 0%, #f5d77a 20%, #c9953c 40%, #f5d77a 55%, #b8862d 75%, #e8c65a 100%)",
                boxShadow: "0 3px 12px rgba(180,130,40,0.5), 0 1px 3px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,235,170,0.5)",
                border: "1px solid rgba(218,175,80,0.6)",
              }}>
              <div className="absolute inset-0 rounded-[5px] opacity-[0.08]"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.15) 1px, rgba(255,255,255,0.15) 2px)" }} />
              <span className="relative text-[10px] md:text-[11px] font-extrabold tracking-[0.25em] uppercase"
                style={{ color: "#8b6914", textShadow: "0 1px 0 rgba(255,235,170,0.5)" }}>
                {creator.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Name — extra large */}
        <h3 className="text-4xl md:text-6xl font-bold tracking-tight text-white/95 group-hover:text-white transition-colors mt-3">
          {creator.name}
        </h3>
        <p className="text-[13px] md:text-[15px] text-white/25 tracking-widest uppercase mt-2.5">{creator.role}</p>

        {/* Tap hint */}
        <div className={`flex items-center gap-1.5 mt-5 transition-all duration-500 ${expanded ? "text-white/25" : "text-white/10 group-hover:text-white/25"}`}>
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase">
            {expanded ? "Tap to close" : "Tap to explore"}
          </span>
          <ChevronDown size={12} className={`transition-transform duration-500 ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`} />
        </div>
      </button>

      {/* ── Expanded Section ── */}
      <div className="w-full overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ maxHeight: expanded ? `${contentHeight}px` : "0px", opacity: expanded ? 1 : 0 }}>
        <div ref={contentRef} className="pt-10 pb-6">

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-10" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {creator.stats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center min-h-[110px] flex flex-col items-center justify-center">
                <p className="text-lg md:text-xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-2 leading-tight break-words">{stat.value}</p>
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/20">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Highlight */}
          <div className="mb-10 px-6 py-6 rounded-2xl bg-gradient-to-br from-amber-500/[0.04] to-yellow-500/[0.02] border border-amber-500/[0.08]">
            <Sparkles size={14} className="text-amber-400/40 mb-3" />
            <p className="text-[15px] text-white/50 leading-[1.8] italic">
              &quot;{creator.highlight}&quot;
            </p>
          </div>

          {/* Bio */}
          <div className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/15 mb-4">About</p>
            <p className="text-[14px] text-white/35 leading-[1.8]">{creator.bio}</p>
          </div>

          {/* Works */}
          {creator.works.length > 0 && (
          <div className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/15 mb-4">Selected Works</p>
            <div className="space-y-3">
              {creator.works.map((work) => (
                <div key={work.title} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group/work">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Film size={16} className="text-amber-400/40" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-white/70 group-hover/work:text-white/90 transition-colors">{work.title}</p>
                      <p className="text-[11px] text-white/20 mt-0.5">{work.type}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-white/15 hidden sm:block">{work.note}</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Toolkit */}
          <div className="mb-10">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/15 mb-4">AI Toolkit</p>
            <div className="flex flex-wrap justify-center gap-2">
              {creator.toolkit.map((tool) => (
                <span key={tool} className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-white/45 bg-white/[0.04] border border-white/[0.06] hover:border-amber-500/20 hover:text-amber-200/50 transition-all duration-300 cursor-default">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-3">
            {creator.links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium text-white/30 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:text-white/50 transition-all duration-300">
                <ExternalLink size={12} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREATORS PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function CreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from("pioneer_creators")
        .select("*")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (data) setCreators(data.map(mapDbToCreator));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">

      {/* Ambient — Premium layered background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top warm spotlight */}
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(180,140,60,0.5) 0%, rgba(139,92,246,0.3) 35%, transparent 70%)", animation: "glow 18s ease-in-out infinite" }} />
        {/* Center indigo wash */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, transparent 65%)", animation: "glow 12s ease-in-out infinite reverse" }} />
        {/* Bottom warm glow */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(ellipse, rgba(212,168,75,0.4) 0%, transparent 70%)", animation: "glow 20s ease-in-out infinite" }} />
        {/* Subtle vignette */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)" }} />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
        {/* Fine grid lines */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer">
            <ArrowLeft size={15} />
          </button>
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Creators</span>
        </div>
      </div>

      {/* ═══ ALL CONTENT CENTERED ═══ */}
      <div className="relative z-10 flex flex-col items-center px-6">

        {/* Hero */}
        <div className="text-center pt-16 md:pt-24 pb-10 md:pb-14 max-w-[800px]" style={{ animation: "reveal 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/[0.08] border border-indigo-400/[0.12] text-[11px] font-bold tracking-[0.25em] text-indigo-300/60 uppercase mb-8 backdrop-blur-sm">
            <Sparkles size={13} className="text-indigo-400/60" />
            Pioneer Creators
          </div>

          <h1 className="text-[42px] md:text-[60px] lg:text-[72px] font-bold tracking-tight leading-[1.05] mb-6">
            The artists behind{" "}
            <span className="bg-gradient-to-r from-white/40 via-indigo-300/50 to-violet-400/40 bg-clip-text text-transparent">
              Spike AI cinema.
            </span>
          </h1>

          <p className="text-[16px] md:text-[18px] text-white/20 leading-[1.7] max-w-lg mx-auto">
            A handpicked group of visionary filmmakers defining the future of AI-generated cinema on Spike AI.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full max-w-[1100px]">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Founders */}
        <div className="py-14 md:py-20 w-full max-w-[1100px]" style={{ animation: "reveal 1s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-white/15" /></div>
          ) : creators.length === 0 ? (
            <div className="text-center py-20"><p className="text-white/15">No creators yet</p></div>
          ) : (
            <>
              {/* ═══ Featured Creators — Large, Centered, Expandable ═══ */}
              {creators.filter(c => c.featured).length > 0 && (
                <div className="mb-16 md:mb-20">
                  <div className="flex flex-col items-center gap-14 md:gap-16">
                    {creators.filter(c => c.featured).map((creator) => (
                      <FeaturedCreatorCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mt-16" />
                </div>
              )}

              {/* ═══ Regular Creators Grid ═══ */}
              {creators.filter(c => !c.featured).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
                  {creators.filter(c => !c.featured).map((creator) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* More Coming */}
        <div className="w-full max-w-[1100px] text-center pb-20">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-16" />

          <div className="flex items-center justify-center gap-4 mb-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-dashed border-white/[0.06] flex items-center justify-center">
                <span className="text-white/[0.08] text-lg font-bold">?</span>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-white/15 tracking-wide mb-2">More creators joining soon</p>
          <p className="text-[11px] text-white/[0.08] tracking-wider">Applications are open</p>

          <button
            onClick={() => router.push("/submit")}
            className="mt-10 inline-flex items-center gap-3 px-10 py-4 text-black text-[15px] font-semibold tracking-wide rounded-full cursor-pointer transition-all active:scale-[0.97] cta-btn"
          >
            Apply as Creator
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-white/[0.03]">
        <div className="text-center">
          <span className="text-[14px] font-semibold tracking-[0.2em] text-white/[0.06]">spike AI</span>
          <div className="flex justify-center gap-4 mt-3 text-[11px] text-white/15"><a href="/terms" className="hover:text-white/30 transition-colors">Terms</a><a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a><a href="/community-guidelines" className="hover:text-white/30 transition-colors">Guidelines</a></div>
        </div>
      </footer>

      <style jsx>{`
        .cta-btn {
          background: linear-gradient(180deg, #fff 0%, #e4e4e7 100%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 4px 20px rgba(255,255,255,0.06), 0 0 60px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cta-btn:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 8px 40px rgba(255,255,255,0.1), 0 0 80px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,1);
          transform: translateY(-2px);
        }
        .gold-badge { transition: all 0.3s ease; }
        .gold-badge:hover { filter: brightness(1.1); }
        .avatar-fallback { background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%); }
        .avatar-fallback + .avatar-initials, .avatar-fallback ~ .avatar-initials { opacity: 1 !important; }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.05; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 0.08; transform: translate(-50%, 0) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
