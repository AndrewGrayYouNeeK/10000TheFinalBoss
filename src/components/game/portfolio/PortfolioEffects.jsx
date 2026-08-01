import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { EdgeFrame, NoiseFilm } from "./primitives";
import { usePortfolioDie } from "./PortfolioDieContext";
import { useAudioLevels } from "./useAudioLevels";
import SoundwaveBarDisplay from "./SoundwaveBarDisplay";
import { getScoreMeterTheme } from "@/lib/scoreMeterTheme";
import { getDieSquircleClipStyle } from "@/lib/dieSquircleClip";

/** Bulging squircle — same silhouette as sprite dice (not plain border-radius). */
function dieShape(size) {
  return getDieSquircleClipStyle(size);
}

/** WAAPI rejects negative or non-finite durations — clamp before framer-motion → element.animate(). */
function safeAnimDuration(seconds, min = 0.001) {
  const n = Number(seconds);
  return Number.isFinite(n) ? Math.max(min, n) : min;
}

function SweepLine({ color = "rgba(0,255,255,0.85)", width = 3 }) {
  const ctx = usePortfolioDie();
  const fallbackSweep = useMotionValue(0);
  const sweepX = ctx?.sweepX ?? fallbackSweep;
  const left = useTransform(sweepX, (v) => `${v * 100}%`);
  if (!ctx?.sweepX) return null;
  return (
    <motion.div
      className="absolute top-0 bottom-0 pointer-events-none z-[10]"
      style={{
        left,
        width,
        x: "-50%",
        background: color,
        boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
      }}
    />
  );
}

function RadarRings({ size = 64, color = "rgba(52,211,153,0.35)" }) {
  return (
    <svg className="absolute inset-0 pointer-events-none opacity-60" viewBox="0 0 100 100" style={dieShape(size)}>
      {[20, 35, 50].map((r) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="0.6" />
      ))}
      <line x1="50" y1="0" x2="50" y2="100" stroke={color} strokeWidth="0.4" />
      <line x1="0" y1="50" x2="100" y2="50" stroke={color} strokeWidth="0.4" />
    </svg>
  );
}

/** Rainfall portfolio skin — rain by default; snow while Score Freeze / ice overlay is active. */
function RainfallScene({ size = 64, frozen = false }) {
  const snowTimes = [0, 0.15, 0.5, 0.85, 1];

  if (frozen) {
    const flakeBase = Math.max(2, Math.round(size * 0.045));
    return (
      <div key="rainfall-frozen" className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            ...dieShape(size),
            background: "linear-gradient(180deg, #1e3a5e 0%, #334155 50%, #475569 100%)",
          }}
        />
        {Array.from({ length: 24 }).map((_, i) => {
          const flakeSize = flakeBase + (i % 3);
          const drift = size * (0.03 + (i % 4) * 0.015);
          return (
            <motion.div
              key={`snow-${i}`}
              className="absolute pointer-events-none rounded-full bg-white"
              style={{
                left: `${(i * 4.1) % 96}%`,
                width: flakeSize,
                height: flakeSize,
                boxShadow: "0 0 3px rgba(255,255,255,0.85)",
                opacity: 0.55 + (i % 3) * 0.15,
              }}
              animate={{
                // WAAPI requires equal-length keyframe arrays per property.
                top: ["-14%", "18%", "46%", "74%", "112%"],
                x: [0, drift, -drift * 0.6, drift * 0.35, 0],
              }}
              transition={{
                duration: safeAnimDuration(1.4 + (i % 5) * 0.28),
                repeat: Infinity,
                delay: (i * 0.11) % 1.8,
                ease: "linear",
                times: snowTimes,
              }}
            />
          );
        })}
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            ...dieShape(size),
            background:
              "radial-gradient(circle at 50% 0%, rgba(186,230,253,0.22) 0%, transparent 55%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 45%)",
          }}
        />
      </div>
    );
  }

  return (
    <div key="rainfall-rain" className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...dieShape(size),
          background: "linear-gradient(180deg, #1e293b 0%, #334155 55%, #475569 100%)",
        }}
      />
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={`rain-${i}`}
          className="absolute w-[1px] pointer-events-none"
          style={{
            left: `${(i * 3.7) % 98}%`,
            height: 8 + (i % 4) * 3,
            background: "linear-gradient(to bottom, transparent, rgba(186,230,253,0.85))",
          }}
          animate={{ top: ["-12%", "112%"] }}
          transition={{
            duration: safeAnimDuration(0.45 + (i % 5) * 0.12),
            repeat: Infinity,
            delay: (i * 0.07) % 1.2,
            ease: "linear",
          }}
        />
      ))}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          ...dieShape(size),
          background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

function RotatingRadarSweep({ size = 64 }) {
  const { radarAngle } = usePortfolioDie();
  const rotate = useTransform(radarAngle, (v) => `${v}deg`);
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none origin-center"
      style={{ rotate, ...dieShape(size) }}
    >
      <div
        className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left -translate-y-1/2"
        style={{
          background: "linear-gradient(90deg, rgba(52,211,153,0.9), transparent)",
          boxShadow: "0 0 8px rgba(52,211,153,0.8)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "conic-gradient(from 0deg, rgba(52,211,153,0.25) 0deg, transparent 45deg)",
        }}
      />
    </motion.div>
  );
}

