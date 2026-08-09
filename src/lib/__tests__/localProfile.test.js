import { describe, it, expect, vi, afterEach } from "vitest";
import { loadProfile, saveProfile, updateProfile } from "../localProfile";

const STORAGE_KEY = "dice10k_profile";

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadProfile", () => {
  it("seeds and persists a default profile on first load", () => {
    const profile = loadProfile();
    expect(profile).toMatchObject({
      coins: 200,
      xp: 0,
      wins: 0,
      owned_skins: ["classic_white"],
      equipped_skin: "classic_white",
      equipped_felt: "classic_green",
    });
    expect(stored()).toEqual(profile);
  });

  it("pins the storage origin and warns when it changes", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    loadProfile();
    expect(localStorage.getItem("dice10k_storage_origin")).toBe(window.location.origin);
    localStorage.setItem("dice10k_storage_origin", "http://elsewhere");
    loadProfile();
    expect(warn).toHaveBeenCalled();
  });

  it("merges stored values over the defaults", () => {
    saveProfile({ coins: 999, xp: 40 });
    const profile = loadProfile();
    expect(profile.coins).toBe(999);
    expect(profile.xp).toBe(40);
    expect(profile.full_name).toBe("Player");
  });

  it("returns defaults when stored JSON is corrupt", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadProfile().coins).toBe(200);
  });

  describe("migrations", () => {
    it("folds legacy lava / ragnarok_regular skins into ragnarok", () => {
      saveProfile({
        owned_skins: ["classic_white", "lava", "ragnarok_regular"],
        equipped_skin: "lava",
        ghost_disguise: "ragnarok_regular",
      });
      const profile = loadProfile();
      expect(profile.owned_skins).toEqual(["classic_white", "ragnarok"]);
      expect(profile.equipped_skin).toBe("ragnarok");
      expect(profile.ghost_disguise).toBe("ragnarok");
    });

    it("strips removed skins and resets anything equipped to them", () => {
      saveProfile({
        owned_skins: ["classic_white", "tesla"],
        equipped_skin: "tesla",
        ghost_disguise: "tesla",
      });
      const profile = loadProfile();
      expect(profile.owned_skins).toEqual(["classic_white"]);
      expect(profile.equipped_skin).toBe("classic_white");
      expect(profile.ghost_disguise).toBeNull();
    });

    it("drops removed story bosses from progress", () => {
      saveProfile({
        bosses_defeated: ["glitch", "diamond_cut", "tesla_phreak"],
        story_active_boss: "tesla_phreak",
      });
      const profile = loadProfile();
      expect(profile.bosses_defeated).toEqual(["glitch"]);
      expect(profile.story_active_boss).toBeNull();
    });

    it("grants the Matrix Rain felt to older saves", () => {
      saveProfile({ owned_felts: ["classic_green"] });
      expect(loadProfile().owned_felts).toEqual(["classic_green", "matrix_rain"]);
    });

    it("persists the migrated profile back to storage", () => {
      saveProfile({ owned_skins: ["lava"], owned_felts: ["classic_green"] });
      loadProfile();
      expect(stored().owned_skins).toEqual(["ragnarok"]);
      expect(stored().owned_felts).toContain("matrix_rain");
    });
  });
});

describe("updateProfile", () => {
  it("patches and persists only the given keys", () => {
    const before = loadProfile();
    const after = updateProfile({ coins: before.coins + 50, wins: 3 });
    expect(after.coins).toBe(250);
    expect(after.wins).toBe(3);
    expect(after.xp).toBe(before.xp);
    expect(stored()).toEqual(after);
  });
});
