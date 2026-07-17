// Core game state manipulation for Dice 10,000
import { scoreSelection, hasAnyScore, isSixOfAKind } from "./scoring";
import { POWER_MODE_HOT_DICE } from "./powers";
import { trackPrisonSixes, clearPrisonFromCaster } from "./prisonDice";

export const TARGET_SCORE = 10000;
export const ENTRY_THRESHOLD = 1000;
/** Six-of-a-kind instant win — tuned to 1 in 10,000 per full 6-die roll. */
export const PERFECT_TENK_ODDS = 1 / 10000;

// Bust words — alternated on each bust for variety.
const BUST_WORDS = ["YEEET!", "SKEERT!"];
function bustWord(count) {
  return BUST_WORDS[count % BUST_WORDS.length];
}

/** Per-turn state cleared on bank or bust pass (power charge lives on the player). */
function turnPowerReset() {
  return {
    hotDiceCount: 0,
    skinPowerUsedThisTurn: false,
    powerShield: false,
    doubleOrNothing: false,
    turnScoreMultiplier: 1,
    luckyRollNext: false,
  };
}

/** End a player's turn on bank — debuffs on them clear; power charge is kept. */
function finishBankedTurn(players, playerIndex, { skinPowerUsedThisTurn = false } = {}) {
  const p = players[playerIndex];
  if (!p) return players;
  const next = [...players];
  // Charge survives banking. Only busting or firing consumes it.
  const keepCharge = !!p.powerCharge && !skinPowerUsedThisTurn;
  next[playerIndex] = { ...p, debuffs: [], powerCharge: keepCharge };
  return next;
}
/** Remove sabotage debuffs cast by a player (e.g. they bust after firing). */
export function clearDebuffsFromCaster(players, casterIdx) {
  return players.map((p) => ({
    ...p,
    debuffs: (p.debuffs || []).filter((d) => {
      if (typeof d !== "object") return true;
      return d.from !== casterIdx;
    }),
  }));
}

function playerHasDebuff(player, debuffId) {
  return (player?.debuffs || []).some((d) => (typeof d === "string" ? d : d.id) === debuffId);
}

/** Keep a pending Shark Bite mark across farkle clears (resolves only on bank). */
function sharkBiteDebuffOnly(player) {
  const entry = (player?.debuffs || []).find(
    (d) => (typeof d === "string" ? d : d.id) === "shark_bite"
  );
  if (!entry) return [];
  return [typeof entry === "string" ? { id: "shark_bite" } : entry];
}

/**
 * Clear shark bite screen FX. Tray dice stay hidden until the next roll
 * (see rollDice clearing sharkDiceHidden).
 */
export function clearSharkBiteFx(state) {
  if (!state?.sharkBiteFx) return state;
  return { ...state, sharkBiteFx: false };
}

/** Restore tray dice after a shark bite (preview / next round). */
export function restoreSharkDice(state) {
  if (!state?.sharkDiceHidden) return state;
  return { ...state, sharkDiceHidden: false };
}

export function createInitialState(playerNames, options = {}) {
  const { playerSkins = [] } = options;
  return {
    players: playerNames.map((name, i) => {
      const skin = playerSkins[i] || { skinId: "classic_white" };
      return {
        name,
        score: 0,
        onBoard: false,
        debuffs: [],
        powerCharge: false,
        skinId: skin.skinId || "classic_white",
        ...(skin.trueSkinId ? { trueSkinId: skin.trueSkinId } : {}),
      };
    }),
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
    farkleTurnScore: null,
    pendingPrisonRelease: null,
    perfectTenKPending: false,
    hotDiceCount: 0,
    skinPowerUsedThisTurn: false,
    powerShield: false,
    luckyRollNext: false,
    turnScoreMultiplier: 1,
    doubleOrNothing: false,
    xrayReveals: {},
    prisonDice: null,
    sharkBiteFx: false,
    sharkDiceHidden: false,
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

/** All six active dice match — immediate game win (any face, any roll). */
function checkActiveSixOfAKindWin(state) {
  const active = state.dice.filter((d) => !d.used).map((d) => d.value);
  const face = active.length === 6 ? isSixOfAKind(active) : null;
  if (face === null) return null;

  const idx = state.currentIndex;
  const players = state.players.map((p, i) =>
    i === idx ? { ...p, score: TARGET_SCORE, onBoard: true } : p
  );
  const winner = players[idx];
  const name = winner?.name || "Player";

  return {
    ...state,
    players,
    winner,
    perfectTenK: true,
    perfectTenKPending: false,
    farkle: false,
    hasRolled: true,
    message: `🎯 SIX ${face}s — ${name} WINS!`,
    messageVariant: "success",
  };
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
  let next = {
    ...state,
    dice: newDice,
    hasRolled: true,
    luckyRollNext: false,
    perfectTenKPending: perfectTenK || false,
    // Next round / turn action — dice return after a shark bank-steal.
    sharkDiceHidden: false,
  };
  const prison = trackPrisonSixes(next, values);
  next = prison.state;
  if (prison.releaseMessage) {
    next = {
      ...next,
      message: prison.releaseMessage,
      messageVariant: "success",
      pendingPrisonRelease: prison.releaseMessage,
    };
  }
  return next;
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
        pendingPrisonRelease: null,
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
      farkleTurnScore: state.turnScore,
      turnScore: 0,
      bustCount: (state.bustCount || 0) + 1,
      lastBustWord: word,
      doubleOrNothing: false,
      turnScoreMultiplier: 1,
      perfectTenKPending: false,
      pendingPrisonRelease: null,
      message: state.doubleOrNothing
        ? `💥 ${word} Double or Nothing — ${currentName} loses ${lostScore}.`
        : `💥 ${word} ${currentName} loses turn score.`,
      messageVariant: "danger",
    };
  }

  const sixWin = checkActiveSixOfAKindWin(state);
  if (sixWin) return sixWin;

  // Keep prison-release banner from rollDice when the roll still scores.
  if (state.pendingPrisonRelease) {
    return {
      ...state,
      farkleTurnScore: null,
      pendingPrisonRelease: null,
      message: state.pendingPrisonRelease,
      messageVariant: "success",
    };
  }

  return {
    ...state,
    farkleTurnScore: null,
    message: "Select scoring dice, then bank or roll again.",
    messageVariant: "info",
  };
}

