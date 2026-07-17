import { STORY_LADDER_IDS, getBoss } from "./storyBosses";
import {
  getLocalVideoObjectUrl,
  preloadLocalVideo,
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

/**
 * Global fallback key after per-boss upload is missing.
 * Intro is per-boss only — never reuse Story hub / Matrix / other boss clips.
 */
export function getStoryBossVideoGlobalKey(bossId, slot) {
  if (slot === "win") return VIDEO_KEYS.STORY_BOSS_WIN;
  if (slot === "avatar" && bossId === "neo") return VIDEO_KEYS.GAMEPLAY_LOOP;
  return null;
}

export function getStoryBossVideoLabel(bossId, slot) {
  const boss = getBoss(bossId);
  const name = boss?.name ?? bossId;
  if (slot === "intro") return `${name} — Before match`;
  if (slot === "win") return `${name} — Victory cutscene`;
  return `${name} — Avatar loop`;
}

export function getStoryBossVideoDescription(bossId, slot) {
  const boss = getBoss(bossId);
  const name = boss?.name ?? bossId;
  if (slot === "intro") {
    return `Fullscreen intro before fighting ${name}. Upload a video for this boss only — no shared fallback.`;
  }
  if (slot === "win") {
    return `Victory cutscene after defeating ${name}. Falls back to global boss-win video if not uploaded.`;
  }
  if (bossId === "neo") {
    return `Looping avatar video for ${name} in dialogue and match UI. Falls back to global gameplay loop.`;
  }
  return `Optional looping avatar video for ${name}. Falls back to image/emoji if not uploaded.`;
}

/** Per-boss upload → optional global key (win / neo avatar only) → catalog mp4 → null (skip). */
export async function resolveStoryBossVideoSrc(bossId, slot) {
  if (!bossId) return null;

  const primaryKey = storyBossPrimaryKey(bossId, slot);
  const primaryLocal = await getLocalVideoObjectUrl(primaryKey);
  if (primaryLocal) return primaryLocal;

  // Intro is per-boss only — never fall back to Story hub / Matrix / other globals.
  if (slot === "intro") return null;

  const globalKey = getStoryBossVideoGlobalKey(bossId, slot);
  if (!globalKey) return null;

  const globalLocal = await getLocalVideoObjectUrl(globalKey);
  if (globalLocal) return globalLocal;

  return VIDEO_FALLBACK_PATHS[globalKey] ?? null;
}

export function preloadStoryBossVideos() {
  const keys = STORY_LADDER_IDS.flatMap((bossId) => [
    storyBossIntroKey(bossId),
    storyBossWinKey(bossId),
    storyBossAvatarKey(bossId),
  ]);
  return Promise.all(keys.map((key) => preloadLocalVideo(key)));
}

export const STORY_BOSS_VIDEO_SLOTS = ["intro", "win", "avatar"];
