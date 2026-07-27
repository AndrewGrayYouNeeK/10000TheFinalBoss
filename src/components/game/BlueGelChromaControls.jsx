import React from "react";
import { Link } from "react-router-dom";
import {
  ChromaKeyVideo,
  useBlueGelChromaSettings,
  useBlueGelPowerVideoUrl,
} from "@/components/game/BlueGelPowerFX";
import {
  saveBlueGelChromaSettings,
  resetBlueGelChromaSettings,
} from "@/lib/blueGelChromaSettings";

/**
 * Live chroma-key tuner for the Blue Gel / Shark Bite power video.
 * Settings persist in localStorage and apply in-game immediately.
 */
export default function BlueGelChromaControls({
  showWorkbenchLinks = true,
  compact = false,
}) {
  const settings = useBlueGelChromaSettings();
  const videoUrl = useBlueGelPowerVideoUrl();
  const update = (patch) => saveBlueGelChromaSettings({ ...settings, ...patch });

  return (
    <div
      className={`rounded-xl border border-fuchsia-500/30 bg-slate-900/60 space-y-4 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-fuchsia-200">Remove video background</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
            Keys out the shark video&apos;s black (or solid) background so only the shark
            swims over gameplay. Raise Strength if you still see a dark square.
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

      {showWorkbenchLinks ? (
        <div className="flex flex-wrap gap-2">
          <Link
            to="/shark-bite-lab"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white"
          >
            Shark Bite Lab
          </Link>
          <Link
            to="/game?previewSharkBite=1"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white"
          >
            ▶ Game Bite preview
          </Link>
          <Link
            to="/fish-showcase"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-950/50"
          >
            Fish Showcase
          </Link>
        </div>
      ) : null}

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
              onClick={() => update({ autoKey: false, color: "#000000" })}
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

          <label className="block text-[11px] text-slate-400">
            Dark cut (kill near-black):{" "}
            <span className="text-white tabular-nums">{settings.lumaThreshold ?? 26}</span>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={settings.lumaThreshold ?? 26}
              disabled={!settings.enabled}
              onChange={(e) => update({ lumaThreshold: Number(e.target.value) })}
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

        <div
          className="relative rounded-xl overflow-hidden border border-white/10 min-h-[160px] flex items-center justify-center"
          style={{
            background:
              "repeating-linear-gradient(45deg, #0b3b2e 0 14px, #0e4a39 14px 28px)",
          }}
        >
          {videoUrl ? (
            <ChromaKeyVideo
              src={videoUrl}
              loop
              className="w-full h-full max-h-[220px] object-contain"
            />
          ) : (
            <p className="text-[11px] text-slate-400 px-4 text-center">
              Upload a shark video (or keep{" "}
              <code className="text-cyan-300">public/assets/blue_gel_power.mp4</code>) to
              preview background removal.
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
