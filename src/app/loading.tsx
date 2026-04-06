export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <span className="text-[24px] font-semibold tracking-[0.18em] text-white/80" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>

        <div className="w-48 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 rounded-full"
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
