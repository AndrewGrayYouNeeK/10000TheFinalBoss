import { AQUARIUM_OVERLAY_SKIN_IDS, DICE_SKINS } from "@/lib/shopCatalog";
import { loadProfile, updateProfile } from "@/lib/localProfile";
import { isMatrixTuningLocked } from "@/lib/matrixTuningLock";
import { isDiamondCutTuningLocked } from "@/lib/diamondCutTuningLock";
import { isIceTuningLocked } from "@/lib/iceTuningLock";
import { isRagnarokTuningLocked } from "@/lib/ragnarokTuningLock";
import { isGalaxyTuningLocked } from "@/lib/galaxyTuningLock";
import { isFluoriteTuningLocked } from "@/lib/fluoriteTuningLock";
import { isAmberWaspTuningLocked } from "@/lib/amberWaspTuningLock";
import { isAmethystTuningLocked } from "@/lib/amethystTuningLock";
import { isPaperTuningLocked } from "@/lib/paperTuningLock";
import {
  isClassicWhiteTuningLocked,
  recoverClassicWhiteLockOnce,
} from "@/lib/classicWhiteTuningLock";
import { isDragonScaleTuningLocked } from "@/lib/dragonScaleTuningLock";
import { isSnowGlobeTuningLocked } from "@/lib/snowGlobeTuningLock";
import { isBlueGelTuningLocked } from "@/lib/blueGelTuningLock";
import { isTealCrackleTuningLocked } from "@/lib/tealCrackleTuningLock";
import { isAquamarineLightTuningLocked } from "@/lib/aquamarineLightTuningLock";
import { isAquamarineTuningLocked } from "@/lib/aquamarineTuningLock";
import { isWoodTuningLocked } from "@/lib/woodTuningLock";
import { isSilverTuningLocked } from "@/lib/silverTuningLock";
import { isCircuitBoardTuningLocked } from "@/lib/circuitBoardTuningLock";
import { isCyberNeonTuningLocked } from "@/lib/cyberNeonTuningLock";
import { isObsidianTuningLocked } from "@/lib/obsidianTuningLock";
import { isLabradoriteTuningLocked } from "@/lib/labradoriteTuningLock";
import { isLabradoritePolishedTuningLocked } from "@/lib/labradoritePolishedTuningLock";
import { isLoveIsLoveTuningLocked } from "@/lib/loveIsLoveTuningLock";
import { isGoldTuningLocked } from "@/lib/goldTuningLock";
import { isMoonstoneTuningLocked } from "@/lib/moonstoneTuningLock";
import { isNeonGridTuningLocked } from "@/lib/neonGridTuningLock";
import { isPlasmaTuningLocked } from "@/lib/plasmaTuningLock";
import { isPrideTuningLocked } from "@/lib/prideTuningLock";
import { isToxicPlasmaV2TuningLocked } from "@/lib/toxicPlasmaV2TuningLock";
import { isRubyTuningLocked } from "@/lib/rubyTuningLock";

const TUNING_LOCK_CHECKERS = {
  matrix: isMatrixTuningLocked,
  crystal_cut: isDiamondCutTuningLocked,
  ice: isIceTuningLocked,
  ragnarok: isRagnarokTuningLocked,
  galaxy: isGalaxyTuningLocked,
  fluorite: isFluoriteTuningLocked,
  amber_wasp: isAmberWaspTuningLocked,
  amethyst: isAmethystTuningLocked,
  paper: isPaperTuningLocked,
  classic_white: isClassicWhiteTuningLocked,
  dragon_scale: isDragonScaleTuningLocked,
  snow_globe: isSnowGlobeTuningLocked,
  blue_gel: isBlueGelTuningLocked,
  teal_crackle: isTealCrackleTuningLocked,
  aquamarine_light: isAquamarineLightTuningLocked,
  aquamarine: isAquamarineTuningLocked,
  wood: isWoodTuningLocked,
  silver: isSilverTuningLocked,
  circuit_board: isCircuitBoardTuningLocked,
  cyber_neon: isCyberNeonTuningLocked,
  obsidian: isObsidianTuningLocked,
  labradorite: isLabradoriteTuningLocked,
  labradorite_polished: isLabradoritePolishedTuningLocked,
  love_is_love: isLoveIsLoveTuningLocked,
  gold: isGoldTuningLocked,
  moonstone: isMoonstoneTuningLocked,
  neon_grid: isNeonGridTuningLocked,
  plasma: isPlasmaTuningLocked,
  pride: isPrideTuningLocked,
  toxic_plasma_v2: isToxicPlasmaV2TuningLocked,
  ruby: isRubyTuningLocked,
};

