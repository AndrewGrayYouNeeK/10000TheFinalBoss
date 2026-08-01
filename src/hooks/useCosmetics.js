import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadProfile, updateProfile } from "@/lib/localProfile";
import { getSkin, getBadge, getFelt } from "@/lib/shopCatalog";
import {
  getTierForXp,
  getNextTier,
  getSkinEffectivePrice,
  isSkinUnlockedByTier,
  isSkinAchievementOnly,
  addSkinPlayXp,
} from "@/lib/progression";
import { isPreviewSkin, isCustomDiceSkin, withPreviewOwned } from "@/lib/previewSkins";
import { isDevUnlockAll } from "@/lib/devUnlock";
import { DEFAULT_HELD_DICE_STYLE, isValidHeldDiceStyle } from "@/lib/heldDiceStyles";
import { SESSION_PLAYER_SKINS_KEY } from "@/lib/ghostDisguise";

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

  const coins = user?.coins ?? 0;
  const xp = user?.xp ?? 0;
  const currentTier = getTierForXp(xp);
  const nextTier = getNextTier(xp);
  const introSeen = user?.intro_seen ?? false;
  const ownedSkins = withPreviewOwned(user?.owned_skins ?? ["classic_white"]);
  const ownedBadges = user?.owned_badges ?? [];
  const ownedFelts = user?.owned_felts ?? ["classic_green"];
  const equippedSkinId = user?.equipped_skin || "classic_white";
  const ghostDisguiseId = user?.ghost_disguise || null;
  const equippedBadgeId = user?.equipped_badge || "";
  const equippedFeltId = user?.equipped_felt || "classic_green";
  const heldDiceStyleId = isValidHeldDiceStyle(user?.held_dice_style)
    ? user.held_dice_style
    : DEFAULT_HELD_DICE_STYLE;
  const sfxMuted = user?.sfx_muted === true;
  const opponentSfxMuted = user?.opponent_sfx_muted === true;

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
    const skinId = user.equipped_skin || "classic_white";
    const skinXpGain = 1 + (won ? 1 : 0);
    const skinPatch = addSkinPlayXp(user, skinId, skinXpGain);
    updateMe.mutate({
      xp: Math.max(0, (user.xp ?? 0) + (xpGain || 0)),
      games_finished: (user.games_finished ?? 0) + 1,
      wins: (user.wins ?? 0) + (won ? 1 : 0),
      ...skinPatch,
    });
  };

  const markIntroSeen = () => {
    if (!user || user.intro_seen) return;
    updateMe.mutate({ intro_seen: true });
  };

  const buyItem = (type, item) => {
    if (!user) return { ok: false, reason: "not_loaded" };

    if (type === "skin" && (isPreviewSkin(item.id) || isCustomDiceSkin(item.id)) && !isDevUnlockAll()) {
      return { ok: false, reason: "mystery_box_only" };
    }

    if (type === "skin" && isSkinAchievementOnly(item.id, xp) && !isDevUnlockAll()) {
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
    const patch = { [key]: itemId };
    if (type === "skin" && itemId === "ghost" && !user?.ghost_disguise) {
      const owned = user?.owned_skins ?? ["classic_white"];
      const pool = owned.filter((id) => id && id !== "ghost");
      if (pool.length) patch.ghost_disguise = pool[0];
    }
    if (type === "skin" && typeof sessionStorage !== "undefined") {
      try {
        const raw = sessionStorage.getItem(SESSION_PLAYER_SKINS_KEY);
        if (raw) {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids) && ids.length > 0) {
            ids[0] = itemId;
            sessionStorage.setItem(SESSION_PLAYER_SKINS_KEY, JSON.stringify(ids));
          }
        }
      } catch {
        /* ignore corrupt session skin picks */
      }
    }
    updateMe.mutate(patch);
  };

  const setGhostDisguise = (skinId) => {
    if (!skinId || skinId === "ghost") return;
    updateMe.mutate({ ghost_disguise: skinId });
  };

  const setHeldDiceStyle = (styleId) => {
    if (!isValidHeldDiceStyle(styleId)) return;
    updateMe.mutate({ held_dice_style: styleId });
  };

  const setSfxMuted = (muted) => {
    updateMe.mutate({ sfx_muted: !!muted });
  };

  const setOpponentSfxMuted = (muted) => {
    updateMe.mutate({ opponent_sfx_muted: !!muted });
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
    equippedSkinId, equippedBadgeId, equippedFeltId, heldDiceStyleId, ghostDisguiseId,
    sfxMuted, opponentSfxMuted,
    equippedSkin, equippedBadge, equippedFelt,
    addCoins, addXp, markIntroSeen, recordGameResult,
    buyItem,
    equipItem,
    setGhostDisguise,
    setHeldDiceStyle,
    setSfxMuted,
    setOpponentSfxMuted,
    grantReward,
    updateMe,
    isDevUnlockAll: isDevUnlockAll(),
    getSkinEffectivePrice: (skin) => (isDevUnlockAll() ? 0 : getSkinEffectivePrice(skin, xp)),
    isSkinUnlockedByTier: (skinId) => isDevUnlockAll() || isSkinUnlockedByTier(skinId, xp),
    isSkinAchievementOnly: (skinId) => !isDevUnlockAll() && isSkinAchievementOnly(skinId, xp),
  };
}
