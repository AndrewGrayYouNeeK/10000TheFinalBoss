import {
  getLocalVideoBlob,
  listAllLocalVideoKeys,
  putLocalVideoBlob,
  VIDEO_KEYS,
} from "@/lib/localVideoStore";
import {
  MATRIX_GAMEPLAY_BILLBOARD_KEY,
  migrateLegacyGameplayBillboard,
} from "@/lib/diceBillboardVideo";
import { isMatrixTuningLocked } from "@/lib/matrixTuningLock";
import { storyBossIntroKey, storyBossWinKey, storyBossAvatarKey } from "@/lib/storyBossVideos";
import { isSpriteTuningLocked, loadLockedTuningSnapshot, SPRITE_TUNING_LOCK_SKIN_IDS } from "@/lib/spriteLab";
import {
  backupVideoKey,
  getAllManagedVideoKeys,
  loadSavedVideoKeys,
  markVideoSaved,
} from "@/lib/videoRegistry";

const SKIN_STORY_BOSS = {
  matrix: "neo",
  crystal_cut: "diamond_cut",
  snow_globe: "snowman",
  ice: "ice_witch",
  dragon_scale: "dragon_knight",
};

/** @deprecated Wrong slot — migrated to Neo story intro/win keys. */
const LEGACY_GAMEPLAY_BEFORE_MATRIX = "gameplay_before_matrix";
const LEGACY_GAMEPLAY_AFTER_MATRIX = "gameplay_after_matrix";

/** Old IndexedDB keys → current live keys (never deletes legacy blobs). */
const LEGACY_VIDEO_KEY_MIGRATIONS = [
  ["matrix_power_video", VIDEO_KEYS.MATRIX_POWER],
  [VIDEO_KEYS.GAMEPLAY_BILLBOARD, MATRIX_GAMEPLAY_BILLBOARD_KEY],
  [LEGACY_GAMEPLAY_BEFORE_MATRIX, storyBossIntroKey("neo")],
  [LEGACY_GAMEPLAY_AFTER_MATRIX, storyBossWinKey("neo")],
];

function lockedVideoStorageKey(skinId, videoKey) {
  return `locked_vid_${skinId}__${videoKey}`;
}

function lockedVideosMetaKey(skinId) {
  return `yourneek_locked_videos_${skinId}`;
}

/** Video upload slots tied to a dice Sprite Lab page. */
export function getSpriteLabVideoKeys(skinId) {
  const keys = [];
  if (skinId === "matrix") {
    keys.push(MATRIX_GAMEPLAY_BILLBOARD_KEY, VIDEO_KEYS.MATRIX_POWER);
  }
  if (skinId === "crystal_cut") keys.push(VIDEO_KEYS.DIAMOND_CUT_POWER);
  const bossId = SKIN_STORY_BOSS[skinId];
  if (bossId) {
    keys.push(
      storyBossIntroKey(bossId),
      storyBossWinKey(bossId),
      storyBossAvatarKey(bossId)
    );
  }
  return keys;
}

/** Which sprite-lab skins own this IndexedDB video key. */
export function getSkinIdsForVideoKey(videoKey) {
  const skinIds = new Set();
  if (videoKey === VIDEO_KEYS.MATRIX_POWER) skinIds.add("matrix");
  if (videoKey === VIDEO_KEYS.DIAMOND_CUT_POWER) skinIds.add("crystal_cut");
  if (videoKey === MATRIX_GAMEPLAY_BILLBOARD_KEY || videoKey === VIDEO_KEYS.GAMEPLAY_BILLBOARD) {
    skinIds.add("matrix");
  }
  for (const [skinId, bossId] of Object.entries(SKIN_STORY_BOSS)) {
    if (
      videoKey === storyBossIntroKey(bossId) ||
      videoKey === storyBossWinKey(bossId) ||
      videoKey === `story_boss_avatar_${bossId}`
    ) {
      skinIds.add(skinId);
    }
  }
  return [...skinIds];
}

