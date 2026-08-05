import { getPower, BASE_POWERS, SABO_POWERS, POWER_MODE_HOT_DICE } from "@/lib/powers";
import { normalizeSkinId } from "@/lib/shopCatalog";
import { EXPERIMENTAL_DICE_IDS } from "@/lib/experimentalDice";

/**
 * SKIN → SECRET POWER MAP
 * ─────────────────────
 * Edit SKIN_POWER_MAP to assign any power id from src/lib/powers.js to a dice skin.
 *
 * Self powers:  reroll | shield | double_or_nothing | lucky_seven | hot_streak | plasma_cut
 * Sabo powers:  freeze | freeze_score | frosty_ice | lockout | blackout | static | xray | overtime | prison_dice | shark_bite | matrix_glitch
 *
 * Example:
 *   ghost: (bare — mimics opponent; disguised — uses disguise skin power)
 *   matrix: "matrix_glitch", // cuts opponent score + scrambles their next roll
 *   blue_gel: "shark_bite", // shark eats opponent's next bank
 *
 * Skins not listed here get a stable random power from BASE_POWERS + local sabo powers.
 * Exception: NO_POWER_SKIN_IDS (classic_white, cyber_neon) intentionally have no secret power.
 * Story-only random assign is blocked below — frosty_ice is still valid when mapped
 * (ice skin / story charge); local cast aliases it to Score Freeze in powerEffects.
 * Siphon is retired from player-facing assign / UI (definition kept in powers.js).
 */
/** Powers that only work via story wiring (StoryGame + storyIcePower), never random local assign. */
const STORY_ONLY_POWER_IDS = new Set(["frosty_ice"]);

/** Retired from player pools / skin assign — still defined in powers.js for legacy cast safety. */
const RETIRED_POWER_IDS = new Set(["siphon"]);

/** Skins with no secret power (skip hash-pool fallback). */
const NO_POWER_SKIN_IDS = new Set(["classic_white", "cyber_neon"]);

const LOCAL_POWER_POOL = [...BASE_POWERS, ...SABO_POWERS].filter(
  (p) => !STORY_ONLY_POWER_IDS.has(p.id) && !RETIRED_POWER_IDS.has(p.id)
);

/** Self powers shown in Rules / Shop PowersInfo (excludes retired). */
export const PLAYER_FACING_BASE_POWERS = BASE_POWERS.filter(
  (p) => !RETIRED_POWER_IDS.has(p.id)
);

const SKIN_POWER_MAP = {
  // ── Self buffs ──
  paper: "double_or_nothing", // Prison Dice — Double or Nothing
  lava: "hot_streak",
  ragnarok: "hot_streak",
  matrix: "matrix_glitch",
  pf_matrix_storm: "matrix_glitch",
  pf_binary_storm: "matrix_glitch",
  galaxy: "double_or_nothing",
  dragon_scale: "shield",
  crystal_cut: "double_or_nothing",
  diamond_ruby: "double_or_nothing", // upgrade of GQ Diamond Cut (crystal_cut)
  gold: "hot_streak",
  toxic_plasma_v2: "double_or_nothing",
  pf_bug_zapper: "reroll",
  pf_plasma_cut: "plasma_cut",
  pf_core_burst: "prison_dice",
  pf_soundwave: "lucky_seven",
  pf_score_meter: "overtime",
  snow_globe: "shield",
  blue_gel: "shark_bite",
  amber_wasp: "lucky_seven",
  circuit_board: "reroll",
  neon_grid: "hot_streak",

  // ── Sabotage (hide / disrupt opponent score) ──
  // ghost: no fixed power — mimics opponent's pretend skin (see ghostDisguise.js)
  pf_xray: "xray",
  toxic_plasma: "freeze", // power-bar freeze (Radiation)
  ice: "frosty_ice", // Frozen Ice — local: Score Freeze lock; story frost bosses: turn skip
  obsidian: "lockout",
};

export function isCustomDiceSkin(skinId) {
  return EXPERIMENTAL_DICE_IDS.includes(skinId);
}

/** Each equipped skin carries one secret power (stable per skin id), or null if none. */
export function getSkinPower(skinId) {
  return getSkinPowerMeta(skinId).power;
}

/**
 * Power assignment details for labs / tooling.
 * @returns {{ power: object|null, source: "none"|"mapped"|"random", powerId: string|null }}
 */
export function getSkinPowerMeta(skinId) {
  const id = normalizeSkinId(skinId || "classic_white");
  if (NO_POWER_SKIN_IDS.has(id)) {
    return { power: null, source: "none", powerId: null };
  }

  const mapped = SKIN_POWER_MAP[id];
  if (mapped) {
    const power = getPower(mapped);
    return { power, source: "mapped", powerId: power?.id ?? mapped };
  }

  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const power = LOCAL_POWER_POOL[Math.abs(h) % LOCAL_POWER_POOL.length];
  return { power, source: "random", powerId: power?.id ?? null };
}

/** Assignable power ids (for dev tooling). Story-only powers excluded. */
export const ASSIGNABLE_SKIN_POWER_IDS = LOCAL_POWER_POOL.map((p) => p.id);

/** Hot dice clears needed this turn before earning a power charge. */
export function getPowerChargeHotDiceThreshold(_player) {
  return POWER_MODE_HOT_DICE;
}
