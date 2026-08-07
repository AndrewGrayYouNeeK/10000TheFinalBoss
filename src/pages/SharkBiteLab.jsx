import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import DiceTray from "@/components/game/DiceTray";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import SharkBiteControls from "@/components/game/SharkBiteControls";
import BlueGelChromaControls from "@/components/game/BlueGelChromaControls";
import { SharkBiteScreenFX } from "@/components/game/BlueGelPowerFX";
import { VIDEO_KEYS } from "@/lib/localVideoStore";

const PREVIEW_DICE = [
  { id: 1, value: 1, held: false, used: false },
  { id: 2, value: 3, held: false, used: false },
  { id: 3, value: 5, held: false, used: false },
  { id: 4, value: 2, held: false, used: false },
  { id: 5, value: 6, held: false, used: false },
  { id: 6, value: 4, held: false, used: false },
];

export default function SharkBiteLab() {
  const [sharkBiteFx, setSharkBiteFx] = useState(false);
  const [sharkDiceHidden, setSharkDiceHidden] = useState(false);
  const [bitePreviewKey, setBitePreviewKey] = useState(0);

  const startBitePreview = useCallback(() => {
    setSharkBiteFx(false);
    setSharkDiceHidden(false);
    requestAnimationFrame(() => {
      setBitePreviewKey((k) => k + 1);
      setSharkBiteFx(true);
      setSharkDiceHidden(true);
    });
  }, []);

  const endBitePreview = useCallback(() => {
    setSharkBiteFx(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-950 to-black text-white pb-10">
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <BackButton to="/labs" label="Labs" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black truncate">Shark Bite Lab</h1>
            <p className="text-[10px] text-slate-400 truncate">
              DIY tune Intro X (left↔right) · Preview bite · Save — no more asking for nudges
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/sprite-lab/shark_gel"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white"
          >
            Blue Gel dice lab
          </Link>
          <Link
            to="/shark-tank-lab"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white"
          >
            Shark Tank Lab
          </Link>
          <Link
            to="/game?previewSharkBite=1"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white"
          >
            ▶ Game Bite preview
          </Link>
          <Link
            to="/fish-showcase"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/45 text-cyan-200 hover:bg-cyan-950/40"
          >
            Fish Showcase
          </Link>
          <Link
            to="/video-assets"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-white/20 text-slate-300 hover:bg-white/5"
          >
            Video Assets
          </Link>
        </div>

        <section className="rounded-xl border border-rose-500/35 bg-rose-950/20 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-rose-200">Live tray preview</h2>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                Fullscreen bite over Blue Gel dice. Drag <b className="text-cyan-200">Intro X</b>{" "}
                in the controls below until jaws cover all dice, then ▶ Preview bite.
              </p>
            </div>
            <button
              type="button"
              onClick={startBitePreview}
              className="text-xs font-black uppercase tracking-wider rounded-full px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white"
            >
              {sharkBiteFx ? "Replay bite" : "▶ Preview bite"}
            </button>
          </div>
          <div
            key={bitePreviewKey}
            className="rounded-xl overflow-hidden border border-rose-800/40 bg-slate-950/80 p-3"
          >
            <DiceTray
              dice={PREVIEW_DICE}
              rolling={false}
              disabled
              skinId="shark_gel"
              feltId="classic_green"
              sharkBiteFx={sharkBiteFx}
              sharkDiceHidden={sharkDiceHidden}
            />
          </div>
          <SharkBiteScreenFX active={sharkBiteFx} onComplete={endBitePreview} />
        </section>

        <section className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-3">
          <h2 className="text-sm font-black text-cyan-200">Power videos</h2>
          <p className="text-[11px] text-slate-400">
            <b>Swim forward</b> intro (optional) then <b>chomp</b> fullscreen. Same slots on Fish
            Showcase and Video Assets.
          </p>
          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO} />
          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_POWER} />
        </section>

        <SharkBiteControls
          showWorkbenchLinks={false}
          onPreviewBite={startBitePreview}
          previewActive={sharkBiteFx}
        />
        <BlueGelChromaControls showWorkbenchLinks={false} />
      </div>
    </div>
  );
}
