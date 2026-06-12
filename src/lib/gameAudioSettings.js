import { loadProfile } from "@/lib/localProfile";

export const BUG_ZAPPER_SKIN_ID = "pf_bug_zapper";

/** Bug zapper zap/hum audio when dice are shown in gameplay or shop preview. */
export const BUG_ZAPPER_SFX_ENABLED = true;

let activeGamePlaySessions = 0;
let activeShopPreviewSessions = 0;
const listeners = new Set();

function notifyDiceAudioContextChange() {
  for (const cb of listeners) cb();
}

/** Subscribe when game/shop preview audio context changes (for effect components). */
export function subscribeDiceAudioContext(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Call when entering Game or StoryGame; returns cleanup for unmount. */
export function enterGamePlaySession() {
  activeGamePlaySessions++;
  notifyDiceAudioContextChange();
  return () => {
    activeGamePlaySessions = Math.max(0, activeGamePlaySessions - 1);
    notifyDiceAudioContextChange();
  };
}

/** Call when a shop dice preview is visible; returns cleanup when hidden/unmounted. */
export function enterShopPreviewSession() {
  activeShopPreviewSessions++;
  notifyDiceAudioContextChange();
  return () => {
    activeShopPreviewSessions = Math.max(0, activeShopPreviewSessions - 1);
    notifyDiceAudioContextChange();
  };
}

/** True only while a real game screen is mounted. */
export function isInActiveGamePlay() {
  return activeGamePlaySessions > 0;
}

/** True while shop / preview-lab dice previews are on screen. */
export function isInShopPreview() {
  return activeShopPreviewSessions > 0;
}

/** Dice skin ambient SFX (bug zapper hum/zaps, etc.) — game or shop preview only. */
export function shouldPlayDiceSkinSfx() {
  if (isSfxMuted()) return false;
  return isInActiveGamePlay() || isInShopPreview();
}

/** Whether all local game SFX are muted (rolls, dice effects, etc.). */
export function isSfxMuted() {
  return loadProfile().sfx_muted === true;
}

/** Whether opponent sounds are muted (online / AI rolls). */
export function isOpponentSfxMuted() {
  return loadProfile().opponent_sfx_muted === true;
}

/** Dice roll SFX — active gameplay only (not shop/home/settings). */
export function shouldPlaySfx({ opponent = false } = {}) {
  if (isSfxMuted()) return false;
  if (opponent && isOpponentSfxMuted()) return false;
  if (!isInActiveGamePlay()) return false;
  return true;
}

/** Bug zapper hum/zaps — only when dice are in game or shop preview, not muted. */
export function shouldPlayBugZapperSfx() {
  if (!BUG_ZAPPER_SFX_ENABLED) return false;
  return shouldPlayDiceSkinSfx();
}
