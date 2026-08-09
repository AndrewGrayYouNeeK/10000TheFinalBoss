import { describe, it, expect, afterEach, vi } from "vitest";
import { chooseDiceToHold, chooseBankOrRoll } from "../aiOpponent";

const GREEDY = { holdGreedy: true, bankThreshold: 1000, greed: 0 };
const CAUTIOUS = { holdGreedy: false, bankThreshold: 1000, greed: 0 };

function dice(values, { usedIds = [], heldIds = [] } = {}) {
  return values.map((value, id) => ({
    id,
    value,
    used: usedIds.includes(id),
    held: heldIds.includes(id),
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("chooseDiceToHold", () => {
  it("holds nothing with no active dice or on a farkle", () => {
    expect(chooseDiceToHold({ dice: dice([1, 2], { usedIds: [0, 1] }) }, GREEDY)).toEqual([]);
    expect(chooseDiceToHold({ dice: dice([2, 3, 4, 6, 6, 2]) }, GREEDY)).toEqual([]);
  });

  it("greedy AI takes the whole roll when it all scores", () => {
    expect(chooseDiceToHold({ dice: dice([1, 2, 3, 4, 5, 6]) }, GREEDY)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("greedy AI grabs every 1, 5 and triple", () => {
    expect(chooseDiceToHold({ dice: dice([1, 5, 3, 3, 3, 2]) }, GREEDY).sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("cautious AI takes big combos whole", () => {
    expect(chooseDiceToHold({ dice: dice([2, 2, 3, 3, 4, 4]) }, CAUTIOUS)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("cautious AI takes only the triple when one exists", () => {
    expect(chooseDiceToHold({ dice: dice([3, 3, 3, 1, 5, 2]) }, CAUTIOUS)).toEqual([0, 1, 2]);
  });

  it("cautious AI takes a single 1, preferring it over a 5", () => {
    expect(chooseDiceToHold({ dice: dice([5, 1, 2, 3, 4, 4]) }, CAUTIOUS)).toEqual([1]);
    expect(chooseDiceToHold({ dice: dice([5, 2, 2, 3, 4, 4]) }, CAUTIOUS)).toEqual([0]);
  });
});

describe("chooseBankOrRoll", () => {
  const player = (over = {}) => ({ score: 0, onBoard: true, ...over });
  const state = (over = {}) => ({ dice: dice([1, 2, 3, 4, 5, 6]), turnScore: 0, ...over });

  it("banks while a story freeze is active", () => {
    expect(chooseBankOrRoll(state({ storyIceFreeze: { casterIdx: 0 } }), GREEDY, player())).toBe(
      "bank"
    );
  });

  it("rolls on hot dice even with a big turn score", () => {
    const hot = state({
      dice: dice([1, 1, 1, 1, 1, 1], { heldIds: [0, 1, 2, 3, 4, 5] }),
      turnScore: 5000,
    });
    expect(chooseBankOrRoll(hot, GREEDY, player())).toBe("roll");
  });

  it("keeps rolling until on the board", () => {
    const s = state({ turnScore: 800 });
    expect(chooseBankOrRoll(s, GREEDY, player({ onBoard: false }))).toBe("roll");
    expect(chooseBankOrRoll(state({ turnScore: 1000 }), GREEDY, player({ onBoard: false }))).toBe(
      "bank"
    );
  });

  it("rolls rather than overshooting the target", () => {
    expect(chooseBankOrRoll(state({ turnScore: 600 }), GREEDY, player({ score: 9500 }))).toBe(
      "roll"
    );
  });

  it("banks the win when it lands exactly on the target", () => {
    expect(chooseBankOrRoll(state({ turnScore: 500 }), GREEDY, player({ score: 9500 }))).toBe(
      "bank"
    );
  });

  it("banks a decent score when only one or two dice remain", () => {
    const risky = state({ dice: dice([1, 2, 3, 4, 5, 6], { usedIds: [0, 1, 2, 3] }), turnScore: 400 });
    expect(chooseBankOrRoll(risky, GREEDY, player())).toBe("bank");
    expect(chooseBankOrRoll({ ...risky, turnScore: 300 }, GREEDY, player())).toBe("roll");
  });

  it("uses greed to decide once past the bank threshold", () => {
    const s = state({ turnScore: 1200 });
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    expect(chooseBankOrRoll(s, { ...GREEDY, greed: 0.5 }, player())).toBe("bank");
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(chooseBankOrRoll(s, { ...GREEDY, greed: 0.5 }, player())).toBe("roll");
  });

  it("rolls below the bank threshold", () => {
    expect(chooseBankOrRoll(state({ turnScore: 500 }), GREEDY, player())).toBe("roll");
  });

  it("treats a missing player as a fresh off-board player", () => {
    expect(chooseBankOrRoll(state({ turnScore: 0 }), GREEDY, undefined)).toBe("roll");
  });
});
