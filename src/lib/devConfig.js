/**
 * TEMP/DEV toggles — remove this file when testing flags are no longer needed.
 */

/** TEMP/DEV: After hot dice, grant power charge immediately for all skins (Game + Story). */
export const TEMP_HOT_DICE_ALWAYS_POWER = true;

/**
 * TEMP/DEV: Show in-game "Grant power" button (instant charge for testing powers).
 * Same enable/disable path as hot-dice power testing (`?devPower=1|0`).
 */
export const TEMP_SHOW_GRANT_POWER_BUTTON = true;

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

/** TEMP/DEV: In-match Grant Power button (same gate as hot-dice power testing). */
export function isDevPowerToolsEnabled() {
  if (!TEMP_SHOW_GRANT_POWER_BUTTON) return false;
  return isTempHotDiceAlwaysPowerEnabled();
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

/**
 * TEMP/DEV: Instantly give a power charge so tray shows power-mode dice and Fire works.
 * Does not touch sacred roll/score rules — only sets charge flags on the player.
 */
export function grantDevPowerCharge(state, playerIndex = state?.currentIndex) {
  if (!state?.players?.[playerIndex]) return state;
  const idx = playerIndex;
  return {
    ...state,
    skinPowerUsedThisTurn: false,
    players: state.players.map((p, i) => {
      if (i !== idx) return p;
      if (!p.powerCharge) return { ...p, powerCharge: true, powerCharges: 0 };
      return {
        ...p,
        powerCharge: true,
        powerCharges: Math.max(0, Number(p.powerCharges) || 0) + 1,
      };
    }),
  };
}
