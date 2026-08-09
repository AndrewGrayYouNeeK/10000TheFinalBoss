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

function gameTotalScore(game) {
  if (!Array.isArray(game?.players)) return 0;
  return game.players.reduce((sum, p) => sum + (Number(p?.score) || 0), 0);
}

/** True for a brand-new board (HMR remount often briefly lands here before restore). */
export function isFreshUnstartedGame(game) {
  if (!game?.players?.length) return true;
  return (
    gameTotalScore(game) === 0 &&
    !(Number(game.turnScore) > 0) &&
    !(Number(game.bustCount) > 0) &&
    !game.winner &&
    !game.hasRolled
  );
}

/**
 * Strip transient presentation flags so HMR/remount restore cannot auto-replay
 * Shark Bite FX or hide dice as if a cast just happened.
 */
export function sanitizeRestoredGame(game) {
  if (!game || typeof game !== "object") return game;
  return {
    ...game,
    sharkBiteFx: false,
    sharkDiceHidden: false,
    matrixGlitchFx: false,
    matrixGlitchDieIds: [],
  };
}

/** Prefer keeping the richer mid-match save when an HMR remount races a fresh board. */
function shouldBlockOverwrite(existing, snapshot) {
  if (!existing?.game || !snapshot?.game) return false;
  if (!namesMatch(existing.playerNames, snapshot.playerNames)) return false;
  if (snapshot.winnerAwarded || snapshot.game?.winner) return false;

  const existingScore = gameTotalScore(existing.game);
  const snapScore = gameTotalScore(snapshot.game);

  // Never clobber a scored mid-match with a lower/zero board from remount init.
  if (existingScore > 0 && snapScore < existingScore) return true;

  if (!isFreshUnstartedGame(existing.game) && isFreshUnstartedGame(snapshot.game)) {
    return true;
  }
  return false;
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
      game: data.game ? sanitizeRestoredGame(data.game) : null,
      rollOffSetup: data.rollOffSetup ?? null,
      bloodWaterLocked: !!data.bloodWaterLocked,
      revealedTurnKey: data.revealedTurnKey ?? null,
      winnerAwarded: !!data.winnerAwarded,
      savedAt: data.savedAt,
    };
  } catch (err) {
    console.error("[YouNeeK 10,000] Could not read the saved local game.", err);
    return null;
  }
}

/** @param {LocalGameSnapshot} snapshot */
export function saveLocalGame(snapshot) {
  if (!snapshot?.playerNames?.length) return;
  if (!snapshot.game && !snapshot.rollOffSetup) return;
  try {
    const existing = loadLocalGameRaw();
    if (shouldBlockOverwrite(existing, snapshot)) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), ...snapshot })
    );
  } catch (err) {
    // Quota / private mode — the match keeps going, it just will not resume.
    console.warn("[YouNeeK 10,000] Could not save the local game snapshot.", err);
  }
}

/** Raw load without sanitize — used so save guards see true stored scores/FX flags. */
function loadLocalGameRaw() {
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
  } catch (err) {
    console.error("[YouNeeK 10,000] Could not read the stored local game.", err);
    return null;
  }
}

export function clearLocalGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[YouNeeK 10,000] Could not clear the saved local game.", err);
  }
}

export function hasResumableLocalGame() {
  const saved = loadLocalGame();
  return !!(saved && (saved.game || saved.rollOffSetup));
}
