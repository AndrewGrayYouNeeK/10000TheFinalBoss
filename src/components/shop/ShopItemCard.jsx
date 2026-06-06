import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Coins, Check, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Generic shop item card.
 *
 * Tier props (only used for skins):
 *  - tier: tier object the skin belongs to (e.g. {name:"Mythic", chip:"..."} )
 *  - tierLocked: boolean — user's XP tier is BELOW this skin's tier
 *  - effectivePrice: actual price to pay (item.price normally; multiplied if tierLocked)
 */
export default function ShopItemCard({
  item, owned, equipped, canAfford, onBuy, onEquip, preview, duplicateTag,
  tierLocked, effectivePrice, achievementOnly, hideLockedAction,
}) {
  const displayPrice = effectivePrice ?? item.price;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        "relative rounded-2xl p-4 border-2 overflow-hidden bg-slate-900",
        equipped ? "border-amber-400 shadow-lg shadow-amber-500/30" :
        tierLocked ? "border-fuchsia-800/60" : "border-slate-800"
      )}
    >
      {equipped && (
        <div className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
          EQUIPPED
        </div>
      )}
      <div className="flex items-center justify-center h-24 mb-3 relative">
        {preview}
        {tierLocked && !owned && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
            <Lock className="w-7 h-7 text-fuchsia-300" />
          </div>
        )}
      </div>

      <div className="text-white font-bold text-sm truncate">{item.name}</div>
      <div className="text-slate-400 text-xs mb-3 h-8 overflow-hidden">{item.description}</div>

      {owned ? (
        <Button
          size="sm"
          onClick={onEquip}
          disabled={equipped}
          className={cn(
            "w-full h-9",
            equipped
              ? "bg-slate-700 text-slate-300"
              : "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
          )}
        >
          <Check className="w-4 h-4 mr-1" /> {equipped ? "Equipped" : "Equip"}
        </Button>
      ) : achievementOnly ? (
        hideLockedAction ? null : (
          <Button
            size="sm"
            disabled
            className="w-full h-9 bg-slate-800 text-fuchsia-300 border border-fuchsia-700/50 disabled:opacity-100"
          >
            <Lock className="w-4 h-4 mr-1" /> Unlock by playing
          </Button>
        )
      ) : (
        <Button
          size="sm"
          onClick={onBuy}
          disabled={!canAfford}
          className={cn(
            "w-full h-9",
            tierLocked && canAfford
              ? "bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white"
              : canAfford
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              : "bg-slate-800 text-slate-500"
          )}
        >
          {tierLocked ? <Zap className="w-4 h-4 mr-1" /> : canAfford ? <Coins className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
          {tierLocked ? `Shortcut ${displayPrice.toLocaleString()}` : displayPrice}
        </Button>
      )}
    </motion.div>
  );
}