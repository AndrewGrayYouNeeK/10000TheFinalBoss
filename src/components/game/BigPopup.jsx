import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A huge full-screen pop-up, e.g. "YEEET!" or "SKEERT!" after a bust.
// Auto-dismisses after `duration` ms (default 1400).
export default function BigPopup({ word, variant = "danger", open, onClose, duration = 1400 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [open, onClose, duration]);

  const gradient =
    variant === "success"
      ? "from-emerald-400 via-yellow-300 to-amber-500"
      : "from-rose-500 via-red-500 to-orange-500";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
            animate={{
              scale: [0.3, 1.3, 1],
              rotate: [-15, 8, -4, 0],
              opacity: 1,
            }}
            exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative"
          >
            <div
              className={`text-[22vw] sm:text-[16vw] leading-none font-black tracking-tighter bg-gradient-to-br ${gradient} bg-clip-text text-transparent drop-shadow-2xl`}
              style={{ WebkitTextStroke: "2px rgba(0,0,0,0.3)" }}
            >
              {word}
            </div>
            {/* emphasis lines */}
            <motion.div
              className="absolute -inset-8 rounded-full border-4 border-white/20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}