import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadProfile, updateProfile } from "@/lib/localProfile";
import { getSkin, getBadge, getFelt } from "@/lib/shopCatalog";
import {
  getTierForXp,
  getNextTier,
  getSkinEffectivePrice,
  isSkinUnlockedByTier,
  isSkinAchievementOnly,
} from "@/lib/progression";
import {
  getPreviewCoins,
  getPreviewOwnedFelts,
  getPreviewOwnedSkins,
  isPreviewTierUnlocked,
} from "@/lib/devPreview";

export function useCosmetics() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => loadProfile(),
    staleTime: Infinity,
  });

  const updateMe = useMutation({
    mutationFn: (data) => Promise.resolve(updateProfile(data)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
    },
  });

  const coins = getPreviewCoins(user?.coins ?? 0);
  const xp = user?.xp ?? 0;
  const currentTier = getTierForXp(xp);
  const nextTier = getNextTier(xp);
  const introSeen = user?.intro_seen ?? false;
  const ownedSkins = getPreviewOwnedSkins(user?.owned_skins ?? ["classic_white"]);
  const ownedBadges = user?.owned_badges ?? [];
  const ownedFelts = getPreviewOwnedFelts(user?.owned_felts ?? ["classic_green"]);
  const equippedSkinId = user?.equipped_skin || "classic_white";
  const equippedBadgeId = user?.equipped_badge || "";
  const equippedFeltId = user?.equipped_felt || "classic_green";

  const equippedSkin = getSkin(equippedSkinId);
  const equippedBadge = getBadge(equippedBadgeId);
  const equippedFelt = getFelt(equippedFeltId);

  const addCoins = (delta) => {
    if (!user || !delta) return;
    updateMe.mutate({ coins: Math.max(0, (user.coins ?? 0) + delta) });
  };

  const addXp = (delta) => {
    if (!user || !delta) return;
    updateMe.mutate({ xp: Math.max(0, (user.xp ?? 0) + delta) });
  };

  const recordGameResult = ({ won, xpGain }) => {
    if (!user) return;
    updateMe.mutate({
      xp: Math.max(0, (user.xp ?? 0) + (xpGain || 0)),
      games_finished: (user.games_finished ?? 0) + 1,
      wins: (user.wins ?? 0) + (won ? 1 : 0),
    });
  };

  const markIntroSeen = () => {
    if (!user || user.intro_seen) return;
    updateMe.mutate({ intro_seen: true });
  };

  const buyItem = (type, item) => {
    if (!user) return { ok: false, reason: "not_loaded" };

    if (type === "skin" && isSkinAchievementOnly(item.id, xp)) {
      return { ok: false, reason: "achievement_only" };
    }

    if (type === "badge") {
      return { ok: false, reason: "achievement_only" };
    }

    const effectivePrice = type === "skin" ? getSkinEffectivePrice(item, xp) : item.price;
    if (coins < effectivePrice) return { ok: false, reason: "insufficient" };

    const key = type === "skin" ? "owned_skins" : type === "felt" ? "owned_felts" : "owned_badges";
    const current = user[key] || [];
    if (current.includes(item.id)) return { ok: false, reason: "already_owned" };

    updateMe.mutate({
      [key]: [...current, item.id],
      coins: coins - effectivePrice,
    });
    return { ok: true, pricePaid: effectivePrice };
  };

  const equipItem = (type, itemId) => {
    const key = type === "skin" ? "equipped_skin" : type === "felt" ? "equipped_felt" : "equipped_badge";
    updateMe.mutate({ [key]: itemId });
  };

  const grantReward = ({ skinId, badgeId }) => {
    if (!user) return { skinGranted: false, badgeGranted: false };
    const skins = user.owned_skins || ["classic_white"];
    const badges = user.owned_badges || [];
    const patch = {};
    let skinGranted = false;
    let badgeGranted = false;
    if (skinId && !skins.includes(skinId)) {
      patch.owned_skins = [...skins, skinId];
      skinGranted = true;
    }
    if (badgeId && !badges.includes(badgeId)) {
      patch.owned_badges = [...badges, badgeId];
      badgeGranted = true;
    }
    if (Object.keys(patch).length > 0) updateMe.mutate(patch);
    return { skinGranted, badgeGranted };
  };

  return {
    user,
    isLoading,
    coins, xp, currentTier, nextTier, introSeen,
    ownedSkins, ownedBadges, ownedFelts,
    equippedSkinId, equippedBadgeId, equippedFeltId,
    equippedSkin, equippedBadge, equippedFelt,
    addCoins, addXp, markIntroSeen, recordGameResult,
    buyItem,
    equipItem,
    grantReward,
    getSkinEffectivePrice: (skin) => getSkinEffectivePrice(skin, xp),
    isSkinUnlockedByTier: (skinId) => isPreviewTierUnlocked() || isSkinUnlockedByTier(skinId, xp),
    isSkinAchievementOnly: (skinId) => isSkinAchievementOnly(skinId, xp),
  };
}
