/** Skins that show fish inside the dice (Angelfish / aquarium family). */
export const FISH_DICE_SKINS = ["blue_gel", "aquamarine", "aquamarine_light"];

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
