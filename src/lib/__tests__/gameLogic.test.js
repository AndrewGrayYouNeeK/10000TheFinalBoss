import { describe, it, expect, afterEach, vi } from "vitest";
import {
  TARGET_SCORE,
  ENTRY_THRESHOLD,
  isBustWord,
  playerPowerChargeCount,
  clearDebuffsFromCaster,
  clearSharkBiteFx,
  restoreSharkDice,
  createInitialState,
  isStoryIceFreezeActive,
  clearStoryIceFreeze,
  canStoryIceFire,
  applyStoryIceFreeze,
  skipFrozenOpponentTurn,
  rollDice,
  evaluateRoll,
  toggleHold,
  getHeldInfo,
  confirmAndReroll,
  playerHasPowerCharge,
  isPlayerPowerModeActive,
  consumeSkinPower,
  bankAndPass,
  passAfterFarkle,
  getObscuredScoreIndices,
} from "../gameLogic";

/** Math.random value that makes rollDieValues produce `face`. */
const faceR = (face) => (face - 1) / 6 + 0.01;
/** Any value >= PERFECT_TENK_ODDS — consumed by the six-dice jackpot check. */
const NO_JACKPOT = 0.5;

function stubRandom(sequence) {
  let i = 0;
  vi.spyOn(Math, "random").mockImplementation(() =>
    sequence[Math.min(i++, sequence.length - 1)]
  );
}

function withDice(state, values, { usedIds = [], heldIds = [] } = {}) {
  return {
    ...state,
    dice: values.map((value, id) => ({
      id,
      value,
      used: usedIds.includes(id),
      held: heldIds.includes(id),
    })),
  };
}

function baseState(overrides = {}, initOptions = {}) {
  return { ...createInitialState(["Ada", "Bo"], initOptions), ...overrides };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isBustWord", () => {
  it("matches YEEEET / SKRRRT style shouts", () => {
    expect(isBustWord("YEEEET!")).toBe(true);
    expect(isBustWord("yeet")).toBe(true);
    expect(isBustWord("SKRRRT!")).toBe(true);
    expect(isBustWord("skrt")).toBe(true);
  });

  it("rejects other strings and non-strings", () => {
    expect(isBustWord("banked")).toBe(false);
    expect(isBustWord("")).toBe(false);
    expect(isBustWord(null)).toBe(false);
    expect(isBustWord(42)).toBe(false);
  });
});

describe("createInitialState", () => {
  it("seeds players, dice and turn state", () => {
    const state = createInitialState(["Ada", "Bo"]);
    expect(state.players).toHaveLength(2);
    expect(state.players[0]).toMatchObject({
      name: "Ada",
      score: 0,
      onBoard: false,
      skinId: "classic_white",
      powerCharge: false,
    });
    expect(state.dice).toHaveLength(6);
    expect(state.currentIndex).toBe(0);
    expect(state.turnScore).toBe(0);
    expect(state.message).toContain("Ada");
  });

  it("applies start scores, board status and player skins", () => {
    const state = createInitialState(["Ada", "Bo"], {
      startScores: [ENTRY_THRESHOLD, 200],
      playerSkins: [{ skinId: "ghost", trueSkinId: "gold", ghostBare: true }, {}],
    });
    expect(state.players[0]).toMatchObject({
      score: ENTRY_THRESHOLD,
      onBoard: true,
      skinId: "ghost",
      trueSkinId: "gold",
      ghostBare: true,
    });
    expect(state.players[1]).toMatchObject({ score: 200, onBoard: false });
  });

  it("honours a valid first player index and falls back to 0", () => {
    expect(createInitialState(["Ada", "Bo"], { firstPlayerIndex: 1 }).currentIndex).toBe(1);
    expect(createInitialState(["Ada", "Bo"], { firstPlayerIndex: 9 }).currentIndex).toBe(0);
    expect(createInitialState(["Ada", "Bo"], { firstPlayerIndex: -1 }).currentIndex).toBe(0);
  });
});

