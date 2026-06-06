import React from "react";
import { BASE_POWERS, SABO_POWERS, MAX_POWER } from "@/lib/powers";

// Shared powers reference shown in Rules + Shop so players know what each does.
// `variant="rules"` uses the dark-slate panel style; `variant="shop"` uses the
// neon/cyberpunk style.
export default function PowersInfo({ variant = "rules" }) {
  const isShop = variant === "shop";

  const panel = isShop
    ? "rounded-2xl border-2 p-4"
    : "bg-slate-900 rounded-2xl p-5 border border-slate-800";

  const panelStyle = isShop
    ? {
        background: "linear-gradient(160deg, rgba(5,0,16,0.8), rgba(16,0,34,0.8))",
        borderColor: "#00ffc8",
        boxShadow: "0 0 18px rgba(0,255,200,0.25)",
      }
    : {};

  const headColor = isShop ? "#00ffc8" : "#fbbf24";

  return (
    <div className={panel} style={panelStyle}>
      <h2
        className="text-lg font-bold mb-1 flex items-center gap-2"
        style={{
          color: headColor,
          textShadow: isShop ? "0 0 8px #00ffc8" : "none",
        }}
      >
        ⚡ Powers
      </h2>
      <p className={`text-sm mb-3 ${isShop ? "text-cyan-100/80" : "text-slate-300"}`}>
        Every dice skin comes with <b>one Power</b>. The skin you equip <i>is</i> your power — no picking, no loadouts.
        Roll, bank, and Hot Dice to fill your <b>Power bar</b> (max {MAX_POWER}). Spend it to fire your ability.
      </p>

      <Group
        title="Self — Buffs"
        color={isShop ? "#00ffc8" : "#34d399"}
        powers={BASE_POWERS}
        isShop={isShop}
      />
      <Group
        title="Sabotage — vs Opponent"
        color={isShop ? "#ff00aa" : "#fb7185"}
        powers={SABO_POWERS}
        isShop={isShop}
        footer="Sabotage debuffs last until the opponent busts."
      />
    </div>
  );
}

function Group({ title, color, powers, isShop, footer }) {
  return (
    <div className="mt-3">
      <div
        className="text-[10px] font-black uppercase tracking-[0.3em] mb-2"
        style={{ color, textShadow: isShop ? `0 0 6px ${color}` : "none" }}
      >
        ▸ {title}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {powers.map(p => (
          <div
            key={p.id}
            className="rounded-lg border p-2 flex items-start gap-2"
            style={{
              background: isShop
                ? `linear-gradient(135deg, ${p.color}11, ${p.color}22)`
                : "rgba(15,23,42,0.6)",
              borderColor: isShop ? `${p.color}66` : "rgba(255,255,255,0.08)",
              boxShadow: isShop ? `0 0 10px ${p.color}33` : "none",
            }}
          >
            <span className="text-xl leading-none mt-0.5">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-black uppercase tracking-wider"
                  style={{ color: isShop ? "#fff" : "#fff" }}
                >
                  {p.name}
                </span>
                <span
                  className="text-[10px] font-black tabular-nums"
                  style={{ color: p.color }}
                >
                  {p.cost}⚡
                </span>
              </div>
              <p className={`text-[11px] leading-snug mt-0.5 ${isShop ? "text-white/75" : "text-slate-300"}`}>
                {p.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {footer && (
        <p className={`text-[11px] mt-2 italic ${isShop ? "text-pink-200/80" : "text-rose-300/90"}`}>
          {footer}
        </p>
      )}
    </div>
  );
}