const LOCK_KEY = "yourneek_ruby_tuning_locked";

/** Ruby sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isRubyTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setRubyTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockRubyTuning() {
  setRubyTuningLocked(false);
}

export function lockRubyTuning() {
  setRubyTuningLocked(true);
}
