import React from "react";
import { cn } from "@/lib/utils";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import {
  getPlayerAvatarStripTransform,
  PLAYER_AVATAR_FALLBACK_PATH,
  PLAYER_AVATAR_VIDEO_KEY,
} from "@/lib/playerAvatarVideo";

/** Looping character portrait — one horizontal strip slot per player (2–4). */
export default function PlayerAvatarVideo({
  playerIndex = 0,
  playerCount = 2,
  label = "",
  sizeClass = "w-9 h-9",
  active = false,
  className,
}) {
  const { src, onError } = useLocalVideo(PLAYER_AVATAR_VIDEO_KEY, {
    fallbackPath: PLAYER_AVATAR_FALLBACK_PATH,
  });
  const [failed, setFailed] = React.useState(false);
  const videoRef = React.useRef(null);
  const showVideo = !!src && !failed;
  const strip = getPlayerAvatarStripTransform(playerIndex, playerCount);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  React.useEffect(() => {
    if (!showVideo) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {});
    return undefined;
  }, [showVideo, src, playerIndex, playerCount]);

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-full flex-shrink-0 overflow-hidden relative border-2",
        className,
      )}
      style={
        active
          ? {
              borderColor: "rgba(0,255,200,0.85)",
              boxShadow: "0 0 12px rgba(0,255,200,0.55), 0 0 8px rgba(255,0,170,0.35)",
            }
          : {
              borderColor: "rgba(255,255,255,0.18)",
              boxShadow: "0 0 6px rgba(0,0,0,0.35)",
            }
      }
      title={label || undefined}
      aria-hidden={!label}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          key={`${src}-${playerIndex}-${playerCount}`}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={strip}
          onError={() => {
            onError();
            setFailed(true);
          }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white font-black text-sm"
          style={{
            background: "linear-gradient(135deg, #ff00aa, #00ffc8)",
            textShadow: "0 0 6px rgba(0,0,0,0.6)",
          }}
        >
          {playerIndex + 1}
        </div>
      )}
    </div>
  );
}
