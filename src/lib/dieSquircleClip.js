/**
 * Convex squircle silhouette for dice — bows each edge outward between rounded corners.
 * Uses clip-path (not mask-image) so sprite background layers stay visible in WebKit.
 *
 * Path matches the pre-5471035 SVG mask in Die.jsx (b = 0.04, cr = 0.08 in unit space).
 * Coords are mapped through the same padded viewBox so the bulge stays inside the die
 * square — raw pixel paths with negative control points get flattened by overflow:hidden.
 */
/** Shared squircle clip for Die.jsx visual stack and custom-dice portfolio layers. */
export function getDieSquircleClipStyle(size) {
  const b = 0.04;
  const cr = 0.08;
  const vb = 1 + 2 * b;
  const px = (x) => ((x + b) / vb) * size;
  const py = (y) => ((y + b) / vb) * size;

  const d = [
    `M ${px(cr)} ${py(0)}`,
    `Q ${px(0.5)} ${py(-b)} ${px(1 - cr)} ${py(0)}`,
    `Q ${px(1)} ${py(0)} ${px(1)} ${py(cr)}`,
    `Q ${px(1 + b)} ${py(0.5)} ${px(1)} ${py(1 - cr)}`,
    `Q ${px(1)} ${py(1)} ${px(1 - cr)} ${py(1)}`,
    `Q ${px(0.5)} ${py(1 + b)} ${px(cr)} ${py(1)}`,
    `Q ${px(0)} ${py(1)} ${px(0)} ${py(1 - cr)}`,
    `Q ${px(-b)} ${py(0.5)} ${px(0)} ${py(cr)}`,
    `Q ${px(0)} ${py(0)} ${px(cr)} ${py(0)}`,
    "Z",
  ].join(" ");
  const clip = `path('${d}')`;
  return { clipPath: clip, WebkitClipPath: clip };
}
