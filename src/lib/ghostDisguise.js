import { getSkin } from "@/lib/shopCatalog";
import { getSkinPower } from "@/lib/skinPowers";

export const GHOST_SKIN_ID = "ghost";

export function isGhostDisguise(player) {
  return player?.skinId === GHOST_SKIN_ID && !!player?.trueSkinId;
}

export function isGhostPlayer(player) {
  return player?.skinId === GHOST_SKIN_ID;
}

/** The skin a player is pretending to be (disguise for Ghost, face skin for everyone else). */
export function getPretendSkin(player) {
  if (!player) return "classic_white";
  if (player.skinId === GHOST_SKIN_ID && player.trueSkinId) {
    return player.trueSkinId;
  }
  return player.skinId || "classic_white";
}

/** Dice on the table — Ghost looks like its disguise so opponents can't tell. */
export function getDisplaySkinId(player) {
  return getPretendSkin(player);
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
export function assignPlayerSkin(skinId, ownedSkins = [], disguiseSkinId = null) {
  const id = skinId || "classic_white";
  if (id === GHOST_SKIN_ID) {
    const trueSkinId = disguiseSkinId || pickTrueSkinForGhost(ownedSkins);
    return { skinId: GHOST_SKIN_ID, trueSkinId };
  }
  return { skinId: id };
}

/** Assign skins for a local pass-and-play match (slot 0 = equipped on this device). */
export function buildGamePlayerSkins(playerCount, equippedSkinId, ownedSkins = [], ghostDisguiseId = null) {
  const pool = ownedSkins.length
    ? [...ownedSkins]
    : ["classic_white", "obsidian", "gold", "matrix", GHOST_SKIN_ID, "galaxy"];
  const skins = [];
  skins[0] = assignPlayerSkin(equippedSkinId, ownedSkins, ghostDisguiseId);
  for (let i = 1; i < playerCount; i++) {
    const id = pool[i % pool.length];
    const disguise = id === GHOST_SKIN_ID ? pickAiDisguise(pool, i + 1) : null;
    skins[i] = assignPlayerSkin(id, ownedSkins, disguise);
  }
  return skins;
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
 * Ghost copies the opponent's pretend skin — never its own fixed power.
 */
export function resolvePlayerPower(state, playerIndex = state?.currentIndex ?? 0) {
  const player = state?.players?.[playerIndex];
  if (!player) {
    return { power: null, mimicSkinId: null, isMimic: false, sourcePlayerName: null };
  }

  if (!isGhostPlayer(player)) {
    const skinId = player.skinId || "classic_white";
    return {
      power: getSkinPower(skinId),
      mimicSkinId: skinId,
      isMimic: false,
      sourcePlayerName: null,
    };
  }

  const oppIdx = primaryOpponentIndex(state, playerIndex);
  const opponent = state.players[oppIdx];
  const mimicSkinId = getPretendSkin(opponent);

  return {
    power: getSkinPower(mimicSkinId),
    mimicSkinId,
    isMimic: true,
    sourcePlayerName: opponent?.name || "opponent",
  };
}
