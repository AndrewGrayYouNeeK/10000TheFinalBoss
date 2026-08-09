const DB_NAME = "yourneek_assets";
const DB_VERSION = 1;
const STORE = "blobs";

const VIDEO_SETTINGS_META_KEY = "yourneek_saved_video_keys";
const VIDEO_CLEARED_META_KEY = "yourneek_cleared_video_keys";
const OPFS_DIR = "yourneek-videos";

function backupVideoStorageKey(key) {
  return `backup_vid_${key}`;
}

function vaultVideoStorageKey(key) {
  return `vault_vid_${key}`;
}

function isAuxiliaryVideoKey(key) {
  return (
    key.startsWith("backup_vid_") ||
    key.startsWith("vault_vid_") ||
    key.startsWith("locked_vid_")
  );
}

function clearVideoSavedFlag(key) {
  try {
    const raw = localStorage.getItem(VIDEO_SETTINGS_META_KEY);
    const meta = raw ? JSON.parse(raw) : {};
    delete meta[key];
    localStorage.setItem(VIDEO_SETTINGS_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.warn(`[YouNeeK 10,000] Could not clear the saved flag for video "${key}".`, err);
  }
}

function markVideoSavedFlag(key) {
  try {
    const raw = localStorage.getItem(VIDEO_SETTINGS_META_KEY);
    const meta = raw ? JSON.parse(raw) : {};
    meta[key] = true;
    localStorage.setItem(VIDEO_SETTINGS_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.warn(`[YouNeeK 10,000] Could not mark video "${key}" as saved.`, err);
  }
}

function readClearedVideoKeys() {
  try {
    const raw = localStorage.getItem(VIDEO_CLEARED_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("[YouNeeK 10,000] Could not read the cleared-video list.", err);
    return {};
  }
}

function markVideoUserCleared(key, cleared = true) {
  try {
    const meta = readClearedVideoKeys();
    if (cleared) meta[key] = true;
    else delete meta[key];
    localStorage.setItem(VIDEO_CLEARED_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.warn(`[YouNeeK 10,000] Could not record the cleared state of video "${key}".`, err);
  }
}

/** True when the user tapped Remove — blocks auto-restore until Restore/Save. */
export function isVideoUserCleared(key) {
  return !!readClearedVideoKeys()[key];
}

export function clearVideoUserCleared(key) {
  markVideoUserCleared(key, false);
}

/** @deprecated legacy key — migrated to matrix_power on read */
const LEGACY_MATRIX_KEY = "matrix_power_video";

export const VIDEO_KEYS = {
  MATRIX_POWER: "matrix_power",
  DIAMOND_CUT_POWER: "diamond_cut_power",
  BLUE_GEL_POWER: "blue_gel_power",
  /** Approach / swim-in before the chomp clip (upload only — no catalog fallback). */
  BLUE_GEL_SHARK_BITE_INTRO: "blue_gel_shark_bite_intro",
  STORY_MODE: "story_mode",
  STORY_BOSS_WIN: "story_boss_win",
  GAMEPLAY_LOOP: "gameplay_loop",
  GAMEPLAY_BILLBOARD: "gameplay_billboard",
  CHARACTERS_LOOP: "characters_loop",
};

export const VIDEO_FALLBACK_PATHS = {
  [VIDEO_KEYS.MATRIX_POWER]: "/assets/matrix_power.mp4",
  [VIDEO_KEYS.DIAMOND_CUT_POWER]: "/assets/diamond_cut_power.mp4",
  [VIDEO_KEYS.BLUE_GEL_POWER]: "/assets/blue_gel_power.mp4",
  [VIDEO_KEYS.STORY_MODE]: "/assets/story_mode.mp4",
  [VIDEO_KEYS.STORY_BOSS_WIN]: "/assets/story_boss_win.mp4",
  [VIDEO_KEYS.GAMEPLAY_LOOP]: "/assets/gameplay_header_loop.mp4",
  [VIDEO_KEYS.GAMEPLAY_BILLBOARD]: "/assets/gameplay_billboard.mp4",
  [VIDEO_KEYS.CHARACTERS_LOOP]: "/assets/characters_loop.mp4",
};

export const VIDEO_LABELS = {
  [VIDEO_KEYS.MATRIX_POWER]: "Matrix power dice",
  [VIDEO_KEYS.DIAMOND_CUT_POWER]: "Diamond Cut power dice",
  [VIDEO_KEYS.BLUE_GEL_POWER]: "Chomps whole screen",
  [VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO]: "Swim forward",
  [VIDEO_KEYS.STORY_MODE]: "Story hub banner",
  [VIDEO_KEYS.STORY_BOSS_WIN]: "Boss defeated",
  [VIDEO_KEYS.GAMEPLAY_LOOP]: "Gameplay header loop",
  [VIDEO_KEYS.GAMEPLAY_BILLBOARD]: "In-match billboard (10,000 sign)",
  [VIDEO_KEYS.CHARACTERS_LOOP]: "Player portraits (local game)",
};

export const VIDEO_DESCRIPTIONS = {
  [VIDEO_KEYS.MATRIX_POWER]:
    "3×2 face-grid MP4 shown on Matrix dice when power is charged. Upload here or drop in public/assets/matrix_power.mp4.",
  [VIDEO_KEYS.DIAMOND_CUT_POWER]:
    "3×2 face-grid MP4 shown on Diamond Cut dice when power is charged. Upload here or drop in public/assets/diamond_cut_power.mp4.",
  [VIDEO_KEYS.BLUE_GEL_POWER]:
    "Slot 2 — shark chomps the whole screen over the dice tray. Plays after Swim forward (if uploaded) or alone. Black background is keyed out. Upload: /shark-bite-lab, /fish-showcase, or /video-assets. Catalog fallback only when this slot is empty: public/assets/blue_gel_power.mp4.",
  [VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO]:
    "Slot 1 — shark swims forward toward the tray. Plays once, then Chomps whole screen. Upload only (no catalog file). Same chroma settings as slot 2.",
  [VIDEO_KEYS.STORY_MODE]:
    "Looping banner on the Story hub ladder page only — not used as a boss-fight intro.",
  [VIDEO_KEYS.STORY_BOSS_WIN]:
    "Fullscreen victory cutscene after defeating a boss (plays once, then rewards).",
  [VIDEO_KEYS.GAMEPLAY_LOOP]:
    "Optional looping clip (Neo avatar fallback). Not shown above the 10,000 sign in local games.",
  [VIDEO_KEYS.GAMEPLAY_BILLBOARD]:
    "Looping video in the YouNeeK 10,000 neon sign area during local multiplayer matches.",
  [VIDEO_KEYS.CHARACTERS_LOOP]:
    "Looping character strip for local multiplayer player portraits (ScorePanel). Upload here or drop public/assets/characters_loop.mp4 — one horizontal row, one character per player slot (2–4).",
};

const cache = new Map();
const listeners = new Map();

let dbPromise = null;
let persistRequested = false;

function ensureListeners(key) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  return listeners.get(key);
}

function notify(key, url) {
  for (const fn of ensureListeners(key)) {
    try {
      fn(url);
    } catch (err) {
      console.error(`[YouNeeK 10,000] A video listener for "${key}" threw.`, err);
    }
  }
}

function revokeCached(key) {
  const url = cache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    cache.delete(key);
  }
}

function requestPersistentStorage() {
  if (persistRequested) return;
  persistRequested = true;
  try {
    if (navigator?.storage?.persist) {
      navigator.storage.persist().catch((err) => {
        console.warn("[YouNeeK 10,000] Persistent storage was not granted.", err);
      });
    }
  } catch (err) {
    console.warn("[YouNeeK 10,000] Persistent storage API unavailable.", err);
  }
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => {
      /* another tab holds an older version — keep waiting */
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
  return dbPromise;
}

function idbGet(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result ?? null);
      })
  );
}

