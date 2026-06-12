// Core game state manipulation for Dice 10,000
import { scoreSelection, hasAnyScore, isSixOfAKind } from "./scoring";
import { POWER_MODE_HOT_DICE } from "./powers";

export const TARGET_SCORE = 10000;
export const ENTRY_THRESHOLD = 1000;
/** Six-of-a-kind instant win — tuned to 1 in 10,000 per full 6-die roll. */
export const PERFECT_TENK_ODDS = 1 / 10000;

// Bust words — alternated on each bust for variety.
const BUST_WORDS = ["YEEET!", "SKEERT!"];
function bustWord(count) {
  return BUST_WORDS[count % BUST_WORDS.length];
}

/** Cleared when a turn ends (bank or farkle pass). */
function turnPowerReset() {
  return {
    hotDiceCount: 0,
    powerModeAvailable: false,
    skinPowerUsedThisTurn: false,
    powerShield: false,
  };
}

export function createInitialState(playerNames) {
  return {
    players: playerNames.map(name => ({ name, score: 0, onBoard: false, debuffs: [] })),
    currentIndex: 0,
    dice: makeFreshDice(),
    rolling: false,
    hasRolled: false,
    turnScore: 0,
    winner: null,
    message: `${playerNames[0]}'s turn — roll the dice!`,
    messageVariant: "info",
    farkle: false,
    bustCount: 0,
    lastBustWord: null,
    perfectTenKPending: false,
    hotDiceCount: 0,
    powerModeAvailable: false,
    skinPowerUsedThisTurn: false,
    powerShield: false,
    luckyRollNext: false,
    turnScoreMultiplier: 1,
    doubleOrNothing: false,
  };
}

function makeFreshDice() {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    value: i + 1,
    used: false, // banked into turnScore (locked from a previous roll this turn)
    held: false, // selected in current pending roll
  }));
}

function rollDieValues(count, { luckyRoll = false } = {}) {
  let perfectTenK = false;
  let values;

  if (count === 6 && Math.random() < PERFECT_TENK_ODDS) {
    const face = Math.floor(Math.random() * 6) + 1;
    values = Array(6).fill(face);
    perfectTenK = true;
  } else {
    values = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
  }

  if (luckyRoll && count > 0 && !hasAnyScore(values)) {
    values = [...values];
    values[0] = 1;
  }

  return { values, perfectTenK };
}

// Perform a dice roll — only on dice that are not `used`
export function rollDice(state) {
  const rolling = state.dice.filter((d) => !d.used);
  const luckyRoll = !!state.luckyRollNext;
  const { values, perfectTenK } = rollDieValues(rolling.length, { luckyRoll });
  let vi = 0;
  const newDice = state.dice.map((d) => {
    if (d.used) return d;
    const value = values[vi++];
    return { ...d, value, held: false };
  });
  return {
    ...state,
    dice: newDice,
    hasRolled: true,
    luckyRollNext: false,
    perfectTenKPending: perfectTenK || false,
  };
}

// Evaluate the roll after it lands → farkle / continue
export function evaluateRoll(state) {
  const active = state.dice.filter(d => !d.used).map(d => d.value);
  if (!hasAnyScore(active)) {
    if (state.powerShield) {
      const currentName = state.players[state.currentIndex].name;
      return {
        ...state,
        farkle: false,
        powerShield: false,
        message: `🛡️ Shield saved ${currentName}'s turn score!`,
        messageVariant: "success",
      };
    }
    const currentName = state.players[state.currentIndex].name;
    const word = bustWord(state.bustCount || 0);
    const lostScore = state.doubleOrNothing ? state.turnScore * 2 : state.turnScore;
    return {
      ...state,
      farkle: true,
      turnScore: 0,
      bustCount: (state.bustCount || 0) + 1,
      lastBustWord: word,
      doubleOrNothing: false,
      turnScoreMultiplier: 1,
      perfectTenKPending: false,
      message: state.doubleOrNothing
        ? `💥 ${word} Double or Nothing — ${currentName} loses ${lostScore}.`
        : `💥 ${word} ${currentName} loses turn score.`,
      messageVariant: "danger",
    };
  }
  return {
    ...state,
    message: "Select scoring dice, then bank or roll again.",
    messageVariant: "info",
  };
}

