import { isNativeApp } from "@/lib/platform";

/**
 * Pre-launch: web play stays on roll10000.com (default true).
 * Launch cutover: set VITE_WEB_PLAY_ENABLED=false and redeploy Pages.
 * Native app always has full play regardless of the flag.
 */
export function isWebPlayEnabled() {
  if (isNativeApp()) return true;
  const raw = import.meta.env.VITE_WEB_PLAY_ENABLED;
  if (raw === undefined || raw === "") return true;
  return raw !== "false" && raw !== "0";
}

/** Game hub path: `/` on native, `/play` on web while play is enabled. */
export function gameHubPath() {
  if (isNativeApp()) return "/";
  return isWebPlayEnabled() ? "/play" : "/";
}

/** Coin shop (GQ) path — separate from the USD web shop at `/shop` on web. */
export function coinShopPath() {
  if (isNativeApp()) return "/shop";
  return isWebPlayEnabled() ? "/play/shop" : "/shop";
}

export const APP_STORE_URL =
  import.meta.env.VITE_APP_STORE_URL ||
  "https://apps.apple.com/app/id0000000000";
