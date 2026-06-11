import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MuteToggleButton({
  muted,
  onToggle,
  label = "sound",
  compact = false,
  className = "",
}) {
  const title = muted ? `Unmute ${label}` : `Mute ${label}`;

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={onToggle}
      aria-label={title}
      title={title}
      className={`shrink-0 text-white hover:bg-white/10 hover:text-white ${className}`}
      style={
        muted
          ? { color: "rgba(248,113,113,0.95)" }
          : { color: "rgba(110,255,212,0.95)" }
      }
    >
      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      {!compact && (
        <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide hidden sm:inline">
          {muted ? "Muted" : "Sound"}
        </span>
      )}
    </Button>
  );
}
