const LOCK_KEY = "yourneek_teal_crackle_tuning_locked";

/** Antarctic Blue Ice sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isTealCrackleTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setTealCrackleTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockTealCrackleTuning() {
  setTealCrackleTuningLocked(false);
}

export function lockTealCrackleTuning() {
  setTealCrackleTuningLocked(true);
}
