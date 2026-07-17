import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Fish, FISH_VARIANTS, Jellyfish, JELLYFISH_VARIANTS } from "@/components/game/FishOverlay";
import { CreatureIdeaGallery } from "@/components/game/CreatureIdeaGallery";
import Die from "@/components/game/Die";
import DiceTray from "@/components/game/DiceTray";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import {
  SharkBiteScreenFX,
  ChromaKeyVideo,
  useBlueGelChromaSettings,
  useBlueGelPowerVideoUrl,
} from "@/components/game/BlueGelPowerFX";
import { saveBlueGelChromaSettings, resetBlueGelChromaSettings } from "@/lib/blueGelChromaSettings";

function ChromaKeyControls() {
  const settings = useBlueGelChromaSettings();
  const videoUrl = useBlueGelPowerVideoUrl();
  const update = (patch) => saveBlueGelChromaSettings({ ...settings, ...patch });

  return (
    <div className="rounded-xl border border-fuchsia-500/30 bg-slate-900/60 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-fuchsia-200">Remove video background</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
            Keys out the shark video&apos;s background so only the shark swims over the
            gameplay. Works best with a solid background (black, white, green, or blue).
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="accent-fuchsia-500 w-4 h-4"
          />
          Background removal {settings.enabled ? "on" : "off"}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ autoKey: true })}
              className={`flex-1 text-xs font-bold rounded-lg px-3 py-2 border ${
                settings.autoKey
                  ? "bg-fuchsia-600 border-fuchsia-400 text-white"
                  : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Auto-detect
            </button>
            <button
              type="button"
              onClick={() => update({ autoKey: false })}
              className={`flex-1 text-xs font-bold rounded-lg px-3 py-2 border ${
                !settings.autoKey
                  ? "bg-fuchsia-600 border-fuchsia-400 text-white"
                  : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Pick color
            </button>
          </div>

          {!settings.autoKey && (
            <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
              Background color
              <input
                type="color"
                value={settings.color}
                onChange={(e) => update({ color: e.target.value })}
                className="h-8 w-14 rounded border border-slate-600 bg-transparent"
              />
            </label>
          )}

          <label className="block text-[11px] text-slate-400">
            Strength: <span className="text-white tabular-nums">{settings.tolerance}</span>
            <input
              type="range"
              min={10}
              max={180}
              step={1}
              value={settings.tolerance}
              disabled={!settings.enabled}
              onChange={(e) => update({ tolerance: Number(e.target.value) })}
              className="w-full accent-fuchsia-400 mt-1"
            />
          </label>

          <label className="block text-[11px] text-slate-400">
            Edge softness: <span className="text-white tabular-nums">{settings.softness}</span>
            <input
              type="range"
              min={0}
              max={140}
              step={1}
              value={settings.softness}
              disabled={!settings.enabled}
              onChange={(e) => update({ softness: Number(e.target.value) })}
              className="w-full accent-fuchsia-400 mt-1"
            />
          </label>

          <button
            type="button"
            onClick={() => resetBlueGelChromaSettings()}
            className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
          >
            Reset to defaults
          </button>
        </div>

        {/* Live keyed preview over a gameplay-like backdrop */}
        <div
          className="relative rounded-xl overflow-hidden border border-white/10 min-h-[160px] flex items-center justify-center"
          style={{
            background:
              "repeating-linear-gradient(45deg, #0b3b2e 0 14px, #0e4a39 14px 28px)",
          }}
        >
          {videoUrl ? (
            <ChromaKeyVideo src={videoUrl} loop className="w-full h-full object-contain" />
          ) : (
            <p className="text-[11px] text-slate-400 px-4 text-center">
              Upload a shark video below to preview background removal.
            </p>
          )}
          <span className="absolute bottom-1 right-2 text-[9px] uppercase tracking-wider text-white/50">
            Live preview
          </span>
        </div>
      </div>
    </div>
  );
}

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
  const [sharkBiteFx, setSharkBiteFx] = useState(false);
  const [biteKey, setBiteKey] = useState(0);
  const { hasLocal: hasPowerVideo } = useLocalVideo(VIDEO_KEYS.BLUE_GEL_POWER);

  const jellyDieId = useMemo(
    () => PREVIEW_DICE.find((d) => d.value >= 2)?.id ?? null,
    []
  );

  const startPowerPreview = () => {
    setPowerPreview(false);
    // Remount FX so the shark sequence replays from the start.
    requestAnimationFrame(() => {
      setReplayKey((k) => k + 1);
      setPowerPreview(true);
    });
  };

  const startSharkBitePreview = () => {
    setSharkBiteFx(false);
    requestAnimationFrame(() => {
      setBiteKey((k) => k + 1);
      setSharkBiteFx(true);
    });
  };

  const endSharkBitePreview = useCallback(() => {
    setSharkBiteFx(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-cyan-200">
              Fish & water creatures
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Preview the Blue Gel shark feast inside the dice, or the full Shark Bite that eats
              the tray dice.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/video-assets"
              className="text-xs font-bold uppercase tracking-wider text-rose-300 border border-rose-700/60 rounded-full px-3 py-1.5 hover:bg-rose-950/60"
            >
              Video Assets
            </Link>
            <Link
              to="/shop"
              className="text-xs font-bold uppercase tracking-wider text-cyan-300 border border-cyan-700/60 rounded-full px-3 py-1.5 hover:bg-cyan-950/60"
            >
              ← Shop
            </Link>
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-rose-200">Preview: shark eating the dice</h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-lg">
                Shark flies over the gameplay tray — when it chomps, the dice disappear.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startSharkBitePreview}
                className="text-xs font-black uppercase tracking-wider rounded-full px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50"
              >
                {sharkBiteFx ? "Replay shark bite" : "▶ Preview shark bite"}
              </button>
              {sharkBiteFx ? (
                <button
                  type="button"
                  onClick={endSharkBitePreview}
                  className="text-xs font-bold uppercase tracking-wider rounded-full px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Stop
                </button>
              ) : null}
            </div>
          </div>
          <div key={biteKey} className="rounded-xl overflow-hidden border border-rose-800/40 bg-slate-950/80 p-3">
            <DiceTray
              dice={PREVIEW_DICE}
              rolling={false}
              disabled
              skinId="blue_gel"
              feltId="classic_green"
              sharkBiteFx={sharkBiteFx}
            />
          </div>
          <SharkBiteScreenFX active={sharkBiteFx} onComplete={endSharkBitePreview} />
        </section>

        <section className="space-y-3 rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-cyan-200">Preview: shark eating the fish</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasPowerVideo
                  ? "Custom shark power video is uploaded — in-game full-screen uses it; this preview still shows the in-die feast."
                  : "In-die only: sharks swim in, eat the fish, three bubble timers, then bloody-red water stays."}
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
                skinId="blue_gel"
                powerMode={powerPreview}
                includeJellyfish={d.id === jellyDieId}
                bigFishVariantIndex={[7, 1, 6, 3, 1, 4][idx]}
                bigFishExtraScale={idx === 0 ? 1.8 : 1.15}
                dieSeed={d.id + replayKey * 10}
              />
            ))}
          </div>

          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_POWER} />

          <ChromaKeyControls />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-emerald-300">In the game now — {FISH_VARIANTS.length} fish</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {FISH_VARIANTS.map((v, i) => (
              <WaterTile
                key={v.id}
                label={v.name}
                sub={v.angelfish ? "Angelfish shape" : "Reef fish shape"}
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
