/**
 * Classic White sprite alignment.
 * Sheet: plain ivory dice on felt — no branding in pips.
 */
export const CLASSIC_WHITE_SPRITE_TUNING = {
  spriteCrop: { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 },
  spriteFaceOffsets: {
    regular: {},
  },
};

/** Full Sprite Lab lock payload (re-seeds localStorage when recovering). */
export const CLASSIC_WHITE_LOCKED_SNAPSHOT = {
  regularCrop: { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 },
  powerCrop: { zoom: 1, offsetY: 0, offsetX: 0, stretch: 0 },
  regularFaces: {},
  powerFaces: {},
  powerVideoZoom: 1,
  powerVideoCrop: { offsetY: 0, offsetX: 0 },
  spriteUrl: "/assets/classic_white_dice.png",
  seededFrom: "classic_white_clean_sheet",
};
