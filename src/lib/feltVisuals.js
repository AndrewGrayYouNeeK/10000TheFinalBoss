/** Procedural felt surface helpers — nap, mottling, wood rail, lighting. */

const FABRIC_FELT_IDS = new Set([
  "royal_blue",
  "crimson_red",
  "midnight_black",
  "burgundy",
  "forest_pine",
  "amethyst_purple",
  "graphite",
  "ocean_teal",
  "sahara_sand",
  "obsidian_velvet",
  "midnight_emerald",
  "rose_gold_noir",
  "sapphire_abyss",
  "blood_moon",
  "platinum_smoke",
  "imperial_gold",
  "void_violet",
  "velvet_royal",
]);

const PHOTO_TEXTURE_FELT_IDS = new Set([
  "classic_green",
  "wolf_fur",
  "green_wood",
  "red_wood",
  "galaxy_window",
  "tiedye_neon",
  "iridescent_frame",
  "golden_frame",
  "stone_frame",
]);

/** Dedicated photo scans — skip fabric nap / hue-shift recycling. */
const DEDICATED_PHOTO_FELT_IDS = new Set([
  "classic_green",
  "wolf_fur",
  "green_wood",
  "red_wood",
  "galaxy_window",
  "tiedye_neon",
  "iridescent_frame",
  "golden_frame",
  "stone_frame",
]);

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return { r: 80, g: 80, b: 80 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function shiftHex(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

export function isFabricFelt(feltId) {
  return FABRIC_FELT_IDS.has(feltId);
}

export function usesPhotoFeltTexture(feltId) {
  return PHOTO_TEXTURE_FELT_IDS.has(feltId) || isFabricFelt(feltId);
}

export function isDedicatedPhotoFelt(feltId) {
  return DEDICATED_PHOTO_FELT_IDS.has(feltId);
}

/** Frame felts shipped as tall PNGs — landscape tray art centered in portrait canvas. */
const PORTRAIT_CANVAS_FELT_IDS = new Set([
  "green_wood",
  "red_wood",
  "galaxy_window",
  "tiedye_neon",
]);

export function isPortraitCanvasFelt(feltId) {
  return PORTRAIT_CANVAS_FELT_IDS.has(feltId);
}

function photoBackgroundSize(felt, compact) {
  const scale = felt?.textureScale ?? 1;
  if (isPortraitCanvasFelt(felt?.id)) {
    if (scale === 1) return "100% auto";
    return `${Math.round(scale * 100)}% auto`;
  }
  if (scale === 1) return "cover";
  return `${Math.round(scale * 100)}%`;
}

function photoBackgroundPosition(felt) {
  const posX = felt?.texturePosX ?? 50;
  const posY = felt?.texturePosY ?? 50;
  return `${posX}% ${posY}%`;
}
function dedicatedPhotoStyle(compact = false, felt) {
  const opacity = felt?.textureOpacity ?? (compact ? 0.92 : 0.88);
  return {
    backgroundSize: photoBackgroundSize(felt, compact),
    backgroundPosition: photoBackgroundPosition(felt),
    backgroundRepeat: "no-repeat",
    mixBlendMode: "normal",
    opacity,
    filter: buildTextureFilter(felt, "none"),
    imageRendering: felt?.textureBlur > 0 ? "auto" : "-webkit-optimize-contrast",
  };
}

/** Slightly irregular base — real felt is never a perfect radial wash. */
export function getFeltBaseGradient(felt) {
  if (!felt) return "#2f8b4f";
  const { inner, mid, outer } = felt;
  const h = hashId(felt.id);
  const ax = 42 + (h % 17);
  const ay = 36 + (h % 13);
  const bx = 58 + (h % 11);
  const by = 62 + (h % 19);
  const cx = 28 + (h % 23);
  const cy = 68 + (h % 9);

  return `
    radial-gradient(ellipse 52% 44% at ${ax}% ${ay}%, ${inner} 0%, transparent 74%),
    radial-gradient(ellipse 38% 32% at ${bx}% ${by}%, ${shiftHex(mid, 14)} 0%, transparent 70%),
    radial-gradient(ellipse 46% 38% at ${cx}% ${cy}%, ${shiftHex(outer, -10)} 0%, transparent 68%),
    radial-gradient(ellipse 88% 78% at 50% 48%, ${mid} 0%, ${outer} 92%)
  `;
}

/** Directional cloth nap — fibers lean slightly; angle varies per felt. */
export function getFeltNapLayers(felt, compact = false) {
  const h = hashId(felt?.id || "felt");
  const angle = 118 + (h % 28);
  const cross = angle + 73;
  const stroke = compact ? 0.35 : 0.55;
  const gap = compact ? 2.2 : 3.2;

  return {
    primary: `repeating-linear-gradient(
      ${angle}deg,
      rgba(255,255,255,0.055) 0px,
      rgba(255,255,255,0.055) ${stroke}px,
      rgba(0,0,0,0.09) ${stroke}px,
      rgba(0,0,0,0.09) ${stroke * 2}px,
      transparent ${stroke * 2}px,
      transparent ${gap}px
    )`,
    cross: `repeating-linear-gradient(
      ${cross}deg,
      rgba(255,255,255,0.028) 0px,
      rgba(255,255,255,0.028) 0.4px,
      transparent 0.4px,
      transparent ${compact ? 5 : 7}px
    )`,
    shear: `repeating-linear-gradient(
      ${angle - 4}deg,
      transparent 0px,
      transparent ${compact ? 11 : 16}px,
      rgba(0,0,0,0.045) ${compact ? 11 : 16}px,
      rgba(0,0,0,0.045) ${compact ? 12 : 17}px
    )`,
  };
}

/** Irregular dye-lot blotches and worn patches. */
export function getFeltMottlingLayers(felt) {
  const { inner, mid, outer } = felt;
  const h = hashId(felt.id);
  const a = 18 + (h % 14);
  const b = 72 + (h % 16);

  return [
    `radial-gradient(ellipse 34% 28% at ${a}% 32%, ${shiftHex(inner, 10)}66 0%, transparent 72%)`,
    `radial-gradient(ellipse 28% 22% at ${b}% 58%, ${shiftHex(outer, -8)}55 0%, transparent 68%)`,
    `radial-gradient(ellipse 22% 18% at 52% 78%, rgba(0,0,0,0.14) 0%, transparent 70%)`,
    `radial-gradient(ellipse 30% 24% at 38% 18%, rgba(255,255,255,0.07) 0%, transparent 65%)`,
    `radial-gradient(ellipse 40% 30% at 64% 44%, ${mid}33 0%, transparent 75%)`,
  ].join(", ");
}

/** Cached SVG noise — wool fuzz at fiber scale. */
let _fiberNoiseUrl;
export function getFeltFiberNoiseUrl() {
  if (_fiberNoiseUrl) return _fiberNoiseUrl;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
    <filter id='f'>
      <feTurbulence type='fractalNoise' baseFrequency='0.72 0.18' numOctaves='4' seed='8' stitchTiles='stitch' result='n'/>
      <feColorMatrix in='n' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(%23f)' opacity='0.9'/>
  </svg>`;
  _fiberNoiseUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return _fiberNoiseUrl;
}

/** Directional lamp + nap sheen (light catches fibers one way). */
export function getFeltLighting(felt, compact = false) {
  const h = hashId(felt?.id || "felt");
  const napAngle = 118 + (h % 28);
  const lampX = 46 + (h % 9);
  const lampStrength = compact ? 0.16 : 0.24;
  const napStrength = compact ? 0.1 : 0.14;

  return {
    overhead: {
      background: `radial-gradient(ellipse 68% 42% at ${lampX}% 10%, rgba(255,255,255,${lampStrength}) 0%, transparent 72%)`,
      mixBlendMode: "screen",
    },
    napSheen: {
      background: `linear-gradient(${napAngle}deg, rgba(255,255,255,${napStrength}) 0%, transparent 42%, rgba(0,0,0,0.08) 100%)`,
      mixBlendMode: "soft-light",
    },
    rim: {
      boxShadow:
        "inset 0 0 36px rgba(0,0,0,0.42), inset 0 5px 14px rgba(255,255,255,0.06), inset 0 -8px 18px rgba(0,0,0,0.38)",
    },
  };
}

/** Mahogany-style rail around the playing surface. */
export function getWoodRailStyle(compact = false) {
  return {
    background: `
      linear-gradient(155deg, #a0622a 0%, #6b3a14 22%, #4a240c 48%, #3a1c08 72%, #2a1406 100%)
    `,
    boxShadow: compact
      ? "0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,220,180,0.22), inset 0 -2px 4px rgba(0,0,0,0.35)"
      : "0 6px 22px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,220,180,0.25), inset 0 -3px 6px rgba(0,0,0,0.4)",
  };
}

export function getWoodGrainOverlay() {
  return {
    backgroundImage: `
      repeating-linear-gradient(92deg, rgba(255,220,180,0.07) 0 1px, transparent 1px 9px),
      repeating-linear-gradient(88deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 14px)
    `,
    opacity: 0.55,
    mixBlendMode: "overlay",
  };
}

/** Photo texture tint — shift green casino scan toward each felt color. */
function buildTextureFilter(felt, baseFilter) {
  const parts = [];
  const brightness = felt?.textureBrightness;
  const contrast = felt?.textureContrast;
  const saturate = felt?.textureSaturate;
  const blur = felt?.textureBlur ?? 0;

  if (brightness != null && brightness !== 1) parts.push(`brightness(${brightness})`);
  if (contrast != null && contrast !== 1) parts.push(`contrast(${contrast})`);
  if (saturate != null && saturate !== 1) parts.push(`saturate(${saturate})`);
  else if (baseFilter && baseFilter !== "none") parts.push(baseFilter);

  if (blur > 0) parts.push(`blur(${blur}px)`);
  return parts.length ? parts.join(" ") : "none";
}

export function getPhotoTextureStyle(felt, compact = false) {
  const id = felt?.id;
  if (isDedicatedPhotoFelt(id)) {
    return dedicatedPhotoStyle(compact, felt);
  }

  const hueMap = {
    royal_blue: "hue-rotate(185deg) saturate(1.1)",
    crimson_red: "hue-rotate(255deg) saturate(1.15)",
    midnight_black: "saturate(0.15) brightness(0.55) contrast(1.2)",
    burgundy: "hue-rotate(290deg) saturate(1.1)",
    forest_pine: "hue-rotate(15deg) saturate(0.9) brightness(0.92)",
    amethyst_purple: "hue-rotate(95deg) saturate(1.2)",
    graphite: "saturate(0) brightness(0.75) contrast(1.15)",
    ocean_teal: "hue-rotate(160deg) saturate(1.05)",
    sahara_sand: "hue-rotate(55deg) saturate(0.65) brightness(1.15)",
    obsidian_velvet: "saturate(0.12) brightness(0.5) contrast(1.25)",
    midnight_emerald: "hue-rotate(25deg) saturate(0.85) brightness(0.78)",
    rose_gold_noir: "hue-rotate(310deg) saturate(0.95) brightness(0.72)",
    sapphire_abyss: "hue-rotate(200deg) saturate(1.15) brightness(0.82)",
    blood_moon: "hue-rotate(270deg) saturate(1.2) brightness(0.75)",
    platinum_smoke: "saturate(0) brightness(0.7) contrast(1.1)",
    imperial_gold: "hue-rotate(40deg) saturate(0.9) brightness(0.88)",
    void_violet: "hue-rotate(85deg) saturate(1.15) brightness(0.78)",
    velvet_royal: "hue-rotate(100deg) saturate(1.25) brightness(0.8)",
  };

  const opacity = felt?.textureOpacity ?? (compact ? 0.72 : 0.58);
  const baseFilter = hueMap[id] || "saturate(0.85) contrast(1.05)";

  return {
    backgroundSize: photoBackgroundSize(felt, compact),
    backgroundPosition: photoBackgroundPosition(felt),
    backgroundRepeat: "no-repeat",
    mixBlendMode: "multiply",
    opacity,
    filter: buildTextureFilter(felt, baseFilter),
    imageRendering: felt?.textureBlur > 0 ? "auto" : "-webkit-optimize-contrast",
  };
}

/** Themed felts still sit on cloth — subtle grain underneath. */
export function getThemedFabricUnderlayOpacity(feltId) {
  if (isDedicatedPhotoFelt(feltId)) return 0;
  if (isFabricFelt(feltId)) return 1;
  return 0.22;
}
