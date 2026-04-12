"use client";

function Footer() {
  const handleNav = (path: string) => { window.location.href = path; };
  return (
    <footer className="px-5 md:px-12 py-14 md:py-20 border-t border-white/[0.06] relative overflow-hidden"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/[0.03] blur-[120px] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top row: logo + links */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <span className="text-lg font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>
          <div className="flex flex-wrap items-center gap-5 text-[13px] text-white/30">
            <button onClick={() => handleNav("/blog")} className="hover:text-white/60 transition-colors cursor-pointer">Blog</button>
            <button onClick={() => handleNav("/submit")} className="hover:text-white/60 transition-colors cursor-pointer">Submit Film</button>
            <button onClick={() => handleNav("/creators")} className="hover:text-white/60 transition-colors cursor-pointer">Creators</button>
            <button onClick={() => handleNav("/terms")} className="hover:text-white/60 transition-colors cursor-pointer">Terms</button>
            <button onClick={() => handleNav("/privacy")} className="hover:text-white/60 transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => handleNav("/community-guidelines")} className="hover:text-white/60 transition-colors cursor-pointer">Guidelines</button>
          </div>
        </div>
        {/* Divider */}
        <div className="h-px bg-white/[0.05] mb-6" />
        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[11px] tracking-wider text-white/20">
            © {new Date().getFullYear()} Spike AI. All rights reserved.
          </p>
          <p className="text-[11px] tracking-wider text-white/20">
            The home for AI-generated cinema.
          </p>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
