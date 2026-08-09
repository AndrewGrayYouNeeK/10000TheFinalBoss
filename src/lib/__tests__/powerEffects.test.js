import { describe, it, expect, vi, afterEach } from "vitest";
import { applySkinPower } from "../powerEffects";
import { saveProfile } from "../localProfile";
import { skinXpForLevel } from "../progression";

const dice = (values = [1, 2, 3, 4, 5, 6], { usedIds = [], heldIds = [] } = {}) =>
  values.map((value, id) => ({
    id,
    value,
    used: usedIds.includes(id),
    held: heldIds.includes(id),
  }));

const state = (over = {}) => ({
  currentIndex: 0,
  players: [
    { name: "Ada", score: 1200, skinId: "gold", debuffs: [] },
    { name: "Bo", score: 800, skinId: "ruby", debuffs: [] },
  ],
  dice: dice(),
  turnScore: 300,
  farkle: false,
  winner: null,
  ...over,
});

const solo = (over = {}) =>
  state({ players: [{ name: "Ada", score: 500, skinId: "gold", debuffs: [] }], ...over });

const debuffIds = (player) => (player.debuffs || []).map((d) => (typeof d === "string" ? d : d.id));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("guards", () => {
  it("refuses to fire with no state, a winner, or during a farkle", () => {
    expect(applySkinPower(null, "shield").variant).toBe("warning");
    expect(applySkinPower(state({ winner: { name: "Ada" } }), "shield").variant).toBe("warning");
    expect(applySkinPower(state({ farkle: true }), "shield").variant).toBe("warning");
  });

  it("still allows plasma_cut while farkled", () => {
    expect(applySkinPower(state({ farkle: true }), "plasma_cut")).toMatchObject({
      variant: "success",
      needsPlasmaCutPicker: true,
    });
  });

  it("rejects sabotage powers with no opponent", () => {
    for (const id of ["shark_bite", "freeze", "freeze_score", "frosty_ice", "lockout", "blackout", "static", "prison_dice", "xray", "matrix_glitch"]) {
      const result = applySkinPower(solo(), id);
      expect(result.variant, id).toBe("warning");
      expect(result.state).toEqual(solo());
    }
  });

  it("reports unknown powers", () => {
    expect(applySkinPower(state(), "teleport")).toMatchObject({ variant: "warning", message: "Unknown power." });
  });
});

describe("self powers", () => {
  it("reroll flips an unheld active die", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const before = state({ dice: dice([2, 2, 2, 2, 2, 2], { heldIds: [0] }) });
    const { state: next, variant } = applySkinPower(before, "reroll");
    expect(variant).toBe("success");
    expect(next.dice[1].value).toBe(4);
    expect(next.dice[0].value).toBe(2);
    expect(next.farkle).toBe(false);
  });

  it("reroll falls back to a held die when everything is held", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const before = state({ dice: dice([3, 3], { heldIds: [0, 1] }) });
    const { state: next } = applySkinPower(before, "reroll");
    expect(next.dice[0]).toMatchObject({ value: 1, held: false });
  });

  it("reroll warns when every die is used", () => {
    const before = state({ dice: dice([1, 2], { usedIds: [0, 1] }) });
    expect(applySkinPower(before, "reroll").variant).toBe("warning");
  });

  it("shield arms the farkle rescue", () => {
    expect(applySkinPower(state(), "shield").state.powerShield).toBe(true);
  });

  it("lucky_seven arms the next roll", () => {
    expect(applySkinPower(state(), "lucky_seven").state.luckyRollNext).toBe(true);
  });

  it("hot_streak sets the 1.5x turn multiplier", () => {
    expect(applySkinPower(state(), "hot_streak").state.turnScoreMultiplier).toBe(1.5);
  });

  it("double_or_nothing doubles the turn score and raises the multiplier", () => {
    const { state: next } = applySkinPower(state({ turnScoreMultiplier: 1 }), "double_or_nothing");
    expect(next).toMatchObject({ turnScore: 600, doubleOrNothing: true, turnScoreMultiplier: 2 });
    expect(applySkinPower(state({ turnScore: 0 }), "double_or_nothing").state.turnScore).toBe(0);
  });

  it("double_or_nothing curses the opponent at skin level 10", () => {
    saveProfile({
      owned_skins: ["classic_white", "gold"],
      skin_level_xp: { gold: skinXpForLevel(10) },
    });
    const { state: next } = applySkinPower(state(), "double_or_nothing");
    expect(debuffIds(next.players[1])).toContain("double_or_nothing_curse");
    expect(next.turnScore).toBe(300);
  });

  it("siphon takes from the leader — including the caster when they lead", () => {
    const { state: next, variant } = applySkinPower(state(), "siphon");
    expect(variant).toBe("success");
    expect(next.players[0].score).toBe(1080);

    const behind = state({
      currentIndex: 1,
      players: [
        { name: "Ada", score: 9000, skinId: "gold", debuffs: [] },
        { name: "Bo", score: 100, skinId: "ruby", debuffs: [] },
      ],
    });
    const stolen = applySkinPower(behind, "siphon").state;
    expect(stolen.players[0].score).toBe(8500);
    expect(stolen.players[1].score).toBe(600);
  });

  it("siphon refuses a frozen or scoreless leader", () => {
    const frozen = state({
      players: [
        { name: "Ada", score: 1200, skinId: "gold", debuffs: [{ id: "freeze_score" }] },
        { name: "Bo", score: 800, skinId: "ruby", debuffs: [] },
      ],
      currentIndex: 1,
    });
    expect(applySkinPower(frozen, "siphon").variant).toBe("warning");

    const empty = state({
      players: [
        { name: "Ada", score: 0, skinId: "gold", debuffs: [] },
        { name: "Bo", score: 0, skinId: "ruby", debuffs: [] },
      ],
    });
    expect(applySkinPower(empty, "siphon").variant).toBe("warning");
  });

  it("overtime wipes every banked score", () => {
    const { state: next } = applySkinPower(state(), "overtime");
    expect(next.players.map((p) => p.score)).toEqual([0, 0]);
    expect(next.players.every((p) => p.onBoard === false)).toBe(true);
    expect(next.turnScore).toBe(0);
    expect(applySkinPower(solo(), "overtime").variant).toBe("warning");
  });
});

