/**
 * Captain Chomps (Shark Tank) story fight avatar loop crop tuning.
 * Saved per device — applies in story fights and Video Assets previews.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "dice10k_shark_tank_avatar_loop_v1";
const SETTINGS_REVISION = 1;

export const DEFAULT_SHARK_TANK_AVATAR_LOOP_SETTINGS = {
  /** Cover crop X — lower % shifts left; higher % shifts right. */
  objectPositionXPercent: 50,
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
    Math.min(85, Number(value) || DEFAULT_SHARK_TANK_AVATAR_LOOP_SETTINGS.objectPositionXPercent)
  );
}

function clampObjectPositionY(value) {
  return Math.max(
    15,
    Math.min(85, Number(value) || DEFAULT_SHARK_TANK_AVATAR_LOOP_SETTINGS.objectPositionYPercent)
  );
}

function clampTrimStart(value) {
  return Math.max(0, Math.min(95, Number(value) || 0));
}

function clampTrimEnd(value) {
  return Math.max(5, Math.min(100, Number(value) || 100));
}

function normalizeSettings(raw) {
  const start = clampTrimStart(raw?.trimStartPercent);
  const end = Math.max(start + 1, clampTrimEnd(raw?.trimEndPercent));
  return {
    objectPositionXPercent: clampObjectPositionX(raw?.objectPositionXPercent),
    objectPositionYPercent: clampObjectPositionY(raw?.objectPositionYPercent),
    scale: Math.max(1, Math.min(1.5, Number(raw?.scale) || 1)),
    trimStartPercent: start,
    trimEndPercent: end,
    _revision: SETTINGS_REVISION,
  };
}

function persistSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota errors */
  }
}

export function loadSharkTankAvatarLoopSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHARK_TANK_AVATAR_LOOP_SETTINGS };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SHARK_TANK_AVATAR_LOOP_SETTINGS };
  }
}

export function saveSharkTankAvatarLoopSettings(settings) {
  const next = normalizeSettings(settings);
  persistSettings(next);
  for (const cb of listeners) cb(next);
  return next;
}

export function resetSharkTankAvatarLoopSettings() {
  return saveSharkTankAvatarLoopSettings({ ...DEFAULT_SHARK_TANK_AVATAR_LOOP_SETTINGS });
}

export function subscribeSharkTankAvatarLoopSettings(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSharkTankAvatarLoopSettings() {
  const [settings, setSettings] = useState(() => loadSharkTankAvatarLoopSettings());
  useEffect(() => subscribeSharkTankAvatarLoopSettings(setSettings), []);
  return settings;
}

/** CSS for story fight loop + Video Assets inline preview. */
export function getSharkTankAvatarLoopVideoStyle(settings = loadSharkTankAvatarLoopSettings()) {
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
export function getSharkTankAvatarLoopTrimBounds(
  duration,
  settings = loadSharkTankAvatarLoopSettings()
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
