const LOCK_KEY = "yourneek_gold_tuning_locked";

/** Molten Gold sprite tuning is locked by default — only catalog values apply in-game. */
export function isGoldTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setGoldTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockGoldTuning() {
  setGoldTuningLocked(false);
}

export function lockGoldTuning() {
  setGoldTuningLocked(true);
}
