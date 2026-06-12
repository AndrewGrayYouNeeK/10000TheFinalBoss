/** Shared color theme for Score Meter dice — shifts from cyan → teal → amber → gold as fill rises. */

function clamp01(n) {
  return Math.max(0, Math.min(1, n ?? 0));
}

function parseHex(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpHex(a, b, t) {
  const c1 = parseHex(a);
  const c2 = parseHex(b);
  const mix = (i) => Math.round(c1[i] + (c2[i] - c1[i]) * t);
  const r = mix(0);
  const g = mix(1);
  const bVal = mix(2);
  return `#${[r, g, bVal].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Progress curve — color starts shifting at very low scores. */
export function scoreMeterProgress(scoreFill) {
  const raw = clamp01(scoreFill);
  return Math.pow(raw, 0.45);
}

export function getScoreMeterTheme(scoreFill) {
  const raw = clamp01(scoreFill);
  const t = scoreMeterProgress(scoreFill);
  const full = raw >= 0.97;

  const fillGradient = full
    ? "linear-gradient(to top, #fde68a, #f59e0b, #00ffff)"
    : `linear-gradient(to top, ${lerpHex("#0c4a6e", "#92400e", t)}, ${lerpHex("#0891b2", "#f59e0b", t)}, ${lerpHex("#22d3ee", "#fde68a", t)})`;

  const pipInner = lerpHex("#22d3ee", "#fde68a", t);
  const pipOuter = lerpHex("#0891b2", "#f59e0b", t);
  const pipHighlight = full ? "#fff" : lerpHex("#ffffff", "#fde68a", Math.min(1, t * 1.2));

  const edgeColor = full
    ? "rgba(253,224,71,0.7)"
    : `rgba(${Math.round(34 + (253 - 34) * t)}, ${Math.round(211 + (224 - 211) * t)}, ${Math.round(238 + (71 - 238) * t)}, ${0.35 + t * 0.35})`;

  const fillGlow = full
    ? "0 0 24px rgba(253,224,71,0.8), inset 0 0 20px rgba(255,255,255,0.3)"
    : t > 0.08
      ? `0 0 ${6 + t * 18}px rgba(${Math.round(34 + 219 * t)}, ${Math.round(211 - 50 * t)}, ${Math.round(238 - 170 * t)}, ${0.15 + t * 0.45})`
      : "none";

  const edgeGlow = full ? "0 0 20px rgba(253,224,71,0.5)" : undefined;

  return {
    raw,
    t,
    full,
    fillGradient,
    fillGlow,
    edgeColor,
    edgeGlow,
    pipBackground: full
      ? "radial-gradient(circle, #fff 0%, #fde68a 40%, #f59e0b 100%)"
      : `radial-gradient(circle, ${pipHighlight} 0%, ${pipInner} 50%, ${pipOuter} 100%)`,
    pipAnimate: full,
  };
}
