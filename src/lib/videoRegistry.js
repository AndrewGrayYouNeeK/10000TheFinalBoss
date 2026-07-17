import { VIDEO_KEYS } from "@/lib/localVideoStore";
import { STORY_LADDER_IDS } from "@/lib/storyBosses";
import {
  storyBossAvatarKey,
  storyBossIntroKey,
  storyBossWinKey,
} from "@/lib/storyBossVideos";

/** Same key as diceBillboardVideo — kept here to avoid import cycles on startup. */
export const MATRIX_GAMEPLAY_BILLBOARD_KEY = "gameplay_billboard_matrix";

/** IndexedDB backup slot — written on every upload, never cleared by restore. */
export function backupVideoKey(videoKey) {
  return `backup_vid_${videoKey}`;
}

/** Every upload slot in the app (used for preload + recovery). */
export function getAllManagedVideoKeys() {
  const keys = new Set([...Object.values(VIDEO_KEYS), MATRIX_GAMEPLAY_BILLBOARD_KEY]);

  for (const bossId of STORY_LADDER_IDS) {
    keys.add(storyBossIntroKey(bossId));
    keys.add(storyBossWinKey(bossId));
    keys.add(storyBossAvatarKey(bossId));
  }

  return [...keys];
}

const VIDEO_SETTINGS_META_KEY = "yourneek_saved_video_keys";

/** Track which slots had uploads (helps recovery after accidental clears). */
export function markVideoSaved(videoKey, saved = true) {
  try {
    const raw = localStorage.getItem(VIDEO_SETTINGS_META_KEY);
    const meta = raw ? JSON.parse(raw) : {};
    if (saved) meta[videoKey] = true;
    else delete meta[videoKey];
    localStorage.setItem(VIDEO_SETTINGS_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore quota errors */
  }
}

export function loadSavedVideoKeys() {
  try {
    const raw = localStorage.getItem(VIDEO_SETTINGS_META_KEY);
    if (!raw) return [];
    return Object.keys(JSON.parse(raw)).filter(Boolean);
  } catch {
    return [];
  }
}
