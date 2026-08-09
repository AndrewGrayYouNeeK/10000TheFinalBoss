import { describe, it, expect } from "vitest";
import {
  GHOST_SKIN_ID,
  SESSION_PLAYER_SKINS_KEY,
  SESSION_PLAYER_DISGUISES_KEY,
  isGhostDisguise,
  isGhostPlayer,
  canViewerSeeGhostDice,
  ghostDicePrivacyActive,
  getGhostHiddenTraySkinId,
  storyGhostDiceHidden,
  storyGhostPowerHiddenScores,
  resolveGhostDisguise,
  getPretendSkin,
  getDisplaySkinId,
  resolveDiceSkinId,
  pickTrueSkinForGhost,
  assignPlayerSkin,
  getSetupSkinOptions,
  getSetupDisguiseOptions,
  readSessionPlayerSkinIds,
  readSessionPlayerDisguiseIds,
  buildDefaultSetupSkinIds,
  buildDefaultSetupDisguiseIds,
  buildGamePlayerSkins,
  getSkinLabel,
  primaryOpponentIndex,
  resolvePlayerPower,
} from "../ghostDisguise";
import { getSkinPower } from "../skinPowers";

const ghost = (over = {}) => ({ name: "Ghosty", skinId: GHOST_SKIN_ID, ...over });
const plain = (skinId = "gold") => ({ name: "Ada", skinId });

describe("ghost identification", () => {
  it("separates a bare Ghost from a disguised one", () => {
    expect(isGhostPlayer(ghost())).toBe(true);
    expect(isGhostPlayer(plain())).toBe(false);
    expect(isGhostDisguise(ghost())).toBe(false);
    expect(isGhostDisguise(ghost({ trueSkinId: "gold" }))).toBe(true);
  });

  it("keeps disguised Ghost dice private to that player", () => {
    const disguised = ghost({ trueSkinId: "gold" });
    expect(canViewerSeeGhostDice(plain())).toBe(true);
    expect(canViewerSeeGhostDice(disguised)).toBe(false);
    expect(canViewerSeeGhostDice(disguised, { allowSpectator: true })).toBe(true);
    expect(canViewerSeeGhostDice(disguised, { viewerPlayerIndex: 1, currentIndex: 1 })).toBe(true);
    expect(canViewerSeeGhostDice(disguised, { viewerPlayerIndex: 0, currentIndex: 1 })).toBe(false);
    expect(ghostDicePrivacyActive(disguised)).toBe(true);
    expect(getGhostHiddenTraySkinId()).toBe(GHOST_SKIN_ID);
  });

  it("hides story Ghost dice and charged scores from the human", () => {
    expect(storyGhostDiceHidden(ghost(), 1, 0)).toBe(true);
    expect(storyGhostDiceHidden(ghost(), 0, 0)).toBe(false);
    expect(storyGhostDiceHidden(plain(), 1, 0)).toBe(false);

    const state = { players: [plain(), ghost({ powerCharge: true })] };
    expect([...storyGhostPowerHiddenScores(state)]).toEqual([1]);
    expect(storyGhostPowerHiddenScores({ players: [plain(), ghost()] }).size).toBe(0);
  });
});

describe("resolveGhostDisguise", () => {
  it("is null for non-Ghost and bare Ghost players", () => {
    expect(resolveGhostDisguise(plain())).toBeNull();
    expect(resolveGhostDisguise(ghost({ ghostBare: true, trueSkinId: "gold" }))).toBeNull();
  });

  it("prefers the stored disguise, then the option, then owned skins", () => {
    expect(resolveGhostDisguise(ghost({ trueSkinId: "gold" }))).toBe("gold");
    expect(resolveGhostDisguise(ghost(), { ghostDisguiseId: "ruby" })).toBe("ruby");
    expect(resolveGhostDisguise(ghost(), { ownedSkins: [GHOST_SKIN_ID, "obsidian"] })).toBe("obsidian");
  });

  it("normalizes legacy ids and refuses Ghost-as-disguise", () => {
    expect(resolveGhostDisguise(ghost({ trueSkinId: "ragnarok_regular" }))).toBe("ragnarok");
    expect(resolveGhostDisguise(ghost(), { ghostDisguiseId: GHOST_SKIN_ID })).toBeNull();
  });
});

