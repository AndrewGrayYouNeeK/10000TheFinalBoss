import React from "react";
import { motion } from "framer-motion";

function GlowLayer({ radius, color, blur, inset = -10, opacity = 0.85, animate = true }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        inset,
        borderRadius: radius + Math.abs(inset) * 0.4,
        boxShadow: `0 0 ${blur}px ${color}, 0 0 ${blur * 1.8}px ${color}`,
        opacity,
      }}
      animate={animate ? { opacity: [opacity * 0.55, opacity, opacity * 0.55] } : undefined}
      transition={animate ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : undefined}
    />
  );
}

function RingBorder({ radius, color, width = 2, glow, inset = -3, pulse = true }) {
  const shadow = glow ?? `0 0 12px ${color}, 0 0 24px ${color}`;
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        inset,
        borderRadius: radius + Math.abs(inset) * 0.5,
        border: `${width}px solid ${color}`,
        boxShadow: shadow,
      }}
      animate={pulse ? { opacity: [0.6, 1, 0.6] } : undefined}
      transition={pulse ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : undefined}
    />
  );
}

function RadialBloom({ radius, colors, inset = -16, duration = 2 }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        inset,
        borderRadius: radius + Math.abs(inset) * 0.5,
        background: colors,
      }}
      animate={{ scale: [0.94, 1.05, 0.94], opacity: [0.65, 1, 0.65] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// —— Favorites ——

function AmberGlow({ radius }) {
  return (
    <>
      <GlowLayer radius={radius} color="rgba(251,191,36,0.95)" blur={14} inset={-6} opacity={0.9} />
      <GlowLayer radius={radius} color="rgba(245,158,11,0.65)" blur={28} inset={-14} opacity={0.75} />
      <RingBorder radius={radius} color="rgba(252,211,77,0.85)" width={2} inset={-4} />
    </>
  );
}

function NeonRing({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -3,
          borderRadius: radius + 3,
          border: "2.5px solid #22d3ee",
          boxShadow:
            "0 0 8px #22d3ee, 0 0 18px rgba(34,211,238,0.75), inset 0 0 10px rgba(34,211,238,0.25)",
        }}
        animate={{
          boxShadow: [
            "0 0 8px #22d3ee, 0 0 18px rgba(34,211,238,0.75), inset 0 0 10px rgba(34,211,238,0.25)",
            "0 0 14px #67e8f9, 0 0 28px rgba(103,232,249,0.9), inset 0 0 14px rgba(103,232,249,0.35)",
            "0 0 8px #22d3ee, 0 0 18px rgba(34,211,238,0.75), inset 0 0 10px rgba(34,211,238,0.25)",
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <GlowLayer radius={radius} color="rgba(34,211,238,0.5)" blur={22} inset={-12} opacity={0.6} />
    </>
  );
}

function GoldAura({ radius }) {
  return (
    <>
      <RadialBloom
        radius={radius}
        colors="radial-gradient(circle at 50% 45%, rgba(252,211,77,0.55) 0%, rgba(245,158,11,0.28) 42%, transparent 72%)"
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -8,
          borderRadius: radius + 6,
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, transparent 55%)",
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <RingBorder radius={radius} color="rgba(252,211,77,0.7)" width={1.5} inset={-2} pulse={false} />
    </>
  );
}

function ElectricViolet({ radius, size }) {
  const sparks = [
    { x: "8%", y: "8%", delay: 0 },
    { x: "92%", y: "12%", delay: 0.3 },
    { x: "6%", y: "88%", delay: 0.55 },
    { x: "90%", y: "86%", delay: 0.15 },
  ];
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -10,
          borderRadius: radius + 8,
          background:
            "conic-gradient(from 0deg, rgba(168,85,247,0.45), rgba(236,72,153,0.35), rgba(129,140,248,0.4), rgba(168,85,247,0.45))",
          filter: "blur(6px)",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <RingBorder
        radius={radius}
        color="rgba(192,132,252,0.85)"
        glow="0 0 16px rgba(168,85,247,0.65), inset 0 0 12px rgba(168,85,247,0.2)"
      />
      {sparks.map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none rounded-full bg-white"
          style={{
            left: s.x,
            top: s.y,
            width: size * 0.08,
            height: size * 0.08,
            marginLeft: -size * 0.04,
            marginTop: -size * 0.04,
            boxShadow: "0 0 8px #e879f9, 0 0 14px #a855f7",
          }}
          animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeOut", delay: s.delay }}
        />
      ))}
    </>
  );
}

