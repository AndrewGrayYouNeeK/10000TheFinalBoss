import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PowerBar from "@/components/game/PowerBar";
import PowerSlot from "@/components/game/PowerSlot";

/**
 * Shown while the active player holds a power charge (earned on 1st Hot Dice — testing).
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
  /** Toned-down panel for pass-and-play — active player still sees charge, less neon for bystanders. */
  subtle = false,
}) {
  if (!skinPower) return null;

  const accent = skinPower.kind === "sabo" ? "#ff6b9d" : "#ffb347";
  const borderColor = skinPower.kind === "sabo"
    ? (subtle ? "rgba(255,0,170,0.28)" : "rgba(255,0,170,0.65)")
    : (subtle ? "rgba(255,140,0,0.28)" : "rgba(255,140,0,0.6)");
  const glow = subtle
    ? "0 0 6px rgba(255,140,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)"
    : `0 0 16px ${skinPower.kind === "sabo" ? "rgba(255,0,170,0.35)" : "rgba(255,140,0,0.35)"}, inset 0 0 0 1px rgba(255,255,255,0.08)`;

  return (
    <AnimatePresence>
      {powerMode && (
        <motion.div
          initial={{ opacity: 0, y: subtle ? 2 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: subtle ? 2 : 6 }}
          className={subtle ? "rounded-md border px-1.5 py-1 space-y-0.5" : "rounded-lg border px-2 py-1.5 space-y-1"}
          style={{
            borderColor,
            background:
              skinPower.kind === "sabo"
                ? (subtle
                  ? "linear-gradient(90deg, rgba(255,0,170,0.08), rgba(120,0,50,0.06))"
                  : "linear-gradient(90deg, rgba(255,0,170,0.22), rgba(120,0,50,0.14))")
                : (subtle
                  ? "linear-gradient(90deg, rgba(255,120,0,0.08), rgba(168,85,247,0.05))"
                  : "linear-gradient(90deg, rgba(255,120,0,0.2), rgba(168,85,247,0.12))"),
            boxShadow: glow,
          }}
        >
          <div className="flex items-center justify-between gap-2 min-h-0">
            <span
              className={subtle ? "text-[7px] font-bold uppercase tracking-[0.18em] shrink-0 text-slate-400" : "text-[8px] font-black uppercase tracking-[0.22em] shrink-0"}
              style={subtle ? {} : { color: accent, textShadow: `0 0 8px ${accent}` }}
            >
              {isGhostMimic ? "👻 Mimic" : subtle ? "⚡ Charged" : "⚡ Power"}
            </span>
            <PowerSlot
              power={skinPower}
              currentPower={power}
              used={used}
              locked={locked}
              onFire={disabled ? undefined : onFire}
            />
          </div>
          {!subtle && <PowerBar power={power} label="CHARGE" frozen={frozen} compact />}
          <p className={`${subtle ? "text-[7px] text-slate-500" : "text-[8px] text-slate-300"} leading-tight truncate`}>
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
