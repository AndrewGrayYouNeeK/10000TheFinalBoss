import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const label = isMarlin ? "Marlin — practice" : "GQ — practice";

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 space-y-2",
        isMarlin ? "border-cyan-500/35 bg-cyan-950/25" : "border-sky-300/35 bg-slate-900/60",
        className
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
        {label}
        <span className="font-normal normal-case tracking-normal text-slate-500 ml-1">
          — visuals only, no power spent
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          variant={powerPreview ? "default" : "outline"}
          className={cn(
            "h-8 text-[10px] font-bold uppercase tracking-wide",
            powerPreview && (isMarlin ? "bg-cyan-600 hover:bg-cyan-500" : "bg-sky-500 hover:bg-sky-400")
          )}
          onClick={() => onPowerPreviewChange?.(!powerPreview)}
        >
          {powerPreview ? "Power dice on" : "Preview power dice"}
        </Button>

        {isMarlin && (
          <>
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              variant={sharkVideoPreview ? "default" : "outline"}
              className={cn(
                "h-8 text-[10px] font-bold uppercase tracking-wide",
                sharkVideoPreview && "bg-teal-600 hover:bg-teal-500"
              )}
              onClick={() => onSharkVideoPreviewChange?.(!sharkVideoPreview)}
            >
              {sharkVideoPreview ? "Shark video on" : "Shark video"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disabled || sharkBiteActive}
              className="h-8 text-[10px] font-bold uppercase tracking-wide bg-rose-600 hover:bg-rose-500 text-white"
              onClick={onReplaySharkBite}
            >
              {sharkBiteActive ? "Shark biting…" : "▶ Shark bite FX"}
            </Button>
          </>
        )}
      </div>
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
