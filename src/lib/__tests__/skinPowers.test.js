import { describe, it, expect } from "vitest";
import { POWER_MODE_HOT_DICE } from "../powers";
import {
  isCustomDiceSkin,
  getSkinPower,
  getSkinPowerMeta,
  ASSIGNABLE_SKIN_POWER_IDS,
  PLAYER_FACING_BASE_POWERS,
  getPowerChargeHotDiceThreshold,
} from "../skinPowers";

describe("getSkinPowerMeta", () => {
  it("gives the mapped power for skins in the map", () => {
    expect(getSkinPowerMeta("blue_gel")).toMatchObject({ source: "mapped", powerId: "shark_bite" });
    expect(getSkinPower("matrix").id).toBe("matrix_glitch");
    expect(getSkinPower("ice").id).toBe("frosty_ice");
  });

  it("returns no power for the intentionally powerless skins", () => {
    expect(getSkinPowerMeta("classic_white")).toEqual({ power: null, source: "none", powerId: null });
    expect(getSkinPower("cyber_neon")).toBeNull();
  });

  it("defaults to classic_white (no power) for a missing skin id", () => {
    expect(getSkinPowerMeta(null).source).toBe("none");
  });

  it("assigns unmapped skins a stable random power from the local pool", () => {
    const first = getSkinPowerMeta("unmapped_test_skin");
    expect(first.source).toBe("random");
    expect(ASSIGNABLE_SKIN_POWER_IDS).toContain(first.powerId);
    expect(getSkinPowerMeta("unmapped_test_skin").powerId).toBe(first.powerId);
  });

  it("normalizes legacy skin ids before assigning", () => {
    expect(getSkinPowerMeta("ragnarok_regular").powerId).toBe(getSkinPowerMeta("ragnarok").powerId);
  });
});

describe("power pools", () => {
  it("never offers story-only or retired powers for assignment", () => {
    expect(ASSIGNABLE_SKIN_POWER_IDS).not.toContain("frosty_ice");
    expect(ASSIGNABLE_SKIN_POWER_IDS).not.toContain("siphon");
    expect(PLAYER_FACING_BASE_POWERS.some((p) => p.id === "siphon")).toBe(false);
  });
});

describe("isCustomDiceSkin", () => {
  it("recognizes portfolio lab dice only", () => {
    expect(isCustomDiceSkin("pf_soundwave")).toBe(true);
    expect(isCustomDiceSkin("gold")).toBe(false);
  });
});

describe("getPowerChargeHotDiceThreshold", () => {
  it("matches the configured hot-dice requirement", () => {
    expect(getPowerChargeHotDiceThreshold({ name: "Ada" })).toBe(POWER_MODE_HOT_DICE);
  });
});
