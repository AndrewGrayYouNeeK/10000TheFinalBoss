import { describe, it, expect } from "vitest";
import { hasAnyScore } from "../scoring";
import {
  glitchDiceCountForLevel,
  glitchScoreCutForLevel,
  applyMatrixGlitchSabotageToDice,
  applyMatrixGlitchToDice,
} from "../matrixGlitch";

function dice(values, { usedIds = [] } = {}) {
  return values.map((value, id) => ({ id, value, used: usedIds.includes(id), held: true }));
}

describe("glitchDiceCountForLevel", () => {
  it("scales from 1 die at level 1 to 6 at level 10", () => {
    expect(glitchDiceCountForLevel(1)).toBe(1);
    expect(glitchDiceCountForLevel(2)).toBe(2);
    expect(glitchDiceCountForLevel(4)).toBe(3);
    expect(glitchDiceCountForLevel(6)).toBe(4);
    expect(glitchDiceCountForLevel(8)).toBe(5);
    expect(glitchDiceCountForLevel(10)).toBe(6);
  });

  it("clamps out-of-range and bogus levels", () => {
    expect(glitchDiceCountForLevel(0)).toBe(1);
    expect(glitchDiceCountForLevel(-3)).toBe(1);
    expect(glitchDiceCountForLevel(99)).toBe(6);
    expect(glitchDiceCountForLevel("nope")).toBe(1);
  });
});

describe("glitchScoreCutForLevel", () => {
  it("cuts 75 points per level, capped by the opponent's score", () => {
    expect(glitchScoreCutForLevel(1, 1000)).toBe(75);
    expect(glitchScoreCutForLevel(4, 1000)).toBe(300);
    expect(glitchScoreCutForLevel(10, 1000)).toBe(750);
    expect(glitchScoreCutForLevel(10, 200)).toBe(200);
  });

  it("never cuts below zero", () => {
    expect(glitchScoreCutForLevel(5, 0)).toBe(0);
    expect(glitchScoreCutForLevel(5, -100)).toBe(0);
  });
});

describe("applyMatrixGlitchSabotageToDice", () => {
  it("rewrites active dice to non-scoring faces", () => {
    const { dice: next, glitchedIds } = applyMatrixGlitchSabotageToDice(dice([1, 1, 1, 1, 1, 1]), 2);
    expect(glitchedIds).toEqual([0, 1]);
    expect(next.slice(0, 2).map((d) => d.value)).toEqual([2, 3]);
    expect(next.slice(0, 2).every((d) => !d.held)).toBe(true);
    expect(next.slice(2).map((d) => d.value)).toEqual([1, 1, 1, 1]);
  });

  it("skips used dice and clamps to the active count", () => {
    const { dice: next, glitchedIds } = applyMatrixGlitchSabotageToDice(
      dice([1, 1, 1, 1, 1, 1], { usedIds: [0, 1, 2, 3] }),
      6
    );
    expect(glitchedIds).toEqual([4, 5]);
    expect(next.slice(0, 4).map((d) => d.value)).toEqual([1, 1, 1, 1]);
    expect(hasAnyScore(next.slice(4).map((d) => d.value))).toBe(false);
  });

  it("no-ops without dice, without a count, or with nothing active", () => {
    expect(applyMatrixGlitchSabotageToDice([], 2)).toEqual({ dice: [], glitchedIds: [] });
    expect(applyMatrixGlitchSabotageToDice(null, 2)).toEqual({ dice: [], glitchedIds: [] });
    expect(applyMatrixGlitchSabotageToDice(dice([1, 1]), 0).glitchedIds).toEqual([]);
    const allUsed = dice([1, 1], { usedIds: [0, 1] });
    expect(applyMatrixGlitchSabotageToDice(allUsed, 2)).toEqual({ dice: allUsed, glitchedIds: [] });
  });
});

describe("applyMatrixGlitchToDice (legacy bust rescue)", () => {
  it("leaves a roll that already scores untouched", () => {
    const board = dice([1, 2, 3, 4, 6, 6]);
    expect(applyMatrixGlitchToDice(board, 2)).toEqual({ dice: board, glitchedIds: [] });
  });

  it("flips dice to scoring faces to rescue a farkle", () => {
    const { dice: next, glitchedIds } = applyMatrixGlitchToDice(dice([2, 3, 4, 6, 6, 2]), 2);
    expect(glitchedIds).toEqual([0, 1]);
    expect(next.slice(0, 2).map((d) => d.value)).toEqual([1, 5]);
    expect(hasAnyScore(next.map((d) => d.value))).toBe(true);
  });

  it("no-ops without dice or count", () => {
    expect(applyMatrixGlitchToDice([], 1)).toEqual({ dice: [], glitchedIds: [] });
    const board = dice([2, 3]);
    expect(applyMatrixGlitchToDice(board, 0)).toEqual({ dice: board, glitchedIds: [] });
  });
});
