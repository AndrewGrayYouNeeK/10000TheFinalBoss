import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { EdgeFrame, NoiseFilm } from "./primitives";
import { usePortfolioDie } from "./PortfolioDieContext";
import { useAudioLevels } from "./useAudioLevels";

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

function RadarRings({ radius, color = "rgba(52,211,153,0.35)" }) {
  return (
    <svg className="absolute inset-0 pointer-events-none opacity-60" viewBox="0 0 100 100" style={{ borderRadius: radius }}>
      {[20, 35, 50].map((r) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="0.6" />
      ))}
      <line x1="50" y1="0" x2="50" y2="100" stroke={color} strokeWidth="0.4" />
      <line x1="0" y1="50" x2="100" y2="50" stroke={color} strokeWidth="0.4" />
    </svg>
  );
}

function RotatingRadarSweep({ radius }) {
  const { radarAngle } = usePortfolioDie();
  const rotate = useTransform(radarAngle, (v) => `${v}deg`);
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none origin-center"
      style={{ rotate, borderRadius: radius }}
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
          borderRadius: radius,
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

function RadarBlipsLayer({ layout, size, radius }) {
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
    <svg className="absolute inset-0 pointer-events-none z-20" viewBox="0 0 100 100" style={{ borderRadius: radius }}>
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

function HypnoBurstRings({ layout, radius }) {
  const targets = React.useMemo(() => getPipTargets(layout), [layout]);
  const ringCount = 120;
  const ringDuration = 1.35;
  const stagger = ringDuration / ringCount;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          background: "radial-gradient(circle at 50% 50%, #14101f 0%, #050508 65%, #000 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          borderRadius: radius,
          background:
            "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.07) 0deg 12deg, transparent 12deg 24deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          borderRadius: radius,
          background:
            "conic-gradient(from 0deg, transparent, rgba(168,85,247,0.06), transparent, rgba(34,211,238,0.06), transparent, rgba(244,114,182,0.06), transparent)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{ borderRadius: radius, background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 55%)" }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg
        className="absolute inset-0 pointer-events-none z-[5] overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ borderRadius: radius }}
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

function XrayScene({ radius, layout }) {
  const targets = React.useMemo(() => getPipTargets(layout), [layout]);
  const bone = "rgba(224,242,254,0.92)";
  const boneDim = "rgba(125,211,252,0.45)";
  const boneFaint = "rgba(56,189,248,0.22)";

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          background: "radial-gradient(ellipse at 50% 42%, #0c1a2e 0%, #030712 52%, #000 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          borderRadius: radius,
          background: "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.08) 0%, transparent 62%)",
          mixBlendMode: "screen",
        }}
      />
      <svg
        className="absolute inset-0 pointer-events-none z-[3] overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ borderRadius: radius, filter: "drop-shadow(0 0 4px rgba(56,189,248,0.35))" }}
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
        style={{ borderRadius: radius, boxShadow: "inset 0 0 28px 8px rgba(0,0,0,0.85)" }}
        animate={{ opacity: [0.85, 1, 0.88, 1] }}
        transition={{ duration: 0.08, repeat: Infinity, repeatDelay: 2.4 }}
      />

      <motion.div
        className="absolute inset-0 pointer-events-none z-[4] mix-blend-screen"
        style={{ borderRadius: radius, background: "rgba(186,230,254,0.04)" }}
        animate={{ opacity: [0.2, 0.55, 0.25, 0.5, 0.2] }}
        transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 0.04 }}
      />

      <NoiseFilm radius={radius} opacity={0.14} />
      <EdgeFrame radius={radius} color="rgba(125,211,252,0.55)" glow="0 0 16px rgba(56,189,248,0.35)" animate />
    </>
  );
}

function FlyIcon({ size = 9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ overflow: "visible", display: "block" }}>
      <motion.ellipse
        cx="6"
        cy="7"
        rx="4.5"
        ry="2"
        fill="rgba(230,230,230,0.8)"
        animate={{ ry: [2, 0.5, 2] }}
        transition={{ duration: 0.07, repeat: Infinity }}
      />
      <motion.ellipse
        cx="14"
        cy="7"
        rx="4.5"
        ry="2"
        fill="rgba(230,230,230,0.8)"
        animate={{ ry: [2, 0.5, 2] }}
        transition={{ duration: 0.07, repeat: Infinity, delay: 0.035 }}
      />
      <ellipse cx="10" cy="12" rx="2.4" ry="3.6" fill="#0a0a0a" />
      <circle cx="10" cy="8.5" r="1.6" fill="#0a0a0a" />
    </svg>
  );
}

