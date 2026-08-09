import { describe, it, expect } from "vitest";
import {
  PRISON_DICE_SKIN_ID,
  PRISON_SIXES_TO_RELEASE,
  isPlayerImprisoned,
  getPrisonTraySkinId,
  getPrisonProgress,
  trackPrisonSixes,
  clearPrisonFromCaster,
} from "../prisonDice";

const state = (prisonDice, over = {}) => ({
  currentIndex: 0,
  players: [{ name: "Ada" }, { name: "Bo" }],
  prisonDice,
  ...over,
});

const PRISON = { casterIdx: 0, targetIdx: 1, sixCount: 0 };

describe("isPlayerImprisoned", () => {
  it("only flags the prison target", () => {
    expect(isPlayerImprisoned(state(PRISON), 1)).toBe(true);
    expect(isPlayerImprisoned(state(PRISON), 0)).toBe(false);
    expect(isPlayerImprisoned(state(null), 1)).toBe(false);
  });
});

describe("getPrisonTraySkinId", () => {
  it("overrides the target's tray skin with prison scraps", () => {
    expect(getPrisonTraySkinId(state(PRISON), 1, "gold")).toBe(PRISON_DICE_SKIN_ID);
    expect(getPrisonTraySkinId(state(PRISON), 0, "gold")).toBe("gold");
  });
});

describe("getPrisonProgress", () => {
  it("returns null without an active prison", () => {
    expect(getPrisonProgress(state(null))).toBeNull();
  });

  it("reports remaining sixes and participant names", () => {
    expect(getPrisonProgress(state({ ...PRISON, sixCount: 1 }))).toEqual({
      casterIdx: 0,
      targetIdx: 1,
      sixCount: 1,
      remaining: PRISON_SIXES_TO_RELEASE - 1,
      targetName: "Bo",
      casterName: "Ada",
      released: false,
    });
  });

  it("marks the prison released once enough sixes land", () => {
    const progress = getPrisonProgress(state({ ...PRISON, sixCount: PRISON_SIXES_TO_RELEASE }));
    expect(progress).toMatchObject({ released: true, remaining: 0 });
  });
});

describe("trackPrisonSixes", () => {
  it("ignores rolls without a prison, from other players, or with no dice", () => {
    const noPrison = state(null);
    expect(trackPrisonSixes(noPrison, [6, 6, 6])).toEqual({ state: noPrison, released: false, added: 0 });

    const otherTurn = state(PRISON, { currentIndex: 1 });
    expect(trackPrisonSixes(otherTurn, [6])).toMatchObject({ state: otherTurn, added: 0 });
    expect(trackPrisonSixes(state(PRISON), [])).toMatchObject({ added: 0 });
  });

  it("counts nothing when no sixes were rolled", () => {
    const s = state(PRISON);
    expect(trackPrisonSixes(s, [1, 2, 3])).toEqual({ state: s, released: false, added: 0 });
  });

  it("accumulates sixes toward the release", () => {
    const result = trackPrisonSixes(state(PRISON), [6, 2, 6]);
    expect(result).toMatchObject({ added: 2, released: false, releaseMessage: null });
    expect(result.state.prisonDice.sixCount).toBe(2);
  });

  it("breaks the prison at the threshold and announces the release", () => {
    const result = trackPrisonSixes(state({ ...PRISON, sixCount: 2 }), [6]);
    expect(result.released).toBe(true);
    expect(result.state.prisonDice).toBeNull();
    expect(result.releaseMessage).toContain("Bo");
  });
});

describe("clearPrisonFromCaster", () => {
  it("only clears a prison cast by the given player", () => {
    const mine = state(PRISON);
    expect(clearPrisonFromCaster(mine, 0).prisonDice).toBeNull();
    expect(clearPrisonFromCaster(mine, 1)).toBe(mine);
    const none = state(null);
    expect(clearPrisonFromCaster(none, 0)).toBe(none);
  });
});
