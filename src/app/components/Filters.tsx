"use client";

import { ALL_GENRES, ALL_AI_MODELS } from "./types";

export function GenreFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (g: string) => void;
}) {
  return (
    <div className="px-4 md:px-12 py-3 md:py-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {ALL_GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => onChange(genre)}
          className={`genre-pill ${selected === genre ? "active" : ""}`} style={selected === genre ? {boxShadow: "0 0 15px rgba(139,92,246,0.25)"} : {}}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}

export function AiModelFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (m: string) => void;
}) {
  return (
    <div className="px-4 md:px-12 pb-2 flex gap-2 overflow-x-auto items-center" style={{ scrollbarWidth: "none" }}>
      <span className="text-[9px] tracking-[0.15em] uppercase text-white/20 font-medium mr-1 flex-shrink-0">AI Model</span>
      {ALL_AI_MODELS.map((model) => (
        <button
          key={model}
          onClick={() => onChange(model)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wide border transition-all whitespace-nowrap ${
            selected === model
              ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
              : "bg-white/[0.02] border-white/[0.05] text-white/30 hover:text-white/60 hover:border-white/15"
          }`}
        >
          {model === "All" ? "All Models" : model}
        </button>
      ))}
    </div>
  );
}
