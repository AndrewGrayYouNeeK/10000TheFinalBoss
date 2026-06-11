import React from "react";
import { getFeltBaseGradient, getWoodGrainOverlay, getWoodRailStyle } from "@/lib/feltVisuals";
import FeltSurface from "./FeltSurface";

/**
 * Wood rail + mottled felt base + surface layers. Shared by DiceTray and shop preview.
 */
export default function FeltTrayFrame({
  felt,
  compact = false,
  className = "",
  innerClassName = "",
  children,
}) {
  if (!felt) return null;

  const padding = compact ? "p-[5px]" : "p-2.5";
  const radiusOuter = compact ? "rounded-xl" : "rounded-[28px]";
  const radiusInner = compact ? "rounded-lg" : "rounded-3xl";

  return (
    <div
      className={`relative overflow-hidden ${padding} ${radiusOuter} ${className}`}
      style={getWoodRailStyle(compact)}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={getWoodGrainOverlay()}
      />
      <div
        className={`relative overflow-hidden ${radiusInner} ${innerClassName}`}
        style={{
          background: getFeltBaseGradient(felt),
          boxShadow: "inset 0 3px 10px rgba(255,255,255,0.05)",
        }}
      >
        <FeltSurface felt={felt} compact={compact} />
        {children}
      </div>
    </div>
  );
}
