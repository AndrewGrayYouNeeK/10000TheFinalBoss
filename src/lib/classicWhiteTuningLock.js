const LOCK_KEY = "yourneek_classic_white_tuning_locked";

/** Classic White starts unlocked in Sprite Lab until you tap Lock. */
export function isClassicWhiteTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return false;
    return v === "1";
  } catch {
    return false;
  }
}

export function setClassicWhiteTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockClassicWhiteTuning() {
  setClassicWhiteTuningLocked(false);
}

export function lockClassicWhiteTuning() {
  setClassicWhiteTuningLocked(true);
}
