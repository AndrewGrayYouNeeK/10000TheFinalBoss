import { hasAnyScore } from "@/lib/scoring";

/** Dice fixed when Matrix Glitch rescues a bust (by local skin level 1–10). */
export function glitchDiceCountForLevel(level) {
  const lv = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
  if (lv >= 10) return 6;
  if (lv >= 8) return 5;
  if (lv >= 6) return 4;
  if (lv >= 4) return 3;
  if (lv >= 2) return 2;
  return 1;
}

const GLITCH_FACE_CYCLE = [1, 5];

/**
 * Flip up to `count` active dice to scoring faces (1 / 5).
 * @returns {{ dice: Array, glitchedIds: number[] }}
 */
export function applyMatrixGlitchToDice(dice, count) {
  if (!dice?.length || count <= 0) {
    return { dice, glitchedIds: [] };
  }

  const active = dice.filter((d) => !d.used);
  const activeValues = active.map((d) => d.value);
  if (hasAnyScore(activeValues)) {
    return { dice, glitchedIds: [] };
  }

  const toGlitch = active.slice(0, count);
  const glitchedIds = [];
  let flipIdx = 0;

  let nextDice = dice.map((d) => {
    if (d.used) return d;
    const slot = toGlitch.findIndex((t) => t.id === d.id);
    if (slot < 0 || slot >= count) return d;
    glitchedIds.push(d.id);
    const newValue = GLITCH_FACE_CYCLE[flipIdx % GLITCH_FACE_CYCLE.length];
    flipIdx += 1;
    return { ...d, value: newValue, held: false };
  });

  const afterValues = nextDice.filter((d) => !d.used).map((d) => d.value);
  if (!hasAnyScore(afterValues)) {
    nextDice = nextDice.map((d) => {
      if (d.used || glitchedIds.includes(d.id)) return d;
      if (glitchedIds.length >= count) return d;
      glitchedIds.push(d.id);
      return { ...d, value: 1, held: false };
    });
  }

  return { dice: nextDice, glitchedIds };
}
