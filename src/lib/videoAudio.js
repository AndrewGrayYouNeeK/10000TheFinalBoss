/** When false, uploaded videos may play sound (respects game mute toggle). */
export function wantVideoSound(sfxMuted = false) {
  return !sfxMuted;
}

/** Seek past a leading segment before play (does not modify the source file). */
export function applyVideoStartOffset(video, startAtSeconds = 0) {
  if (!video || startAtSeconds <= 0) return;
  const duration = video.duration;
  const safeMax =
    Number.isFinite(duration) && duration > 0 ? Math.max(0, duration - 0.05) : startAtSeconds;
  video.currentTime = Math.min(startAtSeconds, safeMax);
}

/** Mute once playback reaches muteAtSeconds on the source timeline. Returns cleanup. */
export function bindVideoMuteAt(video, muteAtSeconds, onMute) {
  if (!video || muteAtSeconds <= 0) return () => {};

  let fired = false;
  const check = () => {
    if (fired || video.currentTime < muteAtSeconds) return;
    fired = true;
    video.muted = true;
    video.volume = 0;
    onMute?.();
  };

  video.addEventListener("timeupdate", check);
  check();
  return () => video.removeEventListener("timeupdate", check);
}

/** Apply mute/volume from the game sound toggle. */
export function syncVideoAudio(video, { sfxMuted = false } = {}) {
  if (!video) return;
  const on = wantVideoSound(sfxMuted);
  video.muted = !on;
  video.volume = on ? 1 : 0;
}

/**
 * Play a video — tries with sound when allowed; falls back to muted autoplay.
 * Returns true when audio is playing.
 */
export async function playVideoWithAudio(video, { sfxMuted = false, preferSound = true } = {}) {
  if (!video) return false;

  if (!preferSound || !wantVideoSound(sfxMuted)) {
    syncVideoAudio(video, { sfxMuted: true });
    try {
      await video.play();
    } catch {
      /* ignore */
    }
    return false;
  }

  video.muted = false;
  video.volume = 1;
  try {
    await video.play();
    return true;
  } catch {
    video.muted = true;
    video.volume = 0;
    try {
      await video.play();
    } catch {
      /* ignore */
    }
    return false;
  }
}
