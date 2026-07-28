import { getSkin, normalizeSkinId } from "@/lib/shopCatalog";
import { getPower } from "@/lib/powers";
import { getSkinPower } from "@/lib/skinPowers";

export const GHOST_SKIN_ID = "ghost";

export function isGhostDisguise(player) {
  return player?.skinId === GHOST_SKIN_ID && !!player?.trueSkinId;
}

export function isGhostPlayer(player) {
  return player?.skinId === GHOST_SKIN_ID;
}

/** Resolve saved/profile disguise for a Ghost player. */
export function resolveGhostDisguise(player, { ghostDisguiseId = null, ownedSkins = [] } = {}) {
  if (!isGhostPlayer(player)) return null;
  if (player.ghostBare) return null;
  return player.trueSkinId || ghostDisguiseId || pickTrueSkinForGhost(ownedSkins);
}

/** The skin a player is pretending to be (disguise for Ghost, face skin for everyone else). */
export function getPretendSkin(player, options) {
  if (!player) return "classic_white";
  const disguise = resolveGhostDisguise(player, options);
  if (disguise) return normalizeSkinId(disguise);
  return normalizeSkinId(player.skinId || "classic_white");
}

/** Dice on the table — Ghost shows its chosen disguise (not the invisible ghost body). */
export function getDisplaySkinId(player, options) {
  return getPretendSkin(player, options);
}

/** Equipped/home previews — render Ghost as its chosen disguise (not the spectral body). */
export function resolveDiceSkinId(skinId, { ghostDisguiseId = null, ownedSkins = [] } = {}) {
  if (skinId !== GHOST_SKIN_ID) return normalizeSkinId(skinId);
  return normalizeSkinId(ghostDisguiseId || pickTrueSkinForGhost(ownedSkins));
}

export function pickTrueSkinForGhost(ownedSkins = []) {
  const pool = ownedSkins.filter((id) => id && id !== GHOST_SKIN_ID);
  if (pool.length) return pool[0];
  return "classic_white";
}

function pickAiDisguise(pool, seed) {
  const options = pool.filter((id) => id && id !== GHOST_SKIN_ID);
  if (!options.length) return "classic_white";
  return options[Math.abs(seed) % options.length];
}

/** Build skin + optional hidden disguise when using Ghost dice. */
export function assignPlayerSkin(skinId, ownedSkins = [], disguiseSkinId = null, options = {}) {
  const id = skinId || "classic_white";
  if (id === GHOST_SKIN_ID) {
    if (options.bareGhost) return { skinId: GHOST_SKIN_ID, ghostBare: true };
    const trueSkinId = disguiseSkinId || pickTrueSkinForGhost(ownedSkins);
    return { skinId: GHOST_SKIN_ID, trueSkinId };
  }
  return { skinId: id };
}

export const SESSION_PLAYER_SKINS_KEY = "dice10k_player_skins";
export const SESSION_PLAYER_DISGUISES_KEY = "dice10k_player_disguises";

/** All owned skins selectable on Setup (includes Ghost when unlocked). */
export function getSetupSkinOptions(ownedSkins = []) {
  return ownedSkins.filter((id) => !!id);
}

/** Disguise skins Ghost can mimic (everything except Ghost itself). */
export function getSetupDisguiseOptions(ownedSkins = []) {
  return ownedSkins.filter((id) => id && id !== GHOST_SKIN_ID);
}

