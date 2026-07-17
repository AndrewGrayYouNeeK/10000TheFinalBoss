import React from "react";
import FeltTrayFrame from "./FeltTrayFrame";

/**
 * Shop felt swatch — real tray surface so names match what you see in-game.
 * Outer wrapper sets height; FeltSurface is absolute so the frame must fill it.
 */
export default function FeltPreview({ felt }) {
  if (!felt) return null;

  return (
    <div className="w-full max-w-[11.5rem] h-[5.75rem]">
      <FeltTrayFrame felt={felt} compact className="w-full h-full" innerClassName="h-full" />
    </div>
  );
}
