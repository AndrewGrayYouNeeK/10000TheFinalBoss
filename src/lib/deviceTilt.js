/**
 * Maps phone tilt to a 2D gravity vector for canvas particle effects.
 * Uses DeviceOrientationEvent (beta/gamma). iOS 13+ requires permission on first gesture.
 */

const DEFAULTS = {
  baseGravity: 0.1,
  tiltStrength: 0.28,
  smoothing: 0.14,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * @param {object} [options]
 * @param {number} [options.baseGravity] Downward bias when phone is level (screen-space +y).
 * @param {number} [options.tiltStrength] Max gravity component from full tilt.
 * @param {number} [options.smoothing] EMA blend toward new samples (0 = instant, 1 = frozen).
 * @returns {{ getGravity: () => { gx: number, gy: number }, destroy: () => void }}
 */
export function attachDeviceTilt(options = {}) {
  const baseGravity = options.baseGravity ?? DEFAULTS.baseGravity;
  const tiltStrength = options.tiltStrength ?? DEFAULTS.tiltStrength;
  const smoothing = options.smoothing ?? DEFAULTS.smoothing;

  let gx = 0;
  let gy = baseGravity;
  let targetGx = 0;
  let targetGy = baseGravity;
  let attached = false;

  const handleOrientation = (e) => {
    const gamma = e.gamma ?? 0;
    const beta = e.beta ?? 0;
    // gamma: left/right; beta: front/back. Map to screen-space gravity.
    targetGx = clamp(gamma / 45, -1, 1) * tiltStrength;
    targetGy = clamp(beta / 45, -1, 1) * tiltStrength + baseGravity * 0.55;
  };

  const attach = () => {
    if (attached) return;
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    attached = true;
  };

  const destroy = () => {
    document.removeEventListener("click", requestPerm);
    document.removeEventListener("touchend", requestPerm);
    if (attached) {
      window.removeEventListener("deviceorientation", handleOrientation);
      attached = false;
    }
  };

  const requestPerm = async () => {
    try {
      if (typeof DeviceOrientationEvent?.requestPermission === "function") {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res === "granted") attach();
      } else {
        attach();
      }
    } catch {
      /* permission denied or unavailable */
    }
    document.removeEventListener("click", requestPerm);
    document.removeEventListener("touchend", requestPerm);
  };

  if (typeof window !== "undefined" && typeof DeviceOrientationEvent !== "undefined") {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      document.addEventListener("click", requestPerm, { passive: true });
      document.addEventListener("touchend", requestPerm, { passive: true });
    } else {
      attach();
    }
  }

  return {
    getGravity() {
      gx += (targetGx - gx) * (1 - smoothing);
      gy += (targetGy - gy) * (1 - smoothing);
      return { gx, gy };
    },
    destroy,
  };
}
