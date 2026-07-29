import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EyeOff, Smartphone } from "lucide-react";

/**
 * Full-screen pass-and-play shield — shown between turns until the active player confirms.
 */
export default function PassPlayHandoffOverlay({ open, playerName, onReady }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            background: "rgba(2,4,12,0.94)",
            backdropFilter: "blur(14px)",
          }}
        >
          <motion.div
            className="w-full max-w-sm text-center space-y-5"
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <div
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border-2"
              style={{
                borderColor: "rgba(255,0,170,0.55)",
                background: "linear-gradient(135deg, rgba(255,0,170,0.15), rgba(0,255,200,0.12))",
                boxShadow: "0 0 24px rgba(255,0,170,0.35), 0 0 24px rgba(0,255,200,0.2)",
              }}
            >
              <EyeOff className="w-8 h-8 text-amber-200" style={{ filter: "drop-shadow(0 0 8px rgba(255,200,100,0.8))" }} />
            </div>

            <div className="space-y-2">
              <p
                className="text-[11px] font-black uppercase tracking-[0.35em]"
                style={{ color: "#ffb347", textShadow: "0 0 10px rgba(255,140,0,0.6)" }}
              >
                Private turn
              </p>
              <h2
                className="text-2xl sm:text-3xl font-black uppercase leading-tight"
                style={{ color: "#fff", textShadow: "0 0 16px rgba(0,255,200,0.5)" }}
              >
                Pass device to
                <span className="block mt-1" style={{ color: "#7effc4" }}>
                  {playerName}
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed px-2">
                Everyone else — look away. Only {playerName} should tap when ready.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={onReady}
              className="w-full h-14 text-base font-black uppercase tracking-wider border-2 text-white"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,200,0.28), rgba(255,0,170,0.22))",
                borderColor: "#00ffc8",
                boxShadow: "0 0 24px rgba(0,255,200,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
                textShadow: "0 0 8px rgba(0,255,200,0.8)",
              }}
            >
              <Smartphone className="w-5 h-5 mr-2 shrink-0" />
              I&apos;m {playerName} — ready
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
