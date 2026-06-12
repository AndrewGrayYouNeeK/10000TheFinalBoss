import React from "react";

/** Shared EQ bar visualizer for Soundwave dice + settings page */
export default function SoundwaveBarDisplay({ levels, live = false, className = "", barClassName = "flex-1" }) {
  return (
    <div className={`flex items-end justify-center gap-[2px] ${className}`}>
      {levels.map((lv, i) => (
        <div
          key={i}
          className={`${barClassName} rounded-t-sm origin-bottom`}
          style={{
            height: `${Math.min(100, lv * 100)}%`,
            background: `linear-gradient(to top, ${i % 2 ? "#ff00ea" : "#00ffff"}, rgba(255,255,255,0.8))`,
            boxShadow: `0 0 ${4 + lv * 10}px ${i % 2 ? "rgba(255,0,234,0.5)" : "rgba(0,255,255,0.5)"}`,
            transition: live ? "height 35ms linear" : undefined,
          }}
        />
      ))}
    </div>
  );
}
