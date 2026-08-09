import { describe, it, expect } from "vitest";
import {
  TIERS,
  SKIN_TIERS,
  TIER_SHORTCUT_MULTIPLIER,
  MAX_LEVEL,
  getLevelForXp,
  xpForLevel,
  getLevelProgress,
  getTierForXp,
  getNextTier,
  getSkinTier,
  isSkinUnlockedByTier,
  isSkinShortcutBuyable,
  isSkinAchievementOnly,
  getSkinEffectivePrice,
  MAX_SKIN_POWER_LEVEL,
  DEFAULT_SKIN_POWER_LEVEL,
  getSkinPowerLevel,
  LOCAL_SKIN_MAX_LEVEL,
  skinXpForLevel,
  getLocalSkinLevelFromXp,
  getLocalSkinPowerLevel,
  addSkinPlayXp,
} from "../progression";

describe("level curve", () => {
  it("starts at level 1 for zero or negative XP", () => {
    expect(getLevelForXp()).toBe(1);
    expect(getLevelForXp(0)).toBe(1);
    expect(getLevelForXp(-500)).toBe(1);
    expect(getLevelForXp(99)).toBe(1);
  });

  it("levels up at the curve thresholds", () => {
    expect(getLevelForXp(100)).toBe(2);
    expect(getLevelForXp(xpForLevel(5))).toBe(5);
    expect(getLevelForXp(xpForLevel(5) - 1)).toBe(4);
  });

  it("caps at MAX_LEVEL", () => {
    expect(getLevelForXp(1e12)).toBe(MAX_LEVEL);
  });

  it("xpForLevel is 0 at or below level 1 and monotonically increasing", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(9));
  });

  it("reports progress within the current level", () => {
    const xp = 5000;
    const level = getLevelForXp(xp);
    const xpInto = xp - xpForLevel(level);
    const xpNeeded = xpForLevel(level + 1) - xpForLevel(level);
    expect(getLevelProgress(xp)).toEqual({
      level,
      xpInto,
      xpNeeded,
      pct: Math.round((xpInto / xpNeeded) * 100),
    });
  });

  it("keeps progress fractions inside 0–100 across the curve", () => {
    for (const xp of [0, 1, 250, 3886, 39772, 500000]) {
      const { pct } = getLevelProgress(xp);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it("reports a completed bar at max level", () => {
    expect(getLevelProgress(1e12)).toEqual({
      level: MAX_LEVEL,
      pct: 100,
      xpInto: 0,
      xpNeeded: 0,
    });
  });
});

describe("tiers", () => {
  it("returns the highest tier reached", () => {
    expect(getTierForXp(0).name).toBe("Bronze");
    expect(getTierForXp(1999).name).toBe("Bronze");
    expect(getTierForXp(2000).name).toBe("Silver");
    expect(getTierForXp(1e9).name).toBe("Mythic");
  });

  it("returns the next tier, or null once maxed", () => {
    expect(getNextTier(0).name).toBe("Silver");
    expect(getNextTier(15000).name).toBe("Diamond");
    expect(getNextTier(TIERS[TIERS.length - 1].minXp)).toBeNull();
  });

  it("maps skins to tiers and defaults unknown skins to Bronze", () => {
    expect(getSkinTier("gold").name).toBe("Gold");
    expect(getSkinTier("matrix").name).toBe("Mythic");
    expect(getSkinTier("not_a_real_skin").name).toBe("Bronze");
  });

  it("unlocks skins at or below the player's tier", () => {
    expect(isSkinUnlockedByTier("paper", 0)).toBe(true);
    expect(isSkinUnlockedByTier("gold", 0)).toBe(false);
    expect(isSkinUnlockedByTier("gold", 15000)).toBe(true);
    expect(SKIN_TIERS.gold).toBe(2);
  });

  it("blocks Mythic skins from shortcut purchase", () => {
    expect(isSkinShortcutBuyable("ruby")).toBe(true);
    expect(isSkinShortcutBuyable("matrix")).toBe(false);
    expect(isSkinAchievementOnly("matrix")).toBe(true);
    expect(isSkinAchievementOnly("ruby")).toBe(false);
  });

  it("charges the shortcut multiplier below the skin's tier", () => {
    const skin = { id: "gold", price: 500 };
    expect(getSkinEffectivePrice(skin, 15000)).toBe(500);
    expect(getSkinEffectivePrice(skin, 0)).toBe(500 * TIER_SHORTCUT_MULTIPLIER);
  });
});

describe("online skin power level stub", () => {
  it("defaults to level 1 for missing or invalid values", () => {
    expect(getSkinPowerLevel("gold")).toBe(DEFAULT_SKIN_POWER_LEVEL);
    expect(getSkinPowerLevel("gold", { gold: "nope" })).toBe(DEFAULT_SKIN_POWER_LEVEL);
    expect(getSkinPowerLevel("gold", { gold: 0 })).toBe(DEFAULT_SKIN_POWER_LEVEL);
  });

  it("floors and clamps to the 1–100 range", () => {
    expect(getSkinPowerLevel("gold", { gold: 12.9 })).toBe(12);
    expect(getSkinPowerLevel("gold", { gold: 5000 })).toBe(MAX_SKIN_POWER_LEVEL);
  });
});

describe("local skin levels", () => {
  it("maps levels to cumulative XP thresholds", () => {
    expect(skinXpForLevel(1)).toBe(0);
    expect(skinXpForLevel(2)).toBe(3);
    expect(skinXpForLevel(LOCAL_SKIN_MAX_LEVEL)).toBe(88);
    expect(skinXpForLevel(0)).toBe(0);
  });

  it("derives the level from accumulated XP", () => {
    expect(getLocalSkinLevelFromXp(0)).toBe(1);
    expect(getLocalSkinLevelFromXp(-5)).toBe(1);
    expect(getLocalSkinLevelFromXp(2)).toBe(1);
    expect(getLocalSkinLevelFromXp(3)).toBe(2);
    expect(getLocalSkinLevelFromXp(88)).toBe(LOCAL_SKIN_MAX_LEVEL);
    expect(getLocalSkinLevelFromXp(9999)).toBe(LOCAL_SKIN_MAX_LEVEL);
  });

  it("only levels skins the player owns", () => {
    const profile = { owned_skins: ["classic_white", "gold"], skin_level_xp: { gold: 21 } };
    expect(getLocalSkinPowerLevel("gold", profile)).toBe(5);
    expect(getLocalSkinPowerLevel("ruby", profile)).toBe(1);
    expect(getLocalSkinPowerLevel(null, profile)).toBe(1);
    expect(getLocalSkinPowerLevel("gold", undefined)).toBe(1);
  });

  it("awards play XP and recomputes the level", () => {
    const profile = { owned_skins: ["gold"], skin_level_xp: { gold: 2 }, skin_levels: { gold: 1 } };
    const patch = addSkinPlayXp(profile, "gold", 1);
    expect(patch).toEqual({ skin_level_xp: { gold: 3 }, skin_levels: { gold: 2 } });
    expect(profile.skin_level_xp.gold).toBe(2); // input untouched
  });

  it("ignores negative or bogus XP gains", () => {
    const profile = { owned_skins: ["gold"], skin_level_xp: { gold: 10 } };
    expect(addSkinPlayXp(profile, "gold", -5).skin_level_xp.gold).toBe(10);
    expect(addSkinPlayXp(profile, "gold", "abc").skin_level_xp.gold).toBe(10);
  });

  it("returns the existing maps for unowned skins or missing input", () => {
    const profile = { owned_skins: ["gold"], skin_level_xp: { gold: 10 }, skin_levels: { gold: 3 } };
    expect(addSkinPlayXp(profile, "ruby", 5)).toEqual({
      skin_level_xp: { gold: 10 },
      skin_levels: { gold: 3 },
    });
    expect(addSkinPlayXp(null, "gold", 5)).toEqual({ skin_level_xp: {}, skin_levels: {} });
    expect(addSkinPlayXp(profile, null, 5)).toEqual({
      skin_level_xp: { gold: 10 },
      skin_levels: { gold: 3 },
    });
  });
});
