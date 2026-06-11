import React, { useState } from "react";
import { toast } from "sonner";
import { unlockPreviewAudio } from "@/lib/audioPreviewContext";

/**
 * Generic tap-to-play SFX preview grid.
 * @param {{ items: Array<{ id: string, label: string, emoji: string, blurb?: string, play: () => Promise<boolean>, durationMs?: number }>, compact?: boolean, columns?: number }} props
 */
export default function SfxPreviewButtons({ items = [], compact = false, columns = 2 }) {
  const [playing, setPlaying] = useState(null);

  const play = async (item) => {
    unlockPreviewAudio();
    setPlaying(item.id);
    try {
      const ok = await item.play();
      if (!ok) {
        toast.error(
          item.id === "yeet" || item.id === "skrrt"
            ? "Speech blocked — turn up volume & tap again"
            : "Audio blocked — tap again or check volume",
        );
      }
    } catch {
      toast.error("Could not play preview sound");
    } finally {
      setTimeout(
        () => setPlaying((p) => (p === item.id ? null : p)),
        item.durationMs ?? (compact ? 500 : 900),
      );
    }
  };

  const gridClass =
    columns === 1
      ? "grid grid-cols-1 gap-2"
      : compact
        ? "grid grid-cols-2 gap-2"
        : "grid grid-cols-1 sm:grid-cols-2 gap-3";

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => play(item)}
          className={`w-full rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
            compact ? "p-3" : "p-4"
          } ${
            playing === item.id
              ? "border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20"
              : "border-white/15 bg-black/40 hover:border-white/30 hover:bg-black/55"
          }`}
        >
          <div className={`flex items-center gap-2 ${compact ? "mb-0.5" : "mb-1.5"}`}>
            <span className={compact ? "text-lg" : "text-2xl"}>{item.emoji}</span>
            <span className={`font-black tracking-wide ${compact ? "text-xs" : "text-base"}`}>
              {item.label}
            </span>
          </div>
          {!compact && item.blurb && (
            <p className="text-xs text-slate-400 leading-snug">{item.blurb}</p>
          )}
          <p className="text-[10px] text-cyan-400/80 mt-1 font-bold uppercase tracking-wider">
            {playing === item.id ? "Playing…" : "Tap to preview"}
          </p>
        </button>
      ))}
    </div>
  );
}
