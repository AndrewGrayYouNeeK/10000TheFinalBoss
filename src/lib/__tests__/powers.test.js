import { describe, it, expect } from "vitest";
import {
  MAX_POWER,
  POWER_RULES,
  POWERS,
  getPower,
  BASE_POWERS,
  SABO_POWERS,
  powerForAction,
  canAfford,
} from "../powers";

describe("POWERS catalog", () => {
  it("has unique ids and complete metadata", () => {
    const ids = POWERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of POWERS) {
      expect(["self", "sabo"]).toContain(p.kind);
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.cost).toBeGreaterThan(0);
      expect(p.cost).toBeLessThanOrEqual(MAX_POWER);
    }
  });

  it("splits cleanly into self and sabotage powers", () => {
    expect(BASE_POWERS.length + SABO_POWERS.length).toBe(POWERS.length);
    expect(BASE_POWERS.every((p) => p.kind === "self")).toBe(true);
    expect(SABO_POWERS.every((p) => p.kind === "sabo")).toBe(true);
  });
});

describe("getPower", () => {
  it("looks up by id and returns null when unknown", () => {
    expect(getPower("shield")).toMatchObject({ id: "shield", kind: "self" });
    expect(getPower("nope")).toBeNull();
    expect(getPower(undefined)).toBeNull();
  });
});

describe("powerForAction", () => {
  it("awards the flat per-action amounts", () => {
    expect(powerForAction("roll")).toBe(POWER_RULES.perRoll);
    expect(powerForAction("hot_dice")).toBe(POWER_RULES.perHotDice);
    expect(powerForAction("farkle")).toBe(POWER_RULES.perFarkleSelf);
  });

  it("scales bank rewards per 100 points, rounding down", () => {
    expect(powerForAction("bank", 0)).toBe(0);
    expect(powerForAction("bank", 99)).toBe(0);
    expect(powerForAction("bank", 1250)).toBe(12 * POWER_RULES.perBankPer100);
  });

  it("awards nothing for unknown actions", () => {
    expect(powerForAction("teleport")).toBe(0);
    expect(powerForAction()).toBe(0);
  });
});

describe("canAfford", () => {
  it("compares stored power against the ability cost", () => {
    const cost = getPower("shield").cost;
    expect(canAfford(cost, "shield")).toBe(true);
    expect(canAfford(cost - 1, "shield")).toBe(false);
  });

  it("is false for unknown abilities", () => {
    expect(canAfford(MAX_POWER, "nope")).toBe(false);
  });
});
