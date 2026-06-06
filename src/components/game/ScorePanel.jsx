import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import LevelBadge from "@/components/online/LevelBadge";

export default function ScorePanel({ players, currentIndex, target = 10000 }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {players.map((p, i) => {
        const active = i === currentIndex;
        const pct = Math.min(100, (p.score / target) * 100);
        return (
          <motion.div
            key={i}
            animate={{ scale: active ? 1.02 : 1 }}
            className="relative rounded-2xl p-3 border overflow-hidden"
            style={
              active
                ? {
                    background:
                      "linear-gradient(135deg, rgba(255,0,170,0.18) 0%, rgba(0,255,200,0.18) 100%)",
                    borderColor: "rgba(0,255,200,0.7)",
                    boxShadow:
                      "0 0 0 1px rgba(255,0,170,0.4) inset, 0 0 22px rgba(0,255,200,0.45), 0 0 22px rgba(255,0,170,0.3)",
                  }
                : {
                    background: "rgba(8,10,20,0.7)",
                    borderColor: "rgba(0,255,200,0.18)",
                    boxShadow: "0 0 0 1px rgba(0,255,200,0.08) inset",
                  }
            }
          >
            {/* Active glow sweep */}
            {active && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(0,255,200,0.18) 50%, transparent 100%)",
                }}
              />
            )}

            <div className="flex items-center gap-2 mb-1 relative">
              {active && (
                <Zap
                  className="w-4 h-4 animate-pulse"
                  style={{ color: "#00ffc8", filter: "drop-shadow(0 0 4px #00ffc8)" }}
                />
              )}
              <span
                className={cn("font-bold text-sm truncate uppercase tracking-wide", active ? "text-white" : "text-slate-300")}
                style={active ? { textShadow: "0 0 8px rgba(0,255,200,0.7)" } : {}}
              >
                {p.name}
              </span>
              {typeof p.level === "number" && (
                <LevelBadge level={p.level} tierId={p.tierId ?? 0} size="xs" />
              )}
              {p.score >= target && (
                <Trophy
                  className="w-4 h-4 ml-auto"
                  style={{ color: "#ffd84d", filter: "drop-shadow(0 0 6px #ffd84d)" }}
                />
              )}
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={p.score}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn("text-2xl font-black tabular-nums relative")}
                style={
                  active
                    ? { color: "#ffffff", textShadow: "0 0 10px rgba(0,255,200,0.9), 0 0 18px rgba(255,0,170,0.5)" }
                    : { color: "#cbd5e1" }
                }
              >
                {p.score.toLocaleString()}
              </motion.div>
            </AnimatePresence>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden relative" style={{ background: "rgba(0,0,0,0.6)" }}>
              <motion.div
                className="h-full"
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                style={{
                  background: active
                    ? "linear-gradient(90deg, #ff00aa, #00ffc8)"
                    : "linear-gradient(90deg, #00ffc8, #00d4a4)",
                  boxShadow: active ? "0 0 8px rgba(0,255,200,0.8)" : "0 0 4px rgba(0,255,200,0.5)",
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}