import React from "react";
import { motion } from "framer-motion";
import { getFeltTheme } from "@/lib/feltThemes";

function Layer({ children, className = "", style = {} }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ borderRadius: "inherit", ...style }}
    >
      {children}
    </div>
  );
}

function VelvetOverlay({ felt, compact }) {
  const pinstripes = felt.id === "velvet_royal";
  const h = felt.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const napAngle = 125 + (h % 20);

  return (
    <Layer>
      {/* Deep pile — dark troughs between crushed fibers */}
      <div
        className="absolute inset-0 mix-blend-multiply opacity-75"
        style={{
          backgroundImage: `repeating-linear-gradient(
            ${napAngle}deg,
            rgba(0,0,0,0.22) 0px,
            rgba(0,0,0,0.22) 1px,
            rgba(255,255,255,0.06) 1px,
            rgba(255,255,255,0.06) 2px,
            transparent 2px,
            transparent ${compact ? 5 : 8}px
          )`,
        }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-65"
        style={{
          background: `linear-gradient(${napAngle}deg, rgba(255,255,255,0.18) 0%, transparent 38%, rgba(0,0,0,0.28) 100%)`,
        }}
      />
      {pinstripes && (
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, rgba(212,175,55,0.32) 0 1px, transparent 1px ${compact ? 8 : 14}px)`,
          }}
        />
      )}
    </Layer>
  );
}

function MetalOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-50 mix-blend-overlay"
        style={{
          backgroundImage: "repeating-linear-gradient(-18deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 5px)",
        }}
      />
    </Layer>
  );
}

function NebulaOverlay({ compact }) {
  const stars = compact ? 8 : 16;
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-80 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(255,120,220,0.45) 0%, transparent 45%), radial-gradient(circle at 70% 60%, rgba(100,180,255,0.35) 0%, transparent 40%)",
        }}
      />
      {Array.from({ length: stars }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            left: `${10 + (i * 17) % 80}%`,
            top: `${8 + (i * 23) % 75}%`,
            opacity: 0.5 + (i % 5) * 0.1,
            boxShadow: "0 0 3px #fff",
          }}
        />
      ))}
    </Layer>
  );
}

function BlackHoleOverlay({ compact }) {
  return (
    <Layer>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #000 0%, #000 18%, rgba(120,80,255,0.25) 22%, transparent 55%)",
        }}
      />
      <motion.div
        className="absolute rounded-full border border-purple-400/40"
        style={{
          width: compact ? "40%" : "46%",
          height: compact ? "40%" : "46%",
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
        }}
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity } }}
      />
    </Layer>
  );
}

function AuroraOverlay() {
  return (
    <Layer>
      {["#5bf0c2", "#7fb6ff", "#c265d6"].map((color, i) => (
        <motion.div
          key={color}
          className="absolute inset-0 mix-blend-screen opacity-50"
          style={{
            background: `linear-gradient(${120 + i * 40}deg, transparent 20%, ${color}88 50%, transparent 80%)`,
          }}
          animate={{ opacity: [0.25, 0.55, 0.3] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </Layer>
  );
}

function HolographicOverlay() {
  const gradient =
    "linear-gradient(135deg, #ff8ad6, #7fb6ff, #5bf0c2, #ffe04a, #ff8ad6)";
  return (
    <Layer>
      {/* Full-bleed base — keeps shimmer under outer dice */}
      <div
        className="absolute inset-0 opacity-55 mix-blend-color-dodge"
        style={{ background: gradient }}
      />
      <motion.div
        className="absolute inset-0 opacity-50 mix-blend-color-dodge"
        style={{
          background: gradient,
          backgroundSize: "200% 200%",
          transform: "scale(1.14)",
          transformOrigin: "center center",
        }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
    </Layer>
  );
}

function QuantumFoamOverlay({ compact }) {
  const n = compact ? 6 : 12;
  return (
    <Layer>
      {Array.from({ length: n }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-cyan-300/50"
          style={{
            width: 4 + (i % 3) * 3,
            height: 4 + (i % 3) * 3,
            left: `${12 + (i * 19) % 70}%`,
            top: `${15 + (i * 27) % 65}%`,
          }}
          animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2 + (i % 3) * 0.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </Layer>
  );
}

function TronGridOverlay({ compact }) {
  const step = compact ? 12 : 18;
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28,230,255,0.45) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28,230,255,0.45) 1px, transparent 1px)
          `,
          backgroundSize: `${step}px ${step}px`,
          boxShadow: "inset 0 0 20px rgba(28,230,255,0.25)",
        }}
      />
    </Layer>
  );
}

