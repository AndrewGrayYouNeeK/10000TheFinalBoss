/**
 * Frosty / Frozen Ice power overlay tuning.
 * Per-face zoom/offset + global opacity/blend/tint — saved per device in localStorage.
 */
/** v2 — transparent ice sheet (real alpha); prefer blend "normal" over screen keying. */
const STORAGE_KEY = "dice10k_ice_power_settings_v2";
const LEGACY_STORAGE_KEYS = ["dice10k_ice_power_settings_v1"];
/** One-shot: ensure all 6 face slots are written into v2 storage (not just face 1). */
/** Bump when default zoom/offsets change so lab/game pick up new face defaults. */
const FACES_SEEDED_KEY = "dice10k_ice_power_faces_seeded_v3";
/** One-shot: apply icy-blue tint defaults for installs that never had tint keys. */
const TINT_SEEDED_KEY = "dice10k_ice_power_tint_seeded_v2";
/**
 * One-shot: punch center transparency so die pips read through mid-face ice.
 * Older installs had uniform opacity (~0.92) with no radial fade.
 */
const CENTER_CLEAR_SEEDED_KEY = "dice10k_ice_power_center_clear_seeded_v4";
/**
 * One-shot: re-enable freeze overlay after face-split / tint migration.
 * Old v1 lab had shape/frame/sheen toggles — users often left `frozenEnabled` off
 * while tuning other layers; v2 only has the frozen layer, so that left the lab
 * stuck on "Overlay disabled".
 */
const OVERLAY_ON_SEEDED_KEY = "dice10k_ice_power_overlay_on_seeded_v1";

export const ICE_BLEND_MODES = [
  "normal",
  "screen",
  "soft-light",
  "overlay",
  "lighten",
  "multiply",
  "darken",
];

/** How the cyan wash composites onto the ice texture (inside an isolated group). */
export const ICE_TINT_BLEND_MODES = ["color", "soft-light", "overlay", "screen", "hue"];

/** Reference icy blue — matches the cyan ice-cube sheet look (#9cc3ff midtones). */
export const DEFAULT_FROZEN_TINT_COLOR = "#9cc3ff";

/** Per-face frozen cube crop (zoom + % offset of die size). */
export const DEFAULT_FROZEN_FACE = {
  // Clean sheet: body-centered + scale-to-cover; light overscan for melt edges.
  zoom: 1.02,
  offsetX: 0,
  offsetY: 0,
};

export function makeDefaultFrozenFaces(seed = DEFAULT_FROZEN_FACE) {
  const base = {
    zoom: Number.isFinite(Number(seed?.zoom)) ? Number(seed.zoom) : DEFAULT_FROZEN_FACE.zoom,
    offsetX: Number.isFinite(Number(seed?.offsetX))
      ? Number(seed.offsetX)
      : DEFAULT_FROZEN_FACE.offsetX,
    offsetY: Number.isFinite(Number(seed?.offsetY))
      ? Number(seed.offsetY)
      : DEFAULT_FROZEN_FACE.offsetY,
  };
  return {
    1: { ...base },
    2: { ...base },
    3: { ...base },
    4: { ...base },
    5: { ...base },
    6: { ...base },
  };
}

