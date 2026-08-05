import React from "react";
import { motion } from "framer-motion";

/** FNV-1a — same family as SharkVisuals / FishOverlay seeds. */
function hashSeed(...parts) {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    }
  }
  return h >>> 0;
}

function seededUnit(seed) {
  return (seed % 10000) / 10000;
}

const THEMES = {
  clear: {
    rim: (u) => `rgba(186,230,253,${(0.28 + u * 0.35).toFixed(3)})`,
    fill: (hx, hy, bright) =>
      `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,${(0.72 + bright * 0.26).toFixed(3)}), rgba(125,211,252,${(0.12 + bright * 0.28).toFixed(3)}) 55%, rgba(56,189,248,0.08) 100%)`,
  },
  shark: {
    rim: (u) => `rgba(186,230,253,${(0.22 + u * 0.32).toFixed(3)})`,
    fill: (hx, hy, bright) =>
      `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,${(0.7 + bright * 0.28).toFixed(3)}), rgba(148,163,184,${(0.1 + bright * 0.22).toFixed(3)}) 52%, rgba(8,145,178,0.1) 100%)`,
  },
  blood: {
    rim: (u) => `rgba(254,202,202,${(0.22 + u * 0.3).toFixed(3)})`,
    fill: (hx, hy, bright) =>
      `radial-gradient(circle at ${hx}% ${hy}%, rgba(252,165,165,${(0.7 + bright * 0.25).toFixed(3)}), rgba(110,10,10,${(0.28 + bright * 0.25).toFixed(3)}) 58%, rgba(69,10,10,0.12) 100%)`,
  },
  bloodSettled: {
    rim: (u) => `rgba(255,255,255,${(0.18 + u * 0.22).toFixed(3)})`,
    fill: (hx, hy, bright) =>
      `radial-gradient(circle at ${hx}% ${hy}%, rgba(254,202,202,${(0.65 + bright * 0.28).toFixed(3)}), rgba(127,29,29,${(0.3 + bright * 0.2).toFixed(3)}) 55%, rgba(69,10,10,0.15) 100%)`,
  },
};

/**
 * How many ambient bubbles for a face value.
 * Intentionally denser than the old 8/14/20 ladder.
 */
export function aquariumBubbleCount(faceValue, density = "normal") {
  const n = Math.max(1, Math.min(6, Math.floor(Number(faceValue)) || 1));
  if (density === "heavy") {
    if (n >= 5) return 40;
    if (n === 4) return 30;
    return 22;
  }
  if (density === "light") {
    if (n >= 5) return 18;
    if (n === 4) return 13;
    return 9;
  }
  // normal — Shark Tank / Blue Gel ambient
  if (n >= 5) return 32;
  if (n === 4) return 24;
  if (n >= 2) return 18;
  return 14;
}

/**
 * Build unique bubble descriptors seeded by dieSeed + index.
 * Avoids modulo ladders that make every die look copy-pasted.
 */
