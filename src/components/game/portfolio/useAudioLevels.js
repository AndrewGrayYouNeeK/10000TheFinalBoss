import { useEffect, useState } from "react";
import { audioLevelsEngine } from "./audioLevelsEngine";

/** Live mic-driven bar levels — shared engine, one mic for all Soundwave dice */
export function useAudioLevels(barCount = 14, active = true) {
  const [levels, setLevels] = useState(() => Array(barCount).fill(0.08));
  const [meta, setMeta] = useState({ live: false, error: null, pending: false });

  useEffect(() => {
    if (!active) return undefined;

    audioLevelsEngine.barCount = barCount;

    const unsub = audioLevelsEngine.subscribe((next, nextMeta) => {
      setLevels([...next]);
      setMeta({ ...nextMeta });
    });

    return unsub;
  }, [active, barCount]);

  return { levels, ...meta, enableMic: () => audioLevelsEngine.ensureStarted() };
}
