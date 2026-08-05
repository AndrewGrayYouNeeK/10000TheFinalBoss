import { hasAnyScore } from "@/lib/scoring";

/** How many opponent dice Matrix Glitch rewrites (local skin level 1–10). */
export function glitchDiceCountForLevel(level) {
  const lv = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
  if (lv >= 10) return 6;
  if (lv >= 8) return 5;
  if (lv >= 6) return 4;
  if (lv >= 4) return 3;
  if (lv >= 2) return 2;
  return 1;
}

/** Banked-score cut when Matrix Glitch is cast (scales with skin level). */
export function glitchScoreCutForLevel(level, opponentScore = 0) {
  const lv = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
  const score = Math.max(0, Math.floor(Number(opponentScore) || 0));
  const cut = 75 * lv;
  return Math.min(score, cut);
}

const SCORING_FACES = [1, 5];
const NON_SCORING_FACES = [2, 3, 4, 6];

/**
 * Sabotage: rewrite up to `count` active dice to non-scoring faces.
 * @returns {{ dice: Array, glitchedIds: number[] }}
 */
export function applyMatrixGlitchSabotageToDice(dice, count) {
  if (!dice?.length || count <= 0) {
    return { dice: dice || [], glitchedIds: [] };
  }

  const active = dice.filter((d) => !d.used);
  if (!active.length) {
    return { dice, glitchedIds: [] };
  }

  const toGlitch = active.slice(0, Math.min(count, active.length));
  const glitchIds = new Set(toGlitch.map((d) => d.id));
  let flipIdx = 0;

  const nextDice = dice.map((d) => {
    if (d.used || !glitchIds.has(d.id)) return d;
    const newValue = NON_SCORING_FACES[flipIdx % NON_SCORING_FACES.length];
    flipIdx += 1;
    return { ...d, value: newValue, held: false };
  });

  return { dice: nextDice, glitchedIds: [...glitchIds] };
}

/**
 * Legacy bust-rescue helper (scoring faces). Kept for any callers/tests.
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
    const newValue = SCORING_FACES[flipIdx % SCORING_FACES.length];
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
