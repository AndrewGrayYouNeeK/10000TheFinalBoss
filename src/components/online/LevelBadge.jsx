import React from "react";

/**
 * Compact neon badge showing a player's level — single unified style, no tiers.
 */
const STYLE = {
  bg: "#062a3a",
  border: "#22d3ee",
  text: "#a5f3fc",
  glow: "rgba(34,211,238,0.55)",
};

export default function LevelBadge({ level = 1, size = "sm", className = "" }) {
  const sizes = {
    xs: { h: "h-4", px: "px-1", text: "text-[9px]", label: "text-[7px]" },
    sm: { h: "h-5", px: "px-1.5", text: "text-[10px]", label: "text-[8px]" },
    md: { h: "h-6", px: "px-2", text: "text-xs", label: "text-[9px]" },
  }[size] || { h: "h-5", px: "px-1.5", text: "text-[10px]", label: "text-[8px]" };

  return (
    <span
      title={`Level ${level}`}
      className={`inline-flex items-center gap-1 rounded ${sizes.h} ${sizes.px} border font-black tabular-nums ${className}`}
      style={{
        background: STYLE.bg,
        borderColor: STYLE.border,
        color: STYLE.text,
        textShadow: `0 0 6px ${STYLE.glow}`,
        boxShadow: `0 0 8px ${STYLE.glow}, inset 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      <span className={`${sizes.label} uppercase tracking-wider opacity-80`}>Lv</span>
      <span className={sizes.text}>{level}</span>
    </span>
  );
}