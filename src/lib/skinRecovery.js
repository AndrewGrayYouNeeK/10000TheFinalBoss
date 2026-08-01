/**
 * One-shot recovery when sprite-lab localStorage corrupts dice faces or profile skins vanish.
 * Never wipes entire sprite_tuning or all lab keys — only removes individually corrupt snapshots.
 */
import { ALL_DICE_SKIN_IDS } from "./devUnlock";
import { loadProfile, updateProfile } from "./localProfile";
import { DICE_SKINS } from "./shopCatalog";
import {
  isUsableSpriteLabSnapshot,
  lockedTuningStorageKey,
  sanitizeSpriteLabSnapshot,
  spriteLabStorageKey,
} from "./spriteLab";

const RECOVERY_VERSION_KEY = "yourneek_dice_recovery_v5";

function repairSnapshot(skinId, snapshot) {
  if (!snapshot || typeof snapshot !== "object") return null;
  const sanitized = sanitizeSpriteLabSnapshot(skinId, snapshot);
  if (!isUsableSpriteLabSnapshot(skinId, sanitized)) return null;
  return sanitized;
}

/** Reset corrupt sprite-lab saves and restore owned dice skins. Safe to run every launch. */
export function recoverCorruptDiceState() {
  if (typeof localStorage === "undefined") return;

  let repaired = false;

  for (const skin of DICE_SKINS) {
    const skinId = skin.id;
    const keys = [spriteLabStorageKey(skinId), lockedTuningStorageKey(skinId)];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;
        const fixed = repairSnapshot(skinId, parsed);
        if (!fixed) {
          localStorage.removeItem(key);
          repaired = true;
          continue;
        }
        if (JSON.stringify(fixed) !== raw) {
          localStorage.setItem(key, JSON.stringify(fixed));
          repaired = true;
        }
      } catch {
        localStorage.removeItem(key);
        repaired = true;
      }
    }
  }

  const profile = loadProfile();
  const spriteTuning = profile.sprite_tuning ?? {};
  let tuningDirty = false;
  const nextTuning = { ...spriteTuning };
  for (const [skinId, entry] of Object.entries(spriteTuning)) {
    const snap = entry?.snapshot;
    if (!snap) continue;
    const fixed = repairSnapshot(skinId, snap);
    if (!fixed) {
      delete nextTuning[skinId];
      tuningDirty = true;
      repaired = true;
      continue;
    }
    if (JSON.stringify(fixed) !== JSON.stringify(snap)) {
      nextTuning[skinId] = { ...entry, snapshot: fixed, updatedAt: Date.now() };
      tuningDirty = true;
      repaired = true;
    }
  }
  if (tuningDirty) {
    updateProfile({ sprite_tuning: nextTuning });
  }

  const owned = profile.owned_skins ?? [];
  const needsSkinRestore =
    owned.length < Math.min(10, ALL_DICE_SKIN_IDS.length / 2) || !owned.includes("classic_white");

  if (needsSkinRestore) {
    updateProfile({ owned_skins: [...new Set([...ALL_DICE_SKIN_IDS, ...owned])] });
    repaired = true;
  }

  if (!localStorage.getItem(RECOVERY_VERSION_KEY)) {
    localStorage.setItem(RECOVERY_VERSION_KEY, String(Date.now()));
  }

  if (repaired) {
    localStorage.setItem(RECOVERY_VERSION_KEY, String(Date.now()));
  }
}
