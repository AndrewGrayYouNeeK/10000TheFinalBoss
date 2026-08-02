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
 * Rules (side bite → forward swallow):
 * - Chomp beat plays first, rotated sideways; dice vanish when its jaws close.
 * - Forward beat plays second. An uploaded approach clip wins; otherwise the
 *   shipped shark clip is replayed upright so it swims directly at the screen.
 * - Intro alone with no catalog/chomp syncs the dice vanish as a last resort.
 * - Nothing available → SVG fallback.
 *
 * @returns {Array<{ id: string, videoKey?: string, source: 'catalog'|'local'|'svg', syncChomp: boolean, presentationSlot?: 'chomp'|'intro' }>}
 */
export function buildSharkBiteQueueForAvailability(hasIntro, hasChompUpload) {
  const catalog = getCatalogChompVideoUrl();

  if (!catalog && !hasIntro && !hasChompUpload) {
    return [{ id: "svg", source: "svg", syncChomp: false }];
  }

  const chompBeat = hasChompUpload
    ? {
      id: "chomp",
      videoKey: KEY,
      source: "local",
      syncChomp: true,
      presentationSlot: "chomp",
    }
    : catalog
      ? {
      id: "catalog",
      videoKey: KEY,
      source: "catalog",
      syncChomp: true,
      presentationSlot: "chomp",
    }
      : null;

  if (!chompBeat) {
    return hasIntro
      ? [{
          id: "intro",
          videoKey: INTRO_KEY,
          source: "local",
          syncChomp: true,
          presentationSlot: "intro",
        }]
      : [{ id: "svg", source: "svg", syncChomp: false }];
  }

  const forwardBeat = hasIntro
    ? {
        id: "forward",
        videoKey: INTRO_KEY,
        source: "local",
        syncChomp: false,
        presentationSlot: "intro",
      }
    : {
        id: "forward-catalog",
        videoKey: KEY,
        // The timed head-on section below is calibrated to the shipped clip,
        // not to an arbitrary user-uploaded sideways bite.
        source: catalog ? "catalog" : chompBeat.source,
        syncChomp: false,
        presentationSlot: "intro",
      };

  return [chompBeat, forwardBeat];
}

/**
 * Ordered fullscreen beats for SharkBiteScreenFX — strictly sequential, no overlap.
 *
 * @returns {Promise<Array<{ id: string, videoKey?: string, source: 'catalog'|'local'|'svg', syncChomp: boolean, presentationSlot?: 'chomp'|'intro' }>>}
 */
export async function buildSharkBitePhaseQueue() {
  const hasIntro =
    hasSharkBiteIntroVideoSync() || (await hasSharkBiteIntroVideo());
  const hasChompUpload = hasLocalChompVideoSync() || (await hasLocalVideo(KEY));
  return buildSharkBiteQueueForAvailability(hasIntro, hasChompUpload);
}

/** Sync queue builder — uses warm cache only (may miss cold IndexedDB). */
export function buildSharkBitePhaseQueueSync() {
  return buildSharkBiteQueueForAvailability(
    hasSharkBiteIntroVideoSync(),
    hasLocalChompVideoSync()
  );
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