/** Extra snapshot / legacy keys to scan when recovering one live slot. */
function recoverySourceKeysForVideoKey(videoKey) {
  const sources = new Set([
    backupVideoKey(videoKey),
    videoKey,
  ]);

  for (const [fromKey, toKey] of LEGACY_VIDEO_KEY_MIGRATIONS) {
    if (toKey === videoKey) sources.add(fromKey);
  }

  if (
    videoKey === MATRIX_GAMEPLAY_BILLBOARD_KEY ||
    videoKey === VIDEO_KEYS.GAMEPLAY_BILLBOARD
  ) {
    sources.add(VIDEO_KEYS.GAMEPLAY_BILLBOARD);
    sources.add(lockedVideoStorageKey("matrix", VIDEO_KEYS.GAMEPLAY_BILLBOARD));
    sources.add(lockedVideoStorageKey("matrix", MATRIX_GAMEPLAY_BILLBOARD_KEY));
  }

  if (videoKey === VIDEO_KEYS.MATRIX_POWER) {
    sources.add("matrix_power_video");
    sources.add(lockedVideoStorageKey("matrix", "matrix_power_video"));
    sources.add(lockedVideoStorageKey("matrix", VIDEO_KEYS.MATRIX_POWER));
  }

  if (videoKey === VIDEO_KEYS.DIAMOND_CUT_POWER) {
    sources.add(lockedVideoStorageKey("crystal_cut", VIDEO_KEYS.DIAMOND_CUT_POWER));
  }

  for (const skinId of getSkinIdsForVideoKey(videoKey)) {
    sources.add(lockedVideoStorageKey(skinId, videoKey));
  }

  return [...sources];
}

export function saveLockedVideosMetadata(skinId, lockedVideos) {
  try {
    localStorage.setItem(lockedVideosMetaKey(skinId), JSON.stringify(lockedVideos));
  } catch {
    /* ignore quota errors */
  }
}

