/** Visual styles for dice the player has selected (held) for scoring. */

export const HELD_STYLE_CATEGORY = {
  FAVORITE: "favorite",
  PORTFOLIO: "portfolio",
  LEGACY: "legacy",
};

export const HELD_DICE_STYLES = [
  // —— Favorites (styles you already liked) ——
  {
    id: "amber_glow",
    label: "Amber Glow",
    description: "Warm gold bloom wraps the whole die — high visibility",
    category: HELD_STYLE_CATEGORY.FAVORITE,
  },
  {
    id: "neon_cyan",
    label: "Neon Ring",
    description: "Sharp cyan outline with a soft outer halo",
    category: HELD_STYLE_CATEGORY.FAVORITE,
  },
  {
    id: "gold_aura",
    label: "Gold Aura",
    description: "Layered golden halo that breathes in and out",
    category: HELD_STYLE_CATEGORY.FAVORITE,
  },
  {
    id: "electric_violet",
    label: "Violet Spark",
    description: "Purple energy field with corner sparks",
    category: HELD_STYLE_CATEGORY.FAVORITE,
  },

  // —— Portfolio concepts ——
  {
    id: "emerald_pulse",
    label: "Emerald Pulse",
    description: "Casino-table green bloom with a steady heartbeat",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "ruby_flame",
    label: "Ruby Flame",
    description: "Crimson rim with flickering hot-edge tongues",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "ice_frost",
    label: "Ice Frost",
    description: "Crystalline white-blue rim and cold inner shimmer",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "rose_chroma",
    label: "Rose Chroma",
    description: "Soft magenta bloom — romantic and readable",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "sunset_warmth",
    label: "Sunset Warmth",
    description: "Peach-to-coral gradient halo like golden hour",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "toxic_pulse",
    label: "Toxic Pulse",
    description: "Radioactive green with a subtle scanline flicker",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "molten_core",
    label: "Molten Core",
    description: "Deep magma glow radiating from the center",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "holo_shift",
    label: "Holo Shift",
    description: "Iridescent rim cycling rainbow hues",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "plasma_blue",
    label: "Plasma Blue",
    description: "Electric blue plasma swirl behind the die",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "copper_rim",
    label: "Copper Rim",
    description: "Warm metallic copper band with soft reflection",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "sapphire_glow",
    label: "Sapphire Glow",
    description: "Deep royal blue layered halos",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "white_hot",
    label: "White Hot",
    description: "Intense white core bloom — maximum pop",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "void_edge",
    label: "Void Edge",
    description: "Dark purple rim with a faint inner starlight",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "matrix_green",
    label: "Matrix Green",
    description: "Digital green edge with code-like flicker",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "coral_bloom",
    label: "Coral Bloom",
    description: "Soft coral wrap — friendly and warm",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "dual_ring",
    label: "Dual Ring",
    description: "Gold inner ring + cyan outer ring in counterphase",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "sonar_ping",
    label: "Sonar Ping",
    description: "Expanding ring pulse radiating outward",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "chroma_split",
    label: "Chroma Split",
    description: "RGB-offset spectral edge — glitchy highlight",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "orbit_sparks",
    label: "Orbit Sparks",
    description: "Tiny particles circling the die like a magnetic field",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "laser_scan",
    label: "Laser Scan",
    description: "Horizontal scan beam sweeps across the face",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },

  // —— Legacy (kept for saved profiles) ——
  {
    id: "lightning",
    label: "Lightning",
    description: "Electric arcs crackle around every edge",
    category: HELD_STYLE_CATEGORY.LEGACY,
  },
  {
    id: "corner_badge",
    label: "Corner Badge",
    description: "Original small checkmark in the corner",
    category: HELD_STYLE_CATEGORY.LEGACY,
  },
];

export const DEFAULT_HELD_DICE_STYLE = "amber_glow";

export const HELD_STYLE_SECTIONS = [
  {
    id: "favorites",
    title: "Your favorites",
    subtitle: "Styles you already liked — ready to use",
    category: HELD_STYLE_CATEGORY.FAVORITE,
  },
  {
    id: "portfolio",
    title: "Portfolio concepts",
    subtitle: "Pick ideas you like — we can refine or combine them",
    category: HELD_STYLE_CATEGORY.PORTFOLIO,
  },
  {
    id: "legacy",
    title: "Older options",
    subtitle: "Still here if saved on your profile",
    category: HELD_STYLE_CATEGORY.LEGACY,
  },
];

export function getHeldDiceStyle(id) {
  return HELD_DICE_STYLES.find((s) => s.id === id) ?? HELD_DICE_STYLES[0];
}

export function isValidHeldDiceStyle(id) {
  return HELD_DICE_STYLES.some((s) => s.id === id);
}

export function getHeldStylesByCategory(category) {
  return HELD_DICE_STYLES.filter((s) => s.category === category);
}
