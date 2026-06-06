import React from "react";

// Renders a boss avatar — either an emoji string OR an image URL.
// sizeClass controls the wrapper box, emojiClass controls the text size.
export default function BossAvatar({ boss, sizeClass = "w-14 h-14", emojiClass = "text-3xl", rounded = "rounded-xl" }) {
  if (!boss) return null;
  const isImg = typeof boss.avatar === "string" && /^https?:\/\//.test(boss.avatar);
  return (
    <div
      className={`${sizeClass} ${rounded} flex items-center justify-center ${emojiClass} bg-gradient-to-br ${boss.color} flex-shrink-0 overflow-hidden`}
      style={{ boxShadow: "0 0 18px rgba(0,0,0,0.4)" }}
    >
      {isImg ? (
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