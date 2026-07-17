const LOCK_KEY = "yourneek_amber_wasp_tuning_locked";

/** Amber Wasp sprite tuning is locked by default — only catalog values apply in-game. */
export function isAmberWaspTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setAmberWaspTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockAmberWaspTuning() {
  setAmberWaspTuningLocked(false);
}

export function lockAmberWaspTuning() {
  setAmberWaspTuningLocked(true);
}
