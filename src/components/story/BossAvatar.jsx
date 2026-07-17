import React from "react";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import { useStoryBossVideo } from "@/hooks/useStoryBossVideo";

// Renders a boss avatar — emoji, image URL, or optional looping video (falls back to image).
// sizeClass controls the wrapper box, emojiClass controls the text size.
export default function BossAvatar({
  boss,
  sizeClass = "w-14 h-14",
  emojiClass = "text-3xl",
  rounded = "rounded-xl",
  videoKey = null,
  useBossAvatarVideo = false,
}) {
  const bossVideo = useStoryBossVideo(boss?.id, "avatar", {
    enabled: useBossAvatarVideo && !videoKey,
  });
  const directVideo = useLocalVideo(videoKey, { enabled: !!videoKey });
  const videoSrc = videoKey ? directVideo.src : bossVideo.src;
  const onError = videoKey ? directVideo.onError : bossVideo.onError;
  const [videoFailed, setVideoFailed] = React.useState(false);

  React.useEffect(() => {
    setVideoFailed(false);
  }, [videoSrc, videoKey]);

  if (!boss) return null;

  const isImg = typeof boss.avatar === "string" && /^(https?:\/\/|\/assets\/)/.test(boss.avatar);
  const showVideo = !!(videoKey || useBossAvatarVideo) && !!videoSrc && !videoFailed;

  return (
    <div
      className={`${sizeClass} ${rounded} flex items-center justify-center ${emojiClass} bg-gradient-to-br ${boss.color} flex-shrink-0 overflow-hidden`}
      style={{ boxShadow: "0 0 18px rgba(0,0,0,0.4)" }}
    >
      {showVideo ? (
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: "drop-shadow(0 0 8px rgba(0,255,200,0.6))" }}
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