/** Full-size pip blip on radar — lingers after the sweep passes */
function RadarBlipDot({ cx, cy, targetAngle, blipRadius, gradId, glowId, glowWideId }) {
  const { radarAngle } = usePortfolioDie();
  const litRef = useRef(false);
  const fadeUntilRef = useRef(0);
  const [vis, setVis] = useState({ opacity: 0.08, r: blipRadius * 0.5 });

  useEffect(() => {
    const SWEEP_WIDTH = 52;
    const LINGER_MS = 2400;

    const update = (a) => {
      const diff = Math.abs(((a - targetAngle + 540) % 360) - 180);
      const now = performance.now();

      if (diff < SWEEP_WIDTH) {
        litRef.current = true;
        fadeUntilRef.current = now + LINGER_MS;
        setVis({ opacity: 1, r: blipRadius });
      } else if (litRef.current && now < fadeUntilRef.current) {
        const t = (fadeUntilRef.current - now) / LINGER_MS;
        setVis({
          opacity: 0.2 + t * 0.8,
          r: blipRadius * (0.88 + t * 0.12),
        });
      } else {
        litRef.current = false;
        setVis({ opacity: 0.08, r: blipRadius * 0.55 });
      }
    };

    update(radarAngle.get());
    return radarAngle.on("change", update);
  }, [radarAngle, targetAngle, blipRadius]);

  return (
    <>
      <motion.circle
        cx={cx}
        cy={cy}
        fill="#4ade80"
        r={vis.r * 1.35}
        opacity={vis.opacity * 0.35}
        filter={`url(#${glowWideId})`}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        fill={`url(#${gradId})`}
        r={vis.r}
        opacity={vis.opacity}
        filter={`url(#${glowId})`}
        transition={{ duration: 0.12 }}
      />
    </>
  );
}

function RadarBlipsLayer({ layout, size = 64 }) {
  const uid = React.useId().replace(/:/g, "");
  const gradId = `blipGrad${uid}`;
  const glowId = `blipGlow${uid}`;
  const glowWideId = `blipGlowWide${uid}`;
  const blipRadius = (size * 0.145) / 2 / (size / 100);
  const positions = [];
  (layout || []).flat().forEach((p, i) => {
    if (p !== 1) return;
    const col = i % 3;
    const row = Math.floor(i / 3);
    positions.push({ x: 16.67 + col * 33.33, y: 16.67 + row * 33.33, i });
  });

  return (
    <svg className="absolute inset-0 pointer-events-none z-20" viewBox="0 0 100 100" style={dieShape(size)}>
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#16a34a" />
        </radialGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={glowWideId}>
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {positions.map(({ x, y, i }) => (
        <RadarBlipDot
          key={i}
          cx={x}
          cy={y}
          blipRadius={blipRadius}
          gradId={gradId}
          glowId={glowId}
          glowWideId={glowWideId}
          targetAngle={((Math.atan2(y - 50, x - 50) * 180) / Math.PI + 360) % 360}
        />
      ))}
    </svg>
  );
}

