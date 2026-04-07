"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Users, Film, Award, ArrowRight } from "lucide-react";

export default function CreatorsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">

      {/* ═══ Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Central spotlight */}
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, rgba(139,92,246,0.4) 30%, transparent 70%)", animation: "glow 15s ease-in-out infinite" }} />
        <div className="absolute bottom-[5%] left-[50%] -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.6) 0%, transparent 70%)", animation: "glow 20s ease-in-out infinite reverse" }} />
        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ── Nav ── */}
      <div className="sticky top-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer">
            <ArrowLeft size={15} />
          </button>
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Creators</span>
        </div>
      </div>

      {/* ═══ CENTERED CONTENT ═══ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6 py-20">
        <div className="max-w-[800px] w-full text-center" style={{ animation: "reveal 0.8s cubic-bezier(0.16,1,0.3,1)" }}>

          {/* ── Badge ── */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/[0.08] border border-indigo-400/[0.12] text-[11px] font-bold tracking-[0.25em] text-indigo-300/60 uppercase mb-10 backdrop-blur-sm">
            <Sparkles size={13} className="text-indigo-400/60" />
            Invite Only
          </div>

          {/* ── Headline with gradient ── */}
          <h1 className="text-[52px] md:text-[72px] lg:text-[84px] font-bold tracking-tight leading-[1.05] mb-7">
            The creators shaping{" "}
            <span className="bg-gradient-to-r from-white/40 via-indigo-300/50 to-violet-400/40 bg-clip-text text-transparent">
              AI cinema.
            </span>
          </h1>

          {/* ── Subtitle ── */}
          <p className="text-[17px] md:text-[20px] text-white/20 leading-[1.7] max-w-xl mx-auto mb-16">
            We&apos;re handpicking a select group of founding creators to define the next era of filmmaking. The full directory launches soon.
          </p>

          {/* ═══ Feature Cards — Glassmorphic ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-20 max-w-[700px] mx-auto">
            {[
              { icon: Film, title: "Studio Page", desc: "A dedicated profile with your filmography, bio, and links.", color: "from-violet-500 to-indigo-600", glow: "violet" },
              { icon: Award, title: "Official Selection", desc: "A badge of recognition for your portfolio and social channels.", color: "from-amber-400 to-orange-500", glow: "amber" },
              { icon: Users, title: "Community", desc: "Join a growing network of AI filmmakers and get discovered.", color: "from-cyan-400 to-blue-500", glow: "cyan" },
            ].map((item) => (
              <div key={item.title}
                className="relative group bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 md:p-8 backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500 cursor-default">
                {/* Icon with color */}
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon size={22} className="text-white" />
                </div>
                <h3 className="text-[16px] font-bold tracking-wide mb-2">{item.title}</h3>
                <p className="text-[13px] text-white/20 leading-[1.7]">{item.desc}</p>
                {/* Hover glow */}
                <div className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-[0.03] blur-xl transition-opacity duration-500 -z-10`} />
              </div>
            ))}
          </div>

          {/* ═══ CTA ═══ */}
          <div>
            <p className="text-[15px] text-white/15 mb-7 tracking-wide">Have an AI film you want to showcase?</p>
            <button
              onClick={() => router.push("/submit")}
              className="cta-btn inline-flex items-center gap-3 px-12 py-[18px] text-black text-[16px] font-semibold tracking-wide rounded-full cursor-pointer transition-all active:scale-[0.97]"
            >
              Submit Your Film
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 border-t border-white/[0.03]">
        <div className="text-center">
          <span className="text-[14px] font-semibold tracking-[0.2em] text-white/[0.06]">spike AI</span>
        </div>
      </footer>

      <style jsx>{`
        .cta-btn {
          background: linear-gradient(180deg, #fff 0%, #e4e4e7 100%);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.1),
            0 4px 20px rgba(255,255,255,0.06),
            0 0 60px rgba(99,102,241,0.08),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .cta-btn:hover {
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.15),
            0 8px 40px rgba(255,255,255,0.1),
            0 0 80px rgba(99,102,241,0.12),
            inset 0 1px 0 rgba(255,255,255,1);
          transform: translateY(-2px);
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.06; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 0.09; transform: translate(-50%, 0) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
