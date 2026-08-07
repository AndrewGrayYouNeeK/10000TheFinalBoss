import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Fish, FISH_VARIANTS, Jellyfish, JELLYFISH_VARIANTS } from "@/components/game/FishOverlay";
import { CreatureIdeaGallery } from "@/components/game/CreatureIdeaGallery";
import Die from "@/components/game/Die";
import DiceTray from "@/components/game/DiceTray";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import SharkBiteControls from "@/components/game/SharkBiteControls";
import BlueGelChromaControls from "@/components/game/BlueGelChromaControls";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import {
  getCachedBlueGelPowerVideoObjectUrl,
  getCachedSharkBiteIntroVideoObjectUrl,
} from "@/lib/blueGelPowerVideo";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import { SharkBiteScreenFX } from "@/components/game/BlueGelPowerFX";
import { BLUE_GEL_AFTERMATH_MS } from "@/lib/blueGelPowerAudio";
import { getBlueGelTrayFishProps } from "@/lib/fishDice";

function WaterTile({ children, label, sub }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/80 shadow-lg shadow-cyan-950/40">
      <div
        className="relative h-36 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 40% 30%, rgba(56,189,248,0.35) 0%, transparent 55%), linear-gradient(180deg, #0c4a6e 0%, #082f49 45%, #042f2e 100%)",
        }}
      >
        {children}
      </div>
      <div className="px-3 py-2 border-t border-cyan-900/50">
        <div className="text-sm font-bold text-cyan-100">{label}</div>
        {sub ? <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div> : null}
      </div>
    </div>
  );
}

const PREVIEW_DICE = [
  { id: 1, value: 1, held: false, used: false },
  { id: 2, value: 3, held: false, used: false },
  { id: 3, value: 5, held: false, used: false },
  { id: 4, value: 2, held: false, used: false },
  { id: 5, value: 6, held: false, used: false },
  { id: 6, value: 4, held: false, used: false },
];

