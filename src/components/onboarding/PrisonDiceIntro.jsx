import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dices, Lock, TrendingUp } from "lucide-react";
import Die from "@/components/game/Die";
import { TIERS } from "@/lib/progression";

/**
 * One-time intro shown on the user's very first launch.
 * Explains: you start humble (Prison Dice vibes), and you have to PLAY
 * to climb the prestige tiers to unlock the legendary dice.
 */
export default function PrisonDiceIntro({ open, onDismiss }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative max-w-md w-full rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl shadow-amber-500/10 p-6 text-white"
          >
            <div className="flex justify-center mb-3">
              <Die value={5} size={84} skinId="paper" pipsId="classic_dots" />
            </div>

            <h2 className="text-2xl font-black text-center mb-1">
              Welcome to <span className="text-amber-400">Dice 10,000</span>
            </h2>
            <p className="text-center text-amber-300/80 text-sm font-semibold mb-4">
              Every legend starts with Prison Dice.
            </p>

            <div className="text-slate-300 text-sm space-y-3 mb-5">
              <p>
                These are <b className="text-white">Prison Dice</b> — hand-rolled scraps of paper.
                It's where everyone starts.
              </p>
              <p>
                When you finish this game, you'll get the <b className="text-white">Classic Whites</b> — your first real set.
                From there, the only way up is to <b className="text-amber-300">play.</b>
              </p>

              <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-3 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4" /> Prestige Tiers
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TIERS.map(t => (
                    <span
                      key={t.id}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${t.chip}`}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Climb tiers by playing games, winning, and racking up achievements.
                  Each tier unlocks rarer, more legendary dice.
                </p>
              </div>

              <p className="text-xs text-slate-400 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                <span>
                  Want the <b className="text-fuchsia-300">Mythic</b> dice today? You can pay a steep
                  shortcut price — or play for months and earn them the real way.
                </span>
              </p>
            </div>

            <Button
              onClick={onDismiss}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-base"
            >
              <Dices className="w-5 h-5 mr-2" /> Let's Roll
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}