// —— Portfolio ——

function EmeraldPulse({ radius }) {
  return (
    <>
      <GlowLayer radius={radius} color="rgba(52,211,153,0.9)" blur={16} inset={-7} />
      <GlowLayer radius={radius} color="rgba(16,185,129,0.55)" blur={30} inset={-15} opacity={0.7} />
      <RingBorder radius={radius} color="rgba(110,231,183,0.9)" glow="0 0 14px rgba(52,211,153,0.8)" />
    </>
  );
}

function RubyFlame({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -12,
          borderRadius: radius + 10,
          background:
            "radial-gradient(circle at 50% 110%, rgba(239,68,68,0.55) 0%, rgba(220,38,38,0.25) 35%, transparent 65%)",
        }}
        animate={{ opacity: [0.5, 0.95, 0.55, 0.9, 0.5] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <RingBorder radius={radius} color="rgba(248,113,113,0.9)" glow="0 0 16px rgba(239,68,68,0.75)" />
      <GlowLayer radius={radius} color="rgba(251,146,60,0.45)" blur={20} inset={-10} opacity={0.65} />
    </>
  );
}

function IceFrost({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -6,
          borderRadius: radius + 4,
          border: "2px solid rgba(224,242,254,0.85)",
          boxShadow:
            "0 0 12px rgba(186,230,253,0.8), inset 0 0 14px rgba(224,242,254,0.35), inset 0 -4px 8px rgba(125,211,252,0.25)",
        }}
        animate={{ opacity: [0.7, 1, 0.75] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <GlowLayer radius={radius} color="rgba(186,230,253,0.55)" blur={24} inset={-14} opacity={0.7} />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          borderRadius: radius,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(186,230,253,0.08) 100%)",
        }}
        animate={{ opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function RoseChroma({ radius }) {
  return (
    <>
      <RadialBloom
        radius={radius}
        colors="radial-gradient(circle at 50% 50%, rgba(244,114,182,0.5) 0%, rgba(236,72,153,0.28) 45%, transparent 72%)"
      />
      <RingBorder radius={radius} color="rgba(251,207,232,0.85)" glow="0 0 18px rgba(244,114,182,0.7)" />
    </>
  );
}

function SunsetWarmth({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -14,
          borderRadius: radius + 12,
          background:
            "radial-gradient(circle at 50% 40%, rgba(251,146,60,0.45) 0%, rgba(244,63,94,0.3) 50%, transparent 75%)",
        }}
        animate={{ scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <RingBorder radius={radius} color="rgba(253,186,116,0.8)" glow="0 0 14px rgba(251,146,60,0.65)" />
    </>
  );
}

function ToxicPulse({ radius }) {
  return (
    <>
      <GlowLayer radius={radius} color="rgba(74,222,128,0.85)" blur={18} inset={-8} />
      <RingBorder radius={radius} color="rgba(134,239,172,0.9)" glow="0 0 20px rgba(34,197,94,0.75)" />
      <motion.div
        className="absolute pointer-events-none opacity-25 mix-blend-screen"
        style={{
          inset: 0,
          borderRadius: radius,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(74,222,128,0.5) 0 1px, transparent 1px 4px)",
        }}
        animate={{ opacity: [0.1, 0.35, 0.1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}

function MoltenCore({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -4,
          borderRadius: radius + 2,
          background:
            "radial-gradient(circle at 50% 55%, rgba(251,146,60,0.65) 0%, rgba(234,88,12,0.35) 40%, transparent 70%)",
        }}
        animate={{ opacity: [0.65, 1, 0.7], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <RingBorder radius={radius} color="rgba(251,191,36,0.75)" glow="0 0 16px rgba(234,88,12,0.7)" />
      <GlowLayer radius={radius} color="rgba(220,38,38,0.35)" blur={26} inset={-12} opacity={0.55} />
    </>
  );
}

function HoloShift({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -8,
          borderRadius: radius + 6,
          background:
            "linear-gradient(135deg, rgba(244,114,182,0.55), rgba(96,165,250,0.5), rgba(52,211,153,0.5), rgba(251,191,36,0.55), rgba(244,114,182,0.55))",
          backgroundSize: "300% 300%",
          filter: "blur(5px)",
        }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
      />
      <RingBorder radius={radius} color="rgba(255,255,255,0.8)" glow="0 0 18px rgba(167,139,250,0.65)" />
    </>
  );
}

function PlasmaBlue({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -12,
          borderRadius: radius + 10,
          background:
            "conic-gradient(from 180deg, rgba(59,130,246,0.5), rgba(96,165,250,0.35), rgba(37,99,235,0.45), rgba(59,130,246,0.5))",
          filter: "blur(8px)",
        }}
        animate={{ rotate: [0, -360] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      <RingBorder radius={radius} color="rgba(147,197,253,0.9)" glow="0 0 20px rgba(59,130,246,0.8)" />
    </>
  );
}

function CopperRim({ radius }) {
  return (
    <>
      <RingBorder
        radius={radius}
        color="rgba(217,119,6,0.9)"
        width={2.5}
        glow="0 0 10px rgba(180,83,9,0.65), inset 0 0 8px rgba(251,191,36,0.2)"
        pulse={false}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -8,
          borderRadius: radius + 6,
          background:
            "linear-gradient(145deg, rgba(251,191,36,0.2) 0%, transparent 45%, rgba(180,83,9,0.15) 100%)",
        }}
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function SapphireGlow({ radius }) {
  return (
    <>
      <GlowLayer radius={radius} color="rgba(59,130,246,0.85)" blur={14} inset={-6} />
      <GlowLayer radius={radius} color="rgba(30,64,175,0.55)" blur={32} inset={-16} opacity={0.75} />
      <RingBorder radius={radius} color="rgba(147,197,253,0.85)" glow="0 0 18px rgba(37,99,235,0.7)" />
    </>
  );
}

function WhiteHot({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -10,
          borderRadius: radius + 8,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.25) 35%, transparent 68%)",
        }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <RingBorder radius={radius} color="rgba(255,255,255,0.95)" glow="0 0 22px rgba(255,255,255,0.85)" />
    </>
  );
}

function VoidEdge({ radius }) {
  return (
    <>
      <RingBorder
        radius={radius}
        color="rgba(88,28,135,0.95)"
        glow="0 0 20px rgba(76,29,149,0.8), inset 0 0 16px rgba(0,0,0,0.45)"
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: 2,
          borderRadius: radius - 1,
          background:
            "radial-gradient(circle at 50% 45%, rgba(167,139,250,0.15) 0%, transparent 60%)",
        }}
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function MatrixGreen({ radius }) {
  return (
    <>
      <RingBorder radius={radius} color="rgba(74,222,128,0.95)" glow="0 0 16px rgba(34,197,94,0.85)" />
      <motion.div
        className="absolute pointer-events-none font-mono text-[5px] text-green-400 leading-none overflow-hidden opacity-60"
        style={{ inset: 2, borderRadius: radius - 1 }}
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${i * 12}%`, top: 0 }}>
            {(i % 2 ? "10" : "01").repeat(6)}
          </div>
        ))}
      </motion.div>
    </>
  );
}

function CoralBloom({ radius }) {
  return (
    <>
      <RadialBloom
        radius={radius}
        colors="radial-gradient(circle at 50% 50%, rgba(251,113,133,0.45) 0%, rgba(253,186,116,0.28) 50%, transparent 72%)"
        duration={2.2}
      />
      <RingBorder radius={radius} color="rgba(254,205,211,0.85)" glow="0 0 14px rgba(251,113,133,0.65)" />
    </>
  );
}

function DualRing({ radius }) {
  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -2,
          borderRadius: radius + 2,
          border: "2px solid rgba(252,211,77,0.85)",
          boxShadow: "0 0 10px rgba(251,191,36,0.6)",
        }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -7,
          borderRadius: radius + 6,
          border: "2px solid rgba(34,211,238,0.75)",
          boxShadow: "0 0 14px rgba(34,211,238,0.55)",
        }}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function SonarPing({ radius, size }) {
  return (
    <>
      <RingBorder radius={radius} color="rgba(34,211,238,0.85)" glow="0 0 12px rgba(34,211,238,0.6)" pulse={false} />
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            width: size * 0.5,
            height: size * 0.5,
            marginLeft: -size * 0.25,
            marginTop: -size * 0.25,
            borderRadius: radius,
            border: "2px solid rgba(103,232,249,0.7)",
          }}
          animate={{ scale: [0.6, 1.45], opacity: [0.75, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: i * 0.9 }}
        />
      ))}
    </>
  );
}

function ChromaSplit({ radius }) {
  return (
    <>
      <div
        className="absolute pointer-events-none"
        style={{
          inset: -3,
          borderRadius: radius + 3,
          border: "2px solid rgba(255,255,255,0.85)",
          boxShadow: "-2px 0 8px rgba(239,68,68,0.7), 2px 0 8px rgba(59,130,246,0.7)",
        }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -5,
          borderRadius: radius + 4,
          border: "1px solid rgba(74,222,128,0.5)",
          transform: "translateX(1px)",
        }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function OrbitSparks({ radius, size }) {
  const count = 6;
  return (
    <>
      <RingBorder radius={radius} color="rgba(192,132,252,0.7)" glow="0 0 14px rgba(168,85,247,0.5)" />
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none rounded-full bg-white"
          style={{
            width: size * 0.06,
            height: size * 0.06,
            left: "50%",
            top: "50%",
            marginLeft: -size * 0.03,
            marginTop: -size * 0.03,
            boxShadow: "0 0 6px #e879f9",
          }}
          animate={{
            x: [
              Math.cos((i / count) * Math.PI * 2) * size * 0.42,
              Math.cos((i / count) * Math.PI * 2 + Math.PI * 2) * size * 0.42,
            ],
            y: [
              Math.sin((i / count) * Math.PI * 2) * size * 0.42,
              Math.sin((i / count) * Math.PI * 2 + Math.PI * 2) * size * 0.42,
            ],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: i * 0.08 }}
        />
      ))}
    </>
  );
}

function LaserScan({ radius }) {
  return (
    <>
      <RingBorder radius={radius} color="rgba(248,113,113,0.75)" glow="0 0 12px rgba(239,68,68,0.55)" pulse={false} />
      <motion.div
        className="absolute pointer-events-none left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(248,113,113,0.95), transparent)",
          boxShadow: "0 0 10px rgba(248,113,113,0.9)",
        }}
        animate={{ top: ["8%", "92%", "8%"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

// —— Legacy ——

function LightningBorder({ radius, size }) {
  const bolts = [
    "M 8 4 L 14 22 L 10 22 L 18 42 L 12 24 L 16 24 L 10 4 Z",
    "M 92 12 L 84 28 L 88 28 L 78 48 L 86 30 L 82 30 L 90 12 Z",
    "M 6 88 L 12 72 L 8 72 L 16 52 L 10 70 L 14 70 L 8 88 Z",
    "M 94 90 L 88 74 L 92 74 L 82 54 L 90 72 L 86 72 L 94 90 Z",
  ];
  return (
    <div className="absolute pointer-events-none" style={{ inset: -size * 0.12 }}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <filter id="heldZapGlow">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="6" y="6" width="88" height="88" rx={Math.max(8, radius * 0.9)} fill="none" stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" />
        {bolts.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="rgba(224,242,254,0.95)"
            filter="url(#heldZapGlow)"
            animate={{ opacity: [0.15, 1, 0.2, 0.9, 0.15] }}
            transition={{ duration: 0.35 + i * 0.08, repeat: Infinity, ease: "linear", delay: i * 0.12 }}
          />
        ))}
      </svg>
    </div>
  );
}

function CornerBadge() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-black font-black text-xs pointer-events-none z-20"
    >
      ✓
    </motion.div>
  );
}

const HELD_EFFECTS = {
  amber_glow: AmberGlow,
  neon_cyan: NeonRing,
  gold_aura: GoldAura,
  electric_violet: ElectricViolet,
  emerald_pulse: EmeraldPulse,
  ruby_flame: RubyFlame,
  ice_frost: IceFrost,
  rose_chroma: RoseChroma,
  sunset_warmth: SunsetWarmth,
  toxic_pulse: ToxicPulse,
  molten_core: MoltenCore,
  holo_shift: HoloShift,
  plasma_blue: PlasmaBlue,
  copper_rim: CopperRim,
  sapphire_glow: SapphireGlow,
  white_hot: WhiteHot,
  void_edge: VoidEdge,
  matrix_green: MatrixGreen,
  coral_bloom: CoralBloom,
  dual_ring: DualRing,
  sonar_ping: SonarPing,
  chroma_split: ChromaSplit,
  orbit_sparks: OrbitSparks,
  laser_scan: LaserScan,
  lightning: LightningBorder,
  corner_badge: CornerBadge,
};

export default function HeldDiceOverlay({ styleId = "amber_glow", size, radius }) {
  const Effect = HELD_EFFECTS[styleId] ?? AmberGlow;
  return <Effect radius={radius} size={size} />;
}
