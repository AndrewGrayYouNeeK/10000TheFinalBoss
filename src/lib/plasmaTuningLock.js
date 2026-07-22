const LOCK_KEY = "yourneek_plasma_tuning_locked";

/** Plasma Ball sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isPlasmaTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setPlasmaTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockPlasmaTuning() {
  setPlasmaTuningLocked(false);
}

export function lockPlasmaTuning() {
  setPlasmaTuningLocked(true);
}
