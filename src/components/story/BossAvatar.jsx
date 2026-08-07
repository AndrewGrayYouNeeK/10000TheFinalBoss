import React from "react";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import { useStoryBossVideo } from "@/hooks/useStoryBossVideo";
import { getStoryBossAvatarLoopVideoStyle } from "@/lib/storyBossVideos";
import {
  getSharkTankAvatarLoopVideoStyle,
  useSharkTankAvatarLoopSettings,
} from "@/lib/sharkTankAvatarLoopSettings";

// Renders a boss avatar — emoji, image URL, or optional looping video (falls back to image).
// sizeClass controls the wrapper box, emojiClass controls the text size.
export default function BossAvatar({
  boss,
  sizeClass = "w-14 h-14",
  emojiClass = "text-3xl",
  rounded = "rounded-xl",
  videoKey = null,
  useBossAvatarVideo = false,
  /** Story gameplay loops stay silent even when game sound is on. */
  silent = false,
}) {
  const bossVideo = useStoryBossVideo(boss?.id, "avatar", {
    enabled: useBossAvatarVideo && !videoKey && !!boss,
  });
  const directVideo = useLocalVideo(videoKey, { enabled: !!videoKey });
  const videoSrc = videoKey ? directVideo.src : bossVideo.src;
  const onError = videoKey ? directVideo.onError : bossVideo.onError;
  const [videoFailed, setVideoFailed] = React.useState(false);
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    setVideoFailed(false);
  }, [videoSrc, videoKey]);

  const showVideo =
    !!boss &&
    !!(videoKey || useBossAvatarVideo) &&
    !!videoSrc &&
    !videoFailed;
  const sharkTankTuning = useSharkTankAvatarLoopSettings();
  const avatarVideoStyle =
    useBossAvatarVideo && boss?.id
      ? boss.id === "shark_tank"
        ? getSharkTankAvatarLoopVideoStyle(sharkTankTuning)
        : getStoryBossAvatarLoopVideoStyle(boss.id)
      : { objectFit: "cover", objectPosition: "center center" };

  React.useEffect(() => {
    if (!showVideo) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    if (silent) {
      video.muted = true;
      video.volume = 0;
    }
    video.play().catch(() => {});
    return undefined;
  }, [silent, videoSrc, showVideo]);

  if (!boss) return null;

  const isImg = typeof boss.avatar === "string" && /^(https?:\/\/|\/assets\/)/.test(boss.avatar);

  return (
    <div
      className={`${sizeClass} ${rounded} flex items-center justify-center ${emojiClass} bg-gradient-to-br ${boss.color} flex-shrink-0 overflow-hidden`}
      style={{ boxShadow: "0 0 18px rgba(0,0,0,0.4)" }}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full"
          style={{
            filter: "drop-shadow(0 0 8px rgba(0,255,200,0.6))",
            ...avatarVideoStyle,
          }}
          onError={() => {
            onError();
            setVideoFailed(true);
          }}
        />
      ) : isImg ? (
        <img
          src={boss.avatar}
          alt={boss.name}
          className="w-full h-full object-cover"
          style={{ filter: "drop-shadow(0 0 8px rgba(0,255,200,0.6))" }}
        />
      ) : (
        boss.avatar
      )}
    </div>
  );
}
