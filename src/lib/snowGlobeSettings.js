/**
 * Snow Globe — Aquamarine glass shell alignment (borrowed 3×2 sheet).
 * No dice sprite of its own; these offsets pan the shell so each face reads clearly.
 */
import React from "react";
import { dieRefPx, getAquamarineShellNudges } from "./dieSpriteOffsets";

const STORAGE_KEY = "dice10k_snow_globe_settings_v1";

export const DEFAULT_SNOW_GLOBE_FACE = { x: 0, y: 0 };

export function makeDefaultSnowGlobeFaces(seed = DEFAULT_SNOW_GLOBE_FACE) {
  const base = {
    x: Number.isFinite(Number(seed?.x)) ? Number(seed.x) : DEFAULT_SNOW_GLOBE_FACE.x,
    y: Number.isFinite(Number(seed?.y)) ? Number(seed.y) : DEFAULT_SNOW_GLOBE_FACE.y,
  };
  return { 1: { ...base }, 2: { ...base }, 3: { ...base }, 4: { ...base }, 5: { ...base }, 6: { ...base } };
}

/** Global shell pan + zoom on top of Aquamarine catalog crop. */
export const DEFAULT_SNOW_GLOBE_SETTINGS = {
  /** Multiplier on Aquamarine spriteCrop.zoom (1 = unchanged). */
  shellZoom: 1.04,
  /** Fraction of die width — pans the borrowed shell horizontally. */
  shellOffsetX: 0.04,
  /** Fraction of die height — pans the borrowed shell vertically. */
  shellOffsetY: -0.05,
  shellFaces: makeDefaultSnowGlobeFaces(),
};

function clampFace(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(6, Math.max(1, n));
}

function normalizeFace(entry) {
  const src = entry && typeof entry === "object" ? entry : {};
  return {
    x: Number.isFinite(Number(src.x)) ? Number(src.x) : DEFAULT_SNOW_GLOBE_FACE.x,
    y: Number.isFinite(Number(src.y)) ? Number(src.y) : DEFAULT_SNOW_GLOBE_FACE.y,
  };
}

function normalizeSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const faces = makeDefaultSnowGlobeFaces();
  const srcFaces = s.shellFaces && typeof s.shellFaces === "object" ? s.shellFaces : {};
  for (let f = 1; f <= 6; f += 1) {
    faces[f] = normalizeFace(srcFaces[f] ?? srcFaces[String(f)]);
  }
  return {
    shellZoom: Number.isFinite(Number(s.shellZoom)) ? Number(s.shellZoom) : DEFAULT_SNOW_GLOBE_SETTINGS.shellZoom,
    shellOffsetX: Number.isFinite(Number(s.shellOffsetX))
      ? Number(s.shellOffsetX)
      : DEFAULT_SNOW_GLOBE_SETTINGS.shellOffsetX,
    shellOffsetY: Number.isFinite(Number(s.shellOffsetY))
      ? Number(s.shellOffsetY)
      : DEFAULT_SNOW_GLOBE_SETTINGS.shellOffsetY,
    shellFaces: faces,
  };
}

export function getSnowGlobeShellFace(settings, value) {
  const face = clampFace(value);
  const faces = settings?.shellFaces ?? DEFAULT_SNOW_GLOBE_SETTINGS.shellFaces;
  return normalizeFace(faces[face] ?? faces[String(face)]);
}

/** Pixel nudges added when painting the borrowed Aquamarine shell on Snow Globe dice. */
export function getSnowGlobeShellNudges(value, size, settings = DEFAULT_SNOW_GLOBE_SETTINGS) {
  const face = getSnowGlobeShellFace(settings, value);
  const shellOffsetX = Number(settings.shellOffsetX) || 0;
  const shellOffsetY = Number(settings.shellOffsetY) || 0;
  return {
    xNudge: dieRefPx(face.x, size) + size * shellOffsetX,
    yNudge: dieRefPx(face.y, size) + size * shellOffsetY,
  };
}

/** Aquamarine base nudges + Snow Globe shell pan (used in Die.jsx). */
export function resolveSnowGlobeShellNudges(value, size, settings = DEFAULT_SNOW_GLOBE_SETTINGS) {
  const base = getAquamarineShellNudges(value, size);
  const extra = getSnowGlobeShellNudges(value, size, settings);
  return {
    xNudge: base.xNudge + extra.xNudge,
    yNudge: base.yNudge + extra.yNudge,
  };
}

export function getSnowGlobeShellCrop(baseCrop, settings = DEFAULT_SNOW_GLOBE_SETTINGS) {
  const zoom = Number(settings.shellZoom) || 1;
  const crop = baseCrop && typeof baseCrop === "object" ? baseCrop : {};
  return {
    ...crop,
    zoom: (crop.zoom ?? 1) * zoom,
  };
}

export function loadSnowGlobeSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeSettings(DEFAULT_SNOW_GLOBE_SETTINGS);
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings(DEFAULT_SNOW_GLOBE_SETTINGS);
  }
}

export function saveSnowGlobeSettings(partial) {
  const next = normalizeSettings({ ...loadSnowGlobeSettings(), ...partial });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  notifySnowGlobeSettings(next);
  return next;
}

export function resetSnowGlobeSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const defaults = normalizeSettings(DEFAULT_SNOW_GLOBE_SETTINGS);
  notifySnowGlobeSettings(defaults);
  return defaults;
}

const listeners = new Set();

function notifySnowGlobeSettings(settings) {
  listeners.forEach((fn) => {
    try {
      fn(settings);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeSnowGlobeSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSnowGlobeSettings() {
  const [settings, setSettings] = React.useState(() => loadSnowGlobeSettings());
  React.useEffect(() => subscribeSnowGlobeSettings(setSettings), []);
  return settings;
}
