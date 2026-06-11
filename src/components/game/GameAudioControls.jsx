import React from "react";
import MuteToggleButton from "@/components/game/MuteToggleButton";

export default function GameAudioControls({
  sfxMuted,
  opponentSfxMuted,
  onToggleSfx,
  onToggleOpponent,
  showOpponent = true,
}) {
  return (
    <div
      className="flex items-center justify-center gap-2 flex-wrap rounded-xl border px-3 py-2"
      style={{
        borderColor: "rgba(0,255,200,0.22)",
        background: "rgba(3,4,10,0.55)",
        boxShadow: "inset 0 0 0 1px rgba(255,0,170,0.08)",
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-full text-center sm:w-auto sm:mr-1">
        Audio
      </span>
      <MuteToggleButton
        muted={sfxMuted}
        onToggle={onToggleSfx}
        label="game sounds"
        compact={false}
      />
      {showOpponent && (
        <MuteToggleButton
          muted={opponentSfxMuted}
          onToggle={onToggleOpponent}
          label="opponent"
          compact={false}
        />
      )}
    </div>
  );
}
