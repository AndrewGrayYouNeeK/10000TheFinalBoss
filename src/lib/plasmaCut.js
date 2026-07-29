import { evaluateRoll } from "./gameLogic";

/**
 * Valid face values after plasma-cutting pips off a die.
 * Symmetric cuts only — e.g. 6→4 (2 pips), 6→2 (4 pips), 5→4/3/1.
 */
export const PLASMA_CUT_TARGETS = {
  6: [4, 2],
  5: [4, 3, 1],
  4: [3, 2],
  3: [2, 1],
  2: [1],
  1: [],
};

export function getPlasmaCutTargets(value) {
  return PLASMA_CUT_TARGETS[value] ?? [];
}

export function pipsCut(fromValue, toValue) {
  return Math.max(0, fromValue - toValue);
}

/** Active dice that can still be plasma-cut this roll. */
export function getPlasmaCuttableDice(state) {
  if (!state?.dice) return [];
  return state.dice.filter((d) => !d.used && getPlasmaCutTargets(d.value).length > 0);
}

export function canUsePlasmaCut(state) {
  if (!state || state.winner || !state.hasRolled) return false;
  return getPlasmaCuttableDice(state).length > 0;
}

/** Lower one active die's face by cutting pips; re-evaluates farkle / scoring. */
export function applyPlasmaCut(state, dieId, newValue) {
  if (!state || state.winner || !state.hasRolled) {
    return { state, message: "Can't plasma cut right now.", variant: "warning" };
  }

  const die = state.dice.find((d) => d.id === dieId);
  if (!die || die.used) {
    return { state, message: "Pick an active die to cut.", variant: "warning" };
  }

  const allowed = getPlasmaCutTargets(die.value);
  if (!allowed.includes(newValue)) {
    return { state, message: `Can't cut ${die.value} down to ${newValue}.`, variant: "warning" };
  }

  const cut = pipsCut(die.value, newValue);
  const newDice = state.dice.map((d) =>
    d.id === dieId ? { ...d, value: newValue, held: false, plasmaCutFlash: true } : d
  );

  // If we're rescuing a bust, restore the pre-farkle turn score and undo the
  // bustCount bump so evaluateRoll can re-apply (or not) cleanly.
  const wasFarkle = !!state.farkle;
  const restoredTurnScore = wasFarkle
    ? (state.farkleTurnScore ?? 0)
    : state.turnScore;
  const restoredBustCount = wasFarkle
    ? Math.max(0, (state.bustCount || 0) - 1)
    : (state.bustCount || 0);

  const next = evaluateRoll({
    ...state,
    dice: newDice,
    farkle: false,
    turnScore: restoredTurnScore,
    bustCount: restoredBustCount,
    farkleTurnScore: null,
  });

  const rescued = wasFarkle && !next.farkle;

  return {
    state: {
      ...next,
      message: rescued
        ? `⚡ Plasma Cut rescued your turn — ${die.value}→${newValue} (cut ${cut}). Select scoring dice!`
        : next.farkle
          ? `⚡ Plasma Cut ${die.value}→${newValue} — still no score.`
          : `⚡ Plasma Cut — ${die.value}→${newValue} (cut ${cut} pip${cut === 1 ? "" : "s"}). Select scoring dice!`,
      messageVariant: next.farkle ? "warning" : "success",
    },
    message: rescued ? "Turn saved!" : next.farkle ? "Still bust!" : `Cut to ${newValue}!`,
    variant: next.farkle ? "warning" : "success",
  };
}
