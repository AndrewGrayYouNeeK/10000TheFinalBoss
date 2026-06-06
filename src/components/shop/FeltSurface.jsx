import React from "react";

/**
 * Rich, reusable felt surface used by both the in-game DiceTray and the Shop preview.
 * Layered passes: base radial → photo texture → woven fibers → wool speckle → SVG grain
 * → top sheen highlight → corner edge wear → deep vignette.
 *
 * Pass `compact` for the small shop swatch (smaller speckle, less wear).
 */
export default function FeltSurface({ felt, compact = false }) {
  if (!felt) return null;

  const sheenOpacity = compact ? 0.18 : 0.22;
  const wearOpacity = compact ? 0.25 : 0.4;
  const vignetteStrength = compact ? 0.35 : 0.55;

  return (
    <>
      {/* Photographic felt texture */}
      {felt.textureUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${felt.textureUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: compact ? "multiply" : "soft-light",
            opacity: compact ? 0.85 : 0.55,
          }}
        />
      )}

      {/* Woven fibers — three crossing directions for depth */}
      <div
        className="absolute inset-0 opacity-35 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `
            repeating-linear-gradient(43deg, rgba(0,0,0,0.20) 0, rgba(0,0,0,0.20) 0.5px, transparent 0.5px, transparent 2px),
            repeating-linear-gradient(137deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 0.5px, transparent 0.5px, transparent 2.5px),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)
          `,
        }}
      />

      {/* Wool fuzz speckle */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none mix-blend-soft-light"
        style={{
          backgroundImage: `
            radial-gradient(circle at 12% 18%, rgba(255,255,255,0.18) 0.5px, transparent 1px),
            radial-gradient(circle at 38% 62%, rgba(0,0,0,0.22) 0.5px, transparent 1px),
            radial-gradient(circle at 71% 31%, rgba(255,255,255,0.12) 0.5px, transparent 1px),
            radial-gradient(circle at 87% 78%, rgba(0,0,0,0.20) 0.5px, transparent 1px),
            radial-gradient(circle at 24% 89%, rgba(255,255,255,0.14) 0.5px, transparent 1px),
            radial-gradient(circle at 56% 14%, rgba(0,0,0,0.18) 0.5px, transparent 1px)
          `,
          backgroundSize: compact
            ? "5px 5px, 6px 6px, 7px 7px, 4px 4px, 5px 5px, 6px 6px"
            : "7px 7px, 9px 9px, 11px 11px, 6px 6px, 8px 8px, 10px 10px",
        }}
      />

      {/* High-frequency SVG fabric grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`
          )}")`,
          backgroundSize: "180px 180px",
        }}
      />

      {/* Soft top sheen — like overhead lamp light hitting the felt */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 12%, rgba(255,255,255,${sheenOpacity}) 0%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
      />

      {/* Edge wear — slight darkening into the corners with a worn fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 0% 0%, rgba(0,0,0,${wearOpacity * 0.5}) 0%, transparent 25%),
            radial-gradient(circle at 100% 0%, rgba(0,0,0,${wearOpacity * 0.5}) 0%, transparent 25%),
            radial-gradient(circle at 0% 100%, rgba(0,0,0,${wearOpacity * 0.6}) 0%, transparent 30%),
            radial-gradient(circle at 100% 100%, rgba(0,0,0,${wearOpacity * 0.6}) 0%, transparent 30%)
          `,
        }}
      />

      {/* Deep vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${vignetteStrength}) 100%)`,
        }}
      />

      {/* Inner rim shadow — gives the tray a physical "bowl" depth */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow:
            "inset 0 0 30px rgba(0,0,0,0.45), inset 0 4px 10px rgba(255,255,255,0.07), inset 0 -6px 14px rgba(0,0,0,0.35)",
        }}
      />
    </>
  );
}