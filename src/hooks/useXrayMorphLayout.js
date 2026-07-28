import { useEffect, useMemo, useState } from "react";
import { layoutGrid, morphCompatibleValues } from "@/lib/diceAssets";

function pickMorphTarget(trueValue) {
  const compatible = morphCompatibleValues(trueValue);
  if (!compatible.length) return trueValue;
  if (Math.random() < 0.38) return trueValue;
  return compatible[Math.floor(Math.random() * compatible.length)];
}

/**
 * X-Ray die face layout. Pips stay on the true value unless power mode allows
 * fluoroscopy morph on this die (one die per tray). Game `trueValue` is unchanged.
 */
export function useXrayMorphLayout(trueValue, rolling, allowMorph) {
  const trueLayout = useMemo(() => layoutGrid(trueValue), [trueValue]);
  const [morphValue, setMorphValue] = useState(trueValue);
  const [displayLayout, setDisplayLayout] = useState(trueLayout);

  useEffect(() => {
    setMorphValue(trueValue);
    setDisplayLayout(layoutGrid(trueValue));
  }, [trueValue]);

  useEffect(() => {
    if (!allowMorph) return undefined;

    let cancelled = false;
    let timeoutId;

    const schedule = () => {
      const delay = rolling ? 240 + Math.random() * 360 : 1100 + Math.random() * 1600;
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const next = pickMorphTarget(trueValue);
        setMorphValue(next);
        setDisplayLayout(layoutGrid(next));
        schedule();
      }, delay);
    };

    setMorphValue(trueValue);
    setDisplayLayout(layoutGrid(trueValue));
    schedule();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [trueValue, rolling, allowMorph]);

  if (!allowMorph) {
    return { morphValue: trueValue, displayLayout: trueLayout, trueLayout };
  }

  return { morphValue, displayLayout, trueLayout };
}
