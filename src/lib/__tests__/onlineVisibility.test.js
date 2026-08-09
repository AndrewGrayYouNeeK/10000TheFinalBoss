import { describe, it, expect } from "vitest";
import {
  SESSION_ONLINE_MOCK_KEY,
  SESSION_ONLINE_VIEWER_INDEX_KEY,
  DEFAULT_ONLINE_VISIBILITY,
  normalizeOnlineVisibility,
  readProfileOnlineVisibility,
  saveProfileOnlineVisibility,
  buildVisibilityMapForMatch,
  readOnlineMockSession,
  writeOnlineMockSession,
  clearOnlineMockSession,
} from "../onlineVisibility";
import { loadProfile } from "../localProfile";

describe("normalizeOnlineVisibility", () => {
  it("defaults every flag on for missing or non-object input", () => {
    expect(normalizeOnlineVisibility(null)).toEqual(DEFAULT_ONLINE_VISIBILITY);
    expect(normalizeOnlineVisibility("nope")).toEqual(DEFAULT_ONLINE_VISIBILITY);
  });

  it("only turns a flag off for an explicit false", () => {
    expect(normalizeOnlineVisibility({ hideDice: false, hideTurnScore: 0 })).toEqual({
      ...DEFAULT_ONLINE_VISIBILITY,
      hideDice: false,
    });
  });
});

describe("profile visibility settings", () => {
  it("reads normalized settings from the profile", () => {
    expect(readProfileOnlineVisibility()).toEqual(DEFAULT_ONLINE_VISIBILITY);
  });

  it("writes normalized settings back to the profile", () => {
    const saved = saveProfileOnlineVisibility({ hidePowerPanel: false });
    expect(saved.hidePowerPanel).toBe(false);
    expect(loadProfile().online_visibility.hidePowerPanel).toBe(false);
    expect(readProfileOnlineVisibility()).toEqual(saved);
  });
});

describe("buildVisibilityMapForMatch", () => {
  it("uses the player's own settings for their seat and defaults elsewhere", () => {
    const map = buildVisibilityMapForMatch(3, 1, { hideDice: false });
    expect(map[1].hideDice).toBe(false);
    expect(map[0]).toEqual(DEFAULT_ONLINE_VISIBILITY);
    expect(map[2]).toEqual(DEFAULT_ONLINE_VISIBILITY);
  });
});

describe("mock online session", () => {
  it("is absent until written", () => {
    expect(readOnlineMockSession()).toBeNull();
  });

  it("round trips the viewer index", () => {
    writeOnlineMockSession(2);
    expect(sessionStorage.getItem(SESSION_ONLINE_MOCK_KEY)).toBe("1");
    expect(sessionStorage.getItem(SESSION_ONLINE_VIEWER_INDEX_KEY)).toBe("2");
    expect(readOnlineMockSession()).toEqual({ viewerPlayerIndex: 2 });
  });

  it("floors and clamps a bogus viewer index", () => {
    writeOnlineMockSession(-4);
    expect(readOnlineMockSession()).toEqual({ viewerPlayerIndex: 0 });
    sessionStorage.setItem(SESSION_ONLINE_VIEWER_INDEX_KEY, "abc");
    expect(readOnlineMockSession()).toEqual({ viewerPlayerIndex: 0 });
  });

  it("clears the session", () => {
    writeOnlineMockSession(1);
    clearOnlineMockSession();
    expect(readOnlineMockSession()).toBeNull();
  });
});
