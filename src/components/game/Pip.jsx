import React from "react";
import { motion } from "framer-motion";

// Renders a single pip. Supports special animated effects for premium skins.
// `animationEffect` values: "glow" | "shinyStar" | "blackHole" | null
export default function Pip({ size, colorClass = "bg-gray-900", inset = false, animationEffect = null }) {
  const s = size || 10;

  const baseStyle = {
    width: s,
    height: s,
    borderRadius: "50%",
    flexShrink: 0,
    position: "relative",
  };

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

  // --- BLACK HOLE: swirling accretion disk + event horizon + lensing ring ---
  if (animationEffect === "blackHole") {
    return (
      <div style={{ ...baseStyle, overflow: "visible" }}>
        {/* outer lensing ring (gravitational glow) */}
        <motion.div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-15%",
            width: "130%",
            height: "130%",
            borderRadius: "50%",
            boxShadow:
              "0 0 6px 1px rgba(168,85,247,0.6), 0 0 14px 3px rgba(56,189,248,0.4)",
            background:
              "radial-gradient(circle, transparent 55%, rgba(168,85,247,0.35) 65%, transparent 80%)",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* swirling accretion disk */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, #f97316 0deg, #a855f7 80deg, #1e1b4b 160deg, #000 200deg, #38bdf8 280deg, #f97316 360deg)",
            filter: "blur(0.5px)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
        {/* inner shadow ring (curve) */}
        <div
          style={{
            position: "absolute",
            inset: "15%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 70%, #000 100%)",
          }}
        />
        {/* event horizon — pure black core with subtle pulse */}
        <motion.div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: "#000",
            boxShadow:
              "0 0 6px 2px rgba(0,0,0,1), inset 0 0 4px 2px rgba(0,0,0,1)",
            transform: "translate(-50%, -50%)",
          }}
          animate={{ scale: [1, 0.85, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
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