describe("power charge helpers", () => {
  it("counts the ready charge plus stacked extras", () => {
    expect(playerPowerChargeCount(undefined)).toBe(0);
    expect(playerPowerChargeCount({ powerCharge: false, powerCharges: 3 })).toBe(0);
    expect(playerPowerChargeCount({ powerCharge: true })).toBe(1);
    expect(playerPowerChargeCount({ powerCharge: true, powerCharges: 2 })).toBe(3);
  });

  it("reports power mode from the current player's charge", () => {
    const state = baseState();
    expect(playerHasPowerCharge(state)).toBe(false);
    const charged = {
      ...state,
      players: [{ ...state.players[0], powerCharge: true }, state.players[1]],
    };
    expect(playerHasPowerCharge(charged)).toBe(true);
    expect(isPlayerPowerModeActive(charged)).toBe(true);
    expect(isPlayerPowerModeActive({ ...charged, winner: charged.players[0] })).toBe(false);
  });

  it("consumeSkinPower spends the ready charge and promotes a queued one", () => {
    const state = baseState();
    const stacked = {
      ...state,
      players: [{ ...state.players[0], powerCharge: true, powerCharges: 1 }, state.players[1]],
    };
    const once = consumeSkinPower(stacked);
    expect(once.skinPowerUsedThisTurn).toBe(true);
    expect(once.players[0]).toMatchObject({ powerCharge: true, powerCharges: 0 });
    const twice = consumeSkinPower(once);
    expect(twice.players[0]).toMatchObject({ powerCharge: false, powerCharges: 0 });
  });
});

describe("clearDebuffsFromCaster", () => {
  it("drops object debuffs cast by the given player and keeps the rest", () => {
    const players = [
      { debuffs: [{ id: "static", from: 1 }, { id: "lockout", from: 0 }, "blackout"] },
      { debuffs: [] },
    ];
    const [first] = clearDebuffsFromCaster(players, 1);
    expect(first.debuffs).toEqual([{ id: "lockout", from: 0 }, "blackout"]);
  });
});

describe("shark bite FX helpers", () => {
  it("clearSharkBiteFx is a no-op when nothing is active", () => {
    const state = baseState();
    expect(clearSharkBiteFx(state)).toBe(state);
  });

  it("clearSharkBiteFx resets FX flags and restores dice", () => {
    const state = baseState({ sharkBiteFx: true, sharkDiceHidden: true, sharkFishFeast: true });
    expect(clearSharkBiteFx(state)).toMatchObject({
      sharkBiteFx: false,
      sharkDiceHidden: false,
      sharkFishFeast: false,
      sharkFishFeastTargetIdx: null,
    });
  });

  it("restoreSharkDice only touches hidden dice", () => {
    const state = baseState();
    expect(restoreSharkDice(state)).toBe(state);
    expect(restoreSharkDice({ ...state, sharkDiceHidden: true }).sharkDiceHidden).toBe(false);
  });
});

describe("rollDice", () => {
  it("rolls only unused dice and clears held flags", () => {
    stubRandom([faceR(3)]);
    const state = withDice(baseState(), [1, 2, 3, 4, 5, 6], { usedIds: [0], heldIds: [1] });
    const next = rollDice(state);
    expect(next.dice[0]).toMatchObject({ value: 1, used: true });
    expect(next.dice.slice(1).map((d) => d.value)).toEqual([3, 3, 3, 3, 3]);
    expect(next.dice.every((d) => !d.held)).toBe(true);
    expect(next.hasRolled).toBe(true);
    expect(next.sharkDiceHidden).toBe(false);
  });

  it("advances prison progress for the caster and announces the release", () => {
    stubRandom([NO_JACKPOT, faceR(6)]);
    const state = withDice(
      baseState({ prisonDice: { casterIdx: 0, targetIdx: 1, sixCount: 0 } }),
      [1, 1, 1, 1, 1, 1]
    );
    const next = rollDice(state);
    expect(next.prisonDice).toBeNull();
    expect(next.pendingPrisonRelease).toContain("Prison broken");
  });
});