function idbPut(key, value) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).put(value, key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      })
  );
}

function idbDelete(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).delete(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      })
  );
}

/** All blob keys in IndexedDB — for upload recovery. */
export function listAllLocalVideoKeys() {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAllKeys();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result.map((k) => String(k)));
      })
  );
}

async function opfsWrite(key, blob) {
  try {
    if (!navigator?.storage?.getDirectory) return;
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle(OPFS_DIR, { create: true });
    const handle = await dir.getFileHandle(`${key}.bin`, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (err) {
    // OPFS unavailable (private mode / older WebView) — the IndexedDB copies stand.
    console.warn(`[YouNeeK 10,000] Could not write the OPFS copy of video "${key}".`, err);
  }
}

async function opfsRead(key) {
  try {
    if (!navigator?.storage?.getDirectory) return null;
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle(OPFS_DIR);
    const handle = await dir.getFileHandle(`${key}.bin`);
    const file = await handle.getFile();
    if (!file?.size) return null;
    return file;
  } catch (err) {
    if (err?.name !== "NotFoundError") {
      console.warn(`[YouNeeK 10,000] Could not read the OPFS copy of video "${key}".`, err);
    }
    return null;
  }
}

async function opfsDelete(key) {
  try {
    if (!navigator?.storage?.getDirectory) return;
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle(OPFS_DIR);
    await dir.removeEntry(`${key}.bin`);
  } catch (err) {
    if (err?.name !== "NotFoundError") {
      console.warn(`[YouNeeK 10,000] Could not delete the OPFS copy of video "${key}".`, err);
    }
  }
}

function writeProfileVideoMeta(key, meta) {
  try {
    import("./localProfile").then(({ loadProfile, updateProfile }) => {
      const profile = loadProfile();
      const video_uploads = { ...(profile.video_uploads || {}) };
      if (meta) video_uploads[key] = meta;
      else delete video_uploads[key];
      updateProfile({ video_uploads });
    }).catch((err) => {
      console.warn(`[YouNeeK 10,000] Could not save upload metadata for video "${key}".`, err);
    });
  } catch (err) {
    console.warn(`[YouNeeK 10,000] Could not save upload metadata for video "${key}".`, err);
  }
}

export function loadProfileVideoUploadKeys() {
  try {
    // sync path — localProfile is tiny
    const raw = localStorage.getItem("dice10k_profile");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Object.keys(parsed?.video_uploads || {}).filter(Boolean);
  } catch (err) {
    console.warn("[YouNeeK 10,000] Could not read the profile video upload list.", err);
    return [];
  }
}

async function migrateLegacyMatrixKey() {
  const legacy = await idbGet(LEGACY_MATRIX_KEY);
  if (!legacy) return;
  const current = await idbGet(VIDEO_KEYS.MATRIX_POWER);
  if (!current) {
    await idbPut(VIDEO_KEYS.MATRIX_POWER, legacy);
  }
}

/** Warm IndexedDB cache for a key. */
export function preloadLocalVideo(key) {
  return getLocalVideoObjectUrl(key);
}

/** Returns cached blob URL synchronously after preload/save. */
export function getCachedLocalVideoObjectUrl(key) {
  return cache.get(key) ?? null;
}

export async function getLocalVideoObjectUrl(key) {
  if (cache.has(key)) return cache.get(key);
  if (key === VIDEO_KEYS.MATRIX_POWER) {
    await migrateLegacyMatrixKey();
  }
  const blob = await idbGet(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  cache.set(key, url);
  return url;
}

export async function hasLocalVideo(key) {
  if (cache.has(key)) return true;
  if (key === VIDEO_KEYS.MATRIX_POWER) {
    await migrateLegacyMatrixKey();
  }
  const blob = await idbGet(key);
  return !!blob;
}

/**
 * Write durable copies (backup + vault + OPFS + profile meta).
 * Does not touch the live cache/listeners for auxiliary keys.
 */
export async function persistVideoDurability(key, blob) {
  if (!blob || isAuxiliaryVideoKey(key)) return;
  requestPersistentStorage();
  const normalized =
    blob instanceof Blob ? blob : new Blob([blob], { type: blob.type || "video/mp4" });

  await Promise.all([
    idbPut(backupVideoStorageKey(key), normalized),
    idbPut(vaultVideoStorageKey(key), normalized),
    opfsWrite(key, normalized),
  ]);

  markVideoSavedFlag(key);
  writeProfileVideoMeta(key, {
    savedAt: Date.now(),
    size: normalized.size,
    type: normalized.type || "video/mp4",
  });
}

export async function saveLocalVideo(key, file) {
  if (!file) throw new Error("No file selected");
  requestPersistentStorage();
  markVideoUserCleared(key, false);
  const blob =
    file instanceof Blob ? file : new Blob([file], { type: file.type || "video/mp4" });
  await idbPut(key, blob);
  revokeCached(key);
  const url = URL.createObjectURL(blob);
  cache.set(key, url);
  notify(key, url);

  // Await durability — never report success without backup/vault/OPFS attempted.
  await persistVideoDurability(key, blob);

  try {
    const { mirrorUploadToSnapshots } = await import("./spriteLabLockedVideos");
    await mirrorUploadToSnapshots(key);
  } catch (err) {
    // Lock snapshots are best-effort; vault/backup are already written.
    console.warn(`[YouNeeK 10,000] Could not mirror video "${key}" into lock snapshots.`, err);
  }

  writeProfileVideoMeta(key, {
    savedAt: Date.now(),
    size: blob.size,
    type: blob.type || "video/mp4",
    fileName: typeof file?.name === "string" ? file.name : undefined,
  });

  return url;
}

/**
 * Remove the live upload from the UI.
 * Keeps vault + OPFS so "Restore all uploads" can bring it back.
 * Pass { purgeVault: true } for a hard delete.
 */
export async function clearLocalVideo(key, { purgeVault = false } = {}) {
  await idbDelete(key);
  await idbDelete(backupVideoStorageKey(key));
  markVideoUserCleared(key, true);
  if (purgeVault) {
    await idbDelete(vaultVideoStorageKey(key));
    await opfsDelete(key);
    clearVideoSavedFlag(key);
    writeProfileVideoMeta(key, null);
    markVideoUserCleared(key, false);
  }
  revokeCached(key);
  notify(key, null);
}

/** Raw blob from IndexedDB (no object URL). Checks live key only. */
export async function getLocalVideoBlob(key) {
  if (key === VIDEO_KEYS.MATRIX_POWER) {
    await migrateLegacyMatrixKey();
  }
  return idbGet(key);
}

/** Write blob to IndexedDB. Live keys refresh cache/listeners; aux keys stay silent. */
export async function putLocalVideoBlob(key, blob) {
  if (!blob) {
    // Soft-delete THIS key only — never cascade into backup/vault (old bug wiped backups).
    await idbDelete(key);
    if (!isAuxiliaryVideoKey(key)) {
      revokeCached(key);
      notify(key, null);
    }
    return null;
  }
  const normalized =
    blob instanceof Blob ? blob : new Blob([blob], { type: blob.type || "video/mp4" });
  await idbPut(key, normalized);
  if (isAuxiliaryVideoKey(key)) return null;
  revokeCached(key);
  const url = URL.createObjectURL(normalized);
  cache.set(key, url);
  notify(key, url);
  return url;
}

/** Copy blob between IndexedDB keys — never deletes the target when the source is empty. */
export async function copyLocalVideoBlob(fromKey, toKey) {
  if (fromKey === toKey) return false;
  if (fromKey === VIDEO_KEYS.MATRIX_POWER) {
    await migrateLegacyMatrixKey();
  }
  const blob = await idbGet(fromKey);
  if (!blob) return false;
  await idbPut(toKey, blob);
  return true;
}

export function subscribeLocalVideo(key, listener) {
  const set = ensureListeners(key);
  set.add(listener);
  return () => set.delete(listener);
}

/** Local blob URL if uploaded, otherwise catalog fallback path. */
export async function resolveVideoSrc(key) {
  const local = await getLocalVideoObjectUrl(key);
  if (local) return local;
  return VIDEO_FALLBACK_PATHS[key] ?? null;
}

/** Synchronous resolve: cached blob or fallback path. */
export function resolveVideoSrcSync(key) {
  return getCachedLocalVideoObjectUrl(key) ?? VIDEO_FALLBACK_PATHS[key] ?? null;
}

export { backupVideoStorageKey, vaultVideoStorageKey, opfsRead, opfsWrite };

export function preloadAllLocalVideos() {
  // Recovery must always run — do not chain it behind storyBossVideos (old bug skipped restore).
  const recover = import("./spriteLabLockedVideos")
    .then(({ recoverAllVideoSettings }) => recoverAllVideoSettings())
    .catch((err) => {
      console.error("[YouNeeK 10,000] Video upload recovery failed.", err);
      return 0;
    });

  const preloadKeys = Promise.all(Object.values(VIDEO_KEYS).map((key) => preloadLocalVideo(key)));

  const preloadStory = import("./storyBossVideos")
    .then(({ preloadStoryBossVideos }) => preloadStoryBossVideos())
    .catch((err) => {
      console.warn("[YouNeeK 10,000] Story boss video preload failed.", err);
    });

  return Promise.all([recover, preloadKeys, preloadStory]).then(() => undefined);
}
