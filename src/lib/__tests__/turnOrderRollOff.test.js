import { describe, it, expect, afterEach, vi } from "vitest";
import {
  rollTurnOrderDie,
  buildCircleOrder,
  createRollOffState,
  rollRoundForPool,
  executeRollOffRound,
  advanceRollOff,
  formatRollOffStandings,
} from "../turnOrderRollOff";

const NAMES = ["Ada", "Bo", "Cy"];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rollTurnOrderDie", () => {
  it("stays within 1–6", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(rollTurnOrderDie()).toBe(1);
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(rollTurnOrderDie()).toBe(6);
  });
});

describe("buildCircleOrder", () => {
  it("walks the seating circle from the first player", () => {
    expect(buildCircleOrder(0, 3)).toEqual([0, 1, 2]);
    expect(buildCircleOrder(2, 3)).toEqual([2, 0, 1]);
  });
});

describe("createRollOffState", () => {
  it("starts with every player in the pool", () => {
    expect(createRollOffState(3)).toEqual({ order: [], pool: [0, 1, 2], roundRolls: {} });
  });
});

describe("rollRoundForPool", () => {
  it("rolls once per pooled player", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(rollRoundForPool([1, 2])).toEqual({ 1: 4, 2: 4 });
  });
});

describe("advanceRollOff", () => {
  it("waits until everyone in the pool has rolled", () => {
    const state = { order: [], pool: [0, 1, 2], roundRolls: { 0: 3 } };
    expect(advanceRollOff(state, NAMES)).toBe(state);
  });

  it("gives first place to the lowest roll and fills the circle", () => {
    const next = advanceRollOff({ order: [], pool: [0, 1, 2], roundRolls: { 0: 5, 1: 2, 2: 6 } }, NAMES);
    expect(next).toMatchObject({
      done: true,
      firstPlayerIndex: 1,
      order: [1, 2, 0],
      pool: [],
    });
    expect(next.message).toBe("Bo rolls first!");
  });

  it("re-rolls only the tied players on a tie for lowest", () => {
    const next = advanceRollOff({ order: [], pool: [0, 1, 2], roundRolls: { 0: 2, 1: 2, 2: 6 } }, NAMES);
    expect(next).toMatchObject({ tie: true, pool: [0, 1], order: [], roundRolls: {} });
    expect(next.message).toContain("Ada & Bo");
  });

  it("falls back to placeholder names", () => {
    const next = advanceRollOff({ order: [], pool: [0, 1], roundRolls: { 0: 1, 1: 4 } }, []);
    expect(next.message).toBe("Player 1 rolls first!");
    expect(next.order).toEqual([0, 1]);
  });
});

describe("executeRollOffRound", () => {
  it("rolls for the pool and resolves in one call", () => {
    let n = 0;
    // 0.9 → 6, then 0.0 → 1: player 1 wins with the lowest roll.
    vi.spyOn(Math, "random").mockImplementation(() => (n++ === 0 ? 0.9 : 0));
    const next = executeRollOffRound(createRollOffState(2), ["Ada", "Bo"]);
    expect(next).toMatchObject({ done: true, firstPlayerIndex: 1, order: [1, 0] });
  });
});

describe("formatRollOffStandings", () => {
  it("labels each seat with its place", () => {
    expect(formatRollOffStandings([2, 0, 1], NAMES)).toEqual([
      { playerIdx: 2, name: "Cy", place: 1 },
      { playerIdx: 0, name: "Ada", place: 2 },
      { playerIdx: 1, name: "Bo", place: 3 },
    ]);
    expect(formatRollOffStandings([0], [])).toEqual([{ playerIdx: 0, name: "Player 1", place: 1 }]);
  });
});