export default function FishShowcase() {
  const [powerPreview, setPowerPreview] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  /** Full Shark Attack preview: feast → fullscreen swim → dice vanish. */
  const [fishFeastMode, setFishFeastMode] = useState(false);
  const [sharkBiteFx, setSharkBiteFx] = useState(false);
  const [sharkDiceHidden, setSharkDiceHidden] = useState(false);
  const [bloodWaterLocked, setBloodWaterLocked] = useState(false);
  const [attackKey, setAttackKey] = useState(0);
  const attackPhaseRef = useRef("idle"); // idle | feast | bite | done
  const attackTimerRef = useRef(null);
  const { hasLocal: hasChompVideo } = useLocalVideo(VIDEO_KEYS.BLUE_GEL_POWER);
  const { hasLocal: hasIntroVideo } = useLocalVideo(VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO);

  const jellyDieId = useMemo(
    () => PREVIEW_DICE.find((d) => d.value >= 2)?.id ?? null,
    []
  );

  const clearAttackTimer = useCallback(() => {
    if (attackTimerRef.current) {
      clearTimeout(attackTimerRef.current);
      attackTimerRef.current = null;
    }
  }, []);

  const stopSharkAttackPreview = useCallback(() => {
    clearAttackTimer();
    attackPhaseRef.current = "idle";
    setFishFeastMode(false);
    setSharkBiteFx(false);
    setSharkDiceHidden(false);
    setBloodWaterLocked(false);
  }, [clearAttackTimer]);

  useEffect(() => () => clearAttackTimer(), [clearAttackTimer]);

  const startPowerPreview = () => {
    stopSharkAttackPreview();
    setPowerPreview(false);
    // Remount FX so the shark sequence replays from the start.
    requestAnimationFrame(() => {
      setReplayKey((k) => k + 1);
      setPowerPreview(true);
    });
  };

  /**
   * Full sequence (visual only — no bank steal):
   * intense bubbles → sharks eat fish → red water →
   * full-screen shark video/SVG → dice vanish.
   */
  const startSharkAttackPreview = () => {
    stopSharkAttackPreview();
    setPowerPreview(false);
    requestAnimationFrame(() => {
      setAttackKey((k) => k + 1);
      const usesVideo =
        getCachedSharkBiteIntroVideoObjectUrl() || getCachedBlueGelPowerVideoObjectUrl();
      if (usesVideo) {
        attackPhaseRef.current = "bite";
        setBloodWaterLocked(true);
        setFishFeastMode(false);
        setSharkBiteFx(true);
        setSharkDiceHidden(true);
        return;
      }
      attackPhaseRef.current = "feast";
      setFishFeastMode(true);
      attackTimerRef.current = setTimeout(() => {
        attackPhaseRef.current = "bite";
        setBloodWaterLocked(true);
        setFishFeastMode(false);
        setSharkBiteFx(true);
        setSharkDiceHidden(true);
      }, BLUE_GEL_AFTERMATH_MS);
    });
  };

  const endSharkBitePhase = useCallback(() => {
    setSharkBiteFx(false);
    attackPhaseRef.current = "done";
    // Keep dice vanished + red water until Stop / Replay.
  }, []);

  const attackActive = fishFeastMode || sharkBiteFx || sharkDiceHidden;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-cyan-200">
              Fish & water creatures
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Preview the full Shark Attack (feast → fullscreen chomp → dice vanish) or the
              in-die fish feast alone.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/game?previewSharkBite=1"
              className="text-xs font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 rounded-full px-3 py-1.5"
            >
              ▶ Game Bite preview
            </Link>
            <Link
              to="/sprite-lab/shark_gel"
              className="text-xs font-black uppercase tracking-wider text-white bg-cyan-700 hover:bg-cyan-600 rounded-full px-3 py-1.5"
            >
              Blue Gel dice lab
            </Link>
            <Link
              to="/shark-bite-lab"
              className="text-xs font-black uppercase tracking-wider text-white bg-rose-700 hover:bg-rose-600 rounded-full px-3 py-1.5"
            >
              Shark Bite Lab
            </Link>
            <Link
              to="/video-assets"
              className="text-xs font-bold uppercase tracking-wider text-rose-300 border border-rose-700/60 rounded-full px-3 py-1.5 hover:bg-rose-950/60"
            >
              Video Assets
            </Link>
            <Link
              to="/ice-lab"
              className="text-xs font-bold uppercase tracking-wider text-sky-300 border border-sky-700/60 rounded-full px-3 py-1.5 hover:bg-sky-950/60"
            >
              Ice Lab
            </Link>
            <Link
              to="/labs"
              className="text-xs font-bold uppercase tracking-wider text-cyan-300 border border-cyan-700/60 rounded-full px-3 py-1.5 hover:bg-cyan-950/60"
            >
              ← Labs
            </Link>
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-rose-200">Preview: Shark Attack</h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-lg">
                Full visual sequence: intense bubbles → sharks eat the fish → water turns red →
                fullscreen shark (uploaded video or SVG) chomps the tray → dice vanish. Visual
                only — does not steal a bank.
              </p>
              <p className="text-[10px] text-rose-300/70 mt-1 uppercase tracking-wider font-bold">
                {fishFeastMode
                  ? "Phase: in-die feast…"
                  : sharkBiteFx
                    ? "Phase: fullscreen chomp…"
                    : sharkDiceHidden
                      ? "Done — dice eaten"
                      : "Ready"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startSharkAttackPreview}
                className="text-xs font-black uppercase tracking-wider rounded-full px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50"
              >
                {attackActive ? "Replay shark attack" : "▶ Preview shark attack"}
              </button>
              {attackActive ? (
                <button
                  type="button"
                  onClick={stopSharkAttackPreview}
                  className="text-xs font-bold uppercase tracking-wider rounded-full px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Stop
                </button>
              ) : null}
            </div>
          </div>
          <div key={attackKey} className="rounded-xl overflow-hidden border border-rose-800/40 bg-slate-950/80 p-3">
            <DiceTray
              dice={PREVIEW_DICE}
              rolling={false}
              disabled
              skinId="shark_gel"
              feltId="classic_green"
              fishFeastMode={fishFeastMode}
              sharkBiteFx={sharkBiteFx}
              sharkDiceHidden={sharkDiceHidden}
              bloodWaterLocked={bloodWaterLocked}
            />
          </div>
          <SharkBiteScreenFX active={sharkBiteFx} onComplete={endSharkBitePhase} />
        </section>

        <section className="space-y-3 rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-cyan-200">Preview: shark eating the fish</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasIntroVideo || hasChompVideo
                  ? hasIntroVideo && hasChompVideo
                    ? "Swim forward + Chomps whole screen uploaded — two-beat sequence only."
                    : hasIntroVideo
                      ? "Swim forward uploaded — crossfades into chomp (your upload or catalog fallback)."
                      : "Chomps whole screen uploaded — plays alone (no swim-forward beat)."
                  : "No custom shark videos — catalog chomp clip or SVG fallback."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startPowerPreview}
                className="text-xs font-black uppercase tracking-wider rounded-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {powerPreview ? "Replay fish feast" : "▶ Preview fish feast"}
              </button>
              {powerPreview ? (
                <button
                  type="button"
                  onClick={() => setPowerPreview(false)}
                  className="text-xs font-bold uppercase tracking-wider rounded-full px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Stop
                </button>
              ) : null}
            </div>
          </div>
          <div
            key={replayKey}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 py-4 rounded-xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(14,116,144,0.25), transparent 60%), #042f2e",
            }}
          >
            {PREVIEW_DICE.map((d, idx) => (
              <Die
                key={`${replayKey}-${d.id}`}
                value={d.value}
                size={88}
                skinId="shark_gel"
                powerMode={powerPreview}
                includeJellyfish={d.id === jellyDieId}
                {...getBlueGelTrayFishProps(idx)}
                dieSeed={d.id + replayKey * 10}
              />
            ))}
          </div>

          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO} />
          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_POWER} />

          <SharkBiteControls
            onPreviewBite={startSharkAttackPreview}
            previewActive={sharkBiteFx}
          />

          <BlueGelChromaControls showWorkbenchLinks={false} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-emerald-300">In the game now — {FISH_VARIANTS.length} fish</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {FISH_VARIANTS.map((v, i) => (
              <WaterTile
                key={v.id}
                label={v.name}
                sub="Reef fish shape"
              >
                <Fish
                  size={160}
                  top={32}
                  scale={1.85}
                  variant={v}
                  duration={4.2 + (i % 3) * 0.6}
                  delay={-(i * 0.7)}
                  dir={i % 2 === 0 ? 1 : -1}
                />
              </WaterTile>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-fuchsia-300">
            Jellyfish colors ({JELLYFISH_VARIANTS.length}) — only one on the tray
          </h2>
          <p className="text-xs text-slate-500">
            Color options for the single jellyfish that appears on Blue Gel (one die total).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {JELLYFISH_VARIANTS.map((v, i) => (
              <WaterTile key={v.id} label={v.name} sub="Only one jelly in play">
                <Jellyfish
                  size={150}
                  top={12}
                  scale={1.7}
                  variant={v}
                  duration={5 + i * 0.4}
                  delay={-(i * 0.6)}
                  dir={i % 2 === 0 ? 1 : -1}
                />
              </WaterTile>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-amber-300">Creature ideas — emoji previews</h2>
          <p className="text-xs text-slate-500">Not on dice yet.</p>
          <CreatureIdeaGallery />
        </section>
      </div>
    </div>
  );
}
