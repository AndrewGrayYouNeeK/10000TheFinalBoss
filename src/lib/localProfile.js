import { STORY_VERSION } from "./storyBosses";

const STORAGE_KEY = "dice10k_profile";

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
  owned_felts: ["classic_green"],
  equipped_skin: "classic_white",
  ghost_disguise: null,
  equipped_badge: "",
  equipped_felt: "classic_green",
  equipped_powers: [],
  bosses_defeated: [],
  story_version: STORY_VERSION,
  held_dice_style: "amber_glow",
  sfx_muted: false,
  opponent_sfx_muted: false,
};

function migrateStoryProgress(profile) {
  if ((profile.story_version ?? 1) >= STORY_VERSION) return profile;
  return {
    ...profile,
    story_version: STORY_VERSION,
    bosses_defeated: [],
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const profile = { ...DEFAULT_PROFILE };
      saveProfile(profile);
      return profile;
    }
    const merged = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    const migrated = migrateStoryProgress(merged);
    if (migrated !== merged) saveProfile(migrated);
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
