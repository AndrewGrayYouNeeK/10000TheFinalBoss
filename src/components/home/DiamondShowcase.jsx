import React, { useState, useEffect } from "react";
import Die from "@/components/game/Die";
import { useCosmetics } from "@/hooks/useCosmetics";
import { getSkin, getSpriteStyle } from "@/lib/shopCatalog";
import { isNativeApp } from "@/lib/platform";

function NativeShowcase({ skinId }) {
  const skin = getSkin(skinId);
  const size = 40;
  return (
    <div className="flex justify-center gap-1.5 mb-4">
      {[1, 2, 3, 4, 5, 6].map((value) => {
        const style = getSpriteStyle(skin, value, size);
        return (
          <div
            key={value}
            className="rounded-md overflow-hidden shrink-0"
            style={style ? { width: size, height: size, ...style } : undefined}
          >
            {!style && <Die value={value} size={size} skinId={skinId} rolling={false} />}
          </div>
        );
      })}
    </div>
  );
}

// Continuously rolling row of 6 dice for the Home screen — uses the equipped skin.
export default function DiamondShowcase() {
  const { equippedSkinId } = useCosmetics();
  const [dice, setDice] = useState([1, 2, 3, 4, 5, 6]);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (isNativeApp()) return undefined;
    const interval = setInterval(() => {
      setRolling(true);
      setTimeout(() => {
        setDice(Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1));
        setRolling(false);
      }, 900);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  if (isNativeApp()) {
    return <NativeShowcase skinId={equippedSkinId} />;
  }

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
          />
        </div>
      ))}
    </div>
  );
}
