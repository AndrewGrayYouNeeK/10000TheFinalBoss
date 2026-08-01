// Static catalog of all purchasable cosmetics.
// Skins describe the die body. Pips describe the dots. Badges describe an animated player badge.

import { EXPERIMENTAL_DICE } from "./experimentalDice";
import { assetUrl } from "./assetUrl";
import { RAGNAROK_SPRITE_TUNING } from "./ragnarokSpriteTuning";
import { MATRIX_SPRITE_TUNING } from "./matrixSpriteTuning";
import { CRYSTAL_CUT_SPRITE_TUNING } from "./crystalCutSpriteTuning";
import { GALAXY_SPRITE_TUNING } from "./galaxySpriteTuning";
import { PAPER_SPRITE_TUNING } from "./paperSpriteTuning";
import { CLASSIC_WHITE_SPRITE_TUNING } from "./classicWhiteSpriteTuning";
import { DRAGON_SCALE_SPRITE_TUNING } from "./dragonScaleSpriteTuning";
import { FLUORITE_SPRITE_TUNING } from "./fluoriteSpriteTuning";
import { TEAL_CRACKLE_SPRITE_TUNING } from "./tealCrackleSpriteTuning";
import { AQUAMARINE_LIGHT_SPRITE_TUNING } from "./aquamarineLightSpriteTuning";
import { AQUAMARINE_SPRITE_TUNING } from "./aquamarineSpriteTuning";
import { BLUE_GEL_SPRITE_TUNING } from "./blueGelSpriteTuning";
import { WOOD_SPRITE_TUNING } from "./woodSpriteTuning";
import { SILVER_SPRITE_TUNING } from "./silverSpriteTuning";
import { CIRCUIT_BOARD_SPRITE_TUNING } from "./circuitBoardSpriteTuning";
import { CYBER_NEON_SPRITE_TUNING } from "./cyberNeonSpriteTuning";
import { OBSIDIAN_SPRITE_TUNING } from "./obsidianSpriteTuning";
import { LABRADORITE_SPRITE_TUNING } from "./labradoriteSpriteTuning";
import { LABRADORITE_POLISHED_SPRITE_TUNING } from "./labradoritePolishedSpriteTuning";
import { LOVE_IS_LOVE_SPRITE_TUNING } from "./loveIsLoveSpriteTuning";
import { GOLD_SPRITE_TUNING } from "./goldSpriteTuning";
import { MOONSTONE_SPRITE_TUNING } from "./moonstoneSpriteTuning";
import { NEON_GRID_SPRITE_TUNING } from "./neonGridSpriteTuning";
import { PLASMA_SPRITE_TUNING } from "./plasmaSpriteTuning";
import { PRIDE_SPRITE_TUNING } from "./prideSpriteTuning";
import { TOXIC_PLASMA_V2_SPRITE_TUNING } from "./toxicPlasmaV2SpriteTuning";
import { RUBY_SPRITE_TUNING } from "./rubySpriteTuning";
import { AMBER_WASP_SPRITE_TUNING } from "./amberWaspSpriteTuning";
import { AMETHYST_SPRITE_TUNING } from "./amethystSpriteTuning";
import { loadSpriteLabDraft, mergeSpriteLabFaceOffsets, isSpriteTuningLocked } from "./spriteLab";

