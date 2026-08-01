import React from "react";
import { getSkin } from "@/lib/shopCatalog";
import { getSetupDisguiseOptions } from "@/lib/ghostDisguise";

/** Pick which skin Ghost pretends to be (saved to profile). */
export default function GhostDisguisePicker({ ownedSkins, selectedId, onSelect }) {
  const options = getSetupDisguiseOptions(ownedSkins);
  if (!options.length) return null;

  return (
    <div
      className="rounded-2xl border border-violet-400/40 p-3 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(88,28,135,0.2), rgba(15,23,42,0.5))",
        boxShadow: "0 0 16px rgba(139,92,246,0.15)",
      }}
    >
      <p className="text-xs font-black uppercase tracking-wider text-violet-300 mb-1">👻 Ghost Disguise</p>
      <p className="text-[11px] text-slate-300 mb-2 leading-snug">
        Choose which skin&apos;s <b>power</b> you borrow. Your dice stay Ghost — disguise is identity
        for powers and private rolls, not tray look.
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((id) => {
          const skin = getSkin(id);
          const active = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold border transition-colors"
              style={
                active
                  ? {
                      borderColor: "#a78bfa",
                      background: "rgba(139,92,246,0.25)",
                      color: "#fff",
                      boxShadow: "0 0 10px rgba(139,92,246,0.35)",
                    }
                  : {
                      borderColor: "rgba(148,163,184,0.35)",
                      background: "rgba(15,23,42,0.5)",
                      color: "#cbd5e1",
                    }
              }
            >
              {skin?.name || id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
