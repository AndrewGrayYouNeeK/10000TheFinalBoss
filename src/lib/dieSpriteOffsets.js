/**
 * Per-skin sprite face alignment for photorealistic dice sheets.
 * Pixel nudges were tuned at DIE_SPRITE_REF_SIZE — scaled for any render size.
 */
export const DIE_SPRITE_REF_SIZE = 64;

export function dieRefPx(px, size) {
  return px * (size / DIE_SPRITE_REF_SIZE);
}

function faceX(value, size) {
  const t = { 2: -0.015, 3: -0.022, 5: -0.022, 6: -0.032 };
  return t[value] ? size * t[value] : 0;
}

function faceY(value, size) {
  const t = { 1: -0.01, 2: -0.01, 3: -0.01, 4: -0.04, 5: -0.05, 6: -0.045 };
  return t[value] ? size * t[value] : 0;
}

function pick(skinTable, value, size, fallback = 0) {
  if (skinTable?.[value] != null) return skinTable[value](size);
  return fallback;
}

const SKIN_X = {
  wood: (v, s) => pick({ 3: (sz) => sz * 0.02, 5: (sz) => sz * 0.02, 6: (sz) => sz * 0.02 }, v, s, faceX(v, s)),
  silver: (v, s) => pick({ 1: (sz) => sz * 0.02, 2: (sz) => sz * 0.02, 3: (sz) => sz * 0.02, 4: (sz) => sz * 0.02, 5: (sz) => sz * 0.02, 6: (sz) => sz * 0.02 }, v, s, faceX(v, s)),
  // Galaxy uses matrix-style centered crop + catalog face offsets (absolute).
  galaxy: () => 0,
  dragon_scale: (v, s) => pick({ 2: (sz) => sz * 0.015, 3: (sz) => sz * 0.015, 5: (sz) => sz * 0.01, 6: (sz) => sz * 0.015 }, v, s, faceX(v, s)),
  amethyst: (v, s) => pick({ 2: (sz) => sz * 0.015, 3: (sz) => -sz * 0.005, 6: (sz) => sz * 0.015 }, v, s, faceX(v, s)),
  moonstone: (v, s) => pick({ 1: (sz) => sz * 0.03, 2: (sz) => sz * 0.035, 3: (sz) => sz * 0.035, 4: (sz) => sz * 0.04, 5: (sz) => sz * 0.035, 6: (sz) => sz * 0.035 }, v, s, faceX(v, s)),
  lava: (v, s) => pick({ 2: (sz) => -sz * 0.005, 3: (sz) => -sz * 0.005, 5: () => 0, 6: () => 0 }, v, s, faceX(v, s)),
  plasma: (v, s) => pick({ 1: (sz) => -sz * 0.03, 2: (sz) => -sz * 0.06, 3: (sz) => -sz * 0.11, 4: (sz) => -sz * 0.02, 5: (sz) => -sz * 0.085, 6: (sz) => -sz * 0.12 }, v, s, faceX(v, s)),
  paper: (v, s) => {
    const m = {
      1: () => dieRefPx(-2, s),
      2: () => s * 0.01 + dieRefPx(-11, s),
      3: () => s * 0.01 + dieRefPx(-18, s),
      4: () => dieRefPx(-3, s),
      5: () => s * 0.01 + dieRefPx(-12, s),
      6: () => s * 0.01 + dieRefPx(-19, s),
    };
    return m[v]?.() ?? faceX(v, s);
  },
  teal_crackle: (v, s) => pick({ 2: (sz) => sz * 0.01, 3: (sz) => sz * 0.01, 5: (sz) => sz * 0.01, 6: (sz) => sz * 0.01 }, v, s, faceX(v, s)),
  love_is_love: (v, s) => {
    const m = {
      2: () => -s * 0.11,
      3: () => -s * 0.23,
      4: () => -s * 0.01,
      5: () => s * 0.01 + dieRefPx(-15, s),
      6: () => s * 0.01 + dieRefPx(-24, s),
    };
    return m[v]?.() ?? faceX(v, s);
  },
  ice: (v, s) => pick({ 3: (sz) => -sz * 0.03, 6: (sz) => -sz * 0.03 }, v, s, faceX(v, s)),
  aquamarine: (v, s) => pick({ 3: (sz) => -sz * 0.03, 4: (sz) => -sz * 0.01, 5: (sz) => -sz * 0.03, 6: (sz) => -sz * 0.04 }, v, s, faceX(v, s)),
  aquamarine_light: (v, s) => pick({ 1: (sz) => sz * 0.005, 2: (sz) => -sz * 0.02, 3: (sz) => -sz * 0.03, 4: (sz) => -sz * 0.01, 5: (sz) => -sz * 0.025, 6: (sz) => -sz * 0.035 }, v, s, faceX(v, s)),
  pride: (v, s) => pick({ 1: (sz) => -sz * 0.01, 2: (sz) => -sz * 0.14, 3: (sz) => -sz * 0.26, 4: (sz) => -sz * 0.02, 5: (sz) => -sz * 0.15, 6: (sz) => -sz * 0.24 }, v, s, faceX(v, s)),
  circuit_board: (v, s) => pick({ 1: (sz) => dieRefPx(-3, sz), 2: (sz) => dieRefPx(-18, sz), 3: (sz) => dieRefPx(-31, sz), 4: (sz) => dieRefPx(-2, sz), 5: (sz) => dieRefPx(-17, sz), 6: (sz) => dieRefPx(-29, sz) }, v, s, faceX(v, s)),
  neon_grid: (v, s) => pick({ 1: (sz) => dieRefPx(-3, sz), 2: (sz) => dieRefPx(-16, sz), 3: (sz) => dieRefPx(-25, sz), 4: (sz) => dieRefPx(-4, sz), 5: (sz) => dieRefPx(-15, sz), 6: (sz) => dieRefPx(-25, sz) }, v, s, faceX(v, s)),
  amber_wasp: (v, s) => pick({ 1: (sz) => dieRefPx(4, sz), 2: (sz) => dieRefPx(4, sz), 3: (sz) => dieRefPx(4, sz), 4: (sz) => dieRefPx(4, sz), 5: (sz) => dieRefPx(3.5, sz), 6: (sz) => dieRefPx(5, sz) }, v, s, faceX(v, s)),
  toxic_plasma_v2: (v, s) => pick({ 2: (sz) => dieRefPx(-4, sz), 3: (sz) => dieRefPx(-7, sz), 4: (sz) => dieRefPx(-1, sz), 5: (sz) => dieRefPx(-4, sz), 6: (sz) => dieRefPx(-7, sz) }, v, s, faceX(v, s)),
  labradorite: (v, s) => pick({ 2: (sz) => dieRefPx(2, sz), 3: (sz) => dieRefPx(4, sz), 4: (sz) => dieRefPx(2, sz), 5: (sz) => dieRefPx(2, sz), 6: (sz) => dieRefPx(2, sz) }, v, s, faceX(v, s)),
  labradorite_polished: (v, s) => pick({ 2: (sz) => dieRefPx(-10, sz), 3: (sz) => dieRefPx(-18, sz), 4: (sz) => dieRefPx(-2, sz), 5: (sz) => dieRefPx(-10, sz), 6: (sz) => dieRefPx(-18, sz) }, v, s, faceX(v, s)),
  ruby: (v, s) => faceX(v, s),
};

