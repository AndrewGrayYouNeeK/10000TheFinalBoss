import React from "react";
import { motion } from "framer-motion";

/**
 * Fish color palettes — each entry defines the colors used by the shared Fish SVG.
 * tail/body/highlight/fin can be tuned per species.
 */
export const FISH_VARIANTS = [
  // Orange clownfish (original)
  { id: "clownfish", name: "Clownfish", tail: "#f97316", body: "#fb923c", highlight: "#fdba74", fin: "#f97316", mouth: "#ea580c", stripe: null },
  // Blue tang (Dory)
  { id: "blue_tang", name: "Blue Tang", tail: "#1d4ed8", body: "#2563eb", highlight: "#60a5fa", fin: "#facc15", mouth: "#1e3a8a", stripe: "#0f172a" },
  // Yellow tang
  { id: "yellow_tang", name: "Yellow Tang", tail: "#eab308", body: "#facc15", highlight: "#fde68a", fin: "#ca8a04", mouth: "#a16207", stripe: null },
  // Pink/coral
  { id: "coral_pink", name: "Coral Pink", tail: "#db2777", body: "#ec4899", highlight: "#f9a8d4", fin: "#be185d", mouth: "#9d174d", stripe: null },
  // Purple
  { id: "purple", name: "Purple Reef", tail: "#7c3aed", body: "#a855f7", highlight: "#d8b4fe", fin: "#6b21a8", mouth: "#581c87", stripe: null },
  // Green
  { id: "green", name: "Green Reef", tail: "#15803d", body: "#22c55e", highlight: "#86efac", fin: "#14532d", mouth: "#166534", stripe: null },
];

/** WAAPI rejects negative or non-finite durations — clamp before framer-motion → element.animate(). */
function safeAnimDuration(seconds, min = 0.001) {
  const n = Number(seconds);
  return Number.isFinite(n) ? Math.max(min, n) : min;
}

const FROZEN_TRANSITION = { duration: 0 };

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

function seededIndex(seed, max) {
  if (max <= 0) return 0;
  return seed % max;
}

export const JELLYFISH_VARIANTS = [
  { id: "jelly_violet", name: "Violet Jelly", bell: "#c4b5fd", glow: "#ede9fe", tentacle: "#a78bfa", eye: "#312e81" },
  { id: "jelly_pink", name: "Pink Jelly", bell: "#f9a8d4", glow: "#fce7f3", tentacle: "#ec4899", eye: "#831843" },
  { id: "jelly_cyan", name: "Cyan Jelly", bell: "#67e8f9", glow: "#cffafe", tentacle: "#22d3ee", eye: "#155e75" },
  { id: "jelly_lime", name: "Lime Jelly", bell: "#bef264", glow: "#ecfccb", tentacle: "#84cc16", eye: "#365314" },
];

/**
 * Real cartoon jellyfish — drifts upright with waving tentacles.
 */
export function Jellyfish({ size, top, duration, delay, dir = 1, scale = 1, variant, frozen = false }) {
  const jellySize = size * 0.32 * scale;
  const v = variant || JELLYFISH_VARIANTS[0];
  const tentacles = [14, 22, 30, 38, 46];
  const restX = dir === 1 ? size * 0.32 : size * 0.32;
  return (
    <motion.div
      className="absolute"
      style={{
        top: `${top}%`,
        left: frozen ? `${restX}px` : 0,
        width: jellySize,
        height: jellySize * 1.15,
      }}
      animate={
        frozen
          ? { x: 0, y: 0 }
          : {
              x: dir === 1
                ? [size * 0.08, size * 0.55, size * 0.08]
                : [size * 0.55, size * 0.08, size * 0.55],
              y: [0, -size * 0.08, size * 0.05, 0],
            }
      }
      transition={
        frozen
          ? FROZEN_TRANSITION
          : {
              duration: safeAnimDuration(duration),
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }
      }
    >
      <svg
        viewBox="0 0 64 72"
        width="100%"
        height="100%"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
      >
        <ellipse cx="32" cy="22" rx="20" ry="16" fill={v.bell} opacity="0.95" />
        <ellipse cx="32" cy="18" rx="14" ry="10" fill={v.glow} opacity="0.75" />
        <ellipse cx="32" cy="28" rx="12" ry="5" fill={v.bell} opacity="0.55" />
        {tentacles.map((x, i) => (
          <motion.path
            key={x}
            d={`M ${x} 34 Q ${x + (i % 2 ? 5 : -5)} 48 ${x} 64`}
            stroke={v.tentacle}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
            animate={
              frozen
                ? {
                    d: `M ${x} 34 Q ${x + (i % 2 ? 5 : -5)} 48 ${x} 64`,
                  }
                : {
                    d: [
                      `M ${x} 34 Q ${x + (i % 2 ? 5 : -5)} 48 ${x} 64`,
                      `M ${x} 34 Q ${x + (i % 2 ? -6 : 6)} 50 ${x} 66`,
                      `M ${x} 34 Q ${x + (i % 2 ? 5 : -5)} 48 ${x} 64`,
                    ],
                  }
            }
            transition={
              frozen
                ? FROZEN_TRANSITION
                : { duration: safeAnimDuration(1.2 + i * 0.1), repeat: Infinity, ease: "easeInOut" }
            }
          />
        ))}
        <circle cx="26" cy="20" r="2.1" fill="white" />
        <circle cx="38" cy="20" r="2.1" fill="white" />
        <circle cx="26.6" cy="20.4" r="1.1" fill={v.eye} />
        <circle cx="38.6" cy="20.4" r="1.1" fill={v.eye} />
      </svg>
    </motion.div>
  );
}

