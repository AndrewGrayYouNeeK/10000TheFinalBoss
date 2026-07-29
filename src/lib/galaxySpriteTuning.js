/**
 * Galaxy sprite alignment — sheet at /assets/galaxy_dice_blackhole.png
 * (3×2, faces 1–3 top / 4–6 bottom). Locked from /sprite-lab/galaxy.
 * Saved from the user's Sprite Lab draft (not reset defaults).
 */
export const GALAXY_SPRITE_TUNING = {
  spriteSheetSize: { width: 930, height: 490 },
  spriteCrop: { zoom: 1.63, offsetY: 0.045, offsetX: -0.175, stretch: -0.02 },
  spriteFaceOffsets: {
    regular: {
      1: { x: -17.5, y: -9 },
      2: { x: 11, y: -2.5 },
      3: { x: 39, y: -5 },
      4: { x: -16.5, y: 7.5 },
      5: { x: 11, y: 7.5 },
      6: { x: 36, y: 7.5 },
    },
  },
};
