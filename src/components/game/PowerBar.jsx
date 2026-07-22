import React from "react";
import { motion } from "framer-motion";
import { MAX_POWER } from "@/lib/powers";

// Neon Power bar — fills as the player rolls, scores, hot-dices.
// Pass `frozen` to render the depleted/iced state (power-bar Freeze sabotage — not Score Freeze).
export default function PowerBar({ power = 0, frozen = false, label = "POWER", compact = false }) {
  const pct = Math.max(0, Math.min(100, (power / MAX_POWER) * 100));

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between ${compact ? "mb-0.5" : "mb-1"}`}>
        <span
          className={`font-black uppercase ${compact ? "text-[7px] tracking-[0.22em]" : "text-[9px] tracking-[0.3em]"}`}
          style={{
            color: frozen ? "#00d4ff" : "#00ffc8",
            textShadow: frozen ? "0 0 6px #00d4ff" : "0 0 6px rgba(0,255,200,0.8)",
          }}
        >
          ▸ {frozen ? "POWER FROZEN" : label}
        </span>
        <span
          className={`font-black tabular-nums ${compact ? "text-[9px]" : "text-xs"}`}
          style={{
            color: "#fff",
            textShadow: "0 0 6px rgba(0,255,200,0.8)",
          }}
        >
          {Math.floor(power)}/{MAX_POWER}
        </span>
      </div>
      <div
        className={`relative rounded-full overflow-hidden border ${compact ? "h-1.5" : "h-3"}`}
        style={{
          background: "rgba(0,0,0,0.6)",
          borderColor: frozen ? "rgba(0,212,255,0.5)" : "rgba(0,255,200,0.4)",
          boxShadow: frozen
            ? "inset 0 0 8px rgba(0,212,255,0.3)"
            : "inset 0 0 8px rgba(0,255,200,0.2)",
        }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: frozen
              ? "linear-gradient(90deg, #0066aa, #00d4ff, #aef0ff)"
              : "linear-gradient(90deg, #00ffc8, #a855f7, #ff00aa)",
            boxShadow: frozen
              ? "0 0 12px #00d4ff, 0 0 24px rgba(0,212,255,0.5)"
              : "0 0 12px #00ffc8, 0 0 24px rgba(168,85,247,0.5)",
          }}
        />
        {/* shimmer */}
        {!frozen && pct > 0 && (
          <motion.div
            className="absolute inset-y-0 w-12"
            animate={{ x: ["-50px", "300px"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            }}
          />
        )}
      </div>
    </div>
  );
}