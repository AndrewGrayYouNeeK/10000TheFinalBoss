/**
 * Shark Bite fullscreen video / SVG timing and layout tuning.
 * Saved per device in localStorage — applies in-game immediately.
 */
const STORAGE_KEY = "dice10k_shark_bite_settings_v2";
const PREV_STORAGE_KEY = "dice10k_shark_bite_settings_v1";
const LEGACY_PLAYBACK_KEY = "dice10k_blue_gel_playback_v1";

/** Saved crops to reset — old weak pan, then aggressive crop that cut the shark out. */
const LEGACY_BAD_SOURCE_CROPS = [
  { sourceZoom: 1.22, sourcePanX: -0.28, sourcePanY: -0.12 },
  { sourceZoom: 1.38, sourcePanX: -0.92, sourcePanY: -0.92 },
];

/** Old defaults trimmed the chomp short — migrate saved copies to full playback. */
const LEGACY_EARLY_STOP_AT_PROGRESS = 0.86;
const LEGACY_EARLY_FADE_START = 0.8;

export const DEFAULT_SHARK_BITE_SETTINGS = {
  /** Skip leading seconds of the intro swim-in clip. */
  introStartAtSeconds: 0,
  /** Intro clip progress where playback stops (1 = play to end). */
  introStopAtProgress: 1,

  /** Skip leading seconds of the chomp clip (does not modify the upload). */
  startAtSeconds: 0,
  /** Mute audio once playback reaches this point on the source timeline (0 = never). */
  muteAtSeconds: 0,
  /** Shark bite video muted by default (SFX comes from blueGelPowerAudio). */
  muted: true,

  /** Chomp horizontal nudge — fraction of viewport width (positive = right). 0 = centered. */
  offsetX: 0,
  /** Intro swim-in horizontal nudge — separate from chomp. */
  introOffsetX: 0.06,
  /** Chomp clip vertical nudge — fraction of viewport height (positive = down). */
  offsetY: 0,
  /** Intro swim-in clip vertical nudge — fraction of viewport height (positive = down). */
  introOffsetY: 0,
  /** Clip progress (0–1) when tray dice vanish / chomp fires — aim for jaws over the tray. */
  chompProgress: 0.72,
  /** Clip progress where end fade begins (non-queue path). */
  fadeStart: 0.96,
  /**
   * Intro exit-pan start (0–1). Chomp (full-screen eat) does not exit-pan —
   * it plays through so the shark fills the screen.
   */
  exitPanStart: 0.88,
  /** Clip progress where playback stops (1 = play to end). Trims tail content. */
  stopAtProgress: 1,
  /**
   * Manual rotation for chomp clip canvas/CSS playback (degrees). Catalog
   * blue_gel_power.mp4 is stored landscape with the shark sideways — 90° CW
   * by default. Phone uploads may need 0 / -90 / 180 instead.
   */
  videoRotationDeg: 90,
  /** Intro swim-in clip rotation (degrees) — separate from chomp. */
  introVideoRotationDeg: 0,
  /** When true and stored frames are portrait (h > w), auto-apply 90° rotation. */
  autoRotatePortrait: true,
  /** Extra viewport-width slide during intro exit pan (at progress 1). */
  exitPanExtra: 1.25,
  /** Exit slide direction: -1 = left (off-screen), +1 = right. */
  exitPanDirection: -1,
  /** Pause between intro swim-in ending and chomp starting (ms). */
  interBeatMs: 3000,

  /** Ms before fullscreen bite after FX activates (after in-die feast). */
  preSwimMs: 280,
  /** SVG-only: ms from swim start until chomp. */
  chompMs: 1750,
  /** SVG swim duration (ms). */
  fxMs: 3800,
  /** SVG-only: beat before swim starts. */
  svgBeatMs: 80,
  /** Safety timeout if chomp event never fires. */
  fallbackVanishMs: 10000,

  /** Cover scale for fullscreen chroma canvas (1 = fit, >1 = zoom in). */
  videoScale: 1.18,
  /** Unused when vertically centered — kept for lab slider compatibility. */
  verticalOffset: 0,

  /**
   * Source-frame crop before chroma (does not modify the upload).
   * Default 1 / 0 = full frame. Use Shark Bite Lab sliders only if you need a manual crop.
   */
  sourceZoom: 1,
  sourcePanX: 0,
  sourcePanY: 0,
};

const listeners = new Set();

