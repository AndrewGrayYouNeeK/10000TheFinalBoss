const LOCK_KEY = "yourneek_neon_grid_tuning_locked";

/** Neon Grid sprite tuning is locked by default — only catalog values apply in-game. */
export function isNeonGridTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setNeonGridTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockNeonGridTuning() {
  setNeonGridTuningLocked(false);
}

export function lockNeonGridTuning() {
  setNeonGridTuningLocked(true);
}
