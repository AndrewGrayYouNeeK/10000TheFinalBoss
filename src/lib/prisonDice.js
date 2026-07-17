/** Prison Dice — Core Burst sabotage power */

export const PRISON_DICE_SKIN_ID = "paper";
export const PRISON_SIXES_TO_RELEASE = 3;

export function isPlayerImprisoned(state, playerIndex) {
  return state?.prisonDice?.targetIdx === playerIndex;
}

/** Dice tray skin — prison scraps override the opponent's equipped skin. */
export function getPrisonTraySkinId(state, playerIndex, defaultSkinId) {
  if (isPlayerImprisoned(state, playerIndex)) return PRISON_DICE_SKIN_ID;
  return defaultSkinId;
}

export function getPrisonProgress(state) {
  const pd = state?.prisonDice;
  if (!pd) return null;
  const sixCount = pd.sixCount || 0;
  return {
    casterIdx: pd.casterIdx,
    targetIdx: pd.targetIdx,
    sixCount,
    remaining: Math.max(0, PRISON_SIXES_TO_RELEASE - sixCount),
    targetName: state.players[pd.targetIdx]?.name || "Opponent",
    casterName: state.players[pd.casterIdx]?.name || "You",
    released: sixCount >= PRISON_SIXES_TO_RELEASE,
  };
}

/** Count sixes the caster just rolled toward breaking the prison lock. */
export function trackPrisonSixes(state, rolledValues) {
  const pd = state?.prisonDice;
  if (!pd || state.currentIndex !== pd.casterIdx || !rolledValues?.length) {
    return { state, released: false, added: 0 };
  }

  const added = rolledValues.filter((v) => v === 6).length;
  if (added === 0) return { state, released: false, added: 0 };

  const sixCount = (pd.sixCount || 0) + added;
  if (sixCount >= PRISON_SIXES_TO_RELEASE) {
    const targetName = state.players[pd.targetIdx]?.name || "Opponent";
    return {
      state: { ...state, prisonDice: null },
      released: true,
      added,
      releaseMessage: `⛓️ Prison broken — ${targetName}'s dice restored!`,
    };
  }

  return {
    state: {
      ...state,
      prisonDice: { ...pd, sixCount },
    },
    released: false,
    added,
    releaseMessage: null,
  };
}

export function clearPrisonFromCaster(state, casterIdx) {
  if (state?.prisonDice?.casterIdx !== casterIdx) return state;
  return { ...state, prisonDice: null };
}
