import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Coins, Sparkles } from "lucide-react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { toast } from "sonner";
import { DICE_SKINS, FELT_COLORS, SHOP_DICE_CATEGORIES, getSkinShopCategory, getSkin } from "@/lib/shopCatalog";
import { EXPERIMENTAL_DICE } from "@/lib/experimentalDice";
import { getDuplicateGroups } from "@/lib/duplicateSkins";
import { useCosmetics } from "@/hooks/useCosmetics";
import { isSkinUnlockedByTier as checkUnlocked, isSkinAchievementOnly, getLocalSkinPowerLevel } from "@/lib/progression";
import ShopItemCard from "@/components/shop/ShopItemCard";
import DicePreview from "@/components/shop/DicePreview";
import FeltPreview from "@/components/shop/FeltPreview";
import MysteryBoxesTab from "@/components/shop/MysteryBoxesTab";
import BuyCoinsDialog from "@/components/shop/BuyCoinsDialog";
import { isPreviewSkin } from "@/lib/previewSkins";
import { getHeldDiceStyle } from "@/lib/heldDiceStyles";
import { GHOST_SKIN_ID } from "@/lib/ghostDisguise";
import GhostDisguisePicker from "@/components/shop/GhostDisguisePicker";
import { SPRITE_LAB_SKIN_IDS } from "@/lib/spriteLab";
import { cn } from "@/lib/utils";

const showPreviewLab = true;


