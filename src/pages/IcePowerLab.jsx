import React from "react";
import { Link } from "react-router-dom";
import { Snowflake } from "lucide-react";
import { toast } from "sonner";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import DiceTray from "@/components/game/DiceTray";
import { useIcePowerSettings } from "@/components/game/IcePowerOverlay";
import {
  DEFAULT_ICE_POWER_SETTINGS,
  DEFAULT_FROZEN_FACE,
  DEFAULT_FROZEN_TINT_COLOR,
  ICE_BLEND_MODES,
  ICE_TINT_BLEND_MODES,
  applyFrozenFaceToAllForSkin,
  clearSkinIcePowerOverride,
  getFrozenFaceSettings,
  hasSkinIcePowerOverride,
  makeDefaultFrozenFaces,
  patchFrozenFaceForSkin,
  resetFrozenFaceForSkin,
  loadIcePowerSettings,
  resolveIcePowerSettingsForSkin,
  saveAllFrozenFacesForSkin,
  saveIcePowerSettings,
  saveSkinIcePowerSettings,
  resetIcePowerSettings,
} from "@/lib/icePowerSettings";
import {
  ICE_POWER_FROZEN_SHEET_URL,
  icePowerFrozenFaceUrl,
} from "@/lib/icePowerFaceAssets";
import { DICE_SKINS, getSkin } from "@/lib/shopCatalog";

const FACE_VALUES = [1, 2, 3, 4, 5, 6];

const TRAY_PREVIEW_DICE = [
  { id: "ice-lab-1", value: 1, held: false, used: false },
  { id: "ice-lab-2", value: 2, held: false, used: false },
  { id: "ice-lab-3", value: 3, held: false, used: false },
  { id: "ice-lab-4", value: 4, held: false, used: false },
  { id: "ice-lab-5", value: 5, held: false, used: false },
  { id: "ice-lab-6", value: 6, held: false, used: false },
];

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

