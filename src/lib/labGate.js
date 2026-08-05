/** Session unlock for creator labs (Sprite Lab, Felt Lab, etc.). */

export const LAB_GATE_STORAGE_KEY = "dice10k_lab_gate_unlocked";

function readConfiguredPassword() {
  const raw = import.meta.env.VITE_LAB_GATE_PASSWORD;
  return typeof raw === "string" ? raw.trim() : "";
}

/** True in Vite dev — local play-testing skips the password wall. */
export function isLabGateBypassed() {
  return Boolean(import.meta.env.DEV);
}

export function isLabUnlocked() {
  if (isLabGateBypassed()) return true;
  try {
    return sessionStorage.getItem(LAB_GATE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLabUnlocked(enabled) {
  try {
    if (enabled) sessionStorage.setItem(LAB_GATE_STORAGE_KEY, "1");
    else sessionStorage.removeItem(LAB_GATE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether a production password was baked into the build. */
export function hasLabGatePassword() {
  return readConfiguredPassword().length > 0;
}

/**
 * @param {string} password
 * @returns {{ ok: boolean, reason?: "empty" | "not_configured" | "mismatch" }}
 */
export function tryUnlockLab(password) {
  if (isLabGateBypassed()) {
    setLabUnlocked(true);
    return { ok: true };
  }
  const expected = readConfiguredPassword();
  if (!expected) return { ok: false, reason: "not_configured" };
  const attempt = typeof password === "string" ? password : "";
  if (!attempt.trim()) return { ok: false, reason: "empty" };
  if (attempt !== expected) return { ok: false, reason: "mismatch" };
  setLabUnlocked(true);
  return { ok: true };
}
