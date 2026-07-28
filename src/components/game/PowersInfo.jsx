import React from "react";
import { BASE_POWERS, SABO_POWERS, POWER_MODE_HOT_DICE } from "@/lib/powers";

const HOT_DICE_ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th"][POWER_MODE_HOT_DICE] ?? `${POWER_MODE_HOT_DICE}th`;

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
        Every dice skin carries <b>one secret power</b>. Hit your <b>{HOT_DICE_ORDINAL} Hot Dice</b> in a single turn to earn a{" "}
        <b>power charge</b>. Hold the charge across turns — <b>banking and busting keep it</b>. Fire anytime on your turn.{" "}
        <b>Only firing the power spends the charge.</b>
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
        footer="Sabotage debuffs last for the opponent's turn. Fire then bust and your sabotage effects are lost."
      />

      <div
        className="mt-4 rounded-lg border p-3"
        style={{
          background: isShop ? "rgba(120,0,50,0.12)" : "rgba(15,23,42,0.6)",
          borderColor: isShop ? "rgba(186,230,253,0.35)" : "rgba(255,255,255,0.08)",
        }}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-violet-300">
          👻 Ghost — Special
        </div>
        <p className={`text-[11px] leading-snug ${isShop ? "text-white/80" : "text-slate-300"}`}>
          Ghost has <b>no fixed power</b>. It automatically steals whatever skin your opponent is{" "}
          <b>pretending to be</b> — you copy their power, not your own. Pick a strong disguise and you
          might hand them a strong power if they&apos;re Ghost too. You never know if that innocent-looking
          skin is real… or Ghost.
        </p>
      </div>
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