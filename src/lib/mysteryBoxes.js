// Mystery Boxes — premium gambling-style loot boxes.
// Each box contains a weighted reward pool of skins, felts, and coin prizes.
//
// Reward types:
//   - { type: "skin", pool: "common"|"rare"|"legendary", weight }
//   - { type: "felt", pool: "standard"|"premium", weight }
//   - { type: "coins", amount, weight }
//
// When a player owns every item in a rolled pool, fallback = coin payout.

export const MYSTERY_BOXES = [
  {
    id: "box_bronze",
    name: "Starter Vault",
    price: 500,
    tagline: "Entry-level mystery",
    description:
      "A starter cache. Mostly coins, with a chance at a common skin or standard felt.",
    accent: "#c87a3a",
    accent2: "#7a3d18",
    glow: "rgba(200,122,58,0.55)",
    rarity: "Common",
    odds: [
      { type: "coins", amount: 100, weight: 35, label: "100 Coins" },
      { type: "coins", amount: 250, weight: 25, label: "250 Coins" },
      { type: "coins", amount: 500, weight: 15, label: "500 Coins" },
      { type: "skin", pool: "common", weight: 15, label: "Common Skin" },
      { type: "felt", pool: "standard", weight: 10, label: "Standard Felt" },
    ],
  },
  {
    id: "box_royal",
    name: "Novice Crate",
    price: 1000,
    tagline: "Where the action gets real",
    description:
      "Bigger payouts. Better skins. Premium felts in the mix. The sweet spot.",
    accent: "#22d3ee",
    accent2: "#0e7490",
    glow: "rgba(34,211,238,0.55)",
    rarity: "Rare",
    featured: true,
    odds: [
      { type: "coins", amount: 250, weight: 25, label: "250 Coins" },
      { type: "coins", amount: 750, weight: 20, label: "750 Coins" },
      { type: "coins", amount: 1500, weight: 10, label: "1,500 Coins" },
      { type: "skin", pool: "common", weight: 15, label: "Common Skin" },
      { type: "skin", pool: "rare", weight: 15, label: "Rare Skin" },
      { type: "felt", pool: "standard", weight: 8, label: "Standard Felt" },
      { type: "felt", pool: "premium", weight: 7, label: "Premium Felt" },
    ],
  },
  {
    id: "box_obsidian",
    name: "Royal Reliquary",
    price: 2000,
    tagline: "For the truly bold",
    description:
      "Legendary skins. Premium felts. Jackpot coin prizes. The highest of stakes.",
    accent: "#a855f7",
    accent2: "#4c1d95",
    glow: "rgba(168,85,247,0.55)",
    rarity: "Legendary",
    odds: [
      { type: "coins", amount: 500, weight: 18, label: "500 Coins" },
      { type: "coins", amount: 2000, weight: 15, label: "2,000 Coins" },
      { type: "coins", amount: 5000, weight: 7, label: "5,000 Coins (Jackpot)" },
      { type: "skin", pool: "rare", weight: 25, label: "Rare Skin" },
      { type: "skin", pool: "legendary", weight: 15, label: "Legendary Skin" },
      { type: "felt", pool: "premium", weight: 20, label: "Premium Felt" },
    ],
  },
];

// Price thresholds that segment skin/felt pools by rarity.
const SKIN_POOL_RULES = {
  common:    (s) => (s.price ?? 0) > 0 && (s.price ?? 0) <= 400,
  rare:      (s) => (s.price ?? 0) > 400 && (s.price ?? 0) <= 900,
  legendary: (s) => (s.price ?? 0) > 900,
};

const FELT_POOL_RULES = {
  standard: (f) => !f.premium && (f.price ?? 0) > 0,
  premium:  (f) => !!f.premium,
};

export function getSkinPool(allSkins, pool) {
  const rule = SKIN_POOL_RULES[pool];
  return rule ? allSkins.filter(rule) : [];
}

export function getFeltPool(allFelts, pool) {
  const rule = FELT_POOL_RULES[pool];
  return rule ? allFelts.filter(rule) : [];
}

export function getMysteryBox(id) {
  return MYSTERY_BOXES.find((b) => b.id === id) || null;
}

// Weighted random pick from a box's `odds` array.
export function rollOdds(odds) {
  const total = odds.reduce((s, o) => s + (o.weight || 0), 0);
  let r = Math.random() * total;
  for (const o of odds) {
    r -= o.weight || 0;
    if (r <= 0) return o;
  }
  return odds[odds.length - 1];
}

// Pick a random element from an array.
export function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}