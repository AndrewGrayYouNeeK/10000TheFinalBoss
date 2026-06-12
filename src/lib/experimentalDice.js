/**
 * Preview dice lab — 4 spectral clears + custom showcase dice
 */

const base = (id, name, description, category, style, extras = {}) => ({
  id,
  name,
  price: 0,
  gradient: "from-transparent to-transparent",
  border: "border-white/20",
  pipColor: "bg-white",
  glow: "",
  description,
  customDice: true,
  experimental: true,
  category,
  style,
  ...extras,
});

const spectral = (id, name, desc, pipEffect, opts = {}) =>
  base(id, name, desc, "spectral", {
    kind: "clear",
    pipEffect,
    pipEffectAlt: opts.pipAlt || pipEffect,
    fill: opts.fill ?? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
    edgeColor: opts.edge ?? "rgba(186,230,253,0.25)",
    edgeWidth: opts.edgeWidth ?? 1,
    edgeGlow: opts.edgeGlow,
    highlight: opts.highlight,
    backdropBlur: opts.blur ?? 1,
    shimmer: opts.shimmer ?? false,
    phantomPulse: opts.phantomPulse ?? false,
  });

const fx = (id, name, desc, effectId, pipEffect, opts = {}) =>
  base(id, name, desc, "showcase", {
    kind: "portfolio",
    effectId,
    pipEffect,
    pipMode: opts.pipMode,
    accentGlow: opts.accentGlow,
  });

export const EXPERIMENTAL_DICE = [
  // —— SPECTRAL (kept) ——
  spectral("ghost", "Ghost", "Nearly invisible — pick a disguise. Steals opponent's pretend skin for power. Mind games.", "ghostPip", { phantomPulse: true }),
  spectral("clear_void", "Ultra Clear", "All clear. Body vanishes — pips float alone.", "whitePip", {
    fill: null,
    edge: "rgba(255,255,255,0.08)",
    edgeWidth: 0.5,
    blur: 0,
  }),
  spectral("ethereal_mist", "Ethereal Mist", "Misty white clear with soft floating pips.", "whitePip", {
    fill: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)",
    edge: "rgba(255,255,255,0.2)",
    blur: 2,
  }),
  spectral("zen", "Zen", "Minimal calm clear — nothing extra.", "whitePip", {
    fill: "rgba(255,255,255,0.03)",
    edge: "rgba(255,255,255,0.18)",
    blur: 0,
  }),

  // —— CUSTOM SHOWCASE (user-specified) ——
  fx("pf_radar_sweep", "Radar Sweep", "Scan reveals pips left to right — return sweep wipes them away.", "radar_sweep", "radarReveal", { accentGlow: "rgba(0,255,255,0.4)" }),
  fx("pf_tornado", "Tornado Core", "White debris whipping past like matrix rain inside the vortex.", "tornado_mono", "whitePip"),
  fx("pf_rainfall", "Rainfall", "Heavy rain pouring down the face.", "rainfall", "glow"),
  fx("pf_score_meter", "Score Meter", "Fill rises with your score — glows when you hit 10,000.", "score_meter", "scoreGlowPip", { accentGlow: "rgba(34,211,238,0.35)" }),
  fx("pf_binary_storm", "Binary Storm", "Columns of 1s and 0s ripping downward at max speed.", "binary_storm", "matrixPip", { accentGlow: "rgba(34,197,94,0.45)" }),
  fx("pf_soundwave", "Soundwave", "EQ bars bounce to live sound — or pulse organically in preview.", "soundwave", "holoPip", { accentGlow: "rgba(255,0,234,0.3)" }),
  fx("pf_radar_blips", "Radar Scope", "Rotating radar — full-size blips ping and linger when the sweep hits.", "radar_blips", "hiddenPip", { pipMode: "hidden" }),
  fx("pf_matrix_storm", "Matrix Storm", "Hyperspeed code hurricane — ANDREW GRAY letters trail down in sequence.", "matrix_storm", "matrixPip", { accentGlow: "rgba(34,197,94,0.5)" }),
  fx("pf_plasma_cut", "Plasma Cut", "Marching cut lines on the edge and pips — CUT HERE.", "plasma_cut", "plasmaCutPip"),
  fx("pf_core_burst", "Core Burst", "Hypnotic tunnel rings — endless black & white circles pulse from every pip.", "core_burst", "hypnoCorePip"),
  fx("pf_bug_zapper", "Bug Zapper", "UV grid crackles — flies buzz the pips and get zapped with a spark.", "bug_zapper", "zapperPip", { accentGlow: "rgba(168,85,247,0.45)" }),
  fx("pf_xray", "X-Ray", "Fluoroscopy scan — internal bone lattice, sweep beam, dense glowing pips.", "xray", "xrayPip", { accentGlow: "rgba(56,189,248,0.45)" }),
];

export const EXPERIMENTAL_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "spectral", label: "Spectral" },
  { id: "showcase", label: "Showcase" },
];

export function getExperimentalDice(category = "all") {
  if (category === "all") return EXPERIMENTAL_DICE;
  return EXPERIMENTAL_DICE.filter((d) => d.category === category);
}

export function getExperimentalById(id) {
  return EXPERIMENTAL_DICE.find((d) => d.id === id);
}

export const EXPERIMENTAL_DICE_IDS = EXPERIMENTAL_DICE.map((d) => d.id);

export const PORTFOLIO_DICE = EXPERIMENTAL_DICE.filter((d) => d.category !== "spectral");
