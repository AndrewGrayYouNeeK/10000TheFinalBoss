import { loadProfile, updateProfile } from "@/lib/localProfile";

/** Session flag: mock online match (local game + per-viewer redaction). */
export const SESSION_ONLINE_MOCK_KEY = "dice10k_online_mock";
/** Which player index this device represents in mock/real online (0-based). */
export const SESSION_ONLINE_VIEWER_INDEX_KEY = "dice10k_online_viewer_index";

/**
 * Per-player preferences for what OPPONENTS see during YOUR turn.
 * Sync to server account when online launches.
 *
 * @typedef {{
 *   hideDice: boolean,
 *   hideTurnScore: boolean,
 *   hidePowerPanel: boolean,
 *   hidePowerChargeBadge: boolean,
 *   hideXrayReveals: boolean,
 *   subtlePowerVfx: boolean,
 * }} OnlineVisibilitySettings
 */

export const DEFAULT_ONLINE_VISIBILITY = {
  hideDice: true,
  hideTurnScore: true,
  hidePowerPanel: true,
  hidePowerChargeBadge: true,
  hideXrayReveals: true,
  subtlePowerVfx: true,
};

export function normalizeOnlineVisibility(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ONLINE_VISIBILITY };
  return {
    hideDice: raw.hideDice !== false,
    hideTurnScore: raw.hideTurnScore !== false,
    hidePowerPanel: raw.hidePowerPanel !== false,
    hidePowerChargeBadge: raw.hidePowerChargeBadge !== false,
    hideXrayReveals: raw.hideXrayReveals !== false,
    subtlePowerVfx: raw.subtlePowerVfx !== false,
  };
}

export function readProfileOnlineVisibility() {
  const profile = loadProfile();
  return normalizeOnlineVisibility(profile.online_visibility);
}

export function saveProfileOnlineVisibility(settings) {
  const normalized = normalizeOnlineVisibility(settings);
  updateProfile({ online_visibility: normalized });
  return normalized;
}

/** Per-player map for mock / server fan-out. Uses profile for self; defaults for opponents until synced. */
export function buildVisibilityMapForMatch(playerCount, selfIndex, selfSettings) {
  const map = {};
  for (let i = 0; i < playerCount; i++) {
    map[i] = i === selfIndex ? normalizeOnlineVisibility(selfSettings) : { ...DEFAULT_ONLINE_VISIBILITY };
  }
  return map;
}

export function readOnlineMockSession() {
  try {
    if (sessionStorage.getItem(SESSION_ONLINE_MOCK_KEY) !== "1") return null;
    const raw = sessionStorage.getItem(SESSION_ONLINE_VIEWER_INDEX_KEY);
    const idx = raw == null ? 0 : Number(raw);
    if (!Number.isFinite(idx) || idx < 0) return { viewerPlayerIndex: 0 };
    return { viewerPlayerIndex: Math.floor(idx) };
  } catch {
    return null;
  }
}

export function writeOnlineMockSession(viewerPlayerIndex = 0) {
  sessionStorage.setItem(SESSION_ONLINE_MOCK_KEY, "1");
  sessionStorage.setItem(SESSION_ONLINE_VIEWER_INDEX_KEY, String(Math.max(0, Math.floor(viewerPlayerIndex))));
}

export function clearOnlineMockSession() {
  sessionStorage.removeItem(SESSION_ONLINE_MOCK_KEY);
  sessionStorage.removeItem(SESSION_ONLINE_VIEWER_INDEX_KEY);
}
