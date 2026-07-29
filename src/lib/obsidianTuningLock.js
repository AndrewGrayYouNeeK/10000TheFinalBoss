const LOCK_KEY = "yourneek_obsidian_tuning_locked";

/** Damascus (obsidian) sprite tuning is locked by default. When locked, getSkin() applies the saved lock snapshot (crop + sprite paths), not catalog-only defaults. */
export function isObsidianTuningLocked() {
  try {
    const v = localStorage.getItem(LOCK_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setObsidianTuningLocked(locked) {
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function unlockObsidianTuning() {
  setObsidianTuningLocked(false);
}

export function lockObsidianTuning() {
  setObsidianTuningLocked(true);
}
