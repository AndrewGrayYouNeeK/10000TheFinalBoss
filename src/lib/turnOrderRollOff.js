/** Roll one d6 for turn-order roll-off. */
export function rollTurnOrderDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/** Turn order from first player around the seating circle. */
export function buildCircleOrder(firstPlayerIndex, playerCount) {
  return Array.from({ length: playerCount }, (_, i) => (firstPlayerIndex + i) % playerCount);
}

export function createRollOffState(playerCount) {
  const pool = Array.from({ length: playerCount }, (_, i) => i);
  return {
    order: [],
    pool,
    roundRolls: {},
  };
}

/** Roll one die for every player still in the pool. */
export function rollRoundForPool(pool) {
  const roundRolls = {};
  for (const i of pool) {
    roundRolls[i] = rollTurnOrderDie();
  }
  return roundRolls;
}

/**
 * Roll for everyone in the pool, then resolve lowest / tie / winner.
 */
export function executeRollOffRound(state, playerNames = []) {
  const roundRolls = rollRoundForPool(state.pool);
  return advanceRollOff({ ...state, roundRolls }, playerNames);
}

/**
 * After everyone in pool has rolled this round: lowest roll wins first place.
 * Ties on lowest → only tied players roll again. Once first is set, circle order fills the rest.
 */
export function advanceRollOff(state, playerNames = []) {
  const { pool, roundRolls } = state;
  const playerCount = playerNames.length || pool.length;

  const rolls = pool
    .map((i) => ({ i, v: roundRolls[i] }))
    .filter((r) => r.v != null);

  if (rolls.length < pool.length) {
    return state;
  }

  const minRoll = Math.min(...rolls.map((r) => r.v));
  const tied = rolls.filter((r) => r.v === minRoll).map((r) => r.i);

  if (tied.length > 1) {
    const tiedNames = tied.map((i) => playerNames[i] || `Player ${i + 1}`).join(" & ");
    return {
      order: [],
      pool: tied,
      roundRolls: {},
      tie: true,
      message: `Tie on ${minRoll} (${tiedNames}) — rolling again…`,
    };
  }

  const first = tied[0];
  const order = buildCircleOrder(first, playerCount);
  const firstName = playerNames[first] || `Player ${first + 1}`;

  return {
    order,
    pool: [],
    roundRolls: {},
    done: true,
    firstPlayerIndex: first,
    message: `${firstName} rolls first!`,
  };
}

export function formatRollOffStandings(order, playerNames) {
  return order.map((playerIdx, i) => ({
    playerIdx,
    name: playerNames[playerIdx] || `Player ${playerIdx + 1}`,
    place: i + 1,
  }));
}
