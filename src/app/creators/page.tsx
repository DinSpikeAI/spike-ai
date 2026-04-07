"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Users, Film, Award, ArrowRight } from "lucide-react";

export default function CreatorsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-white/30 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-[17px] font-semibold tracking-wide">Creators</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[12px] font-semibold tracking-[0.2em] text-white/40 uppercase mb-8">
            <Sparkles size={14} />
            Invite Only
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
            The creators shaping<br />
            <span className="text-white/30">AI cinema.</span>
          </h1>
          <p className="text-[17px] text-white/25 leading-relaxed max-w-lg mx-auto">
            We&apos;re onboarding a select group of founding creators to define the future of AI filmmaking. The full creator directory launches soon.
          </p>
        </div>

        {/* What creators get */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {[
            { icon: Film, title: "Studio Page", desc: "A dedicated profile showcasing your filmography, bio, and links." },
            { icon: Award, title: "Official Selection", desc: "A badge of recognition for your portfolio and social channels." },
            { icon: Users, title: "Community", desc: "Join a growing network of AI filmmakers and get discovered." },
          ].map((item) => (
            <div key={item.title} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-5">
                <item.icon size={22} className="text-white/20" />
              </div>
              <h3 className="text-[16px] font-semibold tracking-wide mb-2">{item.title}</h3>
              <p className="text-[13px] text-white/25 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[15px] text-white/20 mb-6">Have an AI film you want to showcase?</p>
          <button
            onClick={() => router.push("/submit")}
            className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black text-[15px] font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all cursor-pointer"
          >
            Submit Your Film
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 border-t border-white/[0.03]">
        <div className="text-center">
          <span className="text-[15px] font-semibold tracking-[0.18em] text-white/30">spike AI</span>
        </div>
      </footer>
    </div>
  );
}
