/**
 * Presentation-only freeze of the Shark Bite victim tray.
 * bankAndPass advances currentIndex / refreshes dice before FX finishes —
 * capture the banker's tray here so the shark eats the correct skin/dice.
 */

export function playerHasSharkBiteMark(player) {
  return (player?.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "shark_bite"
  );
}

/**
 * @param {{ dice: object[], playerIndex: number, skinId: string, skinLevel?: number }} args
 */
export function captureSharkBiteTrayFreeze({ dice, playerIndex, skinId, skinLevel = 1 }) {
  return {
    dice: (dice || []).map((d) => ({ ...d })),
    playerIndex,
    skinId: skinId || "classic_white",
    skinLevel: Number(skinLevel) > 0 ? Number(skinLevel) : 1,
  };
}