const MATRIX_RAIN_TEXT = "ANDREW GRAY";
const MATRIX_RAIN_DURATION = 2.2;

/** Deterministic shuffle so adjacent columns don't share related phases (no wave). */
function matrixRainPhases(count, period) {
  const phases = Array.from({ length: count }, (_, i) => (i / count) * period);
  let s = 7919;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = phases[i];
    phases[i] = phases[j];
    phases[j] = tmp;
  }
  return phases;
}

function matrixRainChar(col, row) {
  // Irregular column start — avoids diagonal letter bands.
  const start = (col * 17 + ((col * col * 3) % 11) + 5) % MATRIX_RAIN_TEXT.length;
  return MATRIX_RAIN_TEXT[(start + row) % MATRIX_RAIN_TEXT.length];
}

function MatrixRainOverlay({ compact, intense = false }) {
  const cols = compact ? (intense ? 40 : 33) : intense ? 78 : 63;
  const rows = compact ? (intense ? 18 : 14) : intense ? 30 : 22;
  const duration = intense ? 1.25 : MATRIX_RAIN_DURATION;
  const phases = matrixRainPhases(cols, duration);
  return (
    <Layer className={`overflow-hidden ${intense ? "opacity-95" : "opacity-80"}`}>
      {Array.from({ length: cols }).map((_, i) => {
        const bright = ((i * 13 + 7) % 9) === 0;
        return (
          <motion.div
            key={i}
            className="absolute font-mono font-bold text-[6px] text-green-400 leading-none uppercase select-none"
            style={{
              left: `${(i / cols) * 100}%`,
              textShadow: "0 0 5px #22c55e",
              letterSpacing: "0.04em",
              color: bright ? "#4ade80" : "#16a34a",
            }}
            animate={{ top: ["-40%", "130%"] }}
            transition={{
              duration,
              repeat: Infinity,
              delay: phases[i],
              ease: "linear",
            }}
          >
            {Array.from({ length: rows }).map((__, j) => {
              const char = matrixRainChar(i, j);
              const fade = 0.28 + ((((i * 19) + (j * 7)) % 5) * 0.1);
              return (
                <div
                  key={j}
                  style={{
                    opacity: j === 0 ? 1 : fade,
                    color: j === 0 ? "#ecfdf5" : undefined,
                    minWidth: char === " " ? "0.45em" : undefined,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </div>
              );
            })}
          </motion.div>
        );
      })}
    </Layer>
  );
}

function SynthwaveOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-90"
        style={{ background: "linear-gradient(to top, #ff4a9e 0%, #7a2a8a 40%, transparent 100%)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "20px 12px",
          transform: "perspective(120px) rotateX(55deg)",
          transformOrigin: "bottom",
        }}
      />
      <div
        className="absolute left-1/2 bottom-[28%] w-16 h-16 -translate-x-1/2 rounded-full opacity-80"
        style={{ background: "radial-gradient(circle, #ffe04a 0%, #ff4a9e 55%, transparent 70%)" }}
      />
    </Layer>
  );
}

function CircuitBoardOverlay({ compact }) {
  return (
    <Layer>
      <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10 20 H40 V35 H70 V50 H90" stroke="#4ade80" strokeWidth="0.8" fill="none" opacity="0.7" />
        <path d="M5 60 H30 V75 H55 V90 H85" stroke="#22d3ee" strokeWidth="0.6" fill="none" opacity="0.6" />
        <circle cx="40" cy="35" r="2" fill="#fbbf24" />
        <circle cx="70" cy="50" r="1.5" fill="#fbbf24" />
        {!compact && <path d="M20 80 H45 V65 H80" stroke="#4ade80" strokeWidth="0.5" fill="none" opacity="0.5" />}
      </svg>
    </Layer>
  );
}

