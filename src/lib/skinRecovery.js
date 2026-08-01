/**
 * One-shot recovery when sprite-lab localStorage corrupts dice faces or profile skins vanish.
 */
import { ALL_DICE_SKIN_IDS } from "./devUnlock";
import { loadProfile, updateProfile } from "./localProfile";
import { DICE_SKINS } from "./shopCatalog";
import {
  isUsableSpriteLabSnapshot,
  lockedTuningStorageKey,
  spriteLabStorageKey,
} from "./spriteLab";

const RECOVERY_VERSION_KEY = "yourneek_dice_recovery_v4";

function snapshotNeedsRepair(skinId, snapshot) {
  return !isUsableSpriteLabSnapshot(skinId, snapshot);
}

function purgeSpriteLabKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (
      k?.startsWith("yourneek_sprite_lab_") ||
      k?.startsWith("yourneek_locked_tuning_")
    ) {
      keys.push(k);
    }
  }
  for (const k of keys) localStorage.removeItem(k);
}

/** Reset corrupt sprite-lab saves and restore owned dice skins. Safe to run every launch. */
export function recoverCorruptDiceState() {
  if (typeof localStorage === "undefined") return;

  let repaired = false;
  let hasCorruption = false;

  for (const skin of DICE_SKINS) {
    const skinId = skin.id;
    const keys = [spriteLabStorageKey(skinId), lockedTuningStorageKey(skinId)];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;
        if (snapshotNeedsRepair(skinId, parsed)) {
          hasCorruption = true;
          localStorage.removeItem(key);
          repaired = true;
        }
      } catch {
        localStorage.removeItem(key);
        hasCorruption = true;
        repaired = true;
      }
    }
  }

  const ranV3 = localStorage.getItem(RECOVERY_VERSION_KEY);
  if (!ranV3 || hasCorruption) {
    purgeSpriteLabKeys();
    updateProfile({
      sprite_tuning: {},
      owned_skins: [...new Set([...ALL_DICE_SKIN_IDS])],
    });
    localStorage.setItem(RECOVERY_VERSION_KEY, String(Date.now()));
    return;
  }

  const profile = loadProfile();
  const owned = profile.owned_skins ?? [];
  const needsSkinRestore = owned.length < Math.min(10, ALL_DICE_SKIN_IDS.length / 2) || !owned.includes("classic_white");

  if (needsSkinRestore) {
    updateProfile({ owned_skins: [...new Set([...ALL_DICE_SKIN_IDS, ...owned])] });
    repaired = true;
  }

  const spriteTuning = profile.sprite_tuning ?? {};
  let tuningDirty = false;
  const nextTuning = { ...spriteTuning };
  for (const [skinId, entry] of Object.entries(spriteTuning)) {
    const snap = entry?.snapshot;
    if (!snap || !snapshotNeedsRepair(skinId, snap)) continue;
    delete nextTuning[skinId];
    tuningDirty = true;
    repaired = true;
  }
  if (tuningDirty) {
    updateProfile({ sprite_tuning: nextTuning });
  }

  if (repaired) {
    localStorage.setItem(RECOVERY_VERSION_KEY, String(Date.now()));
  }
}
