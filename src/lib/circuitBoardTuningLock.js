const LOCK_KEY = "yourneek_circuit_board_tuning_locked";

/** Circuit Board sprite tuning is locked by default — only catalog values apply in-game. */
export function isCircuitBoardTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setCircuitBoardTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockCircuitBoardTuning() {
  setCircuitBoardTuningLocked(false);
}

export function lockCircuitBoardTuning() {
  setCircuitBoardTuningLocked(true);
}
