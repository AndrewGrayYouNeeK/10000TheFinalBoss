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
  equipped_badge: "",
  equipped_felt: "classic_green",
  equipped_powers: [],
  bosses_defeated: [],
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const profile = { ...DEFAULT_PROFILE };
      saveProfile(profile);
      return profile;
    }
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
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
