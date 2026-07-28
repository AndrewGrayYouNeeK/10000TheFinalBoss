import { getBossDefinition, STORY_LADDER_IDS } from "./storyBosses";
import { getFishermanAvatarLoopVideoStyle } from "./fishermanAvatarLoopSettings";
import {
  getLocalVideoBlob,
  getLocalVideoObjectUrl,
  preloadLocalVideo,
  putLocalVideoBlob,
  VIDEO_FALLBACK_PATHS,
  VIDEO_KEYS,
} from "./localVideoStore";

/** @typedef {"intro" | "win" | "avatar"} StoryBossVideoSlot */

export function storyBossIntroKey(bossId) {
  return `story_boss_intro_${bossId}`;
}

export function storyBossWinKey(bossId) {
  return `story_boss_win_${bossId}`;
}

export function storyBossAvatarKey(bossId) {
  return `story_boss_avatar_${bossId}`;
}

export function storyBossPrimaryKey(bossId, slot) {
  if (slot === "intro") return storyBossIntroKey(bossId);
  if (slot === "win") return storyBossWinKey(bossId);
  return storyBossAvatarKey(bossId);
}

/** Resolve boss id when videoKey is an avatar loop slot (e.g. story_boss_avatar_fisherman). */
export function getStoryBossIdForAvatarKey(videoKey) {
  if (!videoKey) return null;
  for (const bossId of STORY_LADDER_IDS) {
    if (videoKey === storyBossAvatarKey(bossId)) return bossId;
  }
  return null;
}

/** Avatar loop object-fit during story fights and upload previews. */
export function getStoryBossAvatarLoopFit(bossId) {
  if (bossId === "fisherman") return "cover";
  return "contain";
}

/** Avatar loop crop anchor — pairs with getStoryBossAvatarLoopFit. */
export function getStoryBossAvatarLoopObjectPosition() {
  return "center center";
}

/** Full inline video style for story avatar loops (object-fit, crop, pan). */
export function getStoryBossAvatarLoopVideoStyle(bossId) {
  if (bossId === "fisherman") return getFishermanAvatarLoopVideoStyle();
  return {
    objectFit: getStoryBossAvatarLoopFit(bossId),
    objectPosition: getStoryBossAvatarLoopObjectPosition(bossId),
    maxWidth: "none",
    maxHeight: "none",
  };
}

/** Seconds trimmed from the start at playback — upload file is unchanged. */
export function getStoryBossVideoStartOffset(bossId, slot) {
  if (bossId === "neo" && slot === "intro") return 3;
  return 0;
}

/**
 * Source-file timestamp where cutscene audio mutes (0 = full track).
 * Neo: after "your simulation ends here" — BGM in the upload continues past the line.
 */
export function getStoryBossVideoMuteAtSeconds(bossId, slot) {
  if (bossId === "neo" && slot === "intro") return 12;
  return 0;
}

/** Cutscenes with no embedded audio — plays fully silent from the first frame. */
export function isStoryBossVideoSilent(bossId, slot) {
  return bossId === "fisherman" && slot === "win";
}

export function getStoryBossVideoStartOffsetForKey(videoKey) {
  if (!videoKey) return 0;
  for (const bossId of STORY_LADDER_IDS) {
    if (videoKey === storyBossIntroKey(bossId)) {
      return getStoryBossVideoStartOffset(bossId, "intro");
    }
  }
  return 0;
}

export function getStoryBossVideoMuteAtSecondsForKey(videoKey) {
  if (!videoKey) return 0;
  for (const bossId of STORY_LADDER_IDS) {
    if (videoKey === storyBossIntroKey(bossId)) {
      return getStoryBossVideoMuteAtSeconds(bossId, "intro");
    }
  }
  return 0;
}

/**
 * Global fallback key after per-boss upload is missing.
 * Intro is per-boss only — never reuse Story hub / Matrix / other boss clips.
 * Avatar loops are resolved per boss (Neo has its own chain — never the 10,000 sign catalog).
 */
export function getStoryBossVideoGlobalKey(bossId, slot) {
  if (slot === "win") {
    if (bossId === "gq") return null;
    return VIDEO_KEYS.STORY_BOSS_WIN;
  }
  return null;
}

/** Bundled sign clips — never use as story fight loop fallbacks. */
const STORY_SIGN_CATALOG_PATHS = new Set(
  [
    VIDEO_FALLBACK_PATHS[VIDEO_KEYS.GAMEPLAY_BILLBOARD],
    VIDEO_FALLBACK_PATHS[VIDEO_KEYS.GAMEPLAY_LOOP],
  ].filter(Boolean)
);

/** Neo story fight panel — avatar + legacy gameplay_loop only (never the 10,000 sign slot). */
const NEO_STORY_LOOP_KEYS = [storyBossAvatarKey("neo"), VIDEO_KEYS.GAMEPLAY_LOOP];

let neoStoryLoopMigrationPromise = null;

