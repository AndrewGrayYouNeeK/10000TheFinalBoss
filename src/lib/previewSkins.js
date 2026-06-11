import { EXPERIMENTAL_DICE_IDS } from "./experimentalDice";
import { ALL_DICE_SKIN_IDS, isDevUnlockAll } from "./devUnlock";

/** Lab-only skins — free to try in preview, not permanent shop dice */
export const SHOP_PREVIEW_SKIN_IDS = ["cyber_neon"];

export function isCustomDiceSkin(skinId) {
  return EXPERIMENTAL_DICE_IDS.includes(skinId);
}

export function isPreviewSkin(skinId) {
  return SHOP_PREVIEW_SKIN_IDS.includes(skinId);
}

/** Profile-owned skins; custom dice unlock permanently via Mystery Boxes. */
export function withPreviewOwned(ownedSkins = []) {
  if (isDevUnlockAll()) return ALL_DICE_SKIN_IDS;
  const base = ownedSkins.length ? ownedSkins : ["classic_white"];
  return base;
}
