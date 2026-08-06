/**
 * Authoritative online action dispatcher — mirrors client gameLogic calls.
 */
import {
  rollDice,
  evaluateRoll,
  toggleHold,
  confirmAndReroll,
  bankAndPass,
  passAfterFarkle,
  consumeSkinPower,
  clearSharkBiteFx,
} from "../src/lib/gameLogic.js";

/**
 * @param {object} state
 * @param {{ action: string, payload?: object }} msg
 * @returns {{ state: object, error?: string, rollAnimation?: boolean }}
 */
export function applyMatchAction(state, { action, payload = {} }) {
  if (!state) return { state, error: "No match state" };
  if (state.winner && action !== "clear_shark_bite_fx") {
    return { state, error: "Match is over" };
  }

  const playerIndex = payload.playerIndex ?? state.currentIndex;
  if (playerIndex !== state.currentIndex && !["clear_shark_bite_fx", "pass_farkle"].includes(action)) {
    return { state, error: "Not your turn" };
  }

  switch (action) {
    case "roll": {
      if (state.hasRolled || state.farkle || state.sharkBiteFx) {
        return { state, error: "Cannot roll now" };
      }
      const rolled = rollDice(state);
      const evaluated = evaluateRoll(rolled);
      return { state: evaluated, rollAnimation: true };
    }

    case "toggle_hold": {
      const dieId = payload.dieId;
      if (!dieId || !state.hasRolled || state.farkle) {
        return { state, error: "Cannot toggle hold" };
      }
      return { state: toggleHold(state, dieId) };
    }

    case "confirm_reroll": {
      if (!state.hasRolled || state.farkle) {
        return { state, error: "Cannot reroll" };
      }
      const { state: next } = confirmAndReroll(state, payload.options ?? {});
      return { state: next, rollAnimation: true };
    }

    case "bank": {
      if (!state.hasRolled || state.farkle || state.sharkBiteFx) {
        return { state, error: "Cannot bank" };
      }
      return { state: bankAndPass(state) };
    }

    case "pass_farkle": {
      if (!state.farkle) return { state, error: "No farkle to pass" };
      return { state: passAfterFarkle(state) };
    }

    case "consume_power": {
      return { state: consumeSkinPower(state) };
    }

    case "clear_shark_bite_fx": {
      return { state: clearSharkBiteFx(state) };
    }

  case "apply_power": {
    // Powers are applied client-side in local play; online uses a dedicated message
    // with the resolved state from the server after validation in matchRoom.
    return { state, error: "Use server power handler" };
  }

    default:
      return { state, error: `Unknown action: ${action}` };
  }
}
