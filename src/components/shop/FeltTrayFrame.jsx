import React from "react";
import { getFeltBaseGradient, getWoodGrainOverlay, getWoodRailStyle } from "@/lib/feltVisuals";
import FeltSurface from "./FeltSurface";

/**
 * Wood rail + mottled felt base + surface layers. Shared by DiceTray and shop preview.
 * FeltSurface layers are position:absolute — empty swatches need an explicit height
 * (see FeltPreview) or children that size the tray.
 *
 * Portrait framed felts (green_wood, galaxy_window, …) ship with checkerboard padding
 * in the PNG. FeltSurface must stay overflow-hidden so the zoomed photo crops that
 * padding — even when allowDieOverflow lets ice/shark overlays hang past the rail.
 */
export default function FeltTrayFrame({
  felt,
  compact = false,
  intense = false,
  className = "",
  innerClassName = "",
  /** Let ice drips / overlays hang past the die box without clipping. */
  allowDieOverflow = false,
  children,
}) {
  if (!felt) return null;

  const framed = felt.includesFrame;
  const padding = framed ? "p-0" : compact ? "p-[5px]" : "p-2.5";
  const radiusOuter = compact ? "rounded-xl" : "rounded-[28px]";
  const radiusInner = framed ? radiusOuter : compact ? "rounded-lg" : "rounded-3xl";
  // Outer/inner may be overflow-visible for die FX, but the felt photo layer stays clipped.
  const shellClip = allowDieOverflow ? "overflow-visible" : "overflow-hidden";

  return (
    <div
      className={`relative ${shellClip} ${padding} ${radiusOuter} ${className}`}
      style={framed ? undefined : getWoodRailStyle(compact)}
    >
      {!framed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={getWoodGrainOverlay()}
        />
      )}
      <div
        className={`relative z-[1] ${shellClip} ${radiusInner} ${
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
        <div
          className={`absolute inset-0 pointer-events-none overflow-hidden ${radiusInner}`}
          aria-hidden
        >
          <FeltSurface felt={felt} compact={compact} intense={intense} />
        </div>
        {children}
      </div>
    </div>
  );
}
