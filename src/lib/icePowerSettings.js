/**
 * Frosty / Frozen Ice power overlay tuning.
 * Layer zooms, offsets, opacities, and blend modes for the shape mask,
 * dripping frame, and frozen cubes. Saved per device in localStorage.
 */
const STORAGE_KEY = "dice10k_ice_power_settings_v1";

export const ICE_BLEND_MODES = [
  "multiply",
  "screen",
  "soft-light",
  "overlay",
  "normal",
  "lighten",
  "darken",
];

/** Defaults match the original IcePowerOverlay hardcodes. */
export const DEFAULT_ICE_POWER_SETTINGS = {
  // Shape mask — clips the die body to the organic ice silhouette
  shapeEnabled: true,
  shapeZoom: 1.42,
  shapeOffsetX: 0, // % of die size
  shapeOffsetY: 0,

  // Dripping frame (ice_power_shape.png, multiply keys white)
  frameEnabled: true,
  frameZoom: 1.28,
  frameOpacity: 0.98,
  frameOffsetX: 0,
  frameOffsetY: 0,
  frameBlend: "multiply",
  frameDripPad: 0.1, // fraction of die size

  // Frozen ice cubes (ice_power_frozen.png, screen keys black)
  frozenEnabled: true,
  frozenZoom: 1.32,
  frozenOpacity: 0.9,
  frozenOffsetX: 0,
  frozenOffsetY: 0,
  frozenBlend: "screen",

  // Frost sheen glow on top of frozen layer
  sheenEnabled: true,
  sheenOpacity: 0.75,

  // Lab preview only (ignored in-game)
  labShowAll: true,
  labFace: 1, // 1–6
  labDieSize: 88,
};

const listeners = new Set();

export function loadIcePowerSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ICE_POWER_SETTINGS };
    return { ...DEFAULT_ICE_POWER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ICE_POWER_SETTINGS };
  }
}

export function saveIcePowerSettings(settings) {
  const next = { ...DEFAULT_ICE_POWER_SETTINGS, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  for (const cb of listeners) cb(next);
  return next;
}

export function resetIcePowerSettings() {
  return saveIcePowerSettings({ ...DEFAULT_ICE_POWER_SETTINGS });
}

export function subscribeIcePowerSettings(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Convert % of die size (−50…50) to pixels. */
export function iceOffsetPx(percent, size) {
  return ((Number(percent) || 0) / 100) * size;
}
