const DB_NAME = "yourneek_assets";
const DB_VERSION = 1;
const STORE = "blobs";

/** @deprecated legacy key — migrated to matrix_power on read */
const LEGACY_MATRIX_KEY = "matrix_power_video";

export const VIDEO_KEYS = {
  MATRIX_POWER: "matrix_power",
  DIAMOND_CUT_POWER: "diamond_cut_power",
  BLUE_GEL_POWER: "blue_gel_power",
  STORY_MODE: "story_mode",
  STORY_BOSS_WIN: "story_boss_win",
  GAMEPLAY_LOOP: "gameplay_loop",
  GAMEPLAY_BILLBOARD: "gameplay_billboard",
};

export const VIDEO_FALLBACK_PATHS = {
  [VIDEO_KEYS.MATRIX_POWER]: "/assets/matrix_power.mp4",
  [VIDEO_KEYS.DIAMOND_CUT_POWER]: "/assets/diamond_cut_power.mp4",
  [VIDEO_KEYS.STORY_MODE]: "/assets/story_mode.mp4",
  [VIDEO_KEYS.STORY_BOSS_WIN]: "/assets/story_boss_win.mp4",
  [VIDEO_KEYS.GAMEPLAY_LOOP]: "/assets/gameplay_header_loop.mp4",
  [VIDEO_KEYS.GAMEPLAY_BILLBOARD]: "/assets/gameplay_billboard.mp4",
};

export const VIDEO_LABELS = {
  [VIDEO_KEYS.MATRIX_POWER]: "Matrix power dice",
  [VIDEO_KEYS.DIAMOND_CUT_POWER]: "Diamond Cut power dice",
  [VIDEO_KEYS.BLUE_GEL_POWER]: "Blue Gel / Shark power mode video",
  [VIDEO_KEYS.STORY_MODE]: "Story hub banner",
  [VIDEO_KEYS.STORY_BOSS_WIN]: "Boss defeated",
  [VIDEO_KEYS.GAMEPLAY_LOOP]: "Gameplay header loop",
  [VIDEO_KEYS.GAMEPLAY_BILLBOARD]: "In-match billboard (10,000 sign)",
};

export const VIDEO_DESCRIPTIONS = {
  [VIDEO_KEYS.MATRIX_POWER]:
    "3×2 face-grid MP4 shown on Matrix dice when power is charged. Upload here or drop in public/assets/matrix_power.mp4.",
  [VIDEO_KEYS.DIAMOND_CUT_POWER]:
    "3×2 face-grid MP4 shown on Diamond Cut dice when power is charged. Upload here or drop in public/assets/diamond_cut_power.mp4.",
  [VIDEO_KEYS.BLUE_GEL_POWER]:
    "Fullscreen shark / Blue Gel power video over gameplay when Shark Bite power is charged or resolves. Upload here — does not play inside dice. If none is uploaded, the built-in full-screen SVG shark swim still runs for bites.",
  [VIDEO_KEYS.STORY_MODE]:
    "Looping banner on the Story hub ladder page only — not used as a boss-fight intro.",
  [VIDEO_KEYS.STORY_BOSS_WIN]:
    "Fullscreen victory cutscene after defeating a boss (plays once, then rewards).",
  [VIDEO_KEYS.GAMEPLAY_LOOP]:
    "Optional looping clip (Neo avatar fallback). Not shown above the 10,000 sign in local games.",
  [VIDEO_KEYS.GAMEPLAY_BILLBOARD]:
    "Looping video in the YouNeeK 10,000 neon sign area during local multiplayer matches.",
};

const cache = new Map();
const listeners = new Map();

let dbPromise = null;

function ensureListeners(key) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  return listeners.get(key);
}

function notify(key, url) {
  for (const fn of ensureListeners(key)) {
    try {
      fn(url);
    } catch {
      /* ignore listener errors */
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

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
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

async function migrateLegacyMatrixKey() {
  const legacy = await idbGet(LEGACY_MATRIX_KEY);
  if (!legacy) return;
  const current = await idbGet(VIDEO_KEYS.MATRIX_POWER);
  if (!current) {
    await idbPut(VIDEO_KEYS.MATRIX_POWER, legacy);
  }
  await idbDelete(LEGACY_MATRIX_KEY);
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

export async function saveLocalVideo(key, file) {
  if (!file) throw new Error("No file selected");
  const blob =
    file instanceof Blob ? file : new Blob([file], { type: file.type || "video/mp4" });
  await idbPut(key, blob);
  revokeCached(key);
  const url = URL.createObjectURL(blob);
  cache.set(key, url);
  notify(key, url);
  return url;
}

export async function clearLocalVideo(key) {
  await idbDelete(key);
  revokeCached(key);
  notify(key, null);
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

export function preloadAllLocalVideos() {
  return import("./storyBossVideos")
    .then(({ preloadStoryBossVideos }) =>
      Promise.all([
        ...Object.values(VIDEO_KEYS).map((key) => preloadLocalVideo(key)),
        preloadStoryBossVideos(),
      ])
    )
    .catch(() => Promise.all(Object.values(VIDEO_KEYS).map((key) => preloadLocalVideo(key))));
}
