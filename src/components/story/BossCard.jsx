import React from "react";
import { motion } from "framer-motion";
import { Lock, Check, Crown, Coins, Sparkles } from "lucide-react";
import { getSkin } from "@/lib/shopCatalog";
import BossAvatar from "./BossAvatar";

export default function BossCard({ boss, unlocked, defeated, onClick, index }) {
  const skinName = boss.rewards.skin ? getSkin(boss.rewards.skin)?.name : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={unlocked ? { scale: 1.02 } : {}}
      whileTap={unlocked ? { scale: 0.98 } : {}}
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
      className="w-full text-left rounded-2xl border p-4 transition-all relative overflow-hidden"
      style={{
        background: unlocked ? "rgba(8,2,20,0.65)" : "rgba(8,2,20,0.35)",
        borderColor: unlocked ? "rgba(0,255,200,0.35)" : "rgba(100,100,120,0.25)",
        boxShadow: unlocked
          ? `0 0 18px rgba(0,255,200,0.15), inset 0 0 0 1px rgba(255,255,255,0.04)`
          : "none",
        opacity: unlocked ? 1 : 0.55,
        cursor: unlocked ? "pointer" : "not-allowed",
      }}
    >
      {/* Boss number stripe */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${boss.color}`}
      />

      <div className="flex items-start gap-3 pl-2">
        {/* Avatar */}
        <BossAvatar boss={boss} sizeClass="w-14 h-14" emojiClass="text-3xl" />

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Fight {index + 1}
            </div>
            {boss.isBoss && (
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 flex items-center gap-0.5">
                <Crown className="w-3 h-3" /> Boss
              </span>
            )}
            {defeated && (
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Cleared
              </span>
            )}
          </div>
          <div className="text-base font-black text-white truncate">{boss.name}</div>
          <div className="text-xs text-slate-400 italic mb-2">{boss.title}</div>

          {boss.gimmick && (
            <div className="text-xs text-fuchsia-300 mb-2">
              <span className="font-bold">⚡ {boss.gimmick.name}:</span>{" "}
              <span className="text-slate-300">{boss.gimmick.description}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Coins className="w-3 h-3" /> {boss.rewards.coins}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              ✦ {boss.rewards.xp} XP
            </span>
            {skinName && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3 h-3" /> {skinName}
              </span>
            )}
          </div>
        </div>

        {/* Lock icon */}
        {!unlocked && (
          <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-1" />
        )}
      </div>
    </motion.button>
  );
}