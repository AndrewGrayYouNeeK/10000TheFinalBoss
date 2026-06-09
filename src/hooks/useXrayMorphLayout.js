import { useEffect, useMemo, useState } from "react";
import { layoutGrid, morphCompatibleValues } from "@/lib/diceAssets";

function pickMorphTarget(trueValue) {
  const compatible = morphCompatibleValues(trueValue);
  if (!compatible.length) return trueValue;
  if (Math.random() < 0.38) return trueValue;
  return compatible[Math.floor(Math.random() * compatible.length)];
}

/**
 * Cycles X-Ray die face visuals among pip-compatible values (add/remove pips only).
 * Game `trueValue` is unchanged — this is fluoroscopy flicker only.
 */
export function useXrayMorphLayout(trueValue, rolling, enabled) {
  const trueLayout = useMemo(() => layoutGrid(trueValue), [trueValue]);
  const [morphValue, setMorphValue] = useState(trueValue);
  const [displayLayout, setDisplayLayout] = useState(trueLayout);

  useEffect(() => {
    setMorphValue(trueValue);
    setDisplayLayout(layoutGrid(trueValue));
  }, [trueValue]);

  useEffect(() => {
    if (!enabled) return undefined;

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
  }, [trueValue, rolling, enabled]);

  if (!enabled) {
    return { morphValue: trueValue, displayLayout: trueLayout, trueLayout };
  }

  return { morphValue, displayLayout, trueLayout };
}
