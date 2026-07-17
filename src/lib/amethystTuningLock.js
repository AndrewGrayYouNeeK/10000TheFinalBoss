const LOCK_KEY = "yourneek_amethyst_tuning_locked";

/** Amethyst sprite tuning is locked by default — only catalog values apply in-game. */
export function isAmethystTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setAmethystTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockAmethystTuning() {
  setAmethystTuningLocked(false);
}

export function lockAmethystTuning() {
  setAmethystTuningLocked(true);
}
