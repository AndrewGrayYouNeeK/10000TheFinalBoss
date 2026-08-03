// YouNeeK 10,000 — Powers System
// Each equipped dice skin carries one secret power.
//
// CHARGE:  Hit your 1st Hot Dice in a single turn → earn one power charge. (TESTING: was 3rd)
// HOLD:    Keep the charge across banks, busts, and turns — power-mode dice stay on until fire.
// FIRE:    Activate anytime on your turn while holding a charge (consumes the charge).
// BUST:    Bust without firing → charge is kept; power-mode returns on your next turn.
//          Fire then bust on the same turn → charge already spent; sabotage effects you cast are lost.
// DURATION: Sabotage debuffs on the opponent last for their turn; your charge lasts until fire.

/** Hot dice clears required in one turn to earn a power charge (TESTING: 1; production default was 3). */
export const POWER_MODE_HOT_DICE = 1;

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
//   kind: "sabo"  → debuffs on the opponent for the rest of their turn
//
// Sabotage debuffs live on the target as `debuffs: [{ id, from }, ...]`.
// Cleared when the target's turn ends (bank or bust), or immediately if the
// caster busts after firing.
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
    description:
      "Double your turn scores (×2). Bank the doubled haul — but if you Farkle or overshoot, your banked score resets to 0. At skin level 10+, cast this curse on your opponent instead.",
    tagline: "Double the haul — or wipe to zero.",
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
    id: "matrix_glitch",
    name: "Matrix Glitch",
    kind: "self",
    cost: 40,
    icon: "⚡",
    color: "#00ff9f",
    description:
      "Arm glitch for this turn — if the roll would bust, rewrite up to N dice into scoring faces (stronger at higher skin level).",
    tagline: "Reality is negotiable.",
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
  {
    id: "plasma_cut",
    name: "Plasma Cut",
    kind: "self",
    cost: 35,
    icon: "✂️",
    color: "#a855f7",
    description:
      "On your turn, pick one active die and cut pips off — lower its face to fix a bad roll (6→4/2, 5→4/3/1). Can rescue a bust.",
    tagline: "Cut the problem out.",
  },

  // ─── 4 SABOTAGE POWERS ──────────────────────────────────────────────────────
  {
    id: "freeze",
    name: "Freeze",
    kind: "sabo",
    cost: 50,
    icon: "❄️",
    color: "#00d4ff",
    description: "Drain opponent's Power bar to 0 for the rest of their turn.",
    tagline: "Ice in their veins.",
  },
  {
    id: "freeze_score",
    name: "Score Freeze",
    kind: "sabo",
    cost: 50,
    icon: "🧊",
    color: "#7dd3fc",
    description:
      "Lock the opponent's banked score for the rest of their turn — they can still roll, but banking cannot change their score.",
    tagline: "Glacier lock.",
  },
  {
    id: "frosty_ice",
    name: "Frozen Ice",
    kind: "sabo",
    cost: 50,
    icon: "❄️",
    color: "#7dd3fc",
    description:
      "Story mode — freeze the enemy's dice, skip their turn, and bank freely until you bust.",
    tagline: "Ice them out.",
  },
  {
    id: "lockout",
    name: "Lockout",
    kind: "sabo",
    cost: 60,
    icon: "🔒",
    color: "#ffb800",
    description: "Opponent cannot use ANY powers for the rest of their turn.",
    tagline: "No tools. Just dice.",
  },
  {
    id: "blackout",
    name: "Blackout",
    kind: "sabo",
    cost: 55,
    icon: "🌑",
    color: "#7f5af0",
    description: "Hide YOUR score & turn from the opponent for the rest of their turn.",
    tagline: "They can't read what they can't see.",
  },
  {
    id: "static",
    name: "Static",
    kind: "sabo",
    cost: 55,
    icon: "📡",
    color: "#ff00aa",
    description: "Blind opponent's view of THEIR OWN score & turn for the rest of their turn.",
    tagline: "Fly blind.",
  },
  {
    id: "xray",
    name: "X-Ray",
    kind: "sabo",
    cost: 45,
    icon: "🔬",
    color: "#38bdf8",
    description: "Scan opponents — reveals Ghost vs real skin, secret powers, hidden dice traits, and active debuffs.",
    tagline: "Nothing stays hidden.",
  },
  {
    id: "overtime",
    name: "Overtime",
    kind: "sabo",
    cost: 50,
    icon: "⏱️",
    color: "#f97316",
    description: "Wipe every player's banked score to 0 — everyone must bank 1,000 again to get on the board.",
    tagline: "Back to zero.",
  },
  {
    id: "prison_dice",
    name: "Prison Dice",
    kind: "sabo",
    cost: 55,
    icon: "⛓️",
    color: "#78716c",
    description:
      "Transform opponent's dice into prison scraps for their turns. Lock breaks when you roll three 6s.",
    tagline: "Lock them down.",
  },
  {
    id: "shark_bite",
    name: "Shark Bite",
    kind: "sabo",
    cost: 50,
    icon: "🦈",
    color: "#0ea5e9",
    description:
      "Shark Bite: mark the next player — when they bank, a shark eats that round's points. Feeding Frenzy: if they use aquarium dice, sharks feast instantly and wipe their score to 0.",
    tagline: "Hunt. Mark. Bite.",
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