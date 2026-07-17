import React from "react";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import { cn } from "@/lib/utils";

/**
 * Muted looping video strip. Uses IndexedDB upload or catalog fallback.
 * Hides itself if no source or playback fails.
 */
export default function LocalLoopVideo({
  videoKey,
  className,
  heightClass = "h-24 sm:h-28",
  objectFit = "cover",
  enabled = true,
  rounded = true,
  border = true,
}) {
  const { src, onError } = useLocalVideo(videoKey, { enabled });
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    setHidden(false);
  }, [src]);

  if (!enabled || !src || hidden) return null;

  return (
    <div
      className={cn(
        "w-full overflow-hidden pointer-events-none",
        heightClass,
        rounded && "rounded-xl",
        border && "border border-white/10",
        className
      )}
    >
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        onError={() => {
          onError();
          setHidden(true);
        }}
        className="w-full h-full"
        style={{ objectFit }}
      />
    </div>
  );
}
