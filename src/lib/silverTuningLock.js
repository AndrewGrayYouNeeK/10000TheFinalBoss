const LOCK_KEY = "yourneek_silver_tuning_locked";

/** Chrome Silver sprite tuning is locked by default — only catalog values apply in-game. */
export function isSilverTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setSilverTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockSilverTuning() {
  setSilverTuningLocked(false);
}

export function lockSilverTuning() {
  setSilverTuningLocked(true);
}
