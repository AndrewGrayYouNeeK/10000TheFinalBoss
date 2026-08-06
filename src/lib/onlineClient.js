import { loadProfile } from "@/lib/localProfile";
import {
  DEFAULT_ONLINE_VISIBILITY,
  normalizeOnlineVisibility,
  readProfileOnlineVisibility,
} from "@/lib/onlineVisibility";

/** Live online match session (real WebSocket server). */
export const SESSION_ONLINE_LIVE_KEY = "dice10k_online_live";
export const SESSION_ONLINE_CODE_KEY = "dice10k_online_code";
export const SESSION_ONLINE_PLAYER_ID_KEY = "dice10k_online_player_id";
export const SESSION_ONLINE_PLAYER_INDEX_KEY = "dice10k_online_player_index";

/**
 * Resolve the online API / WebSocket base URL.
 * Dev: Vite proxies `/online-api` → wrangler (see vite.config.js).
 * Prod: set `VITE_ONLINE_URL` (e.g. https://roll10000-online.<account>.workers.dev).
 */
export function getOnlineApiBase() {
  const envUrl = import.meta.env.VITE_ONLINE_URL;
  if (envUrl && String(envUrl).trim()) {
    return String(envUrl).replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    // Same-origin proxy path used in local Vite + optional Pages Function later.
    return `${window.location.origin}/online-api`;
  }
  return "/online-api";
}

export function getOnlineWsBase() {
  const http = getOnlineApiBase();
  if (http.startsWith("https://")) return `wss://${http.slice("https://".length)}`;
  if (http.startsWith("http://")) return `ws://${http.slice("http://".length)}`;
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}${http.startsWith("/") ? http : `/${http}`}`;
  }
  return http;
}

export function readOnlineLiveSession() {
  try {
    if (sessionStorage.getItem(SESSION_ONLINE_LIVE_KEY) !== "1") return null;
    const code = sessionStorage.getItem(SESSION_ONLINE_CODE_KEY);
    const playerId = sessionStorage.getItem(SESSION_ONLINE_PLAYER_ID_KEY);
    const rawIdx = sessionStorage.getItem(SESSION_ONLINE_PLAYER_INDEX_KEY);
    const viewerPlayerIndex = rawIdx == null ? 0 : Number(rawIdx);
    if (!code || !playerId) return null;
    return {
      code: String(code).toUpperCase(),
      playerId,
      viewerPlayerIndex: Number.isFinite(viewerPlayerIndex) ? Math.floor(viewerPlayerIndex) : 0,
    };
  } catch {
    return null;
  }
}

export function writeOnlineLiveSession({ code, playerId, viewerPlayerIndex = 0 }) {
  sessionStorage.setItem(SESSION_ONLINE_LIVE_KEY, "1");
  sessionStorage.setItem(SESSION_ONLINE_CODE_KEY, String(code).toUpperCase());
  sessionStorage.setItem(SESSION_ONLINE_PLAYER_ID_KEY, String(playerId));
  sessionStorage.setItem(
    SESSION_ONLINE_PLAYER_INDEX_KEY,
    String(Math.max(0, Math.floor(viewerPlayerIndex)))
  );
}

export function clearOnlineLiveSession() {
  sessionStorage.removeItem(SESSION_ONLINE_LIVE_KEY);
  sessionStorage.removeItem(SESSION_ONLINE_CODE_KEY);
  sessionStorage.removeItem(SESSION_ONLINE_PLAYER_ID_KEY);
  sessionStorage.removeItem(SESSION_ONLINE_PLAYER_INDEX_KEY);
}

export async function createOnlineRoom() {
  const res = await fetch(`${getOnlineApiBase()}/api/rooms`, { method: "POST" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Create room failed (${res.status})`);
  }
  const data = await res.json();
  if (!data?.code) throw new Error("Server did not return a room code");
  return String(data.code).toUpperCase();
}

export function buildOnlineJoinQuery({ name, playerId, skinId, trueSkinId }) {
  const q = new URLSearchParams();
  if (name) q.set("name", name);
  if (playerId) q.set("playerId", playerId);
  if (skinId) q.set("skinId", skinId);
  if (trueSkinId) q.set("trueSkinId", trueSkinId);
  return q.toString();
}

export function onlineWsUrl(code, joinParams) {
  const base = getOnlineWsBase();
  const q = buildOnlineJoinQuery(joinParams);
  return `${base}/api/rooms/${encodeURIComponent(String(code).toUpperCase())}/ws?${q}`;
}

export function defaultOnlineDisplayName() {
  try {
    const profile = loadProfile();
    const name = profile?.display_name || profile?.name;
    if (name && String(name).trim()) return String(name).trim().slice(0, 24);
  } catch {
    /* ignore */
  }
  return "Player";
}

export function defaultOnlineSkinId(fallback = "classic_white") {
  try {
    const profile = loadProfile();
    return profile?.equipped_skin || fallback;
  } catch {
    return fallback;
  }
}

export function defaultJoinVisibility() {
  return normalizeOnlineVisibility(readProfileOnlineVisibility() || DEFAULT_ONLINE_VISIBILITY);
}

export function newPlayerId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
