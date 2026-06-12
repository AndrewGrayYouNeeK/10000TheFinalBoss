/**
 * Dice roll SFX — Soft Felt: muffled casino-table thumps.
 */

import { shouldPlaySfx } from "@/lib/gameAudioSettings";

const MIN_GAIN = 0.001;

let sharedCtx = null;

function getContext() {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      sharedCtx = new AC();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

async function ensureRunningContext() {
  const ctx = getContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx.state === "running" ? ctx : null;
}

function connectPan(node, ctx, pan = 0) {
  if (typeof node.connect === "function" && ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    node.connect(panner);
    panner.connect(ctx.destination);
    return panner;
  }
  node.connect(ctx.destination);
  return null;
}

function env(gain, t, { attack = 0.006, peak = 0.2, decay = 0.07 } = {}) {
  gain.gain.setValueAtTime(MIN_GAIN, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t + attack + decay);
}

function playSoftFeltRoll(ctx, start, { pitchScale = 1, volScale = 1 } = {}) {
  let t = start + 0.03;
  const hits = 9 + Math.floor(Math.random() * 2);

  for (let i = 0; i < hits; i++) {
    const progress = i / hits;
    t += 0.028 + progress * progress * 0.11;

    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.04), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = (380 + Math.random() * 200) * pitchScale;
    const g = ctx.createGain();
    env(g, t, {
      attack: 0.006,
      peak: (0.075 + Math.random() * 0.045) * volScale,
      decay: 0.065,
    });
    src.connect(lp).connect(g);
    connectPan(g, ctx, (Math.random() - 0.5) * 0.45);
    src.start(t);
    src.stop(t + 0.05);

    const body = ctx.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime((82 + Math.random() * 28) * pitchScale, t);
    const bg = ctx.createGain();
    env(bg, t, { attack: 0.008, peak: 0.065 * volScale, decay: 0.075 });
    body.connect(bg);
    connectPan(bg, ctx, 0);
    body.start(t);
    body.stop(t + 0.085);
  }
}

/**
 * Play one dice roll — Soft Felt.
 * @param {{ opponent?: boolean }} options
 */
export async function playDiceRollSound(options = {}) {
  const { opponent = false } = options;
  if (!shouldPlaySfx({ opponent })) return;
  const ctx = await ensureRunningContext();
  if (!ctx) return;

  const pitchScale = opponent ? 0.92 : 1;
  const volScale = opponent ? 0.78 : 1;
  playSoftFeltRoll(ctx, ctx.currentTime, { pitchScale, volScale });
}