// Toggle holding a die in the current selection
export function toggleHold(state, dieId) {
  if (state.farkle || state.rolling || state.winner) return state;
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
        farkleTurnScore: newTurnScore,
        turnScore: 0,
        hasRolled: true,
        farkle: true,
        bustCount: (state.bustCount || 0) + 1,
        lastBustWord: word,
        pendingPrisonRelease: null,
        message: `💥 ${word} ${state.players[state.currentIndex].name} loses ${newTurnScore}.`,
        messageVariant: "danger",
      },
    };
  }

  const midState = {
    ...state,
    dice: newDice,
    turnScore: newTurnScore,
    hasRolled: true,
    luckyRollNext: false,
    perfectTenKPending: perfectTenK || false,
  };
  const prison = trackPrisonSixes(midState, values);
  let working = prison.state;
  if (prison.releaseMessage) {
    working = { ...working, message: prison.releaseMessage, messageVariant: "success" };
  }
  const sixWin = checkActiveSixOfAKindWin(working);
  if (sixWin) {
    return { state: sixWin, instantWin: true };
  }

  const newHotCount = allUsed ? (state.hotDiceCount || 0) + 1 : (state.hotDiceCount || 0);
  const earnedCharge = allUsed && newHotCount >= POWER_MODE_HOT_DICE;
  const idx = state.currentIndex;
  const hadCharge = !!state.players[idx]?.powerCharge;
  const players = earnedCharge && !hadCharge
    ? state.players.map((p, i) => (i === idx ? { ...p, powerCharge: true } : p))
    : state.players;
  const chargeJustEarned = earnedCharge && !hadCharge;

  const rollMessage = prison.releaseMessage
    ? prison.releaseMessage
    : chargeJustEarned
      ? "🔥 HOT DICE! Power charge earned — use it now or bank it for later!"
      : allUsed
        ? "🔥 HOT DICE! All 6 re-rolled."
        : "Select scoring dice, then bank or roll again.";

  return {
    state: {
      ...working,
      players,
      dice: newDice,
      turnScore: newTurnScore,
      hasRolled: true,
      luckyRollNext: false,
      perfectTenKPending: perfectTenK || false,
      hotDiceCount: newHotCount,
      message: rollMessage,
      messageVariant: prison.releaseMessage || allUsed || chargeJustEarned ? "success" : "info",
    },
  };
}

/** Whether a player is holding an unused power charge. */
export function playerHasPowerCharge(state, playerIndex = state?.currentIndex) {
  return !!state?.players?.[playerIndex]?.powerCharge;
}

/** Mark skin secret power as spent — consumes the player's power charge. */
export function consumeSkinPower(state) {
  const idx = state.currentIndex;
  return {
    ...state,
    skinPowerUsedThisTurn: true,
    players: state.players.map((p, i) =>
      i === idx ? { ...p, powerCharge: false } : p
    ),
  };
}

