const LOCK_KEY = "yourneek_dragon_scale_tuning_locked";

/** Dragon Scale sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isDragonScaleTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setDragonScaleTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockDragonScaleTuning() {
  setDragonScaleTuningLocked(false);
}

export function lockDragonScaleTuning() {
  setDragonScaleTuningLocked(true);
}
