import { createAudioContext, resumeAudioContext } from "./micAccess";
import { shouldPlayBugZapperSfx } from "@/lib/gameAudioSettings";

const MIN_GAIN = 0.001;

/** Shared Web Audio zap crackles for Bug Zapper dice. */
class BugZapperSoundEngine {
  constructor() {
    this._ctx = null;
    this._gestureBound = false;
    this._ready = false;
    this._readyCallbacks = new Set();
    this._pendingZaps = 0;
    this._humRefCount = 0;
    this._humNodes = null;
    this._lastZapAt = 0;
  }

  arm() {
    if (typeof document === "undefined") return;
    this._bindGestureUnlock();
  }

  whenReady(callback) {
    if (this._ready) {
      callback();
      return () => {};
    }
    this._readyCallbacks.add(callback);
    this.arm();
    void this._ensureCtx(false);
    return () => this._readyCallbacks.delete(callback);
  }

  _markReady() {
    if (this._ready) return;
    this._ready = true;
    for (const cb of this._readyCallbacks) cb();
    this._readyCallbacks.clear();
    this._flushPendingZaps();
  }

  _flushPendingZaps() {
    const count = Math.min(this._pendingZaps, 3);
    this._pendingZaps = 0;
    for (let i = 0; i < count; i++) {
      setTimeout(() => void this.playZap(), i * 55);
    }
  }

  requestZap() {
    if (!shouldPlayBugZapperSfx()) return;
    const now = Date.now();
    if (now - this._lastZapAt < 95) return;
    this._lastZapAt = now;
    if (this._ready) {
      void this.playZap();
      return;
    }
    this._pendingZaps = Math.min(this._pendingZaps + 1, 3);
    this.arm();
    void this._ensureCtx(false);
  }

  startHum() {
    this._humRefCount++;
    if (!shouldPlayBugZapperSfx()) return;
    this.arm();
    this.whenReady(() => this._ensureHumPlaying());
  }

  stopHum() {
    this._humRefCount = Math.max(0, this._humRefCount - 1);
    if (this._humRefCount === 0) {
      this._stopHumNodes();
    }
  }

  _ensureHumPlaying() {
    if (this._humNodes || !shouldPlayBugZapperSfx() || this._humRefCount === 0) return;
    const ctx = this._ctx;
    if (!ctx || ctx.state !== "running") return;

    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(MIN_GAIN, t);
    master.gain.exponentialRampToValueAtTime(0.055, t + 0.35);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    lp.Q.value = 0.6;

    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.setValueAtTime(56, t);

    const buzz = ctx.createOscillator();
    buzz.type = "triangle";
    buzz.frequency.setValueAtTime(112, t);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4.5;
    lfo.connect(lfoGain).connect(hum.frequency);

    const noiseDur = 2;
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDur), ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseBp = ctx.createBiquadFilter();
    noiseBp.type = "bandpass";
    noiseBp.frequency.value = 180;
    noiseBp.Q.value = 0.5;
    const noiseG = ctx.createGain();
    noiseG.gain.value = 0.08;

    hum.connect(lp);
    buzz.connect(lp);
    noise.connect(noiseBp).connect(noiseG).connect(lp);
    lp.connect(master).connect(ctx.destination);

    hum.start(t);
    buzz.start(t);
    lfo.start(t);
    noise.start(t);