describe("evaluateRoll", () => {
  it("busts on a farkle and tracks the bust word", () => {
    const state = withDice(baseState({ turnScore: 450 }), [2, 3, 4, 6, 2, 3]);
    const next = evaluateRoll(state);
    expect(next.farkle).toBe(true);
    expect(next.turnScore).toBe(0);
    expect(next.farkleTurnScore).toBe(450);
    expect(next.bustCount).toBe(1);
    expect(isBustWord(next.lastBustWord)).toBe(true);
    expect(next.messageVariant).toBe("danger");
  });

  it("wipes banked score when Double or Nothing is live on the bust", () => {
    const state = withDice(
      baseState({ turnScore: 300, doubleOrNothing: true }, { startScores: [4000, 0] }),
      [2, 3, 4, 6, 2, 3]
    );
    const next = evaluateRoll(state);
    expect(next.players[0]).toMatchObject({ score: 0, onBoard: false });
    expect(next.message).toContain("Double or Nothing");
  });

  it("spends a power shield instead of busting", () => {
    const state = withDice(baseState({ turnScore: 300, powerShield: true }), [2, 3, 4, 6, 2, 3]);
    const next = evaluateRoll(state);
    expect(next.farkle).toBe(false);
    expect(next.powerShield).toBe(false);
    expect(next.turnScore).toBe(300);
    expect(next.message).toContain("Shield saved");
  });

  it("awards an instant win for six of a kind on the board", () => {
    const state = withDice(baseState(), [2, 2, 2, 2, 2, 2]);
    const next = evaluateRoll(state);
    expect(next.winner).toBe(next.players[0]);
    expect(next.players[0].score).toBe(TARGET_SCORE);
    expect(next.perfectTenK).toBe(true);
  });

  it("auto-busts when the best legal take would overshoot the target", () => {
    const state = withDice(baseState({}, { startScores: [9950, 0] }), [1, 2, 3, 4, 6, 6]);
    const next = evaluateRoll(state);
    expect(next.farkle).toBe(true);
    expect(next.message).toContain("Overshoot");
  });

  it("keeps a pending prison-release banner when the roll still scores", () => {
    const state = withDice(
      baseState({ pendingPrisonRelease: "⛓️ Prison broken — Bo's dice restored!" }),
      [1, 2, 3, 4, 6, 6]
    );
    const next = evaluateRoll(state);
    expect(next.message).toContain("Prison broken");
    expect(next.pendingPrisonRelease).toBeNull();
    expect(next.messageVariant).toBe("success");
  });

  it("scrambles the glitched player's dice and consumes the debuff", () => {
    const state = withDice(
      baseState({
        players: [
          { name: "Ada", score: 0, onBoard: false, debuffs: [{ id: "matrix_glitch", diceCount: 2, from: 1 }] },
          { name: "Bo", score: 0, onBoard: false, debuffs: [] },
        ],
      }),
      [1, 1, 1, 1, 1, 1]
    );
    const next = evaluateRoll(state);
    expect(next.matrixGlitchFx).toBe(true);
    expect(next.matrixGlitchDieIds).toHaveLength(2);
    expect(next.players[0].debuffs).toEqual([]);
    expect(next.message).toContain("Matrix Glitch");
  });

  it("prompts for a selection on an ordinary scoring roll", () => {
    const state = withDice(baseState(), [1, 2, 3, 4, 6, 6]);
    expect(evaluateRoll(state).message).toBe("Select scoring dice, then bank or roll again.");
  });
});

describe("toggleHold / getHeldInfo", () => {
  it("toggles unused dice only", () => {
    const state = withDice(baseState(), [1, 5, 3, 3, 3, 2], { usedIds: [0] });
    expect(toggleHold(state, 0).dice[0].held).toBe(false);
    const held = toggleHold(state, 1);
    expect(held.dice[1].held).toBe(true);
    expect(toggleHold(held, 1).dice[1].held).toBe(false);
  });

  it("is blocked while farkled, rolling or after a win", () => {
    const state = withDice(baseState(), [1, 5, 3, 3, 3, 2]);
    expect(toggleHold({ ...state, farkle: true }, 1).dice[1].held).toBe(false);
    expect(toggleHold({ ...state, rolling: true }, 1).dice[1].held).toBe(false);
    expect(toggleHold({ ...state, winner: state.players[0] }, 1).dice[1].held).toBe(false);
  });

  it("scores the held selection", () => {
    const state = withDice(baseState(), [3, 3, 3, 1, 2, 4], { heldIds: [0, 1, 2] });
    expect(getHeldInfo(state)).toMatchObject({ held: [3, 3, 3], score: 300, valid: true });
  });
});

