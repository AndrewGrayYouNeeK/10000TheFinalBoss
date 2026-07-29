import {
  getLocalVideoBlob,
  putLocalVideoBlob,
  VIDEO_FALLBACK_PATHS,
  VIDEO_KEYS,
} from "@/lib/localVideoStore";

/** Gameplay sign uploads live on Matrix Sprite Lab only. */
export const MATRIX_GAMEPLAY_SKIN_ID = "matrix";

/** @deprecated Shared upload — migrated to Matrix gameplay slot. */
export const LEGACY_GAMEPLAY_BILLBOARD_KEY = VIDEO_KEYS.GAMEPLAY_BILLBOARD;

const DEFAULT_BILLBOARD_FALLBACK = VIDEO_FALLBACK_PATHS[LEGACY_GAMEPLAY_BILLBOARD_KEY] ?? null;

/** IndexedDB key for the in-match YouNeeK 10,000 sign (Matrix Sprite Lab upload). */
export function gameplayBillboardKey(_skinId = MATRIX_GAMEPLAY_SKIN_ID) {
  return `gameplay_billboard_${MATRIX_GAMEPLAY_SKIN_ID}`;
}

export const MATRIX_GAMEPLAY_BILLBOARD_KEY = gameplayBillboardKey();

export function getGameplayBillboardLabel() {
  return "Matrix — YouNeeK 10,000 sign";
}

export function getGameplayBillboardDescription() {
  return "Looping video inside the neon 10,000 sign during local multiplayer matches. Upload on Matrix Sprite Lab only.";
}

export function getGameplayBillboardFallback() {
  return DEFAULT_BILLBOARD_FALLBACK;
}

/** Move old shared gameplay_billboard upload → Matrix slot once. */
export async function migrateLegacyGameplayBillboard() {
  const legacy = await getLocalVideoBlob(LEGACY_GAMEPLAY_BILLBOARD_KEY);
  if (!legacy) return;

  const matrixKey = MATRIX_GAMEPLAY_BILLBOARD_KEY;
  const matrixBlob = await getLocalVideoBlob(matrixKey);
  if (!matrixBlob) {
    await putLocalVideoBlob(matrixKey, legacy);
  }
}

/** @deprecated Per-skin migration — gameplay sign is Matrix-only now. */
export async function migrateLegacyGameplayBillboardToSkin(_skinId) {
  return migrateLegacyGameplayBillboard();
}
