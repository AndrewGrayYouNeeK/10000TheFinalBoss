import { useCallback } from "react";
import { shouldPlaySfx } from "@/lib/gameAudioSettings";
import { playDiceRollSound } from "@/lib/diceSoundEngine";

/**
 * Hook that returns a play() function for the soft felt dice roll SFX.
 */
export function useDiceSound() {
  const play = useCallback((options = {}) => {
    const { opponent = false } = typeof options === "object" && options !== null ? options : {};
    if (!shouldPlaySfx({ opponent })) return;
    void playDiceRollSound({ opponent });
  }, []);

  return play;
}
