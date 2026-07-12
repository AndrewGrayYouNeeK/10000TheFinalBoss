/**
 * Story Mode v2 — media paths for cutscenes, banners, and boss portraits.
 * Drop your files into public/assets/story/ (see matrix/ subfolder).
 * Missing files fall back to static images or dialogue-only flow.
 */

const STORY_ROOT = "/assets/story";

export const STORY_ASSETS = {
  /** Looping video for the YouNeeK 10,000 sign during story matches */
  signLoopVideo: `${STORY_ROOT}/matrix/sign_loop.mp4`,
  /** Static fallback when the loop video is not available */
  signFallbackImage: "/assets/354eae8fe_generated_image.png",
};

/** Per-boss media — keyed by boss id */
export const BOSS_MEDIA = {
  neo: {
    portrait: `${STORY_ROOT}/matrix/neo_portrait.png`,
    introVideo: `${STORY_ROOT}/matrix/intro.mp4`,
    victoryVideo: `${STORY_ROOT}/matrix/victory.mp4`,
    defeatVideo: `${STORY_ROOT}/matrix/defeat.mp4`,
    /** Alternate dice sprite sheet when power mode is charged */
    powerSprite: `${STORY_ROOT}/matrix/power_sprite.png`,
  },
};

export function getBossMedia(bossId) {
  return BOSS_MEDIA[bossId] || null;
}

export function getSignVideoForBoss(boss) {
  return boss?.signVideo || boss?.media?.signLoop || STORY_ASSETS.signLoopVideo;
}
