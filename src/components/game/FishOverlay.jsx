import React from "react";
import { motion } from "framer-motion";

/**
 * Fish color palettes — each entry defines the colors used by the shared Fish SVG.
 * tail/body/highlight/fin can be tuned per species.
 */
const FISH_VARIANTS = [
  // Orange clownfish (original)
  { tail: "#f97316", body: "#fb923c", highlight: "#fdba74", fin: "#f97316", mouth: "#ea580c", stripe: null },
  // Blue tang (Dory)
  { tail: "#1d4ed8", body: "#2563eb", highlight: "#60a5fa", fin: "#facc15", mouth: "#1e3a8a", stripe: "#0f172a" },
  // Yellow tang
  { tail: "#eab308", body: "#facc15", highlight: "#fde68a", fin: "#ca8a04", mouth: "#a16207", stripe: null },
  // Pink/coral
  { tail: "#db2777", body: "#ec4899", highlight: "#f9a8d4", fin: "#be185d", mouth: "#9d174d", stripe: null },
  // Purple
  { tail: "#7c3aed", body: "#a855f7", highlight: "#d8b4fe", fin: "#6b21a8", mouth: "#581c87", stripe: null },
  // Green
  { tail: "#15803d", body: "#22c55e", highlight: "#86efac", fin: "#14532d", mouth: "#166534", stripe: null },
  // Angelfish — silver body with bold black vertical bars and yellow fins
  { tail: "#facc15", body: "#e5e7eb", highlight: "#f9fafb", fin: "#facc15", mouth: "#1f2937", stripe: "#0f172a", angelfish: true },
  // Angelfish (blue) — two-tone blue with deep navy bars
  { tail: "#1e40af", body: "#3b82f6", highlight: "#93c5fd", fin: "#1d4ed8", mouth: "#1e3a8a", stripe: "#1e3a8a", angelfish: true },
];

/**
 * A single swimming cartoon fish.
 */
function Fish({ size, top, duration, delay, dir = 1, scale = 1, variant }) {
  const fishSize = size * 0.28 * scale;
  const v = variant || FISH_VARIANTS[0];
  return (
    <motion.div
      className="absolute"
      style={{
        top: `${top}%`,
        left: 0,
        width: fishSize,
        height: fishSize * 0.6,
      }}
      animate={{
        x: dir === 1
          ? [size * 0.05, size * 0.65, size * 0.65, size * 0.05, size * 0.05]
          : [size * 0.65, size * 0.05, size * 0.05, size * 0.65, size * 0.65],
        scaleX: dir === 1 ? [1, 1, -1, -1, 1] : [-1, -1, 1, 1, -1],
        y: [0, -size * 0.06, 0, size * 0.06, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
        times: [0, 0.4, 0.5, 0.9, 1],
      }}
    >
      <svg
        viewBox="0 0 64 40"
        width="100%"
        height="100%"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        {v.angelfish ? (
          <>
            {/* Tall angular dorsal fin */}
            <path d="M 28 12 L 22 -4 L 40 12 Z" fill={v.fin} opacity="0.95" />
            {/* Tall angular anal fin */}
            <path d="M 28 28 L 22 44 L 40 28 Z" fill={v.fin} opacity="0.95" />
            {/* Trailing angular tail */}
            <motion.path
              d="M 12 20 L 0 8 L 5 20 L 0 32 Z"
              fill={v.tail}
              animate={{ rotate: [-6, 6, -6] }}
              transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: "20%", originY: "50%" }}
            />
            {/* Diamond/kite body — straight edges */}
            <path d="M 12 20 L 32 6 L 52 20 L 32 34 Z" fill={v.body} />
            <path d="M 18 18 L 32 10 L 46 18 L 32 22 Z" fill={v.highlight} opacity="0.7" />
            {/* Bold straight vertical bars */}
            <path d="M 22 10 L 26 10 L 26 30 L 22 30 Z" fill={v.stripe} opacity="0.75" />
            <path d="M 36 10 L 40 10 L 40 30 L 36 30 Z" fill={v.stripe} opacity="0.75" />
            {/* Eye */}
            <circle cx="46" cy="18" r="2.5" fill="white" />
            <circle cx="46.5" cy="18" r="1.4" fill="#0f172a" />
            <path d="M 42 19 L 40 20 L 42 21" stroke={v.mouth} strokeWidth="1" fill="none" />
          </>
        ) : (
          <>
            <motion.path
              d="M 8 20 L 0 8 L 4 20 L 0 32 Z"
              fill={v.tail}
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
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
          </>
        )}
      </svg>
    </motion.div>
  );
}

/**
 * Animated cartoon fish swimming inside the die.
 * `count` controls how many fish appear (matches the die's face value).
 */
export default function FishOverlay({ size, radius, count = 1, bigFishVariantIndex = 0, bigFishExtraScale = 1 }) {
  // Distribute fish vertically across the die. Stagger timing & direction for variety.
  const fish = React.useMemo(() => {
    const arr = [];
    const n = Math.max(1, count);
    // Pick which fish on this die will be the "big one" (skip for value=2).
    // For the "1" face, always make the single fish the big one — and force an angelfish variant.
    const bigIdx = n === 1 ? 0 : n === 2 ? -1 : Math.floor(Math.random() * n);
    // The big fish uses a deterministic variant (unique per die).
    // For the "1" face, force an angelfish variant (indices 6 or 7).
    const ANGELFISH_INDICES = [6, 7];
    const effectiveBigIndex = n === 1
      ? ANGELFISH_INDICES[bigFishVariantIndex % ANGELFISH_INDICES.length]
      : bigFishVariantIndex % FISH_VARIANTS.length;
    const bigVariant = FISH_VARIANTS[effectiveBigIndex];
    // Smaller fish use any variant EXCEPT the big one's, shuffled.
    const smallPool = FISH_VARIANTS
      .filter((_, i) => i !== effectiveBigIndex)
      .sort(() => Math.random() - 0.5);
    let smallCursor = 0;
    for (let i = 0; i < n; i++) {
      const top = n === 1 ? 40 : 15 + (i * 65) / (n - 1);
      const baseScale = n >= 5 ? 0.75 : n >= 3 ? 0.85 : 1;
      const isBig = i === bigIdx;
      arr.push({
        top,
        duration: 5 + ((i * 0.7) % 2.5),
        delay: -(i * 1.3 + Math.random() * 1.5),
        dir: i % 2 === 0 ? 1 : -1,
        scale: isBig ? baseScale * 1.6 * bigFishExtraScale : baseScale,
        variant: isBig ? bigVariant : smallPool[smallCursor++ % smallPool.length],
      });
    }
    return arr;
  }, [count, bigFishVariantIndex, bigFishExtraScale]);

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

      {/* Bubbles drifting up — more on higher-value dice */}
      {(() => {
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

      {/* Fish */}
      {fish.map((f, i) => (
        <Fish key={i} size={size} {...f} />
      ))}
    </div>
  );
}