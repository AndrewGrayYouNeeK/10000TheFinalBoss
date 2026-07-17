import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPlasmaCuttableDice,
  getPlasmaCutTargets,
  pipsCut,
} from "@/lib/plasmaCut";

/**
 * Pick an active die + target face for Plasma Cut power.
 */
export default function PlasmaCutModal({ open, dice, onConfirm, onCancel }) {
  const cuttable = useMemo(() => getPlasmaCuttableDice({ dice }), [dice]);
  const [selectedId, setSelectedId] = useState(null);

  const selectedDie = cuttable.find((d) => d.id === selectedId) ?? null;
  const targets = selectedDie ? getPlasmaCutTargets(selectedDie.value) : [];

  if (!open) return null;

  const handleClose = () => {
    setSelectedId(null);
    onCancel?.();
  };

  const handleConfirm = (newValue) => {
    if (selectedId == null) return;
    onConfirm?.(selectedId, newValue);
    setSelectedId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close plasma cut"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plasma-cut-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative w-full max-w-sm rounded-2xl border-2 p-4 space-y-4"
            style={{
              borderColor: "#a855f7",
              background: "linear-gradient(160deg, rgba(15,8,32,0.98), rgba(5,10,24,0.98))",
              boxShadow: "0 0 32px rgba(168,85,247,0.45), inset 0 0 0 1px rgba(56,189,248,0.15)",
            }}
          >
            <div>
              <div
                id="plasma-cut-title"
                className="text-sm font-black uppercase tracking-[0.2em]"
                style={{ color: "#c084fc", textShadow: "0 0 10px rgba(168,85,247,0.8)" }}
              >
                ✂️ Plasma Cut
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Pick one active die, then choose how many pips to cut off. Fix a combo — or rescue a bust.
              </p>
            </div>

            {cuttable.length === 0 ? (
              <p className="text-sm text-rose-300 text-center py-4">No dice can be cut right now.</p>
            ) : (
              <>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-2">
                    1 · Pick die
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {cuttable.map((d) => {
                      const active = selectedId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedId(d.id)}
                          className="rounded-xl border-2 py-3 font-black text-2xl tabular-nums transition-all"
                          style={{
                            borderColor: active ? "#38bdf8" : "rgba(168,85,247,0.45)",
                            background: active
                              ? "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(56,189,248,0.2))"
                              : "rgba(15,23,42,0.7)",
                            boxShadow: active ? "0 0 16px rgba(56,189,248,0.5)" : "none",
                            color: "#fff",
                          }}
                        >
                          {d.value}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDie && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-2">
                      2 · Cut to
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {targets.map((target) => {
                        const cut = pipsCut(selectedDie.value, target);
                        return (
                          <button
                            key={target}
                            type="button"
                            onClick={() => handleConfirm(target)}
                            className="rounded-xl border-2 py-2 px-1 text-center transition-all hover:scale-[1.03]"
                            style={{
                              borderColor: "rgba(56,189,248,0.55)",
                              background: "linear-gradient(135deg, rgba(168,85,247,0.22), rgba(8,15,30,0.9))",
                              boxShadow: "0 0 10px rgba(168,85,247,0.25)",
                            }}
                          >
                            <div className="text-xl font-black text-white tabular-nums">
                              {selectedDie.value}
                              <span className="text-violet-300 mx-0.5">→</span>
                              {target}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider text-cyan-200/80 mt-0.5">
                              cut {cut} pip{cut === 1 ? "" : "s"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 border border-white/10 hover:border-white/25"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