const SKIN_Y = {
  classic_white: (v, s) => pick({ 1: (sz) => sz * 0.012, 2: (sz) => sz * 0.012, 3: (sz) => sz * 0.018, 4: (sz) => -sz * 0.045, 6: (sz) => -sz * 0.05 }, v, s, faceY(v, s)),
  gold: (v, s) => pick({ 5: (sz) => -sz * 0.03 }, v, s, faceY(v, s)),
  obsidian: (v, s) => pick({ 5: (sz) => -sz * 0.03 }, v, s, faceY(v, s)),
  wood: (v, s) => pick({ 1: (sz) => -sz * 0.02, 2: (sz) => -sz * 0.02, 3: (sz) => -sz * 0.025, 5: (sz) => -sz * 0.035, 6: (sz) => -sz * 0.02 }, v, s, faceY(v, s)),
  silver: (v, s) => pick({ 1: (sz) => -sz * 0.015, 2: (sz) => -sz * 0.015, 3: (sz) => -sz * 0.015 }, v, s, faceY(v, s)),
  galaxy: () => 0,
  dragon_scale: (v, s) => pick({ 5: (sz) => -sz * 0.025 }, v, s, faceY(v, s)),
  amethyst: (v, s) => pick({ 1: (sz) => -sz * 0.025, 2: (sz) => -sz * 0.025, 3: (sz) => -sz * 0.025, 4: (sz) => -sz * 0.035, 5: (sz) => -sz * 0.035, 6: (sz) => -sz * 0.035 }, v, s, faceY(v, s)),
  moonstone: (v, s) => pick({ 1: (sz) => sz * 0.01, 2: (sz) => sz * 0.005, 3: (sz) => sz * 0.0075, 4: (sz) => sz * 0.003, 5: (sz) => sz * 0.003, 6: (sz) => sz * 0.003 }, v, s, faceY(v, s)),
  plasma: (v, s) => pick({ 1: (sz) => sz * 0.01, 2: (sz) => sz * 0.02, 3: (sz) => sz * 0.02, 4: (sz) => -sz * 0.06, 5: (sz) => -sz * 0.06, 6: (sz) => -sz * 0.045 }, v, s, faceY(v, s)),
  paper: (v, s) => {
    const m = {
      1: () => -s * 0.015 + dieRefPx(2, s),
      2: () => -s * 0.015 + dieRefPx(3, s),
      3: () => -s * 0.02 + dieRefPx(3, s),
      4: () => -s * 0.04 + dieRefPx(-3, s),
      5: () => -s * 0.04 + dieRefPx(-3, s),
      6: () => -s * 0.04 + dieRefPx(-4, s),
    };
    return m[v]?.() ?? faceY(v, s);
  },
  teal_crackle: (v, s) => pick({ 1: (sz) => -sz * 0.015, 2: (sz) => -sz * 0.015, 3: (sz) => -sz * 0.02, 4: (sz) => -sz * 0.04, 5: (sz) => -sz * 0.04, 6: (sz) => -sz * 0.04 }, v, s, faceY(v, s)),
  love_is_love: (v, s) => pick({ 1: (sz) => -sz * 0.005, 2: (sz) => -sz * 0.005, 3: (sz) => -sz * 0.005, 4: (sz) => -sz * 0.05, 5: (sz) => -sz * 0.05, 6: (sz) => -sz * 0.04 }, v, s, faceY(v, s)),
  ice: (v, s) => pick({ 1: (sz) => -sz * 0.005, 2: (sz) => -sz * 0.005, 3: (sz) => -sz * 0.005, 4: (sz) => -sz * 0.035, 5: (sz) => -sz * 0.045, 6: (sz) => -sz * 0.04 }, v, s, faceY(v, s)),
  aquamarine: (v, s) => pick({ 1: () => 0, 3: (sz) => sz * 0.01, 4: (sz) => -sz * 0.04 }, v, s, faceY(v, s)),
  aquamarine_light: (v, s) => pick({ 1: () => 0, 2: () => 0, 3: () => 0, 4: (sz) => -sz * 0.05, 5: (sz) => -sz * 0.045, 6: (sz) => -sz * 0.05 }, v, s, faceY(v, s)),
  pride: (v, s) => pick({ 2: (sz) => sz * 0.02, 3: (sz) => sz * 0.03, 4: (sz) => -sz * 0.07, 5: (sz) => -sz * 0.06, 6: (sz) => -sz * 0.06 }, v, s, faceY(v, s)),
  circuit_board: (v, s) => pick({ 1: (sz) => dieRefPx(5, sz), 2: (sz) => dieRefPx(4, sz), 3: (sz) => dieRefPx(4, sz), 4: (sz) => dieRefPx(-7, sz), 5: (sz) => dieRefPx(-10, sz), 6: (sz) => dieRefPx(-9, sz) }, v, s, faceY(v, s)),
  neon_grid: (v, s) => pick({ 4: (sz) => dieRefPx(-8, sz), 5: (sz) => dieRefPx(-7, sz), 6: (sz) => dieRefPx(-7, sz) }, v, s, faceY(v, s)),
  amber_wasp: (v, s) => pick({ 1: (sz) => dieRefPx(2, sz), 2: (sz) => dieRefPx(2, sz), 3: (sz) => dieRefPx(2, sz), 4: (sz) => dieRefPx(0.5, sz), 5: (sz) => dieRefPx(1, sz), 6: (sz) => dieRefPx(1, sz) }, v, s, faceY(v, s)),
  toxic_plasma_v2: (v, s) => pick({ 4: (sz) => dieRefPx(-4, sz) }, v, s, faceY(v, s)),
  labradorite: () => 0,
  labradorite_polished: (v, s) => pick({ 4: (sz) => dieRefPx(-8, sz), 5: (sz) => dieRefPx(-8, sz), 6: (sz) => dieRefPx(-8, sz) }, v, s, faceY(v, s)),
  ruby: (v, s) => {
    const base = faceY(v, s);
    return v >= 1 && v <= 6 ? base + dieRefPx(-1, s) : base;
  },
};

