const LOCK_KEY = "yourneek_ice_tuning_locked";

/** Frozen Ice sprite tuning is locked by default — only catalog values apply in-game. */
export function isIceTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setIceTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockIceTuning() {
  setIceTuningLocked(false);
}

export function lockIceTuning() {
  setIceTuningLocked(true);
}
