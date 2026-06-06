import React from "react";
import { motion } from "framer-motion";

// Animated cyberpunk backdrop: dark base, neon grid floor, scanlines, drifting particles, vignette glow.
export default function CyberBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: "#03040a" }}>
      {/* Magenta/cyan radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,0,170,0.18) 0%, transparent 45%), radial-gradient(ellipse at 80% 90%, rgba(0,255,200,0.18) 0%, transparent 45%)",
        }}
      />

      {/* Perspective neon grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(0,255,200,0.08) 50%, rgba(0,255,200,0.18) 100%)",
          maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,200,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,170,0.25) 1px, transparent 1px)",
            backgroundSize: "40px 40px, 40px 40px",
            transform: "perspective(420px) rotateX(60deg)",
            transformOrigin: "bottom",
          }}
        />
      </div>

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,255,200,0.06) 2px, rgba(0,255,200,0.06) 3px)",
        }}
      />

      {/* Neon digital rain */}
      <div className="absolute inset-0 opacity-40 neon-rain-overlay mix-blend-screen" />

      {/* Slow scanline sweep */}
      <motion.div
        className="absolute inset-x-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(0,255,200,0.08), transparent)",
        }}
        animate={{ y: ["-20%", "120%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating neon particles */}
      {Array.from({ length: 14 }).map((_, i) => {
        const left = (i * 73) % 100;
        const delay = (i * 0.6) % 5;
        const duration = 6 + (i % 5);
        const color = i % 2 === 0 ? "rgba(0,255,200,0.7)" : "rgba(255,0,170,0.7)";
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3,
              height: 3,
              left: `${left}%`,
              bottom: -10,
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
            animate={{ y: [0, -800], opacity: [0, 1, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
          />
        );
      })}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}