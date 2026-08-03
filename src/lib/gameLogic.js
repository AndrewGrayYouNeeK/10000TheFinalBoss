// Core game state manipulation for Dice 10,000
import {
  scoreSelection,
  hasAnyScore,
  isSixOfAKind,
  heldSelectionPoints,
  maxValidScore,
} from "./scoring";
import { getPowerChargeHotDiceThreshold } from "./skinPowers";
import { trackPrisonSixes, clearPrisonFromCaster } from "./prisonDice";
import { applyMatrixGlitchToDice } from "./matrixGlitch";

export const TARGET_SCORE = 10000;
export const ENTRY_THRESHOLD = 1000;
/** Six-of-a-kind instant win — tuned to 1 in 10,000 per full 6-die roll. */
export const PERFECT_TENK_ODDS = 1 / 10000;

// Bust words — alternated on each bust for variety.
const BUST_WORDS = ["YEEEET!", "SKRRRT!"];
function bustWord(count) {
  return BUST_WORDS[count % BUST_WORDS.length];
}

/** True for YEEEET / YEEET / SKRRRT / SKEERT style bust shouts. */
export function isBustWord(word) {
  if (!word || typeof word !== "string") return false;
  const n = word.toUpperCase().replace(/[^A-Z]/g, "");
  return /^Y+E+T$/.test(n) || /^SK+R+T$/.test(n);
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
    matrixGlitchArmed: null,
  };
}

/** End a player's turn on bank — debuffs on them clear; power charge is kept. */
function finishBankedTurn(players, playerIndex) {
  const p = players[playerIndex];
  if (!p) return players;
  const next = [...players];
  // Charge survives banking / turn pass. Only firing consumes it (consumeSkinPower).
  next[playerIndex] = { ...p, debuffs: [], powerCharge: !!p.powerCharge };
  return next;
}

/** Double or Nothing armed this turn, or cursed via level-10 sabo. */
function isDoubleOrNothingLive(state) {
  if (state?.doubleOrNothing) return true;
  const player = state?.players?.[state.currentIndex];
  return (player?.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "double_or_nothing_curse"
  );
}

/** Effective turn score multiplier (DoN / curse forces at least ×2). */
function turnScoreMult(state) {
  let m = state?.turnScoreMultiplier || 1;
  if (isDoubleOrNothingLive(state)) m = Math.max(m, 2);
  return m;
}

/**
 * True when the best legal scoring subset of the active board would push
 * banked + turn over TARGET — automatic bust (no cherry-picking under the line).
 */
function maxSelectionWouldOvershoot(state, activeValues, turnScore = state.turnScore) {
  const player = state.players[state.currentIndex];
  if (!player) return false;
  const maxPts = maxValidScore(activeValues);
  if (maxPts <= 0) return false;
  const mult = turnScoreMult(state);
  return player.score + turnScore + Math.floor(maxPts * mult) > TARGET_SCORE;
}

