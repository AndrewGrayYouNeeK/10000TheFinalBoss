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

const KEY = VIDEO_KEYS.BLUE_GEL_POWER;

/** Warm IndexedDB cache on app start / first die render. */
export function preloadBlueGelPowerVideo() {
  return preloadLocalVideo(KEY);
}

/** Returns cached blob URL synchronously after preload/save. */
export function getCachedBlueGelPowerVideoObjectUrl() {
  return getCachedLocalVideoObjectUrl(KEY);
}

export async function getBlueGelPowerVideoObjectUrl() {
  return getLocalVideoObjectUrl(KEY);
}

export async function hasBlueGelPowerVideo() {
  return hasLocalVideo(KEY);
}

export async function saveBlueGelPowerVideo(file) {
  return saveLocalVideo(KEY, file);
}

export async function clearBlueGelPowerVideo() {
  return clearLocalVideo(KEY);
}

export function subscribeBlueGelPowerVideo(listener) {
  return subscribeLocalVideo(KEY, listener);
}