function GlitchOverlay() {
  return (
    <Layer>
      <motion.div
        className="absolute inset-0 mix-blend-screen opacity-40"
        style={{ background: "rgba(255,42,109,0.35)", clipPath: "inset(20% 0 40% 0)" }}
        animate={{ x: [-2, 3, -1, 0] }}
        transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 0.8 }}
      />
      <motion.div
        className="absolute inset-0 mix-blend-screen opacity-35"
        style={{ background: "rgba(28,230,255,0.3)", clipPath: "inset(50% 0 10% 0)" }}
        animate={{ x: [2, -3, 1, 0] }}
        transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 1.1 }}
      />
    </Layer>
  );
}

function LavaFlowOverlay({ compact }) {
  const count = compact ? 3 : 5;
  return (
    <Layer>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: count }).map((_, i) => (
          <motion.path
            key={i}
            d={`M${10 + i * 18} 100 Q${20 + i * 15} ${60 - i * 8} ${35 + i * 12} ${40 + i * 5} T${70 + i * 4} 20`}
            stroke="#ff6a1e"
            strokeWidth="1.2"
            fill="none"
            opacity="0.75"
            animate={{ opacity: [0.4, 0.95, 0.5] }}
            transition={{ duration: 1.5 + i * 0.3, repeat: Infinity }}
            style={{ filter: "drop-shadow(0 0 4px #ff6a1e)" }}
          />
        ))}
      </svg>
    </Layer>
  );
}

function FrozenLakeOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-50 mix-blend-soft-light"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%),
            repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 6px)
          `,
        }}
      />
    </Layer>
  );
}

function VolcanicAshOverlay({ compact }) {
  const n = compact ? 4 : 8;
  return (
    <Layer>
      {Array.from({ length: n }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-orange-500"
          style={{
            width: 2,
            height: 2,
            left: `${15 + (i * 21) % 70}%`,
            bottom: `${10 + (i * 13) % 40}%`,
            boxShadow: "0 0 4px #f97316",
          }}
          animate={{ y: [0, -20 - (i % 3) * 8], opacity: [0.9, 0] }}
          transition={{ duration: 2 + i * 0.2, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}
    </Layer>
  );
}

function StormCloudOverlay() {
  return (
    <Layer>
      <motion.div
        className="absolute inset-0 bg-white mix-blend-overlay"
        animate={{ opacity: [0, 0, 0.35, 0, 0] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.88, 0.9, 0.92, 1] }}
      />
    </Layer>
  );
}

function UnderwaterOverlay() {
  return (
    <Layer>
      <motion.div
        className="absolute inset-0 opacity-35 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(120,220,255,0.5) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 70% 60%, rgba(80,180,255,0.35) 0%, transparent 55%)",
        }}
        animate={{ opacity: [0.2, 0.45, 0.25] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      />
    </Layer>
  );
}

function MarbleOverlay() {
  return (
    <Layer>
      <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 50 Q30 20 60 55 T100 40" stroke="rgba(212,175,55,0.55)" strokeWidth="1.2" fill="none" />
        <path d="M0 70 Q40 45 75 80 T100 65" stroke="rgba(180,160,120,0.4)" strokeWidth="0.6" fill="none" />
      </svg>
    </Layer>
  );
}

function ObsidianGlassOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 40%, rgba(255,255,255,0.06) 100%)",
        }}
      />
    </Layer>
  );
}

function CasinoVipOverlay({ compact }) {
  return (
    <Layer>
      <div
        className="absolute inset-2 rounded-lg opacity-70"
        style={{
          border: `${compact ? 1 : 2}px solid rgba(212,175,55,0.55)`,
          boxShadow: "inset 0 0 12px rgba(212,175,55,0.15)",
        }}
      />
    </Layer>
  );
}

function VanGoghOverlay() {
  return (
    <Layer>
      <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 100 100">
        <path d="M10 60 Q30 30 50 50 T90 35" stroke="#fce070" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M15 70 Q40 45 65 65 T95 50" stroke="#5a8ee0" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    </Layer>
  );
}

function StainedGlassOverlay({ compact }) {
  const panels = compact ? 4 : 6;
  return (
    <Layer>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: panels }).map((_, i) => (
          <rect
            key={i}
            x={8 + (i % 3) * 30}
            y={12 + Math.floor(i / 3) * 38}
            width="24"
            height="32"
            fill={["rgba(230,74,74,0.35)", "rgba(58,106,190,0.35)", "rgba(250,204,21,0.3)"][i % 3]}
            stroke="rgba(30,30,30,0.8)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </Layer>
  );
}

function HalftoneOverlay({ compact }) {
  const size = compact ? 4 : 6;
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-50 mix-blend-multiply"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.55) 18%, transparent 19%)",
          backgroundSize: `${size}px ${size}px`,
        }}
      />
    </Layer>
  );
}

function WatercolorOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-55 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(circle at 25% 35%, rgba(248,180,216,0.55) 0%, transparent 45%), radial-gradient(circle at 75% 65%, rgba(168,200,240,0.5) 0%, transparent 40%)",
        }}
      />
    </Layer>
  );
}

function MossOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-45 mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(90,138,62,0.5) 0%, transparent 35%), radial-gradient(circle at 70% 70%, rgba(46,80,32,0.45) 0%, transparent 40%)",
        }}
      />
    </Layer>
  );
}

function DesertDunesOverlay() {
  return (
    <Layer>
      <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[20, 45, 70].map((y, i) => (
          <path key={i} d={`M0 ${y} Q25 ${y - 8 - i * 2} 50 ${y} T100 ${y + 3}`} stroke="rgba(0,0,0,0.15)" strokeWidth="1" fill="none" />
        ))}
      </svg>
    </Layer>
  );
}

function CherryBlossomOverlay({ compact }) {
  const n = compact ? 5 : 10;
  return (
    <Layer>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-70"
          style={{
            width: 5 + (i % 2),
            height: 5 + (i % 2),
            left: `${8 + (i * 19) % 85}%`,
            top: `${10 + (i * 23) % 80}%`,
            background: "radial-gradient(circle, #fbc4d8 0%, #e879a8 100%)",
          }}
        />
      ))}
    </Layer>
  );
}

function ForestFloorOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(160deg, transparent 40%, rgba(30,20,10,0.25) 41%, transparent 42%), radial-gradient(circle at 60% 70%, rgba(46,80,32,0.3) 0%, transparent 35%)",
        }}
      />
    </Layer>
  );
}

function OceanWaveOverlay() {
  return (
    <Layer>
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/3 opacity-50"
        style={{
          background: "linear-gradient(to top, rgba(255,255,255,0.25) 0%, transparent 100%)",
          borderTop: "2px solid rgba(255,255,255,0.2)",
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </Layer>
  );
}

function PinballOverlay({ compact }) {
  const n = compact ? 3 : 5;
  return (
    <Layer>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 border-yellow-300"
          style={{
            width: 10 + (i % 2) * 4,
            height: 10 + (i % 2) * 4,
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 22}%`,
            boxShadow: "0 0 6px #fbbf24, inset 0 0 4px rgba(255,255,255,0.3)",
          }}
        />
      ))}
    </Layer>
  );
}