export default function Shop() {
  const {
    user,
    coins, xp, isLoading,
    ownedSkins, ownedBadges, ownedFelts,
    equippedSkinId, equippedBadgeId, equippedFeltId, heldDiceStyleId, ghostDisguiseId,
    buyItem, equipItem, setGhostDisguise, getSkinEffectivePrice, addCoins, isDevUnlockAll,
  } = useCosmetics();
  const heldStyle = getHeldDiceStyle(heldDiceStyleId);
  const [tab, setTab] = useState("skins");

  const handleBuy = (type, item) => {
    const res = buyItem(type, item);
    if (!res.ok) {
      if (res.reason === "insufficient") toast.error("Not enough coins!");
      else if (res.reason === "already_owned") toast.info("Already owned.");
      else if (res.reason === "achievement_only") toast.error("These dice are earned by playing — no shortcut.");
      else if (res.reason === "mystery_box_only") toast.error("Custom dice unlock permanently from Mystery Boxes.");
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
      <div
        className="sticky top-0 z-20 backdrop-blur bg-slate-950/90 border-b border-white/10 px-3 pb-3 flex items-center justify-between gap-2"
        style={PAGE_HEADER_SAFE_STYLE}
      >
        <BackButton to="/" label="Back" />
        <h1 className="text-lg font-black flex items-center gap-2 truncate">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" /> Shop
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild size="sm" variant="outline" className="h-8 text-[10px] border-emerald-500/40 text-emerald-200 px-2">
            <Link to="/felt-lab">Felt Lab</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-[10px] border-green-500/40 text-green-200 px-2">
            <Link to="/sprite-lab">Sprite Lab</Link>
          </Button>
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

        <div className="rounded-2xl border border-fuchsia-500/35 bg-gradient-to-br from-fuchsia-950/30 to-slate-900/50 p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">Soundwave Mic</p>
              <p className="text-sm text-slate-300">Presets, sensitivity, and mic device for audio-reactive dice</p>
              <p className="text-[10px] text-fuchsia-200/90 mt-1 font-semibold">Tap Soundwave dice in-game to enable the mic</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-fuchsia-400/50 text-fuchsia-200 shrink-0 hover:bg-fuchsia-500/10">
              <Link to="/soundwave-mic">Settings</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/30 to-slate-900/50 p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Held Dice Glow</p>
              <p className="text-sm text-slate-300">Saved to your profile — same glow on every dice skin</p>
              <p className="text-[10px] text-amber-200/90 mt-1 font-semibold">Current: {heldStyle.label}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-amber-400/50 text-amber-200 shrink-0 hover:bg-amber-500/10">
              <Link to="/held-style">Change</Link>
            </Button>
          </div>
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
            {equippedSkinId === GHOST_SKIN_ID && (
              <GhostDisguisePicker
                ownedSkins={ownedSkins}
                selectedId={ghostDisguiseId}
                onSelect={(id) => {
                  setGhostDisguise(id);
                  toast.success(`Ghost will disguise as ${getSkin(id)?.name || id}`);
                }}
              />
            )}
            {isDevUnlockAll && (
              <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-center">
                <p className="text-xs font-bold text-emerald-300">Dev unlock — all dice owned & equippable</p>
              </div>
            )}

            {showPreviewLab && (
            <div className="mb-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-indigo-950/30 p-4">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Preview Lab</p>
                  <p className="text-sm text-slate-300">12 custom effects + spectral clears</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button asChild size="sm" className="bg-cyan-600 hover:bg-cyan-500">
                    <Link to="/preview-dice">Custom Lab</Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center gap-3 py-2 flex-wrap">
                {["pf_radar_sweep", "pf_score_meter", "pf_tornado", "ghost", "cyber_neon"].map((id) => (
                  <DicePreview key={id} skinId={id} value={5} resolveGhost={false} />
                ))}
              </div>
            </div>
            )}

            {(() => {
              const dupes = getDuplicateGroups(DICE_SKINS);
              const PINNED_FIRST = ["pride", "ruby"];
              const PINNED_FIRST_BY_CAT = { power: ["ragnarok"] };
              const PINNED_LAST = ["gold", "dragon_scale", "circuit_board", "galaxy", "snow_globe", "blue_gel"];
              const firstRank = (id) => PINNED_FIRST.indexOf(id);
              const lastRank = (id) => PINNED_LAST.indexOf(id);

              return SHOP_DICE_CATEGORIES.map((cat) => {
              const catPinnedFirst = PINNED_FIRST_BY_CAT[cat.id] ?? [];
              const catFirstRank = (id) => catPinnedFirst.indexOf(id);
              const sortedSkins = [...DICE_SKINS]
                .filter((s) => !s.customDice && !s.preview && getSkinShopCategory(s.id) === cat.id)
                .sort((a, b) => {
                  const aCatFirst = catFirstRank(a.id);
                  const bCatFirst = catFirstRank(b.id);
                  if (aCatFirst !== -1 || bCatFirst !== -1) {
                    if (aCatFirst === -1) return 1;
                    if (bCatFirst === -1) return -1;
                    return aCatFirst - bCatFirst;
                  }
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

              if (!sortedSkins.length) return null;

              return (
                <section key={cat.id} className="mb-6">
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-black uppercase tracking-wider text-amber-200">{cat.label}</h2>
                      {SPRITE_LAB_SKIN_IDS.some((id) => getSkinShopCategory(id) === cat.id) && (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {SPRITE_LAB_SKIN_IDS.filter((id) => getSkinShopCategory(id) === cat.id).map((id) => (
                            <Button
                              key={id}
                              asChild
                              size="sm"
                              variant="outline"
                              className={cn(
                                "h-7 text-[10px] capitalize",
                                id === "matrix"
                                  ? "border-green-500/40 text-green-200"
                                  : id === "crystal_cut"
                                    ? "border-cyan-500/40 text-cyan-200"
                                    : id === "diamond_ruby"
                                      ? "border-red-500/40 text-red-200"
                                      : id === "ice"
                                        ? "border-sky-500/40 text-sky-200"
                                        : id === "snow_globe"
                                          ? "border-sky-500/40 text-sky-200"
                                          : id === "blue_gel"
                                            ? "border-cyan-500/40 text-cyan-200"
                                            : "border-orange-500/40 text-orange-200"
                              )}
                            >
                              <Link to={`/sprite-lab/${id}`}>
                                {id === "blue_gel" ? "Blue Gel · Marlin Joe" : `${getSkin(id)?.name || id} lab`}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">{cat.blurb}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {sortedSkins.map((skin) => {
                      const tierLocked = !isDevUnlockAll && !isPreviewSkin(skin.id) && !checkUnlocked(skin.id, xp);
                      const achievementOnly = !isDevUnlockAll && !isPreviewSkin(skin.id) && isSkinAchievementOnly(skin.id, xp);
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
                          preview={<DicePreview skinId={skin.id} resolveGhost={false} />}
                          duplicateTag={dupes[skin.id]}
                          tierLocked={tierLocked}
                          achievementOnly={achievementOnly}
                          effectivePrice={effectivePrice}
                          hideLockedAction={false}
                          skinLevel={
                            ownedSkins.includes(skin.id)
                              ? getLocalSkinPowerLevel(skin.id, user)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </section>
              );
            });
            })()}

            <section className="mb-6">
              <div className="mb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-cyan-200">Custom Dice</h2>
                <p className="text-[10px] text-slate-500">
                  Permanent once unlocked from Mystery Boxes — yours forever on this device
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EXPERIMENTAL_DICE.map((skin) => (
                  <ShopItemCard
                    key={skin.id}
                    item={{ ...skin, price: 0 }}
                    owned={ownedSkins.includes(skin.id)}
                    equipped={equippedSkinId === skin.id}
                    canAfford={false}
                    onBuy={() => handleBuy("skin", skin)}
                    onEquip={() => handleEquip("skin", skin)}
                    preview={<DicePreview skinId={skin.id} resolveGhost={false} />}
                    achievementOnly={!ownedSkins.includes(skin.id)}
                    hideLockedAction={ownedSkins.includes(skin.id)}
                    effectivePrice={0}
                    skinLevel={
                      ownedSkins.includes(skin.id)
                        ? getLocalSkinPowerLevel(skin.id, user)
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="felts" className="mt-4">
            <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/30 to-slate-900/50 p-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Felt Lab</p>
                  <p className="text-sm text-slate-300">
                    Fix stretched or blurry table felt — tune texture fit and sharpness
                  </p>
                  <p className="text-[10px] text-emerald-200/90 mt-1 font-semibold">
                    Saves to your profile — same look in shop and game
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="border-emerald-400/50 text-emerald-200 shrink-0 hover:bg-emerald-500/10">
                  <Link to="/felt-lab">Open Lab</Link>
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 text-center">
              Each card shows the real table surface — scroll to match names to looks.
            </p>
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
          Earn coins by banking points & winning games. Earn <b className="text-amber-300">XP</b> by playing to unlock shop dice tiers. <b className="text-cyan-300">Custom dice</b> unlock permanently from Mystery Boxes. Mythic dice are achievement-only.
        </p>
      </div>
    </div>
  );
}