import "./polyfill.js";
import {
  createInitialState,
  rollDice,
  evaluateRoll,
  toggleHold,
  getHeldInfo,
  confirmAndReroll,
  bankAndPass,
  passAfterFarkle,
  clearSharkBiteFx,
  restoreSharkDice,
  consumeSkinPower,
  ENTRY_THRESHOLD,
} from "../src/lib/gameLogic.js";
import { heldSelectionPoints } from "../src/lib/scoring.js";
import { applySkinPower } from "../src/lib/powerEffects.js";
import { applyPlasmaCut, canUsePlasmaCut } from "../src/lib/plasmaCut.js";
import { buildClientMatchPayload } from "../src/lib/onlineGameState.js";
import { normalizeOnlineVisibility } from "../src/lib/onlineVisibility.js";

const ROLL_ANIM_MS = 900;

/**
 * @param {object} room
 * @returns {Record<number, object>}
 */
export function visibilityMapFromRoom(room) {
  const map = {};
  for (const seat of room.seats || []) {
    if (seat?.playerIndex == null) continue;
    map[seat.playerIndex] = normalizeOnlineVisibility(seat.visibility);
  }
  return map;
}

/**
 * Build per-viewer payloads from canonical match state.
 * @param {object} matchState
 * @param {object} room
 */
export function fanOutPayloads(matchState, room) {
  const visibilityByPlayerIndex = visibilityMapFromRoom(room);
  const out = [];
  for (const seat of room.seats || []) {
    if (seat?.playerIndex == null) continue;
    out.push({
      playerIndex: seat.playerIndex,
      payload: buildClientMatchPayload({
        matchState,
        viewerPlayerIndex: seat.playerIndex,
        visibilityByPlayerIndex,
      }),
    });
  }
  return out;
}

/**
 * Apply a client action to authoritative state.
 * @returns {{ ok: boolean, state?: object, error?: string, rollAnimMs?: number, deferEvaluate?: boolean }}
 */
export function applyMatchAction(matchState, playerIndex, action, payload = {}) {
  if (!matchState) {
    return { ok: false, error: "Match not started" };
  }
  if (matchState.winner) {
    return { ok: false, error: "Match already over" };
  }
  if (matchState.currentIndex !== playerIndex) {
    return { ok: false, error: "Not your turn" };
  }

  switch (action) {
    case "roll": {
      if (matchState.sharkBiteFx || matchState.hasRolled || matchState.farkle) {
        return { ok: false, error: "Cannot roll now" };
      }
      const rolled = rollDice(matchState);
      return { ok: true, state: rolled, rollAnimMs: ROLL_ANIM_MS, deferEvaluate: true };
    }
    case "toggle_hold": {
      const dieId = payload?.dieId;
      if (dieId == null) return { ok: false, error: "Missing dieId" };
      return { ok: true, state: toggleHold(matchState, dieId) };
    }
    case "confirm_reroll": {
      if (matchState.sharkBiteFx || matchState.farkle || !matchState.hasRolled) {
        return { ok: false, error: "Cannot reroll now" };
      }
      const info = getHeldInfo(matchState);
      if (!info.valid || heldSelectionPoints(info, matchState.perfectTenKPending) === 0) {
        return { ok: false, error: "Select scoring dice first" };
      }
      const { state: next } = confirmAndReroll(matchState, {
        ...(payload && typeof payload === "object" ? payload : {}),
      });
      if (next.winner) return { ok: true, state: next };
      return { ok: true, state: next, rollAnimMs: ROLL_ANIM_MS };
    }
    case "bank": {
      if (matchState.sharkBiteFx || matchState.farkle || !matchState.hasRolled) {
        return { ok: false, error: "Cannot bank now" };
      }
      const info = getHeldInfo(matchState);
      const points = heldSelectionPoints(info, matchState.perfectTenKPending);
      const player = matchState.players[playerIndex];
      const potential = (matchState.turnScore || 0) + (info.valid ? points : 0);
      const allowed =
        info.valid &&
        points > 0 &&
        (!!player?.onBoard || potential >= ENTRY_THRESHOLD);
      if (!allowed) return { ok: false, error: "Bank not allowed" };
      return { ok: true, state: bankAndPass(matchState) };
    }
    case "pass_farkle": {
      if (!matchState.farkle) return { ok: false, error: "Not a farkle" };
      return { ok: true, state: passAfterFarkle(matchState) };
    }
    case "use_power": {
      const powerId = payload?.powerId;
      if (!powerId) return { ok: false, error: "Missing powerId" };
      const result = applySkinPower(matchState, powerId);
      if (result.variant === "warning") {
        return { ok: false, error: result.message || "Power failed" };
      }
      const spent = consumeSkinPower(result.state);
      return {
        ok: true,
        state: { ...spent, currentIndex: playerIndex },
        toast: result.message,
      };
    }
    case "plasma_cut": {
      if (!canUsePlasmaCut(matchState)) {
        return { ok: false, error: "Plasma Cut not available" };
      }
      const result = applyPlasmaCut(matchState, payload?.dieId, payload?.newValue);
      if (result.variant === "warning") {
        return { ok: false, error: result.message || "Plasma Cut failed" };
      }
      return { ok: true, state: consumeSkinPower(result.state), toast: result.message };
    }
    case "clear_shark_bite_fx": {
      if (!matchState.sharkBiteFx) return { ok: true, state: matchState };
      return {
        ok: true,
        state: restoreSharkDice(clearSharkBiteFx(matchState)),
      };
    }
    case "set_visibility": {
      // Handled by MatchRoom (seat metadata), not game state.
      return { ok: true, state: matchState, visibilityOnly: true };
    }
    default:
      return { ok: false, error: `Unknown action: ${action}` };
  }
}

export function evaluateDeferredRoll(matchState) {
  if (!matchState?.hasRolled) return matchState;
  return evaluateRoll(matchState);
}

export function createMatchState(seats) {
  const names = seats.map((s) => s.name || `Player ${s.playerIndex + 1}`);
  const playerSkins = seats.map((s) => ({
    skinId: s.skinId || "classic_white",
    ...(s.trueSkinId ? { trueSkinId: s.trueSkinId } : {}),
  }));
  return createInitialState(names, { playerSkins, firstPlayerIndex: 0 });
}

export { ROLL_ANIM_MS };
