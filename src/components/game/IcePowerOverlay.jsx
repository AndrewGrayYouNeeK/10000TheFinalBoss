import React from "react";
import {
  loadIcePowerSettings,
  subscribeIcePowerSettings,
  iceOffsetPx,
  getFrozenFaceSettings,
  DEFAULT_ICE_POWER_SETTINGS,
  resolveIcePowerSettingsForSkin,
} from "@/lib/icePowerSettings";
import {
  ICE_FACE_PAD_FRAC,
  ICE_POWER_FROZEN_SHEET_URL,
  icePowerFrozenFaceUrl,
  icePowerOutlineDripsFaceUrl,
  icePowerOutlineFaceUrl,
} from "@/lib/icePowerFaceAssets";
import { assetUrl } from "@/lib/assetUrl";
import { getSkinLevelProgress } from "@/lib/skinLevelVisuals";

/** @deprecated Use icePowerFrozenFaceUrl(face) — sheet kept for lab reference. */
export const ICE_POWER_FROZEN_URL = ICE_POWER_FROZEN_SHEET_URL;
/** @deprecated Per-face outline masks — see icePowerOutlineFaceUrl. */
export const ICE_POWER_OUTLINE_MASK_URL = "/assets/ice_power_frozen_outline.png";
/** @deprecated Per-face drip masks — see icePowerOutlineDripsFaceUrl. */
export const ICE_POWER_OUTLINE_DRIPS_URL = "/assets/ice_power_frozen_outline_drips.png";

export function useIcePowerSettings() {
  const [settings, setSettings] = React.useState(() => loadIcePowerSettings());
  React.useEffect(() => subscribeIcePowerSettings(setSettings), []);
  return settings;
}

/**
 * Per-face square ice image — center content square maps to size×zoom;
 * canvas pad holds that face's own drips only (no neighbor cubes).
 */
export function getIcePowerFaceLayerStyle(value, size, zoom = 1, offsetX = 0, offsetY = 0, pad = 0) {
  void value;
  const content = size * zoom;
  const img = content / (1 - 2 * ICE_FACE_PAD_FRAC);
  const left = pad + size / 2 - img / 2 + offsetX;
  const top = pad + size / 2 - img / 2 + offsetY;
  return {
    backgroundSize: `${img}px ${img}px`,
    backgroundPosition: `${left}px ${top}px`,
    backgroundRepeat: "no-repeat",
  };
}

/** Extra px around the die so ice cube drips / edges aren't clipped. */
export function iceOverlayBleedPx(size) {
  return Math.max(14, Math.round(size * 0.22));
}

function faceMaskStyle(faceLayer, maskUrl, centerClearMask = null) {
  const size = faceLayer.backgroundSize;
  const position = faceLayer.backgroundPosition;
  if (!centerClearMask) {
    return {
      WebkitMaskImage: `url(${assetUrl(maskUrl)})`,
      maskImage: `url(${assetUrl(maskUrl)})`,
      WebkitMaskSize: size,
      maskSize: size,
      WebkitMaskPosition: position,
      maskPosition: position,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskMode: "alpha",
      maskMode: "alpha",
    };
  }
  // Intersect outline silhouette with radial mid-face fade (keeps rim frost, clears pips).
  return {
    WebkitMaskImage: `${centerClearMask}, url(${assetUrl(maskUrl)})`,
    maskImage: `${centerClearMask}, url(${assetUrl(maskUrl)})`,
    WebkitMaskSize: `100% 100%, ${size}`,
    maskSize: `100% 100%, ${size}`,
    WebkitMaskPosition: `center, ${position}`,
    maskPosition: `center, ${position}`,
    WebkitMaskRepeat: "no-repeat, no-repeat",
    maskRepeat: "no-repeat, no-repeat",
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect",
    WebkitMaskMode: "alpha, alpha",
    maskMode: "alpha, alpha",
  };
}

/**
 * Radial alpha mask — low alpha in the die center so pips read through;
 * full alpha toward the rim keeps blue edge frost.
 * Used with outline mask via mask-composite: intersect.
 *
 * clear=0 → uniform; clear=1 → nearly hollow mid-face.
 */
