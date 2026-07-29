import React, { useRef } from "react";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import { useVideoAudioRef } from "@/hooks/useVideoAudio";
import {
  MATRIX_GAMEPLAY_BILLBOARD_KEY,
  getGameplayBillboardFallback,
} from "@/lib/diceBillboardVideo";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import GlitchNeonBanner from "@/components/game/GlitchNeonBanner";

/** YouNeeK 10,000 sign — regular upload/static sign, or Matrix Sprite Lab slot. */
export default function GameplayBillboard({
  enabled = true,
  sfxMuted = false,
  /** Story mode sign — always silent (cutscenes keep their own audio). */
  muteAudio = false,
  /** cover = fill frame (local game) · contain = show full video (story mode sign) */
  fit = "cover",
  objectPosition = fit === "contain" ? "center center" : "center 30%",
  /** sign = regular 10,000 billboard · matrix = Matrix Sprite Lab upload · static = neon sign only */
  source = "matrix",
}) {
  const isStatic = source === "static";
  const videoKey =
    source === "sign" ? VIDEO_KEYS.GAMEPLAY_BILLBOARD : MATRIX_GAMEPLAY_BILLBOARD_KEY;
  const { src, onError } = useLocalVideo(videoKey, {
    enabled: enabled && !isStatic,
    fallbackPath: getGameplayBillboardFallback(),
  });
  const forceSilent = muteAudio;
  const silentRef = useRef(null);
  const audioRef = useVideoAudioRef({
    sfxMuted,
    enabled: enabled && !!src && !forceSilent,
  });
  const videoRef = forceSilent ? silentRef : audioRef;
  const [hidden, setHidden] = React.useState(false);
  const objectClass = fit === "contain" ? "object-contain" : "object-cover";

  React.useEffect(() => {
    setHidden(false);
  }, [src]);

  React.useEffect(() => {
    if (!forceSilent) return undefined;
    const video = silentRef.current;
    if (!video || !enabled || !src) return undefined;
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {});
    return undefined;
  }, [forceSilent, enabled, src]);

  if (isStatic || !(enabled && src && !hidden)) {
    return (
      <GlitchNeonBanner
        src="/assets/354eae8fe_generated_image.png"
        alt="YouNeeK 10000 sign"
        objectPosition={objectPosition}
        objectFit={fit}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      key={src}
      src={src}
      autoPlay
      loop
      muted={forceSilent ? true : undefined}
      playsInline
      preload="auto"
      onError={() => {
        onError();
        setHidden(true);
      }}
      className={`absolute inset-0 w-full h-full ${objectClass}`}
      style={{ maxWidth: "none", maxHeight: "none", objectPosition }}
    />
  );
}
