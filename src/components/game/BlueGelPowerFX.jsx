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
export const SHARK_BITE_CHOMP_MS = 1440;
/** Full-screen SVG swim duration. */
export const SHARK_BITE_FX_MS = 3200;
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
export const SHARK_BITE_FALLBACK_VANISH_MS = 8000;

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

  // Big, dramatic shark — dominates the middle of the screen.
  const sharkW = Math.min(vw * 0.98, 860);
  const sharkH = sharkW * 0.5;
  const screenCx = vw * 0.5;
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
    offRight: vw - baseLeft + 64,
  };
}

/** Resolve uploaded blue_gel_power blob URL (null if none). */
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
      if (!cancelled) setUrl(next);
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
 * with a soft edge. Works for solid-ish backgrounds (black, white, blue, green).
 */
export function ChromaKeyVideo({
  src,
  loop = false,
  onTimeUpdate,
  onEnded,
  onError,
  className = "",
}) {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const keyColorRef = React.useRef(null);
  const settings = useBlueGelChromaSettings();
  const settingsRef = React.useRef(settings);

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

    const work = document.createElement("canvas");
    const wctx = work.getContext("2d", { willReadFrequently: true });
    const octx = canvas.getContext("2d");

    // Cap processing resolution for performance; canvas is scaled up by CSS.
    const MAX_W = 640;

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

    const renderFrame = () => {
      if (cancelled) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        scheduleNext();
        return;
      }
      const scale = Math.min(1, MAX_W / vw);
      const w = Math.round(vw * scale);
      const h = Math.round(vh * scale);
      if (work.width !== w || work.height !== h) {
        work.width = w;
        work.height = h;
        canvas.width = w;
        canvas.height = h;
      }

      wctx.drawImage(video, 0, 0, w, h);

      const cfg = settingsRef.current;
      // Keying disabled — show the raw frame.
      if (cfg && cfg.enabled === false) {
        octx.clearRect(0, 0, w, h);
        octx.drawImage(work, 0, 0);
        scheduleNext();
        return;
      }

      let frame;
      try {
        frame = wctx.getImageData(0, 0, w, h);
      } catch {
        // Cross-origin / not ready — just show the raw frame.
        octx.drawImage(video, 0, 0, w, h);
        scheduleNext();
        return;
      }

      if (!keyColorRef.current) {
        keyColorRef.current =
          cfg && cfg.autoKey === false ? hexToRgb(cfg.color) : sampleKeyColor(w, h);
      }
      const key = keyColorRef.current;
      const inner = cfg?.tolerance ?? 70;
      const outer = inner + (cfg?.softness ?? 55);
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - key.r;
        const dg = data[i + 1] - key.g;
        const db = data[i + 2] - key.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < inner) {
          data[i + 3] = 0;
        } else if (dist < outer) {
          data[i + 3] = Math.round((data[i + 3] * (dist - inner)) / (outer - inner));
        }
      }
      octx.putImageData(frame, 0, 0);
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
    const handleEnded = () => onEnded?.();
    const handleError = () => onError?.();

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
      video.removeEventListener("timeupdate", handleTime);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [src, onTimeUpdate, onEnded, onError]);

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
        className={className}
        style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.55))" }}
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
  const chompSent = React.useRef(false);

  React.useEffect(() => {
    setFailed(false);
    chompSent.current = false;
  }, [url, active]);

  const handleChompProgress = React.useCallback(
    (video) => {
      if (loop || !onChompProgress) return;
      if (!video?.duration || !Number.isFinite(video.duration)) return;
      if (video.currentTime / video.duration >= 0.72 && !chompSent.current) {
        chompSent.current = true;
        onChompProgress();
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
        style={{ zIndex }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {overGameplay ? (
          <ChromaKeyVideo
            src={url}
            loop={loop}
            onTimeUpdate={handleChompProgress}
            onEnded={() => {
              if (!loop) onEnded?.();
            }}
            onError={handleError}
            className={
              biteOverlay
                ? "w-[min(98vw,860px)] h-auto max-h-[min(72vh,520px)] object-contain translate-y-6"
                : "w-full h-full object-contain"
            }
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
                if (!loop) onEnded?.();
              }}
              onError={handleError}
              className="absolute inset-0 w-full h-full object-cover"
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
          setTimeout(() => fireComplete(), 350);
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
              x: [offLeft, 0, 0, offRight],
              y: [-chompDip, 0, 0, -chompDip * 0.5],
              opacity: [0, 1, 1, 1],
              scale: chomping ? [1, 1.12, 1.04] : 1,
            }}
            transition={{
              duration: SHARK_BITE_FX_MS / 1000,
              times: [0, 0.45, 0.65, 1],
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
 * Blue Gel in-die feast (power mode + shark bite):
 * Heavy bubbles → shark swims in and eats the fish → three bubble timers →
 * calm bubbles with bloody-red water for the rest of the match.
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

/** Fallback bloody-water power FX for skins without a dedicated power visual. */
export function skinUsesBloodPowerFx(skin) {
  return !!skin && !skinHasDedicatedPowerVisual(skin);
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
