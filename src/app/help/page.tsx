"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, Film, Upload, Heart, Shield,
  Bookmark, User, Mail, HelpCircle,
} from "lucide-react";

const FAQ = [
  { q: "What is spike AI?", a: "spike AI is a streaming platform dedicated to AI-generated cinema. We showcase films created using tools like Runway, Kling, Midjourney, ElevenLabs, and more.", icon: Film, color: "from-violet-500 to-indigo-600" },
  { q: "How do I submit my AI film?", a: "Go to 'Submit Film' from the navigation. Fill in your film details, paste your YouTube or Vimeo link, and submit. Our team reviews and approves quality submissions.", icon: Upload, color: "from-cyan-400 to-blue-600" },
  { q: "How does the upvote system work?", a: "Every approved film can be upvoted once per user. Sign in, find a film you love, and hit the upvote button. The most upvoted films get featured on the homepage.", icon: Heart, color: "from-rose-400 to-pink-600" },
  { q: "What is the Watchlist?", a: "Your personal collection of films to watch later. Click the bookmark icon on any film to save it. Access it anytime from 'My List'.", icon: Bookmark, color: "from-amber-400 to-orange-500" },
  { q: "How do Creator pages work?", a: "Every creator gets a dedicated Studio page showcasing their filmography, bio, and social links. Submit a film and your profile is automatically created.", icon: User, color: "from-emerald-400 to-teal-600" },
  { q: "Is it free?", a: "Yes. spike AI is currently free for viewers and creators. No subscription, no fees. You keep full ownership and credit for your work.", icon: Shield, color: "from-blue-400 to-indigo-600" },
  { q: "How do I contact the team?", a: "Email us at spikeaistudio@gmail.com — we typically respond within a few business days. We'd love to hear feature requests or bug reports.", icon: Mail, color: "from-fuchsia-400 to-purple-600" },
];

export default function HelpPage() {
  const router = useRouter();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      {/* ═══ Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.3) 30%, transparent 70%)", animation: "glow 15s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ── Nav ── */}
      <div className="sticky top-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[700px] mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer"><ArrowLeft size={15} /></button>
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Help</span>
        </div>
      </div>

      {/* ═══ CENTERED CONTENT ═══ */}
      <div className="relative z-10 max-w-[700px] mx-auto px-6 pt-16 pb-20" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Title */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-400/10 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/5">
            <HelpCircle size={34} className="text-indigo-300/50" />
          </div>
          <h1 className="text-[42px] md:text-[52px] font-bold tracking-tight mb-3">
            How can we{" "}
            <span className="bg-gradient-to-r from-white/40 via-indigo-300/50 to-violet-400/40 bg-clip-text text-transparent">help?</span>
          </h1>
          <p className="text-[16px] text-white/20">Everything you need to know about spike AI.</p>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = openIdx === i;
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden backdrop-blur-xl hover:bg-white/[0.03] transition-all duration-300">
                <button onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center gap-5 px-6 py-5 text-left cursor-pointer transition-colors">
                  <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-[15px] font-medium tracking-wide flex-1">{item.q}</span>
                  <ChevronDown size={18} className={`text-white/15 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pl-[76px]" style={{ animation: "slideDown 0.3s ease" }}>
                    <p className="text-[14px] leading-[1.8] text-white/25 tracking-wide">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="mt-20 text-center">
          <p className="text-[15px] text-white/15 mb-7">Still have questions?</p>
          <a href="mailto:spikeaistudio@gmail.com"
            className="cta-btn inline-flex items-center gap-3 px-10 py-[16px] text-black text-[15px] font-semibold rounded-full transition-all cursor-pointer">
            <Mail size={17} /> Contact Us
          </a>
        </div>

        <div className="mt-20 text-center"><span className="text-[14px] font-semibold tracking-[0.2em] text-white/[0.04]">spike AI</span></div>
      </div>

      <style jsx>{`
        .cta-btn {
          background: linear-gradient(180deg, #fff 0%, #e4e4e7 100%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 4px 20px rgba(255,255,255,0.06), 0 0 60px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cta-btn:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 8px 40px rgba(255,255,255,0.1), 0 0 80px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,1); transform: translateY(-2px); }
        @keyframes reveal { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes glow { 0%,100% { opacity:0.04; transform:translate(-50%,0) scale(1) } 50% { opacity:0.07; transform:translate(-50%,0) scale(1.1) } }
      `}</style>
    </div>
  );
}
