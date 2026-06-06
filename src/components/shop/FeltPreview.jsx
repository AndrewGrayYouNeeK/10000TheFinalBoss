import React from "react";
import FeltSurface from "./FeltSurface";

/**
 * Small swatch preview of a felt color used in the shop card.
 * Mirrors the DiceTray surface treatment in miniature.
 */
export default function FeltPreview({ felt }) {
  if (!felt) return null;
  return (
    <div
      className="relative w-32 h-20 rounded-xl overflow-hidden border-2 border-amber-900/70"
      style={{
        background: `radial-gradient(ellipse at 50% 35%, ${felt.inner} 0%, ${felt.mid} 50%, ${felt.outer} 100%)`,
      }}
    >
      <FeltSurface felt={felt} compact />
    </div>
  );
}