/**
 * A single swimming cartoon fish.
 */
export function Fish({ size, top, duration, delay, dir = 1, scale = 1, variant, staticPose = false, frozen = false }) {
  const fishSize = size * 0.28 * scale;
  const v = variant || FISH_VARIANTS[0];
  const isStatic = staticPose || frozen;
  const swimX =
    dir === 1
      ? [size * 0.05, size * 0.65, size * 0.65, size * 0.05, size * 0.05]
      : [size * 0.65, size * 0.05, size * 0.05, size * 0.65, size * 0.65];
  return (
    <motion.div
      className="absolute"
      style={{
        top: `${top}%`,
        left: isStatic ? "18%" : 0,
        width: fishSize,
        height: fishSize * 0.6,
      }}
      animate={
        isStatic
          ? { x: 0, y: 0, scaleX: dir === 1 ? 1 : -1 }
          : {
              x: swimX,
              scaleX: dir === 1 ? [1, 1, -1, -1, 1] : [-1, -1, 1, 1, -1],
              y: [0, -size * 0.06, 0, size * 0.06, 0],
            }
      }
      transition={
        isStatic
          ? FROZEN_TRANSITION
          : {
              duration: safeAnimDuration(duration),
              repeat: Infinity,
              ease: "easeInOut",
              delay,
              times: [0, 0.4, 0.5, 0.9, 1],
            }
      }
    >
      <svg
        viewBox="0 0 64 40"
        width="100%"
        height="100%"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        <motion.path
          d="M 8 20 L 0 8 L 4 20 L 0 32 Z"
          fill={v.tail}
          animate={frozen ? { rotate: 0 } : { rotate: [-8, 8, -8] }}
          transition={frozen ? FROZEN_TRANSITION : { duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "20%", originY: "50%" }}
        />
        <ellipse cx="32" cy="20" rx="22" ry="11" fill={v.body} />
        <ellipse cx="32" cy="17" rx="20" ry="6" fill={v.highlight} opacity="0.7" />
        {v.stripe && (
          <>
            <path d="M 20 12 Q 22 20 20 28 L 24 28 Q 26 20 24 12 Z" fill={v.stripe} opacity="0.6" />
            <path d="M 38 11 Q 40 20 38 29 L 42 29 Q 44 20 42 11 Z" fill={v.stripe} opacity="0.6" />
          </>
        )}
        <path d="M 26 10 Q 32 2 38 10 Z" fill={v.fin} />
        <path d="M 28 30 Q 32 36 36 30 Z" fill={v.fin} />
        <circle cx="46" cy="18" r="2.5" fill="white" />
        <circle cx="46.5" cy="18" r="1.4" fill="#0f172a" />
        <path
          d="M 40 17 Q 38 20 40 23"
          stroke={v.mouth}
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

/**
 * Animated cartoon fish + real jellyfish swimming inside the die.
 * `count` controls how many creatures appear (matches the die's face value).
 */
export default function FishOverlay({
  size,
  radius,
  count = 1,
  dieSeed = 0,
  bigFishVariantIndex = 0,
  bigFishExtraScale = 1,
  bigFishStaticPose = false,
  includeJellyfish = false,
  /** Score Freeze / ice power — pause all aquarium motion. */
  frozen = false,
}) {
  // Distribute creatures vertically. At most one jellyfish on the whole tray
  // (caller sets includeJellyfish on a single die).
  const creatures = React.useMemo(() => {
    const arr = [];
    const n = Math.max(1, count);
    const layoutSeed = hashSeed(dieSeed, count, bigFishVariantIndex);
    const bigIdx =
      n === 1 ? 0 : n === 2 ? -1 : seededIndex(hashSeed(layoutSeed, "big"), n);
    const effectiveBigIndex = bigFishVariantIndex % FISH_VARIANTS.length;
    const bigVariant = FISH_VARIANTS[effectiveBigIndex];
    const smallPool = FISH_VARIANTS.filter((_, i) => i !== effectiveBigIndex).sort(
      (a, b) =>
        hashSeed(layoutSeed, "fish", FISH_VARIANTS.indexOf(a)) -
        hashSeed(layoutSeed, "fish", FISH_VARIANTS.indexOf(b))
    );
    let smallCursor = 0;

    // Exactly one jelly slot when allowed.
    let jellySlot = -1;
    if (includeJellyfish && n >= 2) {
      jellySlot = (bigFishVariantIndex + count) % n;
      if (jellySlot === bigIdx) jellySlot = (jellySlot + 1) % n;
    }

    for (let i = 0; i < n; i++) {
      const top = n === 1 ? 40 : 12 + (i * 68) / (n - 1);
      const baseScale = n >= 5 ? 0.75 : n >= 3 ? 0.85 : 1;
      const isBig = i === bigIdx;
      const isJelly = i === jellySlot && !isBig;
      if (isJelly) {
        arr.push({
          kind: "jellyfish",
          top,
          duration: 6.5 + ((i * 0.55) % 2),
          delay: -(i * 1.1 + (bigFishVariantIndex % 5) * 0.3),
          dir: i % 2 === 0 ? 1 : -1,
          scale: baseScale * 1.05,
          variant: JELLYFISH_VARIANTS[bigFishVariantIndex % JELLYFISH_VARIANTS.length],
        });
      } else {
        arr.push({
          kind: "fish",
          top,
          duration: 5 + ((i * 0.7) % 2.5),
          delay: -(i * 1.3 + seededUnit(hashSeed(layoutSeed, "delay", i)) * 1.5),
          dir: i % 2 === 0 ? 1 : -1,
          scale: isBig ? baseScale * 1.6 * bigFishExtraScale : baseScale,
          variant: isBig ? bigVariant : smallPool[smallCursor++ % smallPool.length],
          staticPose: isBig && bigFishStaticPose,
        });
      }
    }
    return arr;
  }, [count, dieSeed, bigFishVariantIndex, bigFishExtraScale, bigFishStaticPose, includeJellyfish]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ borderRadius: radius }}
    >
      {/* Subtle water ripples */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)",
        }}
      />

      {/* Bubbles drifting up — more on higher-value dice (hidden when frozen). */}
      {!frozen && (() => {
        const bubbleCount = count >= 5 ? 22 : count === 4 ? 14 : 8;
        return Array.from({ length: bubbleCount }, (_, i) => {
          const sz = size * (0.02 + (i % 4) * 0.013);
          const leftPct = (i * 37) % 95 + 2;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/70"
              style={{
                width: sz,
                height: sz,
                left: `${leftPct}%`,
                bottom: -size * 0.05,
              }}
              animate={{ y: [0, -size * 1.15], opacity: [0, 0.8, 0] }}
              transition={{
                duration: 2.2 + ((i * 0.31) % 1.8),
                repeat: Infinity,
                delay: (i * 0.22) % 3,
                ease: "easeOut",
              }}
            />
          );
        });
      })()}

      {/* Fish + real jellyfish */}
      {creatures.map((c, i) =>
        c.kind === "jellyfish" ? (
          <Jellyfish key={`jelly-${i}`} size={size} {...c} frozen={frozen} />
        ) : (
          <Fish
            key={`fish-${i}`}
            size={size}
            {...c}
            frozen={frozen}
            staticPose={frozen || c.staticPose}
          />
        )
      )}
    </div>
  );
}