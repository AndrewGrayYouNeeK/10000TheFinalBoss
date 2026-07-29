import React from "react";
import { motion } from "framer-motion";
import { canAfford } from "@/lib/powers";

// One equipped power button shown during a match — skinny bright pill.
export default function PowerSlot({ power, currentPower = 0, used = false, locked = false, onFire }) {
  if (!power) {
    return (
      <div
        className="h-7 min-w-[4.5rem] px-2 rounded-full border border-dashed flex items-center justify-center text-[8px] opacity-40 shrink-0"
        style={{ borderColor: "rgba(0,255,200,0.45)", color: "rgba(0,255,200,0.65)" }}
      >
        empty
      </div>
    );
  }
  const affordable = canAfford(currentPower, power.id);
  const disabled = used || locked || !affordable;

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.96 }}
      whileHover={disabled ? {} : { scale: 1.03 }}
      onClick={() => !disabled && onFire?.(power)}
      disabled={disabled}
      className="relative h-7 min-w-[5.25rem] max-w-[7.5rem] px-2.5 rounded-full border flex flex-row items-center justify-center gap-1 shrink-0 transition-opacity"
      style={{
        background: disabled
          ? "rgba(20,20,30,0.65)"
          : `linear-gradient(90deg, ${power.color}55, ${power.color}88)`,
        borderColor: disabled ? "rgba(255,255,255,0.12)" : power.color,
        boxShadow: disabled
          ? "none"
          : `0 0 14px ${power.color}aa, 0 0 4px ${power.color}, inset 0 0 10px ${power.color}44`,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span
        className="text-sm leading-none shrink-0"
        style={{ filter: disabled ? "grayscale(1)" : `drop-shadow(0 0 4px ${power.color})` }}
      >
        {power.icon}
      </span>
      <span
        className="text-[7px] font-black uppercase tracking-wide leading-none truncate"
        style={{
          color: disabled ? "#888" : "#fff",
          textShadow: disabled ? "none" : `0 0 6px ${power.color}, 0 0 2px #fff`,
        }}
      >
        {power.name}
      </span>
      <span
        className="text-[7px] font-black tabular-nums leading-none shrink-0"
        style={{ color: affordable && !disabled ? "#fff" : "#666", textShadow: affordable && !disabled ? `0 0 4px ${power.color}` : "none" }}
      >
        {power.cost}
      </span>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
          <span className="text-xs">🔒</span>
        </div>
      )}
      {used && !locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
          <span className="text-[8px] font-black text-rose-300 uppercase">Used</span>
        </div>
      )}
    </motion.button>
  );
}
