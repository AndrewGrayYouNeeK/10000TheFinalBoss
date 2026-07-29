import {
  VIDEO_KEYS,
  clearLocalVideo,
  getCachedLocalVideoObjectUrl,
  getLocalVideoObjectUrl,
  hasLocalVideo,
  preloadLocalVideo,
  saveLocalVideo,
  subscribeLocalVideo,
} from "@/lib/localVideoStore";

const KEY = VIDEO_KEYS.DIAMOND_CUT_POWER;

/** Warm IndexedDB cache on app start / first die render. */
export function preloadDiamondCutPowerVideo() {
  return preloadLocalVideo(KEY);
}

/** Returns cached blob URL synchronously after preload/save. */
export function getCachedDiamondCutPowerVideoObjectUrl() {
  return getCachedLocalVideoObjectUrl(KEY);
}

export async function getDiamondCutPowerVideoObjectUrl() {
  return getLocalVideoObjectUrl(KEY);
}

export async function hasDiamondCutPowerVideo() {
  return hasLocalVideo(KEY);
}

export async function saveDiamondCutPowerVideo(file) {
  return saveLocalVideo(KEY, file);
}

export async function clearDiamondCutPowerVideo() {
  return clearLocalVideo(KEY);
}

export function subscribeDiamondCutPowerVideo(listener) {
  return subscribeLocalVideo(KEY, listener);
}
