import { loadProfile } from "@/lib/localProfile";

export const BUG_ZAPPER_SKIN_ID = "pf_bug_zapper";

/** Bug zapper zap/hum audio when equipped during gameplay (or shop preview). */
export const BUG_ZAPPER_SFX_ENABLED = true;

let activeGamePlaySessions = 0;

/** Call when entering Game or StoryGame; returns cleanup for unmount. */
export function enterGamePlaySession() {
  activeGamePlaySessions++;
  return () => {
    activeGamePlaySessions = Math.max(0, activeGamePlaySessions - 1);
  };
}

/** True only while a real game screen is mounted (not shop / preview). */
export function isInActiveGamePlay() {
  return activeGamePlaySessions > 0;
}

/** Whether all local game SFX are muted (rolls, dice effects, etc.). */
export function isSfxMuted() {
  return loadProfile().sfx_muted === true;
}

/** Whether opponent sounds are muted (online / AI rolls). */
export function isOpponentSfxMuted() {
  return loadProfile().opponent_sfx_muted === true;
}

/** Dice roll and general game sfx. */
export function shouldPlaySfx({ opponent = false } = {}) {
  if (isSfxMuted()) return false;
  if (opponent && isOpponentSfxMuted()) return false;
  return true;
}

/** Bug zapper hum/zaps — equipped skin, active gameplay or preview, not muted. */
export function shouldPlayBugZapperSfx({ preview = false } = {}) {
  if (!BUG_ZAPPER_SFX_ENABLED) return false;
  if (loadProfile().equipped_skin !== BUG_ZAPPER_SKIN_ID) return false;
  if (isSfxMuted()) return false;
  return preview || isInActiveGamePlay();
}
