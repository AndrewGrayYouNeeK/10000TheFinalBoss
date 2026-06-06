import React from "react";
import Die from "@/components/game/Die";

// Small static die preview for shop cards.
export default function DicePreview({ skinId, value = 5 }) {
  return (
    <div style={{ transform: "scale(1.1)" }}>
      <Die value={value} skinId={skinId} size={64} />
    </div>
  );
}