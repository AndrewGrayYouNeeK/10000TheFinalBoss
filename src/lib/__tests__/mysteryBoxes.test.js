import { describe, it, expect, afterEach, vi } from "vitest";
import {
  MYSTERY_BOXES,
  getSkinPool,
  getFeltPool,
  getMysteryBox,
  rollOdds,
  pickRandom,
} from "../mysteryBoxes";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MYSTERY_BOXES", () => {
  it("has unique ids, a price and odds that describe every reward", () => {
    const ids = MYSTERY_BOXES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const box of MYSTERY_BOXES) {
      expect(box.price).toBeGreaterThan(0);
      expect(box.odds.length).toBeGreaterThan(0);
      for (const o of box.odds) {
        expect(["coins", "skin", "felt"]).toContain(o.type);
        expect(o.weight).toBeGreaterThan(0);
        expect(o.label).toBeTruthy();
      }
    }
  });
});

describe("getMysteryBox", () => {
  it("finds a box by id and returns null otherwise", () => {
    expect(getMysteryBox("box_bronze").name).toBe("Starter Vault");
    expect(getMysteryBox("nope")).toBeNull();
  });
});

describe("getSkinPool", () => {
  it("returns only custom lab dice for a known pool", () => {
    const legendary = getSkinPool([], "legendary");
    expect(legendary.length).toBeGreaterThan(0);
    expect(legendary.every((s) => s.id.startsWith("pf_"))).toBe(true);
  });

  it("returns nothing for an unknown pool", () => {
    expect(getSkinPool([], "mythic")).toEqual([]);
  });
});

describe("getFeltPool", () => {
  const felts = [
    { id: "free", price: 0 },
    { id: "standard", price: 300 },
    { id: "fancy", price: 900, premium: true },
  ];

  it("splits standard (paid, non-premium) from premium felts", () => {
    expect(getFeltPool(felts, "standard").map((f) => f.id)).toEqual(["standard"]);
    expect(getFeltPool(felts, "premium").map((f) => f.id)).toEqual(["fancy"]);
  });

  it("returns nothing for an unknown pool", () => {
    expect(getFeltPool(felts, "cursed")).toEqual([]);
  });
});

describe("rollOdds", () => {
  const odds = [
    { label: "a", weight: 1 },
    { label: "b", weight: 1 },
    { label: "c", weight: 2 },
  ];

  it("picks by weight across the range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(rollOdds(odds).label).toBe("a");
    vi.spyOn(Math, "random").mockReturnValue(0.3); // 1.2 of 4 → second entry
    expect(rollOdds(odds).label).toBe("b");
    vi.spyOn(Math, "random").mockReturnValue(0.9); // 3.6 of 4 → third entry
    expect(rollOdds(odds).label).toBe("c");
  });

  it("falls back to the last entry when weights are missing", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(rollOdds([{ label: "only" }]).label).toBe("only");
  });
});

describe("pickRandom", () => {
  it("returns null for empty input", () => {
    expect(pickRandom([])).toBeNull();
    expect(pickRandom(null)).toBeNull();
  });

  it("picks by index", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(pickRandom(["a", "b", "c"])).toBe("c");
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickRandom(["a", "b", "c"])).toBe("a");
  });
});