function ArcadeCarpetOverlay({ compact }) {
  const size = compact ? 10 : 14;
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(255,74,214,0.35) 0 2px, transparent 2px ${size}px),
            repeating-linear-gradient(-45deg, rgba(28,230,255,0.3) 0 2px, transparent 2px ${size}px)
          `,
        }}
      />
    </Layer>
  );
}

function DungeonStoneOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)",
          backgroundSize: "22px 14px",
        }}
      />
    </Layer>
  );
}

function SpaceshipHullOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 40px, rgba(0,0,0,0.15) 40px 41px)",
        }}
      />
      {[20, 50, 80].map((x) => (
        <div key={x} className="absolute w-1.5 h-1.5 rounded-full bg-slate-400/60" style={{ left: `${x}%`, top: "15%" }} />
      ))}
    </Layer>
  );
}

function CasinoRouletteOverlay() {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: "conic-gradient(from 0deg, #c43a3a 0deg 60deg, #1a1a1a 60deg 120deg, #c43a3a 120deg 180deg, #1a1a1a 180deg 240deg, #c43a3a 240deg 300deg, #1a1a1a 300deg 360deg)",
          maskImage: "radial-gradient(circle, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 70%)",
        }}
      />
    </Layer>
  );
}

function LiveLightningOverlay() {
  return (
    <Layer>
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: "linear-gradient(105deg, transparent 48%, rgba(255,255,255,0.9) 49%, rgba(180,200,255,0.7) 50%, transparent 52%)",
        }}
        animate={{ opacity: [0, 0, 0.9, 0, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.86, 0.88, 0.9, 1] }}
      />
    </Layer>
  );
}

function FlowingRiverOverlay() {
  return (
    <Layer className="overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-35"
        style={{
          background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 20px, transparent 20px 40px)",
        }}
        animate={{ x: ["0%", "-40%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </Layer>
  );
}

function ConfettiBurstOverlay({ compact }) {
  const colors = ["#ffe04a", "#e64a9e", "#1ce6ff", "#4ade80"];
  const n = compact ? 8 : 14;
  return (
    <Layer>
      {Array.from({ length: n }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-2 rounded-sm"
          style={{
            left: `${20 + (i * 13) % 60}%`,
            top: `${15 + (i * 17) % 50}%`,
            background: colors[i % colors.length],
          }}
          animate={{ y: [0, 30 + (i % 4) * 10], rotate: [0, 180 + i * 30], opacity: [1, 0.6] }}
          transition={{ duration: 2.5 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </Layer>
  );
}

function PhoenixFireOverlay() {
  return (
    <Layer>
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/3 opacity-70"
        style={{
          background: "linear-gradient(to top, rgba(255,120,40,0.65) 0%, rgba(196,52,26,0.3) 50%, transparent 100%)",
        }}
        animate={{ opacity: [0.5, 0.85, 0.55] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    </Layer>
  );
}

function BloodMoonOverlay() {
  return (
    <Layer>
      <div
        className="absolute rounded-full opacity-50"
        style={{
          width: "35%",
          height: "35%",
          left: "55%",
          top: "20%",
          background: "radial-gradient(circle, rgba(122,31,36,0.7) 0%, transparent 70%)",
          boxShadow: "0 0 20px rgba(122,31,36,0.4)",
        }}
      />
    </Layer>
  );
}

function DeepGlowOverlay({ felt }) {
  return (
    <Layer>
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${felt.inner}88 0%, transparent 55%)`,
        }}
      />
    </Layer>
  );
}

