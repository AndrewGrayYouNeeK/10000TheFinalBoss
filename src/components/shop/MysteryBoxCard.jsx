import React from "react";
import { motion } from "framer-motion";
import { Coins, Lock, Sparkles, Gift } from "lucide-react";

/**
 * Premium dark mystery-box card. Three visually distinct tiers.
 */
export default function MysteryBoxCard({ box, canAfford, onBuy, opening }) {
  const { name, price, tagline, description, accent, accent2, glow, rarity, featured } = box;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="relative rounded-2xl overflow-hidden border"
      style={{
        background:
          "linear-gradient(160deg, rgba(8,8,14,0.95) 0%, rgba(14,14,22,0.95) 60%, rgba(6,6,12,0.98) 100%)",
        borderColor: `${accent}55`,
        boxShadow: `0 0 30px ${glow}, inset 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      {/* Ambient glow orb */}
      <motion.div
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.025) 2px, rgba(255,255,255,0.025) 3px)",
        }}
      />

      <div className="relative z-10 p-5 flex flex-col items-center">
        {/* Rarity chip */}
        <div
          className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-2 py-0.5 rounded-full border"
          style={{
            color: accent,
            borderColor: `${accent}55`,
            background: `${accent}12`,
            textShadow: `0 0 8px ${accent}80`,
          }}
        >
          {rarity}
        </div>

        {/* Box visual */}
        <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
          {/* Pulsing aura */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)`,
              filter: "blur(10px)",
            }}
          />
          {/* Box body */}
          <motion.div
            animate={opening ? { rotate: [0, -6, 6, -6, 6, 0], y: [0, -4, 0, -4, 0] } : { y: [0, -3, 0] }}
            transition={
              opening
                ? { duration: 0.6, repeat: Infinity }
                : { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }
            className="relative w-24 h-24 rounded-xl border-2 flex items-center justify-center"
            style={{
              background: `linear-gradient(145deg, ${accent2} 0%, #08080c 100%)`,
              borderColor: accent,
              boxShadow: `0 0 24px ${glow}, inset 0 2px 0 ${accent}40, inset 0 -8px 16px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Top seam */}
            <div
              className="absolute top-7 left-0 right-0 h-px"
              style={{ background: `${accent}aa`, boxShadow: `0 0 6px ${accent}` }}
            />
            {/* Lock / sparkle */}
            <div className="relative">
              <Sparkles className="w-9 h-9" style={{ color: accent, filter: `drop-shadow(0 0 8px ${accent})` }} />
            </div>
            {/* Bow / ribbon vertical */}
            <div
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2"
              style={{ background: `linear-gradient(180deg, ${accent}, ${accent2})`, opacity: 0.5 }}
            />
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2"
              style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})`, opacity: 0.5 }}
            />
          </motion.div>
        </div>

        {/* Name + tagline */}
        <h3
          className="text-lg font-black text-center tracking-wide"
          style={{ color: "#fff", textShadow: `0 0 10px ${accent}80` }}
        >
          {name}
        </h3>
        <p className="text-[11px] text-slate-400 text-center mb-2 italic">{tagline}</p>
        <p className="text-xs text-slate-300/80 text-center mb-4 leading-relaxed min-h-[2.5rem]">
          {description}
        </p>

        {/* Buy button */}
        <button
          onClick={onBuy}
          disabled={!canAfford || opening}
          className="w-full h-12 rounded-lg font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: canAfford
              ? `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`
              : "rgba(30,30,40,0.8)",
            color: canAfford ? "#fff" : "#64748b",
            boxShadow: canAfford
              ? `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
              : "none",
            border: canAfford ? `1px solid ${accent}aa` : "1px solid rgba(100,116,139,0.3)",
          }}
        >
          {!canAfford ? (
            <>
              <Lock className="w-4 h-4" /> Need {price.toLocaleString()}
            </>
          ) : opening ? (
            <>
              <Gift className="w-4 h-4 animate-pulse" /> Opening…
            </>
          ) : (
            <>
              <Coins className="w-4 h-4" /> {price.toLocaleString()} · Buy
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}