/**
 * Singleton mic analyser — one stream shared by every Soundwave die on screen.
 */

import {
  createAudioContext,
  ensureMediaDevices,
  requestMicrophoneStream,
  resumeAudioContext,
} from "./micAccess";

ensureMediaDevices();

const BAR_COUNT_DEFAULT = 14;

class AudioLevelsEngine {
  constructor() {
    this.subscribers = new Set();
    this.levels = Array(BAR_COUNT_DEFAULT).fill(0.08);
    this.live = false;
    this.pending = false;
    this.error = null;
    this.synthetic = false;
    this.barCount = BAR_COUNT_DEFAULT;

    this._stream = null;
    this._ctx = null;
    this._analyser = null;
    this._freq = null;
    this._time = null;
    this._raf = null;
    this._started = false;
    this._gestureBound = false;
    this._syntheticNodes = [];
    this._stopTimer = null;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    if (this._stopTimer) {
      clearTimeout(this._stopTimer);
      this._stopTimer = null;
    }
    callback(this.levels, { live: this.live, error: this.error, pending: this.pending, synthetic: this.synthetic });
    this._bindGestureResume();
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this._stopTimer = setTimeout(() => {
          if (this.subscribers.size === 0) this._stop();
        }, 800);
      }
    };
  }

  _notify() {
    for (const cb of this.subscribers) {
      cb(this.levels, { live: this.live, error: this.error, pending: this.pending, synthetic: this.synthetic });
    }
  }

  _bindGestureResume() {
    if (this._gestureBound || typeof document === "undefined") return;
    this._gestureBound = true;
    const onGesture = () => {
      this._resumeContext();
    };
    document.addEventListener("pointerdown", onGesture, { passive: true });
    document.addEventListener("keydown", onGesture);
  }

  async _resumeContext() {
    try {
      await resumeAudioContext(this._ctx);
    } catch {
      /* ignore */
    }
  }

  _cleanupNodes() {
    this._stream?.getTracks?.().forEach((t) => t.stop());
    this._stream = null;
    for (const node of this._syntheticNodes) {
      try {
        node.stop?.();
      } catch {
        /* ignore */
      }
    }
    this._syntheticNodes = [];
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._analyser = null;
    this._freq = null;
    this._time = null;
  }

  async _setupAnalyser(ctx) {
    this._ctx = ctx;
    await this._resumeContext();

    this._analyser = this._ctx.createAnalyser();
    this._analyser.fftSize = 1024;
    this._analyser.smoothingTimeConstant = 0.65;
    this._analyser.minDecibels = -90;
    this._analyser.maxDecibels = -10;

    this._freq = new Uint8Array(this._analyser.frequencyBinCount);
    this._time = new Uint8Array(this._analyser.fftSize);
  }

  async _startMicrophone() {
    this._cleanupNodes();
    this._stream = await requestMicrophoneStream();
    const ctx = createAudioContext();
    await this._setupAnalyser(ctx);

    const src = this._ctx.createMediaStreamSource(this._stream);
    src.connect(this._analyser);
    this.synthetic = false;
  }

  async _startSynthetic() {
    this._cleanupNodes();
    if (this._ctx?.state !== "closed") {
      await this._ctx?.close?.().catch(() => {});
    }
    const ctx = createAudioContext();
    await this._setupAnalyser(ctx);

    const bufferSize = this._ctx.sampleRate * 2;
    const noiseBuffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channel[i] = Math.random() * 2 - 1;
    }

    const noise = this._ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const gain = this._ctx.createGain();
    gain.gain.value = 0.35;

    const lfo = this._ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.45;
    const lfoDepth = this._ctx.createGain();
    lfoDepth.gain.value = 0.18;
    lfo.connect(lfoDepth);
    lfoDepth.connect(gain.gain);

    const lfo2 = this._ctx.createOscillator();
    lfo2.type = "sine";
    lfo2.frequency.value = 3.1;
    const lfo2Depth = this._ctx.createGain();
    lfo2Depth.gain.value = 0.12;
    lfo2.connect(lfo2Depth);
    lfo2Depth.connect(gain.gain);

    noise.connect(gain);
    gain.connect(this._analyser);
    noise.start();
    lfo.start();
    lfo2.start();

    this._syntheticNodes = [noise, lfo, lfo2];
    this.synthetic = true;
  }

  _beginLive() {
    this._started = true;
    this.live = true;
    this.pending = false;
    this._loop();
    this._notify();
  }

  async ensureStarted() {
    if (this.pending) return;
    if (this._started && this.live && !this.synthetic) return;

    if (this._started) {
      this._stop();
    }

    this.pending = true;
    this.error = null;
    this._notify();
    this._bindGestureResume();
    await this._resumeContext();

    try {
      try {
        await this._startMicrophone();
        this.error = null;
        this._beginLive();
        return;
      } catch (micErr) {
        if (micErr?.name === "NotAllowedError" || micErr?.name === "PermissionDeniedError") {
          this.error = "Mic blocked — using demo audio";
        } else if (micErr?.code === "INSECURE_CONTEXT") {
          this.error = micErr.message;
        } else {
          this.error = null;
        }
        await this._startSynthetic();
        this._beginLive();
      }
    } catch (err) {
      this.pending = false;
      this.live = false;
      this.synthetic = false;
      this._started = false;
      this._cleanupNodes();
      this._ctx?.close?.().catch(() => {});
      this._ctx = null;
      if (err?.code === "INSECURE_CONTEXT") {
        this.error = err.message;
      } else {
        this.error = "Audio unavailable — tap to retry";
      }
      this._notify();
    }
  }

  _readLevels() {
    if (!this._analyser || !this._freq || !this._time) return this.levels;

    this._analyser.getByteFrequencyData(this._freq);
    this._analyser.getByteTimeDomainData(this._time);

    let sumSq = 0;
    let peakTime = 0;
    for (let i = 0; i < this._time.length; i++) {
      const n = Math.abs((this._time[i] - 128) / 128);
      sumSq += n * n;
      peakTime = Math.max(peakTime, n);
    }
    const rms = Math.sqrt(sumSq / this._time.length);

    const bins = this._freq.length;
    const count = this.barCount;
    const next = [];
    const gain = this.synthetic ? 1.15 : 1.85;

    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const t1 = (i + 1) / count;
      const start = Math.floor(t0 * t0 * bins);
      const end = Math.max(start + 1, Math.floor(t1 * t1 * bins));

      let peak = 0;
      let avg = 0;
      for (let j = start; j < end && j < bins; j++) {
        peak = Math.max(peak, this._freq[j]);
        avg += this._freq[j];
      }
      avg /= end - start;

      const freqNorm = (peak * 0.6 + avg * 0.4) / 255;
      const blended = Math.min(1, (freqNorm * 1.6 + rms * 1.4 + peakTime * 0.35) * gain);
      next.push(Math.max(0.06, blended));
    }

    return next;
  }

  _loop = () => {
    if (!this._started) return;
    this.levels = this._readLevels();
    this._notify();
    this._raf = requestAnimationFrame(this._loop);
  };

  _stop() {
    if (this._stopTimer) {
      clearTimeout(this._stopTimer);
      this._stopTimer = null;
    }
    this._cleanupNodes();
    this._ctx?.close?.().catch(() => {});
    this._ctx = null;
    this._started = false;
    this.live = false;
    this.pending = false;
    this.synthetic = false;
  }
}

export const audioLevelsEngine = new AudioLevelsEngine();
