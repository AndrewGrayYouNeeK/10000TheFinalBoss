/**
 * Classic White sprite alignment — your locked Sprite Lab snapshot.
 * Crop + per-face nudges captured from /sprite-lab/classic_white.
 */
export const CLASSIC_WHITE_SPRITE_TUNING = {
  spriteCrop: { zoom: 0.93, offsetY: -0.015, offsetX: -0.005, stretch: 0.185 },
  spriteFaceOffsets: {
    regular: {
      1: { x: 57, y: 31.5 },
      2: { x: 58.5, y: 31 },
      3: { x: 59, y: 30.5 },
      4: { x: 57, y: 39 },
      5: { x: 59, y: 39 },
      6: { x: 61, y: 39.5 },
    },
  },
};

/** Full Sprite Lab lock payload (re-seeds localStorage when recovering). */
export const CLASSIC_WHITE_LOCKED_SNAPSHOT = {
  regularCrop: { zoom: 0.93, offsetY: -0.015, offsetX: -0.005, stretch: 0.185 },
  powerCrop: { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 },
  regularFaces: {
    1: { x: 57, y: 31.5 },
    2: { x: 58.5, y: 31 },
    3: { x: 59, y: 30.5 },
    4: { x: 57, y: 39 },
    5: { x: 59, y: 39 },
    6: { x: 61, y: 39.5 },
  },
  powerFaces: {
    1: { x: -19, y: -12.5 },
    2: { x: 0, y: -11.5 },
    3: { x: 18, y: -11.5 },
    4: { x: -20.5, y: 13 },
    5: { x: 0, y: 13 },
    6: { x: 21.5, y: 13.5 },
  },
  powerVideoZoom: 1.41,
  powerVideoCrop: { offsetY: 0, offsetX: 0 },
  spriteUrl: "/assets/e3c042b9e_hPLMjJ1wVsJG0mW-UisgC_GgpVeRAE.png",
  seededFrom: "draft",
};