export function readSessionPlayerDisguiseIds() {
  try {
    const raw = sessionStorage.getItem(SESSION_PLAYER_DISGUISES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readSessionPlayerSkinIds() {
  try {
    const raw = sessionStorage.getItem(SESSION_PLAYER_SKINS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function defaultSkinForSlot(slotIndex, equippedSkinId, ownedSkins = [], ghostDisguiseId = null) {
  const pool = ownedSkins.length
    ? [...ownedSkins]
    : ["classic_white", "obsidian", "gold", "matrix", "galaxy"];
  if (slotIndex === 0) {
    return equippedSkinId || pool[0] || "classic_white";
  }
  const setupPool = getSetupSkinOptions(pool);
  const fallback = setupPool.length ? setupPool : pool;
  return fallback[slotIndex % fallback.length] || "classic_white";
}

function resolveSlotSkinId(slotIndex, playerSkinIds, equippedSkinId, ownedSkins) {
  const picked = playerSkinIds?.[slotIndex];
  if (picked) return picked;
  return defaultSkinForSlot(slotIndex, equippedSkinId, ownedSkins);
}

function defaultDisguiseForSlot(slotIndex, skinId, ghostDisguiseId, ownedSkins = []) {
  if (skinId !== GHOST_SKIN_ID) return null;
  if (slotIndex === 0) return ghostDisguiseId || pickTrueSkinForGhost(ownedSkins);
  const options = getSetupDisguiseOptions(ownedSkins);
  return options[slotIndex % options.length] || pickTrueSkinForGhost(ownedSkins);
}

/** Default per-player Ghost disguise picks for Setup (null when not Ghost). */
export function buildDefaultSetupDisguiseIds(playerCount, skinIds, ghostDisguiseId, ownedSkins = []) {
  return Array.from({ length: playerCount }, (_, i) =>
    defaultDisguiseForSlot(i, skinIds?.[i], ghostDisguiseId, ownedSkins),
  );
}

function resolveGhostDisguiseForSlot(slotIndex, ghostDisguiseId, ownedSkins, pool, seed) {
  if (slotIndex === 0) return ghostDisguiseId;
  return pickAiDisguise(pool, seed);
}

/** Assign skins for a local pass-and-play match (slot 0 defaults to equipped on this device). */
export function buildGamePlayerSkins(
  playerCount,
  equippedSkinId,
  ownedSkins = [],
  ghostDisguiseId = null,
  playerSkinIds = null,
  playerDisguiseIds = null,
) {
  const pool = ownedSkins.length
    ? [...ownedSkins]
    : ["classic_white", "obsidian", "gold", "matrix", GHOST_SKIN_ID, "galaxy"];
  const skins = [];
  for (let i = 0; i < playerCount; i++) {
    const id = resolveSlotSkinId(i, playerSkinIds, equippedSkinId, ownedSkins);
    const disguise =
      id === GHOST_SKIN_ID
        ? playerDisguiseIds?.[i] ||
          resolveGhostDisguiseForSlot(i, ghostDisguiseId, ownedSkins, pool, i + 1)
        : null;
    skins[i] = assignPlayerSkin(id, ownedSkins, disguise);
  }
  return skins;
}

/** Default per-player skin picks for Setup (parallel to player names). */
export function buildDefaultSetupSkinIds(playerCount, equippedSkinId, ownedSkins = [], ghostDisguiseId = null) {
  return Array.from({ length: playerCount }, (_, i) =>
    defaultSkinForSlot(i, equippedSkinId, ownedSkins, ghostDisguiseId),
  );
}

export function getSkinLabel(skinId) {
  return getSkin(skinId)?.name || skinId.replace(/_/g, " ");
}

export function primaryOpponentIndex(state, playerIndex = state?.currentIndex ?? 0) {
  if (!state?.players?.length || state.players.length <= 1) return playerIndex;
  return (playerIndex + 1) % state.players.length;
}

/**
 * Resolve the secret power a player will fire.
 * All players (including Ghost) use the dice skin shown on the table (getDisplaySkinId).
 * Bare Ghost (no disguise) mimics the opponent's pretend skin.
 * Story overrides may set player.chargePowerId (e.g. Frosty arc, Marlin boss).
 */
export function resolvePlayerPower(state, playerIndex = state?.currentIndex ?? 0, options = {}) {
  const player = state?.players?.[playerIndex];
  if (!player) {
    return { power: null, mimicSkinId: null, isMimic: false, sourcePlayerName: null };
  }

  if (player.chargePowerId) {
    const override = getPower(player.chargePowerId);
    if (override) {
      const skinId = getDisplaySkinId(player, options);
      return {
        power: override,
        mimicSkinId: skinId,
        isMimic: false,
        sourcePlayerName: null,
      };
    }
  }

  if (!isGhostPlayer(player)) {
    const skinId = getDisplaySkinId(player, options);
    return {
      power: getSkinPower(skinId),
      mimicSkinId: skinId,
      isMimic: false,
      sourcePlayerName: null,
    };
  }

  const disguiseSkinId = resolveGhostDisguise(player, options);
  if (disguiseSkinId) {
    const skinId = normalizeSkinId(disguiseSkinId);
    return {
      power: getSkinPower(skinId),
      mimicSkinId: skinId,
      isMimic: false,
      sourcePlayerName: null,
    };
  }

  const oppIdx = primaryOpponentIndex(state, playerIndex);
  const opponent = state.players[oppIdx];
  const mimicSkinId = getPretendSkin(opponent, options);

  return {
    power: getSkinPower(mimicSkinId),
    mimicSkinId,
    isMimic: true,
    sourcePlayerName: opponent?.name || "opponent",
  };
}
