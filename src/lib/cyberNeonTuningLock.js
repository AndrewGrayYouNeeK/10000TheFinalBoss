const LOCK_KEY = "yourneek_cyber_neon_tuning_locked";

/** Cyber Neon sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isCyberNeonTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setCyberNeonTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockCyberNeonTuning() {
  setCyberNeonTuningLocked(false);
}

export function lockCyberNeonTuning() {
  setCyberNeonTuningLocked(true);
}
