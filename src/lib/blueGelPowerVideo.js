import {
  VIDEO_KEYS,
  VIDEO_FALLBACK_PATHS,
  clearLocalVideo,
  getCachedLocalVideoObjectUrl,
  getLocalVideoObjectUrl,
  hasLocalVideo,
  resolveVideoSrc,
  resolveVideoSrcSync,
  saveLocalVideo,
  subscribeLocalVideo,
} from "@/lib/localVideoStore";

const KEY = VIDEO_KEYS.BLUE_GEL_POWER;
const INTRO_KEY = VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO;

/** Warm IndexedDB cache on app start / first die render. */
export function preloadBlueGelPowerVideo() {
  return resolveVideoSrc(KEY);
}

/** Returns cached blob URL synchronously after preload/save (or catalog fallback). */
export function getCachedBlueGelPowerVideoObjectUrl() {
  return resolveVideoSrcSync(KEY);
}

export async function getBlueGelPowerVideoObjectUrl() {
  return resolveVideoSrc(KEY);
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

/** Intro swim-in — local upload only (no catalog fallback). */
export function preloadSharkBiteIntroVideo() {
  return getLocalVideoObjectUrl(INTRO_KEY);
}

export function getCachedSharkBiteIntroVideoObjectUrl() {
  return getCachedLocalVideoObjectUrl(INTRO_KEY);
}

export async function hasSharkBiteIntroVideo() {
  return hasLocalVideo(INTRO_KEY);
}

export function subscribeSharkBiteIntroVideo(listener) {
  return subscribeLocalVideo(INTRO_KEY, listener);
}

/** User-uploaded chomp on this device (no catalog). */
export function hasLocalChompVideoSync() {
  return !!getCachedLocalVideoObjectUrl(KEY);
}

/** Chomp clip ready (upload or catalog fallback). */
export function hasSharkBiteChompVideoSync() {
  return hasLocalChompVideoSync() || !!VIDEO_FALLBACK_PATHS[KEY];
}

/** Intro swim-in uploaded on this device (no catalog fallback). */
export function hasSharkBiteIntroVideoSync() {
  return !!getCachedSharkBiteIntroVideoObjectUrl();
}

/** Both beats uploaded — intro then chomp only, never SVG or catalog stacking. */
export function hasFullSharkBiteVideoSequenceSync() {
  return hasSharkBiteIntroVideoSync() && hasLocalChompVideoSync();
}

/**
 * Chomp URL for Shark Bite playback — local upload wins.
 * Catalog fallback is used only when this device has no chomp upload.
 */
export async function resolveChompVideoForSharkBite() {
  const local = await getLocalVideoObjectUrl(KEY);
  if (local) return local;
  return VIDEO_FALLBACK_PATHS[KEY] ?? null;
}

/** Fullscreen video path — skip in-die SVG feast when true. */
export function prefersSharkBiteVideoOverSvg() {
  return hasSharkBiteChompVideoSync() || hasSharkBiteIntroVideoSync();
}