export const PRODUCTION_DICE_SKINS = [
  {
    id: "classic_white",
    name: "Classic White",
    price: 0,
    gradient: "from-white via-white to-gray-100",
    border: "border-gray-200",
    pipColor: "bg-gray-900",
    glow: "",
    description: "The original. Timeless.",
    realistic: true,
    spriteUrl: "/assets/e3c042b9e_hPLMjJ1wVsJG0mW-UisgC_GgpVeRAE.png",
    ...CLASSIC_WHITE_SPRITE_TUNING,
  },
  {
    id: "ragnarok",
    name: "Ragnarok",
    price: 600,
    gradient: "from-stone-800 via-red-900 to-black",
    border: "border-orange-800",
    pipColor: "bg-red-800",
    glow: "shadow-orange-500/70",
    description: "Stone dice that crack open with molten power — Hot Streak.",
    realistic: true,
    powerDice: true,
    spriteUrl: "/assets/ragnarok_regular_dice.png",
    powerSpriteUrl: "/assets/d21426962_XCSnTqF8nVT8rvkZYlH5g_BYlXoewC.png",
    ...RAGNAROK_SPRITE_TUNING,
  },
  {
    id: "obsidian",
    name: "Damascus",
    price: 150,
    gradient: "from-slate-700 via-slate-800 to-black",
    border: "border-slate-900",
    pipColor: "bg-white",
    glow: "shadow-black/60",
    description: "Forged steel patterns.",
    realistic: true,
    spriteUrl: "/assets/0aba8ef3e_3WGKngcFo6eWV9kOIGywM_0CERzNWO.png",
    ...OBSIDIAN_SPRITE_TUNING,
  },
  {
    id: "gold",
    name: "Molten Gold",
    price: 500,
    gradient: "from-yellow-200 via-amber-400 to-yellow-600",
    border: "border-amber-700",
    pipColor: "bg-slate-900",
    glow: "shadow-amber-400/70",
    description: "Liquid gold, poured and set.",
    realistic: true,
    spriteUrl: "/assets/cb5c77d90_WxvYf9qjMiU_V3CHnTzs-_DUPg67v2.png",
    ...GOLD_SPRITE_TUNING,
  },
  {
    id: "ice",
    name: "Frozen Ice",
    price: 350,
    gradient: "from-cyan-100 via-sky-300 to-blue-500",
    border: "border-sky-400",
    pipColor: "bg-white",
    glow: "shadow-sky-300/70",
    description: "Carved from a glacier — Score Freeze locks the opponent's banked score.",
    realistic: true,
    spriteUrl: "/assets/e66ae9a18_WKqr8v-gNKNdg_505xf6y_K3ZiqoBX.png",
  },
  {
    id: "wood",
    name: "Burl Wood",
    price: 300,
    gradient: "from-amber-700 via-amber-800 to-amber-950",
    border: "border-amber-950",
    pipColor: "bg-amber-950",
    glow: "shadow-amber-900/60",
    description: "Old-school heirloom.",
    realistic: true,
    spriteUrl: "/assets/228200ce8_ATRoh-oyklhfyDNGiNUns_8aPlZmR3.png",
    ...WOOD_SPRITE_TUNING,
  },
  {
    id: "silver",
    name: "Chrome Silver",
    price: 550,
    gradient: "from-slate-200 via-slate-400 to-slate-600",
    border: "border-slate-500",
    pipColor: "bg-slate-900",
    glow: "shadow-slate-400/70",
    description: "Polished to a mirror finish.",
    realistic: true,
    spriteUrl: "/assets/b736d9909_XLGcJr6bRUs-pTA6-8I3W_BSiKR6Eb.png",
    ...SILVER_SPRITE_TUNING,
  },
  {
    id: "galaxy",
    name: "Galaxy",
    price: 750,
    gradient: "from-indigo-950 via-violet-900 to-slate-950",
    border: "border-purple-900",
    pipColor: "bg-white",
    glow: "shadow-fuchsia-500/60",
    description: "Cosmic energy.",
    realistic: true,
    spriteUrl: "/assets/galaxy_dice_blackhole.png",
    ...GALAXY_SPRITE_TUNING,
  },
  {
    id: "dragon_scale",
    name: "Dragon Scale",
    price: 700,
    gradient: "from-teal-300 via-emerald-400 to-cyan-600",
    border: "border-emerald-700",
    pipColor: "bg-slate-900",
    glow: "shadow-emerald-400/70",
    description: "Iridescent dragon hide.",
    realistic: true,
    spriteUrl: "/assets/0b8e61811_XeN1JIPeKj6ML7YQ3gk99_VqSR7BSl.png",
    ...DRAGON_SCALE_SPRITE_TUNING,
  },
  {
    id: "amethyst",
    name: "Amethyst",
    price: 400,
    gradient: "from-purple-300 via-purple-500 to-purple-800",
    border: "border-purple-900",
    pipColor: "bg-white",
    glow: "shadow-purple-500/60",
    description: "Royal crystal.",
    realistic: true,
    spriteUrl: "/assets/7b99943e9_387TtzBbla0juqzqDSGfg_FgHZypft.png",
    ...AMETHYST_SPRITE_TUNING,
  },
  {
    id: "moonstone",
    name: "Moonstone",
    price: 450,
    gradient: "from-slate-100 via-blue-100 to-indigo-200",
    border: "border-indigo-200",
    pipColor: "bg-slate-400",
    glow: "shadow-indigo-200/70",
    description: "Iridescent shimmer.",
    realistic: true,
    spriteUrl: "/assets/09a488969_Ub3rBdwrMd_RZcipohKxd_EQnQspfS1.png",
    ...MOONSTONE_SPRITE_TUNING,
  },
  {
    id: "teal_crackle",
    name: "Antarctic Blue Ice",
    price: 450,
    gradient: "from-cyan-200 via-teal-300 to-cyan-500",
    border: "border-cyan-400",
    pipColor: "bg-slate-900",
    glow: "shadow-cyan-300/70",
    description: "Crystalline teal ice.",
    realistic: true,
    spriteUrl: "/assets/ea849396a_4grOkW27dXAMMIWio02qb_XCcgJ8xy.png",
    ...TEAL_CRACKLE_SPRITE_TUNING,
  },
  {
    id: "fluorite",
    name: "Alexandrite",
    price: 550,
    gradient: "from-emerald-300 via-purple-400 to-emerald-600",
    border: "border-purple-700",
    pipColor: "bg-slate-900",
    glow: "shadow-purple-400/70",
    description: "Color-shifting crystal.",
    realistic: true,
    spriteUrl: "/assets/8a42482c0_1smJEOhdbLDK2gpXtyFY-_ziAmwBIP.png",
    ...FLUORITE_SPRITE_TUNING,
  },
  {
    id: "aquamarine",
    name: "Aquamarine",
    price: 500,
    gradient: "from-sky-100 via-sky-200 to-blue-300",
    border: "border-sky-300",
    pipColor: "bg-slate-900",
    glow: "shadow-sky-200/70",
    description: "Pale blue gem.",
    realistic: true,
    spriteUrl: "/assets/397f4c284_8KTW9qvIkitDTb0vG9fhu_7KfGY6c1.png",
    ...AQUAMARINE_SPRITE_TUNING,
  },
  {
    id: "aquamarine_light",
    name: "Aquamarine Ice",
    price: 500,
    gradient: "from-sky-100 via-cyan-200 to-sky-300",
    border: "border-sky-300",
    pipColor: "bg-white",
    glow: "shadow-sky-200/70",
    description: "Frozen crystal with snow pips.",
    realistic: true,
    spriteUrl: "/assets/1c7906a81_Hu7h97ueIT2Jwptn9FZ7__7kNv8V4L1.png",
    ...AQUAMARINE_LIGHT_SPRITE_TUNING,
  },
  {
    id: "labradorite",
    name: "Labradorite",
    price: 800,
    gradient: "from-slate-700 via-indigo-700 to-slate-900",
    border: "border-indigo-900",
    pipColor: "bg-slate-800",
    glow: "shadow-indigo-500/60",
    description: "Iridescent flash stone.",
    realistic: true,
    spriteUrl: "/assets/e7485697f_Iy2qPWFYEYP6icK_sajWf_y69Q9Qql.png",
    ...LABRADORITE_SPRITE_TUNING,
  },
  {
    id: "labradorite_polished",
    name: "Labradorite Polished",
    price: 850,
    gradient: "from-slate-600 via-indigo-600 to-slate-800",
    border: "border-indigo-800",
    pipColor: "bg-slate-900",
    glow: "shadow-indigo-400/70",
    description: "Mirror-polished flash stone.",
    realistic: true,
    spriteUrl: "/assets/738791fb4_O3cR7UnvvpKR87_KhcSDr_5BxDZrw1.png",
    ...LABRADORITE_POLISHED_SPRITE_TUNING,
  },
  {
    id: "pride",
    name: "Pride",
    price: 500,
    gradient: "from-red-500 via-yellow-400 to-purple-600",
    border: "border-purple-700",
    pipColor: "bg-slate-900",
    glow: "shadow-purple-400/60",
    description: "Roll with pride.",
    realistic: true,
    spriteUrl: "/assets/20ba5f935_W1EDolVpb0uw1QghqIvI0_o4ooSDC4.png",
    ...PRIDE_SPRITE_TUNING,
  },
  {
    id: "ruby",
    name: "Ruby",
    price: 900,
    gradient: "from-red-400 via-red-600 to-red-900",
    border: "border-red-900",
    pipColor: "bg-white",
    glow: "shadow-red-500/70",
    description: "Translucent crimson gem.",
    realistic: true,
    spriteUrl: "/assets/95bd85fb4_RdaZRnY8n4MYNGmhbire2_jIN9S0Pd.png",
    ...RUBY_SPRITE_TUNING,
  },
  {
    id: "crystal_cut",
    name: "Diamond Cut",
    price: 2000,
    gradient: "from-cyan-100 via-white to-sky-200",
    border: "border-cyan-200",
    pipColor: "bg-black",
    glow: "shadow-cyan-300/80",
    description: "Brilliant faceted crystal. The legendary tier.",
    realistic: true,
    spriteUrl: "/assets/823a86262_zIRb81kXhGo3xU-pd4xpr_yf8rZsgh.png",
    ...CRYSTAL_CUT_SPRITE_TUNING,
  },
  {
    id: "love_is_love",
    name: "Love Is Love",
    price: 1500,
    gradient: "from-pink-200 via-purple-200 to-cyan-200",
    border: "border-purple-300",
    pipColor: "bg-slate-900",
    glow: "shadow-pink-400/70",
    description: "Prismatic crystal — love is love.",
    realistic: true,
    spriteUrl: "/assets/1f8e20d7a_Aefo3mZm6pYMmwcs9AaPi_cY70s0I3.png",
    ...LOVE_IS_LOVE_SPRITE_TUNING,
  },
  {
    id: "paper",
    name: "Prison Dice",
    price: 250,
    gradient: "from-stone-100 via-stone-200 to-stone-300",
    border: "border-stone-400",
    pipColor: "bg-slate-900",
    glow: "shadow-stone-300/60",
    description: "Hand-rolled behind bars.",
    realistic: true,
    spriteUrl: "/assets/f059af972_CLC6gYkVPlWgxZQOsp_68_4WosypFv.png",
    ...PAPER_SPRITE_TUNING,
  },
  {
    id: "neon_grid",
    name: "Neon Grid",
    price: 1100,
    gradient: "from-slate-800 via-slate-900 to-black",
    border: "border-fuchsia-700",
    pipColor: "bg-slate-900",
    glow: "shadow-fuchsia-500/70",
    description: "Cyberpunk geometry.",
    realistic: true,
    spriteUrl: "/assets/1faa6e66a_4sGTKX3C3u5uBHFW6rhKC_oVYyNtwY.png",
    ...NEON_GRID_SPRITE_TUNING,
  },
  {
    id: "circuit_board",
    name: "Circuit Board",
    price: 700,
    gradient: "from-slate-400 via-slate-500 to-slate-700",
    border: "border-sky-500",
    pipColor: "bg-sky-400",
    glow: "shadow-sky-500/70",
    description: "Glowing electric traces.",
    realistic: true,
    spriteUrl: "/assets/7ef629a61_N1Mwm3MTe-edyuydevqG6_9LLwCe6C.png",
    ...CIRCUIT_BOARD_SPRITE_TUNING,
  },
  {
    id: "amber_wasp",
    name: "Amber Wasp",
    price: 850,
    gradient: "from-yellow-300 via-amber-500 to-orange-700",
    border: "border-amber-800",
    pipColor: "bg-slate-700",
    glow: "shadow-amber-500/70",
    description: "Prehistoric wasp frozen in amber.",
    realistic: true,
    spriteUrl: "/assets/ed83ab294_PFl9loYMeN6_jAsrcx6Ah_o55139sM.png",
    ...AMBER_WASP_SPRITE_TUNING,
  },
  {
    id: "toxic_plasma_v2",
    name: "Radiation",
    price: 1400,
    gradient: "from-green-400 via-purple-700 to-emerald-900",
    border: "border-emerald-600",
    pipColor: "bg-amber-500",
    glow: "shadow-emerald-500/70",
    description: "Radioactive plasma containment.",
    realistic: true,
    spriteUrl: "/assets/73270979c_AEVwA3ZnKA53oXNB1kVpd_lBugstGt.png",
    ...TOXIC_PLASMA_V2_SPRITE_TUNING,
  },
  {
    id: "matrix",
    name: "Matrix",
    price: 1200,
    gradient: "from-slate-900 via-black to-slate-950",
    border: "border-green-600",
    pipColor: "bg-green-400",
    glow: "shadow-green-500/70",
    description: "Follow the white rabbit.",
    realistic: true,
    powerDice: true,
    spriteUrl: "/assets/matrix_dice.png",
    ...MATRIX_SPRITE_TUNING,
  },
  {
    id: "snow_globe",
    name: "Snow Globe",
    price: 400,
    gradient: "from-sky-100 via-sky-200 to-blue-300",
    border: "border-sky-300",
    pipColor: "bg-white",
    glow: "shadow-sky-200/70",
    description: "A winter scene in glass.",
    realistic: true,
  },
  {
    id: "blue_gel",
    name: "Blue Gel",
    price: 400,
    gradient: "from-sky-300 via-blue-400 to-blue-600",
    border: "border-blue-500",
    pipColor: "bg-white",
    glow: "shadow-blue-400/60",
    description: "Marlin Joe's fish-tank dice — Shark Bite eats the opponent's next bank.",
    realistic: true,
    powerDice: true,
    spriteUrl: "/assets/999d8760b_generated_image.png",
    spriteGrid: { cols: 3, rows: 2 },
    ...BLUE_GEL_SPRITE_TUNING,
  },
  {
    id: "plasma",
    name: "Plasma Ball",
    price: 1100,
    gradient: "from-pink-400 via-pink-500 to-rose-600",
    border: "border-pink-500",
    pipColor: "bg-white",
    glow: "shadow-fuchsia-500/70",
    description: "Live plasma energy.",
    realistic: true,
    spriteUrl: "/assets/2557270d2_25tUwCJ15TdeszFvoq7X3_u7DNsem8.png",
    ...PLASMA_SPRITE_TUNING,
  },
  {
    id: "cyber_neon",
    name: "Cyber Neon",
    price: 0,
    gradient: "from-slate-950 via-black to-slate-950",
    border: "border-fuchsia-500",
    pipColor: "bg-fuchsia-400",
    glow: "shadow-fuchsia-500/80",
    description: "Hot pink & cyan neon cyberpunk dice.",
    preview: true,
    realistic: true,
    spriteUrl: "/assets/1faa6e66a_4sGTKX3C3u5uBHFW6rhKC_oVYyNtwY.png",
    spriteGrid: { cols: 3, rows: 2 },
    ...CYBER_NEON_SPRITE_TUNING,
  },
];