function BlendSelect({ label = "Blend mode", value, onChange, disabled, modes = ICE_BLEND_MODES }) {
  return (
    <label className={`block text-[11px] text-slate-400 ${disabled ? "opacity-40" : ""}`}>
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-8 rounded-md border border-white/15 bg-slate-900 px-2 text-xs font-semibold text-white"
      >
        {modes.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function IcePowerLab() {
  const allSettings = useIcePowerSettings();
  const labSkinId = allSettings.labSkinId || "classic_white";
  const settings = resolveIcePowerSettingsForSkin(allSettings, labSkinId);
  const skinHasOwnTuning = hasSkinIcePowerOverride(allSettings, labSkinId);

  const updateLab = (patch) =>
    saveIcePowerSettings({ ...loadIcePowerSettings(), ...patch });
  const updateSkin = (patch) => saveSkinIcePowerSettings(null, labSkinId, patch);

  const dieSize = Math.round(allSettings.labDieSize || 88);
  const selectedSkin = getSkin(labSkinId) || DICE_SKINS[0];

  const handleSaveAllFacesForSkin = () => {
    saveAllFrozenFacesForSkin(null, labSkinId);
    toast.success(`${selectedSkin?.name || labSkinId} — all faces saved on this device`);
  };
  const trayMode = !!allSettings.labTrayMode;
  const showAllFaces = !trayMode && !!allSettings.labShowAll;
  const editFace = Math.min(6, Math.max(1, Math.round(allSettings.labFace) || 1));
  const faceTune = getFrozenFaceSettings(settings, editFace);
  const previewFaces = showAllFaces ? FACE_VALUES : [editFace];
  const overlayOn = settings.frozenEnabled !== false;
  const setOverlayOn = (frozenEnabled) => updateSkin({ frozenEnabled: !!frozenEnabled });

  const selectFace = (face) => updateLab({ labFace: face });
  const updateFace = (patch) => patchFrozenFaceForSkin(null, labSkinId, editFace, patch);

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
              <h1 className="text-lg font-black truncate text-sky-100">
                Preview freeze overlay
              </h1>
              <p className="text-[10px] text-slate-400 truncate">
                Per-face ice cubes — zoom &amp; offset each face · saves on this device
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/story"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white"
          >
            ▶ Story (Frosty fights)
          </Link>
          <Link
            to="/game"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-sky-500/45 text-sky-200 hover:bg-sky-950/40"
          >
            Game practice
          </Link>
          <Link
            to="/sprite-lab/ice"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/45 text-cyan-200 hover:bg-cyan-950/40"
          >
            Ice Sprite Lab
          </Link>
          <button
            type="button"
            onClick={() => resetIcePowerSettings()}
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-white/20 text-slate-300 hover:text-white hover:bg-white/5"
          >
            Reset defaults
          </button>
        </div>

        {/* 1. Live preview */}
        <section
          className={`rounded-2xl border border-sky-400/35 bg-slate-950/70 p-4 sm:p-6 ${
            overlayOn ? "overflow-visible" : "overflow-hidden"
          }`}
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(14,165,233,0.12) 0%, transparent 45%)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-black text-sky-100">Live preview</h2>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-lg">
                Same ice-cube sheet story mode puts on the opponent tray for ~2s when Frozen Ice
                fires. Overlay sliders are directly below — changes apply in fights immediately.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ToggleRow
                label="Full tray (6)"
                checked={trayMode}
                onChange={(labTrayMode) => updateLab({ labTrayMode })}
              />
              {!trayMode && (
                <ToggleRow
                  label="All faces"
                  checked={showAllFaces}
                  onChange={(labShowAll) => updateLab({ labShowAll })}
                />
              )}
              {!trayMode && !showAllFaces && (
                <div className="flex gap-1">
                  {FACE_VALUES.map((face) => (
                    <button
                      key={face}
                      type="button"
                      onClick={() => selectFace(face)}
                      className={`h-7 w-7 rounded-md text-[11px] font-black border ${
                        editFace === face
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

          <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Skin</span>
            <span className="text-sky-100 font-black">{selectedSkin?.name || labSkinId}</span>
            <span
              className={`text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 border ${
                skinHasOwnTuning
                  ? "border-sky-400/50 text-sky-200 bg-sky-500/15"
                  : "border-slate-600 text-slate-400 bg-black/20"
              }`}
            >
              {skinHasOwnTuning ? "This skin only" : "Global defaults"}
            </span>
            <label className="flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-950/40 px-2.5 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={overlayOn}
                onChange={(e) => setOverlayOn(e.target.checked)}
                className="accent-sky-400 w-3.5 h-3.5"
              />
              <span
                className={`text-[9px] font-black uppercase tracking-wider ${
                  overlayOn ? "text-sky-200" : "text-rose-200"
                }`}
              >
                {overlayOn ? "Freeze overlay on" : "Overlay disabled — tap to enable"}
              </span>
            </label>
          </div>

          {trayMode ? (
            <div
              className={`rounded-xl border border-sky-800/40 bg-slate-950/80 p-2 sm:p-3 ${
                overlayOn ? "overflow-visible" : "overflow-hidden"
              }`}
            >
              <DiceTray
                dice={TRAY_PREVIEW_DICE}
                rolling={false}
                disabled
                skinId={labSkinId}
                feltId="classic_green"
                iceFrozenOverlay={overlayOn}
              />
            </div>
          ) : (
            <div
              className={`flex flex-wrap justify-center gap-5 sm:gap-6 py-4 ${
                showAllFaces ? "max-w-lg mx-auto" : ""
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
                      skinId={labSkinId}
                      iceFrozenOverlay={overlayOn}
                      dieId={`ice-lab-${labSkinId}-${face}`}
                    />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                    Face {face}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!trayMode && (
            <SliderRow
              label="Preview die size"
              value={dieSize}
              min={48}
              max={140}
              step={1}
              format={(v) => `${Math.round(v)}px`}
              onChange={(labDieSize) => updateLab({ labDieSize })}
            />
          )}
        </section>

        {/* 2. Frozen overlay adjustments (sliders only) */}
        <section className="rounded-xl border border-sky-500/30 bg-slate-900/60 p-4 space-y-3">
          <div>
            <h2 className="text-sm font-black text-sky-100">Frozen overlay</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Sliders save for <b>{selectedSkin?.name || labSkinId}</b> only — other skins keep their
              own settings. Pick a face (1–6), then zoom / offset that ice cube for this skin.
            </p>
          </div>

          <ToggleRow
            label="Freeze overlay"
            checked={overlayOn}
            onChange={setOverlayOn}
          />
          {!overlayOn && (
            <p className="text-[10px] text-rose-300/90 -mt-1">
              Overlay is off — turn Freeze overlay on above (or in Live preview) to see ice on the
              dice.
            </p>
          )}

          <div>
            <div className="text-[11px] text-slate-400 mb-1.5">
              Editing face{" "}
              <span className="text-sky-100 font-black tabular-nums">{editFace}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FACE_VALUES.map((face) => (
                <button
                  key={face}
                  type="button"
                  onClick={() => selectFace(face)}
                  disabled={!settings.frozenEnabled}
                  className={`h-8 w-8 rounded-md text-xs font-black border transition-colors ${
                    editFace === face
                      ? "bg-sky-500 border-sky-300 text-white"
                      : "border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  }`}
                >
                  {face}
                </button>
              ))}
            </div>
          </div>

          <SliderRow
            label={`Face ${editFace} zoom`}
            value={faceTune.zoom}
            min={0.8}
            max={2.2}
            step={0.01}
            disabled={!settings.frozenEnabled}
            onChange={(zoom) => updateFace({ zoom })}
          />
          <SliderRow
            label={`Face ${editFace} offset X %`}
            value={faceTune.offsetX}
            min={-40}
            max={40}
            step={0.5}
            disabled={!settings.frozenEnabled}
            format={(v) => v.toFixed(1)}
            onChange={(offsetX) => updateFace({ offsetX })}
          />
          <SliderRow
            label={`Face ${editFace} offset Y %`}
            value={faceTune.offsetY}
            min={-40}
            max={40}
            step={0.5}
            disabled={!settings.frozenEnabled}
            format={(v) => v.toFixed(1)}
            onChange={(offsetY) => updateFace({ offsetY })}
          />

          <div className="border-t border-white/10 pt-3 space-y-3">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              For {selectedSkin?.name || labSkinId} (all faces)
            </p>
            <SliderRow
              label="Opacity"
              value={settings.frozenOpacity}
              min={0}
              max={1}
              step={0.01}
              disabled={!settings.frozenEnabled}
              onChange={(frozenOpacity) => updateSkin({ frozenOpacity })}
            />
            <SliderRow
              label="Center clear"
              value={settings.frozenCenterClear ?? DEFAULT_ICE_POWER_SETTINGS.frozenCenterClear}
              min={0}
              max={1}
              step={0.01}
              disabled={!settings.frozenEnabled}
              onChange={(frozenCenterClear) => updateSkin({ frozenCenterClear })}
            />
            <SliderRow
              label="Clear radius"
              value={settings.frozenCenterRadius ?? DEFAULT_ICE_POWER_SETTINGS.frozenCenterRadius}
              min={0.15}
              max={0.9}
              step={0.01}
              disabled={!settings.frozenEnabled}
              onChange={(frozenCenterRadius) => updateSkin({ frozenCenterRadius })}
            />
            <p className="text-[10px] text-slate-500 -mt-1">
              Higher center clear fades mid-face ice so pips show; clear radius widens that soft
              window. Edges keep blue frost.
            </p>
            <BlendSelect
              value={settings.frozenBlend || "normal"}
              disabled={!settings.frozenEnabled}
              onChange={(frozenBlend) => updateSkin({ frozenBlend })}
            />
          </div>

          <div className="border-t border-white/10 pt-3 space-y-3">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Icy blue tint
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Washes cyan onto the ice layer only (keeps pips readable). Match the blue ice-cube
                reference — not gray frost.
              </p>
            </div>
            <label
              className={`flex items-center justify-between gap-3 text-[11px] text-slate-400 ${
                !settings.frozenEnabled ? "opacity-40" : ""
              }`}
            >
              <span>
                Tint color{" "}
                <span className="text-sky-100 font-mono tabular-nums">
                  {settings.frozenTintColor || DEFAULT_FROZEN_TINT_COLOR}
                </span>
              </span>
              <input
                type="color"
                value={settings.frozenTintColor || DEFAULT_FROZEN_TINT_COLOR}
                disabled={!settings.frozenEnabled}
                onChange={(e) => updateSkin({ frozenTintColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border border-white/15 bg-slate-900 disabled:cursor-not-allowed"
              />
            </label>
            <SliderRow
              label="Tint strength"
              value={settings.frozenTintStrength ?? DEFAULT_ICE_POWER_SETTINGS.frozenTintStrength}
              min={0}
              max={1}
              step={0.01}
              disabled={!settings.frozenEnabled}
              onChange={(frozenTintStrength) => updateSkin({ frozenTintStrength })}
            />
            <SliderRow
              label="Ice saturate"
              value={settings.frozenTintSaturate ?? DEFAULT_ICE_POWER_SETTINGS.frozenTintSaturate}
              min={0.5}
              max={2.5}
              step={0.01}
              disabled={!settings.frozenEnabled}
              onChange={(frozenTintSaturate) => updateSkin({ frozenTintSaturate })}
            />
            <BlendSelect
              label="Tint blend"
              value={settings.frozenTintBlend || "color"}
              modes={ICE_TINT_BLEND_MODES}
              disabled={!settings.frozenEnabled}
              onChange={(frozenTintBlend) => updateSkin({ frozenTintBlend })}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveAllFacesForSkin}
              className="text-[11px] font-bold uppercase tracking-wider text-sky-300 hover:text-sky-100"
            >
              Save all faces (this skin)
            </button>
            <button
              type="button"
              onClick={() => applyFrozenFaceToAllForSkin(null, labSkinId, editFace)}
              className="text-[11px] font-bold uppercase tracking-wider text-sky-300/80 hover:text-sky-100"
            >
              Apply face {editFace} → all
            </button>
            <button
              type="button"
              onClick={() => resetFrozenFaceForSkin(null, labSkinId, editFace)}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
            >
              Reset this face
            </button>
            <button
              type="button"
              onClick={() =>
                updateSkin({
                  frozenOpacity: DEFAULT_ICE_POWER_SETTINGS.frozenOpacity,
                  frozenCenterClear: DEFAULT_ICE_POWER_SETTINGS.frozenCenterClear,
                  frozenCenterRadius: DEFAULT_ICE_POWER_SETTINGS.frozenCenterRadius,
                  frozenBlend: DEFAULT_ICE_POWER_SETTINGS.frozenBlend,
                  frozenTintColor: DEFAULT_ICE_POWER_SETTINGS.frozenTintColor,
                  frozenTintStrength: DEFAULT_ICE_POWER_SETTINGS.frozenTintStrength,
                  frozenTintBlend: DEFAULT_ICE_POWER_SETTINGS.frozenTintBlend,
                  frozenTintSaturate: DEFAULT_ICE_POWER_SETTINGS.frozenTintSaturate,
                  frozenEnabled: true,
                  frozenFaces: makeDefaultFrozenFaces(DEFAULT_FROZEN_FACE),
                  frozenZoom: DEFAULT_FROZEN_FACE.zoom,
                  frozenOffsetX: DEFAULT_FROZEN_FACE.offsetX,
                  frozenOffsetY: DEFAULT_FROZEN_FACE.offsetY,
                })
              }
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
            >
              Reset this skin
            </button>
            {skinHasOwnTuning && (
              <button
                type="button"
                onClick={() => clearSkinIcePowerOverride(null, labSkinId)}
                className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
              >
                Use global defaults
              </button>
            )}
          </div>
        </section>

        {/* 3. Skin picker */}
        <section className="rounded-xl border border-sky-500/30 bg-slate-900/60 p-4 space-y-3">
          <div>
            <h2 className="text-sm font-black text-sky-100">Dice skin</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Each skin has its own freeze overlay tuning — pick a skin, adjust sliders, then try
              another skin without losing your work.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {DICE_SKINS.map((skin) => {
              const active = labSkinId === skin.id;
              const tuned = hasSkinIcePowerOverride(allSettings, skin.id);
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => updateLab({ labSkinId: skin.id })}
                  className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
                    active
                      ? "border-sky-400 bg-sky-500/25 text-white"
                      : "border-white/10 bg-black/25 text-slate-300 hover:border-sky-500/40 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="text-[11px] font-black truncate">{skin.name}</div>
                  <div className="text-[9px] text-slate-500 truncate font-mono">
                    {skin.id}
                    {tuned ? " · tuned" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Per-face assets + source sheet reference */}
        <section className="rounded-xl border border-sky-500/30 bg-slate-900/60 p-4 space-y-3">
          <div>
            <h2 className="text-sm font-black text-sky-100">Divided face assets</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Each die uses its own PNG — no neighbor ice from the shared 3×2 sheet.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {FACE_VALUES.map((face) => (
              <button
                key={face}
                type="button"
                onClick={() => selectFace(face)}
                className={`rounded-lg border p-1.5 text-left transition-colors ${
                  editFace === face
                    ? "border-sky-400 bg-sky-500/20"
                    : "border-white/10 bg-black/25 hover:border-sky-500/40"
                }`}
              >
                <div
                  className="rounded border border-white/5 aspect-square overflow-hidden"
                  style={{
                    background:
                      "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 10px 10px",
                  }}
                >
                  <img
                    src={icePowerFrozenFaceUrl(face)}
                    alt={`Ice face ${face}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[10px] font-black text-center mt-1 text-slate-300">
                  Face {face}
                </div>
              </button>
            ))}
          </div>
          <div className="max-w-xs">
            <div className="rounded-lg border border-white/10 bg-black/30 p-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold">
                Source sheet (3×2) — for regen only
              </p>
              <div
                className="rounded border border-white/5 p-1"
                style={{
                  background:
                    "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 12px 12px",
                }}
              >
                <img
                  src={ICE_POWER_FROZEN_SHEET_URL}
                  alt="Ice power frozen sheet"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        <p className="text-[10px] text-slate-500 text-center pt-1">
          Open{" "}
          <code className="text-sky-300">/ice-lab</code> or{" "}
          <code className="text-sky-300">/frosty-lab</code>. Settings key{" "}
          <code className="text-slate-400">dice10k_ice_power_settings_v2</code> — per-skin overrides in{" "}
          <code className="text-slate-400">skinOverrides</code>. Story Frozen Ice uses the opponent
          tray skin. Use <span className="text-sky-300">Save all faces (this skin)</span> to persist
          every face for the selected skin on this device.
        </p>
      </div>
    </div>
  );
}
