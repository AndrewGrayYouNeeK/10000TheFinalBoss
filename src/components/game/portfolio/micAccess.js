/** Normalize getUserMedia + AudioContext across browsers (incl. older WebKit). */

export function ensureMediaDevices() {
  if (typeof navigator === "undefined") return false;

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {};
  }

  if (!navigator.mediaDevices.getUserMedia) {
    const legacy =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    if (legacy) {
      navigator.mediaDevices.getUserMedia = (constraints) =>
        new Promise((resolve, reject) => {
          legacy.call(navigator, constraints, resolve, reject);
        });
    }
  }

  return typeof navigator.mediaDevices.getUserMedia === "function";
}

export function createAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    throw Object.assign(new Error("Web Audio not supported"), { code: "NO_AUDIO_CONTEXT" });
  }
  return new Ctx();
}

export async function resumeAudioContext(ctx) {
  if (ctx?.state === "suspended") {
    await ctx.resume();
  }
}

export function micSupportError() {
  if (typeof window === "undefined") return "Mic not supported";
  if (!window.isSecureContext) {
    return "Mic needs HTTPS (or localhost)";
  }
  if (!ensureMediaDevices()) return "Mic not supported";
  return null;
}

export function buildMicConstraints(settings = {}) {
  const audio = {
    echoCancellation: !!settings.echoCancellation,
    noiseSuppression: !!settings.noiseSuppression,
    autoGainControl: !!settings.autoGainControl,
  };

  if (settings.deviceId) {
    audio.deviceId = { exact: settings.deviceId };
  }

  return { audio };
}

export async function listAudioInputDevices() {
  if (!ensureMediaDevices() || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "audioinput");
  } catch {
    return [];
  }
}

export async function requestMicrophoneStream(settings = {}) {
  if (typeof window === "undefined") {
    throw Object.assign(new Error("Mic not supported"), { code: "NOT_SUPPORTED" });
  }

  if (!window.isSecureContext) {
    throw Object.assign(new Error("Mic needs HTTPS (or localhost)"), { code: "INSECURE_CONTEXT" });
  }

  if (!ensureMediaDevices()) {
    throw Object.assign(new Error("Mic not supported"), { code: "NOT_SUPPORTED" });
  }

  const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const attempts = [
    buildMicConstraints(settings),
    { audio: true },
    buildMicConstraints({ ...settings, deviceId: "" }),
  ];

  let lastErr;
  for (const constraints of attempts) {
    try {
      return await getUserMedia(constraints);
    } catch (err) {
      lastErr = err;
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") throw err;
      if (err?.name === "SecurityError") throw err;
      if (err?.name === "OverconstrainedError" && settings.deviceId) {
        continue;
      }
    }
  }

  throw lastErr || Object.assign(new Error("Mic unavailable"), { code: "UNAVAILABLE" });
}
