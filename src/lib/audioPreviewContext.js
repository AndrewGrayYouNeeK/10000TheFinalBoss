import { createAudioContext, resumeAudioContext } from "@/components/game/portfolio/micAccess";

let sharedCtx = null;

/** Sync unlock — call from tap/click before scheduling audio (iOS). */
export function unlockPreviewAudio() {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) sharedCtx = createAudioContext();
    if (sharedCtx.state === "suspended") void sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

export async function getRunningPreviewContext() {
  const ctx = unlockPreviewAudio();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await resumeAudioContext(ctx);
    } catch {
      return null;
    }
  }
  return ctx.state === "running" ? ctx : null;
}

export function getPreviewContextSync() {
  return sharedCtx;
}
