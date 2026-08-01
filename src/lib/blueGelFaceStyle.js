/**
 * Blue Gel face layer — aspect-correct 3×2 crop for the square 1024² sprite sheet.
 */
import { assetUrl } from "@/lib/assetUrl";
import { sanitizeSpriteCrop } from "@/lib/spriteLab";
import { dieRefPx } from "@/lib/dieSpriteOffsets";
import { BLUE_GEL_SPRITE_TUNING } from "@/lib/blueGelSpriteTuning";

const COLS = 3;
const ROWS = 2;
const SHEET_W = 1024;
const SHEET_H = 1024;
export const BLUE_GEL_FACE_SPRITE_URL = "/assets/999d8760b_generated_image.png";

/** Pixel layout for an <img> sprite crop — one face from the 3×2 sheet. */
export function getBlueGelFaceImgStyle(skin, value, size, faceOffset = null) {
  const col = (value - 1) % COLS;
  const row = Math.floor((value - 1) / COLS);
  const crop = sanitizeSpriteCrop(
    skin?.spriteCrop ?? BLUE_GEL_SPRITE_TUNING.spriteCrop,
    BLUE_GEL_SPRITE_TUNING.spriteCrop
  );
  const zoom = crop.zoom ?? 1;
  const nativeCellW = SHEET_W / COLS;
  const nativeCellH = SHEET_H / ROWS;
  const scale = (size * zoom) / nativeCellH;
  const sheetW = SHEET_W * scale;
  const sheetH = SHEET_H * scale;
  const cellW = nativeCellW * scale;
  const cellH = nativeCellH * scale;
  const xNudge = dieRefPx(faceOffset?.x ?? 0, size) + (crop.offsetX ?? 0) * size;
  const yNudge = dieRefPx(faceOffset?.y ?? 0, size) - (crop.offsetY ?? 0) * size;
  const left = -(col * cellW) + (size - cellW) / 2 + xNudge;
  const top = -(row * cellH) + (size - cellH) / 2 + yNudge;

  return {
    sheetUrl: assetUrl(skin?.spriteUrl || BLUE_GEL_FACE_SPRITE_URL),
    imgStyle: {
      position: "absolute",
      width: sheetW,
      height: sheetH,
      maxWidth: "none",
      maxHeight: "none",
      left,
      top,
      pointerEvents: "none",
    },
  };
}

/** @deprecated use getBlueGelFaceImgStyle — kept for callers using background-image */
export function getBlueGelFaceStyle(skin, value, size, faceOffset = null) {
  const { sheetUrl, imgStyle } = getBlueGelFaceImgStyle(skin, value, size, faceOffset);
  return {
    inset: 0,
    backgroundImage: `url("${sheetUrl}")`,
    backgroundSize: `${imgStyle.width}px ${imgStyle.height}px`,
    backgroundPosition: `${imgStyle.left}px ${imgStyle.top}px`,
    backgroundRepeat: "no-repeat",
  };
}