/** Shop dice sections */
export const SHOP_DICE_CATEGORIES = [
  { id: "regular", label: "Regular", blurb: "Classic, gold, chrome & prison dice" },
  { id: "power", label: "Power", blurb: "Secret powers — charge on your 1st Hot Dice" },
  { id: "gemstone", label: "Gemstones", blurb: "Gems, materials & standard sets" },
  { id: "exotic", label: "Exotic", blurb: "Cosmic, tech, themed & wild" },
];

const REGULAR_SKIN_IDS = new Set([
  "classic_white",
  "gold",
  "silver",
  "paper",
]);

const POWER_SKIN_IDS = new Set([
  "ragnarok",
]);

const GEMSTONE_SKIN_IDS = new Set([
  "obsidian",
  "ice",
  "wood",
  "amethyst",
  "moonstone",
  "teal_crackle",
  "fluorite",
  "aquamarine",
  "aquamarine_light",
  "labradorite",
  "labradorite_polished",
  "pride",
  "ruby",
  "crystal_cut",
  "love_is_love",
  "cyber_neon",
]);

const EXOTIC_SKIN_IDS = new Set([
  "amber_wasp",
  "galaxy",
  "dragon_scale",
  "neon_grid",
  "circuit_board",
  "toxic_plasma_v2",
  "matrix",
  "plasma",
  "blue_gel",
  "snow_globe",
]);

