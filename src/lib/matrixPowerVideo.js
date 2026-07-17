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

const KEY = VIDEO_KEYS.MATRIX_POWER;

/** Warm IndexedDB cache on app start / first die render. */
export function preloadMatrixPowerVideo() {
  return preloadLocalVideo(KEY);
}

/** Returns cached blob URL synchronously after preload/save. */
export function getCachedMatrixPowerVideoObjectUrl() {
  return getCachedLocalVideoObjectUrl(KEY);
}

export async function getMatrixPowerVideoObjectUrl() {
  return getLocalVideoObjectUrl(KEY);
}

export async function hasMatrixPowerVideo() {
  return hasLocalVideo(KEY);
}

export async function saveMatrixPowerVideo(file) {
  return saveLocalVideo(KEY, file);
}

export async function clearMatrixPowerVideo() {
  return clearLocalVideo(KEY);
}

export function subscribeMatrixPowerVideo(listener) {
  return subscribeLocalVideo(KEY, listener);
}
