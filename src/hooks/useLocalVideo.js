import { useEffect, useState } from "react";
import {
  getCachedLocalVideoObjectUrl,
  preloadLocalVideo,
  resolveVideoSrcSync,
  subscribeLocalVideo,
  VIDEO_FALLBACK_PATHS,
} from "@/lib/localVideoStore";

/**
 * Resolves a video key to a playable src (local blob URL or catalog fallback).
 * Returns { src, hasLocal, fallbackPath, failed, onError }.
 */
export function useLocalVideo(key, { enabled = true, fallbackPath: fallbackOverride = null } = {}) {
  const [localUrl, setLocalUrl] = useState(() => getCachedLocalVideoObjectUrl(key));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setFailed(false);
    preloadLocalVideo(key).then((url) => {
      if (!cancelled) setLocalUrl(url);
    });
    const unsub = subscribeLocalVideo(key, (url) => {
      if (!cancelled) {
        setLocalUrl(url);
        setFailed(false);
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [key, enabled]);

  const fallbackPath = fallbackOverride ?? VIDEO_FALLBACK_PATHS[key] ?? null;
  const src = localUrl || (!failed ? fallbackPath : null);

  return {
    src,
    localUrl,
    hasLocal: !!localUrl,
    fallbackPath,
    failed,
    onError: () => setFailed(true),
    /** Re-resolve after upload — prefer fresh blob over fallback */
    resolvedSrc: resolveVideoSrcSync(key),
  };
}
