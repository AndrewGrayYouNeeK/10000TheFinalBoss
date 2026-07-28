/**
 * Blue Gel — Aquamarine glass shell alignment (borrowed 3×2 sheet).
 * No dice sprite of its own; these offsets pan the shell so each face reads clearly.
 */
import React from "react";
import { dieRefPx, getAquamarineShellNudges } from "./dieSpriteOffsets";

const STORAGE_KEY = "dice10k_blue_gel_settings_v1";

export const DEFAULT_BLUE_GEL_FACE = { x: 0, y: 0 };

export function makeDefaultBlueGelFaces(seed = DEFAULT_BLUE_GEL_FACE) {
  const base = {
    x: Number.isFinite(Number(seed?.x)) ? Number(seed.x) : DEFAULT_BLUE_GEL_FACE.x,
    y: Number.isFinite(Number(seed?.y)) ? Number(seed.y) : DEFAULT_BLUE_GEL_FACE.y,
  };
  return { 1: { ...base }, 2: { ...base }, 3: { ...base }, 4: { ...base }, 5: { ...base }, 6: { ...base } };
}

/** Global shell pan + zoom on top of Aquamarine catalog crop. */
export const DEFAULT_BLUE_GEL_SETTINGS = {
  /** Multiplier on Aquamarine spriteCrop.zoom (1 = unchanged). */
  shellZoom: 1,
  /** Fraction of die width — pans the borrowed shell horizontally. */
  shellOffsetX: 0,
  /** Fraction of die height — pans the borrowed shell vertically. */
  shellOffsetY: 0,
  shellFaces: makeDefaultBlueGelFaces(),
};

function clampFace(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(6, Math.max(1, n));
}

function normalizeFace(entry) {
  const src = entry && typeof entry === "object" ? entry : {};
  return {
    x: Number.isFinite(Number(src.x)) ? Number(src.x) : DEFAULT_BLUE_GEL_FACE.x,
    y: Number.isFinite(Number(src.y)) ? Number(src.y) : DEFAULT_BLUE_GEL_FACE.y,
  };
}

function normalizeSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const faces = makeDefaultBlueGelFaces();
  const srcFaces = s.shellFaces && typeof s.shellFaces === "object" ? s.shellFaces : {};
  for (let f = 1; f <= 6; f += 1) {
    faces[f] = normalizeFace(srcFaces[f] ?? srcFaces[String(f)]);
  }
  return {
    shellZoom: Number.isFinite(Number(s.shellZoom)) ? Number(s.shellZoom) : DEFAULT_BLUE_GEL_SETTINGS.shellZoom,
    shellOffsetX: Number.isFinite(Number(s.shellOffsetX))
      ? Number(s.shellOffsetX)
      : DEFAULT_BLUE_GEL_SETTINGS.shellOffsetX,
    shellOffsetY: Number.isFinite(Number(s.shellOffsetY))
      ? Number(s.shellOffsetY)
      : DEFAULT_BLUE_GEL_SETTINGS.shellOffsetY,
    shellFaces: faces,
  };
}

export function getBlueGelShellFace(settings, value) {
  const face = clampFace(value);
  const faces = settings?.shellFaces ?? DEFAULT_BLUE_GEL_SETTINGS.shellFaces;
  return normalizeFace(faces[face] ?? faces[String(face)]);
}

/** Pixel nudges added when painting the borrowed Aquamarine shell on Blue Gel dice. */
export function getBlueGelShellNudges(value, size, settings = DEFAULT_BLUE_GEL_SETTINGS) {
  const face = getBlueGelShellFace(settings, value);
  const shellOffsetX = Number(settings.shellOffsetX) || 0;
  const shellOffsetY = Number(settings.shellOffsetY) || 0;
  return {
    xNudge: dieRefPx(face.x, size) + size * shellOffsetX,
    yNudge: dieRefPx(face.y, size) + size * shellOffsetY,
  };
}

/** Aquamarine base nudges + Blue Gel shell pan (used in Die.jsx). */
export function resolveBlueGelShellNudges(value, size, settings = DEFAULT_BLUE_GEL_SETTINGS) {
  const base = getAquamarineShellNudges(value, size);
  const extra = getBlueGelShellNudges(value, size, settings);
  return {
    xNudge: base.xNudge + extra.xNudge,
    yNudge: base.yNudge + extra.yNudge,
  };
}

export function getBlueGelShellCrop(baseCrop, settings = DEFAULT_BLUE_GEL_SETTINGS) {
  const zoom = Number(settings.shellZoom) || 1;
  const crop = baseCrop && typeof baseCrop === "object" ? baseCrop : {};
  return {
    ...crop,
    zoom: (crop.zoom ?? 1) * zoom,
  };
}

export function loadBlueGelSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeSettings(DEFAULT_BLUE_GEL_SETTINGS);
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings(DEFAULT_BLUE_GEL_SETTINGS);
  }
}

export function saveBlueGelSettings(partial) {
  const next = normalizeSettings({ ...loadBlueGelSettings(), ...partial });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  notifyBlueGelSettings(next);
  return next;
}

export function resetBlueGelSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const defaults = normalizeSettings(DEFAULT_BLUE_GEL_SETTINGS);
  notifyBlueGelSettings(defaults);
  return defaults;
}

const listeners = new Set();

function notifyBlueGelSettings(settings) {
  listeners.forEach((fn) => {
    try {
      fn(settings);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeBlueGelSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBlueGelSettings() {
  const [settings, setSettings] = React.useState(() => loadBlueGelSettings());
  React.useEffect(() => subscribeBlueGelSettings(setSettings), []);
  return settings;
}
