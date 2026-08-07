import { PRODUCTION_DICE_SKINS, FELT_COLORS } from "@/lib/shopCatalog";
import { MYSTERY_BOXES } from "@/lib/mysteryBoxes";
import { isSkinAchievementOnly } from "@/lib/progression";
import priceMap from "@/lib/webShopPriceMap.json";

/**
 * USD web shop pricing. GQ in catalog ≈ cents (100 GQ = $1).
 * Canonical GQ map: src/lib/webShopPriceMap.json (keep public/web-shop-prices.json in sync for Stripe).
 */

export function gqToCents(gq) {
  if (gq == null || gq <= 0) return null;
  return Math.max(99, Math.round(Number(gq)));
}

export function formatUsd(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function lookupGqPrice(type, id) {
  const bucket = priceMap[type];
  if (!bucket) return null;
  const gq = bucket[id];
  return gq == null ? null : gq;
}

/** @returns {{ id: string, type: 'skin'|'felt'|'box', name: string, description: string, priceCents: number, priceLabel: string, accent?: string, spriteUrl?: string, rarity?: string }[]} */
export function getWebShopCatalog() {
  const skins = PRODUCTION_DICE_SKINS.filter((s) => lookupGqPrice("skin", s.id) != null).map(
    (s) => {
      const priceCents = gqToCents(lookupGqPrice("skin", s.id));
      return {
        id: s.id,
        type: "skin",
        name: s.name,
        description: s.description || "",
        priceCents,
        priceLabel: formatUsd(priceCents),
        spriteUrl: s.spriteUrl,
        achievementOnly: isSkinAchievementOnly(s.id),
        powerDice: !!s.powerDice,
      };
    }
  );

  const felts = FELT_COLORS.filter((f) => lookupGqPrice("felt", f.id) != null).map((f) => {
    const priceCents = gqToCents(lookupGqPrice("felt", f.id));
    return {
      id: f.id,
      type: "felt",
      name: f.name,
      description: f.description || "",
      priceCents,
      priceLabel: formatUsd(priceCents),
      accent: f.mid || f.inner,
    };
  });

  const boxes = MYSTERY_BOXES.filter((b) => lookupGqPrice("box", b.id) != null).map((b) => {
    const priceCents = gqToCents(lookupGqPrice("box", b.id));
    return {
      id: b.id,
      type: "box",
      name: b.name,
      description: b.description || b.tagline || "",
      priceCents,
      priceLabel: formatUsd(priceCents),
      accent: b.accent,
      rarity: b.rarity,
    };
  });

  return [...skins, ...felts, ...boxes];
}

export function getWebShopItem(type, id) {
  return getWebShopCatalog().find((i) => i.type === type && i.id === id) || null;
}
