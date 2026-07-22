import React from "react";
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
  preloadBlueGelPowerVideo,
  subscribeBlueGelPowerVideo,
} from "@/lib/blueGelPowerVideo";
import {
  loadBlueGelChromaSettings,
  subscribeBlueGelChromaSettings,
  hexToRgb,
} from "@/lib/blueGelChromaSettings";

/** Live-updating chroma-key settings for the shark video. */
export function useBlueGelChromaSettings() {
  const [settings, setSettings] = React.useState(() => loadBlueGelChromaSettings());
  React.useEffect(() => subscribeBlueGelChromaSettings(setSettings), []);
  return settings;
}

/** CustomEvent name — DiceTray listens so tray dice vanish on chomp. */
export const SHARK_BITE_CHOMP_EVENT = "yourneek:shark-bite-chomp";

/** Ms from SVG swim start until the shark chomps (sync tray dice vanish). */
export const SHARK_BITE_CHOMP_MS = 1750;
/** Full-screen SVG swim duration — long enough to fully exit off-screen. */
export const SHARK_BITE_FX_MS = 3800;
/**
 * Short beat so the gameplay screen is still visible when the shark
 * flies over it (does not wait for the in-die feast).
 */
export const SHARK_BITE_PRE_SWIM_MS = 280;
/** Brief beat after mode resolves before SVG swim begins. */
export const SHARK_BITE_SVG_BEAT_MS = 80;
/** Total SVG sharkBiteFx lifetime after screen starts: beat → swim → clear. */
export const SHARK_BITE_TOTAL_MS = SHARK_BITE_SVG_BEAT_MS + SHARK_BITE_FX_MS;
/** Safety timeout if chomp event never fires (video or SVG). */
export const SHARK_BITE_FALLBACK_VANISH_MS = 10000;
/**
 * Progress through the bite clip when tray dice should vanish.
 * Catalog clip (~7s): jaws peak open ~0.78–0.80 — vanish just as the bite hits.
 */
export const SHARK_BITE_CHOMP_PROGRESS = 0.78;
/** Only kill the plate at the very end — earlier fades look like mid-screen cutoff. */
export const SHARK_BITE_FADE_START = 0.94;
/** Soft fade band (px at process res) so the video rect never shows a hard edge/line. */
const CHROMA_EDGE_FEATHER_PX = 36;
/** Nudge full-viewport shark clip right (fraction of viewport width) for jaw/tray align. */
const SHARK_BITE_VIDEO_OFFSET_X = 0.18;
/** Late-clip slide so the shark finishes exiting off the right edge. */
const SHARK_BITE_EXIT_PAN_START = 0.88;

/** Calm blue-gel water before the shark feast. */
const BLUE_GEL_WATER_IDLE =
  "radial-gradient(ellipse at 50% 40%, rgba(14,116,144,0.15) 0%, transparent 60%)";

/** Bloody water while the feast aftermath bubbles play out. */
const BLUE_GEL_BLOOD_WATER =
  "radial-gradient(ellipse at 50% 38%, rgba(185,22,22,0.78) 0%, rgba(48,6,6,0.68) 58%, rgba(12,1,1,0.72) 100%)";

/** Darker crimson once the feast settles — rest of the match. */
const BLUE_GEL_BLOOD_WATER_SETTLED =
  "radial-gradient(ellipse at 50% 36%, rgba(210,12,12,0.88) 0%, rgba(38,4,4,0.82) 52%, rgba(8,0,0,0.9) 100%)";

const BLUE_GEL_BLOOD_BUBBLE =
  "radial-gradient(circle at 30% 30%, rgba(252,165,165,0.9), rgba(110,10,10,0.58))";

const BLUE_GEL_BLOOD_BUBBLE_SETTLED =
  "radial-gradient(circle at 30% 30%, rgba(248,113,113,0.82), rgba(90,8,8,0.62))";

export function emitSharkBiteChomp() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SHARK_BITE_CHOMP_EVENT));
}

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
        setAnchor({
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.72,
          w: Math.min(window.innerWidth * 0.88, 420),
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
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active]);

  return anchor;
}

