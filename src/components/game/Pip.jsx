import React, { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { usePortfolioDie } from "./portfolio/PortfolioDieContext";
import { getScoreMeterTheme } from "@/lib/scoreMeterTheme";

const BH_PIP_STAR_TINTS = ["#ffffff", "#e9d5ff", "#f0abfc", "#bae6fd", "#fef3c7"];

function BlackHolePip({ size, baseStyle, pipCol, pipRow }) {
  const phase = ((pipCol ?? 0) + (pipRow ?? 0)) * 0.41;
  const orbitCount = 8;

  return (
    <div
      style={{
        ...baseStyle,
        overflow: "visible",
        borderRadius: "50%",
        isolation: "isolate",
        background: "radial-gradient(circle at 38% 32%, #120818 0%, #000 72%)",
        boxShadow: `0 0 ${size * 0.4}px rgba(255,120,40,0.28), 0 ${size * 0.1}px ${size * 0.14}px rgba(0,0,0,0.9)`,
      }}
    >
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          inset: "-60%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.14) 0%, rgba(255,140,40,0.07) 38%, transparent 72%)",
        }}
      />

      {Array.from({ length: orbitCount }, (_, i) => {
        const startAngle = (i / orbitCount) * Math.PI * 2 + phase;
        const orbitR = size * (0.5 + (i % 3) * 0.11);
        const dot = Math.max(1.5, size * 0.09);
        const tint = BH_PIP_STAR_TINTS[i % BH_PIP_STAR_TINTS.length];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: dot,
              height: dot,
              left: "50%",
              top: "50%",
              marginLeft: -dot / 2,
              marginTop: -dot / 2,
              background: `radial-gradient(circle, #fff 0%, ${tint} 50%, transparent 100%)`,
              boxShadow: `0 0 ${dot}px rgba(255,255,255,0.85)`,
              zIndex: 2,
            }}
            animate={{
              x: [
                Math.cos(startAngle) * orbitR,
                Math.cos(startAngle + Math.PI * 0.75) * orbitR * 0.42,
                Math.cos(startAngle + Math.PI * 1.45) * orbitR * 0.1,
                0,
              ],
              y: [
                Math.sin(startAngle) * orbitR,
                Math.sin(startAngle + Math.PI * 0.75) * orbitR * 0.42,
                Math.sin(startAngle + Math.PI * 1.45) * orbitR * 0.1,
                0,
              ],
              opacity: [0.95, 0.8, 0.45, 0],
              scale: [1, 0.8, 0.4, 0],
            }}
            transition={{
              duration: 0.95 + (i % 3) * 0.14 + phase * 0.04,
              repeat: Infinity,
              ease: "easeIn",
              delay: i * 0.09,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          inset: "-6%",
          borderRadius: "50%",
          transform: "scaleY(0.36)",
          transformOrigin: "50% 50%",
          zIndex: 3,
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(180,80,20,0.55) 40deg, rgba(255,210,160,0.9) 72deg, rgba(255,250,235,0.98) 82deg, rgba(255,210,160,0.75) 92deg, transparent 130deg, transparent 210deg, rgba(30,60,120,0.5) 240deg, rgba(140,190,255,0.8) 268deg, rgba(200,230,255,0.95) 278deg, transparent 310deg)",
            filter: "blur(0.5px)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.35 + phase * 0.15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, transparent 36%, rgba(0,0,0,0.88) 56%, #000 74%)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "15%",
          borderRadius: "50%",
          border: "0.5px solid rgba(255,220,180,0.82)",
          boxShadow: "0 0 4px 1px rgba(255,180,100,0.5)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "54%",
          height: "54%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at 32% 28%, #1a1020 0%, #050208 38%, #000 100%)",
          boxShadow: "inset 0 0 10px 6px #000, 0 0 3px rgba(0,0,0,1)",
          zIndex: 10,
        }}
      />
    </div>
  );
}