describe("sabotage powers", () => {
  it("freeze, lockout, blackout and static all debuff the next seat", () => {
    for (const id of ["freeze", "lockout", "blackout", "static"]) {
      const { state: next, variant } = applySkinPower(state(), id);
      expect(variant, id).toBe("success");
      expect(debuffIds(next.players[1])).toEqual([id]);
      expect(next.players[1].debuffs[0].from).toBe(0);
    }
  });

  it("does not stack a debuff the target already has", () => {
    const before = state({
      players: [
        { name: "Ada", score: 0, skinId: "gold", debuffs: [] },
        { name: "Bo", score: 0, skinId: "ruby", debuffs: ["lockout"] },
      ],
    });
    expect(debuffIds(applySkinPower(before, "lockout").state.players[1])).toEqual(["lockout"]);
  });

  it("freeze_score and frosty_ice both lock the banked score", () => {
    for (const id of ["freeze_score", "frosty_ice"]) {
      const { state: next, message } = applySkinPower(state(), id);
      expect(next.players[1].debuffs[0]).toMatchObject({ id: "freeze_score", lockedScore: 800 });
      expect(message, id).toContain(id === "frosty_ice" ? "Frozen Ice" : "Score Freeze");
    }
  });

  it("prison_dice locks the opponent's dice once", () => {
    const { state: next } = applySkinPower(state(), "prison_dice");
    expect(next.prisonDice).toEqual({ casterIdx: 0, targetIdx: 1, sixCount: 0 });
    expect(applySkinPower(next, "prison_dice").variant).toBe("warning");
  });

  it("xray records the scan and the scanner", () => {
    const { state: next, variant } = applySkinPower(state(), "xray");
    expect(variant).toBe("success");
    expect(next.xrayScannerIndex).toBe(0);
    expect(next.xrayReveals[1].length).toBeGreaterThan(0);
    expect(next.message).toContain("Bo");
  });

  it("matrix_glitch cuts banked points and primes scrambled dice", () => {
    saveProfile({
      owned_skins: ["classic_white", "matrix"],
      skin_level_xp: { matrix: skinXpForLevel(4) },
    });
    const before = state({
      players: [
        { name: "Ada", score: 0, skinId: "matrix", debuffs: [] },
        { name: "Bo", score: 1000, skinId: "ruby", debuffs: [] },
      ],
    });
    const { state: next } = applySkinPower(before, "matrix_glitch");
    expect(next.players[1].score).toBe(700);
    expect(next.players[1].debuffs[0]).toMatchObject({ id: "matrix_glitch", diceCount: 3 });
    expect(next.matrixGlitchArmed).toBeNull();
  });

  it("shark_bite marks the opponent's next bank, once", () => {
    const { state: next } = applySkinPower(state(), "shark_bite");
    expect(debuffIds(next.players[1])).toEqual(["shark_bite"]);
    expect(applySkinPower(next, "shark_bite").variant).toBe("warning");
  });

  it("shark_bite triggers Feeding Frenzy against aquarium dice", () => {
    const before = state({
      players: [
        { name: "Ada", score: 0, skinId: "gold", debuffs: [] },
        { name: "Bo", score: 900, skinId: "blue_gel", debuffs: ["lockout"] },
      ],
    });
    const { state: next, message } = applySkinPower(before, "shark_bite");
    expect(message).toBe("Feeding Frenzy!");
    expect(next.players[1]).toMatchObject({ score: 0, onBoard: false, debuffs: [] });
    expect(next).toMatchObject({
      sharkBiteFx: true,
      sharkDiceHidden: true,
      sharkFishFeast: true,
      sharkFishFeastTargetIdx: 1,
    });
  });
});
