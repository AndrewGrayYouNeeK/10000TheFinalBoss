/**
 * Prison Dice (paper) sprite alignment — locked from /sprite-lab/paper.
 * Saved baseline; do not edit unless re-tuning in Sprite Lab.
 */
const REF = 64;

function refPx(px, size) {
  return px * (size / REF);
}

export const PAPER_SPRITE_TUNING = {
  spriteSheetSize: { width: 1024, height: 547 },
  spriteCrop: { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 },
};

/** Per-face X nudge for Prison Dice (@ any die render size). */
export function getPaperSpriteXNudge(value, size) {
  const m = {
    1: () => refPx(-2, size),
    2: () => size * 0.01 + refPx(-11, size),
    3: () => size * 0.01 + refPx(-18, size),
    4: () => refPx(-3, size),
    5: () => size * 0.01 + refPx(-12, size),
    6: () => size * 0.01 + refPx(-19, size),
  };
  return m[value]?.() ?? null;
}

/** Per-face Y nudge for Prison Dice (@ any die render size). */
export function getPaperSpriteYNudge(value, size) {
  const m = {
    1: () => -size * 0.015 + refPx(2, size),
    2: () => -size * 0.015 + refPx(3, size),
    3: () => -size * 0.02 + refPx(3, size),
    4: () => -size * 0.04 + refPx(-3, size),
    5: () => -size * 0.04 + refPx(-3, size),
    6: () => -size * 0.04 + refPx(-4, size),
  };
  return m[value]?.() ?? null;
}