export const DEFAULT_ICE_POWER_SETTINGS = {
  // Frozen ice cubes (ice_power_frozen.png) — real alpha; skins show through clear ice
  frozenEnabled: true,
  /** Overall ice layer opacity (edges stay stronger via center-clear mask). */
  frozenOpacity: 0.74,
  frozenBlend: "normal",
  /**
   * How much to fade ice in the die center (0 = uniform, 1 = fully clear mid).
   * Keeps blue edge frost while letting pips show through.
   */
  frozenCenterClear: 0.9,
  /** Width of the clear mid zone (0–1). ~0.62 covers the pip area. */
  frozenCenterRadius: 0.62,
  /**
   * Cyan wash over the ice sprite (not the die). Strength 0 = asset color only.
   * Defaults push gray/white frost toward the icy-blue reference sheet.
   */
  frozenTintColor: DEFAULT_FROZEN_TINT_COLOR,
  frozenTintStrength: 0.58,
  frozenTintBlend: "color",
  /** Extra saturation on the ice sprite before the tint wash (1 = unchanged). */
  frozenTintSaturate: 1.45,
  /** @deprecated Migrated into frozenFaces; kept for old localStorage reads. */
  frozenZoom: DEFAULT_FROZEN_FACE.zoom,
  /** @deprecated Migrated into frozenFaces. */
  frozenOffsetX: DEFAULT_FROZEN_FACE.offsetX,
  /** @deprecated Migrated into frozenFaces. */
  frozenOffsetY: DEFAULT_FROZEN_FACE.offsetY,
  frozenFaces: makeDefaultFrozenFaces(),

  // Lab preview only (ignored in-game)
  labShowAll: false,
  labTrayMode: true, // 6-die tray like story frozen reveal
  labFace: 1, // 1–6 (single-die mode + face editor target)
  labDieSize: 88,
  labSkinId: "classic_white", // try freeze overlay on any shop skin
  /** Per-skin freeze overlay tuning — keys are shop skin ids (e.g. ice, classic_white). */
  skinOverrides: {},
};

/** Overlay fields stored globally (defaults) or per skin in skinOverrides. */
const OVERLAY_SETTING_KEYS = [
  "frozenEnabled",
  "frozenOpacity",
  "frozenBlend",
  "frozenCenterClear",
  "frozenCenterRadius",
  "frozenTintColor",
  "frozenTintStrength",
  "frozenTintBlend",
  "frozenTintSaturate",
  "frozenZoom",
  "frozenOffsetX",
  "frozenOffsetY",
  "frozenFaces",
];

function pickOverlayFields(src) {
  if (!src || typeof src !== "object") return {};
  const out = {};
  for (const key of OVERLAY_SETTING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key];
  }
  return out;
}

function mergeFrozenFaces(baseFaces, patchFaces) {
  const base = makeDefaultFrozenFaces();
  for (let face = 1; face <= 6; face += 1) {
    base[face] = normalizeFaceEntry(baseFaces?.[face], base[face]);
  }
  if (!patchFaces || typeof patchFaces !== "object") return base;
  for (let face = 1; face <= 6; face += 1) {
    if (patchFaces[face] != null || patchFaces[String(face)] != null) {
      base[face] = normalizeFaceEntry(patchFaces[face] ?? patchFaces[String(face)], base[face]);
    }
  }
  return base;
}

function normalizeSkinOverride(raw) {
  const incoming = raw && typeof raw === "object" ? raw : {};
  const faces = incoming.frozenFaces
    ? mergeFrozenFaces(makeDefaultFrozenFaces(), incoming.frozenFaces)
    : undefined;
  const next = normalizeIcePowerSettings({
    ...DEFAULT_ICE_POWER_SETTINGS,
    ...incoming,
    ...(faces ? { frozenFaces: faces } : {}),
  });
  return pickOverlayFields(next);
}

function normalizeSkinOverridesMap(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [skinId, entry] of Object.entries(raw)) {
    if (!skinId || typeof skinId !== "string") continue;
    out[skinId] = normalizeSkinOverride(entry);
  }
  return out;
}

/** Merge global defaults with a skin-specific override for rendering / lab editing. */
export function resolveIcePowerSettingsForSkin(raw, skinId) {
  const base = normalizeIcePowerSettings(raw);
  const id = typeof skinId === "string" && skinId ? skinId : base.labSkinId || "classic_white";
  const override = base.skinOverrides?.[id];
  if (!override || typeof override !== "object" || Object.keys(override).length === 0) {
    return base;
  }
  const mergedFaces = override.frozenFaces
    ? mergeFrozenFaces(base.frozenFaces, override.frozenFaces)
    : base.frozenFaces;
  return normalizeIcePowerSettings({
    ...base,
    ...override,
    frozenFaces: mergedFaces,
    skinOverrides: base.skinOverrides,
  });
}

