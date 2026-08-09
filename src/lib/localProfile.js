const STORAGE_KEY = "dice10k_profile";
const STORAGE_ORIGIN_KEY = "dice10k_storage_origin";
const STORAGE_CORRUPT_KEY = "dice10k_profile_corrupt";

/** Keep unreadable profile JSON around so progress can be recovered by hand. */
function backupCorruptProfile(raw, err) {
  console.error(
    "[YouNeeK 10,000] Profile save could not be read — falling back to a new profile. " +
      `The unreadable copy is kept in localStorage under "${STORAGE_CORRUPT_KEY}".`,
    err
  );
  if (typeof raw !== "string") return;
  try {
    localStorage.setItem(STORAGE_CORRUPT_KEY, raw);
  } catch (backupErr) {
    console.error("[YouNeeK 10,000] Could not back up the unreadable profile save.", backupErr);
  }
}

function pinStorageOrigin() {
  if (typeof window === "undefined") return;
  try {
    const origin = window.location.origin;
    const pinned = localStorage.getItem(STORAGE_ORIGIN_KEY);
    if (!pinned) {
      localStorage.setItem(STORAGE_ORIGIN_KEY, origin);
      return;
    }
    if (pinned !== origin) {
      console.warn(
        `[YouNeeK 10,000] Saves are stored under ${pinned}, but you opened ${origin}. ` +
          "Sprite tuning, videos, and profile data will look missing until you use the same URL every time."
      );
    }
  } catch (err) {
    console.warn("[YouNeeK 10,000] Could not check the storage origin pin.", err);
  }
}

const RAGNAROK_LEGACY_SKINS = ["lava", "ragnarok_regular"];
const REMOVED_SKIN_IDS = ["tesla"];
const REMOVED_STORY_BOSS_IDS = ["diamond_cut", "tesla_phreak"];

function migrateProfile(profile) {
  const next = { ...profile };
  let owned = [...(next.owned_skins ?? ["classic_white"])];
  if (owned.some((id) => RAGNAROK_LEGACY_SKINS.includes(id))) {
    owned = [...new Set([...owned.filter((id) => !RAGNAROK_LEGACY_SKINS.includes(id)), "ragnarok"])];
    next.owned_skins = owned;
  }
  if (owned.some((id) => REMOVED_SKIN_IDS.includes(id))) {
    owned = owned.filter((id) => !REMOVED_SKIN_IDS.includes(id));
    next.owned_skins = owned;
  }
  if (RAGNAROK_LEGACY_SKINS.includes(next.equipped_skin)) {
    next.equipped_skin = "ragnarok";
  }
  if (REMOVED_SKIN_IDS.includes(next.equipped_skin)) {
    next.equipped_skin = "classic_white";
  }
  if (REMOVED_SKIN_IDS.includes(next.ghost_disguise)) {
    next.ghost_disguise = null;
  }
  if (RAGNAROK_LEGACY_SKINS.includes(next.ghost_disguise)) {
    next.ghost_disguise = "ragnarok";
  }
  const defeated = [...(next.bosses_defeated ?? [])];
  const filteredDefeated = defeated.filter((id) => !REMOVED_STORY_BOSS_IDS.includes(id));
  if (filteredDefeated.length !== defeated.length) {
    next.bosses_defeated = filteredDefeated;
  }
  if (REMOVED_STORY_BOSS_IDS.includes(next.story_active_boss)) {
    next.story_active_boss = null;
  }
  // Story default felt — grant Matrix Rain if missing.
  const felts = [...(next.owned_felts ?? ["classic_green"])];
  if (!felts.includes("matrix_rain")) {
    next.owned_felts = [...felts, "matrix_rain"];
  }
  return next;
}

const DEFAULT_PROFILE = {
  email: "local@player",
  full_name: "Player",
  coins: 200,
  xp: 0,
  games_finished: 0,
  wins: 0,
  intro_seen: false,
  owned_skins: ["classic_white"],
  owned_badges: [],
  owned_felts: ["classic_green", "matrix_rain"],
  equipped_skin: "classic_white",
  ghost_disguise: null,
  equipped_badge: "",
  equipped_felt: "classic_green",
  equipped_powers: [],
  bosses_defeated: [],
  story_active_boss: null,
  held_dice_style: "amber_glow",
  sfx_muted: false,
  opponent_sfx_muted: false,
  /** Sprite Lab locks + snapshots — survives restarts alongside this profile. */
  sprite_tuning: {},
  /** Felt Lab texture tuning — scale, position, clarity per table felt. */
  felt_tuning: {},
  /** Video upload inventory (metadata only — blobs live in IndexedDB/OPFS). */
  video_uploads: {},
  /** Online stub: per-skin power level 1–100 (see progression.getSkinPowerLevel). */
  skin_levels: {},
  /** Local play-time XP per skin (levels 1–10 derived in progression.addSkinPlayXp). */
  skin_level_xp: {},
  /** What opponents see during your turn in online PvP (sync to server when live). */
  online_visibility: {
    hideDice: true,
    hideTurnScore: true,
    hidePowerPanel: true,
    hidePowerChargeBadge: true,
    hideXrayReveals: true,
    subtlePowerVfx: true,
  },
};

export function loadProfile() {
  let raw = null;
  try {
    pinStorageOrigin();
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.error("[YouNeeK 10,000] localStorage is unavailable — progress will not persist.", err);
    return { ...DEFAULT_PROFILE };
  }

  if (!raw) {
    const profile = { ...DEFAULT_PROFILE };
    try {
      saveProfile(profile);
    } catch (err) {
      console.error("[YouNeeK 10,000] Could not create a new profile save.", err);
    }
    return profile;
  }

  let parsed;
  try {
    parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (err) {
    backupCorruptProfile(raw, err);
    return { ...DEFAULT_PROFILE };
  }

  const migrated = migrateProfile(parsed);
  if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
    try {
      saveProfile(migrated);
    } catch (err) {
      console.error("[YouNeeK 10,000] Could not persist the migrated profile.", err);
    }
  }
  return migrated;
}

/** @throws when storage is full or blocked — callers must surface the failure. */
export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function updateProfile(patch) {
  const updated = { ...loadProfile(), ...patch };
  saveProfile(updated);
  return updated;
}
