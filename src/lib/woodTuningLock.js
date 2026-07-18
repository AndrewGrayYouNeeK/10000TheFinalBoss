const LOCK_KEY = "yourneek_wood_tuning_locked";

/** Burl Wood sprite tuning is locked by default — only catalog values apply in-game. */
export function isWoodTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setWoodTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockWoodTuning() {
  setWoodTuningLocked(false);
}

export function lockWoodTuning() {
  setWoodTuningLocked(true);
}
