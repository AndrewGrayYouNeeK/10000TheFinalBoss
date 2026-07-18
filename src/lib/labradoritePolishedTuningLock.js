const LOCK_KEY = "yourneek_labradorite_polished_tuning_locked";

/** Labradorite Polished sprite tuning is locked by default — only catalog values apply in-game. */
export function isLabradoritePolishedTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setLabradoritePolishedTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockLabradoritePolishedTuning() {
  setLabradoritePolishedTuningLocked(false);
}

export function lockLabradoritePolishedTuning() {
  setLabradoritePolishedTuningLocked(true);
}
