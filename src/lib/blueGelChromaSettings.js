/**
 * Chroma-key settings for the uploaded Blue Gel / shark power video.
 * Controls how the video background is removed so only the shark shows
 * swimming over the gameplay screen. Saved per device in localStorage.
 */
const STORAGE_KEY = "dice10k_blue_gel_chroma_v5";

export const DEFAULT_CHROMA_SETTINGS = {
  enabled: true,
  // Prefer explicit black for the catalog shark clip (auto still works for green screens).
  autoKey: false,
  color: "#000000",
  // Gentler key — aggressive values punched holes in the shark body ("patches").
  tolerance: 48,
  softness: 26,
  /** Nuke near-black low-chroma pixels (0–255 luma). Keep low so gray shark skin survives. */
  lumaThreshold: 20,
};

/** Old defaults that ate mid-tone shark pixels — bump saved copies to gentler values. */
const LEGACY_AGGRESSIVE_CHROMA = { tolerance: 72, softness: 48, lumaThreshold: 38 };

function near(a, b, eps = 2) {
  return Math.abs(Number(a) - b) <= eps;
}

function migrateAggressiveChroma(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  if (parsed._gentleChromaV6) return parsed;
  const next = { ...parsed, _gentleChromaV6: true };
  const matchesLegacy =
    near(next.tolerance, LEGACY_AGGRESSIVE_CHROMA.tolerance) &&
    near(next.softness, LEGACY_AGGRESSIVE_CHROMA.softness) &&
    near(next.lumaThreshold, LEGACY_AGGRESSIVE_CHROMA.lumaThreshold);
  if (matchesLegacy) {
    next.tolerance = DEFAULT_CHROMA_SETTINGS.tolerance;
    next.softness = DEFAULT_CHROMA_SETTINGS.softness;
    next.lumaThreshold = DEFAULT_CHROMA_SETTINGS.lumaThreshold;
  }
  return next;
}

const listeners = new Set();

export function hexToRgb(hex) {
  const clean = String(hex || "").replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function loadBlueGelChromaSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CHROMA_SETTINGS };
    const parsed = JSON.parse(raw);
    const migrated = migrateAggressiveChroma(parsed);
    const next = { ...DEFAULT_CHROMA_SETTINGS, ...migrated };
    if (!parsed._gentleChromaV6 && migrated._gentleChromaV6) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    return next;
  } catch {
    return { ...DEFAULT_CHROMA_SETTINGS };
  }
}

export function saveBlueGelChromaSettings(settings) {
  const next = { ...DEFAULT_CHROMA_SETTINGS, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  for (const cb of listeners) cb(next);
  return next;
}

export function resetBlueGelChromaSettings() {
  return saveBlueGelChromaSettings({ ...DEFAULT_CHROMA_SETTINGS });
}

export function subscribeBlueGelChromaSettings(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
