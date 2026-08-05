import { LOCAL_SKIN_MAX_LEVEL } from "./progression";

/**
 * Visual progression hooks for skin levels.
 *
 * The level itself is earned from play-time XP in progression.js. This table
 * only decides which Sprite Lab effect a skin uses when that level is rendered.
 * Skins without an entry still show their level in the shop and are ready for
 * a future lab effect.
 */
const FROST_VISUAL = {
  effect: "frost",
  title: "Glacier progression",
  description: "Higher levels add more frost and gradually hide the face.",
  levelOneLabel: "Fresh ice",
  maxLevelLabel: "Whiteout frost",
};

export const SKIN_LEVEL_VISUALS = {
  ice: FROST_VISUAL,
  teal_crackle: FROST_VISUAL,
  aquamarine_light: FROST_VISUAL,
  snow_globe: FROST_VISUAL,
};

export function clampSkinLevel(level = 1) {
  const parsed = Math.floor(Number(level));
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(LOCAL_SKIN_MAX_LEVEL, Math.max(1, parsed));
}

export function getSkinLevelVisual(skinId) {
  return SKIN_LEVEL_VISUALS[skinId] ?? null;
}

export function getSkinLevelProgress(level = 1) {
  const current = clampSkinLevel(level);
  return (current - 1) / Math.max(1, LOCAL_SKIN_MAX_LEVEL - 1);
}
