/**
 * Singleton mic analyser — one stream shared by every Soundwave die on screen.
 */

import {
  createAudioContext,
  ensureMediaDevices,
  listAudioInputDevices,
  micSupportError,
  requestMicrophoneStream,
  resumeAudioContext,
} from "./micAccess";
import {
  dbToGain,
  loadSoundwaveMicSettings,
  resolveMicSettings,
  saveSoundwaveMicSettings,
} from "@/lib/soundwaveMicSettings";
import { isIOSWebKit, isNativeIOS } from "@/lib/platform";

ensureMediaDevices();

const BAR_COUNT_DEFAULT = 14;
const USE_PROCESSOR = typeof window !== "undefined";

class AudioLevelsEngine {
  constructor() {
    this.subscribers = new Set();
    this.levels = Array(BAR_COUNT_DEFAULT).fill(0.08);
    this.live = false;
    this.pending = false;
    this.error = null;
    this.synthetic = false;
    this.barCount = BAR_COUNT_DEFAULT;
    this.settings = resolveMicSettings(loadSoundwaveMicSettings());
    this.devices = [];

    this._stream = null;
    this._ctx = null;
    this._source = null;
    this._analyser = null;
    this._gainNode = null;
    this._processor = null;
    this._silentSink = null;
    this._freq = null;
    this._time = null;
    this._floatTime = null;
    this._processorRms = 0;
    this._processorPeak = 0;
    this._inputLevel = 0;
    this._raf = null;
    this._started = false;
    this._gestureBound = false;
    this._syntheticNodes = [];
    this._stopTimer = null;
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(patch) {
    const merged = { ...this.settings, ...patch };
    if (patch.preset && patch.preset !== "custom") {
      const resolved = resolveMicSettings(merged);
      this.settings = resolved;
    } else {
      this.settings = resolveMicSettings({ ...merged, preset: merged.preset || "custom" });
    }
    saveSoundwaveMicSettings(this.settings);
    this._notify();
    if (this._started && !this.synthetic) {
      void this.restart();
    }
  }

  async refreshDevices() {
    this.devices = await listAudioInputDevices();
    this._notify();
    return this.devices;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    if (this._stopTimer) {
      clearTimeout(this._stopTimer);
      this._stopTimer = null;
    }
    callback(this.levels, this._meta());
    this._bindGestureResume();
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this._stopTimer = setTimeout(() => {
          if (this.subscribers.size === 0) this._stop();
        }, 8000);
      }
    };
  }

  _trackInfo() {
    const track = this._stream?.getAudioTracks?.()[0];
    if (!track) return null;
    return {
      readyState: track.readyState,
      muted: track.muted,
      enabled: track.enabled,
      label: track.label || "",
    };
  }

  _meta() {
    return {
      live: this.live,
      error: this.error,
      pending: this.pending,
      synthetic: this.synthetic,
      settings: this.getSettings(),
      devices: this.devices,
      inputLevel: this._inputLevel,
      debug: {
        ctxState: this._ctx?.state ?? "none",
        track: this._trackInfo(),
        usesProcessor: !!this._processor,
        ios: isIOSWebKit() || isNativeIOS(),
      },
    };
  }

  _notify() {
    for (const cb of this.subscribers) {
      cb(this.levels, this._meta());
    }
  }

  _bindGestureResume() {
    if (this._gestureBound || typeof document === "undefined") return;
    this._gestureBound = true;
    const onGesture = () => {
      void this._resumeContext();
    };
    document.addEventListener("pointerdown", onGesture, { passive: true });
    document.addEventListener("keydown", onGesture);
  }

  async _ensureAudioContext() {
    if (!this._ctx || this._ctx.state === "closed") {
      this._ctx = createAudioContext();
    }
    await resumeAudioContext(this._ctx);
    return this._ctx;
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
    this._source = null;

    if (this._processor) {
      this._processor.onaudioprocess = null;
      try {
        this._processor.disconnect();
      } catch {
        /* ignore */
      }
      this._processor = null;
    }

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

    try {
      this._gainNode?.disconnect();
      this._analyser?.disconnect();
      this._silentSink?.disconnect();
    } catch {
      /* ignore */
    }

    this._analyser = null;
    this._gainNode = null;
    this._silentSink = null;
    this._freq = null;
    this._time = null;
    this._floatTime = null;
    this._processorRms = 0;
    this._processorPeak = 0;
  }

  _applyAnalyserSettings() {
    if (!this._analyser) return;
    const s = this.settings;
    this._analyser.fftSize = 2048;
    this._analyser.smoothingTimeConstant = Math.max(0.05, Math.min(0.95, s.smoothing ?? 0.4));
    this._analyser.minDecibels = -90;
    this._analyser.maxDecibels = -10;
  }

  async _setupAnalyser(ctx) {
    this._ctx = ctx;
    await this._resumeContext();

    this._analyser = this._ctx.createAnalyser();
    this._applyAnalyserSettings();

    this._gainNode = this._ctx.createGain();
    this._gainNode.gain.value = dbToGain(this.settings.boostDb ?? 10);

    this._silentSink = this._ctx.createGain();
    this._silentSink.gain.value = 0.0001;

    this._freq = new Uint8Array(this._analyser.frequencyBinCount);
    this._time = new Uint8Array(this._analyser.fftSize);
    this._floatTime = new Float32Array(this._analyser.fftSize);
  }

  _setupProcessor() {
    if (!USE_PROCESSOR || !this._ctx?.createScriptProcessor) return;
    const bufferSize = 2048;
    this._processor = this._ctx.createScriptProcessor(bufferSize, 1, 1);
    this._processor.onaudioprocess = (event) => {
      const data = event.inputBuffer.getChannelData(0);
      let sumSq = 0;
      let peak = 0;
      for (let i = 0; i < data.length; i++) {
        const n = Math.abs(data[i]);
        sumSq += n * n;
        peak = Math.max(peak, n);
      }
      this._processorRms = Math.sqrt(sumSq / data.length);
      this._processorPeak = peak;
    };
  }

  _wireMicrophoneGraph() {
    this._source = this._ctx.createMediaStreamSource(this._stream);

    // Frequency bars
    this._source.connect(this._gainNode);
    this._gainNode.connect(this._analyser);

    // ScriptProcessor keeps iOS WKWebView delivering live samples
    if (this._processor) {
      this._source.connect(this._processor);
      this._processor.connect(this._silentSink);
    } else {
      this._analyser.connect(this._silentSink);
    }

    // Must reach destination (even near-silent) or iOS may not run the graph
    this._silentSink.connect(this._ctx.destination);
  }

  _wireSyntheticGraph() {
    this._gainNode.connect(this._analyser);
    this._analyser.connect(this._silentSink);
    this._silentSink.connect(this._ctx.destination);
  }

  _micErrorMessage(micErr) {
    if (micErr?.name === "NotAllowedError" || micErr?.name === "PermissionDeniedError") {
      return "Mic blocked — allow in Settings → YouNeeK 10000 → Microphone, then tap Enable again";
    }
    if (micErr?.code === "INSECURE_CONTEXT") return micErr.message;
    if (micErr?.name === "NotFoundError") return "No mic found — check device or Simulator I/O → Audio Input";
    return micErr?.message || "Mic unavailable — tap to retry";
  }

  async _startMicrophone() {
    this._cleanupNodes();
    await this._ensureAudioContext();
    this._stream = await requestMicrophoneStream(this.settings);

    const tracks = this._stream.getAudioTracks?.() ?? [];
    if (!tracks.length) {
      throw Object.assign(new Error("No audio tracks from microphone"), { name: "NotFoundError" });
    }
    for (const track of tracks) {
      track.enabled = true;
    }

    await this._setupAnalyser(this._ctx);
    this._setupProcessor();
    this._wireMicrophoneGraph();
    this.synthetic = false;

    await this._resumeContext();
    await this.refreshDevices();
  }

  async _startSynthetic() {
    this._cleanupNodes();
    await this._ensureAudioContext();
    await this._setupAnalyser(this._ctx);

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
    gain.gain.value = 0.42;

    const lfo = this._ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.55;
    const lfoDepth = this._ctx.createGain();
    lfoDepth.gain.value = 0.22;
    lfo.connect(lfoDepth);
    lfoDepth.connect(gain.gain);

    const lfo2 = this._ctx.createOscillator();
    lfo2.type = "sine";
    lfo2.frequency.value = 3.8;
    const lfo2Depth = this._ctx.createGain();
    lfo2Depth.gain.value = 0.14;
    lfo2.connect(lfo2Depth);
    lfo2Depth.connect(gain.gain);

    noise.connect(gain);
    gain.connect(this._gainNode);
    this._wireSyntheticGraph();
    noise.start();
    lfo.start();
    lfo2.start();

    this._syntheticNodes = [noise, lfo, lfo2];
    this.synthetic = true;
    await this._resumeContext();
  }

  _beginLive() {
    this._started = true;
    this.live = true;
    this.pending = false;
    this._loop();
    this._notify();
  }

  _failMic(micErr) {
    this.pending = false;
    this.live = false;
    this.synthetic = false;
    this._started = false;
    this.error = this._micErrorMessage(micErr);
    this._cleanupNodes();
    this._notify();
  }

  async restart() {
    const wasLive = this._started;
    this._stop(false);
    if (wasLive || this.subscribers.size > 0) {
      await this.ensureStarted(true);
    }
  }

  async startDemo() {
    if (this.pending) return;
    if (this._started) this._stop(false);

    this.pending = true;
    this.error = null;
    this._notify();
    this._bindGestureResume();

    try {
      await this._ensureAudioContext();
      await this._startSynthetic();
      this.error = null;
      this._beginLive();
    } catch {
      this.pending = false;
      this.live = false;
      this.synthetic = false;
      this._started = false;
      this.error = "Demo audio unavailable";
      this._cleanupNodes();
      this._notify();
    }
  }

  async ensureStarted(force = false) {
    if (this.pending) return;
    if (!force) return;

    this._bindGestureResume();

    // Resume/create context immediately after user gesture (required on iOS)
    if (!this._ctx || this._ctx.state === "closed") {
      this._ctx = createAudioContext();
    }
    await resumeAudioContext(this._ctx);

    if (this._started) {
      this._stop(false);
    }

    this.settings = resolveMicSettings(loadSoundwaveMicSettings());
    this.pending = true;
    this.error = null;
    this._notify();

    const supportErr = micSupportError();
    if (supportErr) {
      this._failMic(Object.assign(new Error(supportErr), { code: "INSECURE_CONTEXT" }));
      return;
    }

    try {
      await this._startMicrophone();
      this.error = null;
      this._beginLive();
    } catch (micErr) {
      this._failMic(micErr);
    }
  }

  _measureInput() {
    if (!this._analyser || !this._freq) {
      return { rms: 0, peakTime: 0, speechNorm: 0 };
    }

    this._analyser.getByteFrequencyData(this._freq);

    let rms = this._processorRms;
    let peakTime = this._processorPeak;

    if (rms <= 0) {
      if (this._floatTime && this._analyser.getFloatTimeDomainData) {
        this._analyser.getFloatTimeDomainData(this._floatTime);
        let sumSq = 0;
        for (let i = 0; i < this._floatTime.length; i++) {
          const n = Math.abs(this._floatTime[i]);
          sumSq += n * n;
          peakTime = Math.max(peakTime, n);
        }
        rms = Math.sqrt(sumSq / this._floatTime.length);
      } else if (this._time) {
        this._analyser.getByteTimeDomainData(this._time);
        let sumSq = 0;
        for (let i = 0; i < this._time.length; i++) {
          const n = Math.abs((this._time[i] - 128) / 128);
          sumSq += n * n;
          peakTime = Math.max(peakTime, n);
        }
        rms = Math.sqrt(sumSq / this._time.length);
      }
    }

    const bins = this._freq.length;
    const speechStart = 6;
    const speechEnd = Math.min(200, bins);
    let speechSum = 0;
    for (let j = speechStart; j < speechEnd; j++) {
      speechSum += this._freq[j];
    }
    const speechNorm = speechSum / ((speechEnd - speechStart) * 255);

    return { rms, peakTime, speechNorm };
  }

  _readLevels() {
    if (!this._analyser || !this._freq) return this.levels;

    if (this._gainNode) {
      this._gainNode.gain.value = dbToGain(this.settings.boostDb ?? 10);
    }
    if (this._analyser) {
      const s = this.settings;
      this._analyser.smoothingTimeConstant = Math.max(0.05, Math.min(0.95, s.smoothing ?? 0.4));
    }

    const { rms, peakTime, speechNorm } = this._measureInput();

    const bins = this._freq.length;
    const count = this.barCount;
    const next = [];
    const sens = this.settings.sensitivity ?? 2.0;
    const gain = this.synthetic ? sens * 0.85 : sens * 1.5;

    const voiceDrive = rms * 8 + peakTime * 3 + speechNorm * 4;
    this._inputLevel = Math.min(1, Math.pow(voiceDrive * gain * 0.28, 0.5));

    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const t1 = (i + 1) / count;
      const start = Math.floor(Math.pow(t0, 1.15) * bins);
      const end = Math.max(start + 1, Math.floor(Math.pow(t1, 1.15) * bins));

      let peak = 0;
      let avg = 0;
      for (let j = start; j < end && j < bins; j++) {
        peak = Math.max(peak, this._freq[j]);
        avg += this._freq[j];
      }
      avg /= end - start;

      const freqNorm = (peak * 0.5 + avg * 0.5) / 255;
      const raw = freqNorm * 1.4 + voiceDrive;
      const boosted = Math.pow(Math.min(1, raw * gain * 0.38), 0.42);
      next.push(Math.max(0.02, boosted));
    }

    return next;
  }

  _loop = () => {
    if (!this._started) return;
    this.levels = this._readLevels();
    this._notify();
    this._raf = requestAnimationFrame(this._loop);
  };

  _stop(clearError = true) {
    if (this._stopTimer) {
      clearTimeout(this._stopTimer);
      this._stopTimer = null;
    }
    this._cleanupNodes();
    // Keep AudioContext alive — closing it breaks iOS mic until the next gesture
    this._started = false;
    this.live = false;
    this.pending = false;
    this.synthetic = false;
    if (clearError) this.error = null;
    this._notify();
  }
}

export const audioLevelsEngine = new AudioLevelsEngine();
