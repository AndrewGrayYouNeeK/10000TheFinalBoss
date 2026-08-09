import { describe, it, expect } from "vitest";
import {
  isSixOfAKind,
  scoreSelection,
  maxValidScore,
  hasAnyScore,
  describeSelection,
  heldSelectionPoints,
  heldSelectionLabel,
} from "../scoring";

describe("isSixOfAKind", () => {
  it("returns the face when all six dice match", () => {
    expect(isSixOfAKind([4, 4, 4, 4, 4, 4])).toBe(4);
  });

  it("returns null for mixed faces or wrong dice count", () => {
    expect(isSixOfAKind([4, 4, 4, 4, 4, 3])).toBeNull();
    expect(isSixOfAKind([2, 2, 2, 2, 2])).toBeNull();
    expect(isSixOfAKind(null)).toBeNull();
  });
});

describe("scoreSelection", () => {
  it("returns an invalid zero score for an empty selection", () => {
    expect(scoreSelection([])).toEqual({ score: 0, valid: false });
    expect(scoreSelection(null)).toEqual({ score: 0, valid: false });
  });

  it("scores loose 1s and 5s", () => {
    expect(scoreSelection([1])).toEqual({ score: 100, valid: true });
    expect(scoreSelection([5])).toEqual({ score: 50, valid: true });
    expect(scoreSelection([1, 1, 5])).toEqual({ score: 250, valid: true });
  });

  it("marks selections containing non-scoring dice invalid", () => {
    expect(scoreSelection([1, 2])).toEqual({ score: 100, valid: false });
    expect(scoreSelection([3, 4])).toEqual({ score: 0, valid: false });
  });

  it("scores three of a kind (1s are worth 1000)", () => {
    expect(scoreSelection([1, 1, 1])).toEqual({ score: 1000, valid: true });
    expect(scoreSelection([3, 3, 3])).toEqual({ score: 300, valid: true });
    expect(scoreSelection([6, 6, 6])).toEqual({ score: 600, valid: true });
  });

  it("scores four and five of a kind at flat values", () => {
    expect(scoreSelection([2, 2, 2, 2])).toEqual({ score: 2000, valid: true });
    expect(scoreSelection([2, 2, 2, 2, 2])).toEqual({ score: 4000, valid: true });
  });

  it("combines a triple with leftover 1s and 5s", () => {
    expect(scoreSelection([4, 4, 4, 1, 5])).toEqual({ score: 550, valid: true });
  });

  it("scores the full straight", () => {
    expect(scoreSelection([1, 2, 3, 4, 5, 6])).toEqual({
      score: 1500,
      valid: true,
      straight: true,
    });
  });

  it("scores both five-die small straights", () => {
    expect(scoreSelection([1, 2, 3, 4, 5])).toMatchObject({ score: 1000, smallStraight: true });
    expect(scoreSelection([2, 3, 4, 5, 6])).toMatchObject({ score: 1000, smallStraight: true });
  });

  it("scores six-die small straights with the extra scoring die", () => {
    expect(scoreSelection([1, 1, 2, 3, 4, 5])).toMatchObject({ score: 1100, smallStraight: true });
    expect(scoreSelection([1, 2, 3, 4, 5, 5])).toMatchObject({ score: 1050, smallStraight: true });
    expect(scoreSelection([2, 3, 4, 5, 5, 6])).toMatchObject({ score: 1050, smallStraight: true });
  });

  it("scores three pairs, but only with six dice", () => {
    expect(scoreSelection([2, 2, 3, 3, 4, 4])).toMatchObject({ score: 1500, threePairs: true });
    expect(scoreSelection([2, 2, 3, 3])).toMatchObject({ valid: false });
  });

  it("prefers three pairs over the six-die small straight for 2-2-3-3-4-4", () => {
    expect(scoreSelection([2, 2, 3, 3, 4, 4]).threePairs).toBe(true);
  });

  it("scores six of a kind as five-of-a-kind plus a leftover die", () => {
    expect(scoreSelection([5, 5, 5, 5, 5, 5])).toEqual({ score: 4050, valid: true });
    expect(scoreSelection([3, 3, 3, 3, 3, 3])).toEqual({ score: 4000, valid: false });
  });
});