function migrateLegacyPlayback(raw) {
  if (!raw) return null;
  try {
    const legacy = JSON.parse(raw);
    return {
      startAtSeconds: legacy.startOffsetSec ?? DEFAULT_SHARK_BITE_SETTINGS.startAtSeconds,
      chompProgress: legacy.chompProgress ?? DEFAULT_SHARK_BITE_SETTINGS.chompProgress,
      fadeStart: legacy.fadeStart ?? DEFAULT_SHARK_BITE_SETTINGS.fadeStart,
      offsetX: legacy.offsetX ?? DEFAULT_SHARK_BITE_SETTINGS.offsetX,
      offsetY: legacy.offsetY ?? DEFAULT_SHARK_BITE_SETTINGS.offsetY,
      videoScale: legacy.scale ?? DEFAULT_SHARK_BITE_SETTINGS.videoScale,
      muted: legacy.muted ?? DEFAULT_SHARK_BITE_SETTINGS.muted,
    };
  } catch {
    return null;
  }
}

function near(a, b, eps = 0.02) {
  return Math.abs(Number(a) - b) <= eps;
}

/** One-time bump for saved timing that cut the chomp before the jaws closed. */
function applyTimingMigration(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  const next = { ...parsed };
  if (near(next.stopAtProgress, LEGACY_EARLY_STOP_AT_PROGRESS)) {
    next.stopAtProgress = DEFAULT_SHARK_BITE_SETTINGS.stopAtProgress;
  }
  if (near(next.fadeStart, LEGACY_EARLY_FADE_START)) {
    next.fadeStart = DEFAULT_SHARK_BITE_SETTINGS.fadeStart;
    next.exitPanStart = DEFAULT_SHARK_BITE_SETTINGS.exitPanStart;
  } else if (near(next.exitPanStart, LEGACY_EARLY_FADE_START)) {
    next.exitPanStart = DEFAULT_SHARK_BITE_SETTINGS.exitPanStart;
  }
  return next;
}

/** One-time reset for saved crops that matched broken or aggressive defaults. */
function applySourceCropMigration(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  const px = Number(parsed.sourcePanX);
  const py = Number(parsed.sourcePanY);
  const zoom = Number(parsed.sourceZoom);
  const wrongSign = (Number.isFinite(px) && px > 0) || (Number.isFinite(py) && py > 0);
  const matchesLegacy = LEGACY_BAD_SOURCE_CROPS.some(
    (crop) =>
      near(parsed.sourceZoom, crop.sourceZoom) &&
      near(parsed.sourcePanX, crop.sourcePanX) &&
      near(parsed.sourcePanY, crop.sourcePanY)
  );
  const aggressiveCrop =
    Number.isFinite(zoom) && zoom > 1.05 && (px <= -0.5 || py <= -0.5);
  if (!wrongSign && !matchesLegacy && !aggressiveCrop) return parsed;
  return {
    ...parsed,
    sourceZoom: DEFAULT_SHARK_BITE_SETTINGS.sourceZoom,
    sourcePanX: DEFAULT_SHARK_BITE_SETTINGS.sourcePanX,
    sourcePanY: DEFAULT_SHARK_BITE_SETTINGS.sourcePanY,
  };
}

/** One-time: catalog chomp fallback was sideways at 0° — bump saved 0/null to 90°. */
function applyChompRotationMigration(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  if (parsed._chompRotationCatalogFix) return parsed;
  const next = { ...parsed, _chompRotationCatalogFix: true };
  if (next.videoRotationDeg == null || next.videoRotationDeg === 0) {
    next.videoRotationDeg = DEFAULT_SHARK_BITE_SETTINGS.videoRotationDeg;
  }
  return next;
}

/**
 * One-time layout pass: center chomp, exit left, pause between beats, bigger shark.
 * Only rewrites values that still match the old shipped defaults.
 */
function applyLayoutPassV3(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  if (parsed._sharkLayoutPassV3) return parsed;
  const next = { ...parsed, _sharkLayoutPassV3: true };
  if (near(next.offsetX, 0.18)) next.offsetX = DEFAULT_SHARK_BITE_SETTINGS.offsetX;
  if (next.introOffsetX == null) next.introOffsetX = DEFAULT_SHARK_BITE_SETTINGS.introOffsetX;
  if (near(next.chompProgress, 0.78)) next.chompProgress = DEFAULT_SHARK_BITE_SETTINGS.chompProgress;
  if (near(next.fadeStart, 0.93)) next.fadeStart = DEFAULT_SHARK_BITE_SETTINGS.fadeStart;
  if (near(next.exitPanStart, 0.93)) next.exitPanStart = DEFAULT_SHARK_BITE_SETTINGS.exitPanStart;
  if (near(next.exitPanExtra, 1.1)) next.exitPanExtra = DEFAULT_SHARK_BITE_SETTINGS.exitPanExtra;
  if (next.exitPanDirection == null) next.exitPanDirection = DEFAULT_SHARK_BITE_SETTINGS.exitPanDirection;
  if (next.interBeatMs == null) next.interBeatMs = DEFAULT_SHARK_BITE_SETTINGS.interBeatMs;
  if (near(next.videoScale, 1.08)) next.videoScale = DEFAULT_SHARK_BITE_SETTINGS.videoScale;
  if (near(next.verticalOffset, 0.01)) next.verticalOffset = DEFAULT_SHARK_BITE_SETTINGS.verticalOffset;
  return next;
}