    this._humNodes = { hum, buzz, lfo, noise, master };
  }

  _stopHumNodes() {
    const nodes = this._humNodes;
    if (!nodes || !this._ctx) return;
    const t = this._ctx.currentTime;
    try {
      nodes.master.gain.cancelScheduledValues(t);
      nodes.master.gain.setValueAtTime(nodes.master.gain.value, t);
      nodes.master.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.12);
      const stopAt = t + 0.14;
      nodes.hum.stop(stopAt);
      nodes.buzz.stop(stopAt);
      nodes.lfo.stop(stopAt);
      nodes.noise.stop(stopAt);
    } catch {
      // nodes may already be stopped
    }
    this._humNodes = null;
  }

  _bindGestureUnlock() {
    if (this._gestureBound) return;
    this._gestureBound = true;

    const unlock = () => {
      void this._ensureCtx(true);
    };

    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("keydown", unlock);
  }

  async _ensureCtx(playUnlockBlip = false) {
    if (typeof window === "undefined") return null;
    try {
      if (!this._ctx) this._ctx = createAudioContext();
      await resumeAudioContext(this._ctx);
      if (this._ctx.state === "suspended") {
        await this._ctx.resume();
      }
      if (this._ctx.state === "running") {
        if (playUnlockBlip) this._playUnlockBlip();
        this._markReady();
      }
      return this._ctx;
    } catch {
      return null;
    }
  }

  _playUnlockBlip() {
    const ctx = this._ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.setValueAtTime(MIN_GAIN, t);
    g.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.01);
    osc.frequency.setValueAtTime(1, t);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  async playZap() {
    const ctx = await this._ensureCtx(false);
    if (!ctx || ctx.state !== "running" || !shouldPlayBugZapperSfx()) return;

    const t = ctx.currentTime;
    const dur = 0.16 + Math.random() * 0.1;
    const out = ctx.createGain();
    out.gain.value = 0.92;
    out.connect(ctx.destination);

    // ── Deep punch (fast thump, not a long bomb rumble) ──
    const deepBus = ctx.createBiquadFilter();
    deepBus.type = "lowpass";
    deepBus.frequency.value = 220;
    deepBus.Q.value = 0.7;
    deepBus.connect(out);

    const deepStart = 78 + Math.random() * 14;
    const deepEnd = 34 + Math.random() * 8;
    const deep = ctx.createOscillator();
    deep.type = "sine";
    deep.frequency.setValueAtTime(deepStart, t);
    deep.frequency.exponentialRampToValueAtTime(deepEnd, t + 0.045);

    const deepSub = ctx.createOscillator();
    deepSub.type = "triangle";
    deepSub.frequency.setValueAtTime(deepStart * 0.5, t);
    deepSub.frequency.exponentialRampToValueAtTime(deepEnd * 0.9, t + 0.05);

    const deepG = ctx.createGain();
    deepG.gain.setValueAtTime(MIN_GAIN, t);
    deepG.gain.exponentialRampToValueAtTime(0.38, t + 0.006);
    deepG.gain.exponentialRampToValueAtTime(0.14, t + 0.035);
    deepG.gain.exponentialRampToValueAtTime(MIN_GAIN, t + dur * 0.55);
    deep.connect(deepG);
    deepSub.connect(deepG);
    deepG.connect(deepBus);
    deep.start(t);
    deep.stop(t + dur * 0.6);
    deepSub.start(t);
    deepSub.stop(t + dur * 0.6);

    // ── High taser whine (electric arc squeal) ──
    const taserBus = ctx.createBiquadFilter();
    taserBus.type = "bandpass";
    taserBus.frequency.value = 2800 + Math.random() * 1200;
    taserBus.Q.value = 5.5;
    taserBus.connect(out);

    const taserStart = 4200 + Math.random() * 1800;
    const taserEnd = 1400 + Math.random() * 600;
    const taser = ctx.createOscillator();
    taser.type = "sawtooth";
    taser.frequency.setValueAtTime(taserStart, t);
    taser.frequency.exponentialRampToValueAtTime(taserEnd, t + 0.04);

    const taserHarm = ctx.createOscillator();
    taserHarm.type = "square";
    taserHarm.frequency.setValueAtTime(taserStart * 1.5, t);
    taserHarm.frequency.exponentialRampToValueAtTime(taserEnd * 1.35, t + 0.035);

    const taserG = ctx.createGain();
    taserG.gain.setValueAtTime(MIN_GAIN, t);
    taserG.gain.exponentialRampToValueAtTime(0.2, t + 0.003);
    taserG.gain.setValueAtTime(0.16, t + 0.025);
    taserG.gain.exponentialRampToValueAtTime(MIN_GAIN, t + dur * 0.85);
    taser.connect(taserG);
    taserHarm.connect(taserG);
    taserG.connect(taserBus);
    taser.start(t);
    taser.stop(t + dur);
    taserHarm.start(t);
    taserHarm.stop(t + dur);

    // ── Crackle / arc sizzle (sharp high-mid bursts) ──
    const crackleLen = dur + 0.04;
    const crackleBuf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * crackleLen),
      ctx.sampleRate
    );
    const crackleData = crackleBuf.getChannelData(0);
    for (let i = 0; i < crackleData.length; i++) {
      crackleData[i] = Math.random() * 2 - 1;
    }

    const crackle = ctx.createBufferSource();
    crackle.buffer = crackleBuf;

    const crackleHp = ctx.createBiquadFilter();
    crackleHp.type = "highpass";
    crackleHp.frequency.value = 900;

    const crackleBp = ctx.createBiquadFilter();
    crackleBp.type = "bandpass";
    crackleBp.frequency.value = 3200 + Math.random() * 2400;
    crackleBp.Q.value = 1.4;

    const crackleG = ctx.createGain();
    crackleG.gain.setValueAtTime(MIN_GAIN, t);
    crackleG.gain.exponentialRampToValueAtTime(0.26, t + 0.004);
    const pops = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < pops; i++) {
      const pt = t + 0.008 + (i / pops) * (dur * 0.75);
      crackleG.gain.setValueAtTime(0.14 + Math.random() * 0.14, pt);
      crackleG.gain.setValueAtTime(0.04 + Math.random() * 0.05, pt + 0.012);
    }
    crackleG.gain.exponentialRampToValueAtTime(MIN_GAIN, t + dur);

    crackle.connect(crackleHp).connect(crackleBp).connect(crackleG).connect(out);
    crackle.start(t);
    crackle.stop(t + crackleLen);

    // ── Micro spark tick at the hit (very short high ping) ──
    const spark = ctx.createOscillator();
    spark.type = "triangle";
    spark.frequency.setValueAtTime(6800 + Math.random() * 2200, t);
    spark.frequency.exponentialRampToValueAtTime(3200, t + 0.018);
    const sparkG = ctx.createGain();
    sparkG.gain.setValueAtTime(MIN_GAIN, t);
    sparkG.gain.exponentialRampToValueAtTime(0.11, t + 0.002);
    sparkG.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.028);
    spark.connect(sparkG).connect(out);
    spark.start(t);
    spark.stop(t + 0.03);
  }
}

export const bugZapperSound = new BugZapperSoundEngine();

export function armBugZapperAudio() {
  bugZapperSound.arm();
}

export function whenBugZapperAudioReady(callback) {
  return bugZapperSound.whenReady(callback);
}

export function playBugZapSound() {
  bugZapperSound.requestZap();
}

export function startBugZapperHum() {
  bugZapperSound.startHum();
}

export function stopBugZapperHum() {
  bugZapperSound.stopHum();
}
