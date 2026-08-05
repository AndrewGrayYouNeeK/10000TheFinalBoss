import React from "react";
import { Link } from "react-router-dom";
import {
  BlueGelPowerVideoScreen,
  useSharkBiteSettings,
} from "@/components/game/BlueGelPowerFX";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import {
  DEFAULT_SHARK_BITE_SETTINGS,
  resetSharkBiteSettings,
  saveSharkBiteSettings,
} from "@/lib/sharkBiteSettings";

function SliderRow({ label, value, min, max, step = 0.01, onChange, format, hint, accent = "rose" }) {
  const display =
    typeof format === "function" ? format(value) : Number(value).toFixed(step < 1 ? 2 : 0);
  const accentClass = accent === "cyan" ? "accent-cyan-400" : "accent-rose-400";
  return (
    <label className="block text-[11px] text-slate-400">
      {label}: <span className="text-rose-100 tabular-nums font-bold">{display}</span>
      {hint ? <span className="block text-[10px] text-slate-500 mt-0.5">{hint}</span> : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accentClass} mt-1`}
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
  const introXPct = (settings.introOffsetX ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetX) * 100;
  const introYPct = (settings.introOffsetY ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetY) * 100;

  const saveNow = () => {
    // Re-save current values so practice Bite FX / subscribers refresh immediately.
    saveSharkBiteSettings({ ...settings });
  };

  return (
    <div
      className={`rounded-xl border border-rose-500/35 bg-slate-900/60 space-y-4 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-rose-200">Shark Bite Lab controls</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
            Tune intro / chomp yourself. Changes save to this device and apply on the next Bite
            preview immediately.
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
          <button
            type="button"
            onClick={saveNow}
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => resetSharkBiteSettings()}
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-white/20 text-slate-300 hover:text-white hover:bg-white/5"
          >
            Reset defaults
          </button>
        </div>
      </div>

      {/* ─── Primary DIY: Intro position ─── */}
      <section className="rounded-xl border-2 border-cyan-400/50 bg-cyan-950/30 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-black text-cyan-100">Intro horizontal position</p>
            <p className="text-[11px] text-cyan-200/80 mt-0.5">
              First shark (swim-in). Drag right until jaws cover all dice.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 border border-cyan-400/40 px-3 py-1.5 text-right">
            <p className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-bold">
              introOffsetX
            </p>
            <p className="text-lg font-black text-cyan-50 tabular-nums leading-tight">
              {introXPct >= 0 ? "+" : ""}
              {introXPct.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400 tabular-nums">
              ({(introXPct / 100).toFixed(3)} vw)
            </p>
          </div>
        </div>

        <p className="text-[12px] font-bold text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-lg px-3 py-2">
          Tip: Drag Intro X right until jaws cover all dice
        </p>

        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
          <span>← Left</span>
          <span className="text-cyan-300">Intro X</span>
          <span>Right →</span>
        </div>
        <input
          type="range"
          min={-50}
          max={70}
          step={0.5}
          value={introXPct}
          onChange={(e) => update({ introOffsetX: Number(e.target.value) / 100 })}
          className="w-full accent-cyan-400 h-3"
          aria-label="Intro horizontal position"
        />

        <SliderRow
          label="Intro vertical"
          value={introYPct}
          min={-40}
          max={40}
          step={0.5}
          accent="cyan"
          format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
          hint="Negative = up · positive = down (viewport height)."
          onChange={(v) => update({ introOffsetY: v / 100 })}
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => update({ introOffsetX: 0 })}
            className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border border-white/15 text-slate-300 hover:bg-white/5"
          >
            Center (0%)
          </button>
          <button
            type="button"
            onClick={() => update({ introOffsetX: 0.5 })}
            className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-950/50"
          >
            Default +50%
          </button>
          <button
            type="button"
            onClick={() => update({ introOffsetX: 0.55 })}
            className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 bg-cyan-700/80 hover:bg-cyan-600 text-white"
          >
            Strong right +55%
          </button>
        </div>
      </section>

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
            accent="cyan"
            format={(v) => `${v.toFixed(2)}s`}
            onChange={(introStartAtSeconds) => update({ introStartAtSeconds })}
          />
          <SliderRow
            label="Intro stop at progress"
            value={settings.introStopAtProgress ?? DEFAULT_SHARK_BITE_SETTINGS.introStopAtProgress}
            min={0.5}
            max={1}
            step={0.01}
            accent="cyan"
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
            Second shark (fullscreen eat) — separate from intro.
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
            hint="Extra zoom on cover-fit (1 = fill screen, >1 crops in)."
            onChange={(videoScale) => update({ videoScale })}
          />

          <label className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <input
              type="checkbox"
              checked={settings.muted !== false}
              onChange={(e) => update({ muted: e.target.checked })}
              className="accent-rose-500 w-4 h-4"
            />
            Muted
          </label>

          <p className="text-[10px] text-slate-500">
            Mouth black circle: removed. Chroma plate strip only — no ellipse / hole fill in jaws.
          </p>

          <p className="text-[10px] uppercase tracking-wider text-rose-300/80 font-bold pt-1">
            Source crop (optional)
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
            hint="Opacity fade after chomp — relative to trimmed clip."
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
            hint="End playback here to trim tail. 1 = no trim."
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
          <SliderRow
            label="Blackout hold"
            value={settings.blackoutHoldMs ?? DEFAULT_SHARK_BITE_SETTINGS.blackoutHoldMs}
            min={0}
            max={3000}
            step={50}
            format={(v) => `${Math.round(v)}ms`}
            hint="Full-screen black after jaws close."
            onChange={(blackoutHoldMs) => update({ blackoutHoldMs })}
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

          {onPreviewBite ? (
            <div
              className="relative rounded-xl overflow-hidden border border-white/10 min-h-[140px] mt-2"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #0b3b2e 0 14px, #0e4a39 14px 28px)",
              }}
            >
              <p className="absolute top-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wider text-cyan-200/90 bg-black/50 rounded px-2 py-0.5">
                Intro live preview · offset {(introXPct >= 0 ? "+" : "") + introXPct.toFixed(0)}%
              </p>
              <BlueGelPowerVideoScreen
                active={previewActive}
                loop={false}
                overGameplay
                playFullClip
                syncChomp={false}
                videoKey={VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO}
                zIndex={1}
                containInParent
              />
              {!previewActive ? (
                <p className="text-[11px] text-slate-400 px-4 py-8 text-center">
                  Tap ▶ Preview bite to test intro position over this checkerboard.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
