import React from "react";
import { getFeltBaseGradient, getWoodGrainOverlay, getWoodRailStyle } from "@/lib/feltVisuals";
import FeltSurface from "./FeltSurface";

/**
 * Wood rail + mottled felt base + surface layers. Shared by DiceTray and shop preview.
 * FeltSurface layers are position:absolute — empty swatches need an explicit height
 * (see FeltPreview) or children that size the tray.
 */
export default function FeltTrayFrame({
  felt,
  compact = false,
  intense = false,
  className = "",
  innerClassName = "",
  children,
}) {
  if (!felt) return null;

  const framed = felt.includesFrame;
  const padding = framed ? "p-0" : compact ? "p-[5px]" : "p-2.5";
  const radiusOuter = compact ? "rounded-xl" : "rounded-[28px]";
  const radiusInner = framed ? radiusOuter : compact ? "rounded-lg" : "rounded-3xl";

  return (
    <div
      className={`relative overflow-hidden ${padding} ${radiusOuter} ${className}`}
      style={framed ? undefined : getWoodRailStyle(compact)}
    >
      {!framed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={getWoodGrainOverlay()}
        />
      )}
      <div
        className={`relative z-[1] overflow-hidden ${radiusInner} ${
          children ? "" : "h-full min-h-[4.5rem]"
        } ${innerClassName}`}
        style={
          framed
            ? undefined
            : {
                background: getFeltBaseGradient(felt),
                boxShadow: "inset 0 3px 10px rgba(255,255,255,0.05)",
              }
        }
      >
        <FeltSurface felt={felt} compact={compact} intense={intense} />
        {children}
      </div>
    </div>
  );
}