function BuzzingFly({ id, size, points, duration, delay, zapAt }) {
  const xs = [...points.map((p) => `${p.x}%`), `${points[0].x}%`];
  const ys = [...points.map((p) => `${p.y}%`), `${points[0].y}%`];
  const tZap = Math.min(0.92, Math.max(0.35, zapAt));
  const times = [0, tZap - 0.08, tZap - 0.02, tZap, tZap + 0.04, tZap + 0.1, 1];

  return (
    <motion.div
      className="absolute pointer-events-none z-[6]"
      style={{ x: "-50%", y: "-50%" }}
      animate={{
        left: xs,
        top: ys,
        opacity: [1, 1, 1, 1, 0, 0, 1],
        scale: [1, 1, 1, 1, 2.4, 0.15, 1],
        rotate: [0, 12, -8, 15, 40, 0, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        times,
        ease: "linear",
      }}
    >
      <motion.div
        className="absolute left-1/2 bottom-full pointer-events-none"
        style={{
          width: 1.5,
          height: 18,
          marginLeft: -0.75,
          background: "linear-gradient(to top, rgba(255,255,255,0.9), rgba(56,189,248,0.5), transparent)",
          boxShadow: "0 0 6px #fff",
        }}
        animate={{ opacity: [0, 0, 0, 1, 0, 0, 0], scaleY: [0.2, 0.2, 0.2, 1, 0.2, 0.2, 0.2] }}
        transition={{ duration, repeat: Infinity, delay, times, ease: "linear" }}
      />
      <FlyIcon size={size} />
    </motion.div>
  );
}

function BugZapperScene({ radius, layout }) {
  const uid = React.useId().replace(/:/g, "");
  const glowId = `zapMeshGlow${uid}`;
  const targets = React.useMemo(() => getPipTargets(layout), [layout]);
  const flyCount = Math.min(5, 2 + targets.length);

  const flies = React.useMemo(
    () =>
      Array.from({ length: flyCount }, (_, i) => ({
        id: i,
        size: 5 + seeded(i, 0) * 4,
        duration: 2.8 + seeded(i, 1) * 2.2,
        delay: seeded(i, 2) * 2.5,
        zapAt: 0.55 + seeded(i, 3) * 0.22,
        points: Array.from({ length: 4 }, (_, j) => ({
          x: 12 + seeded(i, j + 5) * 76,
          y: 12 + seeded(i, j + 10) * 76,
        })),
      })),
    [flyCount]
  );

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          background: "radial-gradient(circle at 50% 35%, rgba(60,20,100,0.35) 0%, #0a0612 100%)",
        }}
      />
      <svg className="absolute inset-0 pointer-events-none z-[4]" viewBox="0 0 100 100" style={{ borderRadius: radius }}>
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
      {flies.map((f) => (
        <BuzzingFly key={f.id} {...f} />
      ))}
      <EdgeFrame radius={radius} color="rgba(167,139,250,0.45)" glow="0 0 10px rgba(168,85,247,0.3)" />
    </>
  );
}

const MATRIX_STORM_TEXT = "ANDREW GRAY";

function matrixStormChar(col, row, layer) {
  const start = (col * 2 + layer * 5) % MATRIX_STORM_TEXT.length;
  return MATRIX_STORM_TEXT[(start + row) % MATRIX_STORM_TEXT.length];
}