describe("confirmAndReroll", () => {
  it("does nothing without a valid scoring selection", () => {
    const state = withDice(baseState(), [2, 3, 4, 6, 6, 6], { heldIds: [0] });
    expect(confirmAndReroll(state)).toEqual({ state });
  });

  it("locks the selection into the turn score and rerolls the rest", () => {
    stubRandom([faceR(6)]);
    const state = withDice(baseState(), [1, 1, 1, 2, 3, 4], { heldIds: [0, 1, 2] });
    const { state: next } = confirmAndReroll(state);
    expect(next.turnScore).toBe(1000);
    expect(next.dice.slice(0, 3).every((d) => d.used && !d.held)).toBe(true);
    expect(next.dice.slice(3).map((d) => d.value)).toEqual([6, 6, 6]);
    expect(next.message).toBe("Select scoring dice, then bank or roll again.");
  });

  it("applies the turn score multiplier", () => {
    stubRandom([faceR(6)]);
    const state = withDice(baseState({ turnScoreMultiplier: 3 }), [1, 1, 1, 2, 3, 4], {
      heldIds: [0, 1, 2],
    });
    expect(confirmAndReroll(state).state.turnScore).toBe(3000);
  });

  it("forces at least a doubled turn score under Double or Nothing", () => {
    stubRandom([faceR(6)]);
    const state = withDice(baseState({ doubleOrNothing: true }), [1, 1, 1, 2, 3, 4], {
      heldIds: [0, 1, 2],
    });
    expect(confirmAndReroll(state).state.turnScore).toBe(2000);
  });

  it("busts immediately when the locked-in score overshoots the target", () => {
    const state = withDice(baseState({}, { startScores: [9950, 0] }), [1, 2, 3, 4, 6, 6], {
      heldIds: [0],
    });
    const { state: next } = confirmAndReroll(state);
    expect(next.farkle).toBe(true);
    expect(next.farkleTurnScore).toBe(100);
    expect(next.message).toContain("Overshoot");
  });

  it("refreshes all six dice on hot dice and grants a power charge", () => {
    stubRandom([NO_JACKPOT, faceR(1), faceR(2), faceR(3), faceR(4), faceR(6), faceR(6)]);
    const state = withDice(baseState(), [1, 2, 3, 4, 5, 6], { heldIds: [0, 1, 2, 3, 4, 5] });
    const { state: next } = confirmAndReroll(state);
    expect(next.turnScore).toBe(1500);
    expect(next.dice.every((d) => !d.used)).toBe(true);
    expect(next.hotDiceCount).toBe(1);
    expect(next.players[0].powerCharge).toBe(true);
    expect(next.message).toContain("Power charge earned");
  });

  it("stacks an extra charge when the player is already charged", () => {
    stubRandom([NO_JACKPOT, faceR(1), faceR(2), faceR(3), faceR(4), faceR(6), faceR(6)]);
    const withCharge = baseState();
    const state = withDice(
      {
        ...withCharge,
        players: [{ ...withCharge.players[0], powerCharge: true }, withCharge.players[1]],
      },
      [1, 2, 3, 4, 5, 6],
      { heldIds: [0, 1, 2, 3, 4, 5] }
    );
    const { state: next } = confirmAndReroll(state);
    expect(next.players[0]).toMatchObject({ powerCharge: true, powerCharges: 1 });
    expect(next.message).toContain("stacked");
  });

  it("busts when the reroll farkles", () => {
    stubRandom([faceR(2)]);
    const state = withDice(baseState(), [1, 1, 1, 1, 3, 4], { heldIds: [0, 1, 2, 3] });
    const { state: next } = confirmAndReroll(state);
    expect(next.farkle).toBe(true);
    expect(next.farkleTurnScore).toBe(2000);
  });

  it("busts when the reroll can only overshoot", () => {
    stubRandom([faceR(1)]);
    const state = withDice(baseState({}, { startScores: [9000, 0] }), [1, 1, 1, 2, 3, 4], {
      heldIds: [0, 1, 2],
    });
    const { state: next } = confirmAndReroll(state);
    expect(next.farkle).toBe(true);
    expect(next.message).toContain("Overshoot");
  });

  it("reports an instant win when the reroll lands six of a kind", () => {
    stubRandom([NO_JACKPOT, faceR(4)]);
    const state = withDice(baseState(), [1, 2, 3, 4, 5, 6], { heldIds: [0, 1, 2, 3, 4, 5] });
    const result = confirmAndReroll(state);
    expect(result.instantWin).toBe(true);
    expect(result.state.players[0].score).toBe(TARGET_SCORE);
  });

  it("guarantees a scoring die on a lucky roll", () => {
    stubRandom([faceR(2)]);
    const state = withDice(baseState({ luckyRollNext: true }), [1, 1, 1, 1, 3, 4], {
      heldIds: [0, 1, 2, 3],
    });
    const { state: next } = confirmAndReroll(state);
    expect(next.farkle).toBeFalsy();
    expect(next.dice[4].value).toBe(1);
    expect(next.luckyRollNext).toBe(false);
  });
});

