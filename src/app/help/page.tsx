"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, Film, Upload, Heart, Shield,
  Bookmark, User, Mail, HelpCircle,
} from "lucide-react";

const FAQ = [
  { q: "What is spike AI?", a: "spike AI is the world's first streaming platform dedicated to AI-generated cinema. We showcase films created using AI tools like Runway, Kling, Midjourney, ElevenLabs, and more.", icon: Film },
  { q: "How do I submit my AI film?", a: "Go to 'Submit Film' from the navigation menu. Fill in your film details, paste your YouTube or Vimeo link, and submit. Our team will review and approve quality submissions.", icon: Upload },
  { q: "How does the upvote system work?", a: "Every approved film can be upvoted once per user. Sign in, find a film you love, and hit the upvote button. The most upvoted films get featured on the homepage.", icon: Heart },
  { q: "What is the Watchlist?", a: "Your personal collection of films you want to watch later. Click the bookmark icon on any film to add it to your list. Access it anytime from 'My List'.", icon: Bookmark },
  { q: "How do Creator pages work?", a: "Every film creator gets a dedicated Studio page showcasing their filmography, bio, and social links. Submit a film and your creator profile is automatically created.", icon: User },
  { q: "Is it free to use?", a: "Yes. spike AI is completely free for viewers and creators. No subscription, no fees, no revenue share. You keep full credit for your work.", icon: Shield },
  { q: "How do I contact the team?", a: "Email us at din6915@gmail.com — we respond within 24 hours. For feature requests or bug reports, we'd love to hear from you.", icon: Mail },
];

export default function HelpPage() {
  const router = useRouter();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-white/30 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-[17px] font-semibold tracking-wide">Help</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-16 pb-20">
        {/* Page Title */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-8">
            <HelpCircle size={32} className="text-white/20" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">How can we help?</h1>
          <p className="text-[16px] text-white/25 mt-3">Everything you need to know about spike AI.</p>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = openIdx === i;
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden transition-all">
                <button onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center gap-5 px-6 py-5 text-left cursor-pointer hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-white/25" />
                  </div>
                  <span className="text-[15px] font-medium tracking-wide flex-1">{item.q}</span>
                  <ChevronDown size={18} className={`text-white/15 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pl-[76px]">
                    <p className="text-[14px] leading-[1.8] text-white/30 tracking-wide">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="mt-20 text-center">
          <p className="text-[15px] text-white/20 tracking-wide mb-6">Still have questions?</p>
          <a href="mailto:din6915@gmail.com"
            className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black text-[15px] font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all">
            <Mail size={18} />
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
