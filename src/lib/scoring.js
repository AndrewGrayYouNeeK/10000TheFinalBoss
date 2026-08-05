// Dice 10,000 (Farkle) scoring engine

// Count occurrences of each face
function countFaces(dice) {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // index 1-6
  dice.forEach(d => { counts[d]++; });
  return counts;
}

/** All six dice show the same face (used for Perfect 10,000 only). */
export function isSixOfAKind(dice) {
  if (!dice || dice.length !== 6) return null;
  const counts = countFaces(dice);
  for (let face = 1; face <= 6; face++) {
    if (counts[face] === 6) return face;
  }
  return null;
}

// Score a set of dice values (array of 1-6).
// Returns { score, valid } — valid=true means ALL dice were scored (required to "hot dice" re-roll).
// For a selection, we check validity = every die contributes to a scoring combo.
export function scoreSelection(dice) {
  if (!dice || dice.length === 0) return { score: 0, valid: false };

  const counts = countFaces(dice);
  let score = 0;
  const remaining = [...counts];

  // Straight 1-2-3-4-5-6 => 1500
  if (dice.length === 6 && [1,2,3,4,5,6].every(f => counts[f] === 1)) {
    return { score: 1500, valid: true, straight: true };
  }

  // Small Straight: 5 sequential dice (1-2-3-4-5 or 2-3-4-5-6) => 1000
  // Also allow a 6-die selection = small straight + one extra scoring die (1 or 5).
  if (dice.length === 5) {
    if ([1,2,3,4,5].every(f => counts[f] === 1)) {
      return { score: 1000, valid: true, smallStraight: true };
    }
    if ([2,3,4,5,6].every(f => counts[f] === 1)) {
      return { score: 1000, valid: true, smallStraight: true };
    }
  }
  if (dice.length === 6) {
    // 1-2-3-4-5 small straight with an extra 1 (counts: 1×2, 2,3,4,5)
    if (counts[1] === 2 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1 && counts[6] === 0) {
      return { score: 1100, valid: true, smallStraight: true };
    }
    // 1-2-3-4-5 small straight with an extra 5 (counts: 1,2,3,4, 5×2)
    if (counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 2 && counts[6] === 0) {
      return { score: 1050, valid: true, smallStraight: true };
    }
    // 2-3-4-5-6 small straight with an extra 5 (counts: 2,3,4, 5×2, 6)
    if (counts[1] === 0 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 2 && counts[6] === 1) {
      return { score: 1050, valid: true, smallStraight: true };
    }
  }

  // Three pairs => 1500 (only with 6 dice)
  if (dice.length === 6) {
    const pairs = [1,2,3,4,5,6].filter(f => counts[f] === 2).length;
    if (pairs === 3) {
      return { score: 1500, valid: true, threePairs: true };
    }
  }

  // Five of a kind => flat 4000 (any face)
  for (let face = 1; face <= 6; face++) {
    if (remaining[face] >= 5) {
      score += 4000;
      remaining[face] -= 5;
    }
  }

  // Four of a kind => flat 2000 (any face)
  for (let face = 1; face <= 6; face++) {
    if (remaining[face] >= 4) {
      score += 2000;
      remaining[face] -= 4;
    }
  }

  // Three of a kind
  for (let face = 1; face <= 6; face++) {
    if (remaining[face] >= 3) {
      score += face === 1 ? 1000 : face * 100;
      remaining[face] -= 3;
    }
  }

  // Remaining 1s and 5s
  score += remaining[1] * 100;
  remaining[1] = 0;
  score += remaining[5] * 50;
  remaining[5] = 0;

  // Valid only if no remaining dice (every die was scored)
  const unscored = remaining.reduce((a, b) => a + b, 0);
  const valid = unscored === 0;

  return { score, valid };
}

/**
 * Highest points from any valid scoring subset of the roll.
 * Used for endgame overshoot checks.
 */
export function maxValidScore(dice) {
  if (!dice || dice.length === 0) return 0;
  const n = dice.length;
  let best = 0;
  for (let mask = 1; mask < 1 << n; mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(dice[i]);
    }
    const { score, valid } = scoreSelection(subset);
    if (valid && score > best) best = score;
  }
  return best;
}

// Check if a roll has ANY possible scoring dice (otherwise = Farkle)
export function hasAnyScore(dice) {
  if (!dice || dice.length === 0) return false;
  const counts = countFaces(dice);

  // Any 1 or 5
  if (counts[1] > 0 || counts[5] > 0) return true;

  // Three of a kind
  for (let f = 1; f <= 6; f++) {
    if (counts[f] >= 3) return true;
  }

  // Straight (6 dice)
  if (dice.length === 6 && [1,2,3,4,5,6].every(f => counts[f] === 1)) return true;

  // Small straight (5 sequential dice within the roll)
  if ([1,2,3,4,5].every(f => counts[f] >= 1)) return true;
  if ([2,3,4,5,6].every(f => counts[f] >= 1)) return true;

  // Three pairs (6 dice)
  if (dice.length === 6) {
    const pairs = [1,2,3,4,5,6].filter(f => counts[f] === 2).length;
    if (pairs === 3) return true;
  }

  return false;
}

// Describe the scoring combo for UX
export function describeSelection(dice, { perfectTenKPending = false } = {}) {
  const sixFace = isSixOfAKind(dice);
  if (sixFace !== null && perfectTenKPending) {
    return `Six ${sixFace}s — PERFECT 10,000!`;
  }
  const result = scoreSelection(dice);
  if (result.straight) return "Straight 1-6 (1500)";
  if (result.smallStraight) return "Small Straight (1000)";
  if (result.threePairs) return "Three Pairs (1500)";
  if (!result.valid) return "Invalid — includes non-scoring dice";
  if (result.score === 0) return "No score";
  return `+${result.score}`;
}

/** Points for the current held selection (Perfect 10,000 when pending). */
export function heldSelectionPoints(info, perfectTenKPending = false) {
  if (!info?.valid) return 0;
  if (info.held && isSixOfAKind(info.held) && perfectTenKPending) return 10000;
  return info.score || 0;
}

/** Label shown under the dice tray for the held selection. */
export function heldSelectionLabel(info, perfectTenKPending = false) {
  if (!info?.valid) return "Selection includes non-scoring dice";
  if (info.held && isSixOfAKind(info.held) && perfectTenKPending) {
    return `Six ${isSixOfAKind(info.held)}s — PERFECT 10,000!`;
  }
  if (info.straight) return "Straight!";
  if (info.smallStraight) return "Small Straight! +1000";
  if (info.threePairs) return "Three Pairs!";
  return `Selection: +${info.score}`;
}