// Toggle holding a die in the current selection
export function toggleHold(state, dieId) {
  if (state.farkle || state.rolling) return state;
  return {
    ...state,
    dice: state.dice.map(d =>
      d.id === dieId && !d.used ? { ...d, held: !d.held } : d
    ),
  };
}

// Get score info for the currently held selection
export function getHeldInfo(state) {
  const held = state.dice.filter(d => d.held && !d.used).map(d => d.value);
  return { held, ...scoreSelection(held) };
}

// Confirm held dice into the turn, then re-roll remaining
// Returns { state, instantWin }
export function confirmAndReroll(state) {
  const held = getHeldInfo(state);
  if (isSixOfAKind(held.held) && state.perfectTenKPending) {
    const players = state.players.map((p, i) =>
      i === state.currentIndex ? { ...p, score: TARGET_SCORE, onBoard: true } : p
    );
    return {
      state: {
        ...state,
        players,
        winner: players[state.currentIndex],
        perfectTenK: true,
        perfectTenKPending: false,
        message: `🎯 PERFECT 10,000 — SIX OF A KIND INSTANT WIN!`,
        messageVariant: "success",
      },
      instantWin: true,
    };
  }

  if (!held.valid || held.score === 0) return { state };

  const scored = held;

  // Mark held dice as used, add to turn score
  let newDice = state.dice.map(d => (d.held ? { ...d, used: true, held: false } : d));
  const mult = state.turnScoreMultiplier || 1;
  const newTurnScore = state.turnScore + Math.floor(scored.score * mult);

  // Overshoot bust — you must land EXACTLY on 10,000. If the locked-in turn score
  // already pushes the player over, end the turn immediately (no further rolls).
  const currentPlayer = state.players[state.currentIndex];
  if (currentPlayer.score + newTurnScore > TARGET_SCORE) {
    const word = bustWord(state.bustCount || 0);
    return {
      state: {
        ...state,
        dice: newDice,
        turnScore: 0,
        hasRolled: true,
        farkle: true,
        bustCount: (state.bustCount || 0) + 1,
        lastBustWord: word,
        message: `💥 Overshoot! ${currentPlayer.name} needed exactly ${TARGET_SCORE - currentPlayer.score} — busted ${newTurnScore}.`,
        messageVariant: "danger",
      },
    };
  }

  // Hot dice? — all dice now used → refresh
  const allUsed = newDice.every(d => d.used);
  if (allUsed) {
    newDice = makeFreshDice();
  }

  // Re-roll the un-used dice
  const rerolling = newDice.filter((d) => !d.used);
  const luckyRoll = !!state.luckyRollNext;
  const { values, perfectTenK } = rollDieValues(rerolling.length, { luckyRoll });
  let vi = 0;
  newDice = newDice.map((d) => {
    if (d.used) return d;
    return { ...d, value: values[vi++], held: false };
  });

  // Check for farkle on re-roll
  const activeVals = newDice.filter(d => !d.used).map(d => d.value);
  const farkled = !hasAnyScore(activeVals);

  if (farkled) {
    const word = bustWord(state.bustCount || 0);
    return {
      state: {
        ...state,
        dice: newDice,
        turnScore: 0,
        hasRolled: true,
        farkle: true,
        bustCount: (state.bustCount || 0) + 1,
        lastBustWord: word,
        message: `💥 ${word} ${state.players[state.currentIndex].name} loses ${newTurnScore}.`,
        messageVariant: "danger",
      },
    };
  }

  const newHotCount = allUsed ? (state.hotDiceCount || 0) + 1 : (state.hotDiceCount || 0);
  const unlockPower = allUsed && newHotCount >= POWER_MODE_HOT_DICE;

  return {
    state: {
      ...state,
      dice: newDice,
      turnScore: newTurnScore,
      hasRolled: true,
      luckyRollNext: false,
      perfectTenKPending: perfectTenK || false,
      hotDiceCount: newHotCount,
      powerModeAvailable: state.skinPowerUsedThisTurn
        ? false
        : unlockPower || state.powerModeAvailable,
      message: unlockPower && !state.powerModeAvailable
        ? "🔥 HOT DICE! Power Mode unlocked!"
        : allUsed
        ? "🔥 HOT DICE! All 6 re-rolled."
        : "Select scoring dice, then bank or roll again.",
      messageVariant: allUsed || unlockPower ? "success" : "info",
    },
  };
}