describe("bankAndPass", () => {
  const readyState = (overrides = {}, initOptions = {}) =>
    withDice(baseState({ hasRolled: true, ...overrides }, initOptions), [1, 1, 1, 2, 3, 4], {
      heldIds: [0, 1, 2],
    });

  it("ignores banking while farkled, won, or before rolling", () => {
    const state = readyState();
    expect(bankAndPass({ ...state, farkle: true })).toMatchObject({ farkle: true });
    expect(bankAndPass({ ...state, hasRolled: false }).currentIndex).toBe(0);
    expect(bankAndPass({ ...state, winner: state.players[0] }).currentIndex).toBe(0);
  });

  it("ignores banking with an invalid or scoreless selection", () => {
    const state = withDice(baseState({ hasRolled: true }), [2, 3, 4, 6, 6, 6], { heldIds: [0] });
    expect(bankAndPass(state)).toBe(state);
  });

  it("rejects an entry bank below the 1,000 threshold", () => {
    const state = withDice(baseState({ hasRolled: true }), [1, 5, 3, 4, 6, 2], { heldIds: [0, 1] });
    const next = bankAndPass(state);
    expect(next.currentIndex).toBe(0);
    expect(next.players[0].score).toBe(0);
    expect(next.message).toContain("needs 1,000");
    expect(next.messageVariant).toBe("warning");
  });

  it("banks the turn, resets the board and passes the turn", () => {
    const next = bankAndPass(readyState({ turnScore: 500 }, { startScores: [2000, 0] }));
    expect(next.players[0]).toMatchObject({ score: 3500, onBoard: true });
    expect(next.currentIndex).toBe(1);
    expect(next.turnScore).toBe(0);
    expect(next.hasRolled).toBe(false);
    expect(next.dice.every((d) => !d.used && !d.held)).toBe(true);
    expect(next.message).toContain("banked 1,500");
    expect(next.message).toContain("Bo's turn");
  });

  it("gets an off-board player on the board at exactly the threshold", () => {
    const next = bankAndPass(readyState());
    expect(next.players[0]).toMatchObject({ score: ENTRY_THRESHOLD, onBoard: true });
  });

  it("wins instantly on a banked six of a kind", () => {
    const state = withDice(
      baseState({ hasRolled: true, perfectTenKPending: true }),
      [1, 1, 1, 1, 1, 1],
      { heldIds: [0, 1, 2, 3, 4, 5] }
    );
    const next = bankAndPass(state);
    expect(next.perfectTenK).toBe(true);
    expect(next.winner.score).toBe(TARGET_SCORE);
    expect(next.message).toContain("INSTANT WIN");
  });

  it("declares a winner once the target is reached", () => {
    const next = bankAndPass(readyState({}, { startScores: [9000, 0] }));
    expect(next.winner.name).toBe("Ada");
    expect(next.message).toContain("wins with 10,000");
  });

  it("banks nothing on overshoot", () => {
    const next = bankAndPass(readyState({}, { startScores: [9500, 0] }));
    expect(next.players[0].score).toBe(9500);
    expect(next.message).toContain("Overshoot");
    expect(next.messageVariant).toBe("danger");
  });

  it("drops an overshooting Double or Nothing player to zero", () => {
    const next = bankAndPass(readyState({ doubleOrNothing: true }, { startScores: [9500, 0] }));
    expect(next.players[0]).toMatchObject({ score: 0, onBoard: false });
    expect(next.message).toContain("Double or Nothing");
  });

  it("leaves a frozen score untouched", () => {
    const state = readyState({}, { startScores: [2000, 0] });
    const frozen = {
      ...state,
      players: [{ ...state.players[0], debuffs: ["freeze_score"] }, state.players[1]],
    };
    const next = bankAndPass(frozen);
    expect(next.players[0].score).toBe(2000);
    expect(next.message).toContain("frozen");
  });

  it("lets a marked Shark Bite eat the banked points", () => {
    const state = readyState({}, { startScores: [2000, 0] });
    const marked = {
      ...state,
      players: [
        { ...state.players[0], debuffs: [{ id: "shark_bite", from: 1 }] },
        state.players[1],
      ],
    };
    const next = bankAndPass(marked);
    expect(next.players[0]).toMatchObject({ score: 2000, onBoard: true });
    expect(next.sharkBiteFx).toBe(true);
    expect(next.sharkDiceHidden).toBe(true);
    expect(next.message).toContain("Shark ate");
    expect(next.players[0].debuffs).toEqual([]);
  });

  it("keeps the caster's own bank when they are self-marked", () => {
    const state = readyState({}, { startScores: [2000, 0] });
    const selfMarked = {
      ...state,
      players: [
        { ...state.players[0], debuffs: [{ id: "shark_bite", from: 0 }] },
        state.players[1],
      ],
    };
    const next = bankAndPass(selfMarked);
    expect(next.players[0].score).toBe(3000);
    expect(next.message).toContain("banked 1,000");
  });

  it("notes a saved power charge in the bank message", () => {
    const state = readyState({}, { startScores: [2000, 0] });
    const charged = {
      ...state,
      players: [{ ...state.players[0], powerCharge: true }, state.players[1]],
    };
    const next = bankAndPass(charged);
    expect(next.players[0].powerCharge).toBe(true);
    expect(next.message).toContain("Power charge saved");
  });

  it("keeps the turn with the caster while the story freeze holds", () => {
    const state = readyState({ storyIceFreeze: { casterIdx: 0, targetIdx: 1 } }, {
      startScores: [2000, 0],
    });
    const next = bankAndPass(state);
    expect(next.currentIndex).toBe(0);
    expect(next.message).toContain("Enemy still frozen");
  });
});

