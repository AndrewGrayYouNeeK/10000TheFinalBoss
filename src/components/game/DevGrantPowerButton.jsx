import React from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TEMP/DEV — one-tap power charge for testing secret powers on any equipped skin.
 * Not for public builds; gated by isDevPowerToolsEnabled() in callers.
 */
export default function DevGrantPowerButton({
  onGrant,
  disabled = false,
  charged = false,
  className,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onGrant}
      title="DEV: Instant power charge — power-mode dice + Fire ready"
      className={cn(
        "h-7 px-3 rounded-full border text-[9px] font-black uppercase tracking-wider",
        "inline-flex items-center gap-1.5 shrink-0 transition-all",
        "disabled:opacity-40 disabled:pointer-events-none",
        charged
          ? "text-amber-50 border-amber-400/80 bg-gradient-to-r from-amber-500/90 to-orange-600/85 shadow-[0_0_14px_rgba(251,146,60,0.55)]"
          : "text-violet-50 border-violet-400/70 bg-gradient-to-r from-violet-600/85 to-fuchsia-600/80 shadow-[0_0_12px_rgba(192,38,211,0.45)]",
        className
      )}
    >
      <Zap className="w-3.5 h-3.5" />
      {charged ? "Stack power +" : "Grant power"}
    </button>
  );
}
