const LOCK_KEY = "yourneek_fluorite_tuning_locked";

/** Alexandrite (fluorite) sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isFluoriteTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setFluoriteTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockFluoriteTuning() {
  setFluoriteTuningLocked(false);
}

export function lockFluoriteTuning() {
  setFluoriteTuningLocked(true);
}
