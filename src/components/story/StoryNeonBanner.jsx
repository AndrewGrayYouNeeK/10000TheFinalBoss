import React, { useRef, useState, useEffect } from "react";
import GlitchNeonBanner from "@/components/game/GlitchNeonBanner";
import { STORY_ASSETS } from "@/lib/storyAssets";
import { assetUrl } from "@/lib/assetUrl";

/**
 * Looping YouNeeK 10,000 sign for story matches.
 * Plays a video when available; falls back to the glitch neon image banner.
 */
export default function StoryNeonBanner({
  videoSrc = STORY_ASSETS.signLoopVideo,
  fallbackSrc = STORY_ASSETS.signFallbackImage,
  objectPosition = "center 30%",
}) {
  const videoRef = useRef(null);
  const [useFallback, setUseFallback] = useState(!videoSrc);
  const resolvedVideo = videoSrc ? assetUrl(videoSrc) : null;
  const resolvedFallback = assetUrl(fallbackSrc);

  useEffect(() => {
    setUseFallback(!resolvedVideo);
  }, [resolvedVideo]);

  if (useFallback || !resolvedVideo) {
    return (
      <div
        className="rounded-2xl overflow-hidden border-2"
        style={{
          borderColor: "#22c55e",
          boxShadow: "0 0 18px #00ff80, 0 0 36px rgba(34,197,94,0.45)",
        }}
      >
        <GlitchNeonBanner
          src={resolvedFallback}
          alt="YouNeeK 10000 sign"
          objectPosition={objectPosition}
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden border-2 relative bg-black"
      style={{
        borderColor: "#22c55e",
        boxShadow: "0 0 18px #00ff80, 0 0 36px rgba(34,197,94,0.45)",
      }}
    >
      <video
        ref={videoRef}
        src={resolvedVideo}
        className="w-full h-48 sm:h-64 object-cover"
        style={{ objectPosition }}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onError={() => setUseFallback(true)}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0px, rgba(34,197,94,0.15) 2px, transparent 4px)",
        }}
      />
    </div>
  );
}
