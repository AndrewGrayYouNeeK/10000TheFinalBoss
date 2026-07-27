import { getPower } from "@/lib/powers";
import {
  applyStoryIceFreeze,
  canStoryIceFire,
} from "@/lib/gameLogic";

/** Story-mode Frosty power — offensive freeze, not score lock or self-skin swap. */
export const STORY_ICE_POWER_ID = "frosty_ice";
export const STORY_PLAYER_INDEX = 0;

/** Boss fights where Frosty offensive freeze rules apply (not Neo/matrix or other story bosses). */
export const STORY_ICE_BOSS_IDS = new Set(["snowman", "ice_witch"]);

export function isStoryIceBossFight(bossId) {
  return STORY_ICE_BOSS_IDS.has(bossId);
}

export function isStoryIcePower(power, bossId) {
  if (!isStoryIceBossFight(bossId)) return false;
  const id = typeof power === "string" ? power : power?.id;
  return id === STORY_ICE_POWER_ID || id === "freeze_score";
}

/**
 * Frosty arc fights always use offensive Frozen Ice for the human player —
 * even on Prison Dice / pre-unlock skins. (Score Freeze is local-play only.)
 */
export function resolveStorySkinPower(power, bossId) {
  if (!isStoryIceBossFight(bossId)) return power;
  return getPower(STORY_ICE_POWER_ID) || power;
}

export function canFireStoryIce(state, playerIndex = STORY_PLAYER_INDEX, bossId) {
  if (!isStoryIceBossFight(bossId)) return false;
  return canStoryIceFire(state, playerIndex);
}

/** Apply Frosty freeze — consumes charge, skips enemy turn when needed. */
export function fireStoryIcePower(state, playerIndex = STORY_PLAYER_INDEX, bossId) {
  if (!isStoryIceBossFight(bossId)) {
    return {
      state,
      message: "Can't use Frozen Ice right now.",
      variant: "warning",
    };
  }
  if (!canStoryIceFire(state, playerIndex)) {
    return {
      state,
      message: "Can't use Frozen Ice right now.",
      variant: "warning",
    };
  }
  const targetIdx = (playerIndex + 1) % (state.players?.length || 2);
  const targetName = state.players[targetIdx]?.name || "opponent";
  const next = applyStoryIceFreeze(state, playerIndex);
  return {
    state: next,
    message: `${targetName} frozen!`,
    variant: "success",
    secret: true,
  };
}
