/** Session keys for live online matches (WebSocket server). */
export const SESSION_ONLINE_LIVE_KEY = "dice10k_online_live";
export const SESSION_ONLINE_MATCH_ID_KEY = "dice10k_online_match_id";
export const SESSION_ONLINE_PLAYER_ID_KEY = "dice10k_online_player_id";
export const SESSION_ONLINE_VIEWER_INDEX_KEY = "dice10k_online_viewer_index";
export const SESSION_ONLINE_HOST_KEY = "dice10k_online_host";

/**
 * @typedef {{
 *   matchId: string,
 *   playerId: string,
 *   viewerPlayerIndex: number,
 *   isHost: boolean,
 * }} OnlineLiveSession
 */

/** @returns {OnlineLiveSession|null} */
export function readOnlineLiveSession() {
  try {
    if (sessionStorage.getItem(SESSION_ONLINE_LIVE_KEY) !== "1") return null;
    const matchId = sessionStorage.getItem(SESSION_ONLINE_MATCH_ID_KEY);
    const playerId = sessionStorage.getItem(SESSION_ONLINE_PLAYER_ID_KEY);
    const rawIdx = sessionStorage.getItem(SESSION_ONLINE_VIEWER_INDEX_KEY);
    const idx = rawIdx == null ? 0 : Number(rawIdx);
    if (!matchId || !playerId) return null;
    return {
      matchId,
      playerId,
      viewerPlayerIndex: Number.isFinite(idx) && idx >= 0 ? Math.floor(idx) : 0,
      isHost: sessionStorage.getItem(SESSION_ONLINE_HOST_KEY) === "1",
    };
  } catch {
    return null;
  }
}

/** @param {OnlineLiveSession} session */
export function writeOnlineLiveSession(session) {
  sessionStorage.setItem(SESSION_ONLINE_LIVE_KEY, "1");
  sessionStorage.setItem(SESSION_ONLINE_MATCH_ID_KEY, session.matchId);
  sessionStorage.setItem(SESSION_ONLINE_PLAYER_ID_KEY, session.playerId);
  sessionStorage.setItem(
    SESSION_ONLINE_VIEWER_INDEX_KEY,
    String(Math.max(0, Math.floor(session.viewerPlayerIndex)))
  );
  sessionStorage.setItem(SESSION_ONLINE_HOST_KEY, session.isHost ? "1" : "0");
}

export function clearOnlineLiveSession() {
  sessionStorage.removeItem(SESSION_ONLINE_LIVE_KEY);
  sessionStorage.removeItem(SESSION_ONLINE_MATCH_ID_KEY);
  sessionStorage.removeItem(SESSION_ONLINE_PLAYER_ID_KEY);
  sessionStorage.removeItem(SESSION_ONLINE_HOST_KEY);
}
