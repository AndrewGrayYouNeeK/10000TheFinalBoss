/**
 * Chroma-key settings for the uploaded Blue Gel / shark power video.
 * Controls how the video background is removed so only the shark shows
 * swimming over the gameplay screen. Saved per device in localStorage.
 */
const STORAGE_KEY = "dice10k_blue_gel_chroma";

export const DEFAULT_CHROMA_SETTINGS = {
  enabled: true,
  // "auto" samples the background color from the video's frame corners.
  // "custom" uses `color` below.
  autoKey: true,
  color: "#000000",
  tolerance: 70, // fully transparent under this color distance
  softness: 55, // feather width above the tolerance
};

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
    return { ...DEFAULT_CHROMA_SETTINGS, ...JSON.parse(raw) };
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
