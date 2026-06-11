/**
 * Dice roll SFX prototypes — tap-to-preview variants for picking a game sound.
 */

import { getRunningPreviewContext, unlockPreviewAudio } from "@/lib/audioPreviewContext";
import { playDiceRollSound, playDigitalRollSound } from "@/lib/diceSoundEngine";

const MIN_GAIN = 0.001;

function connectPan(node, ctx, pan = 0) {
  if (ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    node.connect(panner);
    panner.connect(ctx.destination);
    return panner;
  }
  node.connect(ctx.destination);
  return null;
}

function env(gain, t, { attack = 0.003, peak = 0.2, decay = 0.08 }) {
  gain.gain.setValueAtTime(MIN_GAIN, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t + attack + decay);
}

function noiseClack(ctx, t, { dur = 0.035, vol = 0.18, hp = 600, bp = 1800, pan = 0 } = {}) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hpF = ctx.createBiquadFilter();
  hpF.type = "highpass";
  hpF.frequency.value = hp;
  const bpF = ctx.createBiquadFilter();
  bpF.type = "bandpass";
  bpF.frequency.value = bp;
  bpF.Q.value = 1.1;
  const g = ctx.createGain();
  env(g, t, { attack: 0.002, peak: vol, decay: dur * 0.85 });
  src.connect(hpF).connect(bpF).connect(g);
  connectPan(g, ctx, pan);
  src.start(t);
  src.stop(t + dur + 0.02);
}

export async function playDigitalRollPreview() {
  unlockPreviewAudio();
  await playDigitalRollSound();
  return true;
}

/** Same as in-game roll */
export async function playSoftRollPreview() {
  unlockPreviewAudio();
  await playDiceRollSound();
  return true;
}

/** Physical dice on a table — clacks slowing to a settle */
export async function playClassicRollPreview() {
  const ctx = await getRunningPreviewContext();
  if (!ctx) return false;
  const start = ctx.currentTime;
  const hits = 10 + Math.floor(Math.random() * 4);
  let t = start + 0.02;

  for (let i = 0; i < hits; i++) {
    const progress = i / hits;
    t += 0.022 + progress * progress * 0.09 + Math.random() * 0.018;
    noiseClack(ctx, t, {
      vol: 0.14 + Math.random() * 0.1,
      hp: 450 + Math.random() * 200,
      bp: 1200 + Math.random() * 900,
      pan: (Math.random() - 0.5) * 0.9,
      dur: 0.028 + Math.random() * 0.02,
    });
    if (Math.random() > 0.45) {
      const thump = ctx.createOscillator();
      thump.type = "sine";
      thump.frequency.setValueAtTime(110 + Math.random() * 40, t);
      thump.frequency.exponentialRampToValueAtTime(70, t + 0.04);
      const tg = ctx.createGain();
      env(tg, t, { attack: 0.003, peak: 0.08, decay: 0.05 });
      thump.connect(tg);
      connectPan(tg, ctx, (Math.random() - 0.5) * 0.5);
      thump.start(t);
      thump.stop(t + 0.06);
    }
  }

  noiseClack(ctx, t + 0.04, { vol: 0.22, hp: 380, bp: 950, pan: 0, dur: 0.05 });
  return true;
}

/** Retro cabinet — triangle beeps decelerating into a win arpeggio */
export async function playArcadeRollPreview() {
  const ctx = await getRunningPreviewContext();
  if (!ctx) return false;
  const start = ctx.currentTime;
  const notes = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659];
  const ticks = 12 + Math.floor(Math.random() * 3);
  let t = start;
  let noteIdx = Math.floor(Math.random() * notes.length);

  for (let i = 0; i < ticks; i++) {
    const progress = i / ticks;
    t += 0.016 + progress * progress * 0.1;
    noteIdx = (noteIdx + 1 + Math.floor(Math.random() * 2)) % notes.length;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(notes[noteIdx], t);
    const g = ctx.createGain();
    env(g, t, { attack: 0.002, peak: 0.11, decay: 0.035 });
    osc.connect(g);
    connectPan(g, ctx, i % 2 === 0 ? -0.35 : 0.35);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  [0, 0.07, 0.13].forEach((off, i) => {
    const when = t + 0.06 + off;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime([523, 659, 784][i], when);
    const g = ctx.createGain();
    env(g, when, { attack: 0.003, peak: 0.09 - i * 0.015, decay: 0.1 });
    osc.connect(g);
    connectPan(g, ctx, i === 1 ? 0 : i === 0 ? -0.2 : 0.2);
    osc.start(when);
    osc.stop(when + 0.12);
  });
  return true;
}

