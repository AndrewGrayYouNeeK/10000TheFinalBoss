import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BLUE_GEL_BUBBLE_MS,
  BLUE_GEL_SHARK_ENTER_MS,
  BLUE_GEL_FEAST_AT_MS,
  BLUE_GEL_AFTERMATH_MS,
  BLUE_GEL_BUBBLE_WAVE_MS,
  BLUE_GEL_NORMAL_MS,
  acquireBlueGelSharkAudio,
} from "@/lib/blueGelPowerAudio";
import {
  getCachedBlueGelPowerVideoObjectUrl,
  getCachedSharkBiteIntroVideoObjectUrl,
  buildSharkBitePhaseQueue,
  getCatalogChompVideoUrl,
  hasUploadedSharkBiteBeatSync,
  preloadBlueGelPowerVideo,
  preloadSharkBiteIntroVideo,
  resolveChompVideoForSharkBite,
  subscribeBlueGelPowerVideo,
  subscribeSharkBiteIntroVideo,
} from "@/lib/blueGelPowerVideo";
import { VIDEO_KEYS, VIDEO_FALLBACK_PATHS, getCachedLocalVideoObjectUrl, getLocalVideoObjectUrl } from "@/lib/localVideoStore";
import {
  loadBlueGelChromaSettings,
  subscribeBlueGelChromaSettings,
  hexToRgb,
} from "@/lib/blueGelChromaSettings";
import {
  DEFAULT_SHARK_BITE_SETTINGS,
  getSharkBitePreviewVideoStyle,
  getSharkBiteSourceCropRect,
  getSharkBiteVideoRotationDeg,
  isSharkBiteRotationSwap,
  loadSharkBiteSettings,
  subscribeSharkBiteSettings,
  sharkBiteClipProgress,
} from "@/lib/sharkBiteSettings";
import {
  emitSharkBiteChomp,
  SHARK_BITE_CHOMP_PROGRESS,
  SHARK_BITE_FADE_START,
  SHARK_BITE_STOP_AT_PROGRESS,
} from "@/lib/sharkBiteChomp";
import { applyVideoStartOffset, bindVideoMuteAt } from "@/lib/videoAudio";
import {
  buildSharkTankCreatures,
  SharkTankBloodFlash,
  SharkTankFishSkeleton,
  SwimmingShark,
  useSharkTankRivalry,
} from "@/components/game/SharkVisuals";
import { AquariumBubbles, aquariumBubbleCount } from "@/components/game/AquariumBubbles";

/** Live-updating chroma-key settings for the shark video. */
export function useBlueGelChromaSettings() {
  const [settings, setSettings] = React.useState(() => loadBlueGelChromaSettings());
  React.useEffect(() => subscribeBlueGelChromaSettings(setSettings), []);
  return settings;
}

/** Live Shark Bite timing / layout settings. */
export function useSharkBiteSettings() {
  const [settings, setSettings] = React.useState(() => loadSharkBiteSettings());
  React.useEffect(() => subscribeSharkBiteSettings(setSettings), []);
  return settings;
}

