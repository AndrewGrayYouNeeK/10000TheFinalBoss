// Dice face images - using a crisp 3D rendered white die set.
// We use CSS for a 3D effect with these as the pip pattern.
// Single source image per face would be ideal; for now we use emoji-style dots in CSS.

export const DICE_BG = "/assets/5f3c772e4_49b5kQcNBQNgBjCmB2rNU_YaGLdoDw.png";

// Pip layouts (0 = no pip, 1 = pip) in a 3x3 grid — flat row-major indices 0–8
export const PIP_LAYOUTS = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
  3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

/** 3×3 grid for Die / portfolio effects */
export function layoutGrid(value) {
  const flat = PIP_LAYOUTS[value] || PIP_LAYOUTS[1];
  return [flat.slice(0, 3), flat.slice(3, 6), flat.slice(6, 9)];
}

export function pipIndexSet(value) {
  const set = new Set();
  (PIP_LAYOUTS[value] || PIP_LAYOUTS[1]).forEach((p, i) => {
    if (p) set.add(i);
  });
  return set;
}

/** X-Ray morph: only faces reachable by adding or removing pips at fixed grid cells */
export function morphCompatibleValues(value) {
  const base = pipIndexSet(value);
  const compatible = [];
  for (let v = 1; v <= 6; v += 1) {
    if (v === value) continue;
    const other = pipIndexSet(v);
    let baseSubsetOfOther = true;
    let otherSubsetOfBase = true;
    for (const idx of base) {
      if (!other.has(idx)) baseSubsetOfOther = false;
    }
    for (const idx of other) {
      if (!base.has(idx)) otherSubsetOfBase = false;
    }
    if (baseSubsetOfOther || otherSubsetOfBase) compatible.push(v);
  }
  return compatible;
}