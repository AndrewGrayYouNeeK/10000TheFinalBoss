import { useEffect, useState } from "react";
import {
  isInActiveGamePlay,
  isInShopPreview,
  subscribeDiceAudioContext,
} from "@/lib/gameAudioSettings";

/** Re-renders when game/shop preview audio context changes. */
export function useDiceSkinAudioAllowed() {
  const [, tick] = useState(0);

  useEffect(() => subscribeDiceAudioContext(() => tick((n) => n + 1)), []);

  return isInActiveGamePlay() || isInShopPreview();
}
