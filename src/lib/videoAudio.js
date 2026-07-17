/** When false, uploaded videos may play sound (respects game mute toggle). */
export function wantVideoSound(sfxMuted = false) {
  return !sfxMuted;
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
