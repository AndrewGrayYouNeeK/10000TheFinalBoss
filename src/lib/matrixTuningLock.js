const LOCK_KEY = "yourneek_matrix_tuning_locked";

/** Matrix sprite tuning is locked by default — only catalog values apply in-game. */
export function isMatrixTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setMatrixTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockMatrixTuning() {
  setMatrixTuningLocked(false);
}

export function lockMatrixTuning() {
  setMatrixTuningLocked(true);
}
