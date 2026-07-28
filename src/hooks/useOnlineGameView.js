import { useMemo } from "react";
import {
  applyClientPayloadToRenderState,
  buildClientMatchPayload,
  deriveOnlineUiFlags,
} from "@/lib/onlineGameState";
import {
  buildVisibilityMapForMatch,
  normalizeOnlineVisibility,
  readProfileOnlineVisibility,
} from "@/lib/onlineVisibility";

/**
 * Online per-client view — maps authoritative game state to what THIS device shows.
 *
 * When a real server connects, pass `serverPayload` instead of building locally.
 *
 * @param {{
 *   enabled: boolean,
 *   gameState: object|null,
 *   viewerPlayerIndex: number,
 *   visibilitySettings?: import("@/lib/onlineVisibility").OnlineVisibilitySettings,
 *   serverPayload?: import("@/lib/onlineGameState").ClientMatchPayload|null,
 * }} options
 */
export function useOnlineGameView({
  enabled,
  gameState,
  viewerPlayerIndex,
  visibilitySettings,
  serverPayload = null,
}) {
  return useMemo(() => {
    if (!enabled || !gameState || viewerPlayerIndex == null) {
      return {
        active: false,
        payload: null,
        ui: deriveOnlineUiFlags(null),
        renderState: gameState,
      };
    }

    const selfVisibility = normalizeOnlineVisibility(
      visibilitySettings ?? readProfileOnlineVisibility()
    );
    const visibilityMap = buildVisibilityMapForMatch(
      gameState.players?.length ?? 2,
      viewerPlayerIndex,
      selfVisibility
    );

    const payload =
      serverPayload ??
      buildClientMatchPayload({
        matchState: gameState,
        viewerPlayerIndex,
        visibilityByPlayerIndex: visibilityMap,
      });

    const ui = deriveOnlineUiFlags(payload);
    const renderState = applyClientPayloadToRenderState(gameState, payload);

    return { active: true, payload, ui, renderState, visibilityMap };
  }, [enabled, gameState, viewerPlayerIndex, visibilitySettings, serverPayload]);
}
