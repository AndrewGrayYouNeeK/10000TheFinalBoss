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

/**
 * Ghost + disguise dice faces are private — only that player on their own turn may see them.
 * Local/online: score, turn score, and power UI stay public; only die faces are redacted.
 * Story Ghost boss: always invisible to the human (see storyGhostDiceHidden).
 */
export function canViewerSeeGhostDice(
  currentPlayer,
  { viewerPlayerIndex = null, currentIndex = null, allowSpectator = false } = {}
) {
  if (!isGhostDisguise(currentPlayer)) return true;
  if (allowSpectator) return true;
  if (viewerPlayerIndex == null || currentIndex == null) return false;
  return viewerPlayerIndex === currentIndex;
}

/** True when Ghost privacy (hidden dice / local handoff) should apply. */
export function ghostDicePrivacyActive(player) {
  return isGhostDisguise(player);
}

/** Tray skin while Ghost dice are hidden from others — spectral body, not the disguise. */
export function getGhostHiddenTraySkinId() {
  return GHOST_SKIN_ID;
}

/** Story ladder: AI Ghost rolls stay invisible to the human player. */
export function storyGhostDiceHidden(trayPlayer, trayPlayerIndex, humanIndex = 0) {
  if (!isGhostPlayer(trayPlayer)) return false;
  return trayPlayerIndex !== humanIndex;
}

/**
 * Story ladder: when Ghost boss holds a power charge, hide their banked score from the human.
 * @returns {Set<number>}
 */
export function storyGhostPowerHiddenScores(state, bossIndex = 1) {
  const hidden = new Set();
  const boss = state?.players?.[bossIndex];
  if (isGhostPlayer(boss) && boss.powerCharge) hidden.add(bossIndex);
  return hidden;
}

/** Resolve saved/profile disguise for a Ghost player (never Ghost itself). */
export function resolveGhostDisguise(player, { ghostDisguiseId = null, ownedSkins = [] } = {}) {
  if (!isGhostPlayer(player)) return null;
  if (player.ghostBare) return null;
  const raw = player.trueSkinId || ghostDisguiseId || pickTrueSkinForGhost(ownedSkins);
  const id = normalizeSkinId(raw);
  if (!id || id === GHOST_SKIN_ID) return null;
  return id;
}

/** The skin a player is pretending to be (disguise for Ghost, face skin for everyone else). */
export function getPretendSkin(player, options) {
  if (!player) return "classic_white";
  const disguise = resolveGhostDisguise(player, options);
  if (disguise) return disguise;
  return normalizeSkinId(player.skinId || "classic_white");
}

/**
 * Dice body on the tray / home / previews — Ghost always keeps its spectral skin.
 * Disguise (`trueSkinId`) is for powers + opponent privacy only, never tray look.
 */
export function getDisplaySkinId(player, _options) {
  if (!player) return "classic_white";
  return normalizeSkinId(player.skinId || "classic_white");
}

/**
 * Resolve a skin id for Die previews. Ghost stays spectral — do not swap to disguise.
 * (Disguise is power/privacy identity only.)
 */
export function resolveDiceSkinId(skinId, _options = {}) {
  return normalizeSkinId(skinId || "classic_white");
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
    const raw = disguiseSkinId || pickTrueSkinForGhost(ownedSkins);
    const trueSkinId = normalizeSkinId(raw);
    // Ghost-as-disguise = spectral only (no privacy identity / no borrowed power).
    if (!trueSkinId || trueSkinId === GHOST_SKIN_ID) {
      return { skinId: GHOST_SKIN_ID, ghostBare: true };
    }
    return { skinId: GHOST_SKIN_ID, trueSkinId };
  }
  return { skinId: id };
}

export const SESSION_PLAYER_SKINS_KEY = "dice10k_player_skins";
export const SESSION_PLAYER_DISGUISES_KEY = "dice10k_player_disguises";

/** All owned skins selectable on Setup (Ghost pinned near the top when unlocked). */
export function getSetupSkinOptions(ownedSkins = []) {
  const options = ownedSkins.filter((id) => !!id);
  if (!options.includes(GHOST_SKIN_ID)) return options;
  return [GHOST_SKIN_ID, ...options.filter((id) => id !== GHOST_SKIN_ID)];
}

/** Disguise skins Ghost can mimic (includes Ghost — treat as spectral / no further disguise). */
export function getSetupDisguiseOptions(ownedSkins = []) {
  const options = ownedSkins.filter((id) => !!id);
  if (!options.includes(GHOST_SKIN_ID)) return options;
  return [GHOST_SKIN_ID, ...options.filter((id) => id !== GHOST_SKIN_ID)];
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
 * Non-Ghost players use their tray skin. Ghost uses its disguise power
 * (or mimics the opponent when bare). Story overrides may set player.chargePowerId.
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
