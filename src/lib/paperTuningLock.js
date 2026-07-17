const LOCK_KEY = "yourneek_paper_tuning_locked";

/** Prison Dice sprite tuning is locked by default — only catalog values apply in-game. */
export function isPaperTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setPaperTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockPaperTuning() {
  setPaperTuningLocked(false);
}

export function lockPaperTuning() {
  setPaperTuningLocked(true);
}
