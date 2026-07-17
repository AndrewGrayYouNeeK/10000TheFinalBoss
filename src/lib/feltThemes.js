/** Visual theme key for procedural felt overlays (see FeltThemeOverlay). */
export function getFeltTheme(feltId) {
  const themes = {
    classic_green: "casino",
    forest_pine: "forest",

    obsidian_velvet: "velvet",
    velvet_royal: "velvet",
    rose_gold_noir: "velvet",
    midnight_emerald: "velvet",

    platinum_smoke: "metal",
    graphite: "metal",
    rose_gold_brushed: "metal",
    imperial_gold: "metal",

    nebula: "nebula",
    black_hole: "black_hole",
    aurora: "aurora",
    holographic: "holographic",
    quantum_foam: "quantum_foam",

    tron_grid: "tron_grid",
    matrix_rain: "matrix_rain",
    synthwave: "synthwave",
    circuit_board: "circuit_board",
    glitch: "glitch",

    lava_flow: "lava_flow",
    frozen_lake: "frozen_lake",
    volcanic_ash: "volcanic_ash",
    storm_cloud: "storm_cloud",
    underwater: "underwater",

    marble: "marble",
    obsidian_glass: "obsidian_glass",
    casino_vip: "casino_vip",

    van_gogh: "van_gogh",
    stained_glass: "stained_glass",
    halftone: "halftone",
    watercolor: "watercolor",

    moss: "moss",
    desert_dunes: "desert_dunes",
    sahara_sand: "desert_dunes",
    cherry_blossom: "cherry_blossom",
    forest_floor: "forest_floor",
    ocean_wave: "ocean_wave",
    ocean_teal: "ocean_wave",

    pinball: "pinball",
    arcade_carpet: "arcade_carpet",
    dungeon_stone: "dungeon_stone",
    spaceship_hull: "spaceship_hull",
    casino_roulette: "casino_roulette",

    live_lightning: "live_lightning",
    flowing_river: "flowing_river",
    confetti_burst: "confetti_burst",
    phoenix_fire: "phoenix_fire",

    blood_moon: "blood_moon",
    sapphire_abyss: "deep_glow",
    void_violet: "deep_glow",
    galaxy_window: "solid",
    green_wood: "solid",
    red_wood: "solid",
    tiedye_neon: "solid",
    iridescent_frame: "solid",
    golden_frame: "solid",
    stone_frame: "solid",
    amethyst_purple: "deep_glow",
  };

  return themes[feltId] || "solid";
}

export function usesCasinoTexture(feltId) {
  return feltId === "classic_green";
}

/** @deprecated Use usesPhotoFeltTexture from feltVisuals.js */
export function usesFabricTexture(feltId) {
  return usesCasinoTexture(feltId);
}