/** Live dice-tray center — used to dip the jaw onto the dice at chomp. */
function getSharkBiteLayout(trayAnchor) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const anchor = trayAnchor ?? {
    x: vw * 0.5,
    y: vh * 0.72,
    w: Math.min(vw * 0.88, 420),
    h: 140,
  };

  // Big, dramatic shark — dominates the middle of the screen (nudged right for tray).
  const sharkW = Math.min(vw * 0.98, 860);
  const sharkH = sharkW * 0.5;
  const screenCx = vw * 0.5 + vw * SHARK_BITE_VIDEO_OFFSET_X;
  const screenCy = vh * 0.47;

  // Center the whole shark on screen; dip at chomp so the jaw reaches the dice tray.
  const baseLeft = screenCx - sharkW / 2;
  const baseTop = screenCy - sharkH / 2;
  const mouthY = baseTop + sharkH * 0.58;
  const chompDip = Math.min(Math.max(anchor.y - mouthY + 12, 28), sharkH * 0.28);
  const chompTop = baseTop + chompDip;

  return {
    anchor,
    sharkW,
    sharkH,
    baseLeft,
    baseTop,
    chompTop,
    chompDip,
    offLeft: -(baseLeft + sharkW + 64),
    offRight: vw - baseLeft + sharkW + 120,
  };
}

