import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useDevPreview } from "@/hooks/useDevPreview";

/** Floating banner — preview unlock for shop demos. Turn off to restore normal shop/saves. */
export default function DevPreviewBanner() {
  const { active, setEnabled } = useDevPreview();

  if (!active) return null;

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-2 px-3 py-2 text-xs border-b"
      style={{
        background: "rgba(255,140,0,0.15)",
        borderColor: "rgba(255,180,0,0.45)",
        color: "#fde68a",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 shrink-0 text-amber-300" />
        <span className="font-semibold leading-tight">
          Preview mode — all skins & felts unlocked for demos. Your real save is unchanged.
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 h-7 text-[10px] border-amber-500/50 text-amber-200 hover:bg-amber-500/20"
        onClick={() => {
          setEnabled(false);
          window.location.reload();
        }}
      >
        <EyeOff className="w-3 h-3 mr-1" />
        Exit preview
      </Button>
    </div>
  );
}
