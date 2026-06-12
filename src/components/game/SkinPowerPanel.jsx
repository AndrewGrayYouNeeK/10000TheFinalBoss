import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PowerBar from "@/components/game/PowerBar";
import PowerSlot from "@/components/game/PowerSlot";

/**
 * Shown while the active player holds a power charge (earned on 3rd Hot Dice).
 */
export default function SkinPowerPanel({
  power,
  skinPower,
  powerMode = false,
  used = false,
  locked = false,
  disabled = false,
  frozen = false,
  onFire,
  isGhostMimic = false,
  mimicSkinLabel = null,
  mimicFromName = null,
}) {
  if (!skinPower) return null;

  return (
    <AnimatePresence>
      {powerMode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="rounded-xl border px-3 py-2 space-y-2"
          style={{
            borderColor: skinPower.kind === "sabo" ? "rgba(255,0,170,0.5)" : "rgba(255,107,0,0.45)",
            background:
              skinPower.kind === "sabo"
                ? "linear-gradient(135deg, rgba(255,0,170,0.14), rgba(120,0,50,0.1))"
                : "linear-gradient(135deg, rgba(255,107,0,0.12), rgba(168,85,247,0.08))",
            boxShadow: "0 0 20px rgba(255,107,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-[0.25em]"
              style={{ color: skinPower.kind === "sabo" ? "#ff6b9d" : "#ffb347", textShadow: "0 0 8px rgba(255,107,0,0.7)" }}
            >
              {isGhostMimic ? "👻 Ghost Mimic" : "⚡ Power Charge Ready"}
            </span>
            <span className="text-[9px] text-slate-400 text-right leading-snug max-w-[52%]">
              {isGhostMimic
                ? `Steals ${mimicFromName ? `${mimicFromName}'s` : "opponent's"} ${mimicSkinLabel || "skin"} power`
                : "Bank to keep charge — bust before firing and you lose it"}
            </span>
          </div>
          {isGhostMimic && mimicSkinLabel && (
            <p className="text-[10px] text-violet-200/90 leading-snug">
              Copying <span className="font-bold text-white">{mimicSkinLabel}</span>
              {skinPower ? (
                <>
                  {" "}
                  → <span className="font-bold text-white">{skinPower.name}</span>
                </>
              ) : null}
            </p>
          )}
          <PowerBar power={power} label="SKIN POWER" frozen={frozen} />
          <div className="grid grid-cols-[1fr_88px] gap-2 items-stretch">
            <p className="text-[10px] text-slate-300 leading-snug flex items-center">
              <span className="font-bold text-white">{skinPower.name}</span>
              <span className="text-slate-500 mx-1">—</span>
              {skinPower.tagline}
            </p>
            <PowerSlot
              power={skinPower}
              currentPower={power}
              used={used}
              locked={locked}
              onFire={disabled ? undefined : onFire}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MAX_POWER, POWER_MODE_HOT_DICE } from "@/lib/powers";