/** localStorage lock-flag keys (crystal_cut uses diamond_cut historically). */
const TUNING_LOCK_FLAG_KEYS = {
  matrix: "yourneek_matrix_tuning_locked",
  crystal_cut: "yourneek_diamond_cut_tuning_locked",
  ice: "yourneek_ice_tuning_locked",
  ragnarok: "yourneek_ragnarok_tuning_locked",
  galaxy: "yourneek_galaxy_tuning_locked",
  fluorite: "yourneek_fluorite_tuning_locked",
  amber_wasp: "yourneek_amber_wasp_tuning_locked",
  amethyst: "yourneek_amethyst_tuning_locked",
  paper: "yourneek_paper_tuning_locked",
  classic_white: "yourneek_classic_white_tuning_locked",
  dragon_scale: "yourneek_dragon_scale_tuning_locked",
  snow_globe: "yourneek_snow_globe_tuning_locked",
  blue_gel: "yourneek_blue_gel_tuning_locked",
  teal_crackle: "yourneek_teal_crackle_tuning_locked",
  aquamarine_light: "yourneek_aquamarine_light_tuning_locked",
  aquamarine: "yourneek_aquamarine_tuning_locked",
  wood: "yourneek_wood_tuning_locked",
  silver: "yourneek_silver_tuning_locked",
  circuit_board: "yourneek_circuit_board_tuning_locked",
  cyber_neon: "yourneek_cyber_neon_tuning_locked",
  obsidian: "yourneek_obsidian_tuning_locked",
  labradorite: "yourneek_labradorite_tuning_locked",
  labradorite_polished: "yourneek_labradorite_polished_tuning_locked",
  love_is_love: "yourneek_love_is_love_tuning_locked",
  gold: "yourneek_gold_tuning_locked",
  moonstone: "yourneek_moonstone_tuning_locked",
  neon_grid: "yourneek_neon_grid_tuning_locked",
  plasma: "yourneek_plasma_tuning_locked",
  pride: "yourneek_pride_tuning_locked",
  toxic_plasma_v2: "yourneek_toxic_plasma_v2_tuning_locked",
  ruby: "yourneek_ruby_tuning_locked",
};

export function isSpriteTuningLocked(skinId) {
  return TUNING_LOCK_CHECKERS[skinId]?.() ?? false;
}

export const SPRITE_TUNING_LOCK_SKIN_IDS = Object.keys(TUNING_LOCK_CHECKERS);

export function lockedTuningStorageKey(skinId) {
  return `yourneek_locked_tuning_${skinId}`;
}

function readProfileSpriteTuning() {
  try {
    return loadProfile()?.sprite_tuning ?? {};
  } catch {
    return {};
  }
}

function writeProfileSpriteTuningMap(nextMap) {
  try {
    updateProfile({ sprite_tuning: nextMap });
  } catch {
    /* ignore */
  }
}

function writeProfileSpriteTuningEntry(skinId, patch) {
  try {
    const sprite_tuning = { ...readProfileSpriteTuning() };
    sprite_tuning[skinId] = {
      ...(sprite_tuning[skinId] || {}),
      ...patch,
      updatedAt: Date.now(),
    };
    writeProfileSpriteTuningMap(sprite_tuning);
  } catch {
    /* ignore */
  }
}

