import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import DicePreview from "@/components/shop/DicePreview";
import FeltPreview from "@/components/shop/FeltPreview";

/**
 * Full-screen reveal modal shown after opening a mystery box.
 * Phases:
 *  - "shaking"  : box rattles building suspense
 *  - "exploding": flash + particles
 *  - "revealed" : show the prize
 */
export default function MysteryBoxReveal({ open, box, reward, onClose }) {
  const [phase, setPhase] = useState("shaking");

  useEffect(() => {
    if (!open) return;
    setPhase("shaking");
    const t1 = setTimeout(() => setPhase("exploding"), 1400);
    const t2 = setTimeout(() => setPhase("revealed"), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]);

  if (!open || !box) return null;

  const accent = box.accent;
  const glow = box.glow;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{
          background: "radial-gradient(ellipse at center, rgba(20,10,30,0.95) 0%, rgba(0,0,0,0.98) 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Radial light burst on explode */}
        {phase !== "shaking" && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 6, opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute w-64 h-64 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, filter: "blur(20px)" }}
          />
        )}

        {/* Particles on explode */}
        {phase !== "shaking" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 28 }).map((_, i) => {
              const angle = (i / 28) * Math.PI * 2;
              const dist = 200 + Math.random() * 220;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                />
              );
            })}
          </div>
        )}

        <div className="relative z-10 max-w-sm w-full">
          {/* Shaking box */}
          {phase === "shaking" && (
            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 8, -6, 6, -4, 4, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.4 }}
              className="mx-auto w-40 h-40 rounded-2xl border-2 flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${box.accent2} 0%, #06060c 100%)`,
                borderColor: accent,
                boxShadow: `0 0 40px ${glow}, inset 0 2px 0 ${accent}55`,
              }}
            >
              <Sparkles className="w-16 h-16" style={{ color: accent, filter: `drop-shadow(0 0 14px ${accent})` }} />
            </motion.div>
          )}

          {/* Revealed prize */}
          <AnimatePresence>
            {phase === "revealed" && reward && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="rounded-2xl border p-6 text-center"
                style={{
                  background: "linear-gradient(160deg, rgba(14,14,22,0.98), rgba(6,6,12,0.98))",
                  borderColor: `${accent}88`,
                  boxShadow: `0 0 50px ${glow}`,
                }}
              >
                <div
                  className="text-[10px] font-black uppercase tracking-[0.3em] mb-2"
                  style={{ color: accent, textShadow: `0 0 8px ${accent}` }}
                >
                  {box.name} Reveals
                </div>

                <div className="my-4 flex justify-center">
                  {reward.type === "coins" && (
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Coins className="w-16 h-16" style={{ color: "#fbbf24", filter: "drop-shadow(0 0 12px #fbbf24)" }} />
                      <div className="text-3xl font-black tabular-nums text-amber-300" style={{ textShadow: "0 0 12px #fbbf24" }}>
                        +{reward.amount.toLocaleString()}
                      </div>
                      <div className="text-xs uppercase tracking-widest text-amber-400/80">Coins</div>
                    </motion.div>
                  )}
                  {reward.type === "skin" && reward.item && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="scale-125"><DicePreview skinId={reward.item.id} /></div>
                      <div className="text-base font-black text-white mt-2">{reward.item.name}</div>
                      <div className="text-xs uppercase tracking-widest" style={{ color: accent }}>Dice Skin</div>
                    </div>
                  )}
                  {reward.type === "felt" && reward.item && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="scale-125"><FeltPreview felt={reward.item} /></div>
                      <div className="text-base font-black text-white mt-2">{reward.item.name}</div>
                      <div className="text-xs uppercase tracking-widest" style={{ color: accent }}>Table Felt</div>
                    </div>
                  )}
                </div>

                {reward.duplicate && (
                  <div className="text-xs text-slate-400 italic mb-3">
                    You already own this — converted to +{reward.refund} coins.
                  </div>
                )}

                <Button
                  onClick={onClose}
                  className="w-full h-11 font-black uppercase tracking-wider"
                  style={{
                    background: `linear-gradient(135deg, ${accent} 0%, ${box.accent2} 100%)`,
                    color: "#fff",
                    boxShadow: `0 0 20px ${glow}`,
                  }}
                >
                  <Check className="w-4 h-4 mr-1" /> Collect
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Close X (always available) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}