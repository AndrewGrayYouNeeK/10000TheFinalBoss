const STORAGE_KEY = "dice10k_local_game";

/** @typedef {{ names: string[], playerSkins: object[] }} RollOffSetup */

/** @typedef {{
 *   playerNames: string[],
 *   game: object|null,
 *   rollOffSetup: RollOffSetup|null,
 *   bloodWaterLocked: boolean,
 *   revealedTurnKey: number|null,
 *   winnerAwarded?: boolean,
 *   savedAt?: number,
 * }} LocalGameSnapshot */

export function namesMatch(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((name, i) => name === b[i]);
}

/** @returns {LocalGameSnapshot|null} */
export function loadLocalGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.playerNames) || data.playerNames.length === 0) return null;
    if (!data.game && !data.rollOffSetup) return null;
    return {
      playerNames: data.playerNames,
      game: data.game ?? null,
      rollOffSetup: data.rollOffSetup ?? null,
      bloodWaterLocked: !!data.bloodWaterLocked,
      revealedTurnKey: data.revealedTurnKey ?? null,
      winnerAwarded: !!data.winnerAwarded,
      savedAt: data.savedAt,
    };
  } catch {
    return null;
  }
}

/** @param {LocalGameSnapshot} snapshot */
export function saveLocalGame(snapshot) {
  if (!snapshot?.playerNames?.length) return;
  if (!snapshot.game && !snapshot.rollOffSetup) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), ...snapshot })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearLocalGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasResumableLocalGame() {
  const saved = loadLocalGame();
  return !!(saved && (saved.game || saved.rollOffSetup));
}