export function getDieSpriteNudges(skinId, value, size) {
  const xFn = SKIN_X[skinId];
  const yFn = SKIN_Y[skinId];
  return {
    xNudge: xFn ? xFn(value, size) : faceX(value, size),
    yNudge: yFn ? yFn(value, size) : faceY(value, size),
  };
}

/** Extra per-face nudge in ref pixels (@ 64px die) — from catalog or sprite lab. */
export function resolveFaceSpriteNudges(skinId, value, size, faceOffset, { powerVideo = false } = {}) {
  const x = faceOffset?.x ?? 0;
  const y = faceOffset?.y ?? 0;
  if (powerVideo || skinId === "matrix" || skinId === "crystal_cut" || skinId === "galaxy") {
    return { xNudge: dieRefPx(x, size), yNudge: dieRefPx(y, size) };
  }
  const base = getDieSpriteNudges(skinId, value, size);
  return {
    xNudge: base.xNudge + dieRefPx(x, size),
    yNudge: base.yNudge + dieRefPx(y, size),
  };
}

export function getSkinFaceOffset(skin, powerMode, value) {
  const regular =
    skin?.spriteFaceOffsets?.regular?.[value] ?? skin?.spriteFaceOffsets?.regular?.[String(value)];
  if (!powerMode) return regular ?? null;
  const power =
    skin?.spriteFaceOffsets?.power?.[value] ?? skin?.spriteFaceOffsets?.power?.[String(value)];
  // Power video uses its own nudge map — don't inherit regular sprite offsets.
  if (skin?.powerVideoUrl && !skin?.powerSpriteUrl) return power ?? null;
  return power ?? regular ?? null;
}