// Renders a single pip. Supports special animated effects for premium skins.
export default function Pip({
  size,
  colorClass = "bg-gray-900",
  inset = false,
  animationEffect = null,
  pipCol = 1,
  pipRow = 1,
  scoreFill = 0,
}) {
  const s = size || 10;

  const baseStyle = {
    width: s,
    height: s,
    borderRadius: "50%",
    flexShrink: 0,
    position: "relative",
  };

  // --- WHITE PIP: minimal soft white orb ---
  if (animationEffect === "whitePip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)",
          boxShadow: "0 0 6px rgba(255,255,255,0.5), inset 0 1px 2px rgba(255,255,255,0.8)",
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  if (animationEffect === "mintPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #ffffff 0%, #6ee7b7 45%, #059669 100%)",
          overflow: "visible",
        }}
        animate={{
          boxShadow: [
            "0 0 8px 2px rgba(52,211,153,0.5)",
            "0 0 14px 5px rgba(110,231,183,0.85)",
            "0 0 8px 2px rgba(52,211,153,0.5)",
          ],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  if (animationEffect === "goldPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 30%, #ffffff 0%, #fde68a 35%, #f59e0b 70%, #b45309 100%)",
          overflow: "visible",
        }}
        animate={{
          boxShadow: [
            "0 0 8px 2px rgba(251,191,36,0.55)",
            "0 0 16px 5px rgba(253,224,71,0.9)",
            "0 0 8px 2px rgba(251,191,36,0.55)",
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  if (animationEffect === "violetPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #ffffff 0%, #c4b5fd 40%, #7c3aed 100%)",
          overflow: "visible",
        }}
        animate={{
          boxShadow: [
            "0 0 8px 2px rgba(167,139,250,0.55)",
            "0 0 16px 5px rgba(196,181,253,0.9)",
            "0 0 8px 2px rgba(167,139,250,0.55)",
          ],
        }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  if (animationEffect === "ynkPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #ffffff 0%, #00ffff 40%, #ff00ea 85%)",
          overflow: "visible",
        }}
        animate={{
          boxShadow: [
            "0 0 8px 2px rgba(0,255,255,0.55), 0 0 12px rgba(255,0,234,0.35)",
            "0 0 14px 5px rgba(0,255,255,0.9), 0 0 20px rgba(255,0,234,0.55)",
            "0 0 8px 2px rgba(0,255,255,0.55), 0 0 12px rgba(255,0,234,0.35)",
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  // --- GHOST PIP: soft cyan orb — fully vanishes at dimmest point, then returns ---
  if (animationEffect === "ghostPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background:
            "radial-gradient(circle at 38% 32%, #ffffff 0%, #a5f3fc 35%, #22d3ee 70%, #0891b2 100%)",
          overflow: "visible",
        }}
        animate={{
          opacity: [1, 0.5, 0, 0, 0.5, 1],
          boxShadow: [
            "0 0 14px 5px rgba(165,243,252,0.9), 0 0 24px 10px rgba(34,211,238,0.45)",
            "0 0 6px 2px rgba(34,211,238,0.25), 0 0 12px 4px rgba(34,211,238,0.1)",
            "0 0 0 0 transparent",
            "0 0 0 0 transparent",
            "0 0 6px 2px rgba(34,211,238,0.25), 0 0 12px 4px rgba(34,211,238,0.1)",
            "0 0 14px 5px rgba(165,243,252,0.9), 0 0 24px 10px rgba(34,211,238,0.45)",
          ],
        }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.22, 0.3, 0.72, 0.82, 1],
        }}
      />
    );
  }

  // --- NEON PINK: cyberpunk magenta pip ---
  if (animationEffect === "neonPink") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background:
            "radial-gradient(circle at 38% 32%, #ffffff 0%, #f9a8d4 30%, #ec4899 65%, #9d174d 100%)",
          overflow: "visible",
        }}
        animate={{
          boxShadow: [
            "0 0 8px 3px rgba(236,72,153,0.6), 0 0 18px 6px rgba(236,72,153,0.3)",
            "0 0 16px 6px rgba(244,114,182,1), 0 0 28px 12px rgba(236,72,153,0.55)",
            "0 0 8px 3px rgba(236,72,153,0.6), 0 0 18px 6px rgba(236,72,153,0.3)",
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  // --- GLOW: pulsing neon orb with bloom ---
  if (animationEffect === "glow") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background:
            "radial-gradient(circle at 38% 32%, #ffffff 0%, #bae6fd 25%, #38bdf8 55%, #0c4a6e 100%)",
          overflow: "visible",
        }}
        animate={{
          boxShadow: [
            "0 0 6px 2px rgba(56,189,248,0.5), 0 0 14px 4px rgba(56,189,248,0.25), inset 0 1px 2px rgba(255,255,255,0.7)",
            "0 0 14px 5px rgba(125,211,252,1), 0 0 26px 10px rgba(56,189,248,0.55), inset 0 1px 3px rgba(255,255,255,1)",
            "0 0 6px 2px rgba(56,189,248,0.5), 0 0 14px 4px rgba(56,189,248,0.25), inset 0 1px 2px rgba(255,255,255,0.7)",
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* highlight specular */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "18%",
            width: "40%",
            height: "30%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </motion.div>
    );
  }

  // --- SHINY STAR: golden orb with rotating sunburst + sparkle ---
  if (animationEffect === "shinyStar") {
    return (
      <div style={{ ...baseStyle, overflow: "visible" }}>
        {/* rotating sunburst rays (behind) */}
        <motion.div
          style={{
            position: "absolute",
            top: "-25%",
            left: "-25%",
            width: "150%",
            height: "150%",
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, rgba(253,224,71,0) 0deg, rgba(253,224,71,0.9) 10deg, rgba(253,224,71,0) 30deg, rgba(253,224,71,0) 90deg, rgba(253,224,71,0.9) 100deg, rgba(253,224,71,0) 120deg, rgba(253,224,71,0) 180deg, rgba(253,224,71,0.9) 190deg, rgba(253,224,71,0) 210deg, rgba(253,224,71,0) 270deg, rgba(253,224,71,0.9) 280deg, rgba(253,224,71,0) 300deg)",
            filter: "blur(1px)",
            opacity: 0.7,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        {/* golden core */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 38% 30%, #ffffff 0%, #fef08a 30%, #fbbf24 65%, #b45309 100%)",
            boxShadow:
              "0 0 8px 2px rgba(251,191,36,0.85), inset 0 1px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(180,83,9,0.6)",
          }}
          animate={{
            boxShadow: [
              "0 0 8px 2px rgba(251,191,36,0.85), inset 0 1px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(180,83,9,0.6)",
              "0 0 16px 4px rgba(253,224,71,1), inset 0 1px 3px rgba(255,255,255,1), inset 0 -2px 4px rgba(180,83,9,0.7)",
              "0 0 8px 2px rgba(251,191,36,0.85), inset 0 1px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(180,83,9,0.6)",
            ],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* twinkling sparkle highlight */}
        <motion.div
          style={{
            position: "absolute",
            top: "15%",
            left: "20%",
            width: "35%",
            height: "35%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  // --- RADIATION: pulsing on/off glow (Radiation skin overlay) ---
  if (animationEffect === "radiationPulse") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #fef08a 0%, #84cc16 40%, #a855f7 85%)",
          mixBlendMode: "screen",
        }}
        animate={{
          opacity: [0.15, 1, 0.15],
          boxShadow: [
            "0 0 4px 1px rgba(132,204,52,0.3)",
            "0 0 18px 6px rgba(168,85,247,0.85), 0 0 28px rgba(132,204,52,0.5)",
            "0 0 4px 1px rgba(132,204,52,0.3)",
          ],
          scale: [0.92, 1.08, 0.92],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  // --- RADAR REVEAL: invisible until horizontal sweep passes ---
  if (animationEffect === "radarReveal") {
    return <RadarRevealPip baseStyle={baseStyle} pipCol={pipCol} />;
  }

  if (animationEffect === "propellerPip") {
    return (
      <div style={{ ...baseStyle, overflow: "visible" }}>
        <motion.div
          style={{ position: "absolute", inset: "-20%", transformOrigin: "center" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.18, repeat: Infinity, ease: "linear" }}
        >
          {[0, 120, 240].map((deg) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "45%",
                height: "18%",
                marginTop: "-9%",
                transformOrigin: "0% 50%",
                transform: `rotate(${deg}deg)`,
                background: "linear-gradient(90deg, #475569, #cbd5e1)",
                borderRadius: 2,
              }}
            />
          ))}
        </motion.div>
        <div
          style={{
            ...baseStyle,
            background: "#334155",
            boxShadow: "inset 0 0 4px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    );
  }

  if (animationEffect === "zapperPip") {
    return (
      <div style={{ ...baseStyle, overflow: "visible" }}>
        <motion.div
          style={{
            position: "absolute",
            inset: "-35%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(168,85,247,0.35) 40%, transparent 70%)",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.95, 1.15, 0.95] }}
          transition={{ duration: 1.8 + ((pipCol ?? 0) + (pipRow ?? 0)) * 0.1, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{
            ...baseStyle,
            background: "radial-gradient(circle at 40% 35%, #fff 0%, #c4b5fd 35%, #7c3aed 70%, #4c1d95 100%)",
            boxShadow: "0 0 10px rgba(196,181,253,0.9), 0 0 18px rgba(168,85,247,0.6), inset 0 0 4px rgba(255,255,255,0.5)",
          }}
          animate={{
            opacity: [0.85, 1, 0.85],
            boxShadow: [
              "0 0 8px rgba(196,181,253,0.7), 0 0 16px rgba(168,85,247,0.5)",
              "0 0 16px rgba(255,255,255,0.9), 0 0 28px rgba(168,85,247,0.85)",
              "0 0 8px rgba(196,181,253,0.7), 0 0 16px rgba(168,85,247,0.5)",
            ],
          }}
          transition={{ duration: 1.4 + ((pipCol ?? 0) + (pipRow ?? 0)) * 0.08, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  if (animationEffect === "hypnoCorePip") {
    const pairs = [
      ["#ffffff", "#111111"],
      ["#ff66ff", "#220022"],
      ["#66ffff", "#002222"],
      ["#ffff66", "#222200"],
      ["#ff9966", "#221100"],
    ];
    const [light, dark] = pairs[((pipCol ?? 0) + (pipRow ?? 0) * 2) % pairs.length];
    return (
      <div style={{ ...baseStyle, overflow: "visible" }}>
        <motion.div
          style={{
            ...baseStyle,
            background: `repeating-radial-gradient(circle, ${light} 0px, ${light} 1px, ${dark} 1px, ${dark} 2.5px)`,
            boxShadow: `0 0 10px ${light}66`,
          }}
          animate={{ rotate: [0, 360], scale: [1, 1.12, 1] }}
          transition={{
            rotate: { duration: 4 + ((pipCol ?? 0) + (pipRow ?? 0)) * 0.25, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>
    );
  }

  if (animationEffect === "explodingPip") {
    return (
      <div style={{ ...baseStyle, overflow: "visible" }}>
        {[0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: `${-ring * 25}%`,
              border: "2px solid rgba(253,224,71,0.6)",
            }}
            animate={{ scale: [0.5, 2.2], opacity: [0.9, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: ring * 0.35, ease: "easeOut" }}
          />
        ))}
        <motion.div
          style={{
            ...baseStyle,
            background: "radial-gradient(circle, #fff 0%, #fde68a 30%, #f97316 70%, #dc2626 100%)",
          }}
          animate={{ scale: [1, 1.25, 1], boxShadow: ["0 0 8px #fbbf24", "0 0 24px #f97316", "0 0 8px #fbbf24"] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </div>
    );
  }

  if (animationEffect === "plasmaCutPip") {
    return (
      <div
        style={{
          ...baseStyle,
          overflow: "visible",
          background: "transparent",
          boxShadow: "none",
        }}
      />
    );
  }

  if (animationEffect === "scoreGlowPip") {
    const theme = getScoreMeterTheme(scoreFill);
    const midGlow = theme.t > 0.06 ? `0 0 ${4 + theme.t * 10}px rgba(245, 158, 11, ${0.2 + theme.t * 0.35})` : undefined;
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: theme.pipBackground,
        }}
        animate={
          theme.pipAnimate
            ? { boxShadow: ["0 0 8px #fde68a", "0 0 22px #fbbf24", "0 0 8px #fde68a"], scale: [1, 1.12, 1] }
            : {
                opacity: [0.72 + theme.t * 0.12, 1, 0.72 + theme.t * 0.12],
                ...(midGlow ? { boxShadow: [midGlow, `0 0 ${8 + theme.t * 14}px rgba(253, 224, 71, ${0.35 + theme.t * 0.25})`, midGlow] } : {}),
              }
        }
        transition={{ duration: theme.pipAnimate ? 1 : 2, repeat: Infinity }}
      />
    );
  }

  if (animationEffect === "hiddenPip") {
    return null;
  }

  // --- FLAME: living fire orb ---
  if (animationEffect === "flamePip") {
    return (
      <div style={{ ...baseStyle, overflow: "visible" }}>
        <motion.div
          style={{
            position: "absolute",
            inset: "-15%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(253,224,71,0.5) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <motion.div
          style={{
            ...baseStyle,
            background: "radial-gradient(circle at 40% 30%, #fff 0%, #fde68a 25%, #f97316 60%, #dc2626 100%)",
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>
    );
  }

  if (animationEffect === "plasmaPip") {
    return (
      <motion.div
        style={{ ...baseStyle, overflow: "visible" }}
        animate={{
          boxShadow: [
            "0 0 10px 3px rgba(168,85,247,0.6), 0 0 20px rgba(56,189,248,0.4)",
            "0 0 18px 6px rgba(56,189,248,0.9), 0 0 28px rgba(168,85,247,0.6)",
            "0 0 10px 3px rgba(168,85,247,0.6), 0 0 20px rgba(56,189,248,0.4)",
          ],
        }}
        transition={{ duration: 0.9, repeat: Infinity }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, #a855f7, #38bdf8, #f0abfc, #a855f7)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <div
          style={{
            position: "absolute",
            inset: "18%",
            borderRadius: "50%",
            background: "radial-gradient(circle, #fff 0%, #e0e7ff 100%)",
          }}
        />
      </motion.div>
    );
  }

  if (animationEffect === "biolumPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #ecfdf5 0%, #34d399 40%, #059669 100%)",
          boxShadow: "0 0 12px 4px rgba(52,211,153,0.7)",
        }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.1, 0.95] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
    );
  }

  if (animationEffect === "inkPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 45% 40%, #525252 0%, #171717 50%, #000 100%)",
          filter: "blur(0.3px)",
        }}
        animate={{ scale: [0.9, 1.05, 0.92], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    );
  }

  if (animationEffect === "holoPip") {
    return (
      <motion.div style={{ ...baseStyle, overflow: "visible" }}>
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00ffff, #ff00ea, #fde68a, #00ffff)",
            backgroundSize: "200% 200%",
          }}
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div
          style={{
            position: "absolute",
            inset: "20%",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.85)",
          }}
        />
      </motion.div>
    );
  }

  if (animationEffect === "emberPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 30%, #fef3c7 0%, #fb923c 45%, #c2410c 100%)",
        }}
        animate={{
          boxShadow: [
            "0 0 6px 2px rgba(251,146,60,0.5)",
            "0 0 14px 5px rgba(249,115,22,0.85)",
            "0 0 6px 2px rgba(251,146,60,0.5)",
          ],
        }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
    );
  }

  if (animationEffect === "icePip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 35% 28%, #ffffff 0%, #bae6fd 30%, #0ea5e9 70%, #0369a1 100%)",
          boxShadow: "inset 0 1px 3px rgba(255,255,255,0.9), 0 0 10px rgba(186,230,253,0.6)",
        }}
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
    );
  }

  if (animationEffect === "coralPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #ffe4e6 0%, #fb7185 45%, #e11d48 100%)",
        }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    );
  }

  if (animationEffect === "matrixPip") {
    return (
      <motion.div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle at 38% 32%, #bbf7d0 0%, #22c55e 50%, #14532d 100%)",
          fontFamily: "monospace",
        }}
        animate={{
          boxShadow: [
            "0 0 8px rgba(34,197,94,0.6)",
            "0 0 16px rgba(74,222,128,0.9)",
            "0 0 8px rgba(34,197,94,0.6)",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    );
  }

  if (animationEffect === "xrayPip") {
    const phase = ((pipCol ?? 0) + (pipRow ?? 0)) * 0.31;
    return (
      <div style={{ ...baseStyle, overflow: "visible", borderRadius: "50%" }}>
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: "-45%",
            background: "radial-gradient(circle, rgba(224,242,254,0.55) 0%, rgba(56,189,248,0.2) 45%, transparent 72%)",
            filter: "blur(1px)",
          }}
          animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 1.8 + phase, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{
            ...baseStyle,
            background:
              "radial-gradient(circle at 42% 38%, #ffffff 0%, #e0f2fe 22%, #38bdf8 55%, #0c4a6e 88%, #020617 100%)",
            boxShadow: "0 0 10px rgba(224,242,254,0.95), 0 0 18px rgba(56,189,248,0.75), inset 0 0 4px rgba(255,255,255,0.8)",
          }}
          animate={{
            boxShadow: [
              "0 0 8px rgba(224,242,254,0.85), 0 0 14px rgba(56,189,248,0.6), inset 0 0 3px rgba(255,255,255,0.7)",
              "0 0 14px rgba(255,255,255,0.95), 0 0 24px rgba(125,211,252,0.85), inset 0 0 6px rgba(255,255,255,0.95)",
              "0 0 8px rgba(224,242,254,0.85), 0 0 14px rgba(56,189,248,0.6), inset 0 0 3px rgba(255,255,255,0.7)",
            ],
          }}
          transition={{ duration: 2.2 + phase, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: "18%",
            background: "repeating-radial-gradient(circle, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 2.5px)",
            mixBlendMode: "screen",
          }}
          animate={{ rotate: [0, 360], opacity: [0.35, 0.7, 0.35] }}
          transition={{
            rotate: { duration: 12 + phase * 2, repeat: Infinity, ease: "linear" },
            opacity: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>
    );
  }

  // --- BLACK HOLE: miniature singularity + local swirling star field ---
  if (animationEffect === "blackHole") {
    return <BlackHolePip size={s} baseStyle={baseStyle} pipCol={pipCol} pipRow={pipRow} />;
  }

  return (
    <div
      style={{
        ...baseStyle,
        background: inset
          ? "radial-gradient(circle at 40% 35%, #3a3a3a 0%, #111 60%, #000 100%)"
          : "radial-gradient(circle at 40% 35%, #555 0%, #111 100%)",
        boxShadow: inset
          ? "inset 0 2px 4px rgba(0,0,0,0.9), inset 0 1px 2px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.15)"
          : "inset 0 1px 3px rgba(0,0,0,0.8)",
      }}
    />
  );
}

function radarPipCenterX(pipCol) {
  const gridStart = 0.13;
  const gap = 0.045;
  const cell = (0.74 - 2 * gap) / 3;
  return gridStart + (pipCol ?? 1) * (cell + gap) + cell / 2;
}

function RadarRevealPip({ baseStyle, pipCol }) {
  const ctx = usePortfolioDie();
  const fallbackSweep = useMotionValue(0);
  const sweepX = ctx?.sweepX ?? fallbackSweep;
  const pipCenter = radarPipCenterX(pipCol);
  const opacity = useMotionValue(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (ctx?.sweepX) return undefined;
    const ctrl = animate(fallbackSweep, [0, 1, 0], {
      duration: 5.2,
      repeat: Infinity,
      ease: "linear",
    });
    return () => ctrl.stop();
  }, [ctx?.sweepX, fallbackSweep]);

  useEffect(() => {
    const THRESH = 0.016;

    const update = (v) => {
      const prev = prevRef.current;
      const forward = v >= prev - 1e-5;
      const lit = forward
        ? v >= pipCenter - THRESH
        : v > pipCenter + THRESH;
      opacity.set(lit ? 1 : 0);
      prevRef.current = v;
    };

    prevRef.current = sweepX.get();
    update(prevRef.current);
    return sweepX.on("change", update);
  }, [sweepX, pipCenter, opacity]);

  const glow = useTransform(opacity, (o) =>
    o > 0.5
      ? "0 0 10px rgba(0,255,255,0.85), 0 0 18px rgba(0,255,255,0.45)"
      : "0 0 0 transparent"
  );

  return (
    <motion.div
      style={{
        ...baseStyle,
        opacity,
        background: "radial-gradient(circle at 38% 32%, #fff 0%, #00ffff 50%, #0891b2 100%)",
        boxShadow: glow,
      }}
    />
  );
}