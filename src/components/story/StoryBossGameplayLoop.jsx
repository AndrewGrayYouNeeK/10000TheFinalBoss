import React, { useRef } from "react";
import { useStoryBossVideo } from "@/hooks/useStoryBossVideo";
import { getBossDefinition } from "@/lib/storyBosses";

/** Story fight gameplay loop — per-boss upload; Neo never uses bundled 10,000 sign mp4. */
export default function StoryBossGameplayLoop({
  bossId,
  enabled = true,
  fit = "contain",
  objectPosition = "center center",
}) {
  const { src, onError } = useStoryBossVideo(bossId, "avatar", { enabled: enabled && !!bossId });
  const videoRef = useRef(null);
  const [hidden, setHidden] = React.useState(false);
  const boss = getBossDefinition(bossId);
  const objectClass = fit === "contain" ? "object-contain" : "object-cover";

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
        className={`absolute inset-0 w-full h-full ${objectClass}`}
        style={{ maxWidth: "none", maxHeight: "none", objectPosition }}
      />
    );
  }

  if (boss?.avatar && /^(https?:\/\/|\/assets\/)/.test(boss.avatar)) {
    return (
      <img
        src={boss.avatar}
        alt={boss.name}
        className={`absolute inset-0 w-full h-full ${objectClass}`}
        style={{ objectPosition }}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-80">
      {boss?.avatar ?? "?"}
    </div>
  );
}