export function hasSkinIcePowerOverride(raw, skinId) {
  const id = typeof skinId === "string" ? skinId : "";
  if (!id) return false;
  const entry = normalizeIcePowerSettings(raw).skinOverrides?.[id];
  return !!entry && typeof entry === "object" && Object.keys(entry).length > 0;
}

/** Always read storage before writes so React state cannot clobber newer slider saves. */
function freshIcePowerSettings(fallback) {
  try {
    return normalizeIcePowerSettings(loadIcePowerSettings());
  } catch {
    return normalizeIcePowerSettings(fallback);
  }
}

/** Persist overlay tuning for one skin only (does not change other skins). */
export function saveSkinIcePowerSettings(_allSettings, skinId, patch) {
  const base = freshIcePowerSettings(_allSettings);
  const id = typeof skinId === "string" ? skinId : base.labSkinId || "classic_white";
  const prev = base.skinOverrides?.[id] || {};
  const merged = normalizeSkinOverride({
    ...prev,
    ...patch,
    ...(patch?.frozenFaces
      ? { frozenFaces: mergeFrozenFaces(prev.frozenFaces ?? base.frozenFaces, patch.frozenFaces) }
      : {}),
  });
  return saveIcePowerSettings({
    ...base,
    skinOverrides: {
      ...base.skinOverrides,
      [id]: merged,
    },
  });
}

export function clearSkinIcePowerOverride(_allSettings, skinId) {
  const base = freshIcePowerSettings(_allSettings);
  const id = typeof skinId === "string" ? skinId : "";
  if (!id || !base.skinOverrides?.[id]) return base;
  const nextOverrides = { ...base.skinOverrides };
  delete nextOverrides[id];
  return saveIcePowerSettings({ ...base, skinOverrides: nextOverrides });
}

export function patchFrozenFaceForSkin(_allSettings, skinId, faceValue, patch) {
  const base = freshIcePowerSettings(_allSettings);
  const resolved = resolveIcePowerSettingsForSkin(base, skinId);
  const patched = patchFrozenFace(resolved, faceValue, patch);
  return saveSkinIcePowerSettings(base, skinId, pickOverlayFields(patched));
}

/**
 * Persist the full overlay snapshot for one skin (all six faces + opacity/tint/blend).
 * Used by Ice Power Lab "Save all faces (this skin)".
 */
export function saveAllFrozenFacesForSkin(_allSettings, skinId) {
  const base = freshIcePowerSettings(_allSettings);
  const id = typeof skinId === "string" ? skinId : base.labSkinId || "classic_white";
  const resolved = resolveIcePowerSettingsForSkin(base, id);
  const frozenFaces = makeDefaultFrozenFaces();
  for (let face = 1; face <= 6; face += 1) {
    frozenFaces[face] = normalizeFaceEntry(resolved.frozenFaces?.[face], DEFAULT_FROZEN_FACE);
  }
  const snapshot = {
    ...pickOverlayFields(resolved),
    frozenFaces,
    savedAt: Date.now(),
  };
  return saveSkinIcePowerSettings(base, id, snapshot);
}

export function applyFrozenFaceToAllForSkin(_allSettings, skinId, faceValue) {
  const base = freshIcePowerSettings(_allSettings);
  const resolved = resolveIcePowerSettingsForSkin(base, skinId);
  const src = getFrozenFaceSettings(resolved, faceValue);
  return saveSkinIcePowerSettings(base, skinId, {
    frozenFaces: makeDefaultFrozenFaces(src),
  });
}

export function resetFrozenFaceForSkin(_allSettings, skinId, faceValue) {
  return patchFrozenFaceForSkin(_allSettings, skinId, faceValue, { ...DEFAULT_FROZEN_FACE });
}

function clampFace(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(6, Math.max(1, n));
}

function normalizeFaceEntry(entry, fallback = DEFAULT_FROZEN_FACE) {
  const src = entry && typeof entry === "object" ? entry : {};
  return {
    zoom: Number.isFinite(Number(src.zoom)) ? Number(src.zoom) : fallback.zoom,
    offsetX: Number.isFinite(Number(src.offsetX)) ? Number(src.offsetX) : fallback.offsetX,
    offsetY: Number.isFinite(Number(src.offsetY)) ? Number(src.offsetY) : fallback.offsetY,
  };
}

