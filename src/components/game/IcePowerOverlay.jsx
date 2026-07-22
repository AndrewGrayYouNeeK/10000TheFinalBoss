import React from "react";
import {
  loadIcePowerSettings,
  subscribeIcePowerSettings,
  iceOffsetPx,
} from "@/lib/icePowerSettings";

/** Shape mask / dripping frame — 3×2 face grid (white interiors, black borders). */
export const ICE_POWER_SHAPE_URL = "/assets/ice_power_shape.png";
/** Frozen ice cubes — 3×2 face grid on black (keyed out via screen blend). */
export const ICE_POWER_FROZEN_URL = "/assets/ice_power_frozen.png";

const COLS = 3;
const ROWS = 2;
/** Source sheet size (px). Cells are slightly taller than wide. */
const SHEET_W = 1024;
const SHEET_H = 796;
const CELL_ASPECT = SHEET_W / COLS / (SHEET_H / ROWS);

export function useIcePowerSettings() {
  const [settings, setSettings] = React.useState(() => loadIcePowerSettings());
  React.useEffect(() => subscribeIcePowerSettings(setSettings), []);
  return settings;
}

/**
 * Centered 3×2 cell crop — same idea as matrix / diamond-cut power grids.
 * `zoom` > 1 crops into the face (past thick borders).
 * `offsetX` / `offsetY` are pixels nudging the sheet.
 */
export function getIcePowerFaceLayerStyle(value, size, zoom = 1.4, offsetX = 0, offsetY = 0) {
  const col = ((value || 1) - 1) % COLS;
  const row = Math.floor(((value || 1) - 1) / COLS);
  const cellW = size * zoom;
  const cellH = (size * zoom) / CELL_ASPECT;
  const sheetW = COLS * cellW;
  const sheetH = ROWS * cellH;
  const left = size / 2 - (col + 0.5) * cellW + offsetX;
  const top = size / 2 - (row + 0.5) * cellH + offsetY;
  return {
    backgroundSize: `${sheetW}px ${sheetH}px`,
    backgroundPosition: `${left}px ${top}px`,
    backgroundRepeat: "no-repeat",
  };
}

/** CSS mask so the die silhouette follows the organic white face (not the squircle). */
export function getIcePowerShapeMaskStyle(value, size, settings) {
  const s = settings || loadIcePowerSettings();
  const zoom = s.shapeZoom ?? 1.42;
  const ox = iceOffsetPx(s.shapeOffsetX, size);
  const oy = iceOffsetPx(s.shapeOffsetY, size);
  const layer = getIcePowerFaceLayerStyle(value, size, zoom, ox, oy);
  return {
    WebkitMaskImage: `url(${ICE_POWER_SHAPE_URL})`,
    maskImage: `url(${ICE_POWER_SHAPE_URL})`,
    WebkitMaskSize: layer.backgroundSize,
    maskSize: layer.backgroundSize,
    WebkitMaskPosition: layer.backgroundPosition,
    maskPosition: layer.backgroundPosition,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };
}

/**
 * Frosty / Frozen Ice power VFX.
 * Layering: regular die skin (masked) → dripping frame → frozen ice on top.
 *
 * - `frame`: dripping black border sibling (white keys out via multiply; can extend past die)
 * - `frozen`: ice cubes on the die face (black keys out via screen) + frost sheen
 * - `all`: both stacked in one box
 */
export default function IcePowerOverlay({
  value = 1,
  size = 64,
  radius = 4,
  layer = "all",
  settings: settingsProp,
}) {
  const liveSettings = useIcePowerSettings();
  const s = settingsProp || liveSettings;

  const showFrame =
    (layer === "all" || layer === "frame") && s.frameEnabled !== false;
  const showFrozen =
    (layer === "all" || layer === "frozen") && s.frozenEnabled !== false;
  const showSheen = showFrozen && s.sheenEnabled !== false;

  const dripFrac = Math.max(0, Math.min(0.35, Number(s.frameDripPad) || 0));
  const dripPad = showFrame ? Math.round(size * dripFrac) : 0;
  const boxSize = size + dripPad * 2;

  const frameOx = iceOffsetPx(s.frameOffsetX, boxSize);
  const frameOy = iceOffsetPx(s.frameOffsetY, boxSize);
  const frozenOx = iceOffsetPx(s.frozenOffsetX, size);
  const frozenOy = iceOffsetPx(s.frozenOffsetY, size);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: -dripPad,
        left: -dripPad,
        width: boxSize,
        height: boxSize,
      }}
    >
      {showFrame && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${ICE_POWER_SHAPE_URL})`,
            ...getIcePowerFaceLayerStyle(value, boxSize, s.frameZoom ?? 1.28, frameOx, frameOy),
            mixBlendMode: s.frameBlend || "multiply",
            opacity: s.frameOpacity ?? 0.98,
          }}
        />
      )}

      {showFrozen && (
        <>
          <div
            className="absolute"
            style={{
              top: dripPad,
              left: dripPad,
              width: size,
              height: size,
              borderRadius: radius,
              backgroundImage: `url(${ICE_POWER_FROZEN_URL})`,
              ...getIcePowerFaceLayerStyle(
                value,
                size,
                s.frozenZoom ?? 1.32,
                frozenOx,
                frozenOy
              ),
              mixBlendMode: s.frozenBlend || "screen",
              opacity: s.frozenOpacity ?? 0.9,
            }}
          />
          {showSheen && (
            <div
              className="absolute"
              style={{
                top: dripPad,
                left: dripPad,
                width: size,
                height: size,
                borderRadius: radius,
                boxShadow: `inset 0 0 ${Math.round(size * 0.22)}px rgba(186,230,253,0.5), 0 0 ${Math.round(size * 0.14)}px rgba(125,211,252,0.4)`,
                background:
                  "radial-gradient(ellipse at 32% 28%, rgba(255,255,255,0.4) 0%, transparent 48%)",
                mixBlendMode: "soft-light",
                opacity: s.sheenOpacity ?? 0.75,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
