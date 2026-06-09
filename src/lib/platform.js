import { Capacitor } from "@capacitor/core";

/** Native iOS/Android Capacitor shell */
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/** Reduce effects on phones and in the native app */
export function isLowPowerDevice() {
  if (typeof window === "undefined") return false;
  if (isNativeApp()) return true;
  return window.matchMedia("(max-width: 768px)").matches;
}
