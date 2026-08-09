import { describe, it, expect } from "vitest";
import { GHOST_SKIN_ID } from "../ghostDisguise";
import {
  normalizeXrayFindings,
  scanPlayerHidden,
  scanAllOpponents,
  formatXraySummary,
  xrayRevealsVisible,
  skinHasHiddenTraits,
} from "../xrayScan";

const texts = (findings) => findings.map((f) => f.text);

describe("normalizeXrayFindings", () => {
  it("passes finding arrays through and upgrades legacy strings", () => {
    const findings = [{ icon: "⚡", text: "Hidden power: Shield" }];
    expect(normalizeXrayFindings(findings)).toBe(findings);
    expect(normalizeXrayFindings("gold")[0].text).toContain("Ghost disguise");
    expect(normalizeXrayFindings(null)).toEqual([]);
    expect(normalizeXrayFindings(42)).toEqual([]);
  });
});

describe("scanPlayerHidden", () => {
  it("reports the real skin and its hidden power for a normal player", () => {
    const findings = scanPlayerHidden({ name: "Ada", skinId: "matrix" });
    expect(texts(findings).some((t) => t.startsWith("Not Ghost — real skin:"))).toBe(true);
    expect(texts(findings).some((t) => t.includes("Hidden power:"))).toBe(true);
  });

  it("reports no hidden power for the powerless skins", () => {
    const findings = scanPlayerHidden({ name: "Ada", skinId: "classic_white" });
    expect(texts(findings).some((t) => t.includes("Hidden power:"))).toBe(false);
  });

  it("calls out a bare Ghost and its mimic behaviour", () => {
    const findings = texts(scanPlayerHidden({ name: "G", skinId: GHOST_SKIN_ID, ghostBare: true }));
    expect(findings.some((t) => t.includes("no disguise"))).toBe(true);
    expect(findings.some((t) => t.includes("mimics opponent"))).toBe(true);
  });

  it("reveals a Ghost's disguise and the borrowed power", () => {
    const findings = texts(
      scanPlayerHidden({ name: "G", skinId: GHOST_SKIN_ID, trueSkinId: "matrix" })
    );
    expect(findings.some((t) => t.includes("disguised as"))).toBe(true);
    expect(findings.some((t) => t.includes("Disguise power"))).toBe(true);
  });

  it("describes hidden dice traits for clear custom skins", () => {
    const findings = texts(scanPlayerHidden({ name: "Ada", skinId: "clear_void" }));
    expect(findings.some((t) => t.toLowerCase().includes("hidden") || t.toLowerCase().includes("invisible"))).toBe(
      true
    );
  });

  it("lists active sabotage debuffs, string or object form", () => {
    const findings = texts(
      scanPlayerHidden({
        name: "Ada",
        skinId: "gold",
        debuffs: ["static", { id: "shark_bite", from: 1 }, { id: "unknown_debuff" }],
      })
    );
    expect(findings.some((t) => t.includes("Static"))).toBe(true);
    expect(findings.some((t) => t.includes("Shark Bite"))).toBe(true);
    expect(findings).toHaveLength(new Set(findings).size);
  });
});

describe("scanAllOpponents", () => {
  const state = {
    currentIndex: 0,
    players: [
      { name: "Ada", skinId: "gold" },
      { name: "Bo", skinId: "matrix", debuffs: ["lockout"] },
    ],
    xrayReveals: {},
  };

  it("scans everyone but the scanner", () => {
    const { reveals, scanned, hasAny } = scanAllOpponents(state);
    expect(hasAny).toBe(true);
    expect(Object.keys(reveals)).toEqual(["1"]);
    expect(scanned).toHaveLength(1);
    expect(scanned[0].name).toBe("Bo");
  });

  it("merges into existing reveals without duplicating findings", () => {
    const first = scanAllOpponents(state);
    const second = scanAllOpponents({ ...state, xrayReveals: first.reveals });
    expect(second.reveals[1]).toHaveLength(first.reveals[1].length);
  });

  it("upgrades legacy string reveals when merging", () => {
    const merged = scanAllOpponents({ ...state, xrayReveals: { 1: "gold" } });
    expect(merged.reveals[1][0].text).toContain("Ghost disguise");
  });

  it("reports nothing when there are no opponents", () => {
    const solo = { currentIndex: 0, players: [{ name: "Ada", skinId: "gold" }] };
    expect(scanAllOpponents(solo)).toMatchObject({ hasAny: false, scanned: [] });
  });
});

describe("formatXraySummary", () => {
  it("joins players and their findings into one line", () => {
    expect(
      formatXraySummary([
        { name: "Bo", findings: [{ text: "a" }, { text: "b" }] },
        { name: "Cy", findings: [{ text: "c" }] },
      ])
    ).toBe("Bo: a; b · Cy: c");
    expect(formatXraySummary([])).toBe("");
  });
});

describe("xrayRevealsVisible", () => {
  const reveals = { 1: [{ icon: "⚡", text: "Hidden power: Shield" }] };

  it("returns nothing when there is nothing to show", () => {
    expect(xrayRevealsVisible(null, { currentIndex: 0 })).toEqual({});
    expect(xrayRevealsVisible({}, { currentIndex: 0 })).toEqual({});
  });

  it("shows legacy reveals with no scanner recorded", () => {
    expect(xrayRevealsVisible(reveals, { scannerIndex: null, currentIndex: 1 })).toEqual(reveals);
  });

  it("shows intel only on the scanner's turn", () => {
    expect(xrayRevealsVisible(reveals, { scannerIndex: 0, currentIndex: 0 })).toEqual(reveals);
    expect(xrayRevealsVisible(reveals, { scannerIndex: 0, currentIndex: 1 })).toEqual({});
  });

  it("also requires the online viewer to be the scanner", () => {
    expect(
      xrayRevealsVisible(reveals, { scannerIndex: 0, currentIndex: 0, viewerIndex: 0 })
    ).toEqual(reveals);
    expect(
      xrayRevealsVisible(reveals, { scannerIndex: 0, currentIndex: 0, viewerIndex: 1 })
    ).toEqual({});
  });
});

describe("skinHasHiddenTraits", () => {
  it("is true for Ghost and for clear custom dice", () => {
    expect(skinHasHiddenTraits(GHOST_SKIN_ID)).toBe(true);
    expect(skinHasHiddenTraits("clear_void")).toBe(true);
    expect(skinHasHiddenTraits("pf_xray")).toBe(true);
  });

  it("is false for ordinary production skins", () => {
    expect(skinHasHiddenTraits("gold")).toBe(false);
  });
});
