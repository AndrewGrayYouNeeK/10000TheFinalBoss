import React from "react";
import { useLocalVideo } from "@/hooks/useLocalVideo";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import GlitchNeonBanner from "@/components/game/GlitchNeonBanner";

/** YouNeeK 10,000 sign — looping uploaded video or static glitch banner fallback. */
export default function GameplayBillboard({ enabled = true }) {
  const { src, onError } = useLocalVideo(VIDEO_KEYS.GAMEPLAY_BILLBOARD, { enabled });
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    setHidden(false);
  }, [src]);

  if (enabled && src && !hidden) {
    return (
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onError={() => {
          onError();
          setHidden(true);
        }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ maxWidth: "none", maxHeight: "none", objectPosition: "center 30%" }}
      />
    );
  }

  return (
    <GlitchNeonBanner
      src="/assets/354eae8fe_generated_image.png"
      alt="YouNeeK 10000 sign"
      objectPosition="center 30%"
    />
  );
}
