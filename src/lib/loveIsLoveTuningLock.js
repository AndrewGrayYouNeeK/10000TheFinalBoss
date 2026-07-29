const LOCK_KEY = "yourneek_love_is_love_tuning_locked";

/** Love Is Love sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isLoveIsLoveTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setLoveIsLoveTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockLoveIsLoveTuning() {
  setLoveIsLoveTuningLocked(false);
}

export function lockLoveIsLoveTuning() {
  setLoveIsLoveTuningLocked(true);
}
