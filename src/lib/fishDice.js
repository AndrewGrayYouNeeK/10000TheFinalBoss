/** Skins that show fish inside the dice (aquarium family). */
export const FISH_DICE_SKINS = ["shark_gel", "aquamarine", "aquamarine_light"];

/** Per-die big-fish variant index for Angelfish tray — one species per face. */
export const BLUE_GEL_TRAY_FISH_VARIANTS = [6, 7, 0, 1, 2, 3];
// The first two faces showcase the silver and blue angelfish variants.
export const BLUE_GEL_TRAY_FISH_SCALES = [2.1, 1.0, 1.0, 1.0, 1.0, 1.0];

export function getBlueGelTrayFishProps(dieIndex) {
  const idx = dieIndex % BLUE_GEL_TRAY_FISH_VARIANTS.length;
  return {
    bigFishVariantIndex: BLUE_GEL_TRAY_FISH_VARIANTS[idx],
    bigFishExtraScale: BLUE_GEL_TRAY_FISH_SCALES[idx],
  };
}

export function isFishDiceSkin(skinId) {
  return FISH_DICE_SKINS.includes(skinId);
}

/** Tray / body skin — Ghost keeps spectral `skinId`; disguise is not visual. */
export function getPlayerDiceSkinId(state, playerIndex) {
  const player = state?.players?.[playerIndex];
  if (!player) return null;
  return player.skinId || null;
}

export function isFishDicePlayer(state, playerIndex) {
  return isFishDiceSkin(getPlayerDiceSkinId(state, playerIndex));
}
