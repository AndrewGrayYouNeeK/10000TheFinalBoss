import React, { useState } from "react";
import { toast } from "sonner";
import { unlockVocalAudio, VOCAL_SFX_PREVIEWS } from "@/lib/vocalSfxPreview";

/** Tap-to-play YEEET / SKRRRT prototype buttons — works inline or on preview page */
export default function VocalSfxButtons({ compact = false }) {
  const [playing, setPlaying] = useState(null);

  const play = async (item) => {
    unlockVocalAudio();
    setPlaying(item.id);
    try {
      const ok = await item.play();
      if (!ok) {
        toast.error("Audio blocked — tap again or check volume");
      }
    } catch {
      toast.error("Could not play preview sound");
    } finally {
      setTimeout(() => setPlaying((p) => (p === item.id ? null : p)), 450);
    }
  };

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "space-y-3"}>
      {VOCAL_SFX_PREVIEWS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => play(item)}
          className={`w-full rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
            compact ? "p-3" : "p-5"
          } ${
            playing === item.id
              ? "border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20"
              : "border-white/15 bg-black/40 hover:border-white/30 hover:bg-black/55"
          }`}
        >
          <div className={`flex items-center gap-2 ${compact ? "mb-1" : "mb-2"}`}>
            <span className={compact ? "text-xl" : "text-3xl"}>{item.emoji}</span>
            <span className={`font-black tracking-wider ${compact ? "text-sm" : "text-2xl"}`}>
              {item.label}
            </span>
          </div>
          {!compact && <p className="text-xs text-slate-400">{item.blurb}</p>}
          <p className="text-[10px] text-cyan-400/80 mt-1 font-bold uppercase tracking-wider">
            {playing === item.id ? "Playing…" : "Tap to preview"}
          </p>
        </button>
      ))}
    </div>
  );
}
