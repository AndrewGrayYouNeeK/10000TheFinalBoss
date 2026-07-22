const key = (bossId) => `yourneek_story_fight_${bossId}`;

/** @returns {{ game: object, dialogue: string|null, bloodWaterLocked: boolean, farkleShieldUsed: boolean, rewardsClaimed: boolean }|null} */
export function loadStoryFight(bossId) {
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
    };
  } catch {
    return null;
  }
}

export function saveStoryFight(bossId, snapshot) {
  if (!bossId || !snapshot?.game) return;
  const ended = !!snapshot.game.winner;
  if (ended && snapshot.dialogue !== "win" && snapshot.dialogue !== "lose") return;
  try {
    sessionStorage.setItem(
      key(bossId),
      JSON.stringify({ bossId, savedAt: Date.now(), ...snapshot })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearStoryFight(bossId) {
  if (!bossId) return;
  try {
    sessionStorage.removeItem(key(bossId));
  } catch {
    /* ignore */
  }
}

/** Drop in-progress match — ladder position is stored on the profile instead. */
export function abandonStoryFight(bossId) {
  clearStoryFight(bossId);
}
