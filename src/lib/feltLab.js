import { loadProfile, updateProfile } from "@/lib/localProfile";
import { isDedicatedPhotoFelt, isFabricFelt } from "@/lib/feltVisuals";

/** Tunable felt texture fields — merged onto catalog felt in getFelt(). */
export const FELT_TUNING_FIELDS = [
  "textureScale",
  "texturePosX",
  "texturePosY",
  "textureOpacity",
  "textureBrightness",
  "textureContrast",
  "textureSaturate",
  "textureBlur",
  "overlayStrength",
];

export const DEFAULT_FELT_TUNING = {
  textureScale: 1,
  texturePosX: 50,
  texturePosY: 50,
  textureOpacity: 0.92,
  textureBrightness: 1,
  textureContrast: 1.05,
  textureSaturate: 1,
  textureBlur: 0,
  overlayStrength: 1,
};

function readProfileFeltTuning() {
  try {
    return loadProfile()?.felt_tuning ?? {};
  } catch {
    return {};
  }
}

function writeProfileFeltTuningMap(map) {
  updateProfile({ felt_tuning: map });
}

export function feltLabStorageKey(feltId) {
  return `yourneek_felt_lab_${feltId}`;
}

/** Sensible starting values per felt type before user edits. */
export function getCatalogFeltTuningDefaults(felt) {
  if (!felt) return { ...DEFAULT_FELT_TUNING };
  const base = { ...DEFAULT_FELT_TUNING };
  if (felt.textureScale != null) base.textureScale = felt.textureScale;
  if (isDedicatedPhotoFelt(felt.id)) {
    base.textureOpacity = 0.92;
    base.textureContrast = 1.08;
  } else if (isFabricFelt(felt.id)) {
    base.textureScale = 1.05;
    base.textureOpacity = 0.62;
    base.textureSaturate = 1.05;
  } else {
    base.textureOpacity = 0.75;
  }
  return base;
}

function sanitizeTuning(raw, felt) {
  const fb = getCatalogFeltTuningDefaults(felt);
  const clamp = (v, min, max, fallback) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };
  return {
    textureScale: clamp(raw?.textureScale, 0.45, 2.5, fb.textureScale),
    texturePosX: clamp(raw?.texturePosX, 0, 100, fb.texturePosX),
    texturePosY: clamp(raw?.texturePosY, 0, 100, fb.texturePosY),
    textureOpacity: clamp(raw?.textureOpacity, 0.1, 1, fb.textureOpacity),
    textureBrightness: clamp(raw?.textureBrightness, 0.4, 1.8, fb.textureBrightness),
    textureContrast: clamp(raw?.textureContrast, 0.4, 2, fb.textureContrast),
    textureSaturate: clamp(raw?.textureSaturate, 0, 2.5, fb.textureSaturate),
    textureBlur: clamp(raw?.textureBlur, 0, 8, fb.textureBlur),
    overlayStrength: clamp(raw?.overlayStrength, 0, 1.5, fb.overlayStrength),
    savedAt: typeof raw?.savedAt === "number" ? raw.savedAt : Date.now(),
  };
}

export function loadFeltTuning(feltId, catalogFelt) {
  const profileSnap = readProfileFeltTuning()[feltId]?.tuning;
  if (profileSnap) return sanitizeTuning(profileSnap, catalogFelt);
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(feltLabStorageKey(feltId));
      if (raw) return sanitizeTuning(JSON.parse(raw), catalogFelt);
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function persistFeltTuning(feltId, tuning, catalogFelt) {
  const next = sanitizeTuning({ ...tuning, savedAt: Date.now() }, catalogFelt);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(feltLabStorageKey(feltId), JSON.stringify(next));
  }
  const felt_tuning = { ...readProfileFeltTuning() };
  felt_tuning[feltId] = { tuning: next, savedAt: next.savedAt };
  writeProfileFeltTuningMap(felt_tuning);
  return next;
}

export function resetFeltTuning(feltId) {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(feltLabStorageKey(feltId));
  }
  const felt_tuning = { ...readProfileFeltTuning() };
  delete felt_tuning[feltId];
  writeProfileFeltTuningMap(felt_tuning);
}

/** Merge saved tuning onto a catalog felt object for rendering. */
export function applyFeltTuning(catalogFelt) {
  if (!catalogFelt) return catalogFelt;
  const saved = loadFeltTuning(catalogFelt.id, catalogFelt);
  if (!saved) return catalogFelt;
  return { ...catalogFelt, ...saved };
}

export function buildLabPreviewFelt(catalogFelt, draftTuning) {
  if (!catalogFelt) return null;
  return { ...catalogFelt, ...sanitizeTuning(draftTuning, catalogFelt) };
}
