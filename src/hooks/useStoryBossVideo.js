import { useCallback, useEffect, useState } from "react";
import { getLocalVideoObjectUrl, subscribeLocalVideo } from "@/lib/localVideoStore";
import {
  getStoryBossVideoGlobalKey,
  resolveStoryBossVideoSrc,
  storyBossPrimaryKey,
} from "@/lib/storyBossVideos";

async function resolveBossVideo(bossId, slot) {
  if (!bossId) return { src: null, hasLocal: false };

  const primaryKey = storyBossPrimaryKey(bossId, slot);
  const primaryLocal = await getLocalVideoObjectUrl(primaryKey);
  if (primaryLocal) {
    return { src: primaryLocal, hasLocal: true };
  }

  // Intro: per-boss upload only — never reuse Story hub / Matrix / other clips.
  if (slot === "intro") {
    return { src: null, hasLocal: false };
  }

  const globalKey = getStoryBossVideoGlobalKey(bossId, slot);
  if (globalKey) {
    const globalLocal = await getLocalVideoObjectUrl(globalKey);
    if (globalLocal) {
      return { src: globalLocal, hasLocal: true };
    }
  }

  const src = await resolveStoryBossVideoSrc(bossId, slot);
  return { src, hasLocal: false };
}

/**
 * Resolves a story boss video with fallback:
 * intro: per-boss upload only (no shared Story hub / Matrix fallback).
 * win: per-boss → STORY_BOSS_WIN → catalog.
 * avatar: per-boss → neo GAMEPLAY_LOOP → null.
 */
export function useStoryBossVideo(bossId, slot, { enabled = true } = {}) {
  const [src, setSrc] = useState(null);
  const [hasLocal, setHasLocal] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const primaryKey = bossId ? storyBossPrimaryKey(bossId, slot) : null;
  const globalKey = bossId ? getStoryBossVideoGlobalKey(bossId, slot) : null;

  const refresh = useCallback(async () => {
    if (!enabled || !bossId) {
      setSrc(null);
      setHasLocal(false);
      setFailed(false);
      setReady(true);
      return;
    }
    const result = await resolveBossVideo(bossId, slot);
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
      const result = await resolveBossVideo(bossId, slot);
      if (!cancelled) {
        setSrc(result.src);
        setHasLocal(result.hasLocal);
        setFailed(false);
        setReady(true);
      }
    })();

    const unsubs = [];
    if (enabled && primaryKey) unsubs.push(subscribeLocalVideo(primaryKey, refresh));
    if (enabled && globalKey) unsubs.push(subscribeLocalVideo(globalKey, refresh));

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [bossId, slot, enabled, primaryKey, globalKey, refresh]);

  const playableSrc = hasLocal ? src : failed ? null : src;

  return {
    src: ready ? playableSrc : null,
    hasLocal,
    failed,
    ready,
    onError: () => setFailed(true),
  };
}