function MatrixStormScene({ radius }) {
  const columns = 12;
  const rowCount = 10;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          background: "radial-gradient(circle at 50% 45%, #041208 0%, #010403 55%, #000 100%)",
        }}
      />
      {Array.from({ length: columns }, (_, i) => (
        <motion.div
          key={`mx-${i}`}
          className="absolute font-mono font-bold pointer-events-none select-none leading-none uppercase"
          style={{
            left: `${(i / columns) * 100}%`,
            fontSize: 6.5,
            color: i % 4 === 0 ? "#4ade80" : "#16a34a",
            textShadow: "0 0 4px #4ade80",
            opacity: 0.85,
            letterSpacing: "0.06em",
          }}
          animate={{ top: ["-110%", "130%"] }}
          transition={{
            duration: 0.082 + (i % 5) * 0.014,
            repeat: Infinity,
            delay: (i * 0.05) % 0.42,
            ease: "linear",
          }}
        >
          {Array.from({ length: rowCount }, (__, j) => {
            const char = matrixStormChar(i, j, 0);
            return (
              <div
                key={j}
                style={{
                  opacity: j === 0 ? 1 : 0.2 + ((j + i) % 3) * 0.12,
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
          fontSize: 5.6,
          lineHeight: 1.05,
          letterSpacing: "0.2em",
          textShadow: "0 0 10px #22c55e",
        }}
        animate={{
          opacity: [0, 0, 0.9, 0],
          scale: [0.92, 0.92, 1.04, 1.1],
          filter: ["blur(4px)", "blur(4px)", "blur(0px)", "blur(6px)"],
        }}
        transition={{
          duration: 0.28,
          repeat: Infinity,
          repeatDelay: 2.4,
          ease: "easeOut",
        }}
      >
        {MATRIX_STORM_TEXT}
      </motion.div>
      <EdgeFrame radius={radius} color="rgba(34,197,94,0.4)" />
    </>
  );
}

function SoundwaveBars() {
  const { levels, live, pending, error, synthetic, enableMic } = useAudioLevels(14, true);

  return (
    <>
      {!live && (
        <div
          role="button"
          tabIndex={0}
          className="absolute inset-0 z-10 flex items-end justify-center pb-1 pointer-events-auto cursor-pointer"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            enableMic();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              enableMic();
            }
          }}
          title={error || "Tap to enable audio"}
        >
          <span className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-cyan-300 border border-cyan-500/40">
            {pending ? "Listening…" : error || "Tap for audio"}
          </span>
        </div>
      )}
      {live && synthetic && error && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 z-10 text-[6px] font-bold uppercase tracking-wider text-amber-300/80 pointer-events-none">
          Demo audio
        </span>
      )}
      <div className="absolute inset-0 flex items-end justify-center gap-[2px] px-2 pb-2 pointer-events-none">
        {levels.map((lv, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm origin-bottom"
            style={{
              height: `${lv * 88}%`,
              background: `linear-gradient(to top, ${i % 2 ? "#ff00ea" : "#00ffff"}, rgba(255,255,255,0.8))`,
              boxShadow: `0 0 6px ${i % 2 ? "rgba(255,0,234,0.5)" : "rgba(0,255,255,0.5)"}`,
              transition: live ? "height 40ms linear" : undefined,
            }}
          />
        ))}
      </div>
    </>
  );
}

const EFFECTS = {
  radar_sweep: ({ radius }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, background: "linear-gradient(180deg, #020408 0%, #0f172a 100%)" }} />
      <RadarRings radius={radius} color="rgba(0,255,255,0.3)" />
      <SweepLine color="rgba(0,255,255,0.9)" width={4} />
      <EdgeFrame radius={radius} color="rgba(0,255,255,0.35)" animate />
    </>
  ),

  tornado_mono: ({ radius }) => (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          background: "radial-gradient(circle at 50% 50%, #262626 0%, #0a0a0a 55%, #000 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{
          borderRadius: radius,
          background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.04) 30deg, transparent 60deg)",
        }}
      />
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute font-mono font-bold pointer-events-none select-none"
          style={{
            left: `${(i * 5.8) % 96}%`,
            fontSize: 7 + (i % 3),
            color: i % 4 === 0 ? "#ffffff" : i % 4 === 1 ? "#e5e5e5" : i % 4 === 2 ? "#a3a3a3" : "#d4d4d4",
            textShadow: "0 0 6px rgba(255,255,255,0.6)",
            opacity: 0.75 + (i % 3) * 0.08,
          }}
          animate={{ top: ["-90%", "115%"] }}
          transition={{
            duration: 0.28 + (i % 5) * 0.06,
            repeat: Infinity,
            delay: (i * 0.09) % 1.4,
            ease: "linear",
          }}
        >
          {Array.from({ length: 12 }).map((__, j) => (
            <div key={j} style={{ opacity: 0.4 + ((j + i) % 4) * 0.15 }}>
              {String.fromCharCode(0x30a0 + ((i * 11 + j * 17) % 80))}
            </div>
          ))}
        </motion.div>
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={`s-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: `${(i * 7) % 90}%`,
            height: 1,
            width: `${12 + (i % 4) * 8}%`,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
            opacity: 0.35 + (i % 3) * 0.15,
          }}
          animate={{ left: ["-40%", "140%"] }}
          transition={{
            duration: 0.22 + (i % 4) * 0.05,
            repeat: Infinity,
            delay: i * 0.06,
            ease: "linear",
          }}
        />
      ))}
    </>
  ),

  rainfall: ({ radius }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, background: "linear-gradient(180deg, #1e293b 0%, #334155 55%, #475569 100%)" }} />
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[1px] pointer-events-none"
          style={{
            left: `${(i * 3.7) % 98}%`,
            height: 8 + (i % 4) * 3,
            background: "linear-gradient(to bottom, transparent, rgba(186,230,253,0.85))",
          }}
          animate={{ top: ["-12%", "112%"] }}
          transition={{ duration: 0.45 + (i % 5) * 0.12, repeat: Infinity, delay: (i * 0.07) % 1.2, ease: "linear" }}
        />
      ))}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ borderRadius: radius, background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 50%)" }} />
    </>
  ),

  score_meter: ({ radius, scoreFill = 0.5 }) => {
    const full = scoreFill >= 0.98;
    return (
      <>
        <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, background: "#0f172a" }} />
        <div className="absolute inset-2 pointer-events-none overflow-hidden" style={{ borderRadius: radius - 4 }}>
          <motion.div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: `${Math.min(100, scoreFill * 100)}%`,
              background: full
                ? "linear-gradient(to top, #fde68a, #f59e0b, #00ffff)"
                : "linear-gradient(to top, #0891b2, #06b6d4, #22d3ee)",
              boxShadow: full ? "0 0 24px rgba(253,224,71,0.8), inset 0 0 20px rgba(255,255,255,0.3)" : "none",
            }}
            animate={full ? { opacity: [0.85, 1, 0.85] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          {[25, 50, 75].map((t) => (
            <div key={t} className="absolute left-0 right-0 h-px bg-white/20 pointer-events-none" style={{ bottom: `${t}%` }} />
          ))}
        </div>
        <EdgeFrame radius={radius} color={full ? "rgba(253,224,71,0.7)" : "rgba(34,211,238,0.35)"} glow={full ? "0 0 20px rgba(253,224,71,0.5)" : undefined} animate={full} />
      </>
    );
  },

  binary_storm: ({ radius }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, background: "#020408" }} />
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
      <NoiseFilm radius={radius} opacity={0.12} />
      <EdgeFrame radius={radius} color="rgba(34,197,94,0.45)" animate />
    </>
  ),

  soundwave: ({ radius }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, background: "linear-gradient(145deg, #020408 0%, #1e1b4b 100%)" }} />
      <SoundwaveBars />
      <EdgeFrame radius={radius} color="rgba(255,0,234,0.25)" />
    </>
  ),

  radar_blips: ({ radius, layout, size = 64 }) => (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, background: "radial-gradient(circle, #052e16 0%, #020408 70%)" }} />
      <RadarRings radius={radius} />
      <RotatingRadarSweep radius={radius} />
      <RadarBlipsLayer layout={layout} size={size} radius={radius} />
      <EdgeFrame radius={radius} color="rgba(74,222,128,0.35)" />
    </>
  ),

  matrix_storm: ({ radius }) => <MatrixStormScene radius={radius} />,

  plasma_cut: ({ radius, layout, size = 64 }) => {
    const targets = getPipTargets(layout);
    const pipR = ((size * 0.145) / 2 / size) * 100;
    return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: radius, background: "linear-gradient(145deg, #0f172a 0%, #020408 100%)" }}
      />
      <svg className="absolute inset-0 pointer-events-none z-[5]" viewBox="0 0 100 100" style={{ borderRadius: radius }}>
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

  core_burst: ({ radius, layout }) => (
    <HypnoBurstRings layout={layout} radius={radius} />
  ),

  bug_zapper: ({ radius, layout }) => (
    <BugZapperScene radius={radius} layout={layout} />
  ),

  xray: ({ radius, layout }) => <XrayScene radius={radius} layout={layout} />,
};

export default function PortfolioDieEffect({ effectId, radius, scoreFill, layout, size }) {
  const Effect = EFFECTS[effectId];
  if (!Effect) return null;
  return <Effect radius={radius} scoreFill={scoreFill} layout={layout} size={size} />;
}

export const PORTFOLIO_EFFECT_IDS = Object.keys(EFFECTS);
