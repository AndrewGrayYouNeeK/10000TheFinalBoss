/**
 * Marlin Joe story fight avatar loop crop tuning.
 * Saved per device — applies in story fights and Video Assets previews.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "dice10k_fisherman_avatar_loop_v4";
const SETTINGS_REVISION = 3;
const LEGACY_STORAGE_KEYS = [
  "dice10k_fisherman_avatar_loop_v5",
  "dice10k_fisherman_avatar_loop_v3",
  "dice10k_fisherman_avatar_loop_v2",
];

/** Saved X values from old defaults / user tuning that framed the helmet too far right. */
const LEGACY_BAD_X_DEFAULTS = new Set([18, 26, 30, 42]);

export const DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS = {
  /** Cover crop X — lower % shifts the diver left in the box; higher % shifts right. */
  objectPositionXPercent: 25,
  /** Cover crop Y — 50 centers vertically. */
  objectPositionYPercent: 50,
  /** Optional extra zoom via transform — default 1; cover fills the box without it. */
  scale: 1,
  /** Playback trim window for the uploaded loop, stored as percentages of its duration. */
  trimStartPercent: 0,
  trimEndPercent: 100,
  _revision: SETTINGS_REVISION,
};

const listeners = new Set();

function clampObjectPositionX(value) {
  return Math.max(
    15,
    Math.min(85, Number(value) || DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS.objectPositionXPercent)
  );
}

function clampObjectPositionY(value) {
  return Math.max(
    15,
    Math.min(85, Number(value) || DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS.objectPositionYPercent)
  );
}

function clampTrimStart(value) {
  return Math.max(0, Math.min(95, Number(value) || 0));
}

function clampTrimEnd(value) {
  return Math.max(5, Math.min(100, Number(value) || 100));
}

function normalizeSettings(parsed) {
  const base = { ...DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS, ...parsed };
  const trimEndPercent = clampTrimEnd(base.trimEndPercent);
  const trimStartPercent = Math.min(clampTrimStart(base.trimStartPercent), trimEndPercent - 1);
  return {
    ...base,
    objectPositionXPercent: clampObjectPositionX(base.objectPositionXPercent),
    objectPositionYPercent: clampObjectPositionY(base.objectPositionYPercent),
    scale: Math.max(1, Math.min(1.5, Number(base.scale) || 1)),
    trimStartPercent,
    trimEndPercent: Math.max(trimStartPercent + 1, trimEndPercent),
    _revision: SETTINGS_REVISION,
  };
}

function migrateLegacySettings(parsed, { fromLegacyKey = false } = {}) {
  if (!parsed || typeof parsed !== "object") return { ...DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS };

  const next = { ...parsed };
  if (
    next.objectPositionXPercent == null &&
    typeof next.translateXPercent === "number"
  ) {
    // Old translateX pan roughly maps to a cover crop anchor near the diver.
    next.objectPositionXPercent = clampObjectPositionX(50 + next.translateXPercent * -0.67);
  }
  delete next.translateXPercent;

  if (next.objectPositionYPercent == null) {
    next.objectPositionYPercent = DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS.objectPositionYPercent;
  }

  const x = Number(next.objectPositionXPercent);
  const revision = Number(next._revision);
  const isLegacyRevision = !Number.isFinite(revision) || revision < SETTINGS_REVISION;
  const hasKnownBadX = Number.isFinite(x) && LEGACY_BAD_X_DEFAULTS.has(x);
  // Only reset known-bad legacy defaults during one-time migration — never on current-revision loads.
  const mustResetX = hasKnownBadX && (fromLegacyKey || isLegacyRevision);

  if (mustResetX) {
    next.objectPositionXPercent = DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS.objectPositionXPercent;
  }

  if (fromLegacyKey || isLegacyRevision) {
    next._revision = SETTINGS_REVISION;
  }

  return next;
}

function persistSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota errors */
  }
}

export function loadFishermanAvatarLoopSettings() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let fromLegacyKey = false;

    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
          raw = legacyRaw;
          fromLegacyKey = true;
          break;
        }
      }
    }

    if (!raw) return { ...DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS };

    const legacyParsed = JSON.parse(raw);
    const parsed = migrateLegacySettings(legacyParsed, { fromLegacyKey });
    const settings = normalizeSettings(parsed);
    const migrated =
      fromLegacyKey ||
      Number(legacyParsed?.objectPositionXPercent) !== settings.objectPositionXPercent ||
      Number(legacyParsed?._revision) !== SETTINGS_REVISION;

    if (migrated || !localStorage.getItem(STORAGE_KEY)) {
      persistSettings(settings);
    }

    return settings;
  } catch {
    return { ...DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS };
  }
}

export function saveFishermanAvatarLoopSettings(settings) {
  const next = normalizeSettings(settings);
  persistSettings(next);
  for (const cb of listeners) cb(next);
  return next;
}

export function resetFishermanAvatarLoopSettings() {
  return saveFishermanAvatarLoopSettings({ ...DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS });
}

export function subscribeFishermanAvatarLoopSettings(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFishermanAvatarLoopSettings() {
  const [settings, setSettings] = useState(() => loadFishermanAvatarLoopSettings());
  useEffect(() => subscribeFishermanAvatarLoopSettings(setSettings), []);
  return settings;
}

/** CSS for story fight loop + Video Assets inline preview (matches StoryBossGameplayLoop). */
export function getFishermanAvatarLoopVideoStyle(settings = loadFishermanAvatarLoopSettings()) {
  const objectPositionX = clampObjectPositionX(settings.objectPositionXPercent);
  const objectPositionY = clampObjectPositionY(settings.objectPositionYPercent);
  const scale = Math.max(1, Math.min(1.5, Number(settings.scale) || 1));
  return {
    objectFit: "cover",
    objectPosition: `${objectPositionX}% ${objectPositionY}%`,
    maxWidth: "none",
    maxHeight: "none",
    ...(scale > 1
      ? { transform: `scale(${scale})`, transformOrigin: "center center" }
      : {}),
  };
}

/** Convert the saved percentage window into safe playback seconds for a video. */
export function getFishermanAvatarLoopTrimBounds(
  duration,
  settings = loadFishermanAvatarLoopSettings()
) {
  const total = Number(duration);
  if (!Number.isFinite(total) || total <= 0) {
    return { startSeconds: 0, endSeconds: total > 0 ? total : 0 };
  }
  const startPercent = clampTrimStart(settings.trimStartPercent);
  const endPercent = Math.max(
    startPercent + 1,
    clampTrimEnd(settings.trimEndPercent)
  );
  const startSeconds = Math.min(total, (total * startPercent) / 100);
  const endSeconds = Math.min(
    total,
    Math.max(startSeconds + 0.05, (total * endPercent) / 100)
  );
  return { startSeconds, endSeconds };
}
