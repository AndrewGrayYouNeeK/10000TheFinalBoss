/**
 * Matrix sprite alignment — scans at /assets/matrix_dice.png (3×2 grid, faces
 * 1-2-3 top row, 4-5-6 bottom row). Locked from /sprite-lab/matrix.
 * spriteCrop.zoom scales each face to fill the die; stretch squares up the
 * (wide) art vertically; per-face nudges fine-tune position. Power video uses
 * its own zoom + per-face nudges.
 */
export const MATRIX_SPRITE_TUNING = {
  spriteSheetSize: { width: 1020, height: 680 },
  spriteCrop: { zoom: 1.195, offsetY: -0.005, offsetX: 0, stretch: 0.11 },
  spriteFaceOffsets: {
    regular: {
      1: { x: -7.5, y: -6 },
      2: { x: 0.5, y: -6 },
      3: { x: 7, y: -6 },
      4: { x: -8, y: 5 },
      5: { x: 0, y: 5 },
      6: { x: 6.5, y: 5 },
    },
    power: {
      1: { x: -19, y: -12.5 },
      2: { x: 0, y: -11.5 },
      3: { x: 18, y: -11.5 },
      4: { x: -20.5, y: 13 },
      5: { x: 0, y: 13 },
      6: { x: 21.5, y: 13.5 },
    },
  },
  powerVideoUrl: "/assets/matrix_power.mp4",
  powerVideoZoom: 1.41,
  powerVideoCrop: { offsetY: 0, offsetX: 0 },
};
