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

export async function requestMicrophoneStream() {
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
  const attempts = [{ audio: true }, { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } }];

  let lastErr;
  for (const constraints of attempts) {
    try {
      return await getUserMedia(constraints);
    } catch (err) {
      lastErr = err;
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") throw err;
      if (err?.name === "SecurityError") throw err;
    }
  }

  throw lastErr || Object.assign(new Error("Mic unavailable"), { code: "UNAVAILABLE" });
}
