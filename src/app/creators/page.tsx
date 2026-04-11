"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Film, ArrowRight,
  ChevronDown, ExternalLink,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   FOUNDING CREATORS DATA
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
}

const FOUNDERS: Creator[] = [
  {
    id: "maya-shoshani",
    name: "Maya Shoshani",
    badge: "Pioneer Creator",
    role: "Independent Filmmaker \u00b7 Former Lightricks AI Specialist",
    avatar: "/creators/maya-shoshani.jpg",
    bio: "Featured in GenAI Magazine as a leading voice in AI cinema. Former Creative AI Specialist at Lightricks ($1.8B). Now an independent filmmaker, Maya directs, writes, edits, designs sound, and collaborates with composers to create films with real emotional depth \u2013 a complete auteur pipeline powered by AI.",
    highlight: "Invested over 300 hours in a single 14-minute film with an original composed score. Creator of \"Breakup Letters\" \u2013 a 6-part cinematic AI series submitted to major international film festivals.",
    toolkit: ["Kling", "Sora", "Veo3", "Wan 2.6", "Minimax", "Seedance", "After Effects"],
    works: [
      { title: "Breakup Letters", type: "Series \u00b7 6 Episodes", note: "International film festivals" },
      { title: "14-Min Short Film", type: "Drama \u00b7 Original Score", note: "300+ hours production" },
      { title: "Meditation Gone Very Wrong", type: "Comedy / Experimental", note: "Behance featured" },
    ],
    links: [
      { label: "Portfolio", url: "https://www.behance.net/mayas-vision" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/maya-shoshani-296147164/" },
      { label: "Facebook", url: "https://www.facebook.com/maya.shoshani.9" },
      { label: "Instagram", url: "https://www.instagram.com/mayas.vision" },
    ],
    stats: [
      { label: "Hours per film", value: "300+" },
      { label: "Festival submissions", value: "6+" },
      { label: "AI tools mastered", value: "7" },
    ],
  },
];

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
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-[3px] border-[#0c0c12] shadow-2xl shadow-black/60">
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
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center">
                <p className="text-2xl md:text-3xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-1">{stat.value}</p>
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
        <div className="w-full max-w-[620px]">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Founders */}
        <div className="py-14 md:py-20 w-full max-w-[620px]" style={{ animation: "reveal 1s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
          {FOUNDERS.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>

        {/* More Coming */}
        <div className="w-full max-w-[620px] text-center pb-20">
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
