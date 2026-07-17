const LOCK_KEY = "yourneek_ragnarok_tuning_locked";

/** Ragnarok sprite tuning is locked by default — only catalog values apply in-game. */
export function isRagnarokTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setRagnarokTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockRagnarokTuning() {
  setRagnarokTuningLocked(false);
}

export function lockRagnarokTuning() {
  setRagnarokTuningLocked(true);
}
