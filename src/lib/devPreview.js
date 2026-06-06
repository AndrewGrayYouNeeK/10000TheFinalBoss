import { DICE_SKINS, FELT_COLORS } from "@/lib/shopCatalog";

/** localStorage key — set to "off" to disable preview; delete key or set "on" to re-enable */
export const DEV_PREVIEW_KEY = "dice10k_dev_preview";

const ALL_SKIN_IDS = DICE_SKINS.map((s) => s.id);
const ALL_FELT_IDS = FELT_COLORS.map((f) => f.id);

export function isDevPreviewActive() {
  try {
    return localStorage.getItem(DEV_PREVIEW_KEY) !== "off";
  } catch {
    return false;
  }
}

export function setDevPreviewEnabled(enabled) {
  try {
    localStorage.setItem(DEV_PREVIEW_KEY, enabled ? "on" : "off");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("devPreviewChange"));
}

export function getPreviewOwnedSkins(ownedSkins = []) {
  if (!isDevPreviewActive()) return ownedSkins;
  return [...new Set([...ownedSkins, ...ALL_SKIN_IDS])];
}

export function getPreviewOwnedFelts(ownedFelts = []) {
  if (!isDevPreviewActive()) return ownedFelts;
  return [...new Set([...ownedFelts, ...ALL_FELT_IDS])];
}

export function getPreviewCoins(coins = 0) {
  if (!isDevPreviewActive()) return coins;
  return Math.max(coins, 999_999);
}

export function isPreviewTierUnlocked() {
  return isDevPreviewActive();
}
