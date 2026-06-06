// AI opponent logic for Story Mode.
// Decides which dice to hold and whether to bank vs. roll again.

import { scoreSelection, hasAnyScore } from "./scoring";

const TARGET_SCORE = 10000;
const ENTRY_THRESHOLD = 1000;

// Find the best "minimum" scoring selection: keep only the highest-value scoring combo
// from currently rolled dice. Used by less-greedy AIs.
function findMinimalScoringSelection(activeDice) {
  // Try the whole "best big combo" first by scanning subsets — but with 6 dice, simple heuristic is enough.
  const values = activeDice.map((d) => d.value);

  // First check for big combos in the FULL roll (straights, three pairs, six-of-a-kind, etc.)
  const fullScore = scoreSelection(values);
  if (fullScore.valid && fullScore.score > 0 && (fullScore.straight || fullScore.smallStraight || fullScore.threePairs || fullScore.sixOfAKind)) {
    return activeDice.map((d) => d.id);
  }

  // Check for any 3-of-a-kind we should grab
  const counts = [0, 0, 0, 0, 0, 0, 0];
  values.forEach((v) => counts[v]++);
  const heldIds = [];
  for (let face = 1; face <= 6; face++) {
    if (counts[face] >= 3) {
      const ids = activeDice.filter((d) => d.value === face).slice(0, counts[face]).map((d) => d.id);
      heldIds.push(...ids);
    }
  }
  // If no 3oak, just grab a single 1 or 5
  if (heldIds.length === 0) {
    const one = activeDice.find((d) => d.value === 1);
    if (one) heldIds.push(one.id);
    else {
      const five = activeDice.find((d) => d.value === 5);
      if (five) heldIds.push(five.id);
    }
  }
  return heldIds;
}

// Greedy: hold ALL scoring dice for max points.
function findGreedyScoringSelection(activeDice) {
  const values = activeDice.map((d) => d.value);
  const full = scoreSelection(values);
  if (full.valid && full.score > 0) {
    return activeDice.map((d) => d.id);
  }
  // Otherwise hold all 1s, 5s, and any 3+ of a kind
  const counts = [0, 0, 0, 0, 0, 0, 0];
  values.forEach((v) => counts[v]++);
  const heldIds = [];
  for (let face = 1; face <= 6; face++) {
    if (counts[face] >= 3) {
      const ids = activeDice.filter((d) => d.value === face).map((d) => d.id);
      heldIds.push(...ids);
    } else if (face === 1 || face === 5) {
      const ids = activeDice.filter((d) => d.value === face).map((d) => d.id);
      heldIds.push(...ids);
    }
  }
  return heldIds;
}

// Choose which dice the AI will hold from the current roll.
// Returns array of die ids to hold.
export function chooseDiceToHold(state, difficulty) {
  const activeDice = state.dice.filter((d) => !d.used);
  if (activeDice.length === 0) return [];
  if (!hasAnyScore(activeDice.map((d) => d.value))) return []; // farkle — nothing to hold

  return difficulty.holdGreedy
    ? findGreedyScoringSelection(activeDice)
    : findMinimalScoringSelection(activeDice);
}

// Decide whether to bank or roll again, given the current state.
// Returns "bank" | "roll".
export function chooseBankOrRoll(state, difficulty, player) {
  const turnScore = state.turnScore || 0;
  const playerScore = player?.score ?? 0;
  const needsEntry = !player?.onBoard;
  const diceRemaining = state.dice.filter((d) => !d.used).length;

  // Don't bank if you can't even get on the board yet
  if (needsEntry && turnScore < ENTRY_THRESHOLD) return "roll";

  // Don't bank if it would overshoot 10,000
  if (playerScore + turnScore > TARGET_SCORE) return "roll";

  // If you can win, bank!
  if (playerScore + turnScore >= TARGET_SCORE && playerScore + turnScore <= TARGET_SCORE) return "bank";

  // If only 1-2 dice remain, much higher farkle risk — bank if we have anything decent.
  if (diceRemaining <= 2 && turnScore >= 350) return "bank";

  // If we've hit the difficulty threshold, mostly bank, but greed gives chance to push
  if (turnScore >= difficulty.bankThreshold) {
    return Math.random() < difficulty.greed ? "roll" : "bank";
  }

  return "roll";
}