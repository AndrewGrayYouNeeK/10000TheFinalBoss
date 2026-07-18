const LOCK_KEY = "yourneek_ruby_tuning_locked";

/** Ruby sprite tuning is locked by default — only catalog values apply in-game. */
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
