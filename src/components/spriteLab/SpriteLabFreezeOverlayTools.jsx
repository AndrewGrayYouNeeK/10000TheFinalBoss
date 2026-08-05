import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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
  resolveIcePowerSettingsForSkin,
  saveAllFrozenFacesForSkin,
  saveSkinIcePowerSettings,
} from "@/lib/icePowerSettings";
import { getSkin } from "@/lib/shopCatalog";
import { cn } from "@/lib/utils";

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

/**
 * Score Freeze cube overlay tuning inside Sprite Lab — same per-skin saves as Ice Lab.
 * Collapsed by default so face/shell nudge stays beside the sticky live preview.
 */
export default function SpriteLabFreezeOverlayTools({
  skinId,
  editFace = 1,
  onEditFaceChange,
  freezeOn = false,
  onFreezeOnChange,
  defaultOpen = false,
  className,
}) {
  const [open, setOpen] = React.useState(!!defaultOpen || !!freezeOn);
  const allSettings = useIcePowerSettings();
  const settings = resolveIcePowerSettingsForSkin(allSettings, skinId);
  const skinHasOwnTuning = hasSkinIcePowerOverride(allSettings, skinId);
  const skinName = getSkin(skinId)?.name || skinId;
  const face = Math.min(6, Math.max(1, Math.round(editFace) || 1));
  const faceTune = getFrozenFaceSettings(settings, face);
  const overlayLive = freezeOn && settings.frozenEnabled !== false;

  React.useEffect(() => {
    if (freezeOn) setOpen(true);
  }, [freezeOn]);

  const updateSkin = (patch) => saveSkinIcePowerSettings(null, skinId, patch);
  const updateFace = (patch) => patchFrozenFaceForSkin(null, skinId, face, patch);

  const setOverlayOn = (on) => {
    onFreezeOnChange?.(!!on);
    if (on) setOpen(true);
    if (on && settings.frozenEnabled === false) {
      updateSkin({ frozenEnabled: true });
    }
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-sky-500/35 bg-sky-950/25 p-3 sm:p-4 space-y-2.5",
        open && "max-h-[min(72vh,640px)] overflow-y-auto overscroll-contain",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-wrap items-start justify-between gap-2 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Freeze overlay tools
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {open ? (
              <>
                Tune Score Freeze cubes on <b className="text-sky-100">{skinName}</b> — same save as{" "}
                <Link
                  to="/ice-lab"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-300 underline font-bold"
                >
                  Ice Lab
                </Link>
                .
              </>
            ) : (
              <>Tap to open — zoom / opacity / tint for {skinName}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {skinHasOwnTuning ? (
            <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-sky-100">
              Per-skin save
            </span>
          ) : null}
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {open ? "Hide ▲" : "Show ▼"}
          </span>
        </div>
      </button>

      {!open ? (
        <label
          className="flex items-center justify-between gap-3 text-xs font-bold text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <span>Show freeze on preview</span>
          <input
            type="checkbox"
            checked={!!freezeOn}
            onChange={(e) => setOverlayOn(e.target.checked)}
            className="accent-sky-400 w-4 h-4"
          />
        </label>
      ) : null}

      {open ? (
        <>
      <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-200">
        <span>Show freeze on preview</span>
        <input
          type="checkbox"
          checked={!!freezeOn}
          onChange={(e) => setOverlayOn(e.target.checked)}
          className="accent-sky-400 w-4 h-4"
        />
      </label>
      {!overlayLive && (
        <p className="text-[10px] text-rose-300/90 -mt-1">
          Turn freeze on to see ice cubes on the live preview while you slide.
        </p>
      )}

      <div>
        <div className="text-[11px] text-slate-400 mb-1.5">
          Editing face <span className="text-sky-100 font-black tabular-nums">{face}</span>
          <span className="text-slate-500"> · synced with Sprite Lab face</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onEditFaceChange?.(f)}
              className={cn(
                "h-8 w-8 rounded-md text-xs font-black border transition-colors",
                face === f
                  ? "bg-sky-500 border-sky-300 text-white"
                  : "border-slate-600 text-slate-300 hover:bg-slate-800"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <SliderRow
        label={`Face ${face} zoom`}
        value={faceTune.zoom}
        min={0.8}
        max={2.2}
        step={0.01}
        onChange={(zoom) => updateFace({ zoom })}
      />
      <SliderRow
        label={`Face ${face} offset X %`}
        value={faceTune.offsetX}
        min={-40}
        max={40}
        step={0.5}
        format={(v) => v.toFixed(1)}
        onChange={(offsetX) => updateFace({ offsetX })}
      />
      <SliderRow
        label={`Face ${face} offset Y %`}
        value={faceTune.offsetY}
        min={-40}
        max={40}
        step={0.5}
        format={(v) => v.toFixed(1)}
        onChange={(offsetY) => updateFace({ offsetY })}
      />

      <div className="border-t border-white/10 pt-3 space-y-3">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          All faces · {skinName}
        </p>
        <SliderRow
          label="Opacity"
          value={settings.frozenOpacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(frozenOpacity) => updateSkin({ frozenOpacity })}
        />
        <SliderRow
          label="Center clear"
          value={settings.frozenCenterClear ?? DEFAULT_ICE_POWER_SETTINGS.frozenCenterClear}
          min={0}
          max={1}
          step={0.01}
          onChange={(frozenCenterClear) => updateSkin({ frozenCenterClear })}
        />
        <SliderRow
          label="Clear radius"
          value={settings.frozenCenterRadius ?? DEFAULT_ICE_POWER_SETTINGS.frozenCenterRadius}
          min={0.15}
          max={0.9}
          step={0.01}
          onChange={(frozenCenterRadius) => updateSkin({ frozenCenterRadius })}
        />
        <BlendSelect
          value={settings.frozenBlend || "normal"}
          onChange={(frozenBlend) => updateSkin({ frozenBlend })}
        />
      </div>

      <div className="border-t border-white/10 pt-3 space-y-3">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          Icy blue tint
        </p>
        <label className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>
            Tint color{" "}
            <span className="text-sky-100 font-mono tabular-nums">
              {settings.frozenTintColor || DEFAULT_FROZEN_TINT_COLOR}
            </span>
          </span>
          <input
            type="color"
            value={settings.frozenTintColor || DEFAULT_FROZEN_TINT_COLOR}
            onChange={(e) => updateSkin({ frozenTintColor: e.target.value })}
            className="h-8 w-12 cursor-pointer rounded border border-white/15 bg-slate-900"
          />
        </label>
        <SliderRow
          label="Tint strength"
          value={settings.frozenTintStrength ?? DEFAULT_ICE_POWER_SETTINGS.frozenTintStrength}
          min={0}
          max={1}
          step={0.01}
          onChange={(frozenTintStrength) => updateSkin({ frozenTintStrength })}
        />
        <SliderRow
          label="Ice saturate"
          value={settings.frozenTintSaturate ?? DEFAULT_ICE_POWER_SETTINGS.frozenTintSaturate}
          min={0.5}
          max={2.5}
          step={0.01}
          onChange={(frozenTintSaturate) => updateSkin({ frozenTintSaturate })}
        />
        <BlendSelect
          label="Tint blend"
          value={settings.frozenTintBlend || "color"}
          modes={ICE_TINT_BLEND_MODES}
          onChange={(frozenTintBlend) => updateSkin({ frozenTintBlend })}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            saveAllFrozenFacesForSkin(null, skinId);
            toast.success(`${skinName} — freeze faces saved on this device`);
          }}
          className="text-[11px] font-bold uppercase tracking-wider text-sky-300 hover:text-sky-100"
        >
          Save all faces
        </button>
        <button
          type="button"
          onClick={() => applyFrozenFaceToAllForSkin(null, skinId, face)}
          className="text-[11px] font-bold uppercase tracking-wider text-sky-300/80 hover:text-sky-100"
        >
          Apply face {face} → all
        </button>
        <button
          type="button"
          onClick={() => resetFrozenFaceForSkin(null, skinId, face)}
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
          Reset skin freeze
        </button>
        {skinHasOwnTuning ? (
          <button
            type="button"
            onClick={() => {
              clearSkinIcePowerOverride(null, skinId);
              toast.success(`${skinName} — freeze override cleared`);
            }}
            className="text-[11px] font-bold uppercase tracking-wider text-rose-300/80 hover:text-rose-200"
          >
            Clear override
          </button>
        ) : null}
      </div>
        </>
      ) : null}
    </section>
  );
}
