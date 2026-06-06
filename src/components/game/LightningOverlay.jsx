import React from "react";

/**
 * Video-based electric overlay. Plays a looping muted video clip on top of the die face.
 */
export default function LightningOverlay({ size = 64, radius = 4 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ borderRadius: radius }}
    >
      <video
        src="/assets/fde6fe169_ca9c480e8677452185635915c4d441a5.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ mixBlendMode: "screen" }}
      />
    </div>
  );
}