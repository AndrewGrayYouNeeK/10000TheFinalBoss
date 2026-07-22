import React, { useCallback, useEffect, useState } from "react";
import Die from "./Die";
import { motion } from "framer-motion";
import { getFelt } from "@/lib/shopCatalog";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import {
  SHARK_BITE_CHOMP_EVENT,
  SHARK_BITE_FALLBACK_VANISH_MS,
} from "@/components/game/BlueGelPowerFX";

/**
 * Visual tray for the 6 dice. Rendered on a felt surface whose color is controlled by `feltId`.
 */
function DiceTray({
  dice,
  rolling,
  onToggle,
  disabled,
  skinId,
  feltId = "classic_green",
  feltIntense = false,
  scoreFill = 0.5,
  heldStyleId,
  lowPower = false,
  powerMode = false,
  sharkBiteFx = false,
  /** Keep dice vanished after chomp until next round clears this flag. */
  sharkDiceHidden = false,
  bloodWaterLocked = false,
  onBloodWaterSettled,
  /** Show in-die shark feast on fish dice (after a fish-hunt shark bite). */
  fishFeastMode = false,
}) {
  const felt = getFelt(feltId);
  const [diceEaten, setDiceEaten] = useState(false);
  // Keep the regular gameplay skin visible — the fullscreen shark flies over it.
  const traySkinId = skinId;

  useEffect(() => {
    if (!sharkBiteFx) return undefined;
    // New bite sequence — reset then wait for the chomp cue.
    setDiceEaten(false);
    const onChomp = () => setDiceEaten(true);
    window.addEventListener(SHARK_BITE_CHOMP_EVENT, onChomp);
    const fallback = setTimeout(() => setDiceEaten(true), SHARK_BITE_FALLBACK_VANISH_MS);
    return () => {
      window.removeEventListener(SHARK_BITE_CHOMP_EVENT, onChomp);
      clearTimeout(fallback);
    };
  }, [sharkBiteFx]);

  // Stay vanished after FX while sharkDiceHidden; restore only when both flags clear.
  useEffect(() => {
    if (!sharkBiteFx && !sharkDiceHidden) setDiceEaten(false);
  }, [sharkBiteFx, sharkDiceHidden]);

  const handleToggle = useCallback(
    (dieId) => {
      if (!disabled && onToggle) onToggle(dieId);
    },
    [disabled, onToggle]
  );

  const jellyDieId = dice.find((d) => !d.used && (d.value ?? 0) >= 2)?.id ?? null;

  return (
    <div id="gameplay-dice-tray">
      <FeltTrayFrame felt={felt} innerClassName="p-6" intense={feltIntense}>
      <div className="relative grid grid-cols-3 gap-3 sm:gap-6 justify-items-center sm:grid-cols-6">
        {dice.map((d, idx) => {
              // Pull each die toward the tray center as the shark chomps. The dice
          // are eaten right-to-left (rightmost vanishes first) so it reads as
          // the shark sweeping across the tray.
          const mid = (dice.length - 1) / 2;
          const pullX = (mid - idx) * 44;
          const eatOrder = dice.length - 1 - idx; // rightmost = 0 → eaten first
          return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              diceEaten
                ? { opacity: [1, 0.85, 0], scale: [1, 1.08, 0.02], x: [0, pullX * 0.45, pullX], y: [0, -6, -18], rotate: [0, -8, 40 + idx * 8] }
                : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
            }
            transition={
              diceEaten
                ? { duration: 0.32, delay: eatOrder * 0.045, ease: "easeIn", times: [0, 0.2, 1] }
                : { delay: idx * 0.04 }
            }
          >
            <Die
              value={d.value}
              held={d.held}
              used={d.used}
              rolling={rolling && !d.used && !d.held}
              dieId={d.id}
              onToggleDie={handleToggle}
              size={100}
              skinId={traySkinId}
              scoreFill={scoreFill}
              dieSeed={d.id}
              heldStyleId={heldStyleId}
              lowPower={lowPower}
              // Shark Bite charge (powerMode) ≠ Feeding Frenzy (fishFeastMode).
              powerMode={powerMode && !sharkBiteFx && !fishFeastMode}
              fishFeastMode={fishFeastMode && !sharkBiteFx}
              sharkBiteFx={false}
              bloodWaterLocked={bloodWaterLocked && !fishFeastMode}
              onBloodWaterSettled={onBloodWaterSettled}
              includeJellyfish={traySkinId === "blue_gel" && d.id === jellyDieId}
              bigFishVariantIndex={[7, 1, 6, 3, 1, 4][idx]}
              bigFishExtraScale={idx === 0 ? 2.1 : idx === 4 ? 2.0 : 1.15}
            />
          </motion.div>
          );
        })}
      </div>
    </FeltTrayFrame>
    </div>
  );
}

export default React.memo(DiceTray);
