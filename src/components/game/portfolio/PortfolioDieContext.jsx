import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";

const PortfolioDieContext = createContext(null);

export function usePortfolioDie() {
  return useContext(PortfolioDieContext);
}

/** Shared animation clock for portfolio dice — syncs body sweeps with pip reveal */
export function PortfolioDieProvider({ children, scoreFill = 0.5, enabled = true }) {
  const sweepX = useMotionValue(0);
  const radarAngle = useMotionValue(0);
  const [sweepMode, setSweepMode] = useState("reveal");
  const modeRef = useRef("reveal");

  useEffect(() => {
    if (!enabled) return undefined;
    modeRef.current = "reveal";
    setSweepMode("reveal");
    sweepX.set(0);

    const sx = animate(sweepX, [0, 1, 0], {
      duration: 5.2,
      repeat: Infinity,
      ease: "linear",
    });
    const ra = animate(radarAngle, [0, 360], { duration: 2.5, repeat: Infinity, ease: "linear" });
    return () => {
      sx.stop();
      ra.stop();
    };
  }, [sweepX, radarAngle, enabled]);

  if (!enabled) return children;

  return (
    <PortfolioDieContext.Provider value={{ sweepX, radarAngle, scoreFill, sweepMode, sweepModeRef: modeRef }}>
      {children}
    </PortfolioDieContext.Provider>
  );
}