/** Copy legacy gameplay_loop upload into Neo avatar slot once (never from sign/billboard). */
export function migrateNeoStoryAvatarLoop() {
  if (!neoStoryLoopMigrationPromise) {
    neoStoryLoopMigrationPromise = (async () => {
      const avatarKey = storyBossAvatarKey("neo");
      if (await getLocalVideoBlob(avatarKey)) return;
      const legacy = await getLocalVideoBlob(VIDEO_KEYS.GAMEPLAY_LOOP);
      if (legacy) await putLocalVideoBlob(avatarKey, legacy);
    })();
  }
  return neoStoryLoopMigrationPromise;
}

export function getStoryBossVideoWatchKeys(bossId, slot) {
  const keys = new Set();
  if (!bossId) return [];
  keys.add(storyBossPrimaryKey(bossId, slot));
  if (slot === "avatar" && bossId === "neo") {
    NEO_STORY_LOOP_KEYS.forEach((k) => keys.add(k));
    return [...keys];
  }
  if (slot === "avatar") {
    keys.add(storyBossIntroKey(bossId));
  }
  const globalKey = getStoryBossVideoGlobalKey(bossId, slot);
  if (globalKey) keys.add(globalKey);
  return [...keys];
}

async function firstLocalVideoSrc(keys) {
  for (const key of keys) {
    const local = await getLocalVideoObjectUrl(key);
    if (local) return { src: local, hasLocal: true };
  }
  return { src: null, hasLocal: false };
}

async function resolveNeoStoryFightLoop() {
  await migrateNeoStoryAvatarLoop();
  return firstLocalVideoSrc([storyBossAvatarKey("neo"), VIDEO_KEYS.GAMEPLAY_LOOP]);
}

/**
 * Resolve a story boss clip for UI playback.
 * Avatar loops never use bundled sign catalog files.
 */
export async function resolveStoryBossVideoPlayback(bossId, slot) {
  if (!bossId) return { src: null, hasLocal: false };

  const primaryKey = storyBossPrimaryKey(bossId, slot);
  const primaryLocal = await getLocalVideoObjectUrl(primaryKey);
  if (primaryLocal) {
    return { src: primaryLocal, hasLocal: true };
  }

  if (slot === "intro") {
    return { src: null, hasLocal: false };
  }

  if (slot === "avatar" && bossId === "neo") {
    return resolveNeoStoryFightLoop();
  }

  if (slot === "avatar") {
    // Before match doubles as the fight-panel loop when Avatar loop is empty (Sir Scale, etc.).
    const introLocal = await getLocalVideoObjectUrl(storyBossIntroKey(bossId));
    if (introLocal) {
      return { src: introLocal, hasLocal: true };
    }
    return { src: null, hasLocal: false };
  }

  const globalKey = getStoryBossVideoGlobalKey(bossId, slot);
  if (!globalKey) return { src: null, hasLocal: false };

  const globalLocal = await getLocalVideoObjectUrl(globalKey);
  if (globalLocal) return { src: globalLocal, hasLocal: true };

  const catalog = getStoryBossVideoCatalogFallback(globalKey);
  if (catalog && !STORY_SIGN_CATALOG_PATHS.has(catalog)) {
    return { src: catalog, hasLocal: false };
  }

  return { src: null, hasLocal: false };
}

export function getStoryBossVideoCatalogFallback(globalKey) {
  return VIDEO_FALLBACK_PATHS[globalKey] ?? null;
}

export function getStoryBossVideoLabel(bossId, slot) {
  const boss = getBossDefinition(bossId);
  const name = boss?.name ?? bossId;
  if (slot === "intro") return `${name} — Before match`;
  if (slot === "win") return `${name} — Victory cutscene`;
  return `${name} — Avatar loop`;
}

export function getStoryBossVideoDescription(bossId, slot) {
  const boss = getBossDefinition(bossId);
  const name = boss?.name ?? bossId;
  if (slot === "intro") {
    return `Fullscreen intro before fighting ${name}. Upload a video for this boss only — no shared fallback.`;
  }
  if (slot === "win") {
    if (bossId === "gq") {
      return `Victory cutscene after defeating ${name}. Upload required for GQ — no shared fallback.`;
    }
    return `Victory cutscene after defeating ${name}. Falls back to global boss-win video if not uploaded.`;
  }
  if (bossId === "gq") {
    return `Large looping video above the table during ${name} fights. Upload Avatar loop (or Before match as fallback).`;
  }
  if (bossId === "neo") {
    return `Large looping video above the table during ${name} fights. Upload under Neo → Avatar loop (Matrix Sprite Lab or Video Assets). Never uses the 10,000 sign from local Play Now.`;
  }
  return `Large looping video above the table during ${name} fights. Upload Avatar loop — Before match video is used if Avatar loop is empty.`;
}

/** @deprecated Use resolveStoryBossVideoPlayback — kept for callers that need URL only. */
export async function resolveStoryBossVideoSrc(bossId, slot) {
  const result = await resolveStoryBossVideoPlayback(bossId, slot);
  return result.src;
}

export function preloadStoryBossVideos() {
  migrateNeoStoryAvatarLoop().catch(() => {});
  const keys = STORY_LADDER_IDS.flatMap((bossId) => [
    storyBossIntroKey(bossId),
    storyBossWinKey(bossId),
    storyBossAvatarKey(bossId),
  ]);
  return Promise.all(keys.map((key) => preloadLocalVideo(key)));
}

export const STORY_BOSS_VIDEO_SLOTS = ["intro", "win", "avatar"];
