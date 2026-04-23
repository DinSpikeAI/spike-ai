"use client";
import { ALL_GENRES, ALL_AI_MODELS } from "./types";

const GOLD = "#D4A857";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, Monaco, monospace";

/* ═══════════════════════════════════════════════════════════════
   GENRE FILTER — primary row
   ═══════════════════════════════════════════════════════════════ */

export function GenreFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (g: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      {/* Section label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 clamp(16px, 4vw, 48px)",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: GOLD,
            boxShadow: `0 0 8px ${GOLD}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            width: 28,
            height: 1,
            background: `linear-gradient(to right, ${GOLD}, transparent)`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Browse by <span style={{ color: GOLD }}>Genre</span>
        </span>
      </div>

      {/* Pills row */}
      <div
        style={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          padding: "0 clamp(16px, 4vw, 48px) 4px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {ALL_GENRES.map((genre) => {
          const active = selected === genre;
          return (
            <button
              key={genre}
              onClick={() => onChange(genre)}
              style={{
                flexShrink: 0,
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: active ? GOLD : "rgba(255,255,255,0.55)",
                background: "transparent",
                border: "none",
                borderBottom: active
                  ? `1px solid ${GOLD}`
                  : "1px solid transparent",
                padding: "12px 18px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.25s ease, border-color 0.25s ease",
                marginBottom: -1,
                fontWeight: active ? 600 : 500,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#FAFAFA";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(255,255,255,0.55)";
                }
              }}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI MODEL FILTER — secondary row (small chips)
   ═══════════════════════════════════════════════════════════════ */

export function AiModelFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (m: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        overflowX: "auto",
        padding: "14px clamp(16px, 4vw, 48px) 8px",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          flexShrink: 0,
          marginRight: 4,
        }}
      >
        Tool ·
      </span>
      {ALL_AI_MODELS.map((model) => {
        const active = selected === model;
        const label = model === "All" ? "All Models" : model;
        return (
          <button
            key={model}
            onClick={() => onChange(model)}
            style={{
              flexShrink: 0,
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: active ? GOLD : "rgba(255,255,255,0.45)",
              background: active ? "rgba(212,168,87,0.06)" : "transparent",
              border: active
                ? `1px solid rgba(212,168,87,0.4)`
                : "1px solid rgba(255,255,255,0.08)",
              padding: "6px 11px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.25s ease",
              fontWeight: active ? 600 : 500,
            }}
            onMouseEnter={(e) => {
              if (!active) {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "rgba(255,255,255,0.8)";
                el.style.borderColor = "rgba(255,255,255,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "rgba(255,255,255,0.45)";
                el.style.borderColor = "rgba(255,255,255,0.08)";
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
