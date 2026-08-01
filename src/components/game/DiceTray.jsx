import React, { useCallback, useEffect, useState } from "react";
import Die from "./Die";
import { motion } from "framer-motion";
import { getFelt } from "@/lib/shopCatalog";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import {
  SHARK_BITE_CHOMP_EVENT,
  useSharkBiteSettings,
} from "@/components/game/BlueGelPowerFX";
import { getBlueGelTrayFishProps } from "@/lib/fishDice";

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
  /** Softer in-die power glow for pass-and-play privacy. */
  powerModeSubtle = false,
  /** Story Ghost boss — dice render as near-invisible (no face readout). */
  spectralHidden = false,
  iceFrozenOverlay = false,
  sharkBiteFx = false,
  /** Keep dice vanished after chomp until next round clears this flag. */
  sharkDiceHidden = false,
  bloodWaterLocked = false,
  onBloodWaterSettled,
  /** Show in-die shark feast on fish dice (after a fish-hunt shark bite). */
  fishFeastMode = false,
  /** Die ids that briefly glitch when Matrix Glitch rescues a bust. */
  matrixGlitchDieIds = [],
}) {
  const felt = getFelt(feltId);
  const [diceEaten, setDiceEaten] = useState(false);
  const biteSettings = useSharkBiteSettings();
  // Keep the regular gameplay skin visible — the fullscreen shark flies over it.
  const traySkinId = skinId;

  useEffect(() => {
    if (!sharkBiteFx) return undefined;
    // New bite sequence — reset then wait for the chomp cue.
    setDiceEaten(false);
    const onChomp = () => setDiceEaten(true);
    window.addEventListener(SHARK_BITE_CHOMP_EVENT, onChomp);
    const fallback = setTimeout(() => setDiceEaten(true), biteSettings.fallbackVanishMs);
    return () => {
      window.removeEventListener(SHARK_BITE_CHOMP_EVENT, onChomp);
      clearTimeout(fallback);
    };
  }, [sharkBiteFx, biteSettings.fallbackVanishMs]);

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
  const xrayMorphDieId =
    traySkinId === "pf_xray" && powerMode
      ? (dice.find((d) => !d.used)?.id ?? dice[0]?.id ?? null)
      : null;

  return (
    <div id="gameplay-dice-tray">
      <FeltTrayFrame
        felt={felt}
        innerClassName="p-6"
        intense={feltIntense}
        allowDieOverflow={iceFrozenOverlay}
      >
      <div className="relative grid grid-cols-3 gap-3 sm:gap-6 justify-items-center sm:grid-cols-6 overflow-visible">
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
            className="relative overflow-visible"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              diceEaten
                ? { opacity: [1, 0.85, 0], scale: [1, 1.08, 0.02], x: [0, pullX * 0.45, pullX], y: [0, -6, -18], rotate: [0, -8, 40 + idx * 8] }
                : {
                    opacity: spectralHidden ? 0.12 : 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    filter: spectralHidden ? "blur(1.5px) saturate(0.35)" : "none",
                  }
            }
            transition={
              diceEaten
                ? { duration: 0.18, delay: eatOrder * 0.028, ease: "easeIn", times: [0, 0.15, 1] }
                : { delay: idx * 0.04 }
            }
          >
            <Die
              value={d.valueHidden || spectralHidden ? 1 : d.value}
              valueHidden={!!d.valueHidden || spectralHidden}
              spectralHidden={spectralHidden}
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
              powerModeSubtle={powerModeSubtle}
              allowXrayMorph={d.id === xrayMorphDieId}
              iceFrozenOverlay={iceFrozenOverlay && !sharkBiteFx && !fishFeastMode}
              fishFeastMode={fishFeastMode && !sharkBiteFx}
              sharkBiteFx={false}
              bloodWaterLocked={bloodWaterLocked && !fishFeastMode}
              onBloodWaterSettled={onBloodWaterSettled}
              includeJellyfish={traySkinId === "blue_gel" && d.id === jellyDieId}
              matrixGlitchFx={matrixGlitchDieIds.includes(d.id)}
              {...(traySkinId === "blue_gel" ? getBlueGelTrayFishProps(idx) : {})}
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