export function getIceCenterClearMask(
  centerClear = 0.9,
  centerRadius = 0.62,
  size = 64,
  pad = 0
) {
  const clear = Math.min(1, Math.max(0, Number(centerClear) || 0));
  const radius = Math.min(1, Math.max(0.08, Number(centerRadius) || 0.62));
  if (clear < 0.01) return null;

  const midAlpha = Math.max(0.02, (1 - clear) ** 1.7);
  const midSoft = Math.min(1, midAlpha + (1 - midAlpha) * 0.2);
  const outer = Math.max(1, size + pad * 2);
  const cx = ((pad + size / 2) / outer) * 100;
  const cy = ((pad + size * 0.48) / outer) * 100;
  const axisPct = Math.max(34, Math.min(98, ((size * (0.8 + radius * 0.18)) / outer) * 100));
  const innerPct = Math.round(radius * 46);
  const midPct = Math.round(radius * 72);
  const rimPct = Math.min(100, Math.round(radius * 92 + 8));

  return `radial-gradient(ellipse ${axisPct.toFixed(1)}% ${axisPct.toFixed(1)}% at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, rgba(255,255,255,${midAlpha.toFixed(3)}) 0%, rgba(255,255,255,${midAlpha.toFixed(3)}) ${innerPct}%, rgba(255,255,255,${midSoft.toFixed(3)}) ${midPct}%, rgba(255,255,255,1) ${rimPct}%, rgba(255,255,255,1) 100%)`;
}

/**
 * Scale the tuned freeze look for a skin's earned level.
 *
 * Level 1 stays clear. Higher levels increase the ice layer and shrink the
 * clear center so the pips become progressively harder to read.
 */
export function getLevelFrostSettings(settings, level) {
  const progress = getSkinLevelProgress(level);
  if (progress <= 0) return settings;

  const opacity = Number(settings?.frozenOpacity);
  const centerClear = Number(settings?.frozenCenterClear);
  const centerRadius = Number(settings?.frozenCenterRadius);
  const tintStrength = Number(settings?.frozenTintStrength);
  const tintSaturate = Number(settings?.frozenTintSaturate);

  return {
    ...settings,
    // Skin-level frosting is independent of Ice Lab's freeze-power toggle.
    frozenEnabled: true,
    frozenOpacity: Math.min(1, (Number.isFinite(opacity) ? opacity : 0.74) * (0.32 + progress * 0.88)),
    frozenCenterClear: Math.max(
      0.02,
      (Number.isFinite(centerClear) ? centerClear : 0.9) * (1 - progress * 0.92)
    ),
    frozenCenterRadius: Math.max(
      0.14,
      (Number.isFinite(centerRadius) ? centerRadius : 0.62) * (1 - progress * 0.55)
    ),
    frozenTintStrength: Math.min(
      1,
      (Number.isFinite(tintStrength) ? tintStrength : 0.58) + progress * 0.18
    ),
    frozenTintSaturate: Math.min(
      3,
      (Number.isFinite(tintSaturate) ? tintSaturate : 1.45) + progress * 0.25
    ),
  };
}

/**
 * Frosty / Frozen Ice power VFX — frozen ice sprite on top of the die.
 * Uses per-face PNGs (no shared-sheet bleed from neighboring cubes).
 */
