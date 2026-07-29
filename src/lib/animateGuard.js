// Global defensive guard for the Web Animations API (WAAPI).
//
// WHY: framer-motion and other callers can pass invalid options to
// `Element.prototype.animate` — most commonly a `duration` that is NaN,
// negative, undefined, or Infinity, or a `times` array whose length does
// not match the keyframe array length. Any of these makes the browser throw:
//   "Failed to execute 'animate' on 'Element': duration must be
//    non-negative or auto"
// A single thrown error there bubbles up through React and trips the route
// error boundary, crashing the whole screen. This guard sanitizes options
// so that class of error can never crash the app, present or future.
//
// It is intentionally conservative: valid animations (including the special
// `"auto"` duration) are passed through untouched. Only clearly-invalid
// values are clamped/dropped.

// Small positive fallback so a "broken" animation still resolves instantly
// instead of throwing. 1ms is effectively imperceptible.
const FALLBACK_DURATION = 1;

let installed = false;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Clamp a duration to a valid WAAPI value: a finite non-negative number, or
// the literal string "auto". Anything else falls back to FALLBACK_DURATION.
function sanitizeDuration(duration) {
  if (duration === 'auto') return 'auto';
  if (duration === undefined || duration === null) return undefined; // let WAAPI default apply
  if (isFiniteNumber(duration) && duration >= 0) return duration;
  return FALLBACK_DURATION;
}

// Delay/endDelay must be finite numbers; NaN/Infinity → 0. Negative delays
// are technically valid in WAAPI (seek-in), but framer-motion bugs often
// produce NaN here, so we only fix non-finite values and leave real numbers.
function sanitizeDelay(delay) {
  if (delay === undefined || delay === null) return delay;
  if (isFiniteNumber(delay)) return delay;
  return 0;
}

// Sanitize a single effect-timing options object (the second arg to animate()).
function sanitizeOptions(options) {
  if (typeof options === 'number') {
    // animate(keyframes, 300) shorthand — sanitize the numeric duration.
    return sanitizeDuration(options);
  }
  if (!options || typeof options !== 'object') return options;

  const next = { ...options };

  if ('duration' in next) {
    const d = sanitizeDuration(next.duration);
    if (d === undefined) delete next.duration;
    else next.duration = d;
  }
  if ('delay' in next) next.delay = sanitizeDelay(next.delay);
  if ('endDelay' in next) next.endDelay = sanitizeDelay(next.endDelay);

  return next;
}

// Normalize keyframes into an array we can measure, or null if not measurable.
function keyframeCount(keyframes) {
  if (Array.isArray(keyframes)) return keyframes.length;
  return null;
}

// If a `times`/`offset` array length doesn't match the keyframe count, strip it
// so WAAPI computes even spacing instead of throwing.
function sanitizeKeyframes(keyframes, options) {
  const count = keyframeCount(keyframes);
  if (count === null) return options;
  if (!options || typeof options !== 'object') return options;

  // framer-motion passes `offset`; some callers pass `times`. Handle both.
  let next = options;
  for (const key of ['offset', 'times']) {
    const arr = next[key];
    if (Array.isArray(arr) && arr.length !== count) {
      if (next === options) next = { ...options };
      delete next[key];
    }
  }
  return next;
}

export function installAnimateGuard() {
  if (installed) return;
  if (typeof Element === 'undefined' || !Element.prototype || !Element.prototype.animate) {
    return;
  }
  installed = true;

  const original = Element.prototype.animate;

  Element.prototype.animate = function guardedAnimate(keyframes, options) {
    try {
      const safeOptions = sanitizeKeyframes(keyframes, sanitizeOptions(options));
      return original.call(this, keyframes, safeOptions);
    } catch (err) {
      // Last-resort retry with a known-safe minimal timing, then no-op.
      try {
        return original.call(this, keyframes, { duration: FALLBACK_DURATION });
      } catch {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[animateGuard] suppressed Element.animate error:', err);
        }
        // Return a stub that mimics the Animation interface enough to not crash callers.
        return {
          cancel() {},
          finish() {},
          pause() {},
          play() {},
          reverse() {},
          finished: Promise.resolve(),
          addEventListener() {},
          removeEventListener() {},
        };
      }
    }
  };
}
