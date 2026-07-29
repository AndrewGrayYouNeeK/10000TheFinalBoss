import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Move, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS,
  loadFishermanAvatarLoopSettings,
  resetFishermanAvatarLoopSettings,
  saveFishermanAvatarLoopSettings,
  useFishermanAvatarLoopSettings,
} from "@/lib/fishermanAvatarLoopSettings";

const MIN = 15;
const MAX = 85;

function clampAxis(value) {
  return Math.max(MIN, Math.min(MAX, Number(value) || 50));
}

const SAVED_FLASH_MS = 2000;

function useSavedFlash() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const flash = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), SAVED_FLASH_MS);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return { visible, flash };
}

function SavedBadge({ visible }) {
  if (!visible) return null;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 animate-in fade-in duration-150"
      role="status"
      aria-live="polite"
    >
      Saved
    </span>
  );
}

function SliderRow({ label, hint, value, onChange }) {
  return (
    <label className="block text-[11px] text-slate-400">
      {label}: <span className="text-sky-100 tabular-nums">{value}%</span>
      {hint ? <span className="block text-[10px] text-slate-500 mt-0.5">{hint}</span> : null}
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-400 mt-1"
      />
    </label>
  );
}

function LoopPositionControls({ settings, compact = false, onClose }) {
  const { visible: savedVisible, flash: flashSaved } = useSavedFlash();
  const update = (patch) => {
    saveFishermanAvatarLoopSettings({ ...settings, ...patch });
    flashSaved();
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-sky-500/35 bg-slate-950/95 backdrop-blur-sm space-y-3 shadow-lg shadow-sky-950/40",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-sky-200">Marlin Joe loop crop</p>
          <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs">
            Move the diver left/right/up/down. Changes apply instantly on the loop above the dice
            table.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SavedBadge visible={savedVisible} />
          <button
            type="button"
            className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border border-white/20 text-slate-300 hover:text-white inline-flex items-center gap-1"
            onClick={() => {
              resetFishermanAvatarLoopSettings();
              flashSaved();
            }}
          >
            <RotateCcw className="w-3 h-3" aria-hidden />
            Reset
          </button>
          {onClose ? (
            <button
              type="button"
              aria-label="Close loop position tool"
              className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      <SliderRow
        label="Move video left ← → right"
        hint="Lower % shifts the diver left; higher % shifts right."
        value={settings.objectPositionXPercent}
        onChange={(objectPositionXPercent) => update({ objectPositionXPercent })}
      />
      <SliderRow
        label="Move video up ↑ ↓ down"
        hint="50% centers vertically."
        value={settings.objectPositionYPercent}
        onChange={(objectPositionYPercent) => update({ objectPositionYPercent })}
      />

      <details className="text-[10px] text-slate-500">
        <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
          Advanced zoom (optional)
        </summary>
        <label className="block text-[11px] text-slate-400 mt-2">
          Zoom:{" "}
          <span className="text-sky-100 tabular-nums">{settings.scale.toFixed(2)}×</span>
          <input
            type="range"
            min={1}
            max={1.5}
            step={0.01}
            value={settings.scale}
            onChange={(e) => update({ scale: Number(e.target.value) })}
            className="w-full accent-sky-400 mt-1"
          />
        </label>
      </details>

      <p className="text-[10px] text-slate-500">
        Default crop: X {DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS.objectPositionXPercent}%, Y{" "}
        {DEFAULT_FISHERMAN_AVATAR_LOOP_SETTINGS.objectPositionYPercent}%. Saved on this device.
        Shark Bite rotation &amp; timing:{" "}
        <Link to="/shark-bite-lab" className="text-sky-300 hover:text-sky-200 underline">
          Shark Bite Lab
        </Link>
        .
      </p>
    </div>
  );
}

/** Transparent drag layer over the story fight loop video frame. */
export function MarlinLoopPanOverlay({ enabled = false, className }) {
  const settings = useFishermanAvatarLoopSettings();
  const dragRef = useRef(null);
  const { visible: savedVisible, flash: flashSaved } = useSavedFlash();

  const onPointerDown = useCallback(
    (event) => {
      if (!enabled) return;
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const start = {
        x: event.clientX,
        y: event.clientY,
        objectPositionXPercent: settings.objectPositionXPercent,
        objectPositionYPercent: settings.objectPositionYPercent,
      };

      const onMove = (moveEvent) => {
        const rect = target.getBoundingClientRect();
        const dx = moveEvent.clientX - start.x;
        const dy = moveEvent.clientY - start.y;
        const xDelta = (dx / Math.max(rect.width, 1)) * 100;
        const yDelta = (dy / Math.max(rect.height, 1)) * 100;
        saveFishermanAvatarLoopSettings({
          ...loadFishermanAvatarLoopSettings(),
          objectPositionXPercent: clampAxis(start.objectPositionXPercent + xDelta),
          objectPositionYPercent: clampAxis(start.objectPositionYPercent + yDelta),
        });
      };

      const onUp = (upEvent) => {
        target.releasePointerCapture(upEvent.pointerId);
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
        dragRef.current = null;
        flashSaved();
      };

      dragRef.current = { pointerId: event.pointerId };
      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [enabled, flashSaved, settings.objectPositionXPercent, settings.objectPositionYPercent]
  );

  if (!enabled) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 touch-none cursor-grab active:cursor-grabbing",
        "bg-sky-400/10 ring-2 ring-inset ring-sky-300/50",
        className
      )}
      onPointerDown={onPointerDown}
      aria-label="Drag to pan Marlin Joe loop video"
    >
      <div className="absolute inset-x-0 bottom-0 px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wider text-sky-100/90 bg-black/45">
        {savedVisible ? (
          <span className="text-emerald-300" role="status" aria-live="polite">
            Saved
          </span>
        ) : (
          "Drag to pan"
        )}
      </div>
    </div>
  );
}

/**
 * Live crop tuner for Marlin Joe avatar loop — story fights + Video Assets.
 * floating: collapsible panel during gameplay; embedded: inline block for assets page.
 */
export default function MarlinLoopPositionTool({
  floating = false,
  compact = false,
  className,
  open: openProp,
  onOpenChange,
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const settings = useFishermanAvatarLoopSettings();

  if (!floating) {
    return (
      <div className={className}>
        <LoopPositionControls settings={settings} compact={compact} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-3 z-[30] flex flex-col items-end gap-2 max-w-[min(20rem,calc(100vw-1.5rem))]",
        className
      )}
    >
      {open ? (
        <LoopPositionControls
          settings={settings}
          compact={compact}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-wider",
          "border border-sky-400/50 bg-slate-950/90 text-sky-100 shadow-lg shadow-sky-950/50",
          "hover:bg-sky-950/80 hover:border-sky-300/70"
        )}
        onClick={() => setOpen(!open)}
      >
        <Move className="w-3.5 h-3.5" aria-hidden />
        {open ? "Hide adjust" : "Adjust loop"}
      </button>
    </div>
  );
}