export function getSkinShopCategory(skinId) {
  if (REGULAR_SKIN_IDS.has(skinId)) return "regular";
  if (POWER_SKIN_IDS.has(skinId)) return "power";
  if (EXOTIC_SKIN_IDS.has(skinId)) return "exotic";
  if (GEMSTONE_SKIN_IDS.has(skinId)) return "gemstone";
  return "regular";
}

/** Production shop skins + experimental custom dice (mystery box / preview lab). */
export const DICE_SKINS = [...PRODUCTION_DICE_SKINS, ...EXPERIMENTAL_DICE];

export const PRODUCTION_DICE_IDS = PRODUCTION_DICE_SKINS.map((s) => s.id);

/** Granted on a Perfect 10,000 (six-of-a-kind @ 1:10,000 odds). */
export const PERFECT_TENK_REWARD = {
  skinId: "crystal_cut",
  badgeId: "level_50",
};

// Coin packs — direct-buy alternative for players who don't want to grind.
// 100 Gray Quarters (GQ) = $1. Larger packs include bonus GQs.
export const COIN_PACKS = [
  { id: "pack_starter", name: "Starter", coins: 400, emoji: "🎲" },
  { id: "pack_boost", name: "Boost", coins: 1100, emoji: "💰", popular: true },
  { id: "pack_mega", name: "Mega", coins: 2500, emoji: "💎" },
  { id: "pack_ultra", name: "Ultra", coins: 6000, emoji: "👑" },
  { id: "pack_epic", name: "Epic", coins: 15000, emoji: "🏆" },
  { id: "pack_legend", name: "Legend", coins: 175000, emoji: "🌟" },
];

