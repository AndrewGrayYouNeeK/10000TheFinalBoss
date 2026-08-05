import React, { useState, useEffect } from "react";
import Die from "@/components/game/Die";
import { useCosmetics } from "@/hooks/useCosmetics";

const SHOWCASE_DICE_VALUES = [1, 2, 3, 4, 5, 6];

// Continuously rolling row of 6 dice for the Home screen — uses the equipped skin.
export default function DiamondShowcase() {
  const { equippedSkinId } = useCosmetics();
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    let rollTimeout;
    const interval = setInterval(() => {
      setRolling(true);
      rollTimeout = setTimeout(() => {
        setRolling(false);
      }, 900);
    }, 2200);
    return () => {
      clearInterval(interval);
      clearTimeout(rollTimeout);
    };
  }, []);

  return (
    <div className="relative flex justify-center gap-1.5 mb-4 overflow-visible isolate">
      {SHOWCASE_DICE_VALUES.map((value, i) => (
        <div
          key={i}
          className="relative z-10"
          style={i === 0 ? { transform: "translate(-6px, -6px)" } : undefined}
        >
          <Die
            value={value}
            rolling={rolling}
            size={40}
            skinId={equippedSkinId}
            dieSeed={i + 1}
          />
        </div>
      ))}
    </div>
  );
}
