import { DICE_SKINS } from "@/lib/shopCatalog";
import { isMatrixTuningLocked } from "@/lib/matrixTuningLock";
import { isDiamondCutTuningLocked } from "@/lib/diamondCutTuningLock";
import { isIceTuningLocked } from "@/lib/iceTuningLock";
import { isRagnarokTuningLocked } from "@/lib/ragnarokTuningLock";
import { isGalaxyTuningLocked } from "@/lib/galaxyTuningLock";
import { isFluoriteTuningLocked } from "@/lib/fluoriteTuningLock";
import { isAmberWaspTuningLocked } from "@/lib/amberWaspTuningLock";
import { isAmethystTuningLocked } from "@/lib/amethystTuningLock";
import { isPaperTuningLocked } from "@/lib/paperTuningLock";
import { isDragonScaleTuningLocked } from "@/lib/dragonScaleTuningLock";
import { isSnowGlobeTuningLocked } from "@/lib/snowGlobeTuningLock";

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
  dragon_scale: isDragonScaleTuningLocked,
  snow_globe: isSnowGlobeTuningLocked,
};

export function isSpriteTuningLocked(skinId) {
  return TUNING_LOCK_CHECKERS[skinId]?.() ?? false;
}

export const SPRITE_TUNING_LOCK_SKIN_IDS = Object.keys(TUNING_LOCK_CHECKERS);

export function lockedTuningStorageKey(skinId) {
  return `yourneek_locked_tuning_${skinId}`;
}

/** Persist slider values when the user taps Lock in Sprite Lab. */
export function saveLockedTuningSnapshot(skinId, payload) {
  try {
    localStorage.setItem(lockedTuningStorageKey(skinId), JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
}

export function loadLockedTuningSnapshot(skinId) {
  try {
    const raw = localStorage.getItem(lockedTuningStorageKey(skinId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Featured skins — shop category headers link to these labs first */
export const SPRITE_LAB_SKIN_IDS = ["matrix", "crystal_cut", "ragnarok", "ice", "snow_globe"];

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

const MATRIX_DRAFT_RESET_FLAG = "yourneek_sprite_lab_matrix_reset_v4";
const MATRIX_LOCKED_SNAPSHOT_RESET_FLAG = "yourneek_locked_tuning_matrix_reset_v1";
const PAPER_DRAFT_RESET_FLAG = "yourneek_sprite_lab_paper_reset_v1";
const DRAGON_SCALE_DRAFT_RESET_FLAG = "yourneek_sprite_lab_dragon_scale_reset_v1";

export function loadSpriteLabDraft(skinId) {
  try {
    if (isSpriteTuningLocked(skinId)) {
      // Matrix locked = catalog file only; drop stale device snapshots once.
      if (skinId === "matrix") {
        if (localStorage.getItem(MATRIX_LOCKED_SNAPSHOT_RESET_FLAG) !== "1") {
          localStorage.removeItem(lockedTuningStorageKey("matrix"));
          localStorage.setItem(MATRIX_LOCKED_SNAPSHOT_RESET_FLAG, "1");
        }
        return null;
      }
      return loadLockedTuningSnapshot(skinId);
    }

    // One-time nuke of the Matrix draft: months of broken crop/nudge values
    // accumulated in localStorage. Clear once, then the lab works from a clean slate.
    if (skinId === "matrix" && localStorage.getItem(MATRIX_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("matrix"));
      localStorage.setItem(MATRIX_DRAFT_RESET_FLAG, "1");
      return null;
    }

    // Prison Dice: old drafts override the locked catalog alignment.
    if (skinId === "paper" && localStorage.getItem(PAPER_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("paper"));
      localStorage.setItem(PAPER_DRAFT_RESET_FLAG, "1");
      return null;
    }

    // Dragon Scale: old drafts override the locked catalog alignment.
    if (skinId === "dragon_scale" && localStorage.getItem(DRAGON_SCALE_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("dragon_scale"));
      localStorage.setItem(DRAGON_SCALE_DRAFT_RESET_FLAG, "1");
      return null;
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
