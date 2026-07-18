const LOCK_KEY = "yourneek_moonstone_tuning_locked";

/** Moonstone sprite tuning is locked by default — only catalog values apply in-game. */
export function isMoonstoneTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setMoonstoneTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockMoonstoneTuning() {
  setMoonstoneTuningLocked(false);
}

export function lockMoonstoneTuning() {
  setMoonstoneTuningLocked(true);
}
