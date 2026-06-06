import { useCallback, useRef } from "react";

/**
 * Tiny WebAudio-based dice roll SFX. No external assets.
 * Returns a play() function — safe to call repeatedly.
 */
export function useDiceSound() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctxRef.current = new AC();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  };

  // Build a single wooden/bone-like clack: short noise burst shaped by a
  // low-Q bandpass + a quick low-pitched tonal "thunk" for body.
  const playClack = (ctx, t, { vol = 0.18, freq = 380, dur = 0.09 } = {}) => {
    // Noise component (the "tick")
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const noise = noiseBuf.getChannelData(0);
    for (let j = 0; j < noise.length; j++) {
      // Sharp attack, fast decay
      const env = Math.pow(1 - j / noise.length, 2.5);
      noise[j] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq * 2.2;
    bp.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(vol, t + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(bp).connect(noiseGain).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);

    // Tonal "body" component — gives the wooden/bone resonance
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur * 0.9);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, t);
    oscGain.gain.linearRampToValueAtTime(vol * 0.55, t + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.0005, t + dur * 0.95);
    osc.connect(oscGain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  };

  const play = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const start = ctx.currentTime;
    // Tumbling sequence: 8–10 irregular clacks at varied pitches,
    // getting slightly quieter and slower like dice settling.
    const count = 9;
    let t = start;
    for (let i = 0; i < count; i++) {
      const progress = i / count;
      const gap = 0.045 + Math.random() * 0.06 + progress * 0.04; // slow down
      t += gap;
      playClack(ctx, t, {
        vol: 0.16 + Math.random() * 0.08 * (1 - progress * 0.6),
        freq: 280 + Math.random() * 420, // wood/bone range
        dur: 0.07 + Math.random() * 0.05,
      });
    }

    // Final soft "tray thud" — low rumble for landing on felt
    const thudT = t + 0.12;
    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(110, thudT);
    thud.frequency.exponentialRampToValueAtTime(55, thudT + 0.18);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0, thudT);
    thudGain.gain.linearRampToValueAtTime(0.14, thudT + 0.01);
    thudGain.gain.exponentialRampToValueAtTime(0.0005, thudT + 0.22);
    thud.connect(thudGain).connect(ctx.destination);
    thud.start(thudT);
    thud.stop(thudT + 0.25);
  }, []);

  return play;
}