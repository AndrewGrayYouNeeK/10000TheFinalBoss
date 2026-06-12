const STORAGE_KEY = "dice10k_soundwave_mic";

export const MIC_PRESETS = [
  {
    id: "sensitive",
    label: "Sensitive",
    blurb: "Picks up whispers, taps, and quiet room noise",
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sensitivity: 2.4,
    boostDb: 12,
    smoothing: 0.35,
  },
  {
    id: "hyper",
    label: "Hyper Reactive",
    blurb: "Maximum jump on any sound — great for dice demos",
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sensitivity: 3.2,
    boostDb: 18,
    smoothing: 0.2,
  },
  {
    id: "balanced",
    label: "Balanced",
    blurb: "Browser defaults with moderate boost",
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sensitivity: 1.6,
    boostDb: 6,
    smoothing: 0.55,
  },
  {
    id: "voice",
    label: "Voice / Talk",
    blurb: "Optimized for speech and claps",
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sensitivity: 1.9,
    boostDb: 8,
    smoothing: 0.45,
  },
  {
    id: "ambient",
    label: "Room Ambient",
    blurb: "Music, TV, and background in the room",
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sensitivity: 2.0,
    boostDb: 10,
    smoothing: 0.4,
  },
  {
    id: "noisy",
    label: "Noisy Place",
    blurb: "Café / street — filters hiss, keeps punch",
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sensitivity: 1.4,
    boostDb: 4,
    smoothing: 0.6,
  },
  {
    id: "raw",
    label: "Raw / Studio",
    blurb: "No processing — pure mic signal",
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sensitivity: 1.8,
    boostDb: 14,
    smoothing: 0.3,
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "Your manual toggles and sliders",
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sensitivity: 2.0,
    boostDb: 10,
    smoothing: 0.4,
  },
];

export const DEFAULT_MIC_SETTINGS = {
  preset: "sensitive",
  deviceId: "",
  sensitivity: 2.4,
  boostDb: 12,
  smoothing: 0.35,
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  autoEnable: false,
};

export function getMicPreset(id) {
  return MIC_PRESETS.find((p) => p.id === id) ?? MIC_PRESETS[0];
}

export function loadSoundwaveMicSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MIC_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_MIC_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_MIC_SETTINGS };
  }
}

export function saveSoundwaveMicSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Merge preset values unless user is on custom preset */
export function resolveMicSettings(settings) {
  const base = { ...DEFAULT_MIC_SETTINGS, ...settings };
  if (base.preset === "custom") return base;
  const preset = getMicPreset(base.preset);
  return {
    ...base,
    echoCancellation: preset.echoCancellation,
    noiseSuppression: preset.noiseSuppression,
    autoGainControl: preset.autoGainControl,
    sensitivity: preset.sensitivity,
    boostDb: preset.boostDb,
    smoothing: preset.smoothing,
  };
}

export function dbToGain(db) {
  return Math.pow(10, db / 20);
}
