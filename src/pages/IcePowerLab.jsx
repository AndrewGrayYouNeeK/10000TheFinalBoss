import React from "react";
import { Link } from "react-router-dom";
import { Snowflake } from "lucide-react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import {
  ICE_POWER_SHAPE_URL,
  ICE_POWER_FROZEN_URL,
  useIcePowerSettings,
} from "@/components/game/IcePowerOverlay";
import {
  DEFAULT_ICE_POWER_SETTINGS,
  ICE_BLEND_MODES,
  saveIcePowerSettings,
  resetIcePowerSettings,
} from "@/lib/icePowerSettings";

const FACE_VALUES = [1, 2, 3, 4, 5, 6];

function SliderRow({ label, value, min, max, step = 0.01, onChange, format, disabled }) {
  const display =
    typeof format === "function" ? format(value) : Number(value).toFixed(step < 1 ? 2 : 0);
  return (
    <label className={`block text-[11px] text-slate-400 ${disabled ? "opacity-40" : ""}`}>
      {label}: <span className="text-sky-100 tabular-nums">{display}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-400 mt-1"
      />
    </label>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-200">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-sky-400 w-4 h-4"
      />
    </label>
  );
}

function BlendSelect({ value, onChange, disabled }) {
  return (
    <label className={`block text-[11px] text-slate-400 ${disabled ? "opacity-40" : ""}`}>
      Blend mode
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-8 rounded-md border border-white/15 bg-slate-900 px-2 text-xs font-semibold text-white"
      >
        {ICE_BLEND_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </label>
  );
}

function LayerCard({ title, hint, children }) {
  return (
    <section className="rounded-xl border border-sky-500/30 bg-slate-900/60 p-3 space-y-3">
      <div>
        <h2 className="text-sm font-black text-sky-100">{title}</h2>
        {hint ? <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function IcePowerLab() {
  const settings = useIcePowerSettings();
  const update = (patch) => saveIcePowerSettings({ ...settings, ...patch });

  const dieSize = Math.round(settings.labDieSize || 88);
  const previewFaces = settings.labShowAll
    ? FACE_VALUES
    : [Math.min(6, Math.max(1, Math.round(settings.labFace) || 1))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-sky-950/40 to-black text-white pb-12">
      <div
        className="sticky top-0 z-20 border-b border-sky-500/20 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,8,18,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <BackButton to="/" label="Home" />
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-sky-300 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-black truncate text-sky-100">Frosty Ice Power Lab</h1>
              <p className="text-[10px] text-slate-400 truncate">
                Tune shape · frame · frozen layers — saves on this device
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/game"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white"
          >
            ▶ Game (Frosty practice)
          </Link>
          <Link
            to="/sprite-lab/ice"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/45 text-cyan-200 hover:bg-cyan-950/40"
          >
            Ice Sprite Lab
          </Link>
          <Link
            to="/video-assets"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-slate-500/45 text-slate-200 hover:bg-slate-900/60"
          >
            Video Assets
          </Link>
          <Link
            to="/fish-showcase"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-rose-500/40 text-rose-200 hover:bg-rose-950/40"
          >
            Fish Showcase
          </Link>
          <button
            type="button"
            onClick={() => resetIcePowerSettings()}
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-white/20 text-slate-300 hover:text-white hover:bg-white/5"
          >
            Reset defaults
          </button>
        </div>

        {/* Live preview */}
        <section
          className="rounded-2xl border border-sky-400/35 bg-slate-950/70 p-4 sm:p-6 overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(14,165,233,0.12) 0%, transparent 45%)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-black text-sky-100">Live preview</h2>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                Regular Frozen Ice skin → shape mask → dripping frame → frozen cubes. Changes apply
                in-game immediately (Score Freeze / Frosty practice).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ToggleRow
                label="Show all 6"
                checked={settings.labShowAll}
                onChange={(labShowAll) => update({ labShowAll })}
              />
              {!settings.labShowAll && (
                <div className="flex gap-1">
                  {FACE_VALUES.map((face) => (
                    <button
                      key={face}
                      type="button"
                      onClick={() => update({ labFace: face })}
                      className={`h-7 w-7 rounded-md text-[11px] font-black border ${
                        settings.labFace === face
                          ? "bg-sky-500 border-sky-300 text-white"
                          : "border-slate-600 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {face}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex flex-wrap justify-center gap-5 sm:gap-6 py-4 ${
              settings.labShowAll ? "max-w-lg mx-auto" : ""
            }`}
          >
            {previewFaces.map((face) => (
              <div key={face} className="flex flex-col items-center gap-1.5">
                <div
                  className="relative"
                  style={{ width: dieSize, height: dieSize, overflow: "visible" }}
                >
                  <Die
                    value={face}
                    size={dieSize}
                    skinId="ice"
                    powerMode
                    dieId={`ice-lab-${face}`}
                  />
                </div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                  Face {face}
                </span>
              </div>
            ))}
          </div>

          <SliderRow
            label="Preview die size"
            value={dieSize}
            min={48}
            max={140}
            step={1}
            format={(v) => `${Math.round(v)}px`}
            onChange={(labDieSize) => update({ labDieSize })}
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-black/30 p-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
                Shape sheet
              </p>
              <img
                src={ICE_POWER_SHAPE_URL}
                alt="Ice power shape"
                className="w-full h-auto rounded border border-white/5"
              />
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 p-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
                Frozen sheet
              </p>
              <img
                src={ICE_POWER_FROZEN_URL}
                alt="Ice power frozen"
                className="w-full h-auto rounded border border-white/5"
              />
            </div>
          </div>
        </section>

        {/* Controls */}
        <div className="grid gap-4 md:grid-cols-2">
          <LayerCard
            title="Shape mask"
            hint="CSS mask on the die body — organic dripping silhouette"
          >
            <ToggleRow
              label="Enabled"
              checked={settings.shapeEnabled}
              onChange={(shapeEnabled) => update({ shapeEnabled })}
            />
            <SliderRow
              label="Zoom"
              value={settings.shapeZoom}
              min={0.8}
              max={2.2}
              step={0.01}
              disabled={!settings.shapeEnabled}
              onChange={(shapeZoom) => update({ shapeZoom })}
            />
            <SliderRow
              label="Offset X %"
              value={settings.shapeOffsetX}
              min={-40}
              max={40}
              step={0.5}
              disabled={!settings.shapeEnabled}
              format={(v) => v.toFixed(1)}
              onChange={(shapeOffsetX) => update({ shapeOffsetX })}
            />
            <SliderRow
              label="Offset Y %"
              value={settings.shapeOffsetY}
              min={-40}
              max={40}
              step={0.5}
              disabled={!settings.shapeEnabled}
              format={(v) => v.toFixed(1)}
              onChange={(shapeOffsetY) => update({ shapeOffsetY })}
            />
          </LayerCard>

          <LayerCard
            title="Dripping frame"
            hint="ice_power_shape.png — multiply keys out white; can extend past die"
          >
            <ToggleRow
              label="Enabled"
              checked={settings.frameEnabled}
              onChange={(frameEnabled) => update({ frameEnabled })}
            />
            <SliderRow
              label="Zoom"
              value={settings.frameZoom}
              min={0.8}
              max={2.2}
              step={0.01}
              disabled={!settings.frameEnabled}
              onChange={(frameZoom) => update({ frameZoom })}
            />
            <SliderRow
              label="Opacity"
              value={settings.frameOpacity}
              min={0}
              max={1}
              step={0.01}
              disabled={!settings.frameEnabled}
              onChange={(frameOpacity) => update({ frameOpacity })}
            />
            <SliderRow
              label="Offset X %"
              value={settings.frameOffsetX}
              min={-40}
              max={40}
              step={0.5}
              disabled={!settings.frameEnabled}
              format={(v) => v.toFixed(1)}
              onChange={(frameOffsetX) => update({ frameOffsetX })}
            />
            <SliderRow
              label="Offset Y %"
              value={settings.frameOffsetY}
              min={-40}
              max={40}
              step={0.5}
              disabled={!settings.frameEnabled}
              format={(v) => v.toFixed(1)}
              onChange={(frameOffsetY) => update({ frameOffsetY })}
            />
            <SliderRow
              label="Drip pad (size frac)"
              value={settings.frameDripPad}
              min={0}
              max={0.3}
              step={0.01}
              disabled={!settings.frameEnabled}
              onChange={(frameDripPad) => update({ frameDripPad })}
            />
            <BlendSelect
              value={settings.frameBlend || "multiply"}
              disabled={!settings.frameEnabled}
              onChange={(frameBlend) => update({ frameBlend })}
            />
          </LayerCard>

          <LayerCard
            title="Frozen cubes"
            hint="ice_power_frozen.png — screen keys out black plate"
          >
            <ToggleRow
              label="Enabled"
              checked={settings.frozenEnabled}
              onChange={(frozenEnabled) => update({ frozenEnabled })}
            />
            <SliderRow
              label="Zoom"
              value={settings.frozenZoom}
              min={0.8}
              max={2.2}
              step={0.01}
              disabled={!settings.frozenEnabled}
              onChange={(frozenZoom) => update({ frozenZoom })}
            />
            <SliderRow
              label="Opacity"
              value={settings.frozenOpacity}
              min={0}
              max={1}
              step={0.01}
              disabled={!settings.frozenEnabled}
              onChange={(frozenOpacity) => update({ frozenOpacity })}
            />
            <SliderRow
              label="Offset X %"
              value={settings.frozenOffsetX}
              min={-40}
              max={40}
              step={0.5}
              disabled={!settings.frozenEnabled}
              format={(v) => v.toFixed(1)}
              onChange={(frozenOffsetX) => update({ frozenOffsetX })}
            />
            <SliderRow
              label="Offset Y %"
              value={settings.frozenOffsetY}
              min={-40}
              max={40}
              step={0.5}
              disabled={!settings.frozenEnabled}
              format={(v) => v.toFixed(1)}
              onChange={(frozenOffsetY) => update({ frozenOffsetY })}
            />
            <BlendSelect
              value={settings.frozenBlend || "screen"}
              disabled={!settings.frozenEnabled}
              onChange={(frozenBlend) => update({ frozenBlend })}
            />
          </LayerCard>

          <LayerCard title="Frost sheen" hint="Inset glow + soft-light highlight on the face">
            <ToggleRow
              label="Enabled"
              checked={settings.sheenEnabled}
              onChange={(sheenEnabled) => update({ sheenEnabled })}
            />
            <SliderRow
              label="Opacity"
              value={settings.sheenOpacity}
              min={0}
              max={1}
              step={0.01}
              disabled={!settings.sheenEnabled}
              onChange={(sheenOpacity) => update({ sheenOpacity })}
            />
            <button
              type="button"
              onClick={() =>
                update({
                  shapeZoom: DEFAULT_ICE_POWER_SETTINGS.shapeZoom,
                  shapeOffsetX: 0,
                  shapeOffsetY: 0,
                  frameZoom: DEFAULT_ICE_POWER_SETTINGS.frameZoom,
                  frameOpacity: DEFAULT_ICE_POWER_SETTINGS.frameOpacity,
                  frameOffsetX: 0,
                  frameOffsetY: 0,
                  frameDripPad: DEFAULT_ICE_POWER_SETTINGS.frameDripPad,
                  frameBlend: DEFAULT_ICE_POWER_SETTINGS.frameBlend,
                  frozenZoom: DEFAULT_ICE_POWER_SETTINGS.frozenZoom,
                  frozenOpacity: DEFAULT_ICE_POWER_SETTINGS.frozenOpacity,
                  frozenOffsetX: 0,
                  frozenOffsetY: 0,
                  frozenBlend: DEFAULT_ICE_POWER_SETTINGS.frozenBlend,
                  sheenOpacity: DEFAULT_ICE_POWER_SETTINGS.sheenOpacity,
                })
              }
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white pt-1"
            >
              Zero offsets + default zooms
            </button>
          </LayerCard>
        </div>

        <p className="text-[10px] text-slate-500 text-center pt-1">
          Routes:{" "}
          <code className="text-sky-300">/ice-lab</code> ·{" "}
          <code className="text-sky-300">/frosty-lab</code>. Settings key{" "}
          <code className="text-slate-400">dice10k_ice_power_settings_v1</code>.
        </p>
      </div>
    </div>
  );
}
