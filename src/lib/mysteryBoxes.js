// Mystery Boxes — custom portfolio dice only (see experimentalDice.js).
// Production sprite dice are earned by playing — XP tiers, story bosses, achievements.
//
// Reward types:
//   - { type: "skin", pool: "common"|"rare"|"legendary", weight }
//   - { type: "felt", pool: "standard"|"premium", weight }
//   - { type: "coins", amount, weight }
//
// When a player owns every item in a rolled pool, fallback = coin payout.

import { EXPERIMENTAL_DICE } from "./experimentalDice";

export const MYSTERY_BOXES = [
  {
    id: "box_bronze",
    name: "Starter Vault",
    price: 500,
    tagline: "Entry-level mystery",
    description:
      "A starter cache. Mostly coins, with a chance at a spectral clear or basic custom effect die.",
    accent: "#c87a3a",
    accent2: "#7a3d18",
    glow: "rgba(200,122,58,0.55)",
    rarity: "Common",
    odds: [
      { type: "coins", amount: 100, weight: 35, label: "100 Coins" },
      { type: "coins", amount: 250, weight: 25, label: "250 Coins" },
      { type: "coins", amount: 500, weight: 15, label: "500 Coins" },
      { type: "skin", pool: "common", weight: 15, label: "Common Custom Die" },
      { type: "felt", pool: "standard", weight: 10, label: "Standard Felt" },
    ],
  },
  {
    id: "box_royal",
    name: "Novice Crate",
    price: 1000,
    tagline: "Where the action gets real",
    description:
      "Better custom effects. Premium felts in the mix. No shop sprite dice — custom lab only.",
    accent: "#22d3ee",
    accent2: "#0e7490",
    glow: "rgba(34,211,238,0.55)",
    rarity: "Rare",
    featured: true,
    odds: [
      { type: "coins", amount: 250, weight: 25, label: "250 Coins" },
      { type: "coins", amount: 750, weight: 20, label: "750 Coins" },
      { type: "coins", amount: 1500, weight: 10, label: "1,500 Coins" },
      { type: "skin", pool: "common", weight: 12, label: "Common Custom Die" },
      { type: "skin", pool: "rare", weight: 18, label: "Rare Custom Die" },
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
      "Legendary custom effects — Matrix Storm, Core Burst, Bug Zapper, and more.",
    accent: "#a855f7",
    accent2: "#4c1d95",
    glow: "rgba(168,85,247,0.55)",
    rarity: "Legendary",
    odds: [
      { type: "coins", amount: 500, weight: 18, label: "500 Coins" },
      { type: "coins", amount: 2000, weight: 15, label: "2,000 Coins" },
      { type: "coins", amount: 5000, weight: 7, label: "5,000 Coins (Jackpot)" },
      { type: "skin", pool: "rare", weight: 22, label: "Rare Custom Die" },
      { type: "skin", pool: "legendary", weight: 18, label: "Legendary Custom Die" },
      { type: "felt", pool: "premium", weight: 20, label: "Premium Felt" },
    ],
  },
];

/** Custom lab dice only — never production shop sprites. */
const MYSTERY_SKIN_IDS = {
  common: [
    "ghost",
    "clear_void",
    "ethereal_mist",
    "zen",
    "pf_rainfall",
    "pf_tornado",
    "pf_binary_storm",
  ],
  rare: [
    "pf_radar_sweep",
    "pf_score_meter",
    "pf_radar_blips",
    "pf_soundwave",
    "pf_plasma_cut",
    "pf_xray",
  ],
  legendary: [
    "pf_matrix_storm",
    "pf_core_burst",
    "pf_bug_zapper",
  ],
};

const FELT_POOL_RULES = {
  standard: (f) => !f.premium && (f.price ?? 0) > 0,
  premium: (f) => !!f.premium,
};

export function getSkinPool(_allSkins, pool) {
  const ids = MYSTERY_SKIN_IDS[pool] || [];
  return EXPERIMENTAL_DICE.filter((s) => ids.includes(s.id));
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
