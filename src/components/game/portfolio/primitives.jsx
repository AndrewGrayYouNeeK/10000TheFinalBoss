import React from "react";
import { motion } from "framer-motion";

export const base = (radius) => ({ borderRadius: radius, position: "absolute", inset: 0, pointerEvents: "none" });

export function Layer({ radius, background, opacity = 1, blend, animate, transition, style = {} }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={animate}
      transition={transition}
      style={{ borderRadius: radius, background, opacity, mixBlendMode: blend, ...style }}
    />
  );
}

export function RotatingConic({ radius, stops, duration = 8, opacity = 1, blur = 0, reverse = false }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      style={{
        borderRadius: radius,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        background: `conic-gradient(from 0deg, ${stops})`,
      }}
    />
  );
}

export function PulseRing({ radius, color, delay = 0 }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top: "50%",
        left: "50%",
        width: "80%",
        height: "80%",
        marginTop: "-40%",
        marginLeft: "-40%",
        borderRadius: "50%",
        border: `1px solid ${color}`,
      }}
      animate={{ scale: [0.6, 1.4], opacity: [0.7, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

export function SparkField({ radius, color, count = 8 }) {
  const sparks = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 10 + ((i * 17) % 80),
        y: 8 + ((i * 23) % 75),
        s: 0.8 + (i % 3) * 0.4,
        d: i * 0.3,
      })),
    [count]
  );
  return (
    <>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: 3 * s.s,
            height: 3 * s.s,
            background: color,
            boxShadow: `0 0 ${4 * s.s}px ${color}`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 1.8 + s.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

export function TwinkleStar({ size = 12, tint = "#bae6fd", delay = 0, duration = 1.4, className = "", style = {}, animated = true }) {
  const uid = React.useId().replace(/:/g, "");
  const gradId = `twinkleGrad${uid}`;
  const glowId = `twinkleGlow${uid}`;

  const star = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: "visible", display: "block", ...style }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor={tint} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${glowId})`}>
        <ellipse cx="50" cy="50" rx="48" ry="2.5" fill={`url(#${gradId})`} />
        <ellipse cx="50" cy="50" rx="2.5" ry="48" fill={`url(#${gradId})`} />
        <g transform="rotate(45 50 50)">
          <ellipse cx="50" cy="50" rx="34" ry="1.6" fill={`url(#${gradId})`} opacity="0.8" />
          <ellipse cx="50" cy="50" rx="1.6" ry="34" fill={`url(#${gradId})`} opacity="0.8" />
        </g>
      </g>
      <circle cx="50" cy="50" r="7" fill="#ffffff" opacity="0.95" />
      <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
    </svg>
  );

  if (!animated) return star;

  return (
    <motion.div
      style={{ display: "inline-flex", lineHeight: 0 }}
      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      {star}
    </motion.div>
  );
}

export function ScanLine({ radius, color = "rgba(0,255,255,0.35)" }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] pointer-events-none"
      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 8px ${color}` }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function CrackOverlay({ radius, color = "#f97316" }) {
  return (
    <svg className="absolute inset-0 pointer-events-none opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ borderRadius: radius }}>
      <motion.path
        d="M48 8 L52 28 L44 42 L58 55 L50 72 L54 92"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M22 35 L38 48 L30 62 M72 25 L60 40 L68 58"
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 0.5 }}
      />
    </svg>
  );
}

export function HexGrid({ radius, stroke = "rgba(0,255,255,0.25)" }) {
  const hex = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(" ");
  };
  return (
    <svg className="absolute inset-0 pointer-events-none opacity-50" viewBox="0 0 100 100" style={{ borderRadius: radius }}>
      {[
        [25, 25], [50, 25], [75, 25],
        [12, 50], [37, 50], [62, 50], [87, 50],
        [25, 75], [50, 75], [75, 75],
      ].map(([x, y], i) => (
        <polygon key={i} points={hex(x, y, 9)} fill="none" stroke={stroke} strokeWidth="0.6" />
      ))}
    </svg>
  );
}

export function SpecularHighlight({ radius, intensity = 0.5 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius: radius,
        background: `radial-gradient(circle at 28% 22%, rgba(255,255,255,${intensity}) 0%, transparent 42%)`,
      }}
    />
  );
}

export function EdgeFrame({ radius, color, width = 1, glow, animate = false }) {
  const box = `inset 0 0 0 ${width}px ${color}${glow ? `, ${glow}` : ""}`;
  if (animate) {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        style={{ borderRadius: radius, boxShadow: box }}
      />
    );
  }
  return <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, boxShadow: box }} />;
}

export function NoiseFilm({ radius, opacity = 0.08 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius: radius,
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        mixBlendMode: "overlay",
      }}
    />
  );
}