describe("skin id resolution", () => {
  it("getPretendSkin returns the disguise for Ghost and the face skin otherwise", () => {
    expect(getPretendSkin(null)).toBe("classic_white");
    expect(getPretendSkin(ghost({ trueSkinId: "gold" }))).toBe("gold");
    expect(getPretendSkin(ghost({ ghostBare: true }))).toBe(GHOST_SKIN_ID);
    expect(getPretendSkin(plain("ragnarok_regular"))).toBe("ragnarok");
  });

  it("getDisplaySkinId always keeps Ghost spectral", () => {
    expect(getDisplaySkinId(ghost({ trueSkinId: "gold" }))).toBe(GHOST_SKIN_ID);
    expect(getDisplaySkinId(null)).toBe("classic_white");
    expect(resolveDiceSkinId()).toBe("classic_white");
    expect(resolveDiceSkinId("ragnarok_regular")).toBe("ragnarok");
  });

  it("getSkinLabel reads the catalog name, defaulting unknown ids to the first skin", () => {
    expect(getSkinLabel("gold")).toBeTruthy();
    expect(getSkinLabel("not_a_real_skin")).toBe(getSkinLabel("classic_white"));
  });
});

describe("assignPlayerSkin", () => {
  it("passes non-Ghost skins straight through", () => {
    expect(assignPlayerSkin("gold")).toEqual({ skinId: "gold" });
    expect(assignPlayerSkin(null)).toEqual({ skinId: "classic_white" });
  });

  it("attaches a disguise to Ghost, or marks it bare", () => {
    expect(assignPlayerSkin(GHOST_SKIN_ID, [], "gold")).toEqual({
      skinId: GHOST_SKIN_ID,
      trueSkinId: "gold",
    });
    expect(assignPlayerSkin(GHOST_SKIN_ID, ["gold"])).toEqual({
      skinId: GHOST_SKIN_ID,
      trueSkinId: "gold",
    });
    expect(assignPlayerSkin(GHOST_SKIN_ID, ["gold"], null, { bareGhost: true })).toEqual({
      skinId: GHOST_SKIN_ID,
      ghostBare: true,
    });
    expect(assignPlayerSkin(GHOST_SKIN_ID, [], GHOST_SKIN_ID)).toEqual({
      skinId: GHOST_SKIN_ID,
      ghostBare: true,
    });
  });

  it("pickTrueSkinForGhost skips Ghost and falls back to classic white", () => {
    expect(pickTrueSkinForGhost([GHOST_SKIN_ID, "ruby"])).toBe("ruby");
    expect(pickTrueSkinForGhost([GHOST_SKIN_ID])).toBe("classic_white");
    expect(pickTrueSkinForGhost()).toBe("classic_white");
  });
});

describe("setup helpers", () => {
  it("pins Ghost to the front of the pickers when owned", () => {
    expect(getSetupSkinOptions(["gold", GHOST_SKIN_ID, "ruby"])).toEqual([
      GHOST_SKIN_ID,
      "gold",
      "ruby",
    ]);
    expect(getSetupSkinOptions(["gold", null])).toEqual(["gold"]);
    expect(getSetupDisguiseOptions(["gold", GHOST_SKIN_ID])).toEqual([GHOST_SKIN_ID, "gold"]);
  });

  it("reads session skin / disguise picks defensively", () => {
    expect(readSessionPlayerSkinIds()).toBeNull();
    sessionStorage.setItem(SESSION_PLAYER_SKINS_KEY, JSON.stringify(["gold", GHOST_SKIN_ID]));
    expect(readSessionPlayerSkinIds()).toEqual(["gold", GHOST_SKIN_ID]);
    sessionStorage.setItem(SESSION_PLAYER_SKINS_KEY, JSON.stringify({ not: "an array" }));
    expect(readSessionPlayerSkinIds()).toBeNull();

    expect(readSessionPlayerDisguiseIds()).toBeNull();
    sessionStorage.setItem(SESSION_PLAYER_DISGUISES_KEY, "nope");
    expect(readSessionPlayerDisguiseIds()).toBeNull();
    sessionStorage.setItem(SESSION_PLAYER_DISGUISES_KEY, JSON.stringify(["gold"]));
    expect(readSessionPlayerDisguiseIds()).toEqual(["gold"]);
  });

  it("defaults slot 0 to the equipped skin and spreads the rest over the pool", () => {
    const ids = buildDefaultSetupSkinIds(3, "gold", ["classic_white", "gold", "ruby"]);
    expect(ids[0]).toBe("gold");
    expect(ids).toHaveLength(3);
    ids.forEach((id) => expect(id).toBeTruthy());
    expect(buildDefaultSetupSkinIds(1, null, [])[0]).toBe("classic_white");
  });

  it("only defaults disguises for Ghost slots", () => {
    const disguises = buildDefaultSetupDisguiseIds(2, [GHOST_SKIN_ID, "gold"], "ruby", ["gold", "ruby"]);
    expect(disguises[0]).toBe("ruby");
    expect(disguises[1]).toBeNull();
  });
});