export function buildAquariumBubbles({
  size = 64,
  count = 1,
  dieSeed = 0,
  theme = "shark",
  density = "normal",
  salt = "ambient",
  riseMult = 1.15,
  speedScale = 1,
  explicitCount = null,
} = {}) {
  const tankSize = Number(size) || 64;
  const n =
    explicitCount != null
      ? Math.max(0, Math.floor(Number(explicitCount)) || 0)
      : aquariumBubbleCount(count, density);
  const themeCfg = THEMES[theme] || THEMES.shark;
  const layoutSeed = hashSeed(dieSeed, count, salt, theme, density);

  return Array.from({ length: n }, (_, i) => {
    const s = hashSeed(layoutSeed, "bubble", i);
    const u = (...tags) => seededUnit(hashSeed(s, ...tags));

    // Spread across width without (i * 37) % lanes — mix golden-ish stride + jitter.
    const lane = ((i * 0.6180339887) % 1) * 86 + 4 + (u("lane") - 0.5) * 10;
    const leftPct = Math.max(1.5, Math.min(96.5, lane));

    const baseScale = 0.012 + u("sz") * 0.038;
    const width = tankSize * baseScale * (0.75 + u("w") * 0.55);
    // Slight ovals / squashed spheres — not all perfect circles.
    const aspect = 0.78 + u("asp") * 0.48;
    const height = width * aspect;

    const hx = 18 + u("hx") * 48;
    const hy = 14 + u("hy") * 42;
    const bright = u("bright");
    const rimU = u("rim");
    const borderW = 0.5 + u("bw") * 1.4;
    const radiusX = 42 + u("rx") * 28;
    const radiusY = 40 + u("ry") * 32;

    const rise = tankSize * (0.95 + u("rise") * 0.45) * riseMult;
    const wobbleAmp = tankSize * (0.012 + u("wob") * 0.055);
    const wobbleSign = u("wobSign") > 0.5 ? 1 : -1;
    const midX = wobbleSign * wobbleAmp * (0.4 + u("mid") * 0.9);
    const endX = -wobbleSign * wobbleAmp * (0.2 + u("end") * 0.7);
    // Some bubbles drift more sideways mid-rise (S-curve-ish).
    const xPath =
      u("path") > 0.55
        ? [0, midX, endX * 0.4, endX]
        : [0, midX * 0.6, endX];

    const peakOpacity = 0.45 + u("op") * 0.5;
    const duration = (1.55 + u("dur") * 2.85) / Math.max(0.35, speedScale);
    const delay = u("delay") * (2.2 + (n > 20 ? 1.4 : 0.6)) + (i % 7) * 0.07;
    const bottom = -(2 + u("bot") * tankSize * 0.08);

    const scaleStart = 0.4 + u("ss") * 0.35;
    const scalePeak = 0.95 + u("sp") * 0.45;
    const scaleEnd = 0.55 + u("se") * 0.4;

    return {
      id: `aqb-${layoutSeed}-${i}`,
      leftPct,
      bottom,
      width,
      height,
      borderRadius: `${radiusX}% ${radiusY}%`,
      border: `${borderW.toFixed(2)}px solid ${themeCfg.rim(rimU)}`,
      background: themeCfg.fill(hx, hy, bright),
      boxShadow:
        u("glow") > 0.62
          ? `inset ${(-width * 0.15).toFixed(1)}px ${(-height * 0.18).toFixed(1)}px ${Math.max(1, width * 0.25).toFixed(1)}px rgba(255,255,255,${(0.25 + bright * 0.35).toFixed(3)})`
          : undefined,
      y: [0, -rise],
      x: xPath,
      opacity: [0, peakOpacity, peakOpacity * 0.85, 0],
      scale: [scaleStart, scalePeak, scaleEnd],
      duration,
      delay,
    };
  });
}

/**
 * Rising aquarium bubbles — unique per dieSeed + index.
 */
export function AquariumBubbles({
  size = 64,
  count = 1,
  dieSeed = 0,
  theme = "shark",
  density = "normal",
  salt = "ambient",
  riseMult = 1.15,
  speedScale = 1,
  explicitCount = null,
  className = "absolute rounded-full",
}) {
  const bubbles = React.useMemo(
    () =>
      buildAquariumBubbles({
        size,
        count,
        dieSeed,
        theme,
        density,
        salt,
        riseMult,
        speedScale,
        explicitCount,
      }),
    [size, count, dieSeed, theme, density, salt, riseMult, speedScale, explicitCount]
  );

  return bubbles.map((b) => (
    <motion.div
      key={b.id}
      className={className}
      style={{
        width: b.width,
        height: b.height,
        left: `${b.leftPct}%`,
        bottom: b.bottom,
        background: b.background,
        border: b.border,
        borderRadius: b.borderRadius,
        boxShadow: b.boxShadow,
      }}
      animate={{
        y: b.y,
        x: b.x,
        opacity: b.opacity,
        scale: b.scale,
      }}
      transition={{
        duration: b.duration,
        repeat: Infinity,
        delay: b.delay,
        ease: "easeOut",
        opacity: { duration: b.duration, times: [0, 0.18, 0.72, 1], ease: "easeOut" },
        scale: { duration: b.duration, times: [0, 0.45, 1], ease: "easeOut" },
        x: { duration: b.duration, ease: "easeInOut" },
        y: { duration: b.duration, ease: "easeOut" },
      }}
    />
  ));
}
