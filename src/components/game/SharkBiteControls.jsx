import React from "react";
import { Link } from "react-router-dom";
import {
  BlueGelPowerVideoScreen,
  useSharkBiteSettings,
} from "@/components/game/BlueGelPowerFX";
import {
  DEFAULT_SHARK_BITE_SETTINGS,
  resetSharkBiteSettings,
  saveSharkBiteSettings,
} from "@/lib/sharkBiteSettings";

function SliderRow({ label, value, min, max, step = 0.01, onChange, format, hint }) {
  const display =
    typeof format === "function" ? format(value) : Number(value).toFixed(step < 1 ? 2 : 0);
  return (
    <label className="block text-[11px] text-slate-400">
      {label}: <span className="text-rose-100 tabular-nums">{display}</span>
      {hint ? <span className="block text-[10px] text-slate-500 mt-0.5">{hint}</span> : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-rose-400 mt-1"
      />
    </label>
  );
}

/**
 * Live tuner for Shark Bite video timing, layout, and chomp sync.
 * Settings persist in localStorage and apply in-game immediately.
 */
export default function SharkBiteControls({
  showWorkbenchLinks = true,
  compact = false,
  /** When set, ▶ Preview bite remounts this overlay for live tuning. */
  onPreviewBite,
  previewActive = false,
}) {
  const settings = useSharkBiteSettings();
  const update = (patch) => saveSharkBiteSettings({ ...settings, ...patch });

  return (
    <div
      className={`rounded-xl border border-rose-500/35 bg-slate-900/60 space-y-4 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-rose-200">Shark Bite video timing & layout</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
            Trim the clip, nudge position, and sync when dice vanish. Changes apply in-game
            immediately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onPreviewBite ? (
            <button
              type="button"
              onClick={onPreviewBite}
              className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white"
            >
              {previewActive ? "Replay bite" : "▶ Preview bite"}
            </button>
          ) : null}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <input
              type="checkbox"
              checked={settings.muted !== false}
              onChange={(e) => update({ muted: e.target.checked })}
              className="accent-rose-500 w-4 h-4"
            />
            Muted
          </label>
          <button
            type="button"
            onClick={() => resetSharkBiteSettings()}
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-white/20 text-slate-300 hover:text-white hover:bg-white/5"
          >
            Reset defaults
          </button>
        </div>
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
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-rose-500/45 text-rose-200 hover:bg-rose-950/40"
          >
            Game Bite preview
          </Link>
          <Link
            to="/fish-showcase"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/45 text-cyan-200 hover:bg-cyan-950/40"
          >
            Fish Showcase
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold">
            Intro clip trim
          </p>
          <SliderRow
            label="Intro start (seconds)"
            value={settings.introStartAtSeconds ?? DEFAULT_SHARK_BITE_SETTINGS.introStartAtSeconds}
            min={0}
            max={8}
            step={0.05}
            format={(v) => `${v.toFixed(2)}s`}
            onChange={(introStartAtSeconds) => update({ introStartAtSeconds })}
          />
          <SliderRow
            label="Intro stop at progress"
            value={settings.introStopAtProgress ?? DEFAULT_SHARK_BITE_SETTINGS.introStopAtProgress}
            min={0.5}
            max={1}
            step={0.01}
            hint="End intro playback here (1 = play to end)."
            onChange={(introStopAtProgress) => update({ introStopAtProgress })}
          />

          <p className="text-[10px] uppercase tracking-wider text-rose-300/80 font-bold pt-1">
            Chomp clip trim
          </p>
          <SliderRow
            label="Chomp start (seconds)"
            value={settings.startAtSeconds}
            min={0}
            max={8}
            step={0.05}
            format={(v) => `${v.toFixed(2)}s`}
            onChange={(startAtSeconds) => update({ startAtSeconds })}
          />
          <SliderRow
            label="Mute at (seconds)"
            value={settings.muteAtSeconds}
            min={0}
            max={12}
            step={0.05}
            format={(v) => (v <= 0 ? "off" : `${v.toFixed(2)}s`)}
            hint="0 = never mute. Uses source timeline (before trim offset)."
            onChange={(muteAtSeconds) => update({ muteAtSeconds })}
          />

          <p className="text-[10px] uppercase tracking-wider text-rose-300/80 font-bold pt-1">
            Chomp video position
          </p>
          <p className="text-[10px] text-slate-500 -mt-1">
            Nudge <b className="text-rose-200/90">Chomps whole screen</b> after upload — applies
            in-game immediately.
          </p>
          <SliderRow
            label="Video rotation"
            value={settings.videoRotationDeg ?? DEFAULT_SHARK_BITE_SETTINGS.videoRotationDeg}
            min={-180}
            max={180}
            step={90}
            format={(v) => `${Math.round(v)}°`}
            hint="Fix sideways phone uploads. Try 90° or -90° if the shark appears on its side."
            onChange={(videoRotationDeg) => update({ videoRotationDeg })}
          />
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={settings.autoRotatePortrait !== false}
              onChange={(e) => update({ autoRotatePortrait: e.target.checked })}
              className="accent-rose-500 w-4 h-4"
            />
            Auto-rotate portrait uploads (90° when height &gt; width)
          </label>
          <SliderRow
            label="Move chomp up / down"
            value={settings.offsetY * 100}
            min={-35}
            max={35}
            step={0.5}
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
            hint="Negative = up · positive = down (viewport height)."
            onChange={(v) => update({ offsetY: v / 100 })}
          />
          <SliderRow
            label="Move chomp left / right"
            value={settings.offsetX * 100}
            min={-15}
            max={35}
            step={0.5}
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
            hint="Negative = left · positive = right. Default 0 = centered."
            onChange={(v) => update({ offsetX: v / 100 })}
          />
          <SliderRow
            label="Chomp video scale"
            value={settings.videoScale}
            min={0.85}
            max={1.45}
            step={0.01}
            onChange={(videoScale) => update({ videoScale })}
          />
          <SliderRow
            label="Chomp baseline from bottom"
            value={settings.verticalOffset * 100}
            min={0}
            max={20}
            step={0.25}
            format={(v) => `${v.toFixed(1)}%`}
            hint="Legacy bottom inset (chomp is vertically centered now — leave at 0)."
            onChange={(v) => update({ verticalOffset: v / 100 })}
          />

          <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold pt-1">
            Intro swim position
          </p>
          <SliderRow
            label="Move intro left / right"
            value={(settings.introOffsetX ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetX) * 100}
            min={-15}
            max={35}
            step={0.5}
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
            hint="Swim forward clip only — then exits left off-screen."
            onChange={(v) => update({ introOffsetX: v / 100 })}
          />
          <SliderRow
            label="Move intro up / down"
            value={(settings.introOffsetY ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetY) * 100}
            min={-35}
            max={35}
            step={0.5}
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
            hint="Swim forward clip only — separate from chomp."
            onChange={(v) => update({ introOffsetY: v / 100 })}
          />

          <p className="text-[10px] uppercase tracking-wider text-rose-300/80 font-bold pt-1">
            Source crop (optional)
          </p>
          <p className="text-[10px] text-slate-500">
            Default shows the full shark. Trim corners in your export, or use these sliders if
            needed.
          </p>
          <SliderRow
            label="Source zoom"
            value={settings.sourceZoom ?? 1}
            min={1}
            max={1.6}
            step={0.01}
            hint="1 = full frame. Zoom in only to trim corner logos."
            onChange={(sourceZoom) => update({ sourceZoom })}
          />
          <SliderRow
            label="Source pan X"
            value={(settings.sourcePanX ?? 0) * 100}
            min={-100}
            max={100}
            step={1}
            format={(v) => `${v.toFixed(0)}%`}
            onChange={(v) => update({ sourcePanX: v / 100 })}
          />
          <SliderRow
            label="Source pan Y"
            value={(settings.sourcePanY ?? 0) * 100}
            min={-100}
            max={100}
            step={1}
            format={(v) => `${v.toFixed(0)}%`}
            onChange={(v) => update({ sourcePanY: v / 100 })}
          />

          <p className="text-[10px] uppercase tracking-wider text-rose-300/80 font-bold pt-1">
            Chomp sync (video)
          </p>
          <SliderRow
            label="Chomp progress"
            value={settings.chompProgress}
            min={0.4}
            max={0.95}
            step={0.01}
            format={(v) => v.toFixed(2)}
            hint="When tray dice vanish — relative to trimmed clip."
            onChange={(chompProgress) => update({ chompProgress })}
          />
          <SliderRow
            label="Fade start"
            value={settings.fadeStart}
            min={0.7}
            max={0.99}
            step={0.01}
            format={(v) => v.toFixed(2)}
            hint="Opacity fade after chomp — relative to trimmed clip. Default 0.93 keeps the bite visible."
            onChange={(fadeStart) => update({ fadeStart })}
          />
          <SliderRow
            label="Exit pan start"
            value={settings.exitPanStart}
            min={0.6}
            max={0.98}
            step={0.01}
            format={(v) => v.toFixed(2)}
            hint="Intro slide-off begins here. Chomp plays full — no exit pan."
            onChange={(exitPanStart) => update({ exitPanStart })}
          />
          <SliderRow
            label="Stop at progress"
            value={settings.stopAtProgress ?? DEFAULT_SHARK_BITE_SETTINGS.stopAtProgress}
            min={0.7}
            max={1}
            step={0.01}
            format={(v) => (v >= 0.999 ? "full clip" : v.toFixed(2))}
            hint="End playback here to trim tail (e.g. shark pop-back-up). 1 = no trim."
            onChange={(stopAtProgress) => update({ stopAtProgress })}
          />
          <SliderRow
            label="Exit pan slide"
            value={settings.exitPanExtra}
            min={0.2}
            max={2}
            step={0.05}
            format={(v) => `${v.toFixed(2)}× vw`}
            onChange={(exitPanExtra) => update({ exitPanExtra })}
          />
          <SliderRow
            label="Exit direction"
            value={settings.exitPanDirection ?? DEFAULT_SHARK_BITE_SETTINGS.exitPanDirection}
            min={-1}
            max={1}
            step={2}
            format={(v) => (v < 0 ? "← left" : "right →")}
            hint="Intro swims off this way. Default left so it clears the screen."
            onChange={(exitPanDirection) =>
              update({ exitPanDirection: exitPanDirection < 0 ? -1 : 1 })
            }
          />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-rose-300/80 font-bold">
            Timing (ms)
          </p>
          <SliderRow
            label="Pause before chomp"
            value={settings.interBeatMs ?? DEFAULT_SHARK_BITE_SETTINGS.interBeatMs}
            min={0}
            max={5000}
            step={100}
            format={(v) => `${Math.round(v)}ms`}
            hint="Quiet gap after swim-in before the full-screen chomp."
            onChange={(interBeatMs) => update({ interBeatMs })}
          />
          <SliderRow
            label="Pre-swim delay"
            value={settings.preSwimMs}
            min={0}
            max={1200}
            step={10}
            format={(v) => `${Math.round(v)}ms`}
            onChange={(preSwimMs) => update({ preSwimMs })}
          />
          <SliderRow
            label="Fallback vanish"
            value={settings.fallbackVanishMs}
            min={3000}
            max={15000}
            step={100}
            format={(v) => `${Math.round(v)}ms`}
            onChange={(fallbackVanishMs) => update({ fallbackVanishMs })}
          />

          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold pt-1">
            SVG fallback (no upload)
          </p>
          <SliderRow
            label="SVG chomp at"
            value={settings.chompMs}
            min={800}
            max={3000}
            step={25}
            format={(v) => `${Math.round(v)}ms`}
            onChange={(chompMs) => update({ chompMs })}
          />
          <SliderRow
            label="SVG swim duration"
            value={settings.fxMs}
            min={2000}
            max={6000}
            step={50}
            format={(v) => `${Math.round(v)}ms`}
            onChange={(fxMs) => update({ fxMs })}
          />
          <SliderRow
            label="SVG beat"
            value={settings.svgBeatMs}
            min={0}
            max={400}
            step={10}
            format={(v) => `${Math.round(v)}ms`}
            onChange={(svgBeatMs) => update({ svgBeatMs })}
          />

          <button
            type="button"
            onClick={() =>
              update({
                ...DEFAULT_SHARK_BITE_SETTINGS,
              })
            }
            className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white pt-1"
          >
            Reset all shark bite defaults
          </button>

          {onPreviewBite ? (
            <div
              className="relative rounded-xl overflow-hidden border border-white/10 min-h-[120px] mt-2"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #0b3b2e 0 14px, #0e4a39 14px 28px)",
              }}
            >
              <BlueGelPowerVideoScreen
                active={previewActive}
                loop={false}
                overGameplay
                zIndex={1}
              />
              {!previewActive ? (
                <p className="text-[11px] text-slate-400 px-4 py-8 text-center">
                  Tap ▶ Preview bite to test timing over this checkerboard.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
