"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Spike AI Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-red-900/[0.05] blur-[180px]" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          Something Went Wrong
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#E50914] text-white font-bold text-sm rounded-xl hover:bg-[#f6121d] transition-all shadow-lg shadow-[#E50914]/20"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/10 transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
