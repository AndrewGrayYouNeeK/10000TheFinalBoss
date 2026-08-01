/**
 * Diamond Ruby sprite alignment — sheet at /assets/diamond_ruby_dice.png
 * (3×2, faces 1–3 top / 4–6 bottom). Tune further in /sprite-lab/diamond_ruby.
 */
export const DIAMOND_RUBY_SPRITE_TUNING = {
  spriteSheetSize: { width: 1024, height: 550 },
  spriteCrop: { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 },
  spriteFaceOffsets: {
    regular: {
      1: { x: 0, y: 0 },
      2: { x: 0, y: 0 },
      3: { x: 0, y: 0 },
      4: { x: 0, y: 0 },
      5: { x: 0, y: 0 },
      6: { x: 0, y: 0 },
    },
  },
};
