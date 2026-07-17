import React from "react";
import { MIC_PRESETS } from "@/lib/soundwaveMicSettings";

function InputLevelMeter({ level, live, synthetic, debug }) {
  const pct = Math.round(Math.min(1, Math.max(0, level ?? 0)) * 100);
  const barColor =
    pct > 55 ? "bg-emerald-400" : pct > 18 ? "bg-cyan-400" : pct > 4 ? "bg-amber-400" : "bg-slate-600";

  let hint = "Tap “Enable live mic”, then speak or clap.";
  if (live && synthetic) hint = "Demo audio is running — enable live mic to test your voice.";
  else if (live && !synthetic && debug?.track?.muted) {
    hint = "Mic track is muted by the system — check Settings → Privacy → Microphone.";
  } else if (live && !synthetic && pct <= 4 && debug?.ios) {
    hint = "Mic is on but silent on iOS — tap Restart mic, turn off Echo cancel, or test on a real device (not Simulator).";
  } else if (live && !synthetic && pct <= 4) {
    hint = "Mic is on but very quiet — try Sensitive preset or raise Boost.";
  } else if (live && !synthetic && pct > 4) hint = "Voice detected — bars should react on Soundwave dice.";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-bold">Input level</span>
        <span className="text-xs font-mono text-slate-300">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
        <div
          className={`h-full transition-[width] duration-75 ${barColor}`}
          style={{ width: `${Math.max(pct, live ? 2 : 0)}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 leading-snug">{hint}</p>
      {live && !synthetic && debug && (
        <p className="text-[10px] text-slate-600 font-mono leading-snug">
          audio: {debug.ctxState}
          {debug.track?.readyState ? ` · track ${debug.track.readyState}` : ""}
          {debug.track?.label ? ` · ${debug.track.label}` : ""}
          {debug.usesProcessor ? " · live tap" : ""}
        </p>
      )}
    </div>
  );
}

export default function SoundwaveMicSettingsForm({
  settings,
  devices,
  live,
  pending,
  error,
  synthetic,
  inputLevel,
  debug,
  onChange,
  onRefreshDevices,
  onRestart,
  onStartDemo,
  onEnableMic,
  onResetDefaults,
}) {
  const preset = MIC_PRESETS.find((p) => p.id === settings.preset) ?? MIC_PRESETS[0];
  const set = (patch) => onChange({ ...patch, preset: patch.preset ?? "custom" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="flex-1 min-w-[120px] text-xs font-bold uppercase py-2.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white"
          onClick={() => void onEnableMic?.()}
          disabled={pending}
        >
          {pending ? "Starting mic…" : live && !synthetic ? "Live mic on" : "Enable live mic"}
        </button>
        <button
          type="button"
          className="flex-1 min-w-[120px] text-xs font-bold uppercase py-2.5 px-3 rounded-lg bg-fuchsia-900/60 border border-fuchsia-500/40 text-fuchsia-100 hover:bg-fuchsia-900/80"
          onClick={() => void onRestart?.()}
        >
          Restart mic
        </button>
        {onStartDemo && (
          <button
            type="button"
            className="flex-1 min-w-[120px] text-xs font-bold uppercase py-2.5 px-3 rounded-lg bg-amber-900/50 border border-amber-500/35 text-amber-100 hover:bg-amber-900/70"
            onClick={() => void onStartDemo()}
          >
            {synthetic ? "Demo running" : "Use demo audio"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <InputLevelMeter level={inputLevel} live={live} synthetic={synthetic} debug={debug} />

      {live && !synthetic && (
        <p className="text-xs text-emerald-300 font-semibold">Live microphone active</p>
      )}
      {live && synthetic && (
        <p className="text-xs text-amber-300 font-semibold">Demo audio active (no mic)</p>
      )}

      <label className="block space-y-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-bold">Preset</span>
        <select
          className="w-full text-sm rounded-lg bg-slate-900 border border-slate-700 text-white px-3 py-2"
          value={settings.preset}
          onChange={(e) => onChange({ preset: e.target.value })}
        >
          {MIC_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <span className="text-[11px] text-slate-500 leading-snug block">{preset.blurb}</span>
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-bold">
          Sensitivity — {settings.sensitivity.toFixed(1)}×
        </span>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.1}
          value={settings.sensitivity}
          onChange={(e) => set({ sensitivity: Number(e.target.value) })}
          className="w-full accent-fuchsia-400"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-bold">
          Boost — {settings.boostDb} dB
        </span>
        <input
          type="range"
          min={0}
          max={24}
          step={1}
          value={settings.boostDb}
          onChange={(e) => set({ boostDb: Number(e.target.value) })}
          className="w-full accent-cyan-400"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-bold">
          Smoothing — {Math.round(settings.smoothing * 100)}%
        </span>
        <input
          type="range"
          min={0.05}
          max={0.9}
          step={0.05}
          value={settings.smoothing}
          onChange={(e) => set({ smoothing: Number(e.target.value) })}
          className="w-full accent-violet-400"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-bold">Input device</span>
        <select
          className="w-full text-sm rounded-lg bg-slate-900 border border-slate-700 text-white px-3 py-2"
          value={settings.deviceId || ""}
          onChange={(e) => onChange({ preset: "custom", deviceId: e.target.value })}
          disabled={!live && devices.length === 0}
        >
          <option value="">System default</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Mic ${d.deviceId.slice(0, 8)}…`}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          ["echoCancellation", "Echo cancel"],
          ["noiseSuppression", "Noise filter"],
          ["autoGainControl", "Auto gain"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!settings[key]}
              onChange={(e) => set({ [key]: e.target.checked })}
              className="accent-fuchsia-400"
            />
            {label}
          </label>
        ))}
      </div>

      <button
        type="button"
        className="w-full text-xs font-bold uppercase py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700"
        onClick={() => void onRefreshDevices?.()}
      >
        Scan for microphones
      </button>

      {onResetDefaults && (
        <button
          type="button"
          className="w-full text-xs font-bold uppercase py-2 rounded-lg bg-violet-950/50 border border-violet-500/35 text-violet-100 hover:bg-violet-900/60"
          onClick={() => onResetDefaults()}
        >
          Reset to voice defaults
        </button>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Settings are saved on this device and apply to every Soundwave dice in the shop, preview lab, and during play.
        Use the <strong className="text-slate-400 font-semibold">Voice / Talk</strong> preset if bars stay flat while you speak.
        Audio stays on your device and is never recorded or sent anywhere.
      </p>
    </div>
  );
}
