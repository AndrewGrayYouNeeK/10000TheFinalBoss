import { isSfxMuted } from "@/lib/gameAudioSettings";

/** Blue Gel Shark Bite power FX audio — disabled (visual feast only). */
export const BLUE_GEL_SFX_ENABLED = false;

/** Ms after sequence start when heavy bubbles begin (after Jaws builds). */
export const BLUE_GEL_BUBBLE_MS = 2100;

/** Ms after sequence start before sharks should visually enter the dice. */
export const BLUE_GEL_SHARK_ENTER_MS = 3400;

/** Ms after shark enter before the chomp / eat. */
export const BLUE_GEL_FEAST_DELAY_MS = 900;

/** How long the eat / chomp animation runs. */
export const BLUE_GEL_FEAST_MS = 1100;

/** Ms after sequence start when the shark chomps the fish. */
export const BLUE_GEL_FEAST_AT_MS = BLUE_GEL_SHARK_ENTER_MS + BLUE_GEL_FEAST_DELAY_MS;

/** Each of the three post-eat bubble timer waves. */
export const BLUE_GEL_BUBBLE_WAVE_MS = 1000;

/** Ms after sequence start when the eat finishes (red water starts). */
export const BLUE_GEL_AFTERMATH_MS = BLUE_GEL_FEAST_AT_MS + BLUE_GEL_FEAST_MS;

/** Ms after sequence start when bubbles settle (water stays bloody red). */
export const BLUE_GEL_NORMAL_MS = BLUE_GEL_AFTERMATH_MS + BLUE_GEL_BUBBLE_WAVE_MS * 3;

const MIN_GAIN = 0.001;

let sharedCtx = null;
let sequenceId = 0;
let sequenceStartedAt = 0;
let activeListeners = 0;

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

function noiseBuffer(ctx, seconds) {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Classic half-step dun-dun motif that builds in pace and intensity. */
function playJawsTheme(ctx, start, id) {
  if (id !== sequenceId) return;
  // E2 / F2 — iconic two-note chase motif
  const low = 82.41;
  const high = 87.31;
  const hits = [
    { t: 0.0, note: low, dur: 0.55, peak: 0.22 },
    { t: 0.7, note: high, dur: 0.55, peak: 0.22 },
    { t: 1.35, note: low, dur: 0.28, peak: 0.26 },
    { t: 1.55, note: high, dur: 0.28, peak: 0.26 },
    { t: 1.78, note: low, dur: 0.16, peak: 0.3 },
    { t: 1.9, note: high, dur: 0.16, peak: 0.3 },
    { t: 2.02, note: low, dur: 0.12, peak: 0.34 },
    { t: 2.1, note: high, dur: 0.12, peak: 0.34 },
    { t: 2.18, note: low, dur: 0.1, peak: 0.36 },
    { t: 2.24, note: high, dur: 0.1, peak: 0.36 },
    { t: 2.3, note: low, dur: 0.09, peak: 0.38 },
    { t: 2.35, note: high, dur: 0.12, peak: 0.4 },
  ];

  for (const hit of hits) {
    const t = start + hit.t;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hit.note, t);

    const sub = ctx.createOscillator();
    sub.type = "triangle";
    sub.frequency.setValueAtTime(hit.note * 0.5, t);

    const g = ctx.createGain();
    g.gain.setValueAtTime(MIN_GAIN, t);
    g.gain.exponentialRampToValueAtTime(hit.peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(MIN_GAIN, t + hit.dur);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, t);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    sub.start(t);
    osc.stop(t + hit.dur + 0.02);
    sub.stop(t + hit.dur + 0.02);
  }
}

function playBubblePops(ctx, start, id, count = 28) {
  if (id !== sequenceId) return;
  for (let i = 0; i < count; i++) {
    const t = start + i * 0.045 + Math.random() * 0.03;
    const freq = 480 + Math.random() * 1000;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, t + 0.05);

    const g = ctx.createGain();
    g.gain.setValueAtTime(MIN_GAIN, t);
    g.gain.exponentialRampToValueAtTime(0.07 + Math.random() * 0.05, t + 0.008);
    g.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.07);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }
}

function playSplash(ctx, start, id) {
  if (id !== sequenceId) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.35);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(900, start);
  bp.Q.value = 0.7;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2400, start);
  const g = ctx.createGain();
  g.gain.setValueAtTime(MIN_GAIN, start);
  g.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.12, start + 0.12);
  g.gain.exponentialRampToValueAtTime(MIN_GAIN, start + 0.35);
  src.connect(bp).connect(lp).connect(g).connect(ctx.destination);
  src.start(start);
  src.stop(start + 0.36);

  // Low water thud under the splash
  const thud = ctx.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(70, start);
  thud.frequency.exponentialRampToValueAtTime(40, start + 0.2);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(MIN_GAIN, start);
  tg.gain.exponentialRampToValueAtTime(0.2, start + 0.015);
  tg.gain.exponentialRampToValueAtTime(MIN_GAIN, start + 0.22);
  thud.connect(tg).connect(ctx.destination);
  thud.start(start);
  thud.stop(start + 0.24);
}

/**
 * Start the power FX audio once per activation (deduped across dice).
 * Call when Blue Gel sharks are about to appear.
 */
export async function ensureBlueGelSharkAudioSequence() {
  if (!BLUE_GEL_SFX_ENABLED || isSfxMuted()) return;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  // Dedupe: multiple dice mount BlueGelSharkAttack together.
  if (now - sequenceStartedAt < 400) return;
  sequenceStartedAt = now;
  const id = ++sequenceId;

  const ctx = await ensureRunningContext();
  if (!ctx || id !== sequenceId) return;

  const t0 = ctx.currentTime + 0.02;
  playJawsTheme(ctx, t0, id);

  // Heavy bubbles + splash after the motif builds (aligned with BLUE_GEL_BUBBLE_MS)
  const waterAt = t0 + BLUE_GEL_BUBBLE_MS / 1000;
  window.setTimeout(() => {
    if (id !== sequenceId) return;
    playSplash(ctx, ctx.currentTime, id);
    playBubblePops(ctx, ctx.currentTime + 0.04, id, 32);
    // Sustain bubbling until sharks arrive
    window.setTimeout(() => {
      if (id !== sequenceId) return;
      playSplash(ctx, ctx.currentTime, id);
      playBubblePops(ctx, ctx.currentTime + 0.05, id, 28);
    }, 380);
    window.setTimeout(() => {
      if (id !== sequenceId) return;
      playBubblePops(ctx, ctx.currentTime, id, 24);
    }, 780);
  }, Math.max(0, (waterAt - ctx.currentTime) * 1000));
}

/**
 * Acquire shared Blue Gel power audio for one die/overlay.
 * First caller starts the sequence; last release stops it.
 */
export function acquireBlueGelSharkAudio() {
  if (!BLUE_GEL_SFX_ENABLED) return () => {};
  activeListeners += 1;
  if (activeListeners === 1) {
    ensureBlueGelSharkAudioSequence();
  }
  return () => {
    activeListeners = Math.max(0, activeListeners - 1);
    if (activeListeners === 0) {
      stopBlueGelSharkAudioSequence();
    }
  };
}

/** Cancel an in-flight sequence (power mode ended / remount). */
export function stopBlueGelSharkAudioSequence() {
  sequenceId += 1;
  sequenceStartedAt = 0;
}
