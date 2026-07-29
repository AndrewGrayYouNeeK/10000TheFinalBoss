import { VIDEO_KEYS } from "@/lib/localVideoStore";

export const PLAYER_AVATAR_VIDEO_KEY = VIDEO_KEYS.CHARACTERS_LOOP;

export const PLAYER_AVATAR_FALLBACK_PATH = "/assets/characters_loop.mp4";

/**
 * Crop one character from a horizontal strip (2–4 players).
 * Uses scaleX + transformOrigin so each slot fills a round avatar frame.
 */
export function getPlayerAvatarStripTransform(playerIndex, playerCount) {
  const count = Math.max(2, Math.min(4, playerCount || 2));
  const idx = Math.min(Math.max(0, playerIndex), count - 1);
  const originX = ((idx + 0.5) / count) * 100;
  return {
    transform: `scaleX(${count})`,
    transformOrigin: `${originX}% center`,
  };
}