export function getAquamarineShellNudges(value, size) {
  return getDieSpriteNudges("aquamarine", value, size);
}

export function getDieSpriteStretch(skinId, value, size, skin) {
  if (skin?.spriteCrop?.stretch) return size * skin.spriteCrop.stretch;
  if (skinId === "moonstone") return size * 0.0375 + (value >= 3 ? size * 0.015 : 0);
  if (skinId === "amber_wasp") return size * 0.065;
  return 0;
}

/** Sprite sheet crop box — includes spriteCrop zoom/offsetY (Ragnarok/lava). */
export function getSpriteSheetStyle(skin, value, size, { xNudge, yNudge }) {
  const cols = skin.spriteGrid?.cols ?? 3;
  const rows = skin.spriteGrid?.rows ?? 2;
  const col = (value - 1) % cols;
  const row = Math.floor((value - 1) / cols);
  const zoom = skin.spriteCrop?.zoom ?? 1;
  const stretch = getDieSpriteStretch(skin.id, value, size, skin);
  const spriteCropBgY = skin.spriteCrop?.offsetY ? size * skin.spriteCrop.offsetY : 0;
  const spriteCropBgX = skin.spriteCrop?.offsetX ? size * skin.spriteCrop.offsetX : 0;

  // Matrix + Galaxy: centered cell crop. Face nudges pan the sheet (they do
  // not shrink the layer) — avoids flashing the body gradient on edge faces.
  if (skin.id === "matrix" || skin.id === "galaxy") {
    // 3×2 grid. Scale the sheet up (zoom = cell-to-die ratio) and CENTER the
    // target die in the square viewport. `stretch` scales cells vertically to
    // square up the (slightly wide) die art: >0 = taller, <0 = shorter.
    const z = zoom;
    const stretchY = skin.spriteCrop?.stretch ?? 0;
    const cellW = size * z;
    const cellH = size * z * (1 + stretchY);
    const sheetW = cols * cellW;
    const sheetH = rows * cellH;
    const offX = (skin.spriteCrop?.offsetX ?? 0) * size;
    const offY = (skin.spriteCrop?.offsetY ?? 0) * size;
    const left = size / 2 - (col + 0.5) * cellW + offX + xNudge;
    const top = size / 2 - (row + 0.5) * cellH - offY + yNudge;

    return {
      inset: 0,
      backgroundSize: `${sheetW}px ${sheetH}px`,
      backgroundPosition: `${left}px ${top}px`,
      backgroundRepeat: "no-repeat",
    };
  }

  const cellW = size * 1.7 * zoom;
  const cellH = size * 1.32 * zoom;
  const colStep = cellW + (stretch * 2) / cols;
  const rowStep = cellH + (stretch * 2) / rows;

  return {
    top: `${-size * 0.14 + yNudge - stretch}px`,
    bottom: `${-size * 0.8 + yNudge - stretch}px`,
    left: `${-size * 0.35 + xNudge - stretch}px`,
    right: `${-size * 0.35 + xNudge - stretch}px`,
    backgroundSize: `${cellW * cols + stretch * 2}px ${cellH * rows + stretch * 2}px`,
    backgroundPosition: `${-(col * colStep) + spriteCropBgX}px ${-(row * rowStep) - spriteCropBgY}px`,
    backgroundRepeat: "no-repeat",
  };
}