/** Resolve blue_gel_power: local upload blob, else catalog /assets/blue_gel_power.mp4. */
export function useBlueGelPowerVideoUrl(enabled = true) {
  const [url, setUrl] = React.useState(() =>
    enabled ? getCachedBlueGelPowerVideoObjectUrl() : null
  );
  React.useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return undefined;
    }
    let cancelled = false;
    preloadBlueGelPowerVideo().then((next) => {
      if (!cancelled) setUrl(next);
    });
    const unsub = subscribeBlueGelPowerVideo((next) => {
      if (!cancelled) {
        // Prefer live upload; fall back to catalog path when cleared.
        setUrl(next || getCachedBlueGelPowerVideoObjectUrl());
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [enabled]);
  return url;
}

function SharkSvg({ chomping, size = "100%" }) {
  return (
    <svg viewBox="0 0 96 48" width={size} height={size} style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.55))" }}>
      {/* Body */}
      <path
        d="M 8 26 Q 28 8 56 14 Q 78 18 88 24 Q 78 34 54 36 Q 28 40 8 26 Z"
        fill="#64748b"
      />
      <path d="M 20 18 Q 48 10 70 18" stroke="#94a3b8" strokeWidth="4" fill="none" opacity="0.45" />
      {/* Dorsal */}
      <path d="M 44 14 L 52 0 L 58 16 Z" fill="#475569" />
      {/* Tail */}
      <path d="M 8 26 L -4 10 L 2 26 L -4 40 Z" fill="#475569" />
      {/* Belly */}
      <ellipse cx="52" cy="30" rx="18" ry="5" fill="#cbd5e1" opacity="0.55" />
      {/* Eye */}
      <circle cx="74" cy="20" r="2.4" fill="#0f172a" />
      <circle cx="74.6" cy="19.5" r="0.7" fill="white" />
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
      {chomping && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 0] }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          {[72, 76, 80, 84].map((x) => (
            <path key={x} d={`M ${x} 27 L ${x + 1.5} 32 L ${x + 3} 27 Z`} fill="white" />
          ))}
        </motion.g>
      )}
    </svg>
  );
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
}) {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const keyColorRef = React.useRef(null);
  const fadeOpacityRef = React.useRef(fadeOpacity);
  const fadeOutFromRef = React.useRef(fadeOutFrom);
  const settings = useBlueGelChromaSettings();
  const settingsRef = React.useRef(settings);
  fadeOpacityRef.current = fadeOpacity;
  fadeOutFromRef.current = fadeOutFrom;

  // Live settings without restarting the render loop. Re-sample when the key
  // mode / color changes so the preview updates immediately.
  React.useEffect(() => {
    settingsRef.current = settings;
    keyColorRef.current = null;
  }, [settings]);

  React.useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return undefined;

    let cancelled = false;
    let rafId = null;
    let vfcId = null;
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

      // Process at clip resolution (capped).
      const scale = Math.min(1, MAX_W / vw);
      const fw = Math.round(vw * scale);
      const fh = Math.round(vh * scale);
      if (work.width !== fw || work.height !== fh) {
        work.width = fw;
        work.height = fh;
      }

      wctx.drawImage(video, 0, 0, fw, fh);

      const cfg = settingsRef.current;
      let endFade = 1;
      const fadeFrom = fadeOutFromRef.current;
      if (!loop && fadeFrom != null && video.duration > 0) {
        const p = video.currentTime / video.duration;
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
        outW = Math.max(1, Math.round(window.innerWidth * dpr));
        outH = Math.max(1, Math.round(window.innerHeight * dpr));
        // Cover-ish so the shark fills the tray; slight overscale avoids letterbox plate.
        const fit = Math.min(outW / fw, outH / fh) * 1.08;
        drawW = fw * fit;
        drawH = fh * fit;
        drawX = (outW - drawW) / 2 + outW * SHARK_BITE_VIDEO_OFFSET_X;
        drawY = Math.max(0, outH - drawH - outH * 0.01);
        // Late exit pan — clip ends mid-shark; keep sliding right until fully off-screen.
        if (!loop && video.duration > 0) {
          const p = video.currentTime / video.duration;
          if (p >= SHARK_BITE_EXIT_PAN_START) {
            const t = (p - SHARK_BITE_EXIT_PAN_START) / Math.max(0.001, 1 - SHARK_BITE_EXIT_PAN_START);
            drawX += outW * (0.15 + 0.95 * t);
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

      // Keying disabled — show the raw frame.
      if (cfg && cfg.enabled === false) {
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
      const inner = cfg?.tolerance ?? 72;
      const soft = cfg?.softness ?? 48;
      const outer = inner + soft;
      const lumaCut = cfg?.lumaThreshold ?? 38;
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (keyIsDark && luma <= lumaCut && chroma <= 22) {
          data[i + 3] = 0;
          continue;
        }
        if (keyIsDark && luma <= lumaCut + 14 && chroma <= 12) {
          data[i + 3] = 0;
          continue;
        }
        const dr = r - key.r;
        const dg = g - key.g;
        const db = b - key.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        let alpha = data[i + 3];
        if (dist < inner) {
          if (!keyIsDark || luma < 70) alpha = 0;
        } else if (dist < outer) {
          if (!keyIsDark || luma < 85) {
            alpha = Math.round((alpha * (dist - inner)) / (outer - inner));
          }
        }
        if (alpha > 0 && alpha < 18 && keyIsDark && luma < 55 && chroma < 20) {
          alpha = 0;
        }
        data[i + 3] = alpha;
      }
      featherFrameEdges(data, fw, fh);
      wctx.putImageData(frame, 0, 0);

      blit(work);
      onTimeUpdate?.(video);
      scheduleNext();
    };

    const scheduleNext = () => {
      if (cancelled) return;
      if (typeof video.requestVideoFrameCallback === "function") {
        vfcId = video.requestVideoFrameCallback(() => renderFrame());
      } else {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    const handleTime = () => onTimeUpdate?.(video);
    const handleEnded = () => {
      // Hold the last frame and finish sliding off-screen so the shark
      // never "cuts off" mid-viewport when the clip ends early.
      if (!fullViewport || !lastBlit.ready) {
        canvas.style.opacity = "0";
        octx.clearRect(0, 0, canvas.width, canvas.height);
        onEnded?.();
        return;
      }
      let start = null;
      const EXIT_MS = 560;
      const baseX = lastBlit.drawX;
      const { drawY: by, drawW: bw, drawH: bh } = lastBlit;
      const step = (ts) => {
        if (cancelled) return;
        if (start == null) start = ts;
        const t = Math.min(1, (ts - start) / EXIT_MS);
        octx.clearRect(0, 0, canvas.width, canvas.height);
        const slide = canvas.width * 1.15 * t;
        octx.drawImage(work, baseX + slide, by, bw, bh);
        canvas.style.opacity = String(Math.max(0, 1 - t * t));
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          octx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.opacity = "0";
          onEnded?.();
        }
      };
      rafId = requestAnimationFrame(step);
    };
    const handleError = () => onError?.();

    const onResize = () => {
      // Next frame recalculates full-viewport canvas size.
    };
    if (fullViewport) window.addEventListener("resize", onResize);

    video.addEventListener("timeupdate", handleTime);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    video.muted = true;
    video.play().catch(() => onError?.());
    scheduleNext();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (vfcId && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(vfcId);
      }
      if (fullViewport) window.removeEventListener("resize", onResize);
      video.removeEventListener("timeupdate", handleTime);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [src, loop, fullViewport, onTimeUpdate, onEnded, onError]);

  return (
    <>
      <video
        ref={videoRef}
        key={src}
        src={src}
        loop={loop}
        muted
        playsInline
        preload="auto"
        className="absolute w-px h-px opacity-0 pointer-events-none"
        style={{ left: -9999, top: -9999 }}
      />
      <canvas
        ref={canvasRef}
        className={
          fullViewport
            ? "absolute inset-0 w-full h-full pointer-events-none"
            : className
        }
        style={{
          opacity: Math.max(0, Math.min(1, fadeOpacity)),
          filter: "none",
          background: "transparent",
          mixBlendMode: "normal",
          // Soft edge-only veil — avoid mid-screen ellipse that clips the swim-off.
          WebkitMaskImage: fullViewport
            ? "radial-gradient(ellipse 140% 120% at 55% 60%, #000 72%, transparent 100%)"
            : "linear-gradient(#000, #000)",
          maskImage: fullViewport
            ? "radial-gradient(ellipse 140% 120% at 55% 60%, #000 72%, transparent 100%)"
            : undefined,
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
}) {
  const url = useBlueGelPowerVideoUrl();
  const [failed, setFailed] = React.useState(false);
  const [fadeOpacity, setFadeOpacity] = React.useState(1);
  const chompSent = React.useRef(false);
  const endedSent = React.useRef(false);

  React.useEffect(() => {
    setFailed(false);
    setFadeOpacity(1);
    chompSent.current = false;
    endedSent.current = false;
  }, [url, active]);

  const finishOnce = React.useCallback(() => {
    if (loop || endedSent.current) return;
    endedSent.current = true;
    setFadeOpacity(0);
    onEnded?.();
  }, [loop, onEnded]);

  const handleChompProgress = React.useCallback(
    (video) => {
      if (loop) return;
      if (!video?.duration || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const p = video.currentTime / video.duration;
      if (p >= SHARK_BITE_CHOMP_PROGRESS && !chompSent.current) {
        chompSent.current = true;
        onChompProgress?.();
      }
      if (p >= SHARK_BITE_FADE_START) {
        const t = (p - SHARK_BITE_FADE_START) / Math.max(0.001, 1 - SHARK_BITE_FADE_START);
        setFadeOpacity(Math.max(0, 1 - t));
      } else {
        setFadeOpacity(1);
      }
    },
    [loop, onChompProgress]
  );

  const handleError = React.useCallback(() => {
    setFailed(true);
    onError?.();
  }, [onError]);

  if (!active || !url || failed) return null;

  const biteOverlay = overGameplay && !loop;

  return (
    <AnimatePresence>
      <motion.div
        key={`blue-gel-power-video-${loop ? "loop" : "once"}`}
        className="fixed inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
        style={{ zIndex, background: "transparent" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {overGameplay ? (
          <ChromaKeyVideo
            src={url}
            loop={loop}
            fadeOpacity={fadeOpacity}
            fadeOutFrom={loop ? null : SHARK_BITE_FADE_START}
            fullViewport={biteOverlay || overGameplay}
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
            <video
              key={url}
              src={url}
              autoPlay
              loop={loop}
              muted
              playsInline
              preload="auto"
              onTimeUpdate={(e) => handleChompProgress(e.currentTarget)}
              onEnded={() => {
                if (!loop) finishOnce();
              }}
              onError={handleError}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: fadeOpacity }}
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Full-screen shark bite: uploaded blue_gel_power video if present,
 * otherwise SVG shark swim across the screen.
 */
export function SharkBiteScreenFX({ active, onChomp, onComplete }) {
  const [mode, setMode] = React.useState(null); // null | "video" | "svg"
  const [swim, setSwim] = React.useState(false);
  const [chomping, setChomping] = React.useState(false);
  const chompEmitted = React.useRef(false);
  const onChompRef = React.useRef(onChomp);
  const onCompleteRef = React.useRef(onComplete);
  const trayAnchor = useGameplayDiceTrayAnchor(active);
  onChompRef.current = onChomp;
  onCompleteRef.current = onComplete;

  const fireChomp = React.useCallback(() => {
    if (chompEmitted.current) return;
    chompEmitted.current = true;
    emitSharkBiteChomp();
    onChompRef.current?.();
  }, []);

  const fireComplete = React.useCallback(() => {
    onCompleteRef.current?.();
  }, []);

  React.useEffect(() => {
    if (!active) {
      setMode(null);
      setSwim(false);
      setChomping(false);
      chompEmitted.current = false;
      return undefined;
    }

    chompEmitted.current = false;
    setSwim(false);
    setChomping(false);
    setMode(null);

    let cancelled = false;
    let fallback = null;
    // Wait for in-die feast (bubbles → eat → red) before full-screen chomp.
    const startT = setTimeout(() => {
      if (cancelled) return;
      const cached = getCachedBlueGelPowerVideoObjectUrl();
      if (cached) {
        setMode("video");
        return;
      }

      preloadBlueGelPowerVideo().then((url) => {
        if (cancelled) return;
        setMode(url ? "video" : "svg");
      });
      fallback = setTimeout(() => {
        if (!cancelled) setMode((m) => m ?? "svg");
      }, 450);
    }, SHARK_BITE_PRE_SWIM_MS);

    return () => {
      cancelled = true;
      clearTimeout(startT);
      if (fallback) clearTimeout(fallback);
    };
  }, [active]);

  // SVG timeline (PRE_SWIM already elapsed before mode becomes "svg")
  React.useEffect(() => {
    if (!active || mode !== "svg") return undefined;
    setSwim(false);
    setChomping(false);
    const swimT = setTimeout(() => setSwim(true), SHARK_BITE_SVG_BEAT_MS);
    const doneT = setTimeout(() => fireComplete(), SHARK_BITE_TOTAL_MS);
    return () => {
      clearTimeout(swimT);
      clearTimeout(doneT);
    };
  }, [active, mode, fireComplete]);

  React.useEffect(() => {
    if (!swim || mode !== "svg") {
      setChomping(false);
      return undefined;
    }
    setChomping(false);
    const chompT = setTimeout(() => {
      setChomping(true);
      fireChomp();
    }, SHARK_BITE_CHOMP_MS);
    const doneChomp = setTimeout(() => setChomping(false), SHARK_BITE_CHOMP_MS + 900);
    return () => {
      clearTimeout(chompT);
      clearTimeout(doneChomp);
    };
  }, [swim, mode, fireChomp]);

  // Video safety timeout (never-ending / missing onEnded)
  React.useEffect(() => {
    if (!active || mode !== "video") return undefined;
    const safety = setTimeout(() => {
      fireChomp();
      fireComplete();
    }, SHARK_BITE_FALLBACK_VANISH_MS);
    return () => clearTimeout(safety);
  }, [active, mode, fireChomp, fireComplete]);

  if (!active || !mode) return null;

  if (mode === "video") {
    return (
      <BlueGelPowerVideoScreen
        active
        loop={false}
        overGameplay
        zIndex={55}
        onChompProgress={fireChomp}
        onEnded={() => {
          fireChomp();
          // Exit pan finishes after onEnded — give it a beat before clearing FX.
          setTimeout(() => fireComplete(), 580);
        }}
        onError={() => setMode("svg")}
      />
    );
  }

  const layout = getSharkBiteLayout(trayAnchor);
  const { anchor, sharkW, sharkH, baseLeft, chompTop, chompDip, offLeft, offRight } = layout;

  return (
    <AnimatePresence>
      {swim ? (
        <motion.div
          key="shark-bite-screen"
          className="fixed inset-0 z-[55] overflow-hidden pointer-events-none"
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
              x: [offLeft, 0, offRight * 0.35, offRight],
              y: [-chompDip, 0, 0, -chompDip * 0.35],
              // Stay fully visible until past the right edge — no mid-screen vanish.
              opacity: [0, 1, 1, 1],
              scale: chomping ? [1, 1.12, 1.04] : 1,
            }}
            transition={{
              duration: SHARK_BITE_FX_MS / 1000,
              times: [0, 0.32, 0.55, 1],
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
    </AnimatePresence>
  );
}

/**
 * Blue Gel Shark Bite power-mode charge (OWN power) — fish stay alive.
 * Hunting cyan water / bubbles. Not Feeding Frenzy (that eats the fish).
 */
export function BlueGelSharkBiteCharge({ size, radius, count = 1, children }) {
  const bubbleCount = count >= 5 ? 18 : count === 4 ? 12 : 8;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: radius }}>
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
      {Array.from({ length: bubbleCount }, (_, i) => {
        const sz = size * (0.02 + (i % 5) * 0.012);
        return (
          <motion.div
            key={`sb-${i}`}
            className="absolute rounded-full"
            style={{
              width: sz,
              height: sz,
              left: `${(i * 37 + 5) % 92}%`,
              bottom: -4,
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(56,189,248,0.4))",
              border: "1px solid rgba(186,230,253,0.45)",
            }}
            animate={{ y: [0, -size * 1.25], opacity: [0, 0.9, 0], scale: [0.55, 1.1, 0.8] }}
            transition={{
              duration: 1.6 + (i % 4) * 0.2,
              repeat: Infinity,
              delay: (i * 0.05) % 1,
              ease: "easeOut",
            }}
          />
        );
      })}
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
  const bloodBubbleBg =
    phase === "normal" ? BLUE_GEL_BLOOD_BUBBLE_SETTLED : BLUE_GEL_BLOOD_BUBBLE;

  const normalBubbleCount = count >= 5 ? 22 : count === 4 ? 14 : 8;
  const bubbleCount =
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
                  ? normalBubbleCount
                  : 0;

  const bubbleSpeed =
    phase === "normal" ? 2.2 : phase === "bubble3" ? 1.35 : phase === "bubble2" ? 1.05 : 0.8;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: radius }}>
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
      {Array.from({ length: bubbleCount }, (_, i) => {
        const sz = size * (0.02 + (i % 6) * (phase === "normal" ? 0.012 : 0.016));
        return (
          <motion.div
            key={`b-${phase}-${i}`}
            className="absolute rounded-full"
            style={{
              width: sz,
              height: sz,
              left: `${(i * 37 + 3) % 94}%`,
              bottom: -4,
              background: waterRed ? bloodBubbleBg : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(125,211,252,0.35))",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
            animate={{ y: [0, -size * 1.35], opacity: [0, 0.95, 0], scale: [0.55, 1.15, 0.85] }}
            transition={{
              duration: bubbleSpeed + (i % 5) * 0.14,
              repeat: Infinity,
              delay: (i * 0.045) % 1.1,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

/** Skins with their own power video / sprite / special die FX. */
export function skinHasDedicatedPowerVisual(skin) {
  if (!skin) return false;
  if (skin.powerVideoUrl || skin.powerSpriteUrl || skin.powerDice) return true;
  if (skin.id === "blue_gel" || skin.id === "snow_globe") return true;
  return false;
}

/**
 * Legacy catch-all blood overlay — disabled.
 * Blue Gel uses BlueGelSharkAttack / BloodyWaterTint on its own path.
 * Applying this to other skins hid pips and looked like Shark Bite.
 */
export function skinUsesBloodPowerFx(_skin) {
  return false;
}

/** Permanent bloody tint + calm bubbles (rest of match after power FX settles). */
export function BloodyWaterTint({ size, radius, count = 1 }) {
  const bubbleCount = count >= 5 ? 22 : count === 4 ? 14 : 8;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]" style={{ borderRadius: radius }}>
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background: BLUE_GEL_BLOOD_WATER_SETTLED,
        }}
      />
      {Array.from({ length: bubbleCount }, (_, i) => {
        const sz = size * (0.02 + (i % 6) * 0.012);
        return (
          <motion.div
            key={`bw-${i}`}
            className="absolute rounded-full"
            style={{
              width: sz,
              height: sz,
              left: `${(i * 37 + 3) % 94}%`,
              bottom: -4,
              background: BLUE_GEL_BLOOD_BUBBLE_SETTLED,
              border: "1px solid rgba(255,255,255,0.3)",
            }}
            animate={{ y: [0, -size * 1.35], opacity: [0, 0.9, 0], scale: [0.55, 1.1, 0.85] }}
            transition={{
              duration: 2.2 + (i % 5) * 0.14,
              repeat: Infinity,
              delay: (i * 0.045) % 1.1,
              ease: "easeOut",
            }}
          />
        );
      })}
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

  const bubbleCount = phase === "bubble1" ? 44 : phase === "bubble2" ? 30 : 18;
  const bubbleSpeed = phase === "bubble3" ? 1.35 : phase === "bubble2" ? 1.05 : 0.8;

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
      {Array.from({ length: bubbleCount }, (_, i) => {
        const sz = size * (0.02 + (i % 6) * 0.016);
        return (
          <motion.div
            key={`bp-${phase}-${i}`}
            className="absolute rounded-full"
            style={{
              width: sz,
              height: sz,
              left: `${(i * 37 + 3) % 94}%`,
              bottom: -4,
              background: BLUE_GEL_BLOOD_BUBBLE,
              border: "1px solid rgba(255,255,255,0.35)",
            }}
            animate={{ y: [0, -size * 1.35], opacity: [0, 0.95, 0], scale: [0.55, 1.15, 0.85] }}
            transition={{
              duration: bubbleSpeed + (i % 5) * 0.14,
              repeat: Infinity,
              delay: (i * 0.045) % 1.1,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}
