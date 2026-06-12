import { Capacitor } from "@capacitor/core";

/** Native iOS/Android Capacitor shell */
export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** iPhone/iPad WKWebView (incl. Capacitor iOS) */
export function isIOSWebKit() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isNativeIOS() {
  try {
    return Capacitor.getPlatform() === "ios";
  } catch {
    return isIOSWebKit();
  }
}

/** Reduce effects on phones and in the native app */
export function isLowPowerDevice() {
  if (typeof window === "undefined") return false;
  if (isNativeApp()) return true;
  return window.matchMedia("(max-width: 768px)").matches;
}
