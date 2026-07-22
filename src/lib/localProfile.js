const STORAGE_KEY = "dice10k_profile";

const RAGNAROK_LEGACY_SKINS = ["lava", "ragnarok_regular"];

function migrateProfile(profile) {
  const next = { ...profile };
  let owned = [...(next.owned_skins ?? ["classic_white"])];
  if (owned.some((id) => RAGNAROK_LEGACY_SKINS.includes(id))) {
    owned = [...new Set([...owned.filter((id) => !RAGNAROK_LEGACY_SKINS.includes(id)), "ragnarok"])];
    next.owned_skins = owned;
  }
  if (RAGNAROK_LEGACY_SKINS.includes(next.equipped_skin)) {
    next.equipped_skin = "ragnarok";
  }
  if (RAGNAROK_LEGACY_SKINS.includes(next.ghost_disguise)) {
    next.ghost_disguise = "ragnarok";
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
  /** Video upload inventory (metadata only — blobs live in IndexedDB/OPFS). */
  video_uploads: {},
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const profile = { ...DEFAULT_PROFILE };
      saveProfile(profile);
      return profile;
    }
    const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    const migrated = migrateProfile(parsed);
    if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      saveProfile(migrated);
    }
    return migrated;
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function updateProfile(patch) {
  const updated = { ...loadProfile(), ...patch };
  saveProfile(updated);
  return updated;
}
