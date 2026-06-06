// Core game state manipulation for Dice 10,000
import { scoreSelection, hasAnyScore } from "./scoring";

export const TARGET_SCORE = 10000;
export const ENTRY_THRESHOLD = 1000;

// Bust words — alternated on each bust for variety.
const BUST_WORDS = ["YEEET!", "SKEERT!"];
function bustWord(count) {
  return BUST_WORDS[count % BUST_WORDS.length];
}

export function createInitialState(playerNames) {
  return {
    players: playerNames.map(name => ({ name, score: 0, onBoard: false })),
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

// Perform a dice roll — only on dice that are not `used`
export function rollDice(state) {
  const newDice = state.dice.map(d => {
    if (d.used) return d;
    return { ...d, value: Math.floor(Math.random() * 6) + 1, held: false };
  });
  return { ...state, dice: newDice, hasRolled: true };
}

// Evaluate the roll after it lands → farkle / continue
export function evaluateRoll(state) {
  const active = state.dice.filter(d => !d.used).map(d => d.value);
  if (!hasAnyScore(active)) {
    // Bust
    const currentName = state.players[state.currentIndex].name;
    const word = bustWord(state.bustCount || 0);
    return {
      ...state,
      farkle: true,
      turnScore: 0,
      bustCount: (state.bustCount || 0) + 1,
      lastBustWord: word,
      message: `💥 ${word} ${currentName} loses turn score.`,
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
  const info = getHeldInfo(state);
  if (!info.valid || (info.score === 0 && !info.sixOfAKind)) return { state };

  if (info.sixOfAKind) {
    // Instant win — all 6 dice showing the same number in one roll = Perfect 10,000
    const players = state.players.map((p, i) =>
      i === state.currentIndex ? { ...p, score: TARGET_SCORE, onBoard: true } : p
    );
    return {
      state: {
        ...state,
        players,
        winner: players[state.currentIndex],
        perfectTenK: true,
        message: `🎯 PERFECT 10,000 — SIX OF A KIND INSTANT WIN!`,
        messageVariant: "success",
      },
      instantWin: true,
    };
  }

  // Mark held dice as used, add to turn score
  let newDice = state.dice.map(d => (d.held ? { ...d, used: true, held: false } : d));
  const newTurnScore = state.turnScore + info.score;

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
  newDice = newDice.map(d => {
    if (d.used) return d;
    return { ...d, value: Math.floor(Math.random() * 6) + 1, held: false };
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

  return {
    state: {
      ...state,
      dice: newDice,
      turnScore: newTurnScore,
      hasRolled: true,
      message: allUsed ? "🔥 HOT DICE! All 6 re-rolled." : "Select scoring dice, then bank or roll again.",
      messageVariant: allUsed ? "success" : "info",
    },
  };
}

// Bank the current turn score and pass to next player.
// Returns new state; if someone wins, winner is set.
export function bankAndPass(state) {
  const info = getHeldInfo(state);
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
    message: `${message} ${newPlayers[nextIndex].name}'s turn.`,
    messageVariant: variant,
  };
}

// Pass turn after a Farkle
export function passAfterFarkle(state) {
  const nextIndex = (state.currentIndex + 1) % state.players.length;
  return {
    ...state,
    currentIndex: nextIndex,
    dice: makeFreshDice(),
    turnScore: 0,
    hasRolled: false,
    farkle: false,
    message: `${state.players[nextIndex].name}'s turn — roll the dice!`,
    messageVariant: "info",
  };
}