describe("buildGamePlayerSkins", () => {
  it("uses explicit picks when given", () => {
    const skins = buildGamePlayerSkins(2, "gold", ["gold", "ruby"], null, ["ruby", "gold"]);
    expect(skins).toEqual([{ skinId: "ruby" }, { skinId: "gold" }]);
  });

  it("gives Ghost slots a disguise", () => {
    const skins = buildGamePlayerSkins(
      2,
      GHOST_SKIN_ID,
      ["gold", GHOST_SKIN_ID],
      "gold",
      [GHOST_SKIN_ID, GHOST_SKIN_ID]
    );
    expect(skins[0]).toEqual({ skinId: GHOST_SKIN_ID, trueSkinId: "gold" });
    expect(skins[1].skinId).toBe(GHOST_SKIN_ID);
    expect(skins[1].trueSkinId || skins[1].ghostBare).toBeTruthy();
  });

  it("falls back to a built-in pool with no owned skins", () => {
    const skins = buildGamePlayerSkins(2, null, []);
    expect(skins).toHaveLength(2);
    skins.forEach((s) => expect(s.skinId).toBeTruthy());
  });
});

describe("primaryOpponentIndex", () => {
  it("wraps around the table and self-returns for solo boards", () => {
    const state = { currentIndex: 1, players: [plain(), plain(), plain()] };
    expect(primaryOpponentIndex(state)).toBe(2);
    expect(primaryOpponentIndex(state, 2)).toBe(0);
    expect(primaryOpponentIndex({ players: [plain()] }, 0)).toBe(0);
    expect(primaryOpponentIndex(null)).toBe(0);
  });
});

describe("resolvePlayerPower", () => {
  it("returns an empty result for a missing player", () => {
    expect(resolvePlayerPower({ players: [] }, 0)).toEqual({
      power: null,
      mimicSkinId: null,
      isMimic: false,
      sourcePlayerName: null,
    });
  });

  it("honours a story charge override", () => {
    const state = { currentIndex: 0, players: [{ ...plain(), chargePowerId: "shield" }] };
    expect(resolvePlayerPower(state, 0)).toMatchObject({
      power: expect.objectContaining({ id: "shield" }),
      mimicSkinId: "gold",
      isMimic: false,
    });
  });

  it("ignores an unknown charge override and uses the tray skin", () => {
    const state = { currentIndex: 0, players: [{ ...plain(), chargePowerId: "nope" }] };
    expect(resolvePlayerPower(state, 0).power).toEqual(getSkinPower("gold"));
  });

  it("uses the tray skin power for non-Ghost players", () => {
    const state = { currentIndex: 0, players: [plain("matrix"), plain()] };
    expect(resolvePlayerPower(state, 0)).toMatchObject({
      mimicSkinId: "matrix",
      isMimic: false,
    });
    expect(resolvePlayerPower(state, 0).power.id).toBe("matrix_glitch");
  });

  it("uses the disguise power for a disguised Ghost", () => {
    const state = { currentIndex: 0, players: [ghost({ trueSkinId: "matrix" }), plain()] };
    expect(resolvePlayerPower(state, 0)).toMatchObject({ mimicSkinId: "matrix", isMimic: false });
  });

  it("mimics the opponent's pretend skin for a bare Ghost", () => {
    const state = { currentIndex: 0, players: [ghost({ ghostBare: true }), plain("matrix")] };
    expect(resolvePlayerPower(state, 0)).toMatchObject({
      mimicSkinId: "matrix",
      isMimic: true,
      sourcePlayerName: "Ada",
    });
  });
});
