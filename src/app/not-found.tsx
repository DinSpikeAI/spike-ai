import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#E50914]/[0.04] blur-[180px]" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* 404 Number */}
        <h1
          className="text-[120px] md:text-[180px] font-black text-transparent leading-none mb-0"
          style={{
            WebkitTextStroke: "1.5px rgba(229,9,20,0.3)",
            textShadow: "0 0 80px rgba(229,9,20,0.1)",
          }}
        >
          404
        </h1>

        <h2 className="text-xl md:text-2xl font-bold text-white -mt-4 mb-3 tracking-tight">
          Scene Not Found
        </h2>

        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          This page doesn&apos;t exist in our universe. The film you&apos;re looking for may have been moved or removed.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E50914] text-white font-bold text-sm rounded-xl hover:bg-[#f6121d] transition-all shadow-lg shadow-[#E50914]/20 hover:shadow-[#E50914]/30"
        >
          Back to Home
        </Link>

        <p className="mt-8 text-[10px] text-gray-700 tracking-wider">
          SPIKE AI — AI CINEMA
        </p>
      </div>
    </div>
  );
}
