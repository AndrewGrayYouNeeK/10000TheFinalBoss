/**
 * Shark Bite chomp event + default timing constants.
 * Kept outside BlueGelPowerFX.jsx so Vite Fast Refresh can update that
 * component module without remounting Game / StoryGame (score wipe).
 */
import { DEFAULT_SHARK_BITE_SETTINGS } from "@/lib/sharkBiteSettings";

/** CustomEvent name — DiceTray listens so tray dice vanish on chomp. */
export const SHARK_BITE_CHOMP_EVENT = "yourneek:shark-bite-chomp";

/** Default timing exports — prefer useSharkBiteSettings() for live values. */
export const SHARK_BITE_CHOMP_MS = DEFAULT_SHARK_BITE_SETTINGS.chompMs;
export const SHARK_BITE_FX_MS = DEFAULT_SHARK_BITE_SETTINGS.fxMs;
export const SHARK_BITE_PRE_SWIM_MS = DEFAULT_SHARK_BITE_SETTINGS.preSwimMs;
export const SHARK_BITE_SVG_BEAT_MS = DEFAULT_SHARK_BITE_SETTINGS.svgBeatMs;
export const SHARK_BITE_TOTAL_MS =
  DEFAULT_SHARK_BITE_SETTINGS.svgBeatMs + DEFAULT_SHARK_BITE_SETTINGS.fxMs;
export const SHARK_BITE_FALLBACK_VANISH_MS = DEFAULT_SHARK_BITE_SETTINGS.fallbackVanishMs;
export const SHARK_BITE_CHOMP_PROGRESS = DEFAULT_SHARK_BITE_SETTINGS.chompProgress;
export const SHARK_BITE_FADE_START = DEFAULT_SHARK_BITE_SETTINGS.fadeStart;
export const SHARK_BITE_STOP_AT_PROGRESS = DEFAULT_SHARK_BITE_SETTINGS.stopAtProgress;

export function emitSharkBiteChomp() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SHARK_BITE_CHOMP_EVENT));
}
