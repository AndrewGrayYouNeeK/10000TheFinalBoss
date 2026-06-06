import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DICE_SKINS, FELT_COLORS, getFelt } from "@/lib/shopCatalog";
import { getDuplicateGroups } from "@/lib/duplicateSkins";
import { useCosmetics } from "@/hooks/useCosmetics";
import { isSkinUnlockedByTier as checkUnlocked, isSkinAchievementOnly } from "@/lib/progression";
import ShopItemCard from "@/components/shop/ShopItemCard";
import DicePreview from "@/components/shop/DicePreview";
import FeltPreview from "@/components/shop/FeltPreview";
import MysteryBoxesTab from "@/components/shop/MysteryBoxesTab";
import BuyCoinsDialog from "@/components/shop/BuyCoinsDialog";


export default function Shop() {
  const {
    user,
    coins, xp, isLoading,
    ownedSkins, ownedBadges, ownedFelts,
    equippedSkinId, equippedBadgeId, equippedFeltId,
    buyItem, equipItem, getSkinEffectivePrice, addCoins,
  } = useCosmetics();
  const [tab, setTab] = useState("skins");

  const handleBuy = (type, item) => {
    const res = buyItem(type, item);
    if (!res.ok) {
      if (res.reason === "insufficient") toast.error("Not enough coins!");
      else if (res.reason === "already_owned") toast.info("Already owned.");
      else if (res.reason === "achievement_only") toast.error("These dice are earned by playing — no shortcut.");
      return;
    }
    toast.success(`Unlocked ${item.name}!`);
  };

  const handleEquip = (type, item) => {
    equipItem(type, item.id);
    toast.success(`Equipped ${item.name}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-950 to-black text-white">
      <div className="sticky top-0 z-10 backdrop-blur bg-slate-950/80 border-b border-white/10 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Shop
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-black tabular-nums text-amber-300">
              {isLoading ? "…" : coins.toLocaleString()}
            </span>
          </div>
          <BuyCoinsDialog onPurchase={(amount) => addCoins(amount)} />
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* XP display */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3 mb-4 flex items-center justify-center">
          <span className="text-xs text-slate-400 font-semibold">
            <span className="text-cyan-300 font-black tabular-nums">{xp.toLocaleString()}</span> XP
          </span>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full bg-slate-900 border border-slate-800">
            <TabsTrigger value="skins">Skins</TabsTrigger>
            <TabsTrigger value="felts">Felts</TabsTrigger>
            <TabsTrigger
              value="mystery"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              Mystery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skins" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const dupes = getDuplicateGroups(DICE_SKINS);
                // Pinned to the top (in order)
                const PINNED_FIRST = ["pride", "ruby"];
                // Pinned to the bottom (in order — snow_globe & blue_gel stay dead last)
                const PINNED_LAST = ["gold", "lava", "dragon_scale", "circuit_board", "galaxy", "snow_globe", "blue_gel"];
                const firstRank = (id) => PINNED_FIRST.indexOf(id);
                const lastRank = (id) => PINNED_LAST.indexOf(id);
                const sortedSkins = [...DICE_SKINS].sort((a, b) => {
                  const aFirst = firstRank(a.id);
                  const bFirst = firstRank(b.id);
                  if (aFirst !== -1 || bFirst !== -1) {
                    if (aFirst === -1) return 1;
                    if (bFirst === -1) return -1;
                    return aFirst - bFirst;
                  }
                  const aLast = lastRank(a.id);
                  const bLast = lastRank(b.id);
                  if (aLast !== -1 || bLast !== -1) {
                    if (aLast === -1) return -1;
                    if (bLast === -1) return 1;
                    return aLast - bLast;
                  }
                  return getSkinEffectivePrice(a) - getSkinEffectivePrice(b);
                });
                return sortedSkins.map(skin => {
                  const tierLocked = !checkUnlocked(skin.id, xp);
                  const achievementOnly = isSkinAchievementOnly(skin.id, xp);
                  const effectivePrice = getSkinEffectivePrice(skin);
                  return (
                    <ShopItemCard
                      key={skin.id}
                      item={skin}
                      owned={ownedSkins.includes(skin.id)}
                      equipped={equippedSkinId === skin.id}
                      canAfford={coins >= effectivePrice}
                      onBuy={() => handleBuy("skin", skin)}
                      onEquip={() => handleEquip("skin", skin)}
                      preview={<DicePreview skinId={skin.id} />}
                      duplicateTag={dupes[skin.id]}
                      tierLocked={tierLocked}
                      achievementOnly={achievementOnly}
                      effectivePrice={effectivePrice}
                    />
                  );
                });
              })()}
            </div>
          </TabsContent>

          <TabsContent value="felts" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {FELT_COLORS.map(felt => (
                <ShopItemCard
                  key={felt.id}
                  item={felt}
                  owned={ownedFelts.includes(felt.id)}
                  equipped={equippedFeltId === felt.id}
                  canAfford={coins >= felt.price}
                  onBuy={() => handleBuy("felt", felt)}
                  onEquip={() => handleEquip("felt", felt)}
                  preview={<FeltPreview felt={felt} />}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mystery" className="mt-4">
            <MysteryBoxesTab user={user} coins={coins} />
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-slate-500 mt-6 pb-10">
          Earn coins by banking points & winning games. Earn <b className="text-amber-300">XP</b> by finishing games, winning, and hitting milestones — level up to unlock rarer dice. Locked dice can be bought at a 10× shortcut price; the rarest dice can only be earned by playing.
        </p>
      </div>
    </div>
  );
}