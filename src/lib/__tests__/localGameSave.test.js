import { describe, it, expect } from "vitest";
import {
  namesMatch,
  isFreshUnstartedGame,
  sanitizeRestoredGame,
  loadLocalGame,
  saveLocalGame,
  clearLocalGame,
  hasResumableLocalGame,
} from "../localGameSave";

const STORAGE_KEY = "dice10k_local_game";

const game = (over = {}) => ({
  players: [{ score: 0 }, { score: 0 }],
  turnScore: 0,
  bustCount: 0,
  hasRolled: false,
  winner: null,
  ...over,
});

const snapshot = (over = {}) => ({
  playerNames: ["Ada", "Bo"],
  game: game(),
  rollOffSetup: null,
  bloodWaterLocked: false,
  revealedTurnKey: null,
  ...over,
});

describe("namesMatch", () => {
  it("compares name lists positionally", () => {
    expect(namesMatch(["a", "b"], ["a", "b"])).toBe(true);
    expect(namesMatch(["a", "b"], ["b", "a"])).toBe(false);
    expect(namesMatch(["a"], ["a", "b"])).toBe(false);
    expect(namesMatch(null, ["a"])).toBe(false);
  });
});

describe("isFreshUnstartedGame", () => {
  it("treats missing or untouched boards as fresh", () => {
    expect(isFreshUnstartedGame(null)).toBe(true);
    expect(isFreshUnstartedGame({ players: [] })).toBe(true);
    expect(isFreshUnstartedGame(game())).toBe(true);
  });

  it("detects any sign of play", () => {
    expect(isFreshUnstartedGame(game({ players: [{ score: 500 }] }))).toBe(false);
    expect(isFreshUnstartedGame(game({ turnScore: 50 }))).toBe(false);
    expect(isFreshUnstartedGame(game({ bustCount: 1 }))).toBe(false);
    expect(isFreshUnstartedGame(game({ hasRolled: true }))).toBe(false);
    expect(isFreshUnstartedGame(game({ winner: { name: "Ada" } }))).toBe(false);
  });
});

describe("sanitizeRestoredGame", () => {
  it("clears transient FX flags", () => {
    expect(
      sanitizeRestoredGame(
        game({ sharkBiteFx: true, sharkDiceHidden: true, matrixGlitchFx: true, matrixGlitchDieIds: [1] })
      )
    ).toMatchObject({
      sharkBiteFx: false,
      sharkDiceHidden: false,
      matrixGlitchFx: false,
      matrixGlitchDieIds: [],
    });
  });

  it("passes through non-objects", () => {
    expect(sanitizeRestoredGame(null)).toBeNull();
  });
});

describe("save / load round trip", () => {
  it("returns null when nothing is stored", () => {
    expect(loadLocalGame()).toBeNull();
    expect(hasResumableLocalGame()).toBe(false);
  });

  it("saves a snapshot and restores it with FX stripped", () => {
    saveLocalGame(snapshot({ game: game({ sharkBiteFx: true, hasRolled: true }) }));
    const loaded = loadLocalGame();
    expect(loaded.playerNames).toEqual(["Ada", "Bo"]);
    expect(loaded.game.sharkBiteFx).toBe(false);
    expect(loaded.savedAt).toBeTypeOf("number");
    expect(hasResumableLocalGame()).toBe(true);
  });

  it("refuses to save without player names or any game data", () => {
    saveLocalGame({ playerNames: [], game: game() });
    saveLocalGame({ playerNames: ["Ada"], game: null, rollOffSetup: null });
    expect(loadLocalGame()).toBeNull();
  });

  it("accepts a roll-off-only snapshot", () => {
    saveLocalGame(snapshot({ game: null, rollOffSetup: { names: ["Ada", "Bo"], playerSkins: [] } }));
    expect(loadLocalGame().rollOffSetup.names).toEqual(["Ada", "Bo"]);
  });

  it("ignores stored data missing player names", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ game: game() }));
    expect(loadLocalGame()).toBeNull();
  });

  it("ignores corrupt stored data", () => {
    localStorage.setItem(STORAGE_KEY, "nope");
    expect(loadLocalGame()).toBeNull();
  });

  it("clears the save", () => {
    saveLocalGame(snapshot());
    clearLocalGame();
    expect(loadLocalGame()).toBeNull();
  });
});

describe("overwrite guards", () => {
  it("keeps a scored mid-match instead of a lower remount board", () => {
    saveLocalGame(snapshot({ game: game({ players: [{ score: 3000 }, { score: 1000 }] }) }));
    saveLocalGame(snapshot());
    expect(loadLocalGame().game.players[0].score).toBe(3000);
  });

  it("keeps a started match over a fresh board with the same totals", () => {
    saveLocalGame(snapshot({ game: game({ bustCount: 2 }) }));
    saveLocalGame(snapshot());
    expect(loadLocalGame().game.bustCount).toBe(2);
  });

  it("allows overwrites for different players", () => {
    saveLocalGame(snapshot({ game: game({ players: [{ score: 3000 }] }) }));
    saveLocalGame(snapshot({ playerNames: ["Cy", "Di"] }));
    expect(loadLocalGame().playerNames).toEqual(["Cy", "Di"]);
  });

  it("always allows a finished / awarded game to be written", () => {
    saveLocalGame(snapshot({ game: game({ players: [{ score: 3000 }] }) }));
    saveLocalGame(snapshot({ winnerAwarded: true }));
    expect(loadLocalGame().winnerAwarded).toBe(true);
    expect(loadLocalGame().game.players[0].score).toBe(0);
  });
});