/** Persist slider + sprite path values when the user taps Lock in Sprite Lab. */
export function saveLockedTuningSnapshot(skinId, payload) {
  const data = { ...payload, savedAt: Date.now() };
  try {
    localStorage.setItem(lockedTuningStorageKey(skinId), JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
  writeProfileSpriteTuningEntry(skinId, { locked: true, snapshot: data });
}

export function loadLockedTuningSnapshot(skinId) {
  try {
    const raw = localStorage.getItem(lockedTuningStorageKey(skinId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* fall through to profile backup */
  }
  try {
    const snap = readProfileSpriteTuning()?.[skinId]?.snapshot;
    if (snap && typeof snap === "object") {
      try {
        localStorage.setItem(lockedTuningStorageKey(skinId), JSON.stringify(snap));
      } catch {
        /* ignore */
      }
      return snap;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Mirror Lock / Unlock into the player profile so it survives restarts. */
export function persistTuningLockFlag(skinId, locked) {
  const key = TUNING_LOCK_FLAG_KEYS[skinId];
  if (key) {
    try {
      localStorage.setItem(key, locked ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
  writeProfileSpriteTuningEntry(skinId, { locked: !!locked });
}

/** Read a Sprite Lab draft without preferring lock snapshots (recovery only). */
function loadRawSpriteLabDraft(skinId) {
  try {
    let raw = localStorage.getItem(spriteLabStorageKey(skinId));
    if (!raw && skinId === "ragnarok") {
      raw = localStorage.getItem("yourneek_ragnarok_sprite_lab");
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function catalogSkinById(skinId) {
  return DICE_SKINS.find((s) => s.id === skinId) ?? null;
}

/** Build a lock snapshot from catalog paths + crop (authoritative shipped defaults). */
function buildCatalogLockSnapshot(skin) {
  if (!skin) return null;
  const aquariumOverlay = AQUARIUM_OVERLAY_SKIN_IDS.has(skin.id);
  return {
    regularCrop: skin.spriteCrop ?? { ...DEFAULT_SPRITE_CROP },
    powerCrop: skin.powerSpriteCrop ?? { ...DEFAULT_SPRITE_CROP },
    regularFaces: emptyFaceMap(skin.spriteFaceOffsets?.regular),
    powerFaces: emptyFaceMap(skin.spriteFaceOffsets?.power),
    powerVideoZoom: skin.powerVideoZoom,
    powerVideoCrop: skin.powerVideoCrop ?? { offsetX: 0, offsetY: 0 },
    spriteUrl: aquariumOverlay ? undefined : skin.spriteUrl,
    powerSpriteUrl: aquariumOverlay ? undefined : skin.powerSpriteUrl,
    powerVideoUrl: aquariumOverlay ? undefined : skin.powerVideoUrl,
    videoUrl: aquariumOverlay ? undefined : skin.videoUrl,
    seededFrom: "catalog",
  };
}

function snapshotHasSpritePaths(snapshot) {
  return !!(
    snapshot &&
    (typeof snapshot.spriteUrl === "string" ||
      typeof snapshot.powerSpriteUrl === "string" ||
      typeof snapshot.powerVideoUrl === "string" ||
      typeof snapshot.videoUrl === "string")
  );
}

/** Prefer complete lock data — never let a path-less localStorage stub clobber a richer profile backup. */
function preferRicherSnapshot(a, b) {
  if (!a || typeof a !== "object") return b && typeof b === "object" ? b : null;
  if (!b || typeof b !== "object") return a;
  const score = (s) =>
    (snapshotHasSpritePaths(s) ? 100 : 0) +
    (s.regularCrop ? 10 : 0) +
    (s.powerCrop ? 5 : 0) +
    (typeof s.savedAt === "number" ? Math.min(s.savedAt / 1e13, 1) : 0);
  const sa = score(a);
  const sb = score(b);
  if (sa !== sb) return sa > sb ? a : b;
  return (a.savedAt ?? 0) >= (b.savedAt ?? 0) ? a : b;
}

/** Prefer recovered draft/crop; always freeze current catalog sprite paths. */
function mergeRecoveredLockSnapshot({ existing, draft, catalog }) {
  const base = buildCatalogLockSnapshot(catalog) || {
    regularCrop: { ...DEFAULT_SPRITE_CROP },
    powerCrop: { ...DEFAULT_SPRITE_CROP },
    regularFaces: emptyFaceMap(),
    powerFaces: emptyFaceMap(),
    powerVideoCrop: { offsetX: 0, offsetY: 0 },
  };
  const cropSource = existing || draft || null;
  if (!cropSource) return base;

  return {
    ...base,
    regularCrop: cropSource.regularCrop ?? base.regularCrop,
    powerCrop: cropSource.powerCrop ?? base.powerCrop,
    regularFaces: emptyFaceMap(cropSource.regularFaces ?? base.regularFaces),
    powerFaces: emptyFaceMap(cropSource.powerFaces ?? base.powerFaces),
    powerVideoZoom: cropSource.powerVideoZoom ?? base.powerVideoZoom,
    powerVideoCrop: cropSource.powerVideoCrop ?? base.powerVideoCrop,
    lockedVideos: cropSource.lockedVideos ?? existing?.lockedVideos,
    // Paths always from catalog so art assignment is frozen correctly
    spriteUrl: AQUARIUM_OVERLAY_SKIN_IDS.has(catalog?.id)
      ? undefined
      : base.spriteUrl ?? cropSource.spriteUrl,
    powerSpriteUrl: AQUARIUM_OVERLAY_SKIN_IDS.has(catalog?.id)
      ? undefined
      : base.powerSpriteUrl ?? cropSource.powerSpriteUrl,
    powerVideoUrl: AQUARIUM_OVERLAY_SKIN_IDS.has(catalog?.id)
      ? undefined
      : base.powerVideoUrl ?? cropSource.powerVideoUrl,
    videoUrl: AQUARIUM_OVERLAY_SKIN_IDS.has(catalog?.id)
      ? undefined
      : base.videoUrl ?? cropSource.videoUrl,
    seededFrom: existing
      ? snapshotHasSpritePaths(existing)
        ? existing.seededFrom || "existing"
        : "path_backfill"
      : draft
        ? "draft"
        : "catalog",
  };
}

/**
 * Ensure every lockable skin has a complete lock snapshot (crop + sprite paths)
 * and is locked — so the user does not have to click through Sprite Lab.
 * Recovery order: existing snapshot → draft → catalog defaults.
 * Never deletes richer existing data; only backfills missing snapshots/paths.
 */
function seedMissingLockedTuningSnapshots(sprite_tuning) {
  let profileDirty = false;

  for (const skinId of SPRITE_TUNING_LOCK_SKIN_IDS) {
    const catalog = catalogSkinById(skinId);
    const flagKey = TUNING_LOCK_FLAG_KEYS[skinId];
    let existing = null;

    try {
      const raw = localStorage.getItem(lockedTuningStorageKey(skinId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") existing = parsed;
      }
    } catch {
      /* ignore */
    }

    if (!existing) {
      const profileSnap = sprite_tuning[skinId]?.snapshot;
      if (profileSnap && typeof profileSnap === "object") existing = profileSnap;
    }

    const draft = loadRawSpriteLabDraft(skinId);
    const needsSeed = !existing;
    const needsPathBackfill = !!(existing && !snapshotHasSpritePaths(existing) && catalog);

    if (!needsSeed && !needsPathBackfill) {
      // Still mirror lock flag into profile if missing
      if (flagKey) {
        try {
          const flag = localStorage.getItem(flagKey);
          const locked = flag === null ? true : flag === "1";
          if (flag === null) localStorage.setItem(flagKey, "1");
          const entry = sprite_tuning[skinId];
          if (!entry || entry.locked !== locked || !entry.snapshot) {
            sprite_tuning[skinId] = {
              ...(entry || {}),
              locked,
              snapshot: existing,
              updatedAt: Date.now(),
            };
            profileDirty = true;
          }
        } catch {
          /* ignore */
        }
      }
      continue;
    }

    const snapshot = {
      ...mergeRecoveredLockSnapshot({ existing, draft, catalog }),
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(lockedTuningStorageKey(skinId), JSON.stringify(snapshot));
    } catch {
      /* ignore quota */
    }

    // Auto-lock so Sprite Lab doesn't ask the user to re-lock each skin.
    // Respect an explicit unlock ("0") — still write the snapshot for when they lock.
    let locked = true;
    if (flagKey) {
      try {
        const flag = localStorage.getItem(flagKey);
        if (flag === "0") locked = false;
        else {
          localStorage.setItem(flagKey, "1");
          locked = true;
        }
      } catch {
        locked = true;
      }
    }

    sprite_tuning[skinId] = {
      ...(sprite_tuning[skinId] || {}),
      locked,
      snapshot,
      updatedAt: Date.now(),
    };
    profileDirty = true;
  }

  return profileDirty;
}

/**
 * On app start:
 * 1) Back up any existing localStorage lock snapshots into the player profile
 * 2) Restore missing localStorage keys from the profile
 * 3) Auto-seed / backfill complete lock snapshots (paths + crop) for every skin
 * Never deletes existing snapshots.
 */
export function hydrateSpriteLabPersistence() {
  const sprite_tuning = { ...readProfileSpriteTuning() };
  let profileDirty = false;

  // Merge localStorage ↔ profile: keep the richer snapshot, never clobber paths/crop with a stub
  for (const skinId of SPRITE_TUNING_LOCK_SKIN_IDS) {
    try {
      let lsSnap = null;
      const raw = localStorage.getItem(lockedTuningStorageKey(skinId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") lsSnap = parsed;
      }
      const profileSnap = sprite_tuning[skinId]?.snapshot;
      const snapshot = preferRicherSnapshot(lsSnap, profileSnap);
      if (!snapshot) continue;

      const flagKey = TUNING_LOCK_FLAG_KEYS[skinId];
      const flag = flagKey ? localStorage.getItem(flagKey) : null;
      const profileLocked = sprite_tuning[skinId]?.locked;
      const locked =
        flag === null
          ? typeof profileLocked === "boolean"
            ? profileLocked
            : true
          : flag === "1";

      sprite_tuning[skinId] = {
        ...(sprite_tuning[skinId] || {}),
        locked,
        snapshot,
        updatedAt: Date.now(),
      };
      profileDirty = true;

      // Keep localStorage in sync when profile won (or LS was missing/stale)
      try {
        if (JSON.stringify(lsSnap) !== JSON.stringify(snapshot)) {
          localStorage.setItem(lockedTuningStorageKey(skinId), JSON.stringify(snapshot));
        }
        if (flagKey && flag === null) {
          localStorage.setItem(flagKey, locked ? "1" : "0");
        }
      } catch {
        /* ignore quota */
      }
    } catch {
      /* ignore */
    }
  }

  // Restore any remaining missing lock flags / snapshots from profile → localStorage
  for (const [skinId, entry] of Object.entries(sprite_tuning)) {
    if (!entry || typeof entry !== "object") continue;
    const flagKey = TUNING_LOCK_FLAG_KEYS[skinId];
    if (flagKey && typeof entry.locked === "boolean") {
      try {
        if (localStorage.getItem(flagKey) === null) {
          localStorage.setItem(flagKey, entry.locked ? "1" : "0");
        }
      } catch {
        /* ignore */
      }
    }
    if (entry.snapshot) {
      try {
        if (!localStorage.getItem(lockedTuningStorageKey(skinId))) {
          localStorage.setItem(lockedTuningStorageKey(skinId), JSON.stringify(entry.snapshot));
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (seedMissingLockedTuningSnapshots(sprite_tuning)) profileDirty = true;
  if (profileDirty) writeProfileSpriteTuningMap(sprite_tuning);
}

/** Featured skins — shop category headers link to these labs first */
export const SPRITE_LAB_SKIN_IDS = ["matrix", "crystal_cut", "ragnarok", "ice", "snow_globe", "blue_gel"];

export const DEFAULT_SPRITE_LAB_SKIN_ID = "matrix";

/** All dice skins with a sprite sheet, featured ones first then A–Z */
export function getSpriteLabSkins() {
  const featured = new Set(SPRITE_LAB_SKIN_IDS);
  const priority = SPRITE_LAB_SKIN_IDS.map((id) => DICE_SKINS.find((s) => s.id === id)).filter(Boolean);
  const rest = DICE_SKINS
    .filter((s) => s.spriteUrl && !featured.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...priority, ...rest];
}

export function isSpriteLabSkin(skinId) {
  return getSpriteLabSkins().some((s) => s.id === skinId);
}

export function spriteLabStorageKey(skinId) {
  return `yourneek_sprite_lab_${skinId}`;
}

export const DEFAULT_SPRITE_CROP = { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 };

export const FACES = [1, 2, 3, 4, 5, 6];

export function emptyFaceMap(source) {
  return Object.fromEntries(
    FACES.map((face) => {
      const from = source?.[face] ?? source?.[String(face)];
      return [face, { x: from?.x ?? 0, y: from?.y ?? 0 }];
    })
  );
}

/** Keep catalog per-face nudges unless the lab draft has a non-zero override. */
export function mergeSpriteLabFaceOffsets(catalogOffsets = {}, draftOffsets, { fullReplace = false } = {}) {
  if (!draftOffsets) return catalogOffsets;
  if (fullReplace) return draftOffsets;
  const merged = { ...catalogOffsets };
  for (const face of FACES) {
    const draft = draftOffsets[face] ?? draftOffsets[String(face)];
    if (draft && (draft.x !== 0 || draft.y !== 0)) {
      merged[face] = draft;
    }
  }
  return merged;
}

export function loadSpriteLabDraft(skinId) {
  try {
    if (skinId === "classic_white") {
      recoverClassicWhiteLockOnce();
    }
    // Locked skins: always prefer the saved lock snapshot. Never wipe it.
    if (isSpriteTuningLocked(skinId)) {
      return loadLockedTuningSnapshot(skinId);
    }

    const key = spriteLabStorageKey(skinId);
    let raw = localStorage.getItem(key);
    if (!raw && skinId === "ragnarok") {
      raw = localStorage.getItem("yourneek_ragnarok_sprite_lab");
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSpriteLabDraft(skinId, payload) {
  try {
    if (isSpriteTuningLocked(skinId)) return;
    localStorage.setItem(spriteLabStorageKey(skinId), JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
}

export function clearSpriteLabDraft(skinId) {
  try {
    localStorage.removeItem(spriteLabStorageKey(skinId));
    if (skinId === "ragnarok") {
      localStorage.removeItem("yourneek_ragnarok_sprite_lab");
    }
  } catch {
    /* ignore */
  }
}

export function buildCatalogSnippet({
  hasPowerSheet,
  hasPowerVideo = false,
  powerVideoUrl = "/assets/matrix_power.mp4",
  regularCrop,
  powerCrop,
  regularFaces,
  powerFaces,
  powerVideoZoom,
  powerVideoCrop,
}) {
  if (hasPowerSheet) {
    return {
      spriteCrop: regularCrop,
      powerSpriteCrop: powerCrop,
      spriteFaceOffsets: { regular: regularFaces, power: powerFaces },
    };
  }
  if (hasPowerVideo) {
    return {
      spriteCrop: regularCrop,
      spriteFaceOffsets: { regular: regularFaces, power: powerFaces },
      powerVideoUrl,
      powerVideoZoom,
      powerVideoCrop,
    };
  }
  return {
    spriteCrop: regularCrop,
    spriteFaceOffsets: { regular: regularFaces },
  };
}

export function tuningFileName(skinId) {
  return `${skinId}SpriteTuning.js`;
}