/** Mark skin secret power as spent for this turn. */
export function consumeSkinPower(state) {
  return {
    ...state,
    skinPowerUsedThisTurn: true,
    powerModeAvailable: false,
  };
}

// Bank the current turn score and pass to next player.
// Returns new state; if someone wins, winner is set.
export function bankAndPass(state) {
  const info = getHeldInfo(state);

  if (isSixOfAKind(info.held) && state.perfectTenKPending) {
    const players = state.players.map((p, i) =>
      i === state.currentIndex ? { ...p, score: TARGET_SCORE, onBoard: true } : p
    );
    return {
      ...state,
      players,
      winner: players[state.currentIndex],
      perfectTenK: true,
      perfectTenKPending: false,
      message: `🎯 PERFECT 10,000 — SIX OF A KIND INSTANT WIN!`,
      messageVariant: "success",
    };
  }

  // Include any currently-held valid selection into the bank
  let finalTurn = state.turnScore;
  if (info.valid && info.score > 0) {
    finalTurn += info.score;
  }

  const player = state.players[state.currentIndex];
  const newPlayers = [...state.players];

  let message;
  let variant;

  if (!player.onBoard && finalTurn < ENTRY_THRESHOLD) {
    // Didn't make entry
    message = `${player.name} needs 1,000 to get on the board. Banked 0.`;
    variant = "warning";
  } else if (player.score + finalTurn > TARGET_SCORE) {
    // Overshoot — must land exactly on 10,000
    message = `💥 Overshoot! ${player.name} needed exactly ${TARGET_SCORE - player.score} — banked 0.`;
    variant = "danger";
  } else {
    newPlayers[state.currentIndex] = {
      ...player,
      score: player.score + finalTurn,
      onBoard: true,
    };
    message = `${player.name} banked ${finalTurn.toLocaleString()}!`;
    variant = "success";
  }

  // Check win
  const winner = newPlayers[state.currentIndex].score >= TARGET_SCORE
    ? newPlayers[state.currentIndex]
    : null;

  if (winner) {
    return {
      ...state,
      players: newPlayers,
      winner,
      message: `🎉 ${winner.name} wins with ${winner.score.toLocaleString()}!`,
      messageVariant: "success",
    };
  }

  const nextIndex = (state.currentIndex + 1) % state.players.length;
  return {
    ...state,
    players: newPlayers,
    currentIndex: nextIndex,
    dice: makeFreshDice(),
    turnScore: 0,
    hasRolled: false,
    farkle: false,
    perfectTenKPending: false,
    turnScoreMultiplier: 1,
    doubleOrNothing: false,
    luckyRollNext: false,
    ...turnPowerReset(),
    message: `${message} ${newPlayers[nextIndex].name}'s turn.`,
    messageVariant: variant,
  };
}

// Pass turn after a Farkle
export function passAfterFarkle(state) {
  const bustedIdx = state.currentIndex;
  const nextIndex = (state.currentIndex + 1) % state.players.length;
  const players = state.players.map((p, i) =>
    i === bustedIdx ? { ...p, debuffs: [] } : p
  );
  return {
    ...state,
    players,
    currentIndex: nextIndex,
    dice: makeFreshDice(),
    turnScore: 0,
    hasRolled: false,
    farkle: false,
    perfectTenKPending: false,
    turnScoreMultiplier: 1,
    doubleOrNothing: false,
    luckyRollNext: false,
    ...turnPowerReset(),
    message: `${players[nextIndex].name}'s turn — roll the dice!`,
    messageVariant: "info",
  };
}

/** Player indices whose scores should show as hidden (sabotage debuffs). */
export function getObscuredScoreIndices(state) {
  const obscured = new Set();
  if (!state?.players) return obscured;
  state.players.forEach((p, i) => {
    (p.debuffs || []).forEach((d) => {
      const id = typeof d === "string" ? d : d.id;
      if (id === "static") obscured.add(i);
      if (id === "blackout" && typeof d === "object") obscured.add(d.from);
    });
  });
  return obscured;
}