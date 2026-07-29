/** Skins that show fish inside the dice (Angelfish / aquarium family). */
export const FISH_DICE_SKINS = ["blue_gel", "aquamarine", "aquamarine_light"];

/** Per-die big-fish variant index for Blue Gel tray previews (face 1 = angelfish in pip area). */
export const BLUE_GEL_TRAY_FISH_VARIANTS = [7, 1, 6, 3, 1, 4];
export const BLUE_GEL_TRAY_FISH_SCALES = [2.1, 1.15, 1.15, 1.15, 2.0, 1.15];

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

export function getPlayerDiceSkinId(state, playerIndex) {
  const player = state?.players?.[playerIndex];
  if (!player) return null;
  return player.trueSkinId || player.skinId || null;
}

export function isFishDicePlayer(state, playerIndex) {
  return isFishDiceSkin(getPlayerDiceSkinId(state, playerIndex));
}