export function loadLockedVideosMetadata(skinId) {
  try {
    const raw = localStorage.getItem(lockedVideosMetaKey(skinId));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return loadLockedTuningSnapshot(skinId)?.lockedVideos ?? null;
}

async function copyBlobToLiveKey(fromKey, toKey) {
  if (!fromKey || fromKey === toKey) return false;
  if (await getLocalVideoBlob(toKey)) return false;
  const blob = await getLocalVideoBlob(fromKey);
  if (!blob) return false;
  await putLocalVideoBlob(toKey, blob);
  return true;
}

/** Migrate deprecated keys and sweep lock snapshots into live upload slots. */
export async function recoverAllVideoUploads() {
  await migrateLegacyGameplayBillboard();

  for (const [fromKey, toKey] of LEGACY_VIDEO_KEY_MIGRATIONS) {
    await copyBlobToLiveKey(fromKey, toKey);
  }

  const allKeys = await listAllLocalVideoKeys();
  for (const storageKey of allKeys) {
    if (
      storageKey.startsWith("gameplay_billboard_") &&
      storageKey !== MATRIX_GAMEPLAY_BILLBOARD_KEY
    ) {
      await copyBlobToLiveKey(storageKey, MATRIX_GAMEPLAY_BILLBOARD_KEY);
    }
  }

  for (const storageKey of allKeys) {
    if (!storageKey.startsWith("locked_vid_") && !storageKey.startsWith("backup_vid_")) continue;
    const sep = storageKey.indexOf("__");
    const videoKey =
      sep === -1 ? storageKey.slice("backup_vid_".length) : storageKey.slice(sep + 2);
    if (!videoKey) continue;
    await copyBlobToLiveKey(storageKey, videoKey);
  }
}

/** Recover one live key from backups, legacy keys, or lock snapshots. */
export async function recoverVideoKeyFromSnapshots(videoKey) {
  if (await getLocalVideoBlob(videoKey)) return true;

  for (const sourceKey of recoverySourceKeysForVideoKey(videoKey)) {
    if (await copyBlobToLiveKey(sourceKey, videoKey)) return true;
  }

  const allKeys = await listAllLocalVideoKeys();
  for (const storageKey of allKeys) {
    if (!storageKey.endsWith(`__${videoKey}`)) continue;
    if (await copyBlobToLiveKey(storageKey, videoKey)) return true;
  }

  return false;
}

/** How many upload slots on this skin were restored from backup/snapshot storage. */
export async function recoverLockedVideoSnapshots(skinId) {
  await recoverAllVideoUploads();
  const keys = getSpriteLabVideoKeys(skinId);
  let restored = 0;
  await Promise.all(
    keys.map(async (videoKey) => {
      const hadLive = await getLocalVideoBlob(videoKey);
      if (hadLive) return;
      const recovered = await recoverVideoKeyFromSnapshots(videoKey);
      if (recovered) restored += 1;
    })
  );
  return restored;
}

/** Recover every managed upload slot from backups, legacy keys, and snapshots. */
export async function recoverAllVideoSettings() {
  try {
    await recoverAllVideoUploads();

    const keys = new Set([...getAllManagedVideoKeys(), ...loadSavedVideoKeys()]);
    let restored = 0;

    for (const videoKey of keys) {
      const hadLive = await getLocalVideoBlob(videoKey);
      if (hadLive) continue;
      if (await recoverVideoKeyFromSnapshots(videoKey)) restored += 1;
    }

    return restored;
  } catch {
    return 0;
  }
}

/** Mirror a live upload into backup + optional lock snapshots — called after every save. */
export async function mirrorUploadToSnapshots(videoKey) {
  const blob = await getLocalVideoBlob(videoKey);
  if (!blob) return;

  await putLocalVideoBlob(backupVideoKey(videoKey), blob);
  markVideoSaved(videoKey, true);

  const skinIds = getSkinIdsForVideoKey(videoKey);
  if (!skinIds.length) return;

  await Promise.all(
    skinIds.map(async (skinId) => {
      const snapshotKey = lockedVideoStorageKey(skinId, videoKey);
      await putLocalVideoBlob(snapshotKey, blob);
      const meta = loadLockedVideosMetadata(skinId) || {};
      meta[videoKey] = true;
      saveLockedVideosMetadata(skinId, meta);
    })
  );
}

/** Snapshot all uploads when the user taps Lock in Sprite Lab. */
export async function saveLockedVideoSnapshots(skinId) {
  const keys = getSpriteLabVideoKeys(skinId);
  const lockedVideos = {};
  await Promise.all(
    keys.map(async (videoKey) => {
      const blob = await getLocalVideoBlob(videoKey);
      lockedVideos[videoKey] = !!blob;
      if (blob) {
        await putLocalVideoBlob(backupVideoKey(videoKey), blob);
        markVideoSaved(videoKey, true);
        const snapshotKey = lockedVideoStorageKey(skinId, videoKey);
        await putLocalVideoBlob(snapshotKey, blob);
      }
    })
  );
  saveLockedVideosMetadata(skinId, lockedVideos);
  return lockedVideos;
}

export async function recoverMatrixVideosOnStartup() {
  await recoverAllVideoUploads();
  if (isMatrixTuningLocked()) {
    return recoverLockedVideoSnapshots("matrix");
  }
  return 0;
}

export async function recoverAllLockedSkinVideos() {
  return recoverAllVideoSettings();
}

export async function saveAllVideoSettings() {
  const keys = getAllManagedVideoKeys();
  let saved = 0;
  await Promise.all(
    keys.map(async (videoKey) => {
      const blob = await getLocalVideoBlob(videoKey);
      if (!blob) return;
      await mirrorUploadToSnapshots(videoKey);
      saved += 1;
    })
  );
  return saved;
}

export const restoreLockedVideoSnapshots = recoverLockedVideoSnapshots;
export const restoreAllLockedSkinVideos = recoverAllLockedSkinVideos;
export const recoverMatrixPowerVideoOnStartup = recoverMatrixVideosOnStartup;
export { recoverAllVideoSettings as restoreAllVideoSettings };