// Table felt colors. `inner`, `mid`, `outer` define the radial gradient stops.
// `border` is the wooden/edge border color class.
export const FELT_COLORS = [
  {
    id: "classic_green",
    name: "Classic Green",
    price: 0,
    inner: "#3ea863",
    mid: "#2f8b4f",
    outer: "#226a3b",
    border: "border-amber-900/70",
    description: "Traditional casino felt.",
    textureUrl: "/assets/felt_green_mat.png",
  },
  {
    id: "royal_blue",
    name: "Royal Blue",
    price: 200,
    inner: "#5a8ee0",
    mid: "#3d6dbf",
    outer: "#264f94",
    border: "border-amber-900/70",
    description: "Cool, regal, and crisp.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "crimson_red",
    name: "Crimson Red",
    price: 250,
    inner: "#d4625f",
    mid: "#a83a3a",
    outer: "#7d2424",
    border: "border-amber-900/70",
    description: "Bold and dramatic.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "midnight_black",
    name: "Midnight",
    price: 300,
    inner: "#5a5a66",
    mid: "#3a3a44",
    outer: "#22222a",
    border: "border-amber-900/70",
    description: "After-hours luxury.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "burgundy",
    name: "Burgundy",
    price: 350,
    inner: "#a04458",
    mid: "#7a2a3c",
    outer: "#561c2a",
    border: "border-amber-900/70",
    description: "Vintage gentlemen's club.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "forest_pine",
    name: "Forest Pine",
    price: 250,
    inner: "#4a8a5d",
    mid: "#2d5a3d",
    outer: "#1f4029",
    border: "border-amber-900/70",
    description: "Deep, earthy green.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "amethyst_purple",
    name: "Amethyst",
    price: 400,
    inner: "#9670d8",
    mid: "#6b46b8",
    outer: "#4d2f8a",
    border: "border-amber-900/70",
    description: "Mystic violet.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "graphite",
    name: "Graphite",
    price: 300,
    inner: "#7a7e86",
    mid: "#5a5e66",
    outer: "#3c4046",
    border: "border-amber-900/70",
    description: "Modern industrial gray.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "ocean_teal",
    name: "Ocean Teal",
    price: 350,
    inner: "#3fb0b0",
    mid: "#1f8a8a",
    outer: "#136767",
    border: "border-amber-900/70",
    description: "Deep sea calm.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "sahara_sand",
    name: "Sahara Sand",
    price: 300,
    inner: "#d5aa7a",
    mid: "#b58a5a",
    outer: "#8a6440",
    border: "border-amber-900/70",
    description: "Warm desert tones.",
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  // ---- Premium Felts (8) ----
  {
    id: "obsidian_velvet",
    name: "Obsidian Velvet",
    price: 800,
    inner: "#2a2a32",
    mid: "#16161c",
    outer: "#08080c",
    border: "border-amber-900/70",
    description: "Deep black velvet with a faint sheen.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "midnight_emerald",
    name: "Midnight Emerald",
    price: 850,
    inner: "#1f5a4a",
    mid: "#0f3a30",
    outer: "#06201a",
    border: "border-amber-900/70",
    description: "Deep emerald with a moody hush.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "rose_gold_noir",
    name: "Rose Gold Noir",
    price: 1000,
    inner: "#7a3a48",
    mid: "#4a1f2a",
    outer: "#1f0d12",
    border: "border-amber-900/70",
    description: "Dusty rose gold over inky depth.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "sapphire_abyss",
    name: "Sapphire Abyss",
    price: 950,
    inner: "#2a4a8a",
    mid: "#152b5a",
    outer: "#06122e",
    border: "border-amber-900/70",
    description: "A bottomless sapphire well.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "blood_moon",
    name: "Blood Moon",
    price: 1100,
    inner: "#7a1f24",
    mid: "#42101a",
    outer: "#1c060c",
    border: "border-amber-900/70",
    description: "Crimson eclipse.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "platinum_smoke",
    name: "Platinum Smoke",
    price: 900,
    inner: "#5a5d68",
    mid: "#363943",
    outer: "#1a1c22",
    border: "border-amber-900/70",
    description: "Brushed metal under low light.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "imperial_gold",
    name: "Imperial Gold",
    price: 1300,
    inner: "#8a6420",
    mid: "#503816",
    outer: "#241808",
    border: "border-amber-900/70",
    description: "Antique gold over deep umber.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },
  {
    id: "void_violet",
    name: "Void Violet",
    price: 1050,
    inner: "#4a2a7a",
    mid: "#28154a",
    outer: "#0e061f",
    border: "border-amber-900/70",
    description: "Cosmic violet, swallowed by night.",
    premium: true,
    textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png",
  },

  // ===== 🌌 COSMIC / SCI-FI =====
  { id: "nebula",        name: "Nebula",        price: 1200, inner: "#c265d6", mid: "#5a2b9e", outer: "#1a0a3a", border: "border-amber-900/70", description: "Swirling galaxy clouds and twinkling stars.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "black_hole",    name: "Black Hole",    price: 1400, inner: "#1a1a24", mid: "#0a0a14", outer: "#000000", border: "border-amber-900/70", description: "Light bends and disappears.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "aurora",        name: "Aurora",        price: 1100, inner: "#5bf0c2", mid: "#1d8a8a", outer: "#0a2a4a", border: "border-amber-900/70", description: "Shimmering northern lights.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "holographic",   name: "Holographic",   price: 1500, inner: "#ff8ad6", mid: "#7fb6ff", outer: "#36205a", border: "border-amber-900/70", description: "Iridescent rainbow shift.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "quantum_foam",  name: "Quantum Foam",  price: 1250, inner: "#5ad7e0", mid: "#1f4a7a", outer: "#06101e", border: "border-amber-900/70", description: "Bubbling cyan particles on a void.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== ⚡ CYBERPUNK / NEON =====
  { id: "tron_grid",       name: "Tron Grid",       price: 1100, inner: "#1ce6ff", mid: "#0a4060", outer: "#020812", border: "border-amber-900/70", description: "Glowing cyan grid on the void.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "matrix_rain",     name: "Matrix Rain",     price: 1100, inner: "#3afa6a", mid: "#0a4a1a", outer: "#020a04", border: "border-amber-900/70", description: "ANDREW GRAY cascading down in green code rain.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "synthwave",       name: "Synthwave Sunset",price: 1200, inner: "#ff4a9e", mid: "#7a2a8a", outer: "#1a0a3a", border: "border-amber-900/70", description: "Retro 80s magenta horizon.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "circuit_board",   name: "Circuit Board",   price: 1000, inner: "#2ea860", mid: "#0e5028", outer: "#04140a", border: "border-amber-900/70", description: "PCB traces and solder joints.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "glitch",          name: "Glitch",          price: 1150, inner: "#ff2a6d", mid: "#1ce6ff", outer: "#0a0a14", border: "border-amber-900/70", description: "RGB-split scanline corruption.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== 🔥 ELEMENTAL =====
  { id: "lava_flow",     name: "Lava Flow",     price: 1100, inner: "#ff6a1e", mid: "#7a1f08", outer: "#0c0604", border: "border-amber-900/70", description: "Glowing magma cracks through black crust.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "frozen_lake",   name: "Frozen Lake",   price: 950,  inner: "#b8eafc", mid: "#5e9dc8", outer: "#1d3a5e", border: "border-amber-900/70", description: "Pale blue ice with frost.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "volcanic_ash",  name: "Volcanic Ash",  price: 900,  inner: "#5a4438", mid: "#2a201c", outer: "#0c0808", border: "border-amber-900/70", description: "Dark ash with drifting embers.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "storm_cloud",   name: "Storm Cloud",   price: 1050, inner: "#7a8a9e", mid: "#3a4250", outer: "#101418", border: "border-amber-900/70", description: "Heavy clouds and distant lightning.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "underwater",    name: "Underwater",    price: 1000, inner: "#3acce0", mid: "#0e5a8a", outer: "#04203a", border: "border-amber-900/70", description: "Caustic light on deep blue.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== 💎 LUXURY / PRESTIGE =====
  { id: "velvet_royal",      name: "Velvet Royal",       price: 1300, inner: "#6a2a7a", mid: "#3a1248", outer: "#1a061f", border: "border-amber-900/70", description: "Deep purple velvet with gold pinstripes.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "marble",            name: "Marble",             price: 1200, inner: "#e8e2d8", mid: "#a89c8a", outer: "#5a4e44", border: "border-amber-900/70", description: "White Carrara with gold veining.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "obsidian_glass",    name: "Obsidian Glass",     price: 1400, inner: "#1c1c24", mid: "#0c0c14", outer: "#020204", border: "border-amber-900/70", description: "Mirror-black volcanic glass.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "rose_gold_brushed", name: "Rose Gold Brushed",  price: 1350, inner: "#e6a89a", mid: "#a8685a", outer: "#5a2e28", border: "border-amber-900/70", description: "Brushed rose-gold radial sheen.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "casino_vip",        name: "Casino VIP",         price: 1500, inner: "#1a1a1c", mid: "#0a0a0c", outer: "#040404", border: "border-amber-900/70", description: "Black with gold filigree borders.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== 🎨 ARTISTIC =====
  { id: "van_gogh",      name: "Starry Night",  price: 1300, inner: "#fce070", mid: "#2a4a8a", outer: "#0a1a3a", border: "border-amber-900/70", description: "Impressionist swirls of blue and gold.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "stained_glass", name: "Stained Glass", price: 1250, inner: "#e64a4a", mid: "#3a6abe", outer: "#1a1a24", border: "border-amber-900/70", description: "Leaded panels of color.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "halftone",      name: "Comic Halftone",price: 1000, inner: "#ffe04a", mid: "#e63a4a", outer: "#1a1a24", border: "border-amber-900/70", description: "Lichtenstein dots and bold ink.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "watercolor",    name: "Watercolor Bloom",price: 1100, inner: "#f8b4d8", mid: "#a8c8f0", outer: "#5a5a8a", border: "border-amber-900/70", description: "Soft pink and blue washes.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== 🌿 NATURAL =====
  { id: "moss",            name: "Moss",            price: 800,  inner: "#5a8a3e", mid: "#2e5020", outer: "#0e1f08", border: "border-amber-900/70", description: "Lush forest moss.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "desert_dunes",    name: "Desert Dunes",    price: 850,  inner: "#e8c48a", mid: "#a87e44", outer: "#5a3e20", border: "border-amber-900/70", description: "Rippled sand under hot sun.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "cherry_blossom",  name: "Cherry Blossom",  price: 1100, inner: "#fbc4d8", mid: "#a85e84", outer: "#3a1a2a", border: "border-amber-900/70", description: "Soft pink petals on dark wood.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "forest_floor",    name: "Forest Floor",    price: 900,  inner: "#7a5a3e", mid: "#3e2c1c", outer: "#1a120a", border: "border-amber-900/70", description: "Leaves, pine needles, deep loam.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "ocean_wave",      name: "Ocean Wave",      price: 1000, inner: "#7adcea", mid: "#1e6a98", outer: "#082640", border: "border-amber-900/70", description: "Rolling foam crests.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== 🎮 THEMED =====
  { id: "pinball",         name: "Pinball Field",   price: 1200, inner: "#ff3a4a", mid: "#7a1a4a", outer: "#1a061a", border: "border-amber-900/70", description: "Bumpers, flippers, blinking lights.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "arcade_carpet",   name: "Arcade Carpet",   price: 1100, inner: "#ff4ad6", mid: "#1ce6ff", outer: "#0a0a3a", border: "border-amber-900/70", description: "That classic 80s arcade pattern.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "dungeon_stone",   name: "Dungeon Stone",   price: 950,  inner: "#6a6e76", mid: "#3a3e44", outer: "#16181c", border: "border-amber-900/70", description: "Moss-covered castle floor.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "spaceship_hull",  name: "Spaceship Hull",  price: 1150, inner: "#5a6470", mid: "#2a323c", outer: "#0c1014", border: "border-amber-900/70", description: "Riveted metal with warning stripes.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "casino_roulette", name: "Roulette Wheel",  price: 1100, inner: "#c43a3a", mid: "#1a1a1a", outer: "#040404", border: "border-amber-900/70", description: "Red-and-black wheel pattern.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== 🏆 ANIMATED / PREMIUM =====
  { id: "live_lightning",  name: "Live Lightning",  price: 1600, inner: "#bdd6ff", mid: "#3a4a8a", outer: "#0a0e1a", border: "border-amber-900/70", description: "Crackling bolts strike across the table.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "flowing_river",   name: "Flowing River",   price: 1300, inner: "#5acedc", mid: "#1c688a", outer: "#06243a", border: "border-amber-900/70", description: "Smooth river current.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "confetti_burst",  name: "Confetti Burst",  price: 1200, inner: "#ffe04a", mid: "#e64a9e", outer: "#1a1a3a", border: "border-amber-900/70", description: "Celebration pieces falling.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },
  { id: "phoenix_fire",    name: "Phoenix Fire",    price: 1500, inner: "#ffb43a", mid: "#c4341a", outer: "#3a0a08", border: "border-amber-900/70", description: "Flickering flames around the edges.", premium: true, textureUrl: "/assets/c668f8a5c_ziA4KOYCS_QY2BcnEzQGb_sNgQTA4n.png" },

  // ===== 🐺 FUR =====
  { id: "wolf_fur",        name: "Fur",             price: 1200, inner: "#a07a4a", mid: "#5a3a1e", outer: "#1a0e06", border: "border-amber-900/70", description: "Thick, wild pelt.", premium: true, textureUrl: "/assets/felt_brown_fur.png" },

  // ===== 📷 PHOTO FELTS =====
  {
    id: "green_wood",
    name: "Green & Wood",
    price: 500,
    inner: "#3ea863",
    mid: "#2f8b4f",
    outer: "#226a3b",
    border: "border-amber-900/70",
    description: "Classic green felt in a warm wood rail.",
    textureUrl: "/assets/felt_green_wood.png",
    includesFrame: true,
  },
  {
    id: "red_wood",
    name: "Red & Wood",
    price: 550,
    inner: "#d4625f",
    mid: "#a83a3a",
    outer: "#7d2424",
    border: "border-amber-900/70",
    description: "Crimson felt framed in polished wood.",
    textureUrl: "/assets/felt_red_frame.png",
    includesFrame: true,
  },
  {
    id: "galaxy_window",
    name: "Galaxy Window",
    price: 750,
    inner: "#6a4a9e",
    mid: "#3a2a6a",
    outer: "#120a28",
    border: "border-amber-900/70",
    description: "Deep-space nebula through a wood-framed window.",
    premium: true,
    textureUrl: "/assets/felt_galaxy_window.png",
    includesFrame: true,
  },
  {
    id: "tiedye_neon",
    name: "Tie-Dye Neon",
    price: 650,
    inner: "#5afa6a",
    mid: "#2a8a3a",
    outer: "#0a2a14",
    border: "border-amber-900/70",
    description: "Psychedelic tie-dye spiral in a polished wood rail.",
    premium: true,
    textureUrl: "/assets/felt_tiedye_spiral.png",
    includesFrame: true,
  },
  {
    id: "iridescent_frame",
    name: "Iridescent",
    price: 850,
    inner: "#c084fc",
    mid: "#6366f1",
    outer: "#1e1b4b",
    border: "border-amber-900/70",
    description: "Shifting rainbow shimmer in a wood frame.",
    premium: true,
    textureUrl: "/assets/felt_iridescent_frame.png",
    textureScale: 1.28,
    includesFrame: true,
  },
  {
    id: "golden_frame",
    name: "Golden Felt",
    price: 600,
    inner: "#d4a017",
    mid: "#a67c00",
    outer: "#5c4200",
    border: "border-amber-900/70",
    description: "Rich gold ochre felt with a warm wood rail.",
    premium: true,
    textureUrl: "/assets/felt_golden_frame.png",
    includesFrame: true,
  },
  {
    id: "stone_frame",
    name: "Stone & Wood",
    price: 700,
    inner: "#8a9098",
    mid: "#5a6068",
    outer: "#2a2e34",
    border: "border-amber-900/70",
    description: "Weathered grey stone inset in polished wood.",
    premium: true,
    textureUrl: "/assets/felt_stone_frame.png",
    includesFrame: true,
  },
];

// Level badges — IDs `level_1` … `level_100`. The badge you own = your current level.
// No tier categories — every level uses the same neon-cyan style.
export const BADGES = Array.from({ length: 100 }, (_, i) => {
  const level = i + 1;
  return {
    id: `level_${level}`,
    level,
    name: `Level ${level}`,
    price: 0,
    emoji: "⚡",
    color: "from-cyan-400 to-sky-600",
    description: `Reach Level ${level}.`,
    unlock: `Reach Level ${level}`,
    achievementOnly: true,
  };
});

export const RAGNAROK_LEGACY_SKIN_IDS = ["lava", "ragnarok_regular"];
const REMOVED_SKIN_IDS = ["tesla"];

export function normalizeSkinId(id) {
  if (REMOVED_SKIN_IDS.includes(id)) return "plasma";
  if (RAGNAROK_LEGACY_SKIN_IDS.includes(id)) return "ragnarok";
  return id;
}

/** Prefer locked snapshot zoom; fall back to catalog only when the lock has no zoom. */
function resolveLockedPowerVideoZoom(draftZoom, catalogZoom, locked) {
  if (!locked) return draftZoom ?? catalogZoom;
  if (draftZoom == null) return catalogZoom;
  return draftZoom;
}

/** Snow globe — custom Die.jsx overlay (no sprite face). Blue Gel uses sprite + fish tank. */
export const AQUARIUM_OVERLAY_SKIN_IDS = new Set(["snow_globe"]);

export const BLUE_GEL_SPRITE_URL = "/assets/999d8760b_generated_image.png";

function withBlueGelSpriteUrl(skin, base) {
  if (skin?.id !== "blue_gel") return skin;
  const url = base?.spriteUrl || BLUE_GEL_SPRITE_URL;
  return skin.spriteUrl === url ? skin : { ...skin, spriteUrl: url };
}

function withoutAquariumSpriteSheets(skin) {
  if (!AQUARIUM_OVERLAY_SKIN_IDS.has(skin?.id)) return skin;
  const next = { ...skin };
  delete next.spriteUrl;
  delete next.powerSpriteUrl;
  delete next.powerSpriteCrop;
  // Face is built in Die.jsx (fish/snow + borrowed Aquamarine shell) — never a video/sprite sheet die.
  delete next.videoUrl;
  delete next.powerVideoUrl;
  return next;
}

export function isAquariumOverlaySkinId(skinId) {
  return AQUARIUM_OVERLAY_SKIN_IDS.has(normalizeSkinId(skinId));
}

/** Active sprite sheet for a skin — regular by default, power sheet when charged. */
export function getSkinSpriteLayer(skin, { powerMode = false, allowPowerVideo = true } = {}) {
  if (!skin) return null;
  if (AQUARIUM_OVERLAY_SKIN_IDS.has(skin.id)) return null;
  if (powerMode && allowPowerVideo && skin.powerVideoUrl) return null;
  if (powerMode && skin.powerSpriteUrl) {
    return {
      spriteUrl: skin.powerSpriteUrl,
      spriteCrop: skin.powerSpriteCrop ?? skin.spriteCrop,
      offsetSkinId: skin.id,
      isPowerLayer: true,
    };
  }
  if (!skin.spriteUrl) return null;
  return {
    spriteUrl: skin.spriteUrl,
    spriteCrop: skin.spriteCrop,
    offsetSkinId: skin.id,
    isPowerLayer: false,
  };
}

export function skinHasPowerSprite(skin) {
  return !!skin?.powerSpriteUrl || !!skin?.powerVideoUrl;
}

/** Video URL for the current mode (power video when charged, else static videoUrl). */
export function getActiveVideoUrl(skin, { powerMode = false, allowPowerVideo = true } = {}) {
  if (!skin) return null;
  if (AQUARIUM_OVERLAY_SKIN_IDS.has(skin.id)) return null;
  if (powerMode && allowPowerVideo && skin.powerVideoUrl) return skin.powerVideoUrl;
  if (!powerMode && skin.videoUrl) return skin.videoUrl;
  return null;
}

function applyLockedSpritePaths(skin, draft, locked) {
  if (!locked || !draft) return skin;
  // Old lock snapshots may still carry sprite paths — aquarium skins never use them.
  if (AQUARIUM_OVERLAY_SKIN_IDS.has(skin?.id)) return skin;
  const next = { ...skin };
  // Regular + power sprite sheets always follow catalog — lock stores crop/face tuning only.
  // (Stale locks once pointed cyber_neon / ragnarok power at the wrong gameplay PNG.)
  if (typeof draft.powerVideoUrl === "string" && draft.powerVideoUrl) next.powerVideoUrl = draft.powerVideoUrl;
  if (typeof draft.videoUrl === "string" && draft.videoUrl) next.videoUrl = draft.videoUrl;
  return next;
}

export function getSkin(id) {
  const base = DICE_SKINS.find((s) => s.id === normalizeSkinId(id)) || DICE_SKINS[0];

  const draft = loadSpriteLabDraft(base.id);
  const locked = isSpriteTuningLocked(base.id);
  const skin = withBlueGelSpriteUrl(
    withoutAquariumSpriteSheets(applyLockedSpritePaths(base, draft, locked)),
    base,
  );
  if (!draft) return skin;
  const mergeRegular = (offsetsBase) =>
    draft.regularFaces
      ? mergeSpriteLabFaceOffsets(offsetsBase, draft.regularFaces, { fullReplace: locked })
      : offsetsBase;
  const mergePower = (offsetsBase) =>
    draft.powerFaces
      ? mergeSpriteLabFaceOffsets(offsetsBase, draft.powerFaces, { fullReplace: locked })
      : offsetsBase;

  if (skin.id === "matrix") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      powerVideoZoom: draft.powerVideoZoom ?? skin.powerVideoZoom,
      powerVideoCrop: draft.powerVideoCrop ?? skin.powerVideoCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
        power: mergePower(skin.spriteFaceOffsets?.power),
      },
    };
  }

  if (skin.id === "crystal_cut") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      powerVideoZoom: resolveLockedPowerVideoZoom(draft.powerVideoZoom, skin.powerVideoZoom, locked),
      powerVideoCrop: draft.powerVideoCrop ?? skin.powerVideoCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
        power: mergePower(skin.spriteFaceOffsets?.power),
      },
    };
  }

  if (skin.id === "ice") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
        power: mergePower(skin.spriteFaceOffsets?.power),
      },
    };
  }

  if (skin.id === "ragnarok") {
    return {
      ...skin,
      spriteUrl: base.spriteUrl,
      powerSpriteUrl: base.powerSpriteUrl,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      powerSpriteCrop: draft.powerCrop ?? skin.powerSpriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
        power: mergePower(skin.spriteFaceOffsets?.power),
      },
    };
  }

  if (skin.id === "galaxy") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "fluorite") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "amber_wasp") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "amethyst") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "moonstone") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "classic_white") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "paper") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "love_is_love") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "dragon_scale") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "teal_crackle") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "aquamarine_light") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "aquamarine") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "wood") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "obsidian") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "gold") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "labradorite") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "labradorite_polished") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "silver") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "circuit_board") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "cyber_neon") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "neon_grid") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "plasma") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "pride") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "toxic_plasma_v2") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "ruby") {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
      },
    };
  }

  if (skin.id === "blue_gel") {
    // Face crop comes from catalog tuning — stale sprite-lab drafts used aquamarine shell crops.
    return withBlueGelSpriteUrl(
      {
        ...skin,
        spriteSheetSize: base.spriteSheetSize ?? BLUE_GEL_SPRITE_TUNING.spriteSheetSize,
        spriteCrop: base.spriteCrop ?? BLUE_GEL_SPRITE_TUNING.spriteCrop,
        spriteFaceOffsets: {
          ...skin.spriteFaceOffsets,
          regular: mergeRegular(skin.spriteFaceOffsets?.regular),
          power: mergePower(skin.spriteFaceOffsets?.power),
        },
      },
      base,
    );
  }

  if (skin.spriteCrop) {
    return {
      ...skin,
      spriteCrop: draft.regularCrop ?? skin.spriteCrop,
      powerVideoZoom: draft.powerVideoZoom ?? skin.powerVideoZoom,
      spriteFaceOffsets: {
        ...skin.spriteFaceOffsets,
        regular: mergeRegular(skin.spriteFaceOffsets?.regular),
        power: mergePower(skin.spriteFaceOffsets?.power),
      },
    };
  }

  return withBlueGelSpriteUrl(withoutAquariumSpriteSheets(skin), base);
}
export function getBadge(id) {
  return BADGES.find(b => b.id === id) || null;
}
export function getFelt(id) {
  return FELT_COLORS.find(f => f.id === id) || FELT_COLORS[0];
}

