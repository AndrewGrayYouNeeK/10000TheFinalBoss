import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TurnBanner({ message, variant = "info" }) {
  if (!message) return null;

  // Neon variant palette: { glow, border, text }
  const variants = {
    info: {
      glow: "rgba(0,200,255,0.55)",
      border: "rgba(0,200,255,0.7)",
      text: "#7ee8ff",
      bg: "rgba(0,30,55,0.7)",
    },
    success: {
      glow: "rgba(0,255,170,0.6)",
      border: "rgba(0,255,170,0.75)",
      text: "#7effc4",
      bg: "rgba(0,40,30,0.7)",
    },
    danger: {
      glow: "rgba(255,40,90,0.65)",
      border: "rgba(255,40,90,0.8)",
      text: "#ff89a3",
      bg: "rgba(55,5,15,0.75)",
    },
    warning: {
      glow: "rgba(255,180,0,0.6)",
      border: "rgba(255,180,0,0.75)",
      text: "#ffd766",
      bg: "rgba(50,30,0,0.7)",
    },
  };
  const v = variants[variant] || variants.info;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="rounded-xl px-4 py-2 text-center font-bold uppercase tracking-wider text-sm border"
        style={{
          color: v.text,
          background: v.bg,
          borderColor: v.border,
          boxShadow: `0 0 18px ${v.glow}, 0 0 0 1px ${v.border} inset`,
          textShadow: `0 0 8px ${v.glow}`,
        }}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}