export default function IcePowerOverlay({
  value = 1,
  size = 64,
  radius = 4,
  skinId = "classic_white",
  settings: settingsProp,
  /** Allow ice silhouette drips outside the die face box. */
  allowOverflow = true,
  /** Earned skin level that should intensify the frost independently of power mode. */
  levelFrost = null,
  /**
   * In-game freeze / Score Freeze / Frozen Ice — always paint the cube overlay.
   * Lab `frozenEnabled: false` only gates Ice Lab / Sprite Lab preview toggles.
   * Callers must not pass freeze for fire-immune skins (see isFreezeOverlayImmuneSkin).
   */
  forceEnabled = false,
}) {
  void radius;
  const liveSettings = useIcePowerSettings();
  const base = settingsProp || liveSettings;
  const resolved = resolveIcePowerSettingsForSkin(base, skinId);
  const s = levelFrost ? getLevelFrostSettings(resolved, levelFrost) : resolved;

  if (!forceEnabled && s.frozenEnabled === false) return null;

  const face = getFrozenFaceSettings(s, value);
  const frozenOx = iceOffsetPx(face.offsetX, size);
  const frozenOy = iceOffsetPx(face.offsetY, size);
  const pad = allowOverflow ? iceOverlayBleedPx(size) : 0;
  const outer = size + pad * 2;
  const faceLayer = getIcePowerFaceLayerStyle(
    value,
    size,
    face.zoom ?? 1,
    frozenOx,
    frozenOy,
    pad
  );
  const opacity = Number.isFinite(Number(s.frozenOpacity))
    ? Math.min(1, Math.max(0, Number(s.frozenOpacity)))
    : DEFAULT_ICE_POWER_SETTINGS.frozenOpacity;
  const centerClear = Number.isFinite(Number(s.frozenCenterClear))
    ? Math.min(1, Math.max(0, Number(s.frozenCenterClear)))
    : DEFAULT_ICE_POWER_SETTINGS.frozenCenterClear;
  const centerRadius = Number.isFinite(Number(s.frozenCenterRadius))
    ? Math.min(1, Math.max(0, Number(s.frozenCenterRadius)))
    : DEFAULT_ICE_POWER_SETTINGS.frozenCenterRadius;
  const centerMask = getIceCenterClearMask(centerClear, centerRadius, size, pad);
  const blend = s.frozenBlend || "normal";
  const tintColor = s.frozenTintColor || "#9cc3ff";
  const tintStrength = Number.isFinite(Number(s.frozenTintStrength))
    ? Math.min(1, Math.max(0, Number(s.frozenTintStrength)))
    : DEFAULT_ICE_POWER_SETTINGS.frozenTintStrength;
  const tintBlend = s.frozenTintBlend || "color";
  const tintSaturate = Number.isFinite(Number(s.frozenTintSaturate))
    ? Math.min(3, Math.max(0.5, Number(s.frozenTintSaturate)))
    : DEFAULT_ICE_POWER_SETTINGS.frozenTintSaturate;
  const frozenUrl = icePowerFrozenFaceUrl(value);
  const outlineUrl = icePowerOutlineFaceUrl(value);
  const dripsUrl = icePowerOutlineDripsFaceUrl(value);
  const iceMask = faceMaskStyle(faceLayer, outlineUrl, centerMask);
  const iceFilter =
    tintSaturate === 1 ? undefined : `saturate(${tintSaturate}) contrast(1.04)`;

  return (
    <div
      className="absolute pointer-events-none z-[3] overflow-visible"
      style={{
        width: outer,
        height: outer,
        left: -pad,
        top: -pad,
      }}
      aria-hidden
    >
      {/* Isolated so cyan tint blends onto ice only — not the whole die. */}
      <div
        className="absolute inset-0"
        style={{
          isolation: "isolate",
          mixBlendMode: blend,
          opacity,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${assetUrl(frozenUrl)})`,
            ...faceLayer,
            ...iceMask,
            filter: iceFilter,
          }}
        />
        {tintStrength > 0.001 && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(145deg, ${tintColor} 0%, #bae6fd 42%, #38bdf8 100%)`,
                ...iceMask,
                mixBlendMode: tintBlend,
                opacity: tintStrength,
              }}
            />
            {/* Edge-weighted lift — rim frost reads cyan; mid stays clearer for pips. */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 50% 48%, transparent 0%, ${tintColor}44 48%, #38bdf8 78%, #0ea5e9 100%)`,
                ...iceMask,
                mixBlendMode: "soft-light",
                opacity: Math.min(0.38, tintStrength * 0.34),
              }}
            />
          </>
        )}
      </div>
      {allowOverflow && (
        <div
          className="absolute inset-0"
          style={{
            // Edge-only drip sheen (mask is rim/drips — not the face fill).
            background:
              "radial-gradient(ellipse at 50% 48%, rgba(255,255,255,0.12) 0%, rgba(186,230,253,0.38) 48%, rgba(56,189,248,0.58) 78%, rgba(14,165,233,0.34) 100%)",
            ...faceMaskStyle(faceLayer, dripsUrl),
            mixBlendMode: "screen",
            opacity: Math.min(0.85, opacity * 0.75 + 0.06),
          }}
        />
      )}
    </div>
  );
}
