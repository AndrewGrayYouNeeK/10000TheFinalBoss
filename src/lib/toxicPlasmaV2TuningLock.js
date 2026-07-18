const LOCK_KEY = "yourneek_toxic_plasma_v2_tuning_locked";

/** Radiation (toxic_plasma_v2) sprite tuning is locked by default — only catalog values apply in-game. */
export function isToxicPlasmaV2TuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setToxicPlasmaV2TuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockToxicPlasmaV2Tuning() {
  setToxicPlasmaV2TuningLocked(false);
}

export function lockToxicPlasmaV2Tuning() {
  setToxicPlasmaV2TuningLocked(true);
}
