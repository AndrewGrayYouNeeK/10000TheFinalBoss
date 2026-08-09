import { describe, it, expect } from "vitest";
import {
  isFreshUnstartedGame,
  sanitizeRestoredGame,
  loadStoryFight,
  saveStoryFight,
  clearStoryFight,
  abandonStoryFight,
} from "../storyGameSave";

const BOSS = "neon_king";
const storageKey = (bossId) => `yourneek_story_fight_${bossId}`;

const game = (over = {}) => ({
  players: [{ score: 0 }, { score: 0 }],
  turnScore: 0,
  bustCount: 0,
  hasRolled: false,
  winner: null,
  ...over,
});

const snapshot = (over = {}) => ({
  game: game(),
  dialogue: null,
  bloodWaterLocked: false,
  farkleShieldUsed: false,
  rewardsClaimed: false,
  ...over,
});

describe("isFreshUnstartedGame", () => {
  it("flags untouched boards", () => {
    expect(isFreshUnstartedGame(null)).toBe(true);
    expect(isFreshUnstartedGame(game())).toBe(true);
    expect(isFreshUnstartedGame(game({ turnScore: 300 }))).toBe(false);
  });
});

describe("sanitizeRestoredGame", () => {
  it("clears transient FX flags and passes through non-objects", () => {
    expect(sanitizeRestoredGame(game({ sharkBiteFx: true }))).toMatchObject({
      sharkBiteFx: false,
      matrixGlitchDieIds: [],
    });
    expect(sanitizeRestoredGame(undefined)).toBeUndefined();
  });
});

describe("save / load round trip", () => {
  it("returns null without a boss id or a stored fight", () => {
    expect(loadStoryFight()).toBeNull();
    expect(loadStoryFight(BOSS)).toBeNull();
  });

  it("stores per-boss and restores with FX stripped", () => {
    saveStoryFight(BOSS, snapshot({ game: game({ hasRolled: true, sharkDiceHidden: true }) }));
    const loaded = loadStoryFight(BOSS);
    expect(loaded.game.hasRolled).toBe(true);
    expect(loaded.game.sharkDiceHidden).toBe(false);
    expect(loadStoryFight("other_boss")).toBeNull();
  });

  it("refuses to save without a boss id or a game", () => {
    saveStoryFight(null, snapshot());
    saveStoryFight(BOSS, { game: null });
    expect(loadStoryFight(BOSS)).toBeNull();
  });

  it("only stores a finished fight once its outcome dialogue is known", () => {
    const won = game({ winner: { name: "Ada" } });
    saveStoryFight(BOSS, snapshot({ game: won }));
    expect(loadStoryFight(BOSS)).toBeNull();
    saveStoryFight(BOSS, snapshot({ game: won, dialogue: "win" }));
    expect(loadStoryFight(BOSS).dialogue).toBe("win");
  });

  it("drops a stored fight that ended without outcome dialogue", () => {
    sessionStorage.setItem(
      storageKey(BOSS),
      JSON.stringify({ bossId: BOSS, game: game({ winner: { name: "Ada" } }), dialogue: null })
    );
    expect(loadStoryFight(BOSS)).toBeNull();
  });

  it("ignores a mismatched or corrupt payload", () => {
    sessionStorage.setItem(storageKey(BOSS), JSON.stringify({ bossId: "other", game: game() }));
    expect(loadStoryFight(BOSS)).toBeNull();
    sessionStorage.setItem(storageKey(BOSS), "nope");
    expect(loadStoryFight(BOSS)).toBeNull();
  });

  it("clears and abandons a fight", () => {
    saveStoryFight(BOSS, snapshot());
    clearStoryFight(BOSS);
    expect(loadStoryFight(BOSS)).toBeNull();

    saveStoryFight(BOSS, snapshot());
    abandonStoryFight(BOSS);
    expect(loadStoryFight(BOSS)).toBeNull();
    clearStoryFight(null); // no-op
  });
});

describe("overwrite guards", () => {
  it("keeps the higher-scoring mid-fight save", () => {
    saveStoryFight(BOSS, snapshot({ game: game({ players: [{ score: 2500 }, { score: 0 }] }) }));
    saveStoryFight(BOSS, snapshot());
    expect(loadStoryFight(BOSS).game.players[0].score).toBe(2500);
  });

  it("keeps a started fight over a fresh board", () => {
    saveStoryFight(BOSS, snapshot({ game: game({ bustCount: 1 }) }));
    saveStoryFight(BOSS, snapshot());
    expect(loadStoryFight(BOSS).game.bustCount).toBe(1);
  });

  it("always writes the result once the fight is decided", () => {
    saveStoryFight(BOSS, snapshot({ game: game({ players: [{ score: 2500 }, { score: 0 }] }) }));
    saveStoryFight(BOSS, snapshot({ dialogue: "lose", rewardsClaimed: true }));
    expect(loadStoryFight(BOSS)).toMatchObject({ dialogue: "lose", rewardsClaimed: true });
  });
});
