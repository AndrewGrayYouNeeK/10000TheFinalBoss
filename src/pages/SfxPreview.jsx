import React from "react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import DiceRollSfxButtons from "@/components/sfx/DiceRollSfxButtons";
import VocalSfxButtons from "@/components/vocal/VocalSfxButtons";

export default function SfxPreview() {
  return (
    <div
      className="min-h-screen text-white pb-10"
      style={{
        background: "radial-gradient(ellipse at top, #1e1b4b 0%, #020408 55%), #020408",
      }}
    >
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <BackButton to="/" label="Home" />
          <div>
            <h1 className="text-lg font-bold">Sound Preview Lab</h1>
            <p className="text-[10px] text-slate-400">Tap any option to hear it</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-8">
        <section>
          <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3">
            🎲 Dice roll sounds
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Pick a style for the roll SFX. <strong className="text-white">Soft Felt</strong> is what the game uses now.
          </p>
          <DiceRollSfxButtons />
        </section>

        <section>
          <h2 className="text-sm font-bold text-fuchsia-300 uppercase tracking-wider mb-3">
            🗣️ Vocal SFX
          </h2>
          <p className="text-xs text-slate-400 mb-3">Prototype shouts — tap to hear your device yell the word.</p>
          <VocalSfxButtons />
        </section>
      </div>
    </div>
  );
}
