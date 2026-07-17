import { useCallback, useEffect, useRef } from "react";
import { playVideoWithAudio, syncVideoAudio } from "@/lib/videoAudio";

/**
 * Ref + effects for looping/uploaded videos that should respect the game mute toggle.
 * Unmutes after the first tap when sound is allowed (browser autoplay policy).
 */
export function useVideoAudioRef({ sfxMuted = false, enabled = true } = {}) {
  const ref = useRef(null);

  const apply = useCallback(async () => {
    const video = ref.current;
    if (!video || !enabled) return;
    syncVideoAudio(video, { sfxMuted });
    if (!sfxMuted && !video.paused) {
      video.muted = false;
      video.volume = 1;
      return;
    }
    if (video.paused) {
      await playVideoWithAudio(video, { sfxMuted, preferSound: !sfxMuted });
    }
  }, [enabled, sfxMuted]);

  useEffect(() => {
    apply();
  }, [apply]);

  useEffect(() => {
    if (!enabled || sfxMuted) return undefined;

    const unlock = () => {
      const video = ref.current;
      if (!video) return;
      playVideoWithAudio(video, { sfxMuted: false, preferSound: true });
    };

    document.addEventListener("pointerdown", unlock, { capture: true });
    return () => document.removeEventListener("pointerdown", unlock, { capture: true });
  }, [enabled, sfxMuted]);

  return ref;
}
