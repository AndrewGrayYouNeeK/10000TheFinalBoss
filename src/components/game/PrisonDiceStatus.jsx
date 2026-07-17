import React from "react";
import { getPrisonProgress, PRISON_SIXES_TO_RELEASE } from "@/lib/prisonDice";

/** Shows prison lock status — caster progress or victim notice. */
export default function PrisonDiceStatus({ state, currentIndex }) {
  const progress = getPrisonProgress(state);
  if (!progress) return null;

  const isCaster = progress.casterIdx === currentIndex;
  const isVictim = progress.targetIdx === currentIndex;

  if (!isCaster && !isVictim) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px] leading-snug"
      style={{
        borderColor: isVictim ? "rgba(120,113,108,0.55)" : "rgba(168,85,247,0.45)",
        background: isVictim
          ? "linear-gradient(135deg, rgba(41,37,36,0.5), rgba(15,15,20,0.6))"
          : "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(41,37,36,0.35))",
        boxShadow: isVictim ? "0 0 12px rgba(120,113,108,0.2)" : "0 0 14px rgba(168,85,247,0.2)",
      }}
    >
      {isVictim ? (
        <>
          <span className="font-black uppercase tracking-wider text-stone-300">⛓️ Prison Dice</span>
          <span className="text-stone-400 ml-1">— your dice are locked behind bars until {progress.casterName} rolls 3 sixes.</span>
        </>
      ) : (
        <>
          <span className="font-black uppercase tracking-wider text-violet-200">⛓️ Prison Lock</span>
          <span className="text-slate-300 ml-1">
            — {progress.targetName}&apos;s dice are prison scraps. Roll{" "}
            <span className="font-bold text-white tabular-nums">
              {progress.remaining}
            </span>{" "}
            more six{progress.remaining === 1 ? "" : "es"} ({progress.sixCount}/{PRISON_SIXES_TO_RELEASE}).
          </span>
        </>
      )}
    </div>
  );
}
