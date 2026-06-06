import React, { useState, useEffect } from "react";
import Die from "@/components/game/Die";
import { useCosmetics } from "@/hooks/useCosmetics";

// Continuously rolling row of 6 dice for the Home screen — uses the equipped skin.
export default function DiamondShowcase() {
  const { equippedSkinId, equippedPipsId } = useCosmetics();
  const [dice, setDice] = useState([1, 2, 3, 4, 5, 6]);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRolling(true);
      setTimeout(() => {
        setDice(Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1));
        setRolling(false);
      }, 900);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center gap-1.5 mb-4">
      {dice.map((value, i) => (
        <div
          key={i}
          style={i === 0 ? { transform: "translate(-6px, -6px)" } : undefined}
        >
          <Die
            value={value}
            rolling={rolling}
            size={40}
            skinId={equippedSkinId}
            pipsId={equippedPipsId}
          />
        </div>
      ))}
    </div>
  );
}