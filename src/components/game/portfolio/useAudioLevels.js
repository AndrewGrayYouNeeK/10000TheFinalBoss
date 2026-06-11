import { useEffect, useState, useCallback } from "react";
import { audioLevelsEngine } from "./audioLevelsEngine";
import { loadSoundwaveMicSettings } from "@/lib/soundwaveMicSettings";

/** Live mic-driven bar levels — shared engine, one mic for all Soundwave dice */
export function useAudioLevels(barCount = 14, active = true) {
  const [levels, setLevels] = useState(() => Array(barCount).fill(0.08));
  const [meta, setMeta] = useState({
    live: false,
    error: null,
    pending: false,
    synthetic: false,
    settings: loadSoundwaveMicSettings(),
    devices: [],
  });

  useEffect(() => {
    if (!active) return undefined;

    audioLevelsEngine.barCount = barCount;

    const unsub = audioLevelsEngine.subscribe((next, nextMeta) => {
      setLevels([...next]);
      setMeta({ ...nextMeta });
    });

    if (loadSoundwaveMicSettings().autoEnable) {
      void audioLevelsEngine.ensureStarted();
    }

    return unsub;
  }, [active, barCount]);

  const enableMic = useCallback(() => audioLevelsEngine.ensureStarted(true), []);

  const updateSettings = useCallback((patch) => {
    audioLevelsEngine.updateSettings(patch);
  }, []);

  const refreshDevices = useCallback(() => audioLevelsEngine.refreshDevices(), []);

  const restartMic = useCallback(() => audioLevelsEngine.restart(), []);

  return {
    levels,
    ...meta,
    enableMic,
    updateSettings,
    refreshDevices,
    restartMic,
  };
}
