const LOCK_KEY = "yourneek_diamond_ruby_tuning_locked";

/** Diamond Ruby starts unlocked in Sprite Lab until you tap Lock. */
export function isDiamondRubyTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return false;
    return v === "1";
  } catch {
    return false;
  }
}

export function setDiamondRubyTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockDiamondRubyTuning() {
  setDiamondRubyTuningLocked(false);
}

export function lockDiamondRubyTuning() {
  setDiamondRubyTuningLocked(true);
}