function seeded(n, salt = 0) {
  const x = Math.sin((n + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function getPipGridMetrics() {
  const gridStart = 0.13;
  const gridSpan = 0.74;
  const gap = 0.045;
  const cell = (gridSpan - 2 * gap) / 3;
  return { gridStart, gap, cell };
}

function getPipTargets(layout) {
  const { gridStart, gap, cell } = getPipGridMetrics();
  const targets = [];
  (layout || []).flat().forEach((p, i) => {
    if (p !== 1) return;
    const col = i % 3;
    const row = Math.floor(i / 3);
    targets.push({
      x: (gridStart + col * (cell + gap) + cell / 2) * 100,
      y: (gridStart + row * (cell + gap) + cell / 2) * 100,
      col,
      row,
    });
  });
  return targets.length ? targets : [{ x: 50, y: 50, col: 1, row: 1 }];
}


const HYPNO_PAIRS = [
  ["#ffffff", "#0a0a0a"],
  ["#ff5ef7", "#2d004d"],
  ["#5efbff", "#001a33"],
  ["#fff75e", "#332800"],
  ["#ff9a5e", "#331400"],
];

function rippleMaxRadius(x, y) {
  return (
    Math.max(
      Math.hypot(x, y),
      Math.hypot(100 - x, y),
      Math.hypot(x, 100 - y),
      Math.hypot(100 - x, 100 - y)
    ) - 0.5
  );
}

function HypnoBurstRings({ layout, size = 64 }) {
  const targets = React.useMemo(() => getPipTargets(layout), [layout]);
  const ringCount = 120;
  const ringDuration = 2.35;
  const stagger = ringDuration / ringCount;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...dieShape(size),
          background: "radial-gradient(circle at 50% 50%, #14101f 0%, #050508 65%, #000 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          ...dieShape(size),
          background:
            "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.07) 0deg 12deg, transparent 12deg 24deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          ...dieShape(size),
          background:
            "conic-gradient(from 0deg, transparent, rgba(168,85,247,0.06), transparent, rgba(34,211,238,0.06), transparent, rgba(244,114,182,0.06), transparent)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{ ...dieShape(size), background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 55%)" }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg
        className="absolute inset-0 pointer-events-none z-[5] overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={dieShape(size)}
      >
        {targets.flatMap((t, pipIdx) => {
          const [light, dark] = HYPNO_PAIRS[pipIdx % HYPNO_PAIRS.length];
          const maxReach = rippleMaxRadius(t.x, t.y);
          return Array.from({ length: ringCount }, (_, ringIdx) => {
            const color = ringIdx % 2 === 0 ? light : dark;
            const maxR = 0.8 + ((ringIdx + 1) / ringCount) * maxReach;
            const delay = ringIdx * stagger + pipIdx * 0.04;
            return (
              <motion.circle
                key={`${pipIdx}-${ringIdx}`}
                cx={t.x}
                cy={t.y}
                fill="none"
                stroke={color}
                strokeWidth={0.22}
                initial={{ r: 0.35, opacity: 0 }}
                animate={{
                  r: [0.35, maxR],
                  opacity: [0.95, 0],
                }}
                transition={{
                  duration: ringDuration,
                  repeat: Infinity,
                  delay,
                  ease: "linear",
                }}
              />
            );
          });
        })}
      </svg>
    </>
  );
}

function XrayScene({ size = 64, layout }) {
  const targets = React.useMemo(() => getPipTargets(layout), [layout]);
  const bone = "rgba(224,242,254,0.92)";
  const boneDim = "rgba(125,211,252,0.45)";
  const boneFaint = "rgba(56,189,248,0.22)";

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...dieShape(size),
          background: "radial-gradient(ellipse at 50% 42%, #0c1a2e 0%, #030712 52%, #000 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          ...dieShape(size),
          background: "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.08) 0%, transparent 62%)",
          mixBlendMode: "screen",
        }}
      />
      <svg
        className="absolute inset-0 pointer-events-none z-[3] overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ ...dieShape(size), filter: "drop-shadow(0 0 4px rgba(56,189,248,0.35))" }}
      >
        <rect x="4.5" y="4.5" width="91" height="91" rx="10" fill="none" stroke={bone} strokeWidth="2.2" opacity="0.95" />
        <rect x="9" y="9" width="82" height="82" rx="8" fill="none" stroke={boneDim} strokeWidth="1" />
        <rect x="14" y="14" width="72" height="72" rx="6" fill="none" stroke={boneFaint} strokeWidth="0.6" strokeDasharray="2 3" />

        {[
          [14, 14, 86, 86],
          [86, 14, 14, 86],
          [14, 86, 86, 14],
          [50, 14, 50, 86],
          [14, 50, 86, 50],
          [22, 22, 78, 78],
          [78, 22, 22, 78],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={`truss-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i < 2 ? boneDim : boneFaint} strokeWidth={i < 4 ? 0.9 : 0.55} />
        ))}

        {Array.from({ length: 7 }, (_, i) => {
          const y = 18 + i * 10;
          return (
            <line
              key={`rib-h-${i}`}
              x1={16 + (i % 2) * 2}
              y1={y}
              x2={84 - (i % 2) * 2}
              y2={y}
              stroke={boneFaint}
              strokeWidth="0.45"
              opacity={0.55 + (i % 3) * 0.12}
            />
          );
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const x = 20 + i * 11;
          return (
            <line
              key={`rib-v-${i}`}
              x1={x}
              y1={16}
              x2={x}
              y2={84}
              stroke={boneFaint}
              strokeWidth="0.4"
              opacity={0.4 + (i % 2) * 0.15}
            />
          );
        })}

        {targets.map((t, i) => (
          <g key={`pip-bone-${i}`}>
            <circle cx={t.x} cy={t.y} r="7.5" fill="rgba(56,189,248,0.08)" stroke={boneDim} strokeWidth="0.7" strokeDasharray="1.5 2" />
            <circle cx={t.x} cy={t.y} r="4.2" fill="none" stroke={bone} strokeWidth="0.5" opacity="0.65" />
          </g>
        ))}

        <text x="8" y="96" fill={boneDim} fontSize="4.2" fontFamily="monospace" fontWeight="700" letterSpacing="1.2">
          X-RAY
        </text>
      </svg>

      <motion.div
        className="absolute left-0 right-0 pointer-events-none z-[5]"
        style={{
          height: "14%",
          background: "linear-gradient(to bottom, transparent, rgba(186,230,254,0.22), rgba(224,242,254,0.45), rgba(186,230,254,0.22), transparent)",
          boxShadow: "0 0 18px rgba(125,211,252,0.55)",
          mixBlendMode: "screen",
        }}
        animate={{ top: ["-18%", "118%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute inset-0 pointer-events-none z-[6]"
        style={{ ...dieShape(size), boxShadow: "inset 0 0 28px 8px rgba(0,0,0,0.85)" }}
        animate={{ opacity: [0.85, 1, 0.88, 1] }}
        transition={{ duration: 0.08, repeat: Infinity, repeatDelay: 2.4 }}
      />

      <motion.div
        className="absolute inset-0 pointer-events-none z-[4] mix-blend-screen"
        style={{ ...dieShape(size), background: "rgba(186,230,254,0.04)" }}
        animate={{ opacity: [0.2, 0.55, 0.25, 0.5, 0.2] }}
        transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 0.04 }}
      />

      <NoiseFilm size={size} opacity={0.14} />
      <EdgeFrame size={size} color="rgba(125,211,252,0.55)" glow="0 0 16px rgba(56,189,248,0.35)" animate />
    </>
  );
}

function FlyIcon({ size = 9, variant = {} }) {
  const {
    wingColor = "rgba(230,230,230,0.82)",
    bodyColor = "#0a0a0a",
    headColor = "#0a0a0a",
    wingSpeed = 0.07,
    wingDelay = 0.035,
    mirror = false,
    bodyRx = 2.4,
    bodyRy = 3.6,
    headR = 1.6,
    wingRx = 4.5,
    wingRy = 2,
  } = variant;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{
        overflow: "visible",
        display: "block",
        transform: mirror ? "scaleX(-1)" : undefined,
      }}
    >
      <motion.ellipse
        cx="6"
        cy="7"
        rx={wingRx}
        ry={wingRy}
        fill={wingColor}
        animate={{ ry: [wingRy, wingRy * 0.25, wingRy] }}
        transition={{ duration: wingSpeed, repeat: Infinity }}
      />
      <motion.ellipse
        cx="14"
        cy="7"
        rx={wingRx}
        ry={wingRy}
        fill={wingColor}
        animate={{ ry: [wingRy, wingRy * 0.25, wingRy] }}
        transition={{ duration: wingSpeed, repeat: Infinity, delay: wingDelay }}
      />
      <ellipse cx="10" cy="12" rx={bodyRx} ry={bodyRy} fill={bodyColor} />
      <circle cx="10" cy="8.5" r={headR} fill={headColor} />
      {(variant.stripe || variant.spots) && (
        <ellipse
          cx="10"
          cy="11.5"
          rx={bodyRx * 0.55}
          ry={bodyRy * 0.35}
          fill={variant.stripe || "rgba(255,255,255,0.18)"}
        />
      )}
    </svg>
  );
}

const FLY_PALETTES = [
  { wingColor: "rgba(230,230,230,0.85)", bodyColor: "#0a0a0a", headColor: "#0a0a0a" },
  { wingColor: "rgba(198,224,168,0.82)", bodyColor: "#142010", headColor: "#1a2810", stripe: "rgba(120,180,80,0.35)" },
  { wingColor: "rgba(176,198,232,0.78)", bodyColor: "#101820", headColor: "#0c1420", stripe: "rgba(100,160,220,0.28)" },
  { wingColor: "rgba(242,210,168,0.84)", bodyColor: "#281808", headColor: "#201005" },
  { wingColor: "rgba(220,186,220,0.8)", bodyColor: "#180818", headColor: "#140614", stripe: "rgba(200,120,220,0.22)" },
  { wingColor: "rgba(255,230,190,0.75)", bodyColor: "#201810", headColor: "#181008", spots: true },
  { wingColor: "rgba(190,210,190,0.8)", bodyColor: "#101810", headColor: "#0c140c" },
  { wingColor: "rgba(255,210,210,0.78)", bodyColor: "#200808", headColor: "#180606", stripe: "rgba(255,120,120,0.25)" },
];

function getFlyVariant(flySeed) {
  const palette = FLY_PALETTES[Math.floor(seeded(flySeed, 1) * FLY_PALETTES.length)];
  const scale = 0.78 + seeded(flySeed, 2) * 0.48;
  return {
    ...palette,
    mirror: seeded(flySeed, 3) > 0.5,
    wingSpeed: 0.055 + seeded(flySeed, 4) * 0.045,
    wingDelay: 0.02 + seeded(flySeed, 5) * 0.04,
    bodyRx: 2.1 + seeded(flySeed, 6) * 0.7,
    bodyRy: 3.1 + seeded(flySeed, 7) * 0.9,
    headR: 1.35 + seeded(flySeed, 8) * 0.45,
    wingRx: 3.8 + seeded(flySeed, 9) * 1.2,
    wingRy: 1.6 + seeded(flySeed, 10) * 0.7,
    scale,
  };
}

function clampPct(v) {
  return Math.min(91, Math.max(9, v));
}

/** Random path across the die — stays away from pip zapper nodes until landing. */
function buildWanderPath(seed, pips) {
  const count = 4 + Math.floor(seeded(seed, 7) * 3);
  const points = [];
  for (let i = 0; i < count; i++) {
    let x;
    let y;
    let tries = 0;
    do {
      x = clampPct(10 + seeded(seed, i * 2 + 1) * 80);
      y = clampPct(10 + seeded(seed, i * 2 + 2) * 80);
      tries++;
    } while (tries < 10 && pips.some((p) => Math.hypot(p.x - x, p.y - y) < 9));
    points.push({ x, y });
  }
  return points;
}

function ZapBurstFlash({ x, y, active }) {
  if (!active) return null;
  return (
    <motion.div
      className="absolute pointer-events-none z-[7]"
      style={{ left: `${x}%`, top: `${y}%`, x: "-50%", y: "-50%" }}
    >
      {/* Hot white core */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 10,
          height: 10,
          marginLeft: -5,
          marginTop: -5,
          background: "#fff",
          boxShadow: "0 0 10px #fff, 0 0 22px #fff, 0 0 36px rgba(255,255,255,0.95)",
        }}
        initial={{ opacity: 1, scale: 0.4 }}
        animate={{ opacity: 0, scale: 3.2 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />
      {/* Violet bloom */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 28,
          height: 28,
          marginLeft: -14,
          marginTop: -14,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(196,181,253,0.85) 28%, rgba(168,85,247,0.55) 55%, transparent 72%)",
          boxShadow: "0 0 18px rgba(255,255,255,0.9), 0 0 40px rgba(168,85,247,0.95)",
        }}
        initial={{ opacity: 1, scale: 0.35 }}
        animate={{ opacity: 0, scale: 2.6 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />
      {/* Brief screen flash at the zap point */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 48,
          height: 48,
          marginLeft: -24,
          marginTop: -24,
          background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 1, scale: 0.5 }}
        animate={{ opacity: 0, scale: 2.1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      />
    </motion.div>
  );
}

function ZapperFly({ targets, instanceKey, initialDelay = 0, variant = {} }) {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [targetPip, setTargetPip] = useState(null);
  const [showBurst, setShowBurst] = useState(false);

  const seed = instanceKey * 997 + cycle * 131;
  const wanderPoints = React.useMemo(() => buildWanderPath(seed, targets), [seed, targets]);
  const wanderDur = 2.8 + seeded(seed, 8) * 3.2;
  const approachDur = 0.28 + seeded(seed, 9) * 0.34;
  const size = (5 + seeded(seed, 0) * 4) * (variant.scale || 1);

  useEffect(() => {
    let timer;

    if (phase === "idle") {
      const wait = cycle === 0 ? initialDelay : 0.55 + seeded(seed, 11) * 1.1;
      timer = setTimeout(() => {
        const pip = targets[Math.floor(seeded(seed, 10) * targets.length)];
        setTargetPip(pip);
        setPhase("wander");
      }, wait * 1000);
    } else if (phase === "wander") {
      timer = setTimeout(() => setPhase("approach"), wanderDur * 1000);
    } else if (phase === "approach") {
      timer = setTimeout(() => {
        setShowBurst(true);
        setPhase("zap");
      }, approachDur * 1000);
    } else if (phase === "zap") {
      timer = setTimeout(() => {
        setShowBurst(false);
        setTargetPip(null);
        setCycle((c) => c + 1);
        setPhase("idle");
      }, 280);
    }

    return () => clearTimeout(timer);
  }, [phase, cycle, seed, targets, initialDelay, wanderDur, approachDur]);

  const visible = phase !== "idle" && phase !== "zap";
  const atPip = (phase === "approach" || phase === "zap") && targetPip;

  let animate;
  let transition;

  if (phase === "wander") {
    animate = {
      left: wanderPoints.map((p) => `${p.x}%`),
      top: wanderPoints.map((p) => `${p.y}%`),
      opacity: 1,
      scale: 1,
      rotate: wanderPoints.map((_, i) => (seeded(seed, 20 + i) > 0.5 ? 14 : -12) + (i % 3) * 6),
    };
    transition = { duration: wanderDur, ease: "linear" };
  } else if (phase === "approach" && targetPip) {
    animate = {
      left: `${targetPip.x}%`,
      top: `${targetPip.y}%`,
      opacity: 1,
      scale: 1,
      rotate: 18,
    };
    transition = { duration: approachDur, ease: "easeIn" };
  } else if (phase === "zap" && targetPip) {
    animate = {
      left: `${targetPip.x}%`,
      top: `${targetPip.y}%`,
      opacity: 0,
      scale: 2.6,
      rotate: 48,
    };
    transition = { duration: 0.14, ease: "easeOut" };
  } else {
    animate = {
      left: `${wanderPoints[0]?.x ?? 50}%`,
      top: `${wanderPoints[0]?.y ?? 50}%`,
      opacity: 0,
      scale: 0.6,
      rotate: 0,
    };
    transition = { duration: 0.12 };
  }

  return (
    <>
      {targetPip && <ZapBurstFlash x={targetPip.x} y={targetPip.y} active={showBurst} />}
      <motion.div
        key={`fly-${instanceKey}-${cycle}`}
        className="absolute pointer-events-none z-[6]"
        style={{ x: "-50%", y: "-50%", opacity: visible ? 1 : 0 }}
        animate={animate}
        transition={transition}
      >
        {atPip && phase === "approach" && (
          <motion.div
            className="absolute left-1/2 bottom-full pointer-events-none"
            style={{
              width: 2,
              height: 22,
              marginLeft: -1,
              background:
                "linear-gradient(to top, rgba(255,255,255,1), rgba(196,181,253,0.85), rgba(56,189,248,0.35), transparent)",
              boxShadow: "0 0 8px #fff, 0 0 14px rgba(168,85,247,0.9)",
              transformOrigin: "50% 100%",
            }}
            initial={{ opacity: 0, scaleY: 0.2 }}
            animate={{ opacity: 1, scaleY: 1.15 }}
            transition={{ duration: approachDur * 0.85, ease: "easeIn" }}
          />
        )}
        <FlyIcon size={size} variant={variant} />
      </motion.div>
    </>
  );
}

function BugZapperScene({ size = 64, layout, dieSeed = 0 }) {
  const uid = React.useId().replace(/:/g, "");
  const glowId = `zapMeshGlow${uid}`;
  const targets = React.useMemo(() => getPipTargets(layout), [layout]);
  // One fly per pip — die value equals fly count (e.g. 4 pips → 4 flies).
  const flyCount = targets.length;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...dieShape(size),
          background: "radial-gradient(circle at 50% 35%, rgba(60,20,100,0.35) 0%, #0a0612 100%)",
        }}
      />
      <svg className="absolute inset-0 pointer-events-none z-[4]" viewBox="0 0 100 100" style={dieShape(size)}>
        <defs>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="0.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`zh-${i}`}
            x1="8"
            y1={12 + i * 18}
            x2="92"
            y2={12 + i * 18}
            stroke="rgba(196,181,253,0.28)"
            strokeWidth="0.55"
            filter={`url(#${glowId})`}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`zv-${i}`}
            x1={12 + i * 18}
            y1="8"
            x2={12 + i * 18}
            y2="92"
            stroke="rgba(196,181,253,0.28)"
            strokeWidth="0.55"
            filter={`url(#${glowId})`}
          />
        ))}
        <rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth="0.9" />
      </svg>
      {Array.from({ length: flyCount }, (_, i) => {
        const flySeed = dieSeed * 41 + i * 9973;
        const variant = getFlyVariant(flySeed);
        return (
          <ZapperFly
            key={`fly-${dieSeed}-${i}`}
            instanceKey={flySeed}
            targets={targets}
            variant={variant}
            initialDelay={seeded(flySeed, 12) * 4.2 + i * 1.1}
          />
        );
      })}
      <EdgeFrame size={size} color="rgba(167,139,250,0.45)" glow="0 0 10px rgba(168,85,247,0.3)" />
    </>
  );
}

