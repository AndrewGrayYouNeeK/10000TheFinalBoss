import { CLASSIC_WHITE_LOCKED_SNAPSHOT } from "./classicWhiteSpriteTuning";

const LOCK_KEY = "yourneek_classic_white_tuning_locked";
const RESTORE_KEY = "yourneek_classic_white_restored_baseline_v1";
const RECOVER_KEY = "yourneek_classic_white_recovered_lock_v1";
const DRAFT_KEY = "yourneek_sprite_lab_classic_white";
const SNAPSHOT_KEY = "yourneek_locked_tuning_classic_white";

/**
 * Undo the accidental baseline wipe — put your saved lock snapshot back.
 */
export function recoverClassicWhiteLockOnce() {
  try {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(RECOVER_KEY) === "1") return;

    const snap = {
      ...CLASSIC_WHITE_LOCKED_SNAPSHOT,
      savedAt: Date.now(),
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
    localStorage.setItem(LOCK_KEY, "1");
    // Clear the bad "wipe baseline" flag so it can't fire again.
    localStorage.removeItem(RESTORE_KEY);
    localStorage.setItem(RECOVER_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Classic White stays locked to your saved Sprite Lab snapshot by default. */
export function isClassicWhiteTuningLocked() {
  recoverClassicWhiteLockOnce();
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setClassicWhiteTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockClassicWhiteTuning() {
  setClassicWhiteTuningLocked(false);
}

export function lockClassicWhiteTuning() {
  setClassicWhiteTuningLocked(true);
}
