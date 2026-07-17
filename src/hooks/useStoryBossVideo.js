import { useCallback, useEffect, useState } from "react";
import { subscribeLocalVideo } from "@/lib/localVideoStore";
import {
  getStoryBossVideoWatchKeys,
  resolveStoryBossVideoPlayback,
} from "@/lib/storyBossVideos";

/**
 * Resolves a story boss video with fallback:
 * intro: per-boss upload only.
 * win: per-boss → STORY_BOSS_WIN → catalog (not sign clips).
 * avatar: per-boss → intro (non-Neo) → Neo gameplay uploads only (never bundled 10,000 sign).
 */
export function useStoryBossVideo(bossId, slot, { enabled = true } = {}) {
  const [src, setSrc] = useState(null);
  const [hasLocal, setHasLocal] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const watchKeys = bossId && enabled ? getStoryBossVideoWatchKeys(bossId, slot) : [];

  const refresh = useCallback(async () => {
    if (!enabled || !bossId) {
      setSrc(null);
      setHasLocal(false);
      setFailed(false);
      setReady(true);
      return;
    }
    const result = await resolveStoryBossVideoPlayback(bossId, slot);
    setSrc(result.src);
    setHasLocal(result.hasLocal);
    setFailed(false);
    setReady(true);
  }, [bossId, slot, enabled]);

  useEffect(() => {
    setSrc(null);
    setHasLocal(false);
    setFailed(false);
    setReady(false);
  }, [bossId, slot, enabled]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!enabled || !bossId) {
        if (!cancelled) {
          setSrc(null);
          setHasLocal(false);
          setFailed(false);
          setReady(true);
        }
        return;
      }
      const result = await resolveStoryBossVideoPlayback(bossId, slot);
      if (!cancelled) {
        setSrc(result.src);
        setHasLocal(result.hasLocal);
        setFailed(false);
        setReady(true);
      }
    })();

    const unsubs = watchKeys.map((key) => subscribeLocalVideo(key, refresh));

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [bossId, slot, enabled, watchKeys.join("|"), refresh]);

  const playableSrc = hasLocal ? src : failed ? null : src;

  return {
    src: ready ? playableSrc : null,
    hasLocal,
    failed,
    ready,
    onError: () => setFailed(true),
  };
}
