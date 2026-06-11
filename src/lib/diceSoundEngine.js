/**
 * Digital dice roll — stepped synth cascade, no physical clacks.
 * Slot-machine style value ticks that decelerate into a lock-in chime.
 */

const MIN_GAIN = 0.001;

/** Quantized "display digit" frequencies — always sounds computed, not organic */
const DIGIT_FREQS = [196, 247, 294, 349, 415, 494, 587, 698, 831, 988, 1175, 1397];

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

function pickDigitFreq(index, pitchScale) {
  const i = Math.abs(Math.floor(index)) % DIGIT_FREQS.length;
  return DIGIT_FREQS[i] * pitchScale;
}

/** Boot blip — three rising square steps */
function playBootSteps(ctx, t, { vol = 0.09, pitchScale = 1 } = {}) {
  [0, 1, 2].forEach((step) => {
    const at = t + step * 0.028;
    const freq = pickDigitFreq(2 + step * 3, pitchScale);
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, at);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4200;
    lp.Q.value = 0.4;

    const g = ctx.createGain();
    g.gain.setValueAtTime(MIN_GAIN, at);
    g.gain.exponentialRampToValueAtTime(vol * (0.7 + step * 0.15), at + 0.004);
    g.gain.exponentialRampToValueAtTime(MIN_GAIN, at + 0.032);

    osc.connect(lp).connect(g);
    connectPan(g, ctx, step === 0 ? -0.3 : step === 2 ? 0.3 : 0);
    osc.start(at);
    osc.stop(at + 0.04);
  });
}

/** Choppy digital buffer noise while values scramble */
function playDataScramble(ctx, t, { dur = 0.38, vol = 0.055, pitchScale = 1 } = {}) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  let hold = 0;
  let holdLen = 0;
  for (let i = 0; i < data.length; i++) {
    if (holdLen <= 0) {
      hold = Math.random() > 0.5 ? 1 : -1;
      holdLen = Math.floor(ctx.sampleRate * (0.0012 + Math.random() * 0.0028));
    }
    data[i] = hold * (0.35 + Math.random() * 0.65);
    holdLen--;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 680 * pitchScale;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2400 * pitchScale;
  bp.Q.value = 0.9;

  const g = ctx.createGain();
  g.gain.setValueAtTime(MIN_GAIN, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.018);
  g.gain.exponentialRampToValueAtTime(MIN_GAIN, t + dur);

  src.connect(hp).connect(bp).connect(g);
  connectPan(g, ctx, 0.05);
  src.start(t);
  src.stop(t + dur + 0.01);
}

/** Single digital tick — sharp square blip, no smooth sweep */
function playDigitalTick(ctx, t, { freq, vol = 0.11, pan = 0, pitchScale = 1 } = {}) {
  const f = (freq ?? pickDigitFreq(Math.floor(Math.random() * 12), 1)) * pitchScale;
  const dur = 0.022 + Math.random() * 0.018;

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(f, t);

  const edge = ctx.createOscillator();
  edge.type = "square";
  edge.frequency.setValueAtTime(f * 2, t);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3600 + Math.random() * 800;
  lp.Q.value = 0.35;

  const g = ctx.createGain();
  g.gain.setValueAtTime(MIN_GAIN, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(MIN_GAIN, t + dur);

  osc.connect(lp);
  edge.connect(lp);
  lp.connect(g);
  connectPan(g, ctx, pan);
  osc.start(t);
  edge.start(t);
  osc.stop(t + dur + 0.01);
  edge.stop(t + dur + 0.01);
}

/** High digital ping on each late-stage tick */
function playDigitPing(ctx, t, { freq, vol = 0.07, pan = 0, pitchScale = 1 } = {}) {
  const f = freq * pitchScale;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(f, t);

  const g = ctx.createGain();
  g.gain.setValueAtTime(MIN_GAIN, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.0015);
  g.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.018);

  osc.connect(g);
  connectPan(g, ctx, pan);
  osc.start(t);
  osc.stop(t + 0.02);
}

/** Lock-in: two-step digital confirm + sub pulse */
function playDigitalLock(ctx, t, { vol = 0.12, pitchScale = 1 } = {}) {
  const steps = [
    { freq: pickDigitFreq(8, pitchScale), at: 0, pan: -0.15 },
    { freq: pickDigitFreq(10, pitchScale), at: 0.045, pan: 0.15 },
  ];

  steps.forEach(({ freq, at, pan }) => {
    const when = t + at;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, when);

    const g = ctx.createGain();
    g.gain.setValueAtTime(MIN_GAIN, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.004);
    g.gain.exponentialRampToValueAtTime(MIN_GAIN, when + 0.09);

    osc.connect(g);
    connectPan(g, ctx, pan);
    osc.start(when);
    osc.stop(when + 0.1);
  });

  const sub = ctx.createOscillator();
  sub.type = "square";
  sub.frequency.setValueAtTime(98 * pitchScale, t + 0.02);
  const subLp = ctx.createBiquadFilter();
  subLp.type = "lowpass";
  subLp.frequency.value = 280;
  const subG = ctx.createGain();
  subG.gain.setValueAtTime(MIN_GAIN, t + 0.02);
  subG.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.028);
  subG.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.12);
  sub.connect(subLp).connect(subG);
  connectPan(subG, ctx, 0);
  sub.start(t + 0.02);
  sub.stop(t + 0.14);
}

/**
 * Play one full digital roll sound.
 * @param {{ opponent?: boolean }} options
 */
export async function playDiceRollSound(options = {}) {
  const { opponent = false } = options;
  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (ctx.state !== "running") return;

  const pitchScale = opponent ? 0.88 : 1;
  const volScale = opponent ? 0.74 : 1;
  const start = ctx.currentTime;

  playBootSteps(ctx, start, { vol: 0.085 * volScale, pitchScale });
  playDataScramble(ctx, start + 0.04, {
    dur: 0.36 + Math.random() * 0.08,
    vol: 0.05 * volScale,
    pitchScale,
  });

  // Decelerating digital ticks — like a counter rolling down to a result
  const tickCount = 11 + Math.floor(Math.random() * 3);
  let t = start + 0.07;
  let digitIndex = Math.floor(Math.random() * DIGIT_FREQS.length);

  for (let i = 0; i < tickCount; i++) {
    const progress = i / tickCount;
    const delay = 0.018 + progress * progress * 0.11 + Math.random() * 0.012;
    t += delay;

    digitIndex = (digitIndex + 1 + Math.floor(Math.random() * 3)) % DIGIT_FREQS.length;
    const freq = pickDigitFreq(digitIndex, 1);

    playDigitalTick(ctx, t, {
      freq,
      vol: (0.09 + Math.random() * 0.05) * (1 - progress * 0.35) * volScale,
      pan: (Math.random() - 0.5) * 0.8,
      pitchScale,
    });

    if (progress > 0.55 && i % 2 === 0) {
      playDigitPing(ctx, t + 0.004, {
        freq: freq * 1.85,
        vol: 0.055 * volScale,
        pan: (Math.random() - 0.5) * 0.5,
        pitchScale,
      });
    }
  }

  playDigitalLock(ctx, t + 0.05, { vol: 0.11 * volScale, pitchScale });
}
