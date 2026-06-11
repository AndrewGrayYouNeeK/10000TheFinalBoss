import React from "react";
import FeltTrayFrame from "./FeltTrayFrame";

/**
 * Small swatch preview of a felt color used in the shop card.
 * Mirrors the in-game DiceTray surface treatment in miniature.
 */
export default function FeltPreview({ felt }) {
  if (!felt) return null;
  return (
    <FeltTrayFrame felt={felt} compact className="w-32 h-20" />
  );
}
