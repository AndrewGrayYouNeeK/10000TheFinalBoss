const LOCK_KEY = "yourneek_ice_tuning_locked";

/** Frozen Ice starts unlocked in Sprite Lab until you tap Lock. */
export function isIceTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return false;
    return v === "1";
  } catch {
    return false;
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
