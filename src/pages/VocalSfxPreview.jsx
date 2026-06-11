import React from "react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import VocalSfxButtons from "@/components/vocal/VocalSfxButtons";

export default function VocalSfxPreview() {
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
        <div className="max-w-md mx-auto flex items-center gap-2">
          <BackButton to="/preview-dice" label="Lab" />
          <div>
            <h1 className="text-lg font-bold">Vocal SFX Preview</h1>
            <p className="text-[10px] text-slate-400">Prototype sounds — not in the game yet</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          Tap a button to hear what a synthesized <strong className="text-fuchsia-300">YEEET</strong> or{" "}
          <strong className="text-cyan-300">SKRRRT</strong> could sound like as game SFX.
        </p>

        <VocalSfxButtons />

        <p className="text-[10px] text-slate-500 text-center pt-4">
          Built with Web Audio oscillators + noise — no sample files. Say the word if you want one wired into dice rolls or power-ups.
        </p>
      </div>
    </div>
  );
}
