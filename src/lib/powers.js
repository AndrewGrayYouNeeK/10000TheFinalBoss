// NEON 10,000 — Powers System
// Players equip up to 3 powers before a match. Power fills as they roll/score.
// Each ability costs Power to fire. Sabotage abilities target the opponent and
// persist UNTIL THAT OPPONENT BUSTS (farkles).

export const MAX_POWER = 100;

// Power gain rules
export const POWER_RULES = {
  perRoll: 4,            // +4 power each roll
  perHotDice: 25,        // bonus when clearing all 6 dice
  perBankPer100: 1,      // +1 power per 100 points banked
  perFarkleSelf: 8,      // small consolation when YOU farkle
};

// ──────────────────────────────────────────────────────────────────────────────
// POWERS
//   kind: "self"  → buffs / advantages for the player using it
//   kind: "sabo"  → debuffs applied to the opposing player; last until they bust
//
// Sabotage debuffs are stored on the target player as `debuffs: [powerId, ...]`
// and are cleared on bust.
// ──────────────────────────────────────────────────────────────────────────────

export const POWERS = [
  // ─── 6 BASE / SELF POWERS ──────────────────────────────────────────────────
  {
    id: "reroll",
    name: "Reroll",
    kind: "self",
    cost: 30,
    icon: "🔄",
    color: "#00ffc8",
    description: "Reroll any single die in your current hand.",
    tagline: "One more shot.",
  },
  {
    id: "shield",
    name: "Shield",
    kind: "self",
    cost: 50,
    icon: "🛡️",
    color: "#00b8ff",
    description: "Survive the next Farkle without losing your turn score.",
    tagline: "Bust-proof, one time.",
  },
  {
    id: "double_or_nothing",
    name: "Double or Nothing",
    kind: "self",
    cost: 60,
    icon: "✨",
    color: "#a855f7",
    description: "Double your current turn score — but if you Farkle next roll, you lose double.",
    tagline: "High risk, higher reward.",
  },
  {
    id: "lucky_seven",
    name: "Lucky 7",
    kind: "self",
    cost: 40,
    icon: "🍀",
    color: "#22c55e",
    description: "Your next roll guarantees at least one scoring die.",
    tagline: "Skirt the skeert.",
  },
  {
    id: "hot_streak",
    name: "Hot Streak",
    kind: "self",
    cost: 45,
    icon: "🔥",
    color: "#ff6b00",
    description: "Score multiplier ×1.5 for the rest of this turn.",
    tagline: "Ride the lightning.",
  },
  {
    id: "siphon",
    name: "Siphon",
    kind: "self",
    cost: 55,
    icon: "🩸",
    color: "#ff2858",
    description: "Steal 10% of the leader's banked score (max 500).",
    tagline: "Take the throne.",
  },

  // ─── 4 SABOTAGE POWERS ──────────────────────────────────────────────────────
  {
    id: "freeze",
    name: "Freeze",
    kind: "sabo",
    cost: 50,
    icon: "❄️",
    color: "#00d4ff",
    description: "Drain opponent's Power bar to 0. Lasts until they bust.",
    tagline: "Ice in their veins.",
  },
  {
    id: "lockout",
    name: "Lockout",
    kind: "sabo",
    cost: 60,
    icon: "🔒",
    color: "#ffb800",
    description: "Opponent cannot use ANY powers. Lasts until they bust.",
    tagline: "No tools. Just dice.",
  },
  {
    id: "blackout",
    name: "Blackout",
    kind: "sabo",
    cost: 55,
    icon: "🌑",
    color: "#7f5af0",
    description: "Hide YOUR score & turn from the opponent. Lasts until they bust.",
    tagline: "They can't read what they can't see.",
  },
  {
    id: "static",
    name: "Static",
    kind: "sabo",
    cost: 55,
    icon: "📡",
    color: "#ff00aa",
    description: "Blind opponent's view of THEIR OWN score & turn. Lasts until they bust.",
    tagline: "Fly blind.",
  },
];

export function getPower(id) {
  return POWERS.find(p => p.id === id) || null;
}

export const BASE_POWERS = POWERS.filter(p => p.kind === "self");
export const SABO_POWERS = POWERS.filter(p => p.kind === "sabo");

// Calculate Power gain for an action.
export function powerForAction(action, value = 0) {
  switch (action) {
    case "roll":      return POWER_RULES.perRoll;
    case "hot_dice":  return POWER_RULES.perHotDice;
    case "bank":      return Math.floor(value / 100) * POWER_RULES.perBankPer100;
    case "farkle":    return POWER_RULES.perFarkleSelf;
    default:          return 0;
  }
}

export function canAfford(power, abilityId) {
  const p = getPower(abilityId);
  if (!p) return false;
  return power >= p.cost;
}