const MATRIX_STORM_TEXT = "ANDREW GRAY";

function matrixStormChar(col, row, layer) {
  const start = (col * 2 + layer * 5) % MATRIX_STORM_TEXT.length;
  return MATRIX_STORM_TEXT[(start + row) % MATRIX_STORM_TEXT.length];
}

function MatrixStormScene({ size = 64 }) {
  const columns = 12;
  const rowCount = 10;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...dieShape(size),
          background: "radial-gradient(circle at 50% 45%, #041208 0%, #010403 55%, #000 100%)",
        }}
      />
      {Array.from({ length: columns }, (_, i) => (
        <motion.div
          key={`mx-${i}`}
          className="absolute font-mono font-bold pointer-events-none select-none leading-none uppercase"
          style={{
            left: `${(i / columns) * 100}%`,
            fontSize: 7,
            color: i % 4 === 0 ? "#4ade80" : "#16a34a",
            textShadow: "0 0 4px #4ade80",
            opacity: 0.9,
            letterSpacing: "0.06em",
          }}
          animate={{ top: ["-110%", "130%"] }}
          transition={{
            duration: 0.22 + (i % 5) * 0.05,
            repeat: Infinity,
            delay: (i * 0.04) % 0.28,
            ease: "linear",
          }}
        >
          {Array.from({ length: rowCount }, (__, j) => {
            const char = matrixStormChar(i, j, 0);
            return (
              <div
                key={j}
                style={{
                  opacity: j === 0 ? 1 : 0.35 + ((j + i) % 3) * 0.12,
                  color: j === 0 ? "#fff" : undefined,
                  minWidth: char === " " ? "0.4em" : undefined,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </div>
            );
          })}
        </motion.div>
      ))}
      <motion.div
        key="name-flash"
        className="absolute inset-0 flex items-center justify-center font-mono font-bold pointer-events-none select-none z-[6] uppercase text-center px-1"
        style={{
          color: "#86efac",
          fontSize: 6.2,
          lineHeight: 1.05,
          letterSpacing: "0.2em",
          textShadow: "0 0 10px #22c55e",
        }}
        animate={{
          opacity: [0, 0, 0.95, 0.95, 0],
          scale: [0.96, 0.96, 1, 1.02],
          filter: ["blur(3px)", "blur(3px)", "blur(0px)", "blur(0px)", "blur(4px)"],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          repeatDelay: 5.5,
          ease: "easeInOut",
        }}
      >
        {MATRIX_STORM_TEXT}
      </motion.div>
      <EdgeFrame size={size} color="rgba(34,197,94,0.4)" />
    </>
  );
}

