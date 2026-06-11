import { getPower, BASE_POWERS, SABO_POWERS } from "@/lib/powers";
import { EXPERIMENTAL_DICE_IDS } from "@/lib/experimentalDice";

/**
 * SKIN → SECRET POWER MAP
 * ─────────────────────
 * Edit SKIN_POWER_MAP to assign any power id from src/lib/powers.js to a dice skin.
 *
 * Self powers:  reroll | shield | double_or_nothing | lucky_seven | hot_streak | siphon
 * Sabo powers:  freeze | lockout | blackout | static
 *
 * Example:
 *   ghost: "blackout",   // hides your score from the opponent until they bust
 *   matrix: "static",    // blinds opponent's own score until they bust
 *
 * Skins not listed here get a stable random power from BASE_POWERS.
 */
const SKIN_POWER_MAP = {
  // ── Self buffs ──
  lava: "hot_streak",
  tesla: "lucky_seven",
  matrix: "lucky_seven",
  pf_matrix_storm: "lucky_seven",
  pf_binary_storm: "lucky_seven",
  galaxy: "double_or_nothing",
  dragon_scale: "shield",
  crystal_cut: "siphon",
  gold: "hot_streak",
  toxic_plasma_v2: "double_or_nothing",
  pf_bug_zapper: "reroll",
  pf_core_burst: "double_or_nothing",
  pf_soundwave: "lucky_seven",
  snow_globe: "shield",
  blue_gel: "reroll",
  amber_wasp: "siphon",
  circuit_board: "reroll",
  neon_grid: "hot_streak",

  // ── Sabotage (hide / disrupt opponent score) ──
  ghost: "blackout",
  pf_xray: "static",
  toxic_plasma: "freeze",
  obsidian: "lockout",
};

export function isCustomDiceSkin(skinId) {
  return EXPERIMENTAL_DICE_IDS.includes(skinId);
}

/** Each equipped skin carries one secret power (stable per skin id). */
export function getSkinPower(skinId) {
  const mapped = SKIN_POWER_MAP[skinId];
  if (mapped) return getPower(mapped);

  let h = 0;
  for (let i = 0; i < skinId.length; i++) h = (h * 31 + skinId.charCodeAt(i)) | 0;
  const pool = [...BASE_POWERS, ...SABO_POWERS];
  return pool[Math.abs(h) % pool.length];
}

/** All power ids you can assign in SKIN_POWER_MAP (for dev tooling). */
export const ASSIGNABLE_SKIN_POWER_IDS = [
  ...BASE_POWERS.map((p) => p.id),
  ...SABO_POWERS.map((p) => p.id),
];