/** Build farkle / overshoot bust state. Double or Nothing wipes banked score to 0. */
function applyBust(state, {
  dice = state.dice,
  lostTurnScore = state.turnScore,
  overshoot = false,
} = {}) {
  const idx = state.currentIndex;
  const player = state.players[idx];
  const name = player?.name || "Player";
  const word = bustWord(state.bustCount || 0);
  const don = isDoubleOrNothingLive(state);
  let players = state.players;
  let message;
  if (don) {
    players = state.players.map((p, i) =>
      i === idx ? { ...p, score: 0, onBoard: false } : p
    );
    message = overshoot
      ? `💥 Overshoot + Double or Nothing — ${name} drops to 0!`
      : `💥 ${word} Double or Nothing — ${name} drops to 0!`;
  } else if (overshoot) {
    message = `💥 Overshoot! ${name} needed exactly ${TARGET_SCORE - (player?.score || 0)} — busted.`;
  } else {
    message = `💥 ${word} ${name} loses turn score.`;
  }
  return {
    ...state,
    players,
    dice,
    farkle: true,
    farkleTurnScore: lostTurnScore,
    turnScore: 0,
    bustCount: (state.bustCount || 0) + 1,
    lastBustWord: word,
    doubleOrNothing: false,
    turnScoreMultiplier: 1,
    perfectTenKPending: false,
    pendingPrisonRelease: null,
    message,
    messageVariant: "danger",
  };
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

/** Shark Bite mark entry (object with optional `from` caster index). */
function getSharkBiteDebuff(player) {
  const entry = (player?.debuffs || []).find(
    (d) => (typeof d === "string" ? d : d.id) === "shark_bite"
  );
  if (!entry) return null;
  return typeof entry === "string" ? { id: "shark_bite" } : entry;
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
  if (
    !state?.sharkBiteFx &&
    !state?.sharkFishFeast &&
    state?.sharkFishFeastTargetIdx == null &&
    !state?.sharkDiceHidden
  ) {
    return state;
  }
  return {
    ...state,
    sharkBiteFx: false,
    sharkFishFeast: false,
    sharkFishFeastTargetIdx: null,
    // FX finished — put tray dice back immediately (do not leave skins vanished).
    sharkDiceHidden: false,
  };
}

/** Restore tray dice after a shark bite (preview / next round). */
export function restoreSharkDice(state) {
  if (!state?.sharkDiceHidden) return state;
  return { ...state, sharkDiceHidden: false };
}

export function createInitialState(playerNames, options = {}) {
  const { playerSkins = [], startScores = null, firstPlayerIndex = 0 } = options;
  const startIdx =
    Number.isInteger(firstPlayerIndex) && firstPlayerIndex >= 0 && firstPlayerIndex < playerNames.length
      ? firstPlayerIndex
      : 0;
  return {
    players: playerNames.map((name, i) => {
      const skin = playerSkins[i] || { skinId: "classic_white" };
      const startScore =
        Array.isArray(startScores) && typeof startScores[i] === "number" && startScores[i] > 0
          ? startScores[i]
          : 0;
      return {
        name,
        score: startScore,
        onBoard: startScore >= ENTRY_THRESHOLD,
        debuffs: [],
        powerCharge: false,
        skinId: skin.skinId || "classic_white",
        ...(skin.trueSkinId ? { trueSkinId: skin.trueSkinId } : {}),
        ...(skin.ghostBare ? { ghostBare: true } : {}),
      };
    }),
    currentIndex: startIdx,
    dice: makeFreshDice(),
    rolling: false,
    hasRolled: false,
    turnScore: 0,
    winner: null,
    message: `${playerNames[startIdx]}'s turn — roll the dice!`,
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
    xrayScannerIndex: null,
    prisonDice: null,
    sharkBiteFx: false,
    sharkDiceHidden: false,
    sharkFishFeast: false,
    sharkFishFeastTargetIdx: null,
    storyIceFreeze: null,
    matrixGlitchArmed: null,
    matrixGlitchFx: false,
    matrixGlitchDieIds: [],
  };
}

/** Story Frosty freeze is active (enemy skipped until caster busts). */
export function isStoryIceFreezeActive(state) {
  return !!state?.storyIceFreeze;
}

export function clearStoryIceFreeze(state) {
  if (!state?.storyIceFreeze) return state;
  return { ...state, storyIceFreeze: null };
}

/** Whether the human can fire story Frosty (any player-turn phase, or before enemy banks). */
export function canStoryIceFire(state, playerIndex = 0) {
  if (!state || state.winner || state.storyIceFreeze) return false;
  const player = state.players?.[playerIndex];
  if (!player?.powerCharge) return false;
  if (playerHasDebuff(player, "lockout")) return false;

  const targetIdx = (playerIndex + 1) % (state.players?.length || 1);
  if (state.currentIndex === playerIndex) return true;
  if (state.currentIndex === targetIdx) {
    return !!state.hasRolled && !state.farkle && !state.sharkBiteFx;
  }
  return false;
}

function beginStoryIceCasterTurn(state, casterIdx) {
  const caster = state.players[casterIdx];
  return {
    ...state,
    currentIndex: casterIdx,
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
    sharkDiceHidden: false,
    sharkBiteFx: false,
    ...turnPowerReset(),
    message: `${caster?.name}'s turn — enemy frozen!`,
    messageVariant: "info",
  };
}

/** Fire story Frosty — mark enemy frozen, consume charge, yank turn from enemy if needed. */
export function applyStoryIceFreeze(state, casterIdx = 0) {
  const targetIdx = (casterIdx + 1) % state.players.length;
  const targetName = state.players[targetIdx]?.name || "opponent";
  let next = {
    ...clearStoryIceFreeze(state),
    storyIceFreeze: { casterIdx, targetIdx },
    skinPowerUsedThisTurn: state.currentIndex === casterIdx ? true : state.skinPowerUsedThisTurn,
    players: state.players.map((p, i) =>
      i === casterIdx ? { ...p, powerCharge: false } : p
    ),
    message: `❄️ ${targetName} is frozen!`,
    messageVariant: "success",
  };
  if (state.currentIndex === targetIdx) {
    next = beginStoryIceCasterTurn(next, casterIdx);
    next.message = `❄️ ${targetName} is frozen!`;
    next.messageVariant = "success";
  } else if (state.currentIndex === casterIdx && state.farkle) {
    next = {
      ...next,
      farkle: false,
      farkleTurnScore: null,
      turnScore: 0,
      hasRolled: false,
      dice: makeFreshDice(),
      message: `❄️ ${targetName} is frozen!`,
      messageVariant: "success",
    };
  }
  return next;
}

/** If the frozen enemy somehow becomes active, skip straight back to the caster. */
export function skipFrozenOpponentTurn(state) {
  const ice = state?.storyIceFreeze;
  if (!ice || state.currentIndex !== ice.targetIdx) return state;
  return beginStoryIceCasterTurn(state, ice.casterIdx);
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

function tryMatrixGlitchRescue(state, dice) {
  const diceCount = state.matrixGlitchArmed?.diceCount;
  if (!diceCount) return null;

  const activeValues = dice.filter((d) => !d.used).map((d) => d.value);
  if (hasAnyScore(activeValues)) return null;

  const { dice: glitchedDice, glitchedIds } = applyMatrixGlitchToDice(dice, diceCount);
  const afterValues = glitchedDice.filter((d) => !d.used).map((d) => d.value);
  if (!hasAnyScore(afterValues)) return null;

  const currentName = state.players[state.currentIndex]?.name || "Player";
  const n = glitchedIds.length;
  return {
    ...state,
    dice: glitchedDice,
    farkle: false,
    matrixGlitchArmed: null,
    matrixGlitchFx: true,
    matrixGlitchDieIds: glitchedIds,
    pendingPrisonRelease: null,
    message: `⚡ Matrix Glitch — ${currentName} rewrote ${n} die${n === 1 ? "" : "s"}!`,
    messageVariant: "success",
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
        pendingPrisonRelease: null,
        message: `🛡️ Shield saved ${currentName}'s turn score!`,
        messageVariant: "success",
      };
    }
    const glitchRescue = tryMatrixGlitchRescue(state, state.dice);
    if (glitchRescue) return glitchRescue;
    return applyBust(state);
  }

  const sixWin = checkActiveSixOfAKindWin(state);
  if (sixWin) return sixWin;

  // Endgame: best legal take from this roll would overshoot 10,000 → auto-bust.
  if (maxSelectionWouldOvershoot(state, active)) {
    return applyBust(state, { overshoot: true });
  }

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
// options.powerChargeHotDiceThreshold — override hot-dice count needed for power charge (dev/testing).
export function confirmAndReroll(state, options = {}) {
  const held = getHeldInfo(state);
  if (!held.valid || held.score === 0) return { state };

  const scored = held;

  // Mark held dice as used, add to turn score
  let newDice = state.dice.map(d => (d.held ? { ...d, used: true, held: false } : d));
  const mult = turnScoreMult(state);
  const newTurnScore = state.turnScore + Math.floor(scored.score * mult);

  // Overshoot bust — you must land EXACTLY on 10,000. If the locked-in turn score
  // already pushes the player over, end the turn immediately (no further rolls).
  const currentPlayer = state.players[state.currentIndex];
  if (currentPlayer.score + newTurnScore > TARGET_SCORE) {
    return {
      state: applyBust(
        { ...state, turnScore: newTurnScore, hasRolled: true },
        { dice: newDice, lostTurnScore: newTurnScore, overshoot: true }
      ),
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
    const glitchRescue = tryMatrixGlitchRescue(
      { ...state, turnScore: newTurnScore, hasRolled: true },
      newDice
    );
    if (glitchRescue) {
      return { state: glitchRescue };
    }
    return {
      state: applyBust(
        { ...state, turnScore: newTurnScore, hasRolled: true },
        { dice: newDice, lostTurnScore: newTurnScore }
      ),
    };
  }

  // Best take from the new roll would overshoot → auto-bust
  if (
    maxSelectionWouldOvershoot(
      { ...state, turnScore: newTurnScore },
      activeVals,
      newTurnScore
    )
  ) {
    return {
      state: applyBust(
        { ...state, turnScore: newTurnScore, hasRolled: true },
        { dice: newDice, lostTurnScore: newTurnScore, overshoot: true }
      ),
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

  const idx = state.currentIndex;
  const newHotCount = allUsed ? (state.hotDiceCount || 0) + 1 : (state.hotDiceCount || 0);
  const hotDiceNeeded =
    options.powerChargeHotDiceThreshold ??
    getPowerChargeHotDiceThreshold(state.players[idx]);
  const earnedCharge = allUsed && newHotCount >= hotDiceNeeded;
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

/** Power-mode visuals / fire gate — charge persists across banks and busts until fire. */
export function isPlayerPowerModeActive(state, playerIndex = state?.currentIndex) {
  if (!state || state.winner) return false;
  return playerHasPowerCharge(state, playerIndex);
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
  if (state.farkle || state.winner || !state.hasRolled) return state;

  const info = getHeldInfo(state);
  const heldPts = heldSelectionPoints(info, state.perfectTenKPending);
  if (!info.valid || heldPts <= 0) return state;

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

  // Include any currently-held valid selection into the bank (respect DoN / streak mult)
  let finalTurn = state.turnScore;
  if (info.valid && info.score > 0) {
    finalTurn += Math.floor(info.score * turnScoreMult(state));
  }

  const finishedIdx = state.currentIndex;
  const player = state.players[finishedIdx];

  // Opening rule — reject illegal entry banks without ending the turn.
  if (!player.onBoard && finalTurn < ENTRY_THRESHOLD) {
    return {
      ...state,
      message: `${player.name} needs 1,000 to get on the board — keep rolling!`,
      messageVariant: "warning",
    };
  }

  const sharkMark = getSharkBiteDebuff(player);
  const pendingSharkBite = !!sharkMark;
  const scoreFrozen = playerHasDebuff(player, "freeze_score");
  const wasOnBoard = !!player.onBoard;
  const newPlayers = [...state.players];

  let message;
  let variant;
  let amountAdded = 0;

  if (scoreFrozen) {
    // Score Freeze — turn can still play out, but banked score cannot change.
    message = `🧊 ${player.name}'s score is frozen — bank had no effect!`;
    variant = "warning";
  } else if (player.score + finalTurn > TARGET_SCORE) {
    // Overshoot — must land exactly on 10,000
    if (isDoubleOrNothingLive(state)) {
      newPlayers[finishedIdx] = { ...player, score: 0, onBoard: false };
      message = `💥 Overshoot + Double or Nothing — ${player.name} drops to 0!`;
    } else {
      message = `💥 Overshoot! ${player.name} needed exactly ${TARGET_SCORE - player.score} — banked 0.`;
    }
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

  // Pending Shark Bite resolves on the MARKED opponent's bank only:
  // eat that round's banked points (never the caster's own bank).
  let sharkBiteFx = false;
  if (pendingSharkBite) {
    const casterIdx = typeof sharkMark?.from === "number" ? sharkMark.from : null;
    const selfMarked = casterIdx === finishedIdx;
    if (selfMarked) {
      // Bad mark on the caster — keep their bank; finishBankedTurn clears the mark.
      if (amountAdded > 0) {
        message = `${player.name} banked ${amountAdded.toLocaleString()}!`;
        variant = "success";
      }
    } else if (amountAdded > 0) {
      const afterBank = newPlayers[finishedIdx];
      newPlayers[finishedIdx] = {
        ...afterBank,
        score: Math.max(0, afterBank.score - amountAdded),
        onBoard: wasOnBoard,
      };
      message = `🦈 Shark ate ${player.name}'s bank (−${amountAdded.toLocaleString()})!`;
      variant = "danger";
      sharkBiteFx = true;
    } else {
      message = `🦈 Shark struck as ${player.name} banked — nothing to eat.`;
      variant = "danger";
      sharkBiteFx = true;
    }
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
      sharkFishFeast: false,
      sharkFishFeastTargetIdx: null,
      message: `🎉 ${winner.name} wins with ${winner.score.toLocaleString()}!`,
      messageVariant: "success",
    };
  }

  // Sabotage debuffs on the banker clear; power charge carries to their next turn
  // until they fire their secret power (bust alone does not consume charge).
  const chargeSaved = !!newPlayers[finishedIdx]?.powerCharge;
  const playersAfterBank = finishBankedTurn(newPlayers, finishedIdx);

  const storyIce = state.storyIceFreeze;
  if (storyIce && finishedIdx === storyIce.casterIdx) {
    const stayMessage =
      amountAdded > 0
        ? `${message} ❄️ Enemy still frozen — roll or bank again!`
        : `${message} ❄️ Enemy still frozen!`;
    return {
      ...state,
      players: playersAfterBank,
      currentIndex: storyIce.casterIdx,
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
      sharkBiteFx: false,
      sharkDiceHidden: false,
      sharkFishFeast: false,
      sharkFishFeastTargetIdx: null,
      ...turnPowerReset(),
      message: stayMessage,
      messageVariant: variant,
    };
  }

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
    // Bank-steal Shark Bite is not Feeding Frenzy.
    sharkFishFeast: false,
    sharkFishFeastTargetIdx: null,
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
  // Bust alone does not consume power charge — only firing does (consumeSkinPower).
  let players = state.players.map((p, i) =>
    i === bustedIdx ? { ...p, debuffs: keepShark } : p
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
  if (state.storyIceFreeze && bustedIdx === state.storyIceFreeze.casterIdx) {
    nextState = clearStoryIceFreeze(nextState);
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