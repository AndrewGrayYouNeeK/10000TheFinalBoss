import { describe, it, expect } from "vitest";
import { DEFAULT_ONLINE_VISIBILITY } from "../onlineVisibility";
import {
  redactDiceForOpponent,
  buildClientMatchPayload,
  deriveOnlineUiFlags,
  applyClientPayloadToRenderState,
} from "../onlineGameState";

const OPEN_VISIBILITY = {
  hideDice: false,
  hideTurnScore: false,
  hidePowerPanel: false,
  hidePowerChargeBadge: false,
  hideXrayReveals: false,
  subtlePowerVfx: false,
};

const matchState = (over = {}) => ({
  currentIndex: 0,
  players: [
    { name: "Ada", score: 1000, skinId: "gold" },
    { name: "Bo", score: 500, skinId: "ruby" },
  ],
  dice: [
    { id: 0, value: 4, used: false, held: true },
    { id: 1, value: 2, used: true, held: false },
  ],
  turnScore: 350,
  hasRolled: true,
  farkle: false,
  winner: null,
  xrayReveals: {},
  xrayScannerIndex: null,
  ...over,
});

const payloadFor = (viewerPlayerIndex, state = matchState(), visibility = {}) =>
  buildClientMatchPayload({
    matchState: state,
    viewerPlayerIndex,
    visibilityByPlayerIndex: visibility,
  });

describe("redactDiceForOpponent", () => {
  it("blanks die faces while keeping tray flags", () => {
    expect(redactDiceForOpponent([{ id: 0, value: 6, used: false, held: true }])).toEqual([
      { id: 0, value: null, used: false, held: true, valueHidden: true },
    ]);
  });

  it("returns an empty array for non-array input", () => {
    expect(redactDiceForOpponent(undefined)).toEqual([]);
  });
});

describe("buildClientMatchPayload", () => {
  it("shows the active player their own dice and turn score", () => {
    const payload = payloadFor(0);
    expect(payload.dice.map((d) => d.value)).toEqual([4, 2]);
    expect(payload.dice.every((d) => d.valueHidden === false)).toBe(true);
    expect(payload.turnScore).toBe(350);
    expect(payload.uiHints).toMatchObject({
      isMyTurn: true,
      opponentTurnPrivate: false,
      hideDice: false,
      hideTurnScore: false,
    });
  });

  it("hides dice and turn score from opponents by default", () => {
    const payload = payloadFor(1);
    expect(payload.dice.every((d) => d.value === null && d.valueHidden)).toBe(true);
    expect(payload.turnScore).toBeNull();
    expect(payload.uiHints).toMatchObject({
      isMyTurn: false,
      opponentTurnPrivate: true,
      hideDice: true,
      hideTurnScore: true,
      opponentWatchingPrivateTurn: true,
    });
  });

  it("respects the active player's opted-in visibility", () => {
    const payload = payloadFor(1, matchState(), { 0: OPEN_VISIBILITY });
    expect(payload.dice.map((d) => d.value)).toEqual([4, 2]);
    expect(payload.turnScore).toBe(350);
    expect(payload.uiHints.opponentTurnPrivate).toBe(false);
  });

  it("force-hides dice for a disguised Ghost even with open settings", () => {
    const state = matchState({
      players: [
        { name: "Ada", score: 0, skinId: "ghost", trueSkinId: "gold" },
        { name: "Bo", score: 0, skinId: "ruby" },
      ],
    });
    const payload = payloadFor(1, state, { 0: OPEN_VISIBILITY });
    expect(payload.uiHints.hideDice).toBe(true);
    expect(payload.uiHints.opponentTurnPrivate).toBe(true);
    expect(payloadFor(0, state, { 0: OPEN_VISIBILITY }).uiHints.hideDice).toBe(false);
  });

  it("only shows x-ray intel to the scanner on their own turn", () => {
    const reveals = { 1: [{ icon: "⚡", text: "Hidden power: Shield" }] };
    const state = matchState({ xrayReveals: reveals, xrayScannerIndex: 0 });
    expect(payloadFor(0, state, { 0: OPEN_VISIBILITY }).xrayReveals).toEqual(reveals);
    const opponent = payloadFor(1, state, { 0: OPEN_VISIBILITY });
    expect(opponent.xrayReveals).toEqual({});
    expect(opponent.uiHints.hideXrayReveals).toBe(true);
  });

  it("resolves the winner's seat index by reference and by value", () => {
    const byRef = matchState();
    byRef.winner = byRef.players[1];
    expect(payloadFor(0, byRef).winnerPlayerIndex).toBe(1);

    const byValue = matchState({ winner: { name: "Bo", score: 500 } });
    expect(payloadFor(0, byValue).winnerPlayerIndex).toBe(1);

    const unknown = matchState({ winner: { name: "Ghost", score: 42 } });
    expect(payloadFor(0, unknown).winnerPlayerIndex).toBeNull();
  });

  it("falls back to defaults for a missing visibility entry", () => {
    const payload = payloadFor(1, matchState(), { 1: OPEN_VISIBILITY });
    expect(payload.uiHints.hideDice).toBe(DEFAULT_ONLINE_VISIBILITY.hideDice);
  });
});

describe("deriveOnlineUiFlags", () => {
  it("is inactive without a payload", () => {
    expect(deriveOnlineUiFlags(null)).toMatchObject({ active: false, hideDice: false });
    expect(deriveOnlineUiFlags({})).toMatchObject({ active: false });
  });

  it("mirrors the payload hints for the active player", () => {
    expect(deriveOnlineUiFlags(payloadFor(0))).toMatchObject({
      active: true,
      isMyTurn: true,
      diceInteractionDisabled: false,
      showOpponentWaitingBanner: false,
    });
  });

  it("locks dice interaction for a watching opponent", () => {
    expect(deriveOnlineUiFlags(payloadFor(1))).toMatchObject({
      active: true,
      isMyTurn: false,
      hideDice: true,
      diceInteractionDisabled: true,
      showOpponentWaitingBanner: true,
    });
  });
});

describe("applyClientPayloadToRenderState", () => {
  it("returns the local state untouched without a payload", () => {
    const local = matchState();
    expect(applyClientPayloadToRenderState(local, null)).toBe(local);
  });

  it("drops viewer-only fields when there is no local state", () => {
    const merged = applyClientPayloadToRenderState(null, payloadFor(0));
    expect(merged.uiHints).toBeUndefined();
    expect(merged.viewerPlayerIndex).toBeUndefined();
    expect(merged.currentIndex).toBe(0);
  });

  it("prefers payload dice, turn score and reveals over local inference", () => {
    const local = matchState({ turnScore: 999 });
    const merged = applyClientPayloadToRenderState(local, payloadFor(1));
    expect(merged.turnScore).toBeNull();
    expect(merged.dice.every((d) => d.value === null)).toBe(true);
    expect(merged.xrayReveals).toEqual({});
  });
});