function SoundwaveBars() {
  const { levels, live, pending, error, synthetic, enableMic } = useAudioLevels(14, true);

  const needsMicTap = !live || synthetic;

  const requestMic = (e) => {
    e.preventDefault();
    e.stopPropagation();
    void enableMic();
  };

  return (
    <>
      <SoundwaveBarDisplay
        levels={levels}
        live={live}
        className="absolute inset-0 px-2 pb-2.5 pointer-events-none"
      />
      {needsMicTap ? (
        <button
          type="button"
          className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 max-w-[90%] truncate text-[6px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-black/70 text-cyan-300 border border-cyan-500/45 pointer-events-auto cursor-pointer"
          onPointerDown={requestMic}
          onClick={requestMic}
          title={error || "Tap to enable microphone"}
        >
          {pending ? "Mic…" : error ? "Mic blocked" : "Mic"}
        </button>
      ) : live && !synthetic ? (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 z-10 text-[6px] font-bold uppercase tracking-wider text-emerald-300/90 pointer-events-none">
          Live
        </span>
      ) : live && synthetic ? (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 z-10 text-[6px] font-bold uppercase tracking-wider text-amber-300/80 pointer-events-none">
          Demo
        </span>
      ) : null}
    </>
  );
}

const EFFECTS = {
  radar_sweep: ({ size = 64 }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ ...dieShape(size), background: "linear-gradient(180deg, #020408 0%, #0f172a 100%)" }} />
      <RadarRings size={size} color="rgba(0,255,255,0.3)" />
      <SweepLine color="rgba(0,255,255,0.9)" width={4} />
      <EdgeFrame size={size} color="rgba(0,255,255,0.35)" animate />
    </>
  ),

  tornado_mono: ({ size = 64 }) => (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...dieShape(size),
          background: "radial-gradient(circle at 50% 50%, #262626 0%, #0a0a0a 55%, #000 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
        style={{
          ...dieShape(size),
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.07) 18deg, transparent 40deg, rgba(255,255,255,0.04) 200deg, transparent 230deg)",
        }}
      />
      {/* Katakana bands whipping sideways — inside-the-tornado read */}
      {Array.from({ length: 16 }).map((_, i) => {
        const goRight = i % 2 === 0;
        const bandChars = Array.from({ length: 18 }, (__, j) =>
          String.fromCharCode(0x30a0 + ((i * 13 + j * 19) % 80))
        ).join(" ");
        return (
          <motion.div
            key={`band-${i}`}
            className="absolute font-mono font-bold pointer-events-none select-none whitespace-nowrap"
            style={{
              top: `${4 + ((i * 6.1) % 88)}%`,
              fontSize: 6 + (i % 4),
              letterSpacing: `${1 + (i % 3)}px`,
              color: i % 4 === 0 ? "#ffffff" : i % 4 === 1 ? "#e5e5e5" : i % 4 === 2 ? "#a3a3a3" : "#d4d4d4",
              textShadow: goRight
                ? "-10px 0 4px rgba(255,255,255,0.35), -18px 0 8px rgba(255,255,255,0.15)"
                : "10px 0 4px rgba(255,255,255,0.35), 18px 0 8px rgba(255,255,255,0.15)",
              opacity: 0.7 + (i % 3) * 0.1,
              filter: "blur(0.35px)",
            }}
            animate={{
              left: goRight ? ["-160%", "160%"] : ["160%", "-160%"],
            }}
            transition={{
              duration: safeAnimDuration(0.09 + (i % 5) * 0.018),
              repeat: Infinity,
              delay: (i * 0.027) % 0.35,
              ease: "linear",
            }}
          >
            {bandChars}
          </motion.div>
        );
      })}
      {/* Extra speed streaks */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={`streak-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: `${(i * 5.7) % 94}%`,
            height: 1 + (i % 2),
            width: `${18 + (i % 5) * 10}%`,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            opacity: 0.4 + (i % 3) * 0.18,
          }}
          animate={{ left: i % 2 === 0 ? ["-50%", "150%"] : ["150%", "-50%"] }}
          transition={{
            duration: safeAnimDuration(0.07 + (i % 4) * 0.015),
            repeat: Infinity,
            delay: i * 0.03,
            ease: "linear",
          }}
        />
      ))}
    </>
  ),

  rainfall: (props) => <RainfallScene {...props} />,

  score_meter: ({ size = 64, scoreFill = 0.5 }) => {
    const theme = getScoreMeterTheme(scoreFill);
    return (
      <>
        <div className="absolute inset-0 pointer-events-none" style={{ ...dieShape(size), background: "#0f172a" }} />
        <div className="absolute inset-2 pointer-events-none overflow-hidden" style={dieShape(size)}>
          <motion.div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: `${Math.min(100, theme.raw * 100)}%`,
              background: theme.fillGradient,
              boxShadow: theme.fillGlow,
            }}
            animate={theme.full ? { opacity: [0.85, 1, 0.85] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          {[25, 50, 75].map((t) => (
            <div key={t} className="absolute left-0 right-0 h-px bg-white/20 pointer-events-none" style={{ bottom: `${t}%` }} />
          ))}
        </div>
        <EdgeFrame size={size} color={theme.edgeColor} glow={theme.edgeGlow} animate={theme.full} />
      </>
    );
  },

  binary_storm: ({ size = 64 }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ ...dieShape(size), background: "#020408" }} />
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute font-mono text-[7px] leading-[8px] pointer-events-none text-green-400"
          style={{ left: `${i * 6.2}%`, width: "6%", opacity: 0.85 }}
          animate={{ top: ["-80%", "120%"] }}
          transition={{ duration: 0.35 + (i % 4) * 0.08, repeat: Infinity, delay: i * 0.05, ease: "linear" }}
        >
          {Array.from({ length: 14 }).map((__, j) => (
            <div key={j}>{(i + j) % 2 ? "1" : "0"}</div>
          ))}
        </motion.div>
      ))}
      <NoiseFilm size={size} opacity={0.12} />
      <EdgeFrame size={size} color="rgba(34,197,94,0.45)" animate />
    </>
  ),

  soundwave: ({ size = 64 }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ ...dieShape(size), background: "linear-gradient(145deg, #020408 0%, #1e1b4b 100%)" }} />
      <SoundwaveBars />
      <EdgeFrame size={size} color="rgba(255,0,234,0.25)" />
    </>
  ),

  radar_blips: ({ layout, size = 64 }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ ...dieShape(size), background: "radial-gradient(circle, #052e16 0%, #020408 70%)" }} />
      <RadarRings size={size} />
      <RotatingRadarSweep size={size} />
      <RadarBlipsLayer layout={layout} size={size} />
      <EdgeFrame size={size} color="rgba(74,222,128,0.35)" />
    </>
  ),

  matrix_storm: ({ size = 64 }) => <MatrixStormScene size={size} />,

  plasma_cut: ({ layout, size = 64 }) => {
    const targets = getPipTargets(layout);
    const pipR = ((size * 0.145) / 2 / size) * 100;
    return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ ...dieShape(size), background: "linear-gradient(145deg, #0f172a 0%, #020408 100%)" }}
      />
      <svg className="absolute inset-0 pointer-events-none z-[5]" viewBox="0 0 100 100" style={dieShape(size)}>
        <motion.rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="8"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          animate={{ strokeDashoffset: [0, -18] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <text
          x="50"
          y="9.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#38bdf8"
          fontSize="5.5"
          fontWeight="800"
          letterSpacing="1.8"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          CUT HERE
        </text>
        <text
          x="50"
          y="90.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#38bdf8"
          fontSize="5.5"
          fontWeight="800"
          letterSpacing="1.8"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          CUT HERE
        </text>
        <text
          x="9.5"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#38bdf8"
          fontSize="5.5"
          fontWeight="800"
          letterSpacing="1.8"
          transform="rotate(-90 9.5 50)"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          CUT HERE
        </text>
        <text
          x="90.5"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#38bdf8"
          fontSize="5.5"
          fontWeight="800"
          letterSpacing="1.8"
          transform="rotate(90 90.5 50)"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          CUT HERE
        </text>
        {targets.map((t, i) => (
          <motion.circle
            key={`pip-cut-${i}`}
            cx={t.x}
            cy={t.y}
            r={pipR}
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            animate={{ strokeDashoffset: [0, -14] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </svg>
    </>
    );
  },

  core_burst: ({ layout, size = 64 }) => (
    <HypnoBurstRings layout={layout} size={size} />
  ),

  bug_zapper: ({ layout, dieSeed, size = 64 }) => (
    <BugZapperScene size={size} layout={layout} dieSeed={dieSeed ?? 0} />
  ),

  xray: ({ layout, size = 64 }) => <XrayScene size={size} layout={layout} />,
};

export default function PortfolioDieEffect({
  effectId,
  scoreFill,
  layout,
  size = 64,
  dieSeed = 0,
  frozen = false,
}) {
  const Effect = EFFECTS[effectId];
  if (!Effect) return null;
  // One outer squircle clip — Rainfall silhouette — so particles/FX can't square-fill the corners.
  return (
    <div className="absolute inset-0 pointer-events-none" style={dieShape(size)}>
      <Effect
        scoreFill={scoreFill}
        layout={layout}
        size={size}
        dieSeed={dieSeed}
        frozen={frozen}
      />
    </div>
  );
}

export const PORTFOLIO_EFFECT_IDS = Object.keys(EFFECTS);
