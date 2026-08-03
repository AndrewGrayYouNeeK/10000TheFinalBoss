import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isBustWord } from "@/lib/gameLogic";

// Full-screen bust slam — YEEEET! / SKRRRT! etc.
// Overshoots stay visible longer so the exact-target explanation can be read.
export default function BigPopup({
  word,
  detail,
  variant = "danger",
  open,
  onClose,
  duration,
  burstKey,
}) {
  const isBust = variant === "bust" || isBustWord(word);
  const isSlowBust = isBust && Boolean(detail);
  const dismissMs = duration ?? (isSlowBust ? 3200 : isBust ? 820 : 1400);
  const animationSeconds = dismissMs / 1000;

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose && onClose(), dismissMs);
    return () => clearTimeout(t);
  }, [open, onClose, dismissMs]);

  const gradient =
    variant === "success"
      ? "from-emerald-400 via-yellow-300 to-amber-500"
      : "from-rose-400 via-red-500 to-orange-400";

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key={burstKey ?? word}
          className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{
              // Bust: lighter peak + fade out with the shout (was stuck at ~0.85 until unmount)
              opacity: isBust ? [0, 0.42, 0.28, 0] : 0.7,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: isBust ? 0.75 : 0.2,
              times: isBust ? [0, 0.16, 0.5, 1] : undefined,
              ease: "easeOut",
            }}
          />

          <motion.div
            className="relative w-full max-w-[100vw] px-3 sm:px-4 flex flex-col items-center justify-center"
            initial={{ scale: 0.15, opacity: 0, rotate: -12 }}
            animate={{
              scale: isBust
                ? isSlowBust
                  ? [0.15, 1.15, 1, 1, 1]
                  : [0.15, 1.45, 1.05, 1.05]
                : [0.15, 1.45, 1.08],
              opacity: isBust
                ? isSlowBust
                  ? [0, 1, 1, 1, 0]
                  : [0, 1, 1, 0]
                : [0, 1, 1],
              rotate: isBust
                ? isSlowBust
                  ? [-12, 3, 0, 0, 0]
                  : [-12, 4, 0, 0]
                : [-12, 6, -2, 0],
            }}
            exit={{ scale: 1.5, opacity: 0, rotate: 10 }}
            transition={{
              duration: isBust ? (isSlowBust ? animationSeconds : 0.78) : 0.55,
              ease: "easeOut",
              times: isBust
                ? isSlowBust
                  ? [0, 0.1, 0.3, 0.86, 1]
                  : [0, 0.26, 0.68, 1]
                : undefined,
            }}
          >
            <div
              className={`w-full text-center font-black uppercase leading-[0.82] tracking-tighter bg-gradient-to-br ${gradient} bg-clip-text text-transparent select-none`}
              style={{
                fontSize: isBust ? "clamp(3.5rem, 28vw, 14rem)" : "clamp(2rem, 22vw, 10rem)",
                WebkitTextStroke: isBust ? "3px rgba(0,0,0,0.45)" : "2px rgba(0,0,0,0.3)",
                filter: isBust
                  ? "drop-shadow(0 0 40px rgba(255,60,60,0.85)) drop-shadow(0 8px 0 rgba(0,0,0,0.55))"
                  : "drop-shadow(0 0 24px rgba(255,80,80,0.6))",
                transform: isBust ? "scaleX(1.06)" : undefined,
              }}
            >
              {word}
            </div>

            {isSlowBust && (
              <div className="mt-5 max-w-[min(92vw,42rem)] rounded-xl border border-rose-300/50 bg-black/65 px-4 py-3 text-center text-base sm:text-xl font-bold normal-case tracking-normal leading-snug text-white shadow-[0_0_24px_rgba(255,40,90,0.35)]">
                {detail}
              </div>
            )}

            {isBust && (
              <>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0, scaleX: 0.2 }}
                  animate={{ opacity: [0, 0.55, 0], scaleX: [0.2, 1.15, 1.35] }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="w-[92vw] h-[0.35rem] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                </motion.div>
                <motion.div
                  className="absolute -inset-4 rounded-full border-[6px] border-rose-400/30"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: [0.4, 1.55], opacity: [0.7, 0] }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
