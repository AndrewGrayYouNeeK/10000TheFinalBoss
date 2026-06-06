// Dice face images - using a crisp 3D rendered white die set.
// We use CSS for a 3D effect with these as the pip pattern.
// Single source image per face would be ideal; for now we use emoji-style dots in CSS.

export const DICE_BG = "/assets/5f3c772e4_49b5kQcNBQNgBjCmB2rNU_YaGLdoDw.png";

// Pip layouts (0 = no pip, 1 = pip) in a 3x3 grid
export const PIP_LAYOUTS = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [1,0,0, 0,0,0, 0,0,1],
  3: [1,0,0, 0,1,0, 0,0,1],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};