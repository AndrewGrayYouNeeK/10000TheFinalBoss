import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Swords, X } from "lucide-react";
import BossAvatar from "./BossAvatar";

// A pre-fight or post-fight dialogue overlay.
// mode: "intro" | "win" | "lose"
export default function BossDialogue({ boss, mode, onContinue, onExit, summary }) {
  if (!boss) return null;

  const line =
    mode === "intro" ? boss.intro :
    mode === "win"   ? boss.winLine :
                       boss.loseLine;

  const continueLabel =
    mode === "intro" ? "Roll the Dice" :
    mode === "win"   ? "Claim Rewards" :
                       "Try Again";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.85, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="rounded-2xl border-2 p-6 max-w-sm w-full"
          style={{
            background: "rgba(8,2,20,0.95)",
            borderColor: "rgba(0,255,200,0.45)",
            boxShadow: "0 0 36px rgba(0,255,200,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-4">
            <BossAvatar boss={boss} sizeClass="w-16 h-16" emojiClass="text-4xl" />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-black text-white truncate">{boss.name}</div>
              <div className="text-xs text-slate-400 italic">{boss.title}</div>
            </div>
          </div>

          {/* Quote */}
          <div className="mb-5 rounded-lg p-4 border border-slate-700/60 bg-black/40">
            <p className="text-white text-sm italic leading-relaxed">"{line}"</p>
          </div>

          {/* Win rewards */}
          {mode === "win" && summary && (
            <div className="mb-5 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm space-y-1">
              <div className="text-amber-300 font-black uppercase tracking-wider text-xs mb-1">
                ⚡ Rewards
              </div>
              <div className="text-amber-100">+{summary.coins} coins</div>
              <div className="text-cyan-200">+{summary.xp} XP</div>
              {summary.skinUnlocked && (
                <div className="text-fuchsia-300 font-bold">✨ New skin unlocked: {summary.skinUnlocked}</div>
              )}
              {summary.alreadyClaimed && (
                <div className="text-slate-400 text-xs italic">(Already cleared — half rewards.)</div>
              )}
            </div>
          )}

          {/* Gimmick warning on intro */}
          {mode === "intro" && boss.gimmick && (
            <div className="mb-5 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 p-3 text-sm">
              <div className="text-fuchsia-300 font-black uppercase tracking-wider text-xs mb-1">
                ⚡ {boss.gimmick.name}
              </div>
              <div className="text-slate-200">{boss.gimmick.description}</div>
            </div>
          )}

          <div className="flex gap-2">
            {mode !== "intro" && (
              <Button
                variant="outline"
                onClick={onExit}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/30"
              >
                <X className="w-4 h-4 mr-1" /> Exit
              </Button>
            )}
            <Button
              onClick={onContinue}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-black"
            >
              <Swords className="w-4 h-4 mr-1" /> {continueLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}