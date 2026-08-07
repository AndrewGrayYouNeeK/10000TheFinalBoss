const LOCK_KEY = "yourneek_shark_gel_tuning_locked";

/** Shark Tank Sprite Lab is locked by default — no accidental draft tuning. */
export function isSharkGelTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setSharkGelTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockSharkGelTuning() {
  setSharkGelTuningLocked(false);
}

export function lockSharkGelTuning() {
  setSharkGelTuningLocked(true);
}