function parseStoredSettings(raw) {
  const parsed = JSON.parse(raw);
  return {
    ...DEFAULT_SHARK_BITE_SETTINGS,
    ...applyLayoutPassV3(
      applyChompRotationMigration(applyTimingMigration(applySourceCropMigration(parsed)))
    ),
  };
}

export function loadSharkBiteSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const next = parseStoredSettings(raw);
      try {
        const parsed = JSON.parse(raw);
        if (!parsed._sharkLayoutPassV3) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch {
        /* ignore */
      }
      return next;
    }

    const prev = localStorage.getItem(PREV_STORAGE_KEY);
    if (prev) {
      const next = parseStoredSettings(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.removeItem(PREV_STORAGE_KEY);
      } catch {
        /* ignore quota errors */
      }
      return next;
    }

    const migrated = migrateLegacyPlayback(localStorage.getItem(LEGACY_PLAYBACK_KEY));
    if (migrated) return { ...DEFAULT_SHARK_BITE_SETTINGS, ...migrated };
    return { ...DEFAULT_SHARK_BITE_SETTINGS };
  } catch {
    return { ...DEFAULT_SHARK_BITE_SETTINGS };
  }
}

export function saveSharkBiteSettings(settings) {
  const next = { ...loadSharkBiteSettings(), ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  for (const cb of listeners) cb(next);
  return next;
}

export function resetSharkBiteSettings() {
  return saveSharkBiteSettings({ ...DEFAULT_SHARK_BITE_SETTINGS });
}

export function subscribeSharkBiteSettings(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Pixel rect into the source frame (for canvas drawImage crop). */
export function getSharkBiteSourceCropRect(vw, vh, settings = loadSharkBiteSettings()) {
  const zoom = Math.max(1, Number(settings?.sourceZoom) || 1);
  const panX = Math.max(-1, Math.min(1, Number(settings?.sourcePanX) || 0));
  const panY = Math.max(-1, Math.min(1, Number(settings?.sourcePanY) || 0));
  const sw = vw / zoom;
  const sh = vh / zoom;
  const maxSx = Math.max(0, vw - sw);
  const maxSy = Math.max(0, vh - sh);
  return {
    sx: maxSx * (0.5 + panX * 0.5),
    sy: maxSy * (0.5 + panY * 0.5),
    sw,
    sh,
  };
}

/** @typedef {'chomp' | 'intro'} SharkBiteRotationSlot */

/** Resolve rotation in degrees for canvas/CSS (canvas ignores video metadata). */
export function getSharkBiteVideoRotationDeg(
  settings = loadSharkBiteSettings(),
  videoWidth = 0,
  videoHeight = 0,
  slot = "chomp"
) {
  const manualKey = slot === "intro" ? "introVideoRotationDeg" : "videoRotationDeg";
  const manual = Number(settings?.[manualKey]);
  if (Number.isFinite(manual) && manual !== 0) return manual;
  if (slot === "intro") return 0;
  if (
    settings?.autoRotatePortrait !== false &&
    videoWidth > 0 &&
    videoHeight > videoWidth * 1.05
  ) {
    return 90;
  }
  return Number.isFinite(manual) ? manual : DEFAULT_SHARK_BITE_SETTINGS.videoRotationDeg;
}

/** True when rotation swaps stored width/height (90° or 270°). */
export function isSharkBiteRotationSwap(rotationDeg) {
  const r = ((Number(rotationDeg) % 360) + 360) % 360;
  return r === 90 || r === 270;
}

/** CSS crop for upload / preview players (matches in-game source crop). */
export function getSharkBitePreviewVideoStyle(
  settings = loadSharkBiteSettings(),
  slot = "chomp",
  videoWidth = 0,
  videoHeight = 0
) {
  const zoom = Math.max(1, Number(settings?.sourceZoom) || 1);
  const panX = Math.max(-1, Math.min(1, Number(settings?.sourcePanX) || 0));
  const panY = Math.max(-1, Math.min(1, Number(settings?.sourcePanY) || 0));
  const rot = getSharkBiteVideoRotationDeg(settings, videoWidth, videoHeight, slot);
  const transforms = [`scale(${zoom})`];
  if (rot) transforms.unshift(`rotate(${rot}deg)`);
  return {
    objectFit: "cover",
    transform: transforms.join(" "),
    transformOrigin: `${50 + panX * 50}% ${50 + panY * 50}%`,
  };
}

/**
 * Upload-card / dialog preview layout — video fills the preview box (relative + absolute inset).
 * Chomp (rotated) uses a tall 9:16 box; intro uses a wide 16:9 box.
 * In-game fullscreen playback keeps using getSharkBitePreviewVideoStyle (cover + crop).
 */
export function getSharkBiteUploadPreviewLayout(
  settings = loadSharkBiteSettings(),
  slot = "chomp",
  videoWidth = 0,
  videoHeight = 0
) {
  const zoom = Math.max(1, Number(settings?.sourceZoom) || 1);
  const panX = Math.max(-1, Math.min(1, Number(settings?.sourcePanX) || 0));
  const panY = Math.max(-1, Math.min(1, Number(settings?.sourcePanY) || 0));
  const rot = getSharkBiteVideoRotationDeg(settings, videoWidth, videoHeight, slot);
  const swap = isSharkBiteRotationSwap(rot);
  const transforms = [`scale(${zoom})`];
  if (rot) transforms.unshift(`rotate(${rot}deg)`);

  return {
    rotationDeg: rot,
    swapDimensions: swap,
    containerClassName: swap
      ? "aspect-[9/16] w-full min-h-72 max-h-[28rem] sm:max-h-[32rem] mx-auto overflow-hidden relative"
      : "aspect-video w-full min-h-60 max-h-80 sm:min-h-72 sm:max-h-96 overflow-hidden relative",
    videoClassName: "absolute inset-0 h-full w-full object-cover",
    videoStyle: {
      objectFit: "cover",
      transform: transforms.join(" "),
      transformOrigin: `${50 + panX * 50}% ${50 + panY * 50}%`,
    },
  };
}

/** Normalized clip progress (0–1) accounting for startAtSeconds trim. */
export function sharkBiteClipProgress(video, startAtSeconds = 0) {
  if (!video?.duration || !Number.isFinite(video.duration) || video.duration <= 0) return 0;
  const start = Math.max(0, Math.min(startAtSeconds, video.duration - 0.05));
  const span = Math.max(0.001, video.duration - start);
  return Math.max(0, Math.min(1, (video.currentTime - start) / span));
}

/** @deprecated Use loadSharkBiteSettings — compat alias for prior partial work. */
export const DEFAULT_BLUE_GEL_PLAYBACK_SETTINGS = {
  startOffsetSec: DEFAULT_SHARK_BITE_SETTINGS.startAtSeconds,
  chompProgress: DEFAULT_SHARK_BITE_SETTINGS.chompProgress,
  fadeStart: DEFAULT_SHARK_BITE_SETTINGS.fadeStart,
  offsetX: DEFAULT_SHARK_BITE_SETTINGS.offsetX,
  offsetY: DEFAULT_SHARK_BITE_SETTINGS.offsetY,
  scale: DEFAULT_SHARK_BITE_SETTINGS.videoScale,
  muted: DEFAULT_SHARK_BITE_SETTINGS.muted,
};

export function loadBlueGelPlaybackSettings() {
  const s = loadSharkBiteSettings();
  return {
    startOffsetSec: s.startAtSeconds,
    chompProgress: s.chompProgress,
    fadeStart: s.fadeStart,
    offsetX: s.offsetX,
    offsetY: s.offsetY,
    scale: s.videoScale,
    muted: s.muted,
  };
}

export function saveBlueGelPlaybackSettings(settings) {
  const patch = {};
  if (settings.startOffsetSec != null) patch.startAtSeconds = settings.startOffsetSec;
  if (settings.chompProgress != null) patch.chompProgress = settings.chompProgress;
  if (settings.fadeStart != null) patch.fadeStart = settings.fadeStart;
  if (settings.offsetX != null) patch.offsetX = settings.offsetX;
  if (settings.offsetY != null) patch.offsetY = settings.offsetY;
  if (settings.scale != null) patch.videoScale = settings.scale;
  if (settings.muted != null) patch.muted = settings.muted;
  return saveSharkBiteSettings({ ...loadSharkBiteSettings(), ...patch });
}

export function resetBlueGelPlaybackSettings() {
  return resetSharkBiteSettings();
}

export function subscribeBlueGelPlaybackSettings(cb) {
  return subscribeSharkBiteSettings((next) =>
    cb({
      startOffsetSec: next.startAtSeconds,
      chompProgress: next.chompProgress,
      fadeStart: next.fadeStart,
      offsetX: next.offsetX,
      offsetY: next.offsetY,
      scale: next.videoScale,
      muted: next.muted,
    })
  );
}
