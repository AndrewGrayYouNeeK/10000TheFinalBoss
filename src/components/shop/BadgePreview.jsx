import React from "react";
import { motion } from "framer-motion";

export default function BadgePreview({ badge, size = 64 }) {
  if (!badge) return null;
  // Level badges show the number instead of just an emoji.
  const isLevel = typeof badge.level === "number";
  return (
    <motion.div
      animate={{ scale: [1, 1.08, 1], rotate: [0, 6, -6, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className={`rounded-full bg-gradient-to-br ${badge.color} flex flex-col items-center justify-center shadow-lg text-white font-black`}
      style={{ width: size, height: size }}
    >
      {isLevel ? (
        <>
          <span style={{ fontSize: size * 0.18, lineHeight: 1, opacity: 0.85, letterSpacing: 1 }}>LV</span>
          <span style={{ fontSize: size * 0.42, lineHeight: 1, marginTop: 2 }}>{badge.level}</span>
        </>
      ) : (
        <span style={{ fontSize: size * 0.5 }}>{badge.emoji}</span>
      )}
    </motion.div>
  );
}