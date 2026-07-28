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

/** Both beats uploaded — intro swim-in plus chomp on this device. */
export function hasFullSharkBiteVideoSequenceSync() {
  return hasSharkBiteIntroVideoSync() && hasLocalChompVideoSync();
}

/** Shipped catalog chomp — always the original shark bite clip. */
export function getCatalogChompVideoUrl() {
  return VIDEO_FALLBACK_PATHS[KEY] ?? null;
}

/** User upload in intro and/or chomp slot (excludes catalog-only playback). */
export function hasUploadedSharkBiteBeatSync() {
  return hasSharkBiteIntroVideoSync() || hasLocalChompVideoSync();
}

/**
 * Build the ordered shark-bite beat list.
 *
 * Rules:
 * - Any upload → catalog chomp plays first (full), then optional intro, then optional chomp upload.
 * - Dice vanish on the chomp-sync beat: uploaded chomp if present, else catalog.
 * - No uploads → catalog chomp alone, or SVG when no catalog file.
 *
 * @returns {Array<{ id: string, videoKey?: string, source: 'catalog'|'local'|'svg', syncChomp: boolean }>}
 */
function buildQueue(hasIntro, hasChompUpload) {
  const catalog = getCatalogChompVideoUrl();
  const hasUpload = hasIntro || hasChompUpload;

  if (!catalog && !hasUpload) {
    return [{ id: "svg", source: "svg", syncChomp: false }];
  }

  if (!hasUpload) {
    return [
      {
        id: "catalog",
        videoKey: KEY,
        source: "catalog",
        syncChomp: true,
      },
    ];
  }

  const queue = [];
  if (catalog) {
    queue.push({
      id: "catalog",
      videoKey: KEY,
      source: "catalog",
      syncChomp: !hasChompUpload,
    });
  }
  if (hasIntro) {
    queue.push({
      id: "intro",
      videoKey: INTRO_KEY,
      source: "local",
      syncChomp: !catalog && !hasChompUpload,
    });
  }
  if (hasChompUpload) {
    queue.push({
      id: "chomp",
      videoKey: KEY,
      source: "local",
      syncChomp: true,
    });
  }
  return queue.length ? queue : [{ id: "svg", source: "svg", syncChomp: false }];
}

/**
 * Ordered fullscreen beats for SharkBiteScreenFX — strictly sequential, no overlap.
 *
 * @returns {Promise<Array<{ id: string, videoKey?: string, source: 'catalog'|'local'|'svg', syncChomp: boolean }>>}
 */
export async function buildSharkBitePhaseQueue() {
  const hasIntro =
    hasSharkBiteIntroVideoSync() || (await hasSharkBiteIntroVideo());
  const hasChompUpload = hasLocalChompVideoSync() || (await hasLocalVideo(KEY));
  return buildQueue(hasIntro, hasChompUpload);
}

/** Sync queue builder — uses warm cache only (may miss cold IndexedDB). */
export function buildSharkBitePhaseQueueSync() {
  return buildQueue(hasSharkBiteIntroVideoSync(), hasLocalChompVideoSync());
}

/**
 * Chomp URL for single-clip callers — local upload wins.
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
