const LOCK_KEY = "yourneek_labradorite_tuning_locked";

/** Labradorite sprite tuning is locked by default — only catalog values apply in-game. */
export function isLabradoriteTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setLabradoriteTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockLabradoriteTuning() {
  setLabradoriteTuningLocked(false);
}

export function lockLabradoriteTuning() {
  setLabradoriteTuningLocked(true);
}