describe("maxValidScore", () => {
  it("returns 0 when nothing scores", () => {
    expect(maxValidScore([])).toBe(0);
    expect(maxValidScore([2, 3, 4])).toBe(0);
  });

  it("finds the best valid subset instead of the whole roll", () => {
    // 1 alone (100) beats any larger valid subset here.
    expect(maxValidScore([1, 2, 3, 4])).toBe(100);
    // 1+5 = 150 (both scoring dice together).
    expect(maxValidScore([1, 5, 2, 3])).toBe(150);
  });

  it("finds the straight when present", () => {
    expect(maxValidScore([1, 2, 3, 4, 5, 6])).toBe(1500);
  });

  it("finds a triple plus loose scoring dice", () => {
    expect(maxValidScore([4, 4, 4, 1, 5, 2])).toBe(550);
  });
});

describe("hasAnyScore", () => {
  it("is false for empty and for pure non-scoring rolls", () => {
    expect(hasAnyScore([])).toBe(false);
    expect(hasAnyScore(null)).toBe(false);
    expect(hasAnyScore([2, 3, 4, 6, 2, 3])).toBe(false);
  });

  it("is true for any 1 or 5", () => {
    expect(hasAnyScore([2, 2, 3, 1])).toBe(true);
    expect(hasAnyScore([5, 2, 3])).toBe(true);
  });

  it("is true for a triple of non-1/5 faces", () => {
    expect(hasAnyScore([3, 3, 3, 2, 4, 6])).toBe(true);
  });

  it("is true for a straight and for a small straight inside the roll", () => {
    expect(hasAnyScore([1, 2, 3, 4, 5, 6])).toBe(true);
    expect(hasAnyScore([2, 3, 4, 6, 6, 2])).toBe(false);
  });

  it("is true for three pairs of non-scoring faces", () => {
    expect(hasAnyScore([2, 2, 3, 3, 6, 6])).toBe(true);
  });
});

describe("describeSelection", () => {
  it("announces Perfect 10,000 only while pending", () => {
    expect(describeSelection([2, 2, 2, 2, 2, 2], { perfectTenKPending: true })).toContain(
      "PERFECT 10,000"
    );
    expect(describeSelection([1, 1, 1, 1, 1, 1])).not.toContain("PERFECT");
  });

  it("labels combos and invalid selections", () => {
    expect(describeSelection([1, 2, 3, 4, 5, 6])).toBe("Straight 1-6 (1500)");
    expect(describeSelection([1, 2, 3, 4, 5])).toBe("Small Straight (1000)");
    expect(describeSelection([2, 2, 3, 3, 4, 4])).toBe("Three Pairs (1500)");
    expect(describeSelection([2, 3])).toBe("Invalid — includes non-scoring dice");
    expect(describeSelection([1, 1])).toBe("+200");
  });
});

describe("heldSelectionPoints / heldSelectionLabel", () => {
  const info = (held) => ({ held, ...scoreSelection(held) });

  it("scores 0 for invalid selections", () => {
    expect(heldSelectionPoints(info([2, 3]))).toBe(0);
    expect(heldSelectionPoints(null)).toBe(0);
    expect(heldSelectionLabel(info([2, 3]))).toBe("Selection includes non-scoring dice");
  });

  it("awards the full 10,000 for a pending six of a kind", () => {
    const six = info([1, 1, 1, 1, 1, 1]);
    expect(heldSelectionPoints(six, true)).toBe(10000);
    expect(heldSelectionPoints(six, false)).toBe(six.score);
    expect(heldSelectionLabel(six, true)).toContain("PERFECT 10,000");
  });

  it("labels straights, small straights, three pairs and plain selections", () => {
    expect(heldSelectionLabel(info([1, 2, 3, 4, 5, 6]))).toBe("Straight!");
    expect(heldSelectionLabel(info([1, 2, 3, 4, 5]))).toBe("Small Straight! +1000");
    expect(heldSelectionLabel(info([2, 2, 3, 3, 4, 4]))).toBe("Three Pairs!");
    expect(heldSelectionLabel(info([1, 5]))).toBe("Selection: +150");
  });
});