/** Harsh digital stutter — glitch ticks + reset zap */
export async function playGlitchRollPreview() {
  const ctx = await getRunningPreviewContext();
  if (!ctx) return false;
  const start = ctx.currentTime;
  let t = start;

  for (let i = 0; i < 14; i++) {
    const progress = i / 14;
    t += 0.012 + progress * progress * 0.085 + Math.random() * 0.008;

    const osc = ctx.createOscillator();
    osc.type = "square";
    const f = 180 + Math.random() * 2400;
    osc.frequency.setValueAtTime(f, t);
    if (Math.random() > 0.5) {
      osc.frequency.setValueAtTime(f * 0.5, t + 0.008);
    }
    const g = ctx.createGain();
    env(g, t, { attack: 0.001, peak: 0.07 + Math.random() * 0.05, decay: 0.015 + Math.random() * 0.02 });
    osc.connect(g);
    connectPan(g, ctx, (Math.random() - 0.5) * 1);
    osc.start(t);
    osc.stop(t + 0.03);

    if (i % 3 === 0) {
      noiseClack(ctx, t, { vol: 0.06, hp: 1200, bp: 4000, dur: 0.012, pan: Math.random() - 0.5 });
    }
  }

  const zap = ctx.createOscillator();
  zap.type = "sawtooth";
  zap.frequency.setValueAtTime(3200, t + 0.03);
  zap.frequency.exponentialRampToValueAtTime(180, t + 0.12);
  const zg = ctx.createGain();
  env(zg, t + 0.03, { attack: 0.002, peak: 0.14, decay: 0.1 });
  zap.connect(zg);
  connectPan(zg, ctx, 0);
  zap.start(t + 0.03);
  zap.stop(t + 0.14);
  return true;
}

/** Synth sweep pulses — neon cyber dice */
export async function playNeonRollPreview() {
  const ctx = await getRunningPreviewContext();
  if (!ctx) return false;
  const start = ctx.currentTime;
  let t = start;

  for (let i = 0; i < 10; i++) {
    const progress = i / 10;
    t += 0.02 + progress * progress * 0.095;
    const when = t;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const f0 = 900 + Math.random() * 600;
    osc.frequency.setValueAtTime(f0, when);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.35, when + 0.045);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(5200, when);
    lp.frequency.exponentialRampToValueAtTime(800, when + 0.05);

    const g = ctx.createGain();
    env(g, when, { attack: 0.004, peak: 0.08, decay: 0.05 });
    osc.connect(lp).connect(g);
    connectPan(g, ctx, i % 2 === 0 ? -0.55 : 0.55);
    osc.start(when);
    osc.stop(when + 0.06);
  }

  const lock = ctx.createOscillator();
  lock.type = "sawtooth";
  lock.frequency.setValueAtTime(440, t + 0.05);
  const lock2 = ctx.createOscillator();
  lock2.type = "sawtooth";
  lock2.frequency.setValueAtTime(660, t + 0.05);
  const lg = ctx.createGain();
  env(lg, t + 0.05, { attack: 0.005, peak: 0.1, decay: 0.12 });
  lock.connect(lg);
  lock2.connect(lg);
  connectPan(lg, ctx, 0);
  lock.start(t + 0.05);
  lock2.start(t + 0.05);
  lock.stop(t + 0.2);
  lock2.stop(t + 0.2);
  return true;
}

export const DICE_ROLL_SFX_PREVIEWS = [
  {
    id: "soft",
    label: "Soft Felt",
    emoji: "🟢",
    play: playSoftRollPreview,
    blurb: "Muffled thumps — quiet casino table (in-game sound)",
    durationMs: 1100,
  },
  {
    id: "digital",
    label: "Digital",
    emoji: "🎰",
    play: playDigitalRollPreview,
    blurb: "Slot-machine ticks + lock-in",
    durationMs: 900,
  },
  {
    id: "classic",
    label: "Classic Clack",
    emoji: "🎲",
    play: playClassicRollPreview,
    blurb: "Physical dice tumbling on a table",
    durationMs: 850,
  },
  {
    id: "arcade",
    label: "Arcade",
    emoji: "👾",
    play: playArcadeRollPreview,
    blurb: "8-bit beeps slowing into a win arpeggio",
    durationMs: 900,
  },
  {
    id: "glitch",
    label: "Cyber Glitch",
    emoji: "⚡",
    play: playGlitchRollPreview,
    blurb: "Stuttered square bursts + reset zap",
    durationMs: 800,
  },
  {
    id: "neon",
    label: "Neon Sweep",
    emoji: "💠",
    play: playNeonRollPreview,
    blurb: "Stereo synth pulses + lock chord",
    durationMs: 850,
  },
];
