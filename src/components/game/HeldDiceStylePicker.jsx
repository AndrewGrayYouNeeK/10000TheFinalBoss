import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HELD_DICE_STYLES,
  HELD_STYLE_CATEGORY,
} from "@/lib/heldDiceStyles";

/**
 * Compact held-dice glow picker for use during gameplay.
 */
export default function HeldDiceStylePicker({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const favorites = HELD_DICE_STYLES.filter(
    (s) => s.category === HELD_STYLE_CATEGORY.FAVORITE
  );
  const portfolio = HELD_DICE_STYLES.filter(
    (s) => s.category === HELD_STYLE_CATEGORY.PORTFOLIO
  );
  const shown = expanded ? [...favorites, ...portfolio] : favorites;

  return (
    <div
      className="rounded-xl border px-3 py-2"
      style={{
        borderColor: "rgba(251,191,36,0.28)",
        background: "rgba(3,4,10,0.55)",
        boxShadow: "inset 0 0 0 1px rgba(251,191,36,0.08)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
          Held glow
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200"
          >
            {expanded ? "Show less" : "More styles"}
          </button>
          <Link
            to="/held-style"
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            Preview
          </Link>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto">
        {shown.map((style) => {
          const selected = value === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                selected
                  ? "bg-amber-500/25 border-amber-400 text-amber-100"
                  : "bg-white/5 border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200"
              }`}
            >
              {style.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
