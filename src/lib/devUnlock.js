import { DICE_SKINS } from "./shopCatalog";

export const DEV_UNLOCK_STORAGE_KEY = "dice10k_dev_unlock_all";

/** Set false before App Store release. */
export const FORCE_UNLOCK_ALL = true;

/** All production + experimental dice ids */
export const ALL_DICE_SKIN_IDS = DICE_SKINS.map((s) => s.id);

/** True when FORCE_UNLOCK_ALL, in Vite dev, VITE_UNLOCK_ALL_DICE=true, or localStorage flag. */
export function isDevUnlockAll() {
  if (FORCE_UNLOCK_ALL) return true;
  if (import.meta.env.VITE_UNLOCK_ALL_DICE === "true") return true;
  if (import.meta.env.DEV) return true;
  try {
    return localStorage.getItem(DEV_UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDevUnlockAll(enabled) {
  try {
    if (enabled) localStorage.setItem(DEV_UNLOCK_STORAGE_KEY, "1");
    else localStorage.removeItem(DEV_UNLOCK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
