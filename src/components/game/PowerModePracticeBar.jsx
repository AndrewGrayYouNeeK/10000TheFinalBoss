import React from "react";
import { cn } from "@/lib/utils";

const practiceBtnBase =
  "h-6 px-2.5 rounded-full border text-[8px] font-black uppercase tracking-wide shrink-0 transition-all disabled:opacity-40 disabled:pointer-events-none";

/**
 * Mid-game toggles to preview power-mode visuals without earning Hot Dice.
 * variant: marlin (Shark Bite / Blue Gel) | gq (Diamond Cut / Siphon)
 */
export default function PowerModePracticeBar({
  variant,
  disabled = false,
  powerPreview = false,
  onPowerPreviewChange,
  sharkVideoPreview = false,
  onSharkVideoPreviewChange,
  onReplaySharkBite,
  sharkBiteActive = false,
  className,
}) {
  if (!variant) return null;

  const isMarlin = variant === "marlin";
  const label = isMarlin ? "Marlin practice" : "GQ practice";
  const accent = isMarlin ? "#22d3ee" : "#7dd3fc";
  const accentGlow = isMarlin ? "rgba(34,211,238,0.55)" : "rgba(125,211,252,0.5)";

  return (
    <div
      className={cn(
        "rounded-lg border px-2 py-1.5 flex flex-wrap items-center gap-1.5",
        className
      )}
      style={{
        borderColor: accentGlow,
        background: isMarlin
          ? "linear-gradient(90deg, rgba(34,211,238,0.18), rgba(8,47,73,0.35))"
          : "linear-gradient(90deg, rgba(125,211,252,0.16), rgba(15,23,42,0.5))",
        boxShadow: `0 0 12px ${accentGlow}`,
      }}
    >
      <span
        className="text-[7px] font-black uppercase tracking-[0.18em] text-slate-300 mr-0.5"
        style={{ textShadow: `0 0 6px ${accent}` }}
      >
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        className={cn(practiceBtnBase, powerPreview ? "text-white" : "text-slate-200 bg-black/25")}
        style={{
          borderColor: powerPreview ? accent : `${accent}88`,
          background: powerPreview
            ? `linear-gradient(90deg, ${accent}cc, ${accent}99)`
            : undefined,
          boxShadow: powerPreview ? `0 0 12px ${accentGlow}, inset 0 0 8px rgba(255,255,255,0.15)` : `0 0 6px ${accentGlow}`,
        }}
        onClick={() => onPowerPreviewChange?.(!powerPreview)}
      >
        {powerPreview ? "Dice on" : "Power dice"}
      </button>

      {isMarlin && (
        <>
          <button
            type="button"
            disabled={disabled}
            className={cn(practiceBtnBase, sharkVideoPreview ? "text-white" : "text-slate-200 bg-black/25")}
            style={{
              borderColor: sharkVideoPreview ? "#2dd4bf" : "rgba(45,212,191,0.55)",
              background: sharkVideoPreview
                ? "linear-gradient(90deg, rgba(45,212,191,0.85), rgba(20,184,166,0.75))"
                : undefined,
              boxShadow: sharkVideoPreview
                ? "0 0 12px rgba(45,212,191,0.55), inset 0 0 8px rgba(255,255,255,0.12)"
                : "0 0 6px rgba(45,212,191,0.35)",
            }}
            onClick={() => onSharkVideoPreviewChange?.(!sharkVideoPreview)}
          >
            {sharkVideoPreview ? "Video on" : "Shark vid"}
          </button>
          <button
            type="button"
            disabled={disabled || sharkBiteActive}
            className={cn(practiceBtnBase, "text-white")}
            style={{
              borderColor: "#fb7185",
              background: "linear-gradient(90deg, rgba(244,63,94,0.9), rgba(225,29,72,0.85))",
              boxShadow: "0 0 12px rgba(244,63,94,0.55), inset 0 0 8px rgba(255,255,255,0.12)",
            }}
            onClick={onReplaySharkBite}
          >
            {sharkBiteActive ? "Biting…" : "▶ Bite FX"}
          </button>
        </>
      )}
    </div>
  );
}

/** Story boss id → practice bar variant, or null. */
export function storyBossPracticeVariant(bossId) {
  if (bossId === "fisherman") return "marlin";
  if (bossId === "gq") return "gq";
  return null;
}

/** Local play equipped skin → practice bar variant, or null. */
export function skinPracticeVariant(skinId) {
  if (skinId === "blue_gel") return "marlin";
  if (skinId === "crystal_cut") return "gq";
  return null;
}

export function practicePreviewSkinId(variant) {
  if (variant === "marlin") return "blue_gel";
  if (variant === "gq") return "crystal_cut";
  return null;
}
