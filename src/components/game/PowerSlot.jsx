import React from "react";
import { motion } from "framer-motion";
import { canAfford } from "@/lib/powers";

// One equipped power button shown during a match.
// Locked = used (one-charge) or disabled by Lockout debuff.
export default function PowerSlot({ power, currentPower = 0, used = false, locked = false, onFire }) {
  if (!power) {
    return (
      <div
        className="aspect-square rounded-lg border border-dashed flex items-center justify-center text-xs opacity-40"
        style={{ borderColor: "rgba(0,255,200,0.3)", color: "rgba(0,255,200,0.5)" }}
      >
        empty
      </div>
    );
  }
  const affordable = canAfford(currentPower, power.id);
  const disabled = used || locked || !affordable;

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.92 }}
      whileHover={disabled ? {} : { scale: 1.04 }}
      onClick={() => !disabled && onFire?.(power)}
      disabled={disabled}
      className="relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-opacity"
      style={{
        background: disabled
          ? "rgba(20,20,30,0.6)"
          : `linear-gradient(135deg, ${power.color}22, ${power.color}44)`,
        borderColor: disabled ? "rgba(255,255,255,0.15)" : power.color,
        boxShadow: disabled
          ? "none"
          : `0 0 12px ${power.color}66, inset 0 0 8px ${power.color}33`,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span className="text-2xl leading-none" style={{ filter: disabled ? "grayscale(1)" : "none" }}>
        {power.icon}
      </span>
      <span
        className="text-[8px] font-black uppercase tracking-wider mt-1 leading-tight text-center"
        style={{ color: disabled ? "#888" : "#fff", textShadow: disabled ? "none" : `0 0 4px ${power.color}` }}
      >
        {power.name}
      </span>
      <span
        className="absolute top-0.5 right-1 text-[9px] font-black tabular-nums"
        style={{ color: affordable && !disabled ? power.color : "#888" }}
      >
        {power.cost}
      </span>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
          <span className="text-lg">🔒</span>
        </div>
      )}
      {used && !locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-md">
          <span className="text-[10px] font-black text-rose-400 uppercase">Used</span>
        </div>
      )}
    </motion.button>
  );
}