function SolidEnhanceOverlay({ felt }) {
  if (felt.id === "sahara_sand") return <DesertDunesOverlay />;
  return null;
}

const THEME_COMPONENTS = {
  velvet: VelvetOverlay,
  metal: MetalOverlay,
  nebula: NebulaOverlay,
  black_hole: BlackHoleOverlay,
  aurora: AuroraOverlay,
  holographic: HolographicOverlay,
  quantum_foam: QuantumFoamOverlay,
  tron_grid: TronGridOverlay,
  matrix_rain: MatrixRainOverlay,
  synthwave: SynthwaveOverlay,
  circuit_board: CircuitBoardOverlay,
  glitch: GlitchOverlay,
  lava_flow: LavaFlowOverlay,
  frozen_lake: FrozenLakeOverlay,
  volcanic_ash: VolcanicAshOverlay,
  storm_cloud: StormCloudOverlay,
  underwater: UnderwaterOverlay,
  marble: MarbleOverlay,
  obsidian_glass: ObsidianGlassOverlay,
  casino_vip: CasinoVipOverlay,
  van_gogh: VanGoghOverlay,
  stained_glass: StainedGlassOverlay,
  halftone: HalftoneOverlay,
  watercolor: WatercolorOverlay,
  moss: MossOverlay,
  forest: MossOverlay,
  desert_dunes: DesertDunesOverlay,
  cherry_blossom: CherryBlossomOverlay,
  forest_floor: ForestFloorOverlay,
  ocean_wave: OceanWaveOverlay,
  pinball: PinballOverlay,
  arcade_carpet: ArcadeCarpetOverlay,
  dungeon_stone: DungeonStoneOverlay,
  spaceship_hull: SpaceshipHullOverlay,
  casino_roulette: CasinoRouletteOverlay,
  live_lightning: LiveLightningOverlay,
  flowing_river: FlowingRiverOverlay,
  confetti_burst: ConfettiBurstOverlay,
  phoenix_fire: PhoenixFireOverlay,
  blood_moon: BloodMoonOverlay,
  deep_glow: DeepGlowOverlay,
  solid: SolidEnhanceOverlay,
};

export default function FeltThemeOverlay({ felt, compact = false, intense = false }) {
  if (!felt) return null;
  const theme = getFeltTheme(felt.id);
  if (theme === "casino") return null;

  const Component = THEME_COMPONENTS[theme];
  if (!Component) return null;

  return <Component felt={felt} compact={compact} intense={intense} />;
}