/**
 * Returns inline styles to crop the correct face from a skin's sprite sheet.
 * Assumes the sprite sheet is a 3-column × 2-row grid of faces (values 1–6).
 */
export function getSpriteStyle(skin, value, size) {
  if (!skin?.spriteUrl) return null;
  const cols = skin.spriteGrid?.cols ?? 3;
  const rows = skin.spriteGrid?.rows ?? 2;
  const col = (value - 1) % cols;
  const row = Math.floor((value - 1) / cols);
  const url = assetUrl(skin.spriteUrl);
  const posX = cols <= 1 ? "0%" : `${(col / (cols - 1)) * 100}%`;
  const posY = rows <= 1 ? "0%" : `${(row / (rows - 1)) * 100}%`;
  const zoom = skin.spriteCrop?.zoom ?? 1;
  const offsetYPx = skin.spriteCrop?.offsetY ? size * skin.spriteCrop.offsetY : 0;

  return {
    width: size,
    height: size,
    backgroundImage: `url("${url}")`,
    backgroundSize: `${cols * 100 * zoom}% ${rows * 100 * zoom}%`,
    backgroundPosition: offsetYPx
      ? `${posX} calc(${posY} - ${offsetYPx}px)`
      : `${posX} ${posY}`,
    backgroundRepeat: "no-repeat",
  };
}