/** @deprecated Use useSharkBiteSettings — compat alias. */
export function useBlueGelPlaybackSettings() {
  const s = useSharkBiteSettings();
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

/** Soft fade band (px at process res) so the video rect never shows a hard edge/line. */
const CHROMA_EDGE_FEATHER_PX = 12;

function getVisibleViewportSize() {
  if (typeof window === "undefined") return { width: 400, height: 800 };
  const visualViewport = window.visualViewport;
  const documentWidth =
    typeof document !== "undefined" ? document.documentElement?.clientWidth : 0;
  const documentHeight =
    typeof document !== "undefined" ? document.documentElement?.clientHeight : 0;
  return {
    width:
      Number(visualViewport?.width) ||
      Number(documentWidth) ||
      Number(window.innerWidth) ||
      400,
    height:
      Number(visualViewport?.height) ||
      Number(documentHeight) ||
      Number(window.innerHeight) ||
      800,
  };
}

function portalToViewport(node) {
  if (typeof document === "undefined" || !document.body) return null;
  return createPortal(node, document.body);
}

/** Calm blue-gel water before the shark feast. */
const BLUE_GEL_WATER_IDLE =
  "radial-gradient(ellipse at 50% 40%, rgba(14,116,144,0.15) 0%, transparent 60%)";

/** Bloody water while the feast aftermath bubbles play out. */
const BLUE_GEL_BLOOD_WATER =
  "radial-gradient(ellipse at 50% 38%, rgba(185,22,22,0.78) 0%, rgba(48,6,6,0.68) 58%, rgba(12,1,1,0.72) 100%)";

/** Darker crimson once the feast settles — rest of the match. */
const BLUE_GEL_BLOOD_WATER_SETTLED =
  "radial-gradient(ellipse at 50% 36%, rgba(210,12,12,0.88) 0%, rgba(38,4,4,0.82) 52%, rgba(8,0,0,0.9) 100%)";

/** Live dice-tray center for aligning the fullscreen shark bite. */
export function useGameplayDiceTrayAnchor(active) {
  const [anchor, setAnchor] = React.useState(null);

  React.useLayoutEffect(() => {
    if (!active) {
      setAnchor(null);
      return undefined;
    }

    const measure = () => {
      const el = document.getElementById("gameplay-dice-tray");
      if (!el) {
        const { width, height } = getVisibleViewportSize();
        setAnchor({
          x: width * 0.5,
          y: height * 0.72,
          w: Math.min(width * 0.88, 420),
          h: 140,
        });
        return;
      }
      const r = el.getBoundingClientRect();
      setAnchor({
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        w: r.width,
        h: r.height,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [active]);

  return anchor;
}

/** Live dice-tray center — used to dip the jaw onto the dice at chomp. */
function getSharkBiteLayout(trayAnchor, offsetX = DEFAULT_SHARK_BITE_SETTINGS.offsetX) {
  const { width: vw, height: vh } = getVisibleViewportSize();
  const anchor = trayAnchor ?? {
    x: vw * 0.5,
    y: vh * 0.72,
    w: Math.min(vw * 0.88, 420),
    h: 140,
  };

  // Big, dramatic shark — dominates the middle of the screen (nudged right for tray).
  const sharkW = Math.min(vw * 0.98, 860);
  const sharkH = sharkW * 0.5;
  const screenCx = vw * 0.5 + vw * offsetX;
  const screenCy = vh * 0.47;

  // Center the whole shark on screen; dip at chomp so the jaw reaches the dice tray.
  const baseLeft = screenCx - sharkW / 2;
  const baseTop = screenCy - sharkH / 2;
  const mouthY = baseTop + sharkH * 0.58;
  const chompDip = Math.min(Math.max(anchor.y - mouthY + 12, 28), sharkH * 0.28);
  const chompTop = baseTop + chompDip;
  // Clear past the viewport edge by a full shark width (+ margin) so the chomp/exit
  // never stops short mid-frame (scale keyframes can enlarge the silhouette).
  const edgePad = Math.max(sharkW * 1.35, vw * 0.22, 220);

  return {
    anchor,
    sharkW,
    sharkH,
    baseLeft,
    baseTop,
    chompTop,
    chompDip,
    offLeft: -(baseLeft + edgePad),
    offRight: vw - baseLeft + edgePad,
  };
}

/** Resolve a shark-bite clip URL — auto, forced catalog, or local upload only. */
function useSharkBiteVideoUrl(videoKey, enabled = true, source = "auto") {
  const initialUrl = React.useMemo(() => {
    if (!enabled) return null;
    if (source === "catalog" && videoKey === VIDEO_KEYS.BLUE_GEL_POWER) {
      return getCatalogChompVideoUrl();
    }
    if (source === "local") {
      if (videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO) {
        return getCachedSharkBiteIntroVideoObjectUrl();
      }
      return getCachedLocalVideoObjectUrl(VIDEO_KEYS.BLUE_GEL_POWER);
    }
    if (videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO) {
      return getCachedSharkBiteIntroVideoObjectUrl();
    }
    return getCachedLocalVideoObjectUrl(VIDEO_KEYS.BLUE_GEL_POWER);
  }, [enabled, videoKey, source]);

  const [url, setUrl] = React.useState(initialUrl);

  React.useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return undefined;
    }

    if (source === "catalog" && videoKey === VIDEO_KEYS.BLUE_GEL_POWER) {
      setUrl(getCatalogChompVideoUrl());
      return undefined;
    }

    let cancelled = false;

    if (source === "local") {
      const preload =
        videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO
          ? preloadSharkBiteIntroVideo
          : () => getLocalVideoObjectUrl(VIDEO_KEYS.BLUE_GEL_POWER);
      const cached =
        videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO
          ? getCachedSharkBiteIntroVideoObjectUrl
          : () => getCachedLocalVideoObjectUrl(VIDEO_KEYS.BLUE_GEL_POWER);
      const subscribe =
        videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO
          ? subscribeSharkBiteIntroVideo
          : subscribeBlueGelPowerVideo;

      preload().then((next) => {
        if (!cancelled) setUrl(next || cached());
      });
      const unsub = subscribe((next) => {
        if (cancelled) return;
        setUrl(next || cached());
      });
      return () => {
        cancelled = true;
        unsub();
      };
    }

    const preload =
      videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO
        ? preloadSharkBiteIntroVideo
        : resolveChompVideoForSharkBite;
    const subscribe =
      videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO
        ? subscribeSharkBiteIntroVideo
        : subscribeBlueGelPowerVideo;
    const cached =
      videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO
        ? getCachedSharkBiteIntroVideoObjectUrl
        : () =>
            getCachedLocalVideoObjectUrl(VIDEO_KEYS.BLUE_GEL_POWER) ??
            VIDEO_FALLBACK_PATHS[VIDEO_KEYS.BLUE_GEL_POWER] ??
            null;

    preload().then((next) => {
      if (!cancelled) setUrl(next);
    });
    const unsub = subscribe((next) => {
      if (cancelled) return;
      if (videoKey === VIDEO_KEYS.BLUE_GEL_POWER) {
        setUrl(next || cached());
        return;
      }
      setUrl(next || cached());
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [enabled, videoKey, source]);

  return url;
}

/** Resolve blue_gel_power: local upload blob, else catalog /assets/blue_gel_power.mp4. */
export function useBlueGelPowerVideoUrl(enabled = true) {
  return useSharkBiteVideoUrl(VIDEO_KEYS.BLUE_GEL_POWER, enabled);
}

export function SharkSvg({ chomping, size = "100%", showTeeth = false, scary = false }) {
  const teethVisible = chomping || showTeeth;
  return (
    <svg viewBox="0 0 96 48" width={size} height={size} style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.55))" }}>
      {/* Body */}
      <path
        d="M 8 26 Q 28 8 56 14 Q 78 18 88 24 Q 78 34 54 36 Q 28 40 8 26 Z"
        fill={scary ? "#475569" : "#64748b"}
      />
      <path d="M 20 18 Q 48 10 70 18" stroke="#94a3b8" strokeWidth="4" fill="none" opacity="0.45" />
      {/* Dorsal */}
      <path d="M 44 14 L 52 0 L 58 16 Z" fill="#475569" />
      {/* Tail */}
      <path d="M 8 26 L -4 10 L 2 26 L -4 40 Z" fill="#475569" />
      {/* Belly */}
      <ellipse cx="52" cy="30" rx="18" ry="5" fill="#cbd5e1" opacity="0.55" />
      {/* Eye */}
      <circle cx="74" cy="20" r="2.4" fill={scary ? "#dc2626" : "#0f172a"} />
      <circle cx="74.6" cy="19.5" r="0.7" fill={scary ? "#fecaca" : "white"} />
      {/* Jaw — opens when chomping */}
      <motion.path
        d={chomping ? "M 70 28 Q 82 36 88 28" : "M 70 26 Q 82 30 88 24"}
        stroke="#1e293b"
        strokeWidth="2.2"
        fill="none"
        animate={chomping ? { d: ["M 70 26 Q 82 30 88 24", "M 70 30 Q 84 40 90 30", "M 70 26 Q 82 30 88 24"] } : undefined}
        transition={chomping ? { duration: 0.35, repeat: 3, ease: "easeInOut" } : undefined}
      />
      {/* Teeth flash */}
      {teethVisible && (
        <motion.g
          initial={{ opacity: chomping ? 0 : 0.85 }}
          animate={chomping ? { opacity: [0, 1, 0.8, 0] } : { opacity: 0.85 }}
          transition={chomping ? { duration: 0.9, delay: 0.15 } : { duration: 0 }}
        >
          {[72, 76, 80, 84].map((x) => (
            <path key={x} d={`M ${x} 27 L ${x + 1.5} 32 L ${x + 3} 27 Z`} fill="white" />
          ))}
        </motion.g>
      )}
    </svg>
  );
}

/** Draw a cropped source frame into a work canvas, applying manual/auto rotation. */
function drawSharkBiteSourceFrame(wctx, video, crop, fw, fh, rotationDeg) {
  const rot = ((Number(rotationDeg) % 360) + 360) % 360;
  wctx.setTransform(1, 0, 0, 1, 0, 0);
  wctx.clearRect(0, 0, fw, fh);
  if (rot === 0) {
    wctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, fw, fh);
    return;
  }
  wctx.save();
  wctx.translate(fw / 2, fh / 2);
  wctx.rotate((rot * Math.PI) / 180);
  const swap = isSharkBiteRotationSwap(rot);
  const dw = swap ? fh : fw;
  const dh = swap ? fw : fh;
  wctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, -dw / 2, -dh / 2, dw, dh);
  wctx.restore();
}

/**
 * Renders a video to a <canvas> with its background color keyed out, so only
 * the subject (the shark) is visible over whatever is behind it. Samples the
 * background color from the frame corners and makes matching pixels transparent
 * with a soft edge. Dark plates also use a luma gate so compression haze
 * doesn't leave a rectangular fog / square over gameplay.
 *
 * `fullViewport` draws into a screen-sized canvas (shark centered) so any
 * leftover frame edge sits at the page boundary — never a mid-screen line.
 */
export function ChromaKeyVideo({
  src,
  loop = false,
  onTimeUpdate,
  onEnded,
  onError,
  className = "",
  /** Extra CSS opacity (0–1) for end fade — applied on the canvas. */
  fadeOpacity = 1,
  /** Clip progress (0–1) where end fade begins. Driven every painted frame. */
  fadeOutFrom = null,
  /** Fill the viewport; letterbox the clip so the video rect edge is off-screen / at page edge. */
  fullViewport = false,
  /** Override shark-bite trim for this clip (e.g. intro swim-in). */
  playbackStartAtSeconds = null,
  playbackStopAtProgress = null,
  /** When true, call onEnded immediately instead of sliding off-screen. */
  skipExitPan = false,
  /**
   * When true (chomp beat), slide in from off-screen (opposite exit direction)
   * until enterPanEnd progress, then hold center for the eat.
   */
  enterFromSide = false,
  /** Hold the final frame while a following queued beat is prepared. */
  holdOnEnded = false,
  /**
   * Stronger plate removal for the fullscreen chomp beat — kill dark/flat
   * scenery so only the shark remains (no background plate).
   */
  stripBackgroundPlate = false,
  /** Horizontal nudge override (viewport fraction; + = right). Defaults to biteSettings.offsetX. */
  layoutOffsetX = null,
  /** Vertical nudge override (viewport fraction; + = down). Defaults to biteSettings.offsetY. */
  layoutOffsetY = null,
  /** Which shark-bite clip rotation to apply (`chomp` vs `intro`). */
  rotationSlot = "chomp",
  /** Catalog vs local — local uploads skip catalog's default 90° rotation. */
  rotationSource = null,
}) {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const keyColorRef = React.useRef(null);
  const fadeOpacityRef = React.useRef(fadeOpacity);
  const fadeOutFromRef = React.useRef(fadeOutFrom);
  const settings = useBlueGelChromaSettings();
  const biteSettings = useSharkBiteSettings();
  const settingsRef = React.useRef(settings);
  const biteRef = React.useRef(biteSettings);
  const playbackStartRef = React.useRef(playbackStartAtSeconds);
  const playbackStopRef = React.useRef(playbackStopAtProgress);
  const skipExitPanRef = React.useRef(skipExitPan);
  const enterFromSideRef = React.useRef(enterFromSide);
  const holdOnEndedRef = React.useRef(holdOnEnded);
  const stripBackgroundPlateRef = React.useRef(stripBackgroundPlate);
  const layoutOffsetXRef = React.useRef(layoutOffsetX);
  const layoutOffsetYRef = React.useRef(layoutOffsetY);
  const rotationSlotRef = React.useRef(rotationSlot);
  const rotationSourceRef = React.useRef(rotationSource);
  // Keep media-loop callbacks stable — identity changes remounted the video and
  // replayed intro/chomp beats (looked like Shark Bite playing 2–3 times).
  const onTimeUpdateRef = React.useRef(onTimeUpdate);
  const onEndedRef = React.useRef(onEnded);
  const onErrorRef = React.useRef(onError);
  fadeOpacityRef.current = fadeOpacity;
  fadeOutFromRef.current = fadeOutFrom;
  playbackStartRef.current = playbackStartAtSeconds;
  playbackStopRef.current = playbackStopAtProgress;
  skipExitPanRef.current = skipExitPan;
  enterFromSideRef.current = enterFromSide;
  holdOnEndedRef.current = holdOnEnded;
  stripBackgroundPlateRef.current = stripBackgroundPlate;
  layoutOffsetXRef.current = layoutOffsetX;
  layoutOffsetYRef.current = layoutOffsetY;
  rotationSlotRef.current = rotationSlot;
  rotationSourceRef.current = rotationSource;
  onTimeUpdateRef.current = onTimeUpdate;
  onEndedRef.current = onEnded;
  onErrorRef.current = onError;

  // Live settings without restarting the render loop. Re-sample when the key
  // mode / color changes so the preview updates immediately.
  React.useEffect(() => {
    settingsRef.current = settings;
    keyColorRef.current = null;
  }, [settings]);

  React.useEffect(() => {
    biteRef.current = biteSettings;
  }, [biteSettings]);

  React.useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return undefined;

    let cancelled = false;
    let rafId = null;
    let vfcId = null;
    let earlyEndTriggered = false;
    let endedFired = false;
    keyColorRef.current = null;
    const lastBlit = { drawX: 0, drawY: 0, drawW: 0, drawH: 0, ready: false };

    const work = document.createElement("canvas");
    const wctx = work.getContext("2d", { willReadFrequently: true });
    const octx = canvas.getContext("2d", { alpha: true });

    // Cap processing resolution for performance; canvas is scaled up by CSS.
    const MAX_W = fullViewport ? 960 : 640;

    const sampleKeyColor = (w, h) => {
      // Average the four corners — the background usually lives there.
      const pts = [
        [2, 2],
        [w - 3, 2],
        [2, h - 3],
        [w - 3, h - 3],
      ];
      let r = 0;
      let g = 0;
      let b = 0;
      for (const [x, y] of pts) {
        const d = wctx.getImageData(x, y, 1, 1).data;
        r += d[0];
        g += d[1];
        b += d[2];
      }
      return { r: r / pts.length, g: g / pts.length, b: b / pts.length };
    };

    /** Soften / zero alpha near the clip rect so a hard stop-line never shows. */
    const featherFrameEdges = (data, fw, fh) => {
      const band = CHROMA_EDGE_FEATHER_PX;
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const edge = Math.min(x, y, fw - 1 - x, fh - 1 - y);
          if (edge >= band) continue;
          const i = (y * fw + x) * 4 + 3;
          if (edge <= 1) {
            data[i] = 0;
          } else {
            data[i] = Math.round(data[i] * (edge / band));
          }
        }
      }
    };

    const renderFrame = () => {
      if (cancelled) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        scheduleNext();
        return;
      }

      // Process at clip resolution (capped). Swap dimensions when rotated 90/270.
      const rotationDeg = getSharkBiteVideoRotationDeg(
        biteRef.current,
        vw,
        vh,
        rotationSlotRef.current,
        rotationSourceRef.current
      );
      const swapDims = isSharkBiteRotationSwap(rotationDeg);
      const baseW = swapDims ? vh : vw;
      const baseH = swapDims ? vw : vh;
      const scale = Math.min(1, MAX_W / baseW);
      const fw = Math.round(baseW * scale);
      const fh = Math.round(baseH * scale);
      if (work.width !== fw || work.height !== fh) {
        work.width = fw;
        work.height = fh;
      }

      const crop = getSharkBiteSourceCropRect(vw, vh, biteRef.current);
      drawSharkBiteSourceFrame(wctx, video, crop, fw, fh, rotationDeg);

      const cfg = settingsRef.current;
      let endFade = 1;
      const fadeFrom = fadeOutFromRef.current;
      if (!loop && fadeFrom != null && video.duration > 0) {
        const bs = biteRef.current;
        const p = sharkBiteClipProgress(video, bs?.startAtSeconds ?? 0);
        if (p >= fadeFrom) {
          endFade = Math.max(0, 1 - (p - fadeFrom) / Math.max(0.001, 1 - fadeFrom));
        }
      }
      const combinedFade =
        Math.max(0, Math.min(1, fadeOpacityRef.current)) * endFade;
      canvas.style.opacity = String(combinedFade);

      // Output canvas size: full viewport or clip-sized.
      let outW = fw;
      let outH = fh;
      let drawX = 0;
      let drawY = 0;
      let drawW = fw;
      let drawH = fh;
      if (fullViewport && typeof window !== "undefined") {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const { width: viewportWidth, height: viewportHeight } = getVisibleViewportSize();
        outW = Math.max(1, Math.round(viewportWidth * dpr));
        outH = Math.max(1, Math.round(viewportHeight * dpr));
        const bs = biteRef.current;
        // Cover (Math.max), not contain — rotated catalog clips are portrait-in-landscape
        // and letterbox badly with Math.min, leaving an inset "video window".
        const cover = Math.max(outW / fw, outH / fh);
        const fit = cover * (Number(bs?.videoScale) || DEFAULT_SHARK_BITE_SETTINGS.videoScale);
        drawW = fw * fit;
        drawH = fh * fit;
        // Resolve horizontal nudge: prop override → intro/chomp setting → default.
        // Intro uses introOffsetX (NOT offsetX). Positive = right, as fraction of viewport.
        const slot = rotationSlotRef.current === "intro" ? "intro" : "chomp";
        let offsetX;
        if (layoutOffsetXRef.current != null && Number.isFinite(Number(layoutOffsetXRef.current))) {
          offsetX = Number(layoutOffsetXRef.current);
        } else if (slot === "intro") {
          offsetX = Number(bs?.introOffsetX ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetX) || 0;
        } else {
          offsetX = Number(bs?.offsetX ?? DEFAULT_SHARK_BITE_SETTINGS.offsetX) || 0;
        }
        // Explicit blit nudge — must not be cancelled by CSS object-fit cover.
        drawX = (outW - drawW) / 2 + outW * offsetX;
        let offsetY;
        if (layoutOffsetYRef.current != null && Number.isFinite(Number(layoutOffsetYRef.current))) {
          offsetY = Number(layoutOffsetYRef.current);
        } else if (slot === "intro") {
          offsetY = Number(bs?.introOffsetY ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetY) || 0;
        } else {
          offsetY = Number(bs?.offsetY ?? DEFAULT_SHARK_BITE_SETTINGS.offsetY) || 0;
        }
        // Vertically center so the shark fills the middle of the screen (not glued to the bottom).
        drawY = (outH - drawH) / 2 + outH * offsetY;
        // Prove offset is live on the canvas element (lab / DevTools).
        canvas.dataset.sharkSlot = slot;
        canvas.dataset.introOffsetX = String(
          slot === "intro" ? offsetX : Number(bs?.introOffsetX ?? 0)
        );
        canvas.dataset.layoutOffsetX = String(offsetX);
        canvas.dataset.drawX = String(Math.round(drawX));
        const startAtSec =
          playbackStartRef.current ?? bs?.startAtSeconds ?? DEFAULT_SHARK_BITE_SETTINGS.startAtSeconds;
        const p = video.duration > 0 ? sharkBiteClipProgress(video, startAtSec) : 0;
        const exitExtra = bs?.exitPanExtra ?? DEFAULT_SHARK_BITE_SETTINGS.exitPanExtra;
        const exitDir = Number(bs?.exitPanDirection);
        const dir = Number.isFinite(exitDir) && exitDir !== 0 ? Math.sign(exitDir) : -1;
        const slideSpan = Math.max(outW, drawW) * exitExtra;
        // Chomp beat: enter from the opposite side, cross to center, then eat.
        if (!loop && enterFromSideRef.current && video.duration > 0) {
          const enterEnd = Math.max(
            0.05,
            Math.min(0.85, Number(bs?.enterPanEnd) || DEFAULT_SHARK_BITE_SETTINGS.enterPanEnd)
          );
          if (p < enterEnd) {
            const t = 1 - p / enterEnd; // 1 off-screen → 0 centered
            drawX += slideSpan * t * -dir;
          }
        }
        // Intro swim-in: late exit pan so the shark clears the viewport edge-to-edge.
        if (!loop && !skipExitPanRef.current && video.duration > 0) {
          const exitStart = bs?.exitPanStart ?? DEFAULT_SHARK_BITE_SETTINGS.exitPanStart;
          if (p >= exitStart) {
            const t = (p - exitStart) / Math.max(0.001, 1 - exitStart);
            drawX += slideSpan * t * dir;
          }
        }
      }
      if (canvas.width !== outW || canvas.height !== outH) {
        canvas.width = outW;
        canvas.height = outH;
      }

      const blit = (src) => {
        octx.clearRect(0, 0, outW, outH);
        if (fullViewport) {
          octx.drawImage(src, drawX, drawY, drawW, drawH);
          lastBlit.drawX = drawX;
          lastBlit.drawY = drawY;
          lastBlit.drawW = drawW;
          lastBlit.drawH = drawH;
          lastBlit.ready = true;
        } else {
          octx.drawImage(src, 0, 0);
        }
      };

      // Keying disabled — show the raw frame (chomp beat always strips the plate).
      if (cfg && cfg.enabled === false && !stripBackgroundPlateRef.current) {
        blit(work);
        scheduleNext();
        return;
      }

      let frame;
      try {
        frame = wctx.getImageData(0, 0, fw, fh);
      } catch {
        blit(video);
        scheduleNext();
        return;
      }

      if (!keyColorRef.current) {
        keyColorRef.current =
          cfg && cfg.autoKey === false ? hexToRgb(cfg.color) : sampleKeyColor(fw, fh);
      }
      const key = keyColorRef.current;
      const keyLuma = 0.299 * key.r + 0.587 * key.g + 0.114 * key.b;
      const keyIsDark = keyLuma < 40;
      const stripPlate = !!stripBackgroundPlateRef.current;
      // Fullscreen chomp: gentle plate peel — aggressive adds punched holes in the shark.
      const inner = (cfg?.tolerance ?? 48) + (stripPlate ? 6 : 0);
      const soft = (cfg?.softness ?? 26) + (stripPlate ? 4 : 0);
      const outer = inner + soft;
      const lumaCut = (cfg?.lumaThreshold ?? 20) + (stripPlate ? 6 : 0);
      const plateChromaCut = stripPlate ? 16 : 14;
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        // Kill near-black / flat plate — leave gray shark body alone.
        if ((keyIsDark || stripPlate) && luma <= lumaCut && chroma <= plateChromaCut) {
          data[i + 3] = 0;
          continue;
        }
        // Strip muted dark-blue/teal ocean plates — soft thresholds so shark skin survives.
        if (stripPlate && luma < 38 && chroma < 22 && b >= r - 4 && b >= g - 8) {
          data[i + 3] = 0;
          continue;
        }
        const dr = r - key.r;
        const dg = g - key.g;
        const db = b - key.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        let alpha = data[i + 3];
        if (dist < inner) {
          // Do not force-zero mid-gray shark pixels on stripPlate (was too aggressive).
          if (!keyIsDark || luma < 36) alpha = 0;
        } else if (dist < outer) {
          if (!keyIsDark || luma < 48) {
            alpha = Math.round((alpha * (dist - inner)) / (outer - inner));
          }
        }
        data[i + 3] = alpha;
      }
      // Mouth black ellipse/hole fill removed — chroma plate strip only.
      featherFrameEdges(data, fw, fh);
      wctx.putImageData(frame, 0, 0);

      blit(work);
      onTimeUpdateRef.current?.(video);

      if (!loop && video.duration > 0) {
        const bs = biteRef.current;
        const startAtSec =
          playbackStartRef.current ?? bs?.startAtSeconds ?? DEFAULT_SHARK_BITE_SETTINGS.startAtSeconds;
        const p = sharkBiteClipProgress(video, startAtSec);
        const stopAt =
          playbackStopRef.current ?? bs?.stopAtProgress ?? DEFAULT_SHARK_BITE_SETTINGS.stopAtProgress;
        if (stopAt < 1 && p >= stopAt && !earlyEndTriggered) {
          earlyEndTriggered = true;
          video.pause();
          handleEnded();
          return;
        }
      }

      scheduleNext();
    };

    const scheduleNext = () => {
      if (cancelled || endedFired) return;
      if (typeof video.requestVideoFrameCallback === "function") {
        vfcId = video.requestVideoFrameCallback(() => renderFrame());
      } else {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    const handleTime = () => onTimeUpdateRef.current?.(video);
    const handleEnded = () => {
      if (endedFired) return;
      endedFired = true;
      if (skipExitPanRef.current) {
        if (!holdOnEndedRef.current) {
          canvas.style.opacity = "0";
          octx.clearRect(0, 0, canvas.width, canvas.height);
        }
        onEndedRef.current?.();
        return;
      }
      // Hold the last frame and finish sliding off-screen so the shark
      // never "cuts off" mid-viewport when the clip ends early.
      if (!fullViewport || !lastBlit.ready) {
        canvas.style.opacity = "0";
        octx.clearRect(0, 0, canvas.width, canvas.height);
        onEndedRef.current?.();
        return;
      }
      let start = null;
      const EXIT_MS = 820;
      const baseX = lastBlit.drawX;
      const { drawY: by, drawW: bw, drawH: bh } = lastBlit;
      const exitDirRaw = Number(biteRef.current?.exitPanDirection);
      const exitDir = Number.isFinite(exitDirRaw) && exitDirRaw !== 0 ? Math.sign(exitDirRaw) : -1;
      const exitExtra =
        Number(biteRef.current?.exitPanExtra) || DEFAULT_SHARK_BITE_SETTINGS.exitPanExtra;
      // Cover-scaled frames are wider than the viewport — slide past the drawn width.
      const slideSpan = Math.max(canvas.width, bw) * Math.max(1.15, exitExtra);
      const step = (ts) => {
        if (cancelled) return;
        if (start == null) start = ts;
        const t = Math.min(1, (ts - start) / EXIT_MS);
        octx.clearRect(0, 0, canvas.width, canvas.height);
        // Slide fully off-screen in exitPanDirection (default left).
        const slide = slideSpan * t * exitDir;
        octx.drawImage(work, baseX + slide, by, bw, bh);
        canvas.style.opacity = String(Math.max(0, 1 - t * t));
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          octx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.opacity = "0";
          onEndedRef.current?.();
        }
      };
      rafId = requestAnimationFrame(step);
    };
    const handleError = () => onErrorRef.current?.();

    const onResize = () => {
      // The next video frame recalculates the full-viewport canvas size.
    };
    if (fullViewport) {
      window.addEventListener("resize", onResize);
      window.visualViewport?.addEventListener("resize", onResize);
    }

    video.addEventListener("timeupdate", handleTime);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    let muteCleanup = () => {};

    video.muted = biteRef.current?.muted !== false;
    const startAt = Math.max(
      0,
      Number(playbackStartRef.current ?? biteRef.current?.startAtSeconds) || 0
    );
    const muteAt = Math.max(0, Number(biteRef.current?.muteAtSeconds) || 0);
    const begin = () => {
      applyVideoStartOffset(video, startAt);
      if (muteAt > 0) {
        muteCleanup = bindVideoMuteAt(video, muteAt, () => {
          video.muted = true;
          video.volume = 0;
        });
      }
      video.play().catch(() => onErrorRef.current?.());
    };
    if (video.readyState >= 1) begin();
    else video.addEventListener("loadedmetadata", begin, { once: true });
    scheduleNext();

    return () => {
      cancelled = true;
      muteCleanup();
      if (rafId) cancelAnimationFrame(rafId);
      if (vfcId && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(vfcId);
      }
      if (fullViewport) {
        window.removeEventListener("resize", onResize);
        window.visualViewport?.removeEventListener("resize", onResize);
      }
      video.removeEventListener("loadedmetadata", begin);
      video.removeEventListener("timeupdate", handleTime);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [src, loop, fullViewport, rotationSlot, rotationSource]);

  return (
    <>
      <video
        ref={videoRef}
        key={src}
        src={src}
        loop={loop}
        muted={biteSettings.muted !== false}
        playsInline
        preload="auto"
        // Keep the decoder in-viewport — off-screen 1×1 videos get throttled and
        // delay chomp-progress sync (dice vanish / blackout fire late).
        className={
          fullViewport
            ? "absolute inset-0 h-full w-full opacity-0 pointer-events-none"
            : "absolute w-px h-px opacity-0 pointer-events-none"
        }
        style={fullViewport ? undefined : { left: -9999, top: -9999 }}
      />
      <canvas
        ref={canvasRef}
        className={
          fullViewport
            ? "absolute inset-0 w-full h-full max-w-none max-h-none pointer-events-none"
            : className
        }
        style={{
          opacity: Math.max(0, Math.min(1, fadeOpacity)),
          filter: "none",
          background: "transparent",
          mixBlendMode: "normal",
          ...(fullViewport
            ? {
                position: "absolute",
                inset: 0,
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                maxWidth: "none",
                maxHeight: "none",
                // CRITICAL: do NOT use object-fit:cover — it re-crops the canvas
                // bitmap from center and cancels layoutOffsetX / introOffsetX.
                objectFit: "fill",
              }
            : {}),
          // No radial mask on fullscreen — it read as an inset video window.
          WebkitMaskImage: "none",
          maskImage: "none",
        }}
      />
    </>
  );
}

