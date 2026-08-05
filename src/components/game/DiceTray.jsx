import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Die from "./Die";
import { motion } from "framer-motion";
import { getFelt } from "@/lib/shopCatalog";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { useSharkBiteSettings } from "@/components/game/BlueGelPowerFX";
import { SHARK_BITE_CHOMP_EVENT } from "@/lib/sharkBiteChomp";
import { getBlueGelTrayFishProps } from "@/lib/fishDice";
import { getSkinLevelVisual } from "@/lib/skinLevelVisuals";

function getResponsiveTrayDieSize(width) {
  if (!width) return 100;
  const wideTray = width >= 640;
  const columns = wideTray ? 6 : 3;
  // Reserve the FeltTrayFrame rail, responsive inner padding, and grid gap.
  const available = width - 20 - (wideTray ? 48 : 24) - (wideTray ? 24 : 12) * (columns - 1);
  return Math.min(100, Math.max(1, Math.floor(available / columns)));
}

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
  skinLevel = 1,
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
  /** Die ids that briefly glitch when Matrix Glitch scrambles a roll. */
  matrixGlitchDieIds = [],
}) {
  const felt = getFelt(feltId);
  const [diceEaten, setDiceEaten] = useState(false);
  const trayRef = useRef(null);
  const [trayWidth, setTrayWidth] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth : 0)
  );
  const biteSettings = useSharkBiteSettings();
  // Keep the regular gameplay skin visible — the fullscreen shark flies over it.
  const traySkinId = skinId;
  const levelFrostActive =
    Number(skinLevel) > 1 && getSkinLevelVisual(traySkinId)?.effect === "frost";

  useLayoutEffect(() => {
    const el = trayRef.current;
    if (!el) return undefined;
    const measure = () => {
      const width = Math.round(el.getBoundingClientRect().width || window.innerWidth || 0);
      setTrayWidth((previous) => (previous === width ? previous : width));
    };
    measure();
    window.addEventListener("resize", measure);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!sharkBiteFx) return undefined;
    // New bite sequence — reset then wait for the chomp cue.
    setDiceEaten(false);
    const onChomp = () => {
      // Synchronous hide on the chomp event — no post-bite linger.
      setDiceEaten(true);
    };
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
  const wideTray = trayWidth >= 640;
  const dieSize = getResponsiveTrayDieSize(trayWidth);
  const sharkTankTray = traySkinId === "shark_gel";

  return (
    <div ref={trayRef} id="gameplay-dice-tray" className="w-full min-w-0">
      <FeltTrayFrame
        felt={felt}
        className="w-full min-w-0 max-w-full"
        innerClassName={`${wideTray ? "p-6" : "p-3"} w-full min-w-0 max-w-full`}
        intense={feltIntense}
        allowDieOverflow={iceFrozenOverlay || levelFrostActive || sharkTankTray}
      >
      <div className="relative w-full min-w-0 overflow-visible">
        <div
          className={`relative z-10 grid ${
            wideTray ? "grid-cols-6 gap-6" : "grid-cols-3 gap-3"
          } w-full min-w-0 justify-items-center overflow-visible`}
        >
          {dice.map((d, idx) => {
            // Pull each die toward the tray center as the shark chomps.
            const mid = (dice.length - 1) / 2;
            const pullX = (mid - idx) * Math.max(24, dieSize * 0.44);
            return (
            <motion.div
              key={d.id}
              className="relative overflow-visible"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                diceEaten
                  ? // Snap at SHARK_BITE_CHOMP_EVENT — vanish with the jaws, not after.
                    {
                      opacity: 0,
                      scale: 0.02,
                      x: pullX,
                      y: -14,
                      rotate: 28 + idx * 6,
                      filter: "none",
                    }
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
                  ? { duration: 0 }
                  : { delay: idx * 0.04 }
              }
              style={
                diceEaten
                  ? { visibility: "hidden", pointerEvents: "none" }
                  : undefined
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
                size={dieSize}
                skinId={traySkinId}
                scoreFill={scoreFill}
                dieSeed={d.id}
                heldStyleId={heldStyleId}
                skinLevel={skinLevel}
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
      </div>
    </FeltTrayFrame>
    </div>
  );
}

export default React.memo(DiceTray);
