const key = (bossId) => `yourneek_story_fight_${bossId}`;

/** @typedef {{ game: object, dialogue: string|null, bloodWaterLocked: boolean, farkleShieldUsed: boolean, rewardsClaimed: boolean, fightStarted?: boolean }} StoryFightSnapshot */

function gameTotalScore(game) {
  if (!Array.isArray(game?.players)) return 0;
  return game.players.reduce((sum, p) => sum + (Number(p?.score) || 0), 0);
}

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

/** Clear transient FX so remount restore cannot auto-play Shark Bite. */
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

function shouldBlockOverwrite(existing, snapshot) {
  if (!existing?.game || !snapshot?.game) return false;
  if (snapshot.dialogue === "win" || snapshot.dialogue === "lose") return false;
  if (snapshot.game?.winner) return false;

  const existingScore = gameTotalScore(existing.game);
  const snapScore = gameTotalScore(snapshot.game);
  if (existingScore > 0 && snapScore < existingScore) return true;
  if (!isFreshUnstartedGame(existing.game) && isFreshUnstartedGame(snapshot.game)) {
    return true;
  }
  return false;
}

function loadStoryFightRaw(bossId) {
  if (!bossId) return null;
  try {
    const raw = sessionStorage.getItem(key(bossId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.bossId !== bossId || !data?.game) return null;
    const ended = !!data.game.winner;
    if (ended && data.dialogue !== "win" && data.dialogue !== "lose") return null;
    return {
      game: data.game,
      dialogue: data.dialogue ?? null,
      bloodWaterLocked: !!data.bloodWaterLocked,
      farkleShieldUsed: !!data.farkleShieldUsed,
      rewardsClaimed: !!data.rewardsClaimed,
      fightStarted: !!data.fightStarted,
    };
  } catch (err) {
    console.error(`[YouNeeK 10,000] Could not read the saved story fight for "${bossId}".`, err);
    return null;
  }
}

/** @returns {StoryFightSnapshot|null} */
export function loadStoryFight(bossId) {
  const raw = loadStoryFightRaw(bossId);
  if (!raw) return null;
  return {
    ...raw,
    game: sanitizeRestoredGame(raw.game),
  };
}

export function saveStoryFight(bossId, snapshot) {
  if (!bossId || !snapshot?.game) return;
  const ended = !!snapshot.game.winner;
  if (ended && snapshot.dialogue !== "win" && snapshot.dialogue !== "lose") return;
  try {
    const existing = loadStoryFightRaw(bossId);
    if (shouldBlockOverwrite(existing, snapshot)) return;
    sessionStorage.setItem(
      key(bossId),
      JSON.stringify({ bossId, savedAt: Date.now(), ...snapshot })
    );
  } catch (err) {
    // Quota / private mode — the fight keeps going, it just will not resume.
    console.warn(`[YouNeeK 10,000] Could not save the story fight for "${bossId}".`, err);
  }
}

export function clearStoryFight(bossId) {
  if (!bossId) return;
  try {
    sessionStorage.removeItem(key(bossId));
  } catch (err) {
    console.warn(`[YouNeeK 10,000] Could not clear the saved story fight for "${bossId}".`, err);
  }
}

/** Drop in-progress match — ladder position is stored on the profile instead. */
export function abandonStoryFight(bossId) {
  clearStoryFight(bossId);
}