// Bank the current turn score and pass to next player.
// Returns new state; if someone wins, winner is set.
// Shark Bite: if the banker is marked, steal this bank's points and trigger FX
// (no turn skip — mark resolves only on bank).
export function bankAndPass(state) {
  const info = getHeldInfo(state);

  if (isSixOfAKind(info.held) && info.held.length === 6) {
    const players = state.players.map((p, i) =>
      i === state.currentIndex ? { ...p, score: TARGET_SCORE, onBoard: true } : p
    );
    return {
      ...state,
      players,
      winner: players[state.currentIndex],
      perfectTenK: true,
      perfectTenKPending: false,
      message: `🎯 SIX OF A KIND — INSTANT WIN!`,
      messageVariant: "success",
    };
  }

  // Include any currently-held valid selection into the bank
  let finalTurn = state.turnScore;
  if (info.valid && info.score > 0) {
    finalTurn += info.score;
  }

  const finishedIdx = state.currentIndex;
  const player = state.players[finishedIdx];
  const pendingSharkBite = playerHasDebuff(player, "shark_bite");
  const wasOnBoard = !!player.onBoard;
  const newPlayers = [...state.players];

  let message;
  let variant;
  let amountAdded = 0;

  if (!player.onBoard && finalTurn < ENTRY_THRESHOLD) {
    // Didn't make entry
    message = `${player.name} needs 1,000 to get on the board. Banked 0.`;
    variant = "warning";
  } else if (player.score + finalTurn > TARGET_SCORE) {
    // Overshoot — must land exactly on 10,000
    message = `💥 Overshoot! ${player.name} needed exactly ${TARGET_SCORE - player.score} — banked 0.`;
    variant = "danger";
  } else {
    amountAdded = finalTurn;
    newPlayers[finishedIdx] = {
      ...player,
      score: player.score + finalTurn,
      onBoard: true,
    };
    message = `${player.name} banked ${finalTurn.toLocaleString()}!`;
    variant = "success";
  }

  // Pending Shark Bite resolves on bank: undo this round's banked points.
  let sharkBiteFx = false;
  if (pendingSharkBite) {
    if (amountAdded > 0) {
      const afterBank = newPlayers[finishedIdx];
      newPlayers[finishedIdx] = {
        ...afterBank,
        score: Math.max(0, afterBank.score - amountAdded),
        onBoard: wasOnBoard,
      };
      message = `🦈 Shark ate ${player.name}'s bank (−${amountAdded.toLocaleString()})!`;
      variant = "danger";
    } else {
      message = `🦈 Shark struck as ${player.name} banked — nothing to eat.`;
      variant = "danger";
    }
    sharkBiteFx = true;
  }

  // Check win (after any shark steal so a bitten bank can't claim the win)
  const winner = newPlayers[finishedIdx].score >= TARGET_SCORE
    ? newPlayers[finishedIdx]
    : null;

  if (winner) {
    return {
      ...state,
      players: newPlayers,
      winner,
      sharkBiteFx: false,
      sharkDiceHidden: false,
      message: `🎉 ${winner.name} wins with ${winner.score.toLocaleString()}!`,
      messageVariant: "success",
    };
  }

  // Sabotage debuffs on the banker clear; power charge carries to their next turn.
  const chargeSaved =
    !pendingSharkBite &&
    !!newPlayers[finishedIdx]?.powerCharge &&
    !state.skinPowerUsedThisTurn;
  const playersAfterBank = finishBankedTurn(newPlayers, finishedIdx, {
    skinPowerUsedThisTurn: state.skinPowerUsedThisTurn,
  });

  const nextIndex = (finishedIdx + 1) % state.players.length;
  const bankMessage = chargeSaved ? `${message} ⚡ Power charge saved for your next turn.` : message;
  return {
    ...state,
    players: playersAfterBank,
    currentIndex: nextIndex,
    dice: makeFreshDice(),
    turnScore: 0,
    hasRolled: false,
    farkle: false,
    farkleTurnScore: null,
    pendingPrisonRelease: null,
    perfectTenKPending: false,
    turnScoreMultiplier: 1,
    doubleOrNothing: false,
    luckyRollNext: false,
    sharkBiteFx,
    // Dice stay gone through FX; cleared when FX completes / next round is ready.
    sharkDiceHidden: sharkBiteFx,
    ...turnPowerReset(),
    message: `${bankMessage} ${playersAfterBank[nextIndex].name}'s turn.`,
    messageVariant: variant,
  };
}

// Pass turn after a Farkle
export function passAfterFarkle(state) {
  const bustedIdx = state.currentIndex;
  const nextIndex = (state.currentIndex + 1) % state.players.length;
  const busted = state.players[bustedIdx];
  // Shark Bite waits for a bank — survive farkle clears. Other debuffs drop.
  const keepShark = sharkBiteDebuffOnly(busted);
  let players = state.players.map((p, i) =>
    i === bustedIdx ? { ...p, debuffs: keepShark, powerCharge: false } : p
  );
  // Fired a power then busted — sabotage effects you cast are lost.
  if (state.skinPowerUsedThisTurn) {
    players = clearDebuffsFromCaster(players, bustedIdx);
  }
  let nextState = {
    ...state,
    players,
    currentIndex: nextIndex,
    dice: makeFreshDice(),
    turnScore: 0,
    hasRolled: false,
    farkle: false,
    farkleTurnScore: null,
    pendingPrisonRelease: null,
    perfectTenKPending: false,
    turnScoreMultiplier: 1,
    doubleOrNothing: false,
    luckyRollNext: false,
    // Fresh turn for the next player — restore tray dice if a prior bite hid them.
    sharkDiceHidden: false,
    sharkBiteFx: false,
    ...turnPowerReset(),
    message: `${players[nextIndex].name}'s turn — roll the dice!`,
    messageVariant: "info",
  };
  if (state.skinPowerUsedThisTurn) {
    nextState = clearPrisonFromCaster(nextState, bustedIdx);
  }
  return nextState;
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