describe("passAfterFarkle", () => {
  it("passes the turn and resets the board", () => {
    const state = baseState({ farkle: true, turnScore: 0, farkleTurnScore: 400, hasRolled: true });
    const next = passAfterFarkle(state);
    expect(next.currentIndex).toBe(1);
    expect(next.farkle).toBe(false);
    expect(next.farkleTurnScore).toBeNull();
    expect(next.hasRolled).toBe(false);
    expect(next.message).toContain("Bo's turn");
  });

  it("keeps a pending Shark Bite mark but drops other debuffs", () => {
    const state = baseState({ farkle: true });
    const busted = {
      ...state,
      players: [
        { ...state.players[0], debuffs: [{ id: "shark_bite", from: 1 }, "lockout"] },
        state.players[1],
      ],
    };
    expect(passAfterFarkle(busted).players[0].debuffs).toEqual([{ id: "shark_bite", from: 1 }]);
  });

  it("clears sabotage the busted player cast this turn", () => {
    const state = baseState({ farkle: true, skinPowerUsedThisTurn: true });
    const busted = {
      ...state,
      prisonDice: { casterIdx: 0, targetIdx: 1, sixCount: 1 },
      players: [state.players[0], { ...state.players[1], debuffs: [{ id: "static", from: 0 }] }],
    };
    const next = passAfterFarkle(busted);
    expect(next.players[1].debuffs).toEqual([]);
    expect(next.prisonDice).toBeNull();
  });

  it("thaws a story freeze when its caster busts", () => {
    const state = baseState({ farkle: true, storyIceFreeze: { casterIdx: 0, targetIdx: 1 } });
    expect(passAfterFarkle(state).storyIceFreeze).toBeNull();
  });
});

