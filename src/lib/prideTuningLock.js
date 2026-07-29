const LOCK_KEY = "yourneek_pride_tuning_locked";

/** Pride sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isPrideTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setPrideTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockPrideTuning() {
  setPrideTuningLocked(false);
}

export function lockPrideTuning() {
  setPrideTuningLocked(true);
}
