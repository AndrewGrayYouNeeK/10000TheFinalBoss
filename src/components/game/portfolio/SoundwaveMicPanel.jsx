import React, { useState } from "react";
import { MIC_PRESETS } from "@/lib/soundwaveMicSettings";

export default function SoundwaveMicPanel({
  settings,
  devices,
  live,
  synthetic = false,
  onChange,
  onRefreshDevices,
  onRestart,
  onStartDemo,
}) {
  const [open, setOpen] = useState(false);
  const preset = MIC_PRESETS.find((p) => p.id === settings.preset) ?? MIC_PRESETS[0];

  const set = (patch) => onChange({ ...patch, preset: patch.preset ?? "custom" });

  return (
    <div
      className="absolute top-0.5 right-0.5 z-20 pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-fuchsia-300 border border-fuchsia-500/45 hover:bg-fuchsia-950/60"
        onClick={() => setOpen((v) => !v)}
        title="Microphone options"
      >
        {open ? "✕ Mic" : "⚙ Mic"}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 w-[min(92vw,220px)] rounded-lg border border-fuchsia-500/35 bg-black/92 backdrop-blur-sm p-2 space-y-2 shadow-lg shadow-fuchsia-500/10"
          style={{ maxHeight: "min(52vh, 320px)", overflowY: "auto" }}
        >
          <p className="text-[9px] font-black uppercase tracking-wider text-fuchsia-300">Soundwave Mic</p>

          <label className="block space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wide">Preset</span>
            <select
              className="w-full text-[10px] rounded bg-slate-900 border border-slate-700 text-white px-1.5 py-1"
              value={settings.preset}
              onChange={(e) => onChange({ preset: e.target.value })}
            >
              {MIC_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <span className="text-[7px] text-slate-500 leading-tight block">{preset.blurb}</span>
          </label>

          <label className="block space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wide">
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

          <label className="block space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wide">
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

          <label className="block space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wide">
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

          <label className="block space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wide">Input device</span>
            <select
              className="w-full text-[10px] rounded bg-slate-900 border border-slate-700 text-white px-1.5 py-1"
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

          <div className="grid grid-cols-1 gap-1 pt-0.5">
            {[
              ["echoCancellation", "Echo cancel"],
              ["noiseSuppression", "Noise filter"],
              ["autoGainControl", "Auto gain"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5 text-[9px] text-slate-300 cursor-pointer">
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

          <div className="flex gap-1 pt-1">
            <button
              type="button"
              className="flex-1 text-[8px] font-bold uppercase py-1 rounded bg-cyan-900/50 border border-cyan-500/40 text-cyan-200"
              onClick={() => void onRefreshDevices()}
            >
              Scan mics
            </button>
            <button
              type="button"
              className="flex-1 text-[8px] font-bold uppercase py-1 rounded bg-fuchsia-900/50 border border-fuchsia-500/40 text-fuchsia-200"
              onClick={() => void onRestart()}
            >
              Restart
            </button>
          </div>

          {onStartDemo && (
            <button
              type="button"
              className="w-full text-[8px] font-bold uppercase py-1 rounded bg-amber-900/40 border border-amber-500/35 text-amber-200"
              onClick={() => void onStartDemo()}
            >
              {synthetic ? "Demo running" : "Use demo audio"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