describe("story ice freeze", () => {
  const charged = (overrides = {}) => {
    const state = baseState(overrides);
    return {
      ...state,
      players: [{ ...state.players[0], powerCharge: true }, state.players[1]],
    };
  };

  it("tracks and clears freeze state", () => {
    expect(isStoryIceFreezeActive(baseState())).toBe(false);
    const frozen = baseState({ storyIceFreeze: { casterIdx: 0, targetIdx: 1 } });
    expect(isStoryIceFreezeActive(frozen)).toBe(true);
    expect(clearStoryIceFreeze(frozen).storyIceFreeze).toBeNull();
    const plain = baseState();
    expect(clearStoryIceFreeze(plain)).toBe(plain);
  });

  it("gates firing on charge, lockout and whose turn it is", () => {
    expect(canStoryIceFire(baseState())).toBe(false);
    expect(canStoryIceFire(charged())).toBe(true);
    expect(canStoryIceFire(charged({ storyIceFreeze: { casterIdx: 0, targetIdx: 1 } }))).toBe(false);

    const lockedOut = charged();
    lockedOut.players[0].debuffs = ["lockout"];
    expect(canStoryIceFire(lockedOut)).toBe(false);

    const enemyTurn = charged({ currentIndex: 1, hasRolled: true });
    expect(canStoryIceFire(enemyTurn)).toBe(true);
    expect(canStoryIceFire({ ...enemyTurn, hasRolled: false })).toBe(false);
    expect(canStoryIceFire({ ...enemyTurn, farkle: true })).toBe(false);
  });

  it("freezes the enemy and consumes a charge", () => {
    const next = applyStoryIceFreeze(charged(), 0);
    expect(next.storyIceFreeze).toEqual({ casterIdx: 0, targetIdx: 1 });
    expect(next.players[0]).toMatchObject({ powerCharge: false, powerCharges: 0 });
    expect(next.skinPowerUsedThisTurn).toBe(true);
    expect(next.message).toContain("Bo is frozen");
  });

  it("yanks the turn back from the frozen enemy", () => {
    const next = applyStoryIceFreeze(charged({ currentIndex: 1, hasRolled: true }), 0);
    expect(next.currentIndex).toBe(0);
    expect(next.hasRolled).toBe(false);
    expect(next.message).toContain("frozen");
  });

  it("clears the caster's farkle when fired on their own busted turn", () => {
    const next = applyStoryIceFreeze(charged({ farkle: true, farkleTurnScore: 300 }), 0);
    expect(next.farkle).toBe(false);
    expect(next.farkleTurnScore).toBeNull();
  });

  it("skipFrozenOpponentTurn hands play back to the caster", () => {
    const state = baseState({ currentIndex: 1, storyIceFreeze: { casterIdx: 0, targetIdx: 1 } });
    expect(skipFrozenOpponentTurn(state).currentIndex).toBe(0);
    const casterTurn = baseState({ currentIndex: 0, storyIceFreeze: { casterIdx: 0, targetIdx: 1 } });
    expect(skipFrozenOpponentTurn(casterTurn)).toBe(casterTurn);
    const plain = baseState();
    expect(skipFrozenOpponentTurn(plain)).toBe(plain);
  });
});

describe("getObscuredScoreIndices", () => {
  it("returns an empty set without players", () => {
    expect(getObscuredScoreIndices({}).size).toBe(0);
  });

  it("hides static-debuffed players and blackout casters", () => {
    const state = {
      players: [
        { debuffs: ["static"] },
        { debuffs: [{ id: "blackout", from: 2 }] },
        { debuffs: [] },
      ],
    };
    expect([...getObscuredScoreIndices(state)].sort()).toEqual([0, 2]);
  });
});