/** Tesla/plasma video face offsets — already in die-width units (do not scale by size). */
export function getVideoFaceOffset(value) {
  const txRef = { 1: -0.3, 2: -3.8, 3: -7.0, 4: -1.3, 5: -3.1, 6: -6.8 };
  const tyRef = { 1: -0.05, 2: 0, 3: 0, 4: -3, 5: -3, 6: -3 };
  return { tx: txRef[value] || 0, ty: tyRef[value] || 0 };
}

export function getSpriteBleed(size) {
  return dieRefPx(9, size);
}

/**
 * Crop a 3×2 power-video grid onto one die face.
 * Matrix (spriteSheetSize) uses sprite crop + face nudges — not Tesla offsets.
 */
export function getPowerVideoCellStyle(skin, value, size, { powerMode = true } = {}) {
  const cols = skin.spriteGrid?.cols ?? 3;
  const rows = skin.spriteGrid?.rows ?? 2;
  const col = (value - 1) % cols;
  const row = Math.floor((value - 1) / cols);
  const baseZoom = skin.powerVideoZoom ?? (skin.id === "matrix" || skin.id === "crystal_cut" ? 1 : 3);

  if (skin.id === "matrix" || skin.id === "crystal_cut") {
    // 3×2 video grid, one face centered per die. zoom 1 = full face, >1 zooms in.
    const zoom = baseZoom;
    const crop = skin.powerVideoCrop ?? { offsetX: 0, offsetY: 0 };
    const cropX = crop.offsetX ? size * crop.offsetX : 0;
    const cropY = crop.offsetY ? size * crop.offsetY : 0;
    const faceOffset = getSkinFaceOffset(skin, powerMode, value);
    const { xNudge, yNudge } = resolveFaceSpriteNudges(skin.id, value, size, faceOffset, {
      powerVideo: true,
    });
    const panX = (xNudge + cropX) / size;
    const panY = (yNudge - cropY) / size;
    const videoW = cols * zoom;
    const videoH = rows * zoom;
    return {
      videoW,
      videoH,
      zoom,
      txPos: (col + 0.5) * zoom - 0.5 + panX,
      tyPos: (row + 0.5) * zoom - 0.5 + panY,
      objectFit: "fill",
    };
  }

  const zoom = baseZoom;
  const { tx, ty } = getVideoFaceOffset(value);
  const videoW = cols * zoom;
  const videoH = rows * zoom;
  return {
    videoW,
    videoH,
    txPos: (col + 0.5) * zoom - 0.5 + tx,
    tyPos: (row + 0.5) * zoom - 0.5 + ty,
  };
}
