import { useEffect, useState, useCallback } from "react";
import { audioLevelsEngine } from "./audioLevelsEngine";
import { loadSoundwaveMicSettings, resetSoundwaveMicSettings } from "@/lib/soundwaveMicSettings";

/** Live mic-driven bar levels — shared engine, one mic for all Soundwave dice */
export function useAudioLevels(barCount = 14, active = true) {
  const [levels, setLevels] = useState(() => Array(barCount).fill(0.08));
  const [meta, setMeta] = useState({
    live: false,
    error: null,
    pending: false,
    synthetic: false,
    inputLevel: 0,
    debug: null,
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

    return unsub;
  }, [active, barCount]);

  const enableMic = useCallback(() => audioLevelsEngine.ensureStarted(true), []);

  const startDemo = useCallback(() => audioLevelsEngine.startDemo(), []);

  const updateSettings = useCallback((patch) => {
    audioLevelsEngine.updateSettings(patch);
  }, []);

  const refreshDevices = useCallback(() => audioLevelsEngine.refreshDevices(), []);

  const restartMic = useCallback(() => audioLevelsEngine.restart(), []);

  const resetMicSettings = useCallback(() => {
    const next = resetSoundwaveMicSettings();
    audioLevelsEngine.updateSettings(next);
    return next;
  }, []);

  return {
    levels,
    ...meta,
    enableMic,
    startDemo,
    updateSettings,
    refreshDevices,
    restartMic,
    resetMicSettings,
  };
}
