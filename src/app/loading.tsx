export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo pulse */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#E50914]/20 animate-ping" style={{ animationDuration: "1.5s" }} />
          <img
            style={{ display: "none" }}
            alt="Loading"
            className="h-14 w-auto relative z-10"
            style={{ filter: "drop-shadow(0 0 20px rgba(229,9,20,0.3))" }}
          />
        </div>

        {/* Loading bar */}
        <div className="w-48 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E50914] to-[#ff3d47] rounded-full"
            style={{
              animation: "loadingBar 1.2s ease-in-out infinite",
              width: "40%",
            }}
          />
        </div>

        <style>{`
          @keyframes loadingBar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    </div>
  );
}
