import { loadProfile, updateProfile } from "@/lib/localProfile";

/**
 * LOCAL pass-and-play only (one shared device, handoff overlay).
 * Remote online privacy → `onlineVisibility.js` + server per-client payloads.
 */

export const SESSION_PASS_PLAY_PRIVACY_KEY = "dice10k_pass_play_privacy";

/** @typedef {{
 *   enabled: boolean,
 *   hideDice: boolean,
 *   hideTurnScore: boolean,
 *   hidePowerPanel: boolean,
 *   hidePowerChargeBadge: boolean,
 *   hideXrayReveals: boolean,
 *   subtlePowerVfx: boolean,
 * }} PassPlayPrivacySettings */

export const DEFAULT_PASS_PLAY_PRIVACY = {
  enabled: true,
  hideDice: true,
  hideTurnScore: true,
  hidePowerPanel: true,
  hidePowerChargeBadge: true,
  hideXrayReveals: true,
  subtlePowerVfx: true,
};

function normalizeSettings(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PASS_PLAY_PRIVACY };
  return {
    enabled: raw.enabled !== false,
    hideDice: raw.hideDice !== false,
    hideTurnScore: raw.hideTurnScore !== false,
    hidePowerPanel: raw.hidePowerPanel !== false,
    hidePowerChargeBadge: raw.hidePowerChargeBadge !== false,
    hideXrayReveals: raw.hideXrayReveals !== false,
    subtlePowerVfx: raw.subtlePowerVfx !== false,
  };
}

/** Session override (set in Setup / toggled in Game). */
export function readSessionPassPlayPrivacy() {
  try {
    const raw = sessionStorage.getItem(SESSION_PASS_PLAY_PRIVACY_KEY);
    if (!raw) return null;
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSessionPassPlayPrivacy(settings) {
  sessionStorage.setItem(SESSION_PASS_PLAY_PRIVACY_KEY, JSON.stringify(normalizeSettings(settings)));
}

/** Profile default — persists across sessions. */
export function readProfilePassPlayPrivacy() {
  const profile = loadProfile();
  return normalizeSettings(profile.pass_play_privacy);
}

export function saveProfilePassPlayPrivacy(settings) {
  updateProfile({ pass_play_privacy: normalizeSettings(settings) });
}

/** Session wins when present; otherwise profile default. */
export function loadPassPlayPrivacy() {
  return readSessionPassPlayPrivacy() ?? readProfilePassPlayPrivacy();
}

export function savePassPlayPrivacy(settings, { persistProfile = false } = {}) {
  const normalized = normalizeSettings(settings);
  writeSessionPassPlayPrivacy(normalized);
  if (persistProfile) saveProfilePassPlayPrivacy(normalized);
  return normalized;
}
