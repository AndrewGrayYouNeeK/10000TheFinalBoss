/** Skins with their own power video / sprite / special die FX. */
export function skinHasDedicatedPowerVisual(skin) {
  if (!skin) return false;
  if (skin.powerVideoUrl || skin.powerSpriteUrl || skin.powerDice) return true;
  if (skin.id === "blue_gel" || skin.id === "snow_globe") return true;
  return false;
}

/**
 * Legacy catch-all blood overlay — disabled.
 * Blue Gel uses BlueGelSharkAttack / BloodyWaterTint on its own path.
 * Applying this to other skins hid pips and looked like Shark Bite.
 */
export function skinUsesBloodPowerFx(_skin) {
  return false;
}