function clamp01(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

function normalizeTintColor(value, fallback = DEFAULT_FROZEN_TINT_COLOR) {
  if (typeof value !== "string") return fallback;
  const hex = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function normalizeTintBlend(value, fallback = DEFAULT_ICE_POWER_SETTINGS.frozenTintBlend) {
  if (typeof value !== "string") return fallback;
  return ICE_TINT_BLEND_MODES.includes(value) ? value : fallback;
}

/**
 * Normalize settings + migrate legacy global zoom/offset into per-face defaults.
 */
export function normalizeIcePowerSettings(raw) {
  const incoming = raw && typeof raw === "object" ? raw : {};
  const merged = { ...DEFAULT_ICE_POWER_SETTINGS, ...incoming };

  const legacySeed = {
    zoom: Number.isFinite(Number(incoming.frozenZoom))
      ? Number(incoming.frozenZoom)
      : DEFAULT_FROZEN_FACE.zoom,
    offsetX: Number.isFinite(Number(incoming.frozenOffsetX))
      ? Number(incoming.frozenOffsetX)
      : DEFAULT_FROZEN_FACE.offsetX,
    offsetY: Number.isFinite(Number(incoming.frozenOffsetY))
      ? Number(incoming.frozenOffsetY)
      : DEFAULT_FROZEN_FACE.offsetY,
  };

  const hasPerFace =
    incoming.frozenFaces &&
    typeof incoming.frozenFaces === "object" &&
    Object.keys(incoming.frozenFaces).length > 0;

  const faces = makeDefaultFrozenFaces(hasPerFace ? DEFAULT_FROZEN_FACE : legacySeed);
  if (hasPerFace) {
    for (let face = 1; face <= 6; face += 1) {
      faces[face] = normalizeFaceEntry(incoming.frozenFaces[face], faces[face]);
    }
  }

  const tintSaturateRaw = Number(merged.frozenTintSaturate);
  const tintSaturate = Number.isFinite(tintSaturateRaw)
    ? Math.min(3, Math.max(0.5, tintSaturateRaw))
    : DEFAULT_ICE_POWER_SETTINGS.frozenTintSaturate;

  return {
    ...merged,
    // Explicit boolean — missing / null means ON (lab + story preview default).
    frozenEnabled: merged.frozenEnabled !== false,
    frozenFaces: faces,
    skinOverrides: normalizeSkinOverridesMap(incoming.skinOverrides ?? merged.skinOverrides),
    // Mirror face 1 into legacy keys so old readers stay sane
    frozenZoom: faces[1].zoom,
    frozenOffsetX: faces[1].offsetX,
    frozenOffsetY: faces[1].offsetY,
    frozenOpacity: clamp01(merged.frozenOpacity, DEFAULT_ICE_POWER_SETTINGS.frozenOpacity),
    frozenCenterClear: clamp01(
      merged.frozenCenterClear,
      DEFAULT_ICE_POWER_SETTINGS.frozenCenterClear
    ),
    frozenCenterRadius: clamp01(
      merged.frozenCenterRadius,
      DEFAULT_ICE_POWER_SETTINGS.frozenCenterRadius
    ),
    frozenTintColor: normalizeTintColor(
      merged.frozenTintColor,
      DEFAULT_ICE_POWER_SETTINGS.frozenTintColor
    ),
    frozenTintStrength: clamp01(
      merged.frozenTintStrength,
      DEFAULT_ICE_POWER_SETTINGS.frozenTintStrength
    ),
    frozenTintBlend: normalizeTintBlend(merged.frozenTintBlend),
    frozenTintSaturate: tintSaturate,
    labFace: clampFace(merged.labFace),
  };
}

/** Per-face zoom / offset for a die value (1–6). */
export function getFrozenFaceSettings(settings, faceValue) {
  const s = settings || DEFAULT_ICE_POWER_SETTINGS;
  const face = clampFace(faceValue);
  const faces = s.frozenFaces || DEFAULT_ICE_POWER_SETTINGS.frozenFaces;
  return normalizeFaceEntry(faces?.[face], DEFAULT_FROZEN_FACE);
}

/** Patch one face's zoom/offset; returns full settings object ready to save. */
export function patchFrozenFace(settings, faceValue, patch) {
  const base = normalizeIcePowerSettings(settings);
  const face = clampFace(faceValue);
  const current = getFrozenFaceSettings(base, face);
  const nextFace = normalizeFaceEntry({ ...current, ...patch }, current);
  const frozenFaces = {
    ...base.frozenFaces,
    [face]: nextFace,
  };
  return {
    ...base,
    frozenFaces,
    frozenZoom: frozenFaces[1].zoom,
    frozenOffsetX: frozenFaces[1].offsetX,
    frozenOffsetY: frozenFaces[1].offsetY,
  };
}

/** Reset one face to default zoom/offset. */
export function resetFrozenFace(settings, faceValue) {
  return patchFrozenFace(settings, faceValue, { ...DEFAULT_FROZEN_FACE });
}

/**
 * Persist every face's zoom/offset (and globals) so tuning for faces 2–6
 * isn't lost when only face 1 was edited. Returns the saved settings.
 */
export function saveAllFrozenFaces(settings) {
  const base = normalizeIcePowerSettings(settings);
  const frozenFaces = makeDefaultFrozenFaces();
  for (let face = 1; face <= 6; face += 1) {
    frozenFaces[face] = normalizeFaceEntry(base.frozenFaces?.[face], DEFAULT_FROZEN_FACE);
  }
  return saveIcePowerSettings({
    ...base,
    frozenFaces,
  });
}

/** Copy one face's zoom/offset onto all six faces, then save. */
export function applyFrozenFaceToAll(settings, faceValue) {
  const base = normalizeIcePowerSettings(settings);
  const src = getFrozenFaceSettings(base, faceValue);
  return saveIcePowerSettings({
    ...base,
    frozenFaces: makeDefaultFrozenFaces(src),
  });
}

const listeners = new Set();

function seedAllFacesOnce(settings) {
  try {
    if (localStorage.getItem(FACES_SEEDED_KEY) === "1") return settings;
    const next = normalizeIcePowerSettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(FACES_SEEDED_KEY, "1");
    return next;
  } catch {
    return settings;
  }
}

/**
 * Ensure older localStorage picks up center-clear + softer mid opacity once.
 * Skips if the user already saved center-clear keys; only bumps legacy uniform opacity.
 */
function seedCenterClearOnce(settings) {
  try {
    if (localStorage.getItem(CENTER_CLEAR_SEEDED_KEY) === "1") return settings;
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const hadManualClear =
      parsed &&
      typeof parsed === "object" &&
      (Object.prototype.hasOwnProperty.call(parsed, "frozenCenterClear") ||
        Object.prototype.hasOwnProperty.call(parsed, "frozenCenterRadius"));
    const legacyUniformOpacity =
      parsed &&
      typeof parsed === "object" &&
      [0.92, 0.88, 0.82, 0.78].includes(Number(parsed.frozenOpacity));
    const legacyWeakClear =
      parsed &&
      typeof parsed === "object" &&
      [0.62, 0.78].includes(Number(parsed.frozenCenterClear));
    const next = normalizeIcePowerSettings(
      hadManualClear && !legacyWeakClear
        ? settings
        : {
            ...settings,
            frozenCenterClear: DEFAULT_ICE_POWER_SETTINGS.frozenCenterClear,
            frozenCenterRadius: DEFAULT_ICE_POWER_SETTINGS.frozenCenterRadius,
            ...(legacyUniformOpacity || legacyWeakClear
              ? { frozenOpacity: DEFAULT_ICE_POWER_SETTINGS.frozenOpacity }
              : {}),
            // Soften prior auto-tint so mid-face stays readable with blue edges.
            ...([0.78, 0.72].includes(Number(settings.frozenTintStrength))
              ? {
                  frozenTintStrength: DEFAULT_ICE_POWER_SETTINGS.frozenTintStrength,
                  frozenTintSaturate: DEFAULT_ICE_POWER_SETTINGS.frozenTintSaturate,
                }
              : {}),
          }
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(CENTER_CLEAR_SEEDED_KEY, "1");
    return next;
  } catch {
    return settings;
  }
}

/** Ensure older localStorage picks up icy-blue tint defaults once. */
function seedTintDefaultsOnce(settings) {
  try {
    if (localStorage.getItem(TINT_SEEDED_KEY) === "1") return settings;
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const hadManualTint =
      parsed &&
      typeof parsed === "object" &&
      Object.prototype.hasOwnProperty.call(parsed, "frozenTintStrength") &&
      // Ignore prior auto-seed (v1) weaker defaults so v2 cyan push still lands.
      !(
        Number(parsed.frozenTintStrength) === 0.62 &&
        Number(parsed.frozenTintSaturate) === 1.35
      );
    const next = normalizeIcePowerSettings(
      hadManualTint
        ? settings
        : {
            ...settings,
            frozenTintColor: DEFAULT_ICE_POWER_SETTINGS.frozenTintColor,
            frozenTintStrength: DEFAULT_ICE_POWER_SETTINGS.frozenTintStrength,
            frozenTintBlend: DEFAULT_ICE_POWER_SETTINGS.frozenTintBlend,
            frozenTintSaturate: DEFAULT_ICE_POWER_SETTINGS.frozenTintSaturate,
          }
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(TINT_SEEDED_KEY, "1");
    return next;
  } catch {
    return settings;
  }
}

/** Turn freeze overlay back ON once after face-split / tint era (see OVERLAY_ON_SEEDED_KEY). */
function seedOverlayEnabledOnce(settings) {
  try {
    if (localStorage.getItem(OVERLAY_ON_SEEDED_KEY) === "1") return settings;
    const next = normalizeIcePowerSettings({
      ...settings,
      frozenEnabled: true,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(OVERLAY_ON_SEEDED_KEY, "1");
    return next;
  } catch {
    return settings;
  }
}

export function loadIcePowerSettings() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let fromLegacy = false;
    if (!raw) {
      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = localStorage.getItem(key);
        if (legacy) {
          raw = legacy;
          fromLegacy = true;
          break;
        }
      }
    }
    if (!raw) {
      const fresh = normalizeIcePowerSettings(null);
      return seedOverlayEnabledOnce(
        seedCenterClearOnce(seedTintDefaultsOnce(seedAllFacesOnce(fresh)))
      );
    }
    const parsed = JSON.parse(raw);
    // Transparent sheet — old "screen" keying washes out ice; switch to normal.
    if (fromLegacy && parsed?.frozenBlend === "screen") {
      parsed.frozenBlend = "normal";
    }
    // v1 lab could leave frozen off while shape/frame were on — v2 only has frozen.
    if (fromLegacy) {
      parsed.frozenEnabled = true;
    }
    const next = normalizeIcePowerSettings(parsed);
    if (fromLegacy) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    return seedOverlayEnabledOnce(
      seedCenterClearOnce(seedTintDefaultsOnce(seedAllFacesOnce(next)))
    );
  } catch {
    return normalizeIcePowerSettings(null);
  }
}

export function saveIcePowerSettings(settings) {
  const next = normalizeIcePowerSettings(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  for (const cb of listeners) cb(next);
  return next;
}

export function resetIcePowerSettings() {
  return saveIcePowerSettings({
    ...DEFAULT_ICE_POWER_SETTINGS,
    frozenFaces: makeDefaultFrozenFaces(),
    skinOverrides: {},
  });
}

export function subscribeIcePowerSettings(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Convert % of die size (−50…50) to pixels. */
export function iceOffsetPx(percent, size) {
  return ((Number(percent) || 0) / 100) * size;
}
