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
  hidePowerName = false,
}) {
  if (!skinPower) return null;

  const accent = skinPower.kind === "sabo" ? "#ff6b9d" : "#ffb347";
  const borderColor = skinPower.kind === "sabo" ? "rgba(255,0,170,0.65)" : "rgba(255,140,0,0.6)";

  return (
    <AnimatePresence>
      {powerMode && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="rounded-lg border px-2 py-1.5 space-y-1"
          style={{
            borderColor,
            background:
              skinPower.kind === "sabo"
                ? "linear-gradient(90deg, rgba(255,0,170,0.22), rgba(120,0,50,0.14))"
                : "linear-gradient(90deg, rgba(255,120,0,0.2), rgba(168,85,247,0.12))",
            boxShadow: `0 0 16px ${skinPower.kind === "sabo" ? "rgba(255,0,170,0.35)" : "rgba(255,140,0,0.35)"}, inset 0 0 0 1px rgba(255,255,255,0.08)`,
          }}
        >
          <div className="flex items-center justify-between gap-2 min-h-0">
            <span
              className="text-[8px] font-black uppercase tracking-[0.22em] shrink-0"
              style={{ color: accent, textShadow: `0 0 8px ${accent}` }}
            >
              {isGhostMimic ? "👻 Mimic" : "⚡ Power"}
            </span>
            <PowerSlot
              power={skinPower}
              currentPower={power}
              used={used}
              locked={locked}
              onFire={disabled ? undefined : onFire}
            />
          </div>
          <PowerBar power={power} label="CHARGE" frozen={frozen} compact />
          <p className="text-[8px] text-slate-300 leading-tight truncate">
            {hidePowerName ? (
              <>Secret sabotage ready — fire before they bank.</>
            ) : (
              <>
                <span className="font-bold text-white">{skinPower.name}</span>
                <span className="text-slate-500 mx-1">·</span>
                {isGhostMimic
                  ? `Steals ${mimicFromName ? `${mimicFromName}'s` : "opponent's"} ${mimicSkinLabel || "skin"} power`
                  : skinPower.tagline}
              </>
            )}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MAX_POWER, POWER_MODE_HOT_DICE } from "@/lib/powers";
