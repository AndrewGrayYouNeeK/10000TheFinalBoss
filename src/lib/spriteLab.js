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
  dragon_scale: isDragonScaleTuningLocked,
  snow_globe: isSnowGlobeTuningLocked,
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
const TEAL_CRACKLE_DRAFT_RESET_FLAG = "yourneek_sprite_lab_teal_crackle_reset_v1";
const AQUAMARINE_LIGHT_DRAFT_RESET_FLAG = "yourneek_sprite_lab_aquamarine_light_reset_v1";
const AQUAMARINE_DRAFT_RESET_FLAG = "yourneek_sprite_lab_aquamarine_reset_v1";
const WOOD_DRAFT_RESET_FLAG = "yourneek_sprite_lab_wood_reset_v1";
const SILVER_DRAFT_RESET_FLAG = "yourneek_sprite_lab_silver_reset_v1";
const CIRCUIT_BOARD_DRAFT_RESET_FLAG = "yourneek_sprite_lab_circuit_board_reset_v1";
const CYBER_NEON_DRAFT_RESET_FLAG = "yourneek_sprite_lab_cyber_neon_reset_v1";
const OBSIDIAN_DRAFT_RESET_FLAG = "yourneek_sprite_lab_obsidian_reset_v1";
const LABRADORITE_DRAFT_RESET_FLAG = "yourneek_sprite_lab_labradorite_reset_v1";
const LABRADORITE_POLISHED_DRAFT_RESET_FLAG = "yourneek_sprite_lab_labradorite_polished_reset_v1";
const LOVE_IS_LOVE_DRAFT_RESET_FLAG = "yourneek_sprite_lab_love_is_love_reset_v1";
const GOLD_DRAFT_RESET_FLAG = "yourneek_sprite_lab_gold_reset_v1";
const MOONSTONE_DRAFT_RESET_FLAG = "yourneek_sprite_lab_moonstone_reset_v1";
const NEON_GRID_DRAFT_RESET_FLAG = "yourneek_sprite_lab_neon_grid_reset_v1";
const PLASMA_DRAFT_RESET_FLAG = "yourneek_sprite_lab_plasma_reset_v1";
const PRIDE_DRAFT_RESET_FLAG = "yourneek_sprite_lab_pride_reset_v1";
const TOXIC_PLASMA_V2_DRAFT_RESET_FLAG = "yourneek_sprite_lab_toxic_plasma_v2_reset_v1";
const RUBY_DRAFT_RESET_FLAG = "yourneek_sprite_lab_ruby_reset_v1";

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

    if (skinId === "teal_crackle" && localStorage.getItem(TEAL_CRACKLE_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("teal_crackle"));
      localStorage.removeItem(lockedTuningStorageKey("teal_crackle"));
      localStorage.setItem(TEAL_CRACKLE_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "aquamarine_light" && localStorage.getItem(AQUAMARINE_LIGHT_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("aquamarine_light"));
      localStorage.removeItem(lockedTuningStorageKey("aquamarine_light"));
      localStorage.setItem(AQUAMARINE_LIGHT_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "aquamarine" && localStorage.getItem(AQUAMARINE_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("aquamarine"));
      localStorage.removeItem(lockedTuningStorageKey("aquamarine"));
      localStorage.setItem(AQUAMARINE_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "wood" && localStorage.getItem(WOOD_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("wood"));
      localStorage.removeItem(lockedTuningStorageKey("wood"));
      localStorage.setItem(WOOD_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "silver" && localStorage.getItem(SILVER_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("silver"));
      localStorage.removeItem(lockedTuningStorageKey("silver"));
      localStorage.setItem(SILVER_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "circuit_board" && localStorage.getItem(CIRCUIT_BOARD_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("circuit_board"));
      localStorage.removeItem(lockedTuningStorageKey("circuit_board"));
      localStorage.setItem(CIRCUIT_BOARD_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "cyber_neon" && localStorage.getItem(CYBER_NEON_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("cyber_neon"));
      localStorage.removeItem(lockedTuningStorageKey("cyber_neon"));
      localStorage.setItem(CYBER_NEON_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "obsidian" && localStorage.getItem(OBSIDIAN_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("obsidian"));
      localStorage.removeItem(lockedTuningStorageKey("obsidian"));
      localStorage.setItem(OBSIDIAN_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "labradorite" && localStorage.getItem(LABRADORITE_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("labradorite"));
      localStorage.removeItem(lockedTuningStorageKey("labradorite"));
      localStorage.setItem(LABRADORITE_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "labradorite_polished" && localStorage.getItem(LABRADORITE_POLISHED_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("labradorite_polished"));
      localStorage.removeItem(lockedTuningStorageKey("labradorite_polished"));
      localStorage.setItem(LABRADORITE_POLISHED_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "love_is_love" && localStorage.getItem(LOVE_IS_LOVE_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("love_is_love"));
      localStorage.removeItem(lockedTuningStorageKey("love_is_love"));
      localStorage.setItem(LOVE_IS_LOVE_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "gold" && localStorage.getItem(GOLD_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("gold"));
      localStorage.removeItem(lockedTuningStorageKey("gold"));
      localStorage.setItem(GOLD_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "moonstone" && localStorage.getItem(MOONSTONE_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("moonstone"));
      localStorage.removeItem(lockedTuningStorageKey("moonstone"));
      localStorage.setItem(MOONSTONE_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "neon_grid" && localStorage.getItem(NEON_GRID_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("neon_grid"));
      localStorage.removeItem(lockedTuningStorageKey("neon_grid"));
      localStorage.setItem(NEON_GRID_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "plasma" && localStorage.getItem(PLASMA_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("plasma"));
      localStorage.removeItem(lockedTuningStorageKey("plasma"));
      localStorage.setItem(PLASMA_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "pride" && localStorage.getItem(PRIDE_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("pride"));
      localStorage.removeItem(lockedTuningStorageKey("pride"));
      localStorage.setItem(PRIDE_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "toxic_plasma_v2" && localStorage.getItem(TOXIC_PLASMA_V2_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("toxic_plasma_v2"));
      localStorage.removeItem(lockedTuningStorageKey("toxic_plasma_v2"));
      localStorage.setItem(TOXIC_PLASMA_V2_DRAFT_RESET_FLAG, "1");
      return null;
    }

    if (skinId === "ruby" && localStorage.getItem(RUBY_DRAFT_RESET_FLAG) !== "1") {
      localStorage.removeItem(spriteLabStorageKey("ruby"));
      localStorage.removeItem(lockedTuningStorageKey("ruby"));
      localStorage.setItem(RUBY_DRAFT_RESET_FLAG, "1");
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
