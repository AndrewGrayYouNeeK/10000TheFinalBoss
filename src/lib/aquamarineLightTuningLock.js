const LOCK_KEY = "yourneek_aquamarine_light_tuning_locked";

/** Aquamarine Ice sprite tuning is locked by default — only catalog values apply in-game. */
export function isAquamarineLightTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setAquamarineLightTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockAquamarineLightTuning() {
  setAquamarineLightTuningLocked(false);
}

export function lockAquamarineLightTuning() {
  setAquamarineLightTuningLocked(true);
}
