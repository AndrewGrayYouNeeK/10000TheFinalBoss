const LOCK_KEY = "yourneek_snow_globe_tuning_locked";

/** Snow Globe (Frosty) Sprite Lab is locked by default — no accidental draft tuning. */
export function isSnowGlobeTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setSnowGlobeTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockSnowGlobeTuning() {
  setSnowGlobeTuningLocked(false);
}

export function lockSnowGlobeTuning() {
  setSnowGlobeTuningLocked(true);
}
