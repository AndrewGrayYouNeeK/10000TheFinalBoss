const LOCK_KEY = "yourneek_galaxy_tuning_locked";

/** Galaxy sprite tuning is locked by default — only catalog values apply in-game. */
export function isGalaxyTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setGalaxyTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockGalaxyTuning() {
  setGalaxyTuningLocked(false);
}

export function lockGalaxyTuning() {
  setGalaxyTuningLocked(true);
}
