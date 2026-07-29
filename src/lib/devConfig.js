/**
 * TEMP/DEV toggles — remove this file when testing flags are no longer needed.
 */

/** TEMP/DEV: After hot dice, grant power charge immediately for all skins (Game + Story). */
export const TEMP_HOT_DICE_ALWAYS_POWER = true;

const SESSION_KEY = "dice10k_devPower";

/**
 * Whether local-game hot-dice → instant power charge is active.
 * Enable: set TEMP_HOT_DICE_ALWAYS_POWER, `?devPower=1`, or sessionStorage.
 * Disable: `?devPower=0` or `sessionStorage.setItem("dice10k_devPower", "0")`.
 */
export function isTempHotDiceAlwaysPowerEnabled() {
  if (typeof window === "undefined") return TEMP_HOT_DICE_ALWAYS_POWER;

  const query = new URLSearchParams(window.location.search).get("devPower");
  if (query === "1") return true;
  if (query === "0") return false;

  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;

  return TEMP_HOT_DICE_ALWAYS_POWER;
}

/** TEMP/DEV: Toggle for this browser session. */
export function setTempHotDiceAlwaysPower(enabled) {
  sessionStorage.setItem(SESSION_KEY, enabled ? "1" : "0");
}

/** Options for confirmAndReroll when dev hot-dice → power testing is active. */
export function getHotDicePowerConfirmOptions() {
  if (!isTempHotDiceAlwaysPowerEnabled()) return undefined;
  return { powerChargeHotDiceThreshold: 1 };
}

/** Story mode: first hot dice earns a power charge (no dev flag required). */
export function getStoryHotDicePowerConfirmOptions() {
  return { powerChargeHotDiceThreshold: 1 };
}
