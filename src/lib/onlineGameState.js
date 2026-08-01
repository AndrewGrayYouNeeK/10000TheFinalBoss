/**
 * Server-authoritative online match state — per-client payload projection.
 *
 * `buildClientMatchPayload()` is the spec the game server should run once per
 * connected player after every authoritative state change.
 */

import { DEFAULT_ONLINE_VISIBILITY, normalizeOnlineVisibility } from "@/lib/onlineVisibility";
import { xrayRevealsVisible } from "@/lib/xrayScan";
import { ghostDicePrivacyActive } from "@/lib/ghostDisguise";

/** @typedef {import("@/lib/onlineVisibility").OnlineVisibilitySettings} OnlineVisibilitySettings */

/**
 * @typedef {Object} ClientMatchPayload
 * @property {number} viewerPlayerIndex
 * @property {number} currentIndex
 * @property {Array} players
 * @property {Array} dice
 * @property {number|null} turnScore
 * @property {boolean} hasRolled
 * @property {boolean} farkle
 * @property {object|null} winner
 * @property {Record<string, unknown>} xrayReveals
 * @property {object} uiHints
 */

const HIDDEN_DICE_PLACEHOLDER = null;

/**
 * Redact die faces for opponents — keep held/used flags for tray layout.
 * @param {Array} dice
 */
export function redactDiceForOpponent(dice) {
  if (!Array.isArray(dice)) return [];
  return dice.map((d) => ({
    ...d,
    value: HIDDEN_DICE_PLACEHOLDER,
    valueHidden: true,
  }));
}

/**
 * Build the payload a single client should receive.
 * Run on SERVER with canonical match state.
 *
 * @param {{
 *   matchState: object,
 *   viewerPlayerIndex: number,
 *   visibilityByPlayerIndex?: Record<number, OnlineVisibilitySettings>,
 * }} params
 * @returns {ClientMatchPayload}
 */
export function buildClientMatchPayload({
  matchState,
  viewerPlayerIndex,
  visibilityByPlayerIndex = {},
}) {
  const currentIndex = matchState?.currentIndex ?? 0;
  const isMyTurn = viewerPlayerIndex === currentIndex;
  const activeVisibility = normalizeOnlineVisibility(
    visibilityByPlayerIndex[currentIndex] ?? DEFAULT_ONLINE_VISIBILITY
  );

  const currentPlayer = matchState.players?.[currentIndex];
  // Ghost + disguise: force-hide die faces from opponents. Score / power stay visible.
  const ghostHidesDice = ghostDicePrivacyActive(currentPlayer) && !isMyTurn;
  const opponentTurnPrivate =
    !isMyTurn &&
    (ghostHidesDice ||
      activeVisibility.hideDice ||
      activeVisibility.hideTurnScore ||
      activeVisibility.hidePowerPanel ||
      activeVisibility.hidePowerChargeBadge ||
      activeVisibility.hideXrayReveals);
  const hideDiceFromViewer = (!isMyTurn && activeVisibility.hideDice) || ghostHidesDice;
  const hideTurnScoreFromViewer = !isMyTurn && activeVisibility.hideTurnScore;
  const scannerIdx = matchState.xrayScannerIndex ?? null;
  const visibleXrayReveals = xrayRevealsVisible(matchState.xrayReveals, {
    scannerIndex: scannerIdx,
    currentIndex,
    viewerIndex: viewerPlayerIndex,
  });
  const hideXrayFromViewer =
    Object.keys(visibleXrayReveals).length === 0 &&
    Object.keys(matchState.xrayReveals ?? {}).length > 0;

  const dice = hideDiceFromViewer
    ? redactDiceForOpponent(matchState.dice)
    : (matchState.dice ?? []).map((d) => ({ ...d, valueHidden: false }));

  const players = (matchState.players ?? []).map((p, i) => ({
    ...p,
    scoreHidden: false,
  }));

  return {
    viewerPlayerIndex,
    currentIndex,
    players,
    dice,
    turnScore: hideTurnScoreFromViewer ? null : (matchState.turnScore ?? 0),
    hasRolled: !!matchState.hasRolled,
    farkle: !!matchState.farkle,
    winner: matchState.winner ?? null,
    xrayReveals: visibleXrayReveals,
    // Pass-through fields the UI may need (extend as online grows)
    sharkBiteFx: matchState.sharkBiteFx,
    sharkDiceHidden: matchState.sharkDiceHidden,
    sharkFishFeast: matchState.sharkFishFeast,
    sharkFishFeastTargetIdx: matchState.sharkFishFeastTargetIdx,
    perfectTenKPending: matchState.perfectTenKPending,
    uiHints: {
      isMyTurn,
      opponentTurnPrivate,
      hideDice: hideDiceFromViewer,
      hideTurnScore: hideTurnScoreFromViewer,
      hidePowerPanel: !isMyTurn && activeVisibility.hidePowerPanel,
      hidePowerChargeBadge: !isMyTurn && activeVisibility.hidePowerChargeBadge,
      hideXrayReveals:
        hideXrayFromViewer || (!isMyTurn && activeVisibility.hideXrayReveals),
      subtlePowerVfx: !isMyTurn && activeVisibility.subtlePowerVfx,
      /** Opponent's device: watching private turn — disable inputs, no handoff overlay. */
      opponentWatchingPrivateTurn: opponentTurnPrivate,
    },
  };
}

/**
 * Derive Game.jsx UI flags from a client payload (server-sent or locally mocked).
 * @param {ClientMatchPayload|null|undefined} payload
 */
export function deriveOnlineUiFlags(payload) {
  if (!payload?.uiHints) {
    return {
      active: false,
      opponentTurnShield: false,
      hideTurnScore: false,
      hidePowerPanel: false,
      hidePowerChargeBadge: false,
      hideXrayReveals: false,
      hideDice: false,
      subtlePowerVfx: false,
      diceInteractionDisabled: false,
      showOpponentWaitingBanner: false,
    };
  }

  const h = payload.uiHints;
  return {
    active: true,
    opponentTurnShield: h.opponentTurnPrivate,
    hideTurnScore: h.hideTurnScore,
    hidePowerPanel: h.hidePowerPanel,
    hidePowerChargeBadge: h.hidePowerChargeBadge,
    hideXrayReveals: h.hideXrayReveals,
    hideDice: h.hideDice,
    subtlePowerVfx: h.subtlePowerVfx,
    diceInteractionDisabled: h.opponentWatchingPrivateTurn && !h.isMyTurn,
    showOpponentWaitingBanner: h.opponentWatchingPrivateTurn && !h.isMyTurn,
    isMyTurn: h.isMyTurn,
  };
}

/**
 * Merge authoritative local state with client payload for rendering.
 * When online is live, prefer payload dice/turnScore over local inference.
 */
export function applyClientPayloadToRenderState(localState, payload) {
  if (!payload || !localState) return localState;
  return {
    ...localState,
    dice: payload.dice ?? localState.dice,
    turnScore: payload.turnScore ?? localState.turnScore,
    xrayReveals: payload.xrayReveals ?? localState.xrayReveals,
  };
}
