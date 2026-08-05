import {
  clearVideoUserCleared,
  getLocalVideoBlob,
  isVideoUserCleared,
  listAllLocalVideoKeys,
  loadProfileVideoUploadKeys,
  persistVideoDurability,
  putLocalVideoBlob,
  VIDEO_FALLBACK_PATHS,
  VIDEO_KEYS,
  vaultVideoStorageKey,
  opfsRead,
} from "@/lib/localVideoStore";
import {
  MATRIX_GAMEPLAY_BILLBOARD_KEY,
  migrateLegacyGameplayBillboard,
} from "@/lib/diceBillboardVideo";
import { isMatrixTuningLocked } from "@/lib/matrixTuningLock";
import { storyBossIntroKey, storyBossWinKey, storyBossAvatarKey } from "@/lib/storyBossVideos";
import { loadLockedTuningSnapshot } from "@/lib/spriteLab";
import {
  backupVideoKey,
  getAllManagedVideoKeys,
  loadSavedVideoKeys,
  markVideoSaved,
} from "@/lib/videoRegistry";

const SKIN_STORY_BOSS = {
  matrix: "neo",
  crystal_cut: "gq",
  // Frosty the Evil Snowman — story ladder id (not dormant ice_witch / old "Glacia" label)
  ice: "snowman",
  dragon_scale: "dragon_knight",
  blue_gel: "fisherman",
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
  [storyBossIntroKey("diamond_cut"), storyBossIntroKey("gq")],
  [storyBossWinKey("diamond_cut"), storyBossWinKey("gq")],
  [storyBossAvatarKey("diamond_cut"), storyBossAvatarKey("gq")],
  // Ice Sprite Lab used to label Frosty as "Glacia" and stored under ice_witch
  [storyBossIntroKey("ice_witch"), storyBossIntroKey("snowman")],
  [storyBossWinKey("ice_witch"), storyBossWinKey("snowman")],
  [storyBossAvatarKey("ice_witch"), storyBossAvatarKey("snowman")],
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
    keys.push(VIDEO_KEYS.MATRIX_POWER);
  }
  if (skinId === "crystal_cut") keys.push(VIDEO_KEYS.DIAMOND_CUT_POWER);
  if (skinId === "blue_gel") {
    keys.push(VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO, VIDEO_KEYS.BLUE_GEL_POWER);
  }
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
  if (videoKey === VIDEO_KEYS.BLUE_GEL_POWER || videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO) {
    skinIds.add("blue_gel");
  }
  if (videoKey === MATRIX_GAMEPLAY_BILLBOARD_KEY || videoKey === VIDEO_KEYS.GAMEPLAY_BILLBOARD) {
    skinIds.add("matrix");
  }
  for (const [skinId, bossId] of Object.entries(SKIN_STORY_BOSS)) {
    if (!bossId) continue;
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

function liveKeyFromAuxStorageKey(storageKey) {
  if (storageKey.startsWith("backup_vid_")) {
    return storageKey.slice("backup_vid_".length);
  }
  if (storageKey.startsWith("vault_vid_")) {
    return storageKey.slice("vault_vid_".length);
  }
  if (storageKey.startsWith("locked_vid_")) {
    const sep = storageKey.indexOf("__");
    if (sep === -1) return null;
    return storageKey.slice(sep + 2);
  }
  return null;
}

/** Extra snapshot / legacy keys to scan when recovering one live slot. */
function recoverySourceKeysForVideoKey(videoKey) {
  const sources = new Set([
    backupVideoKey(videoKey),
    vaultVideoStorageKey(videoKey),
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

  if (videoKey === VIDEO_KEYS.BLUE_GEL_POWER) {
    sources.add(lockedVideoStorageKey("blue_gel", VIDEO_KEYS.BLUE_GEL_POWER));
  }
  if (videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO) {
    sources.add(lockedVideoStorageKey("blue_gel", VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO));
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
export async function recoverAllVideoUploads({ force = false } = {}) {
  await migrateLegacyGameplayBillboard();

  for (const [fromKey, toKey] of LEGACY_VIDEO_KEY_MIGRATIONS) {
    if (!force && isVideoUserCleared(toKey)) continue;
    await copyBlobToLiveKey(fromKey, toKey);
  }

  const allKeys = await listAllLocalVideoKeys().catch(() => []);
  for (const storageKey of allKeys) {
    if (
      storageKey.startsWith("gameplay_billboard_") &&
      storageKey !== MATRIX_GAMEPLAY_BILLBOARD_KEY
    ) {
      if (!force && isVideoUserCleared(MATRIX_GAMEPLAY_BILLBOARD_KEY)) continue;
      await copyBlobToLiveKey(storageKey, MATRIX_GAMEPLAY_BILLBOARD_KEY);
    }
  }

  for (const storageKey of allKeys) {
    const videoKey = liveKeyFromAuxStorageKey(storageKey);
    if (!videoKey) continue;
    if (!force && isVideoUserCleared(videoKey)) continue;
    await copyBlobToLiveKey(storageKey, videoKey);
  }
}

/** Recover one live key from backups, vault, OPFS, legacy keys, or lock snapshots. */
export async function recoverVideoKeyFromSnapshots(videoKey, { force = false } = {}) {
  if (await getLocalVideoBlob(videoKey)) return true;
  // Respect intentional Remove unless user tapped Restore (force).
  if (!force && isVideoUserCleared(videoKey)) return false;

  for (const sourceKey of recoverySourceKeysForVideoKey(videoKey)) {
    if (await copyBlobToLiveKey(sourceKey, videoKey)) {
      const blob = await getLocalVideoBlob(videoKey);
      if (blob) {
        clearVideoUserCleared(videoKey);
        await persistVideoDurability(videoKey, blob);
      }
      return true;
    }
  }

  const opfsBlob = await opfsRead(videoKey);
  if (opfsBlob) {
    await putLocalVideoBlob(videoKey, opfsBlob);
    clearVideoUserCleared(videoKey);
    await persistVideoDurability(videoKey, opfsBlob);
    return true;
  }

  // Recovered shark bite lives in public/assets — seed IndexedDB if this origin is empty.
  if (videoKey === VIDEO_KEYS.BLUE_GEL_POWER && typeof fetch === "function") {
    const fallbackPath = VIDEO_FALLBACK_PATHS[videoKey];
    if (fallbackPath) {
      try {
        const res = await fetch(fallbackPath, { cache: "force-cache" });
        if (res.ok) {
          const raw = await res.blob();
          if (raw?.size > 0) {
            const catalogBlob = new Blob([raw], { type: "video/mp4" });
            await putLocalVideoBlob(videoKey, catalogBlob);
            clearVideoUserCleared(videoKey);
            await persistVideoDurability(videoKey, catalogBlob);
            return true;
          }
        }
      } catch {
        /* catalog file missing */
      }
    }
  }

  const allKeys = await listAllLocalVideoKeys().catch(() => []);
  for (const storageKey of allKeys) {
    if (!storageKey.endsWith(`__${videoKey}`) && !storageKey.endsWith(`_${videoKey}`)) {
      continue;
    }
    if (storageKey === videoKey) continue;
    if (await copyBlobToLiveKey(storageKey, videoKey)) {
      const blob = await getLocalVideoBlob(videoKey);
      if (blob) {
        clearVideoUserCleared(videoKey);
        await persistVideoDurability(videoKey, blob);
      }
      return true;
    }
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

/**
 * Recover every managed upload slot from backups, vault, OPFS, legacy keys, and snapshots.
 * @param {{ force?: boolean }} [opts] force=true ignores Remove tombstones (Restore button).
 */
export async function recoverAllVideoSettings({ force = false } = {}) {
  try {
    await recoverAllVideoUploads({ force });

    const keys = new Set([
      ...getAllManagedVideoKeys(),
      ...loadSavedVideoKeys(),
      ...loadProfileVideoUploadKeys(),
    ]);
    let restored = 0;

    for (const videoKey of keys) {
      const hadLive = await getLocalVideoBlob(videoKey);
      if (hadLive) {
        // Re-seal durability for anything still live (upgrades old single-copy uploads).
        const blob = await getLocalVideoBlob(videoKey);
        if (blob) await persistVideoDurability(videoKey, blob);
        continue;
      }
      if (await recoverVideoKeyFromSnapshots(videoKey, { force })) restored += 1;
    }

    return restored;
  } catch {
    return 0;
  }
}

/** Mirror a live upload into backup + vault + OPFS + optional lock snapshots. */
export async function mirrorUploadToSnapshots(videoKey) {
  const blob = await getLocalVideoBlob(videoKey);
  if (!blob) return;

  await persistVideoDurability(videoKey, blob);
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
        await persistVideoDurability(videoKey, blob);
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
