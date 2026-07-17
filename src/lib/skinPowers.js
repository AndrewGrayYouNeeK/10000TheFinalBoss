import { getPower, BASE_POWERS, SABO_POWERS, POWER_MODE_HOT_DICE } from "@/lib/powers";
import { EXPERIMENTAL_DICE_IDS } from "@/lib/experimentalDice";

/**
 * SKIN → SECRET POWER MAP
 * ─────────────────────
 * Edit SKIN_POWER_MAP to assign any power id from src/lib/powers.js to a dice skin.
 *
 * Self powers:  reroll | shield | double_or_nothing | lucky_seven | hot_streak | siphon | plasma_cut
 * Sabo powers:  freeze | lockout | blackout | static | xray | overtime | prison_dice | shark_bite
 *
 * Example:
 *   ghost: (mimic — copies opponent's pretend skin; no fixed power)
 *   matrix: "static",    // blinds opponent's own score until they bust
 *   blue_gel: "shark_bite", // shark eats opponent's next bank
 *
 * Skins not listed here get a stable random power from BASE_POWERS.
 */
const SKIN_POWER_MAP = {
  // ── Self buffs ──
  lava: "hot_streak",
  ragnarok: "hot_streak",
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
  pf_plasma_cut: "plasma_cut",
  pf_core_burst: "prison_dice",
  pf_soundwave: "lucky_seven",
  pf_score_meter: "overtime",
  snow_globe: "shield",
  blue_gel: "shark_bite",
  amber_wasp: "siphon",
  circuit_board: "reroll",
  neon_grid: "hot_streak",

  // ── Sabotage (hide / disrupt opponent score) ──
  // ghost: no fixed power — mimics opponent's pretend skin (see ghostDisguise.js)
  pf_xray: "xray",
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

/** Assignable power ids (for dev tooling). */
export const ASSIGNABLE_SKIN_POWER_IDS = [
  ...BASE_POWERS.map((p) => p.id),
  ...SABO_POWERS.map((p) => p.id),
];

/** Skins / powers that earn a charge on the 2nd Hot Dice (not the 3rd). */
const FAST_CHARGE_SKIN_IDS = new Set(["blue_gel", "crystal_cut"]);
const FAST_CHARGE_POWER_IDS = new Set(["shark_bite"]);

/** Hot dice clears needed this turn before earning a power charge. */
export function getPowerChargeHotDiceThreshold(player) {
  if (!player) return POWER_MODE_HOT_DICE;
  const skinId = player.trueSkinId || player.skinId;
  if (FAST_CHARGE_SKIN_IDS.has(skinId)) return 2;
  const powerId = player.chargePowerId || getSkinPower(skinId)?.id;
  if (powerId && FAST_CHARGE_POWER_IDS.has(powerId)) return 2;
  return POWER_MODE_HOT_DICE;
}
