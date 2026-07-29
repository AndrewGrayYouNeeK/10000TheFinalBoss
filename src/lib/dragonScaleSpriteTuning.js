/**
 * Dragon Scale sprite alignment — locked from /sprite-lab/dragon_scale.
 * Saved baseline; do not edit unless re-tuning in Sprite Lab.
 */
export const DRAGON_SCALE_SPRITE_TUNING = {
  spriteSheetSize: { width: 1024, height: 559 },
  spriteCrop: { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 },
};

/** Per-face X nudge overrides (@ any die render size). Null = use default face nudge. */
export function getDragonScaleSpriteXNudge(value, size) {
  const m = {
    2: (s) => s * 0.015,
    3: (s) => s * 0.015,
    5: (s) => s * 0.01,
    6: (s) => s * 0.015,
  };
  return m[value]?.(size) ?? null;
}

/** Per-face Y nudge overrides (@ any die render size). Null = use default face nudge. */
export function getDragonScaleSpriteYNudge(value, size) {
  const m = {
    5: (s) => -s * 0.025,
  };
  return m[value]?.(size) ?? null;
}
