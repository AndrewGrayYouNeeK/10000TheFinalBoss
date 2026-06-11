/**
 * Prototype "yeet" & "skrrt" vocal SFX — Web Audio previews.
 */

import { createAudioContext, resumeAudioContext } from "@/components/game/portfolio/micAccess";

const MIN_GAIN = 0.001;

let sharedCtx = null;

/** Sync create — call from a tap/click handler before scheduling audio (iOS). */
export function unlockVocalAudio() {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) sharedCtx = createAudioContext();
    if (sharedCtx.state === "suspended") {
      void sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

async function getRunningContext() {
  const ctx = unlockVocalAudio();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await resumeAudioContext(ctx);
    } catch {
      return null;
    }
  }
  return ctx.state === "running" ? ctx : null;
}

function env(gain, t, { attack = 0.008, peak = 0.3, hold = 0, decay = 0.2 }) {
  gain.gain.setValueAtTime(MIN_GAIN, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  if (hold > 0) gain.gain.setValueAtTime(peak * 0.85, t + attack + hold);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t + attack + hold + decay);
}

function noiseBurst(ctx, t, dur, { vol = 0.2, hp = 400, bp = 2400 } = {}) {
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
  bpF.Q.value = 1.2;
  const g = ctx.createGain();
  env(g, t, { attack: 0.003, peak: vol, decay: dur });
  src.connect(hpF).connect(bpF).connect(g).connect(ctx.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/** "YEEET!" — rising throw whoop with a sharp landing */
export async function playYeetPreview() {
  const ctx = await getRunningContext();
  if (!ctx) return false;
  const t = ctx.currentTime;

  noiseBurst(ctx, t, 0.04, { vol: 0.14, hp: 500, bp: 3200 });

  const body = ctx.createOscillator();
  body.type = "sawtooth";
  body.frequency.setValueAtTime(185, t + 0.015);
  body.frequency.exponentialRampToValueAtTime(920, t + 0.11);
  body.frequency.exponentialRampToValueAtTime(640, t + 0.19);

  const shout = ctx.createOscillator();
  shout.type = "square";
  shout.frequency.setValueAtTime(370, t + 0.02);
  shout.frequency.exponentialRampToValueAtTime(1680, t + 0.1);
  shout.frequency.exponentialRampToValueAtTime(1100, t + 0.18);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.exponentialRampToValueAtTime(5200, t + 0.08);
  lp.frequency.exponentialRampToValueAtTime(1800, t + 0.22);

  const g = ctx.createGain();
  env(g, t + 0.012, { attack: 0.012, peak: 0.32, hold: 0.04, decay: 0.14 });

  body.connect(lp);
  shout.connect(lp);
  lp.connect(g).connect(ctx.destination);
  body.start(t + 0.012);
  shout.start(t + 0.012);
  body.stop(t + 0.28);
  shout.stop(t + 0.28);

  const tail = ctx.createOscillator();
  tail.type = "square";
  tail.frequency.setValueAtTime(880, t + 0.17);
  tail.frequency.exponentialRampToValueAtTime(420, t + 0.24);
  const tailG = ctx.createGain();
  env(tailG, t + 0.17, { attack: 0.004, peak: 0.18, decay: 0.08 });
  tail.connect(tailG).connect(ctx.destination);
  tail.start(t + 0.17);
  tail.stop(t + 0.26);

  noiseBurst(ctx, t + 0.03, 0.18, { vol: 0.1, hp: 200, bp: 1800 });
  return true;
}

/** "SKRRRT!" — stuttered tire-screech / record scratch */
export async function playSkrrtPreview() {
  const ctx = await getRunningContext();
  if (!ctx) return false;
  const t = ctx.currentTime;

  const stutters = [
    { at: 0, dur: 0.07, bpStart: 5200, bpEnd: 2800, vol: 0.22 },
    { at: 0.09, dur: 0.08, bpStart: 4800, bpEnd: 2200, vol: 0.26 },
    { at: 0.2, dur: 0.14, bpStart: 4200, bpEnd: 900, vol: 0.28 },
  ];

  stutters.forEach(({ at, dur, bpStart, bpEnd, vol }) => {
    const when = t + at;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * (0.7 + Math.random() * 0.3);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 2.8;
    bp.frequency.setValueAtTime(bpStart, when);
    bp.frequency.exponentialRampToValueAtTime(Math.max(200, bpEnd), when + dur);

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 700;

    const g = ctx.createGain();
    g.gain.value = vol;
    env(g, when, { attack: 0.002, peak: vol, hold: dur * 0.35, decay: dur * 0.55 });

    const am = ctx.createOscillator();
    am.type = "sine";
    am.frequency.value = 28 + Math.random() * 8;
    const amDepth = ctx.createGain();
    amDepth.gain.value = vol * 0.35;
    am.connect(amDepth);
    amDepth.connect(g.gain);

    src.connect(hp).connect(bp).connect(g).connect(ctx.destination);
    src.start(when);
    src.stop(when + dur + 0.02);
    am.start(when);
    am.stop(when + dur + 0.02);
  });

  [0, 0.09, 0.2].forEach((at, i) => {
    const when = t + at - 0.01;
    const thump = ctx.createOscillator();
    thump.type = "square";
    thump.frequency.setValueAtTime(140 - i * 15, when);
    thump.frequency.exponentialRampToValueAtTime(70, when + 0.035);
    const tg = ctx.createGain();
    env(tg, when, { attack: 0.002, peak: 0.12 - i * 0.02, decay: 0.04 });
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    thump.connect(lp).connect(tg).connect(ctx.destination);
    thump.start(when);
    thump.stop(when + 0.05);
  });

  const chip = ctx.createOscillator();
  chip.type = "square";
  chip.frequency.setValueAtTime(2400, t + 0.34);
  chip.frequency.exponentialRampToValueAtTime(900, t + 0.38);
  const chipG = ctx.createGain();
  env(chipG, t + 0.34, { attack: 0.002, peak: 0.12, decay: 0.05 });
  chip.connect(chipG).connect(ctx.destination);
  chip.start(t + 0.34);
  chip.stop(t + 0.4);
  return true;
}

export const VOCAL_SFX_PREVIEWS = [
  { id: "yeet", label: "YEEET", emoji: "🚀", play: playYeetPreview, blurb: "Rising throw-whoop with a sharp landing" },
  { id: "skrrt", label: "SKRRRT", emoji: "🛞", play: playSkrrtPreview, blurb: "Triple screech stutter + tire-scratch tail" },
];
