const LOCK_KEY = "yourneek_aquamarine_tuning_locked";

/** Aquamarine sprite tuning is locked by default — only catalog values apply in-game. */
export function isAquamarineTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setAquamarineTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockAquamarineTuning() {
  setAquamarineTuningLocked(false);
}

export function lockAquamarineTuning() {
  setAquamarineTuningLocked(true);
}
