const LOCK_KEY = "yourneek_diamond_cut_tuning_locked";

/** Diamond Cut (crystal_cut) sprite tuning is locked by default — only catalog values apply in-game. */
export function isDiamondCutTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setDiamondCutTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockDiamondCutTuning() {
  setDiamondCutTuningLocked(false);
}

export function lockDiamondCutTuning() {
  setDiamondCutTuningLocked(true);
}