/**
 * Full-screen Blue Gel / shark power video over the gameplay screen
 * (not clipped inside dice). Loop for power mode; once for shark bite.
 * `overGameplay` keys out the video background so only the shark shows.
 */
export function BlueGelPowerVideoScreen({
  active,
  loop = true,
  onEnded,
  onError,
  onChompProgress,
  zIndex = 45,
  /** When true, key out the video background so the shark swims over gameplay. */
  overGameplay = false,
  /** IndexedDB slot — defaults to chomp clip. */
  videoKey = VIDEO_KEYS.BLUE_GEL_POWER,
  /** auto = upload or catalog; catalog = shipped blue_gel_power.mp4; local = upload only. */
  videoSource = "auto",
  /** When false (intro swim-in), skip chomp sync and end fade. */
  syncChomp = true,
  /** Extra wrapper opacity (e.g. intro→chomp crossfade). */
  layerOpacity = 1,
  /** Nest inside a parent fixed layer instead of creating another fixed root. */
  containInParent = false,
  /** Shark-bite queue: play the whole clip — no stopAt trim or progress fade. */
  playFullClip = false,
  /** Last beat in a shark-bite queue — allow exit pan when the clip ends. */
  isSequenceEnd = false,
}) {
  const url = useSharkBiteVideoUrl(videoKey, active, videoSource);
  const biteSettings = useSharkBiteSettings();
  const isIntro = videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO;
  // Intro swim-in MUST use introOffsetX (fraction of viewport, + = right).
  // Passed into ChromaKeyVideo as layoutOffsetX → drawX += outW * layoutOffsetX.
  const layoutOffsetX = isIntro
    ? Number(biteSettings.introOffsetX ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetX) || 0
    : Number(biteSettings.offsetX ?? DEFAULT_SHARK_BITE_SETTINGS.offsetX) || 0;
  const layoutOffsetY = isIntro
    ? Number(biteSettings.introOffsetY ?? DEFAULT_SHARK_BITE_SETTINGS.introOffsetY) || 0
    : Number(biteSettings.offsetY ?? DEFAULT_SHARK_BITE_SETTINGS.offsetY) || 0;
  const startAt = isIntro
    ? biteSettings.introStartAtSeconds ?? 0
    : biteSettings.startAtSeconds ?? 0;
  const stopAt = playFullClip
    ? 1
    : isIntro
      ? biteSettings.introStopAtProgress ?? 1
      : biteSettings.stopAtProgress ?? SHARK_BITE_STOP_AT_PROGRESS;
  const [failed, setFailed] = React.useState(false);
  const [fadeOpacity, setFadeOpacity] = React.useState(1);
  const chompSent = React.useRef(false);
  const endedSent = React.useRef(false);

  React.useEffect(() => {
    setFailed(false);
    setFadeOpacity(1);
    chompSent.current = false;
    endedSent.current = false;
  }, [url, active, videoKey]);

  const finishOnce = React.useCallback(() => {
    if (loop || endedSent.current) return;
    endedSent.current = true;
    if (!(playFullClip && !syncChomp)) setFadeOpacity(0);
    onEnded?.();
  }, [loop, onEnded, playFullClip, syncChomp]);

  const handleChompProgress = React.useCallback(
    (video) => {
      if (loop || !syncChomp) return;
      if (!video?.duration || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const p = sharkBiteClipProgress(video, startAt);
      const chompAt = biteSettings.chompProgress ?? SHARK_BITE_CHOMP_PROGRESS;
      const fadeAt = biteSettings.fadeStart ?? SHARK_BITE_FADE_START;
      if (p >= chompAt && !chompSent.current) {
        chompSent.current = true;
        onChompProgress?.();
      }
      if (!playFullClip) {
        if (p >= fadeAt) {
          const t = (p - fadeAt) / Math.max(0.001, 1 - fadeAt);
          setFadeOpacity(Math.max(0, 1 - t));
        } else {
          setFadeOpacity(1);
        }
      }
    },
    [loop, syncChomp, playFullClip, onChompProgress, biteSettings, startAt]
  );

  const handlePlainVideoTimeUpdate = React.useCallback(
    (video) => {
      handleChompProgress(video);
      if (loop || endedSent.current) return;
      if (!video?.duration || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const p = sharkBiteClipProgress(video, startAt);
      if (stopAt < 1 && p >= stopAt) {
        video.pause();
        finishOnce();
      }
    },
    [loop, handleChompProgress, stopAt, finishOnce, startAt]
  );

  const handleError = React.useCallback(() => {
    setFailed(true);
    onError?.();
  }, [onError]);

  if (!active || !url || failed) return null;

  const biteOverlay = overGameplay && !loop;
  const fadeAt = playFullClip
    ? null
    : syncChomp
      ? biteSettings.fadeStart ?? SHARK_BITE_FADE_START
      : null;
  // Chomp beat: no side-slide enter (user: second shark must not pan in from the side).
  // Intro swim-in still pans fully off-edge so beat 1 clears before beat 2.
  const isChompBeat = !!syncChomp && !isIntro;
  const skipExitPan =
    overGameplay && !loop
      ? isChompBeat
      : playFullClip
        ? !!(isSequenceEnd && isChompBeat)
        : !syncChomp;
  const enterFromSide = false;
  // Hold end frame only when exit pan is intentionally skipped (fullscreen chomp).
  const holdEndFrame = playFullClip && skipExitPan;

  const rootClass = containInParent
    ? "absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
    : "fixed inset-0 w-screen h-screen h-[100dvh] max-w-none max-h-none overflow-hidden pointer-events-none";

  return (
    <AnimatePresence>
      <motion.div
        key={`blue-gel-power-video-${loop ? "loop" : "once"}`}
        className={rootClass}
        style={{
          zIndex,
          background: "transparent",
          opacity: layerOpacity,
          ...(containInParent
            ? {}
            : {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100dvh",
                maxWidth: "none",
                maxHeight: "none",
              }),
        }}
        initial={{ opacity: containInParent ? layerOpacity : 0 }}
        animate={{ opacity: layerOpacity }}
        exit={{ opacity: 0 }}
        transition={{ duration: containInParent ? 0 : 0.2 }}
      >
        {overGameplay ? (
          <ChromaKeyVideo
            src={url}
            loop={loop}
            fadeOpacity={fadeOpacity}
            fadeOutFrom={loop ? null : fadeAt}
            fullViewport={biteOverlay || overGameplay}
            layoutOffsetX={layoutOffsetX}
            layoutOffsetY={layoutOffsetY}
            rotationSlot={isIntro ? "intro" : "chomp"}
            rotationSource={videoSource === "auto" ? null : videoSource}
            playbackStartAtSeconds={startAt}
            playbackStopAtProgress={stopAt}
            skipExitPan={skipExitPan}
            enterFromSide={enterFromSide}
            stripBackgroundPlate={isChompBeat}
            holdOnEnded={holdEndFrame}
            onTimeUpdate={handleChompProgress}
            onEnded={() => {
              if (!loop) finishOnce();
            }}
            onError={handleError}
            className="w-full h-full"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 overflow-hidden">
              <video
                key={url}
                src={url}
                autoPlay
                loop={loop}
                muted
                playsInline
                preload="auto"
                onTimeUpdate={(e) => handlePlainVideoTimeUpdate(e.currentTarget)}
                onEnded={() => {
                  if (!loop) finishOnce();
                }}
                onError={handleError}
                className="absolute inset-0 w-full h-full"
                style={{
                  opacity: fadeOpacity,
                  ...getSharkBitePreviewVideoStyle(biteSettings, isIntro ? "intro" : "chomp"),
                }}
              />
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** Last-resort cap if a clip never fires ended (e.g. corrupt upload). */
const SHARK_BITE_ABSOLUTE_MAX_MS = 90000;

/**
 * Full-screen shark bite: optional intro → chomp (local upload or catalog fallback),
 * or SVG when no video is available. Never stacks catalog before uploads.
 */
export function SharkBiteScreenFX({ active, onChomp, onComplete }) {
  const [phase, setPhase] = React.useState(null); // null | "video" | "svg"
  const [beatIndex, setBeatIndex] = React.useState(0);
  const [swim, setSwim] = React.useState(false);
  const [chomping, setChomping] = React.useState(false);
  /** Full-screen black takeover once the jaws close (chomp beat / SVG chomp). */
  const [screenBlackout, setScreenBlackout] = React.useState(false);
  const chompEmitted = React.useRef(false);
  const completeEmitted = React.useRef(false);
  /** Prevents the same beat from advancing twice (double ended / remount). */
  const beatEndedRef = React.useRef(-1);
  const sequenceGenRef = React.useRef(0);
  const queueRef = React.useRef([]);
  const beatIndexRef = React.useRef(0);
  const onChompRef = React.useRef(onChomp);
  const onCompleteRef = React.useRef(onComplete);
  const trayAnchor = useGameplayDiceTrayAnchor(active);
  const biteSettings = useSharkBiteSettings();
  const biteSettingsRef = React.useRef(biteSettings);
  biteSettingsRef.current = biteSettings;
  onChompRef.current = onChomp;
  onCompleteRef.current = onComplete;

  const currentBeat = phase === "video" ? queueRef.current[beatIndex] : null;

  React.useEffect(() => {
    beatIndexRef.current = beatIndex;
  }, [beatIndex]);

  const fireChomp = React.useCallback(() => {
    if (chompEmitted.current) return;
    chompEmitted.current = true;
    const beat = queueRef.current[beatIndexRef.current];
    // Blackout on the sync-chomp beat (or SVG path where queue is empty / svg).
    // Only paint black on top of gameplay — never under a failed/transparent chroma layer.
    if (!beat || beat.syncChomp || beat.id === "svg") {
      setScreenBlackout(true);
    }
    emitSharkBiteChomp();
    onChompRef.current?.();
  }, []);

  const fireComplete = React.useCallback(() => {
    if (completeEmitted.current) return;
    completeEmitted.current = true;
    setScreenBlackout(false);
    if (interBeatTimerRef.current) {
      clearTimeout(interBeatTimerRef.current);
      interBeatTimerRef.current = null;
    }
    onCompleteRef.current?.();
  }, []);

  const advanceBeat = React.useCallback(() => {
    const next = beatIndexRef.current + 1;
    if (next >= queueRef.current.length) {
      fireComplete();
      setPhase(null);
      return;
    }
    setBeatIndex(next);
  }, [fireComplete]);

  const interBeatTimerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (interBeatTimerRef.current) clearTimeout(interBeatTimerRef.current);
    };
  }, []);

  const handleBeatEnded = React.useCallback(() => {
    const idx = beatIndexRef.current;
    // One advance per beat — blocks triple replay from double ended/exit-pan callbacks.
    if (beatEndedRef.current >= idx) return;
    beatEndedRef.current = idx;
    const beat = queueRef.current[idx];
    if (beat?.syncChomp) fireChomp();
    const next = idx + 1;
    const hasMore = next < queueRef.current.length;
    // Short pause after intro swims off before the chomp beat starts.
    const interBeatPause =
      hasMore && !beat?.syncChomp
        ? Math.max(0, Number(biteSettingsRef.current.interBeatMs) || 0)
        : 0;
    // Hold full-screen black after the chomp climax before tearing down FX.
    const blackoutHold =
      !hasMore && beat?.syncChomp
        ? Math.max(0, Number(biteSettingsRef.current.blackoutHoldMs) || 0)
        : 0;
    const pauseMs = Math.max(interBeatPause, blackoutHold);
    if (interBeatTimerRef.current) clearTimeout(interBeatTimerRef.current);
    if (pauseMs > 0) {
      interBeatTimerRef.current = setTimeout(() => {
        interBeatTimerRef.current = null;
        advanceBeat();
      }, pauseMs);
      return;
    }
    advanceBeat();
  }, [advanceBeat, fireChomp]);

  const handleBeatError = React.useCallback(() => {
    const idx = beatIndexRef.current;
    if (beatEndedRef.current >= idx) return;
    beatEndedRef.current = idx;
    // Soft fail: never leave a stuck black screen when video/chroma dies on mobile.
    setScreenBlackout(false);
    if (interBeatTimerRef.current) {
      clearTimeout(interBeatTimerRef.current);
      interBeatTimerRef.current = null;
    }
    const beat = queueRef.current[idx];
    if (beat?.syncChomp && !chompEmitted.current) {
      chompEmitted.current = true;
      emitSharkBiteChomp();
      onChompRef.current?.();
    }
    advanceBeat();
  }, [advanceBeat]);

  React.useEffect(() => {
    if (!active) {
      sequenceGenRef.current += 1;
      setPhase(null);
      setBeatIndex(0);
      setSwim(false);
      setChomping(false);
      setScreenBlackout(false);
      chompEmitted.current = false;
      completeEmitted.current = false;
      beatEndedRef.current = -1;
      queueRef.current = [];
      if (interBeatTimerRef.current) {
        clearTimeout(interBeatTimerRef.current);
        interBeatTimerRef.current = null;
      }
      return undefined;
    }

    // Start exactly one sequence per active=true — do not restart on settings churn.
    const gen = ++sequenceGenRef.current;
    chompEmitted.current = false;
    completeEmitted.current = false;
    beatEndedRef.current = -1;
    setSwim(false);
    setChomping(false);
    setScreenBlackout(false);
    setBeatIndex(0);
    setPhase(null);
    queueRef.current = [];

    let cancelled = false;

    const usesVideo =
      getCatalogChompVideoUrl() ||
      hasUploadedSharkBiteBeatSync() ||
      !!getCachedBlueGelPowerVideoObjectUrl();
    const delayMs = usesVideo ? 0 : biteSettingsRef.current.preSwimMs;

    const startT = setTimeout(() => {
      if (cancelled || sequenceGenRef.current !== gen) return;
      buildSharkBitePhaseQueue().then((queue) => {
        if (cancelled || sequenceGenRef.current !== gen) return;
        // Deduplicate identical beats — never stack the same clip twice.
        const seen = new Set();
        const unique = [];
        for (const beat of queue) {
          const key = `${beat.id}:${beat.videoKey ?? ""}:${beat.source ?? ""}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(beat);
        }
        queueRef.current = unique;
        const first = unique[0];
        if (!first || first.id === "svg") {
          setPhase("svg");
          return;
        }
        for (const beat of unique) {
          if (beat.videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO) {
            preloadSharkBiteIntroVideo();
          } else if (beat.source === "local") {
            getLocalVideoObjectUrl(VIDEO_KEYS.BLUE_GEL_POWER);
          } else {
            preloadBlueGelPowerVideo();
          }
        }
        setPhase("video");
      });
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(startT);
    };
  }, [active]);

  // SVG timeline — only when no uploaded / catalog video is available.
  React.useEffect(() => {
    if (!active || phase !== "svg") return undefined;
    setSwim(false);
    setChomping(false);
    const svgBeat = biteSettings.svgBeatMs;
    const svgTotal = biteSettings.svgBeatMs + biteSettings.fxMs;
    const swimT = setTimeout(() => setSwim(true), svgBeat);
    const doneT = setTimeout(() => fireComplete(), svgTotal);
    return () => {
      clearTimeout(swimT);
      clearTimeout(doneT);
    };
  }, [active, phase, fireComplete, biteSettings.svgBeatMs, biteSettings.fxMs]);

  React.useEffect(() => {
    if (!swim || phase !== "svg") {
      setChomping(false);
      return undefined;
    }
    setChomping(false);
    // Align with SVG keyframes: re-enter completes ~0.62, then jaws close / dice vanish.
    const chompMs = Math.round(
      Math.max(biteSettings.chompMs, (biteSettings.fxMs || 3800) * 0.62)
    );
    const chompT = setTimeout(() => {
      setChomping(true);
      fireChomp();
    }, chompMs);
    const doneChomp = setTimeout(() => setChomping(false), chompMs + 900);
    return () => {
      clearTimeout(chompT);
      clearTimeout(doneChomp);
    };
  }, [swim, phase, fireChomp, biteSettings.chompMs, biteSettings.fxMs]);

  // Safety — never advance beats early; only force chomp/complete if a clip stalls.
  React.useEffect(() => {
    if (!active || phase !== "video" || !currentBeat) {
      return undefined;
    }

    const chompFallback = currentBeat.syncChomp
      ? setTimeout(() => fireChomp(), biteSettings.fallbackVanishMs)
      : null;
    const absoluteMax = setTimeout(() => {
      setScreenBlackout(false);
      fireChomp();
      fireComplete();
      setPhase(null);
    }, SHARK_BITE_ABSOLUTE_MAX_MS);
    return () => {
      if (chompFallback) clearTimeout(chompFallback);
      clearTimeout(absoluteMax);
    };
  }, [
    active,
    phase,
    currentBeat,
    beatIndex,
    fireChomp,
    fireComplete,
    biteSettings.fallbackVanishMs,
  ]);

  if (!active || !phase) return null;

  const blackoutOverlay = (
    <AnimatePresence>
      {screenBlackout ? (
        <motion.div
          key="shark-bite-screen-blackout"
          className="fixed inset-0 w-screen h-screen h-[100dvh] max-w-none max-h-none bg-black pointer-events-none"
          style={{
            zIndex: 56,
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100dvh",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: "easeIn" }}
          aria-hidden
        />
      ) : null}
    </AnimatePresence>
  );

  if (phase === "video" && currentBeat) {
    const beatKey = `${beatIndex}-${currentBeat.id}-${currentBeat.source ?? "auto"}`;
    const isLastBeat = beatIndex >= queueRef.current.length - 1;
    return portalToViewport(
      <>
        {/* Full-screen black only via blackoutOverlay (z56) after jaws close —
            never a layer under the chroma canvas (that read as a stuck black
            phone screen when the shark was off-frame / keyed out). */}
        <BlueGelPowerVideoScreen
          key={beatKey}
          active
          loop={false}
          overGameplay
          playFullClip
          isSequenceEnd={isLastBeat}
          syncChomp={!!currentBeat.syncChomp}
          videoKey={currentBeat.videoKey ?? VIDEO_KEYS.BLUE_GEL_POWER}
          videoSource={currentBeat.source ?? "auto"}
          zIndex={55}
          onChompProgress={currentBeat.syncChomp ? fireChomp : undefined}
          onEnded={handleBeatEnded}
          onError={handleBeatError}
        />
        {blackoutOverlay}
      </>
    );
  }

  const layout = getSharkBiteLayout(trayAnchor, biteSettings.offsetX);
  const { anchor, sharkW, sharkH, baseLeft, chompTop, chompDip, offLeft, offRight } = layout;
  const fxSecRaw = biteSettings.fxMs / 1000;
  const fxSec = Number.isFinite(fxSecRaw) ? Math.max(0.001, fxSecRaw) : 0.001;

  return portalToViewport(
    <AnimatePresence>
      {swim ? (
        <motion.div
          key="shark-bite-screen"
          className="fixed inset-0 w-screen h-screen h-[100dvh] z-[55] overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute"
            style={{
              left: baseLeft,
              top: chompTop,
              width: sharkW,
              height: sharkH,
              filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.65))",
            }}
            initial={{ x: offLeft, y: -chompDip, opacity: 0 }}
            animate={{
              // Swim across → exit off-screen → re-enter from opposite side → eat over tray.
              x: [offLeft, 0, offRight, offRight * 1.05, offLeft, 0, offRight * 0.08],
              y: [-chompDip, 0, -chompDip * 0.35, -chompDip * 0.35, -chompDip, 0, 0],
              opacity: [0, 1, 1, 0, 0, 1, 1],
              scale: chomping ? [1, 1, 1, 1, 1, 1.12, 1.04] : 1,
            }}
            transition={{
              duration: fxSec,
              times: [0, 0.18, 0.36, 0.4, 0.42, 0.62, 1],
              ease: "easeInOut",
            }}
          >
            <SharkSvg chomping={chomping} />
          </motion.div>

          {chomping ? (
            <motion.div
              className="fixed text-5xl sm:text-7xl font-black text-rose-400 pointer-events-none"
              style={{
                left: anchor.x,
                top: anchor.y - 24,
                transform: "translate(-50%, -50%)",
                textShadow: "0 0 24px rgba(248,113,113,0.8)",
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.25, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.85 }}
            >
              CHOMP!
            </motion.div>
          ) : null}
        </motion.div>
      ) : null}
      {blackoutOverlay}
    </AnimatePresence>
  );
}

/**
 * Blue Gel Shark Bite power-mode charge (OWN power) — fish stay alive.
 * Hunting cyan water / bubbles. Not Feeding Frenzy (that eats the fish).
 */
export function BlueGelSharkBiteCharge({ size, radius, count = 1, dieSeed = 0, children }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        borderRadius: radius,
        zIndex: 0,
        transform: "translateZ(0)",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        maskImage: "radial-gradient(white, black)",
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: radius }}
        animate={{
          background: [
            "radial-gradient(ellipse at 50% 40%, rgba(14,165,233,0.28) 0%, transparent 62%)",
            "radial-gradient(ellipse at 45% 35%, rgba(6,182,212,0.4) 0%, transparent 65%)",
            "radial-gradient(ellipse at 50% 40%, rgba(14,165,233,0.28) 0%, transparent 62%)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0">{children}</div>
      <AquariumBubbles
        size={size}
        count={count}
        dieSeed={dieSeed}
        theme="clear"
        density="normal"
        salt="shark-bite-charge"
        riseMult={1.25}
        speedScale={1.35}
      />
    </div>
  );
}

/**
 * Shark Tank's in-die aquarium — mostly great whites + seeded orcas,
 * rare tiger/hammerhead, seeded swim paths, and occasional rivalry attacks.
 */
export function SharkTankOverlay({
  size,
  radius,
  count = 1,
  dieSeed = 0,
  frozen = false,
  powerMode = false,
}) {
  const tankSize = Number(size) || 64;
  const requestedCount = Math.floor(Number(count));
  const sharkCount = Math.max(
    1,
    Math.min(6, Number.isFinite(requestedCount) ? requestedCount : 1)
  );
  const sharks = React.useMemo(
    () => buildSharkTankCreatures(sharkCount, dieSeed, powerMode && !frozen),
    [sharkCount, dieSeed, powerMode, frozen]
  );
  const { attack, bloodVisible, skeleton } = useSharkTankRivalry({
    active: !frozen && sharkCount >= 2,
    dieSeed,
    sharkCount,
  });
  const biteLanded = Boolean(attack?.biteLanded);
  const skeletonTop =
    skeleton != null
      ? Number(sharks[skeleton.victimIdx]?.top) || 42
      : 42;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      data-shark-overlay="tank"
      style={{
        borderRadius: radius,
        // iOS Safari: overflow:hidden + border-radius fails to clip transformed
        // Framer Motion children — sharks leak out of the die and look huge/stuck.
        zIndex: 0,
        transform: "translateZ(0)",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        maskImage: "radial-gradient(white, black)",
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 28% 18%, rgba(148,163,184,0.18) 0%, transparent 44%), radial-gradient(ellipse at 72% 78%, rgba(8,145,178,0.28) 0%, transparent 54%), radial-gradient(ellipse at 50% 100%, rgba(15,23,42,0.35) 0%, transparent 62%)",
        }}
      />

      {!frozen ? (
        <AquariumBubbles
          size={tankSize}
          count={sharkCount}
          dieSeed={dieSeed}
          theme={bloodVisible ? "blood" : "shark"}
          density="normal"
          salt={bloodVisible ? "shark-tank-blood" : "shark-tank"}
          riseMult={1.15}
        />
      ) : null}

      {sharks.map((shark, index) => {
        const isAttacker = attack?.attackerIdx === index;
        const isVictim = attack?.victimIdx === index;
        const victimTop = isAttacker ? sharks[attack.victimIdx]?.top : shark.top;
        const lungeLaneDelta = isAttacker ? (Number(victimTop) || 40) - shark.top : 0;
        return (
          <SwimmingShark
            key={shark.id}
            size={tankSize}
            top={shark.top}
            duration={shark.duration}
            delay={shark.delay}
            dir={shark.dir}
            scale={shark.scale}
            variant={shark.variant}
            frozen={frozen}
            chomping={shark.chomping || isAttacker}
            showTeeth={shark.showTeeth}
            scary={shark.scary || isAttacker}
            pathStyle={shark.pathStyle}
            swayFrac={shark.swayFrac}
            bodyRoll={shark.bodyRoll}
            attacking={isAttacker}
            telegraphing={isVictim && !biteLanded}
            recoiling={isVictim && biteLanded}
            attackKey={attack?.id || 0}
            lungeLaneDelta={lungeLaneDelta}
          />
        );
      })}

      {!frozen && skeleton ? (
        <SharkTankFishSkeleton
          size={tankSize}
          topPct={skeletonTop}
          driftDir={skeleton.driftDir}
          animKey={skeleton.id}
        />
      ) : null}

      <SharkTankBloodFlash
        size={tankSize}
        radius={radius}
        active={bloodVisible && !frozen}
        count={sharkCount}
        dieSeed={dieSeed}
      />
    </div>
  );
}

/**
 * Feeding Frenzy — in-die sharks eat fish when an opponent's Shark Bite
 * targets aquarium / Blue Gel dice. Not Blue Gel's own power-mode charge.
 */
export function BlueGelSharkAttack({
  size,
  radius,
  count = 1,
  bigFishVariantIndex = 0,
  children,
  onSettled,
}) {
  // wait | bubbling | enter | feast | bubble1 | bubble2 | bubble3 | normal
  const [phase, setPhase] = React.useState("wait");
  const settledRef = React.useRef(false);
  const onSettledRef = React.useRef(onSettled);
  onSettledRef.current = onSettled;
  const dir = bigFishVariantIndex % 2 === 0 ? 1 : -1;
  const staggerSec = (bigFishVariantIndex % 6) * 0.12;
  const staggerMs = staggerSec * 1000;

  React.useEffect(() => {
    setPhase("wait");
    settledRef.current = false;
    const releaseAudio = acquireBlueGelSharkAudio();
    const timers = [
      setTimeout(() => setPhase("bubbling"), BLUE_GEL_BUBBLE_MS),
      setTimeout(() => setPhase("enter"), BLUE_GEL_SHARK_ENTER_MS + staggerMs),
      setTimeout(() => setPhase("feast"), BLUE_GEL_FEAST_AT_MS + staggerMs),
      setTimeout(() => setPhase("bubble1"), BLUE_GEL_AFTERMATH_MS + staggerMs),
      setTimeout(() => setPhase("bubble2"), BLUE_GEL_AFTERMATH_MS + BLUE_GEL_BUBBLE_WAVE_MS + staggerMs),
      setTimeout(
        () => setPhase("bubble3"),
        BLUE_GEL_AFTERMATH_MS + BLUE_GEL_BUBBLE_WAVE_MS * 2 + staggerMs
      ),
      setTimeout(() => setPhase("normal"), BLUE_GEL_NORMAL_MS + staggerMs),
    ];
    return () => {
      timers.forEach(clearTimeout);
      releaseAudio();
    };
  }, [staggerMs, count]);

  React.useEffect(() => {
    if (phase !== "normal" || settledRef.current) return;
    settledRef.current = true;
    onSettledRef.current?.();
  }, [phase]);

  // Original shark path: visible through enter/feast, exits on first bubble wave
  const sharkVisible = phase === "enter" || phase === "feast" || phase === "bubble1";
  const waterRed =
    phase === "feast" ||
    phase === "bubble1" ||
    phase === "bubble2" ||
    phase === "bubble3" ||
    phase === "normal";
  const bloodWaterBg =
    phase === "normal" ? BLUE_GEL_BLOOD_WATER_SETTLED : BLUE_GEL_BLOOD_WATER;

  const feastSeed = bigFishVariantIndex * 97 + count * 13;
  const explicitBubbleCount =
    phase === "bubbling"
      ? 48
      : phase === "enter"
        ? 36
        : phase === "feast"
          ? 28
          : phase === "bubble1"
            ? 44
            : phase === "bubble2"
              ? 30
              : phase === "bubble3"
                ? 18
                : phase === "normal"
                  ? aquariumBubbleCount(count)
                  : 0;

  const bubbleSpeedScale =
    phase === "normal" ? 1 : phase === "bubble3" ? 1.65 : phase === "bubble2" ? 2.1 : 2.6;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        borderRadius: radius,
        zIndex: 0,
        transform: "translateZ(0)",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        maskImage: "radial-gradient(white, black)",
      }}
    >
      {/* Water tint — goes bloody after the eat and stays red */}
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: radius }}
        animate={{
          background: waterRed ? bloodWaterBg : BLUE_GEL_WATER_IDLE,
        }}
        transition={{ duration: waterRed ? 0.85 : 0.35, ease: "easeOut" }}
      />

      {/* Fish layer — shrink/vanish when eaten */}
      <motion.div
        className="absolute inset-0"
        animate={
          phase === "wait" || phase === "bubbling" || phase === "enter"
            ? { opacity: 1, scale: 1 }
            : phase === "feast"
              ? { opacity: [1, 0.4, 0], scale: [1, 0.7, 0.15] }
              : { opacity: 0, scale: 0 }
        }
        transition={{ duration: phase === "feast" ? 0.85 : 0.3, ease: "easeIn" }}
      >
        {children}
      </motion.div>

      {/* Shark fly-through — original swim path */}
      {sharkVisible ? (
        <motion.div
          className="absolute"
          style={{
            top: "28%",
            width: size * 0.95,
            height: size * 0.48,
            left: 0,
          }}
          initial={{
            x: dir === 1 ? -size * 1.1 : size * 1.1,
            scaleX: dir === 1 ? 1 : -1,
            opacity: 0,
          }}
          animate={{
            x:
              phase === "bubble1"
                ? dir === 1
                  ? size * 1.2
                  : -size * 1.2
                : dir === 1
                  ? [-size * 1.1, size * 0.05, size * 0.15]
                  : [size * 1.1, size * 0.05, -size * 0.05],
            opacity: phase === "bubble1" ? [1, 0] : [0, 1, 1],
            scaleX: dir === 1 ? 1 : -1,
          }}
          transition={{
            duration: phase === "bubble1" ? 0.7 : 1.4,
            delay: 0,
            ease: "easeInOut",
          }}
        >
          <SharkSvg chomping={phase === "feast"} />
        </motion.div>
      ) : null}

      {/* Bubble timers: heavy → medium → light → normal pace (water stays red) */}
      {explicitBubbleCount > 0 ? (
        <AquariumBubbles
          key={`feast-bubbles-${phase}`}
          size={size}
          count={count}
          dieSeed={feastSeed}
          theme={waterRed ? (phase === "normal" ? "bloodSettled" : "blood") : "clear"}
          salt={`feast-${phase}`}
          riseMult={1.35}
          speedScale={bubbleSpeedScale}
          explicitCount={explicitBubbleCount}
        />
      ) : null}
    </div>
  );
}

/** Permanent bloody tint + calm bubbles (rest of match after power FX settles). */
export function BloodyWaterTint({ size, radius, count = 1, dieSeed = 0 }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]" style={{ borderRadius: radius }}>
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background: BLUE_GEL_BLOOD_WATER_SETTLED,
        }}
      />
      <AquariumBubbles
        size={size}
        count={count}
        dieSeed={dieSeed}
        theme="bloodSettled"
        density="normal"
        salt="bloody-tint"
        riseMult={1.35}
      />
    </div>
  );
}

/**
 * Default power move for skins without dedicated power visuals:
 * three bubble timers → settle to bloody-red water for the rest of the game.
 */
export function BloodPowerFx({ size, radius, count = 1, locked = false, onSettled }) {
  const [phase, setPhase] = React.useState(locked ? "normal" : "bubble1");
  const settledRef = React.useRef(locked);
  const onSettledRef = React.useRef(onSettled);
  onSettledRef.current = onSettled;

  React.useEffect(() => {
    if (locked) {
      setPhase("normal");
      return undefined;
    }
    setPhase("bubble1");
    settledRef.current = false;
    const timers = [
      setTimeout(() => setPhase("bubble2"), BLUE_GEL_BUBBLE_WAVE_MS),
      setTimeout(() => setPhase("bubble3"), BLUE_GEL_BUBBLE_WAVE_MS * 2),
      setTimeout(() => setPhase("normal"), BLUE_GEL_BUBBLE_WAVE_MS * 3),
    ];
    return () => timers.forEach(clearTimeout);
  }, [locked, count]);

  React.useEffect(() => {
    if (phase !== "normal" || settledRef.current) return;
    settledRef.current = true;
    onSettledRef.current?.();
  }, [phase]);

  if (phase === "normal" || locked) {
    return <BloodyWaterTint size={size} radius={radius} count={count} />;
  }

  const explicitCount = phase === "bubble1" ? 44 : phase === "bubble2" ? 30 : 18;
  const speedScale = phase === "bubble3" ? 1.65 : phase === "bubble2" ? 2.1 : 2.6;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]" style={{ borderRadius: radius }}>
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: radius }}
        animate={{
          background: BLUE_GEL_BLOOD_WATER,
        }}
        transition={{ duration: 0.5 }}
      />
      <AquariumBubbles
        key={`bp-${phase}`}
        size={size}
        count={count}
        dieSeed={count * 41}
        theme="blood"
        salt={`blood-power-${phase}`}
        riseMult={1.35}
        speedScale={speedScale}
        explicitCount={explicitCount}
      />
    </div>
  );
}
