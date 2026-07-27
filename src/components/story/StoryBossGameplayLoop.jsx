import React, { useRef } from "react";
import { useStoryBossVideo } from "@/hooks/useStoryBossVideo";
import { getBossDefinition } from "@/lib/storyBosses";
import {
  getStoryBossAvatarLoopFit,
  getStoryBossAvatarLoopVideoStyle,
} from "@/lib/storyBossVideos";
import {
  getFishermanAvatarLoopVideoStyle,
  useFishermanAvatarLoopSettings,
} from "@/lib/fishermanAvatarLoopSettings";

/** Story fight gameplay loop — per-boss upload; Neo never uses bundled 10,000 sign mp4. */
export default function StoryBossGameplayLoop({
  bossId,
  enabled = true,
  fit: fitOverride,
  videoStyle: videoStyleOverride,
}) {
  const fishermanTuning = useFishermanAvatarLoopSettings();
  const { src, onError } = useStoryBossVideo(bossId, "avatar", { enabled: enabled && !!bossId });
  const videoRef = useRef(null);
  const [hidden, setHidden] = React.useState(false);
  const boss = getBossDefinition(bossId);
  const fit = fitOverride ?? getStoryBossAvatarLoopFit(bossId);
  const baseStyle =
    videoStyleOverride ??
    (bossId === "fisherman"
      ? getFishermanAvatarLoopVideoStyle(fishermanTuning)
      : getStoryBossAvatarLoopVideoStyle(bossId));
  const videoStyle = fitOverride ? { ...baseStyle, objectFit: fit } : baseStyle;

  React.useEffect(() => {
    setHidden(false);
  }, [src, bossId]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled || !src || hidden) return undefined;
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {});
    return undefined;
  }, [enabled, src, hidden]);

  if (enabled && src && !hidden) {
    return (
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onError={() => {
          onError();
          setHidden(true);
        }}
        className="absolute inset-0 w-full h-full"
        style={videoStyle}
      />
    );
  }

  if (boss?.avatar && /^(https?:\/\/|\/assets\/)/.test(boss.avatar)) {
    return (
      <img
        src={boss.avatar}
        alt={boss.name}
        className="absolute inset-0 w-full h-full"
        style={videoStyle}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-80">
      {boss?.avatar ?? "?"}
    </div>
  );
}
