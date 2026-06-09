import { EXPERIMENTAL_DICE_IDS } from "./experimentalDice";
import { ALL_DICE_SKIN_IDS, isDevUnlockAll } from "./devUnlock";

export const PREVIEW_SKIN_IDS = EXPERIMENTAL_DICE_IDS;

export function isPreviewSkin(skinId) {
  return PREVIEW_SKIN_IDS.includes(skinId);
}

/** Custom dice are not auto-owned — unlock via mystery boxes or rewards. Dev mode unlocks all. */
export function withPreviewOwned(ownedSkins = []) {
  if (isDevUnlockAll()) return ALL_DICE_SKIN_IDS;
  return ownedSkins.length ? ownedSkins : ["classic_white"];
}
