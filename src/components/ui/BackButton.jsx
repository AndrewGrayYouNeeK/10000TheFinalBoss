import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gameHubPath } from "@/lib/webPlay";

const btnClass =
  "shrink-0 border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white";

/**
 * Visible back control — use on every screen including in-game.
 * Pass `onClick` for custom navigation (e.g. forfeit confirm).
 * Pass `confirmMessage` to prompt before leaving.
 * Default `to` is the game hub (`/` native, `/play` on web).
 */
export default function BackButton({
  to,
  label = "Back",
  onClick,
  confirmMessage,
  className = "",
}) {
  const dest = to ?? gameHubPath();
  const handleLinkClick = (e) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      e.preventDefault();
    }
  };

  if (onClick) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`${btnClass} ${className}`}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          onClick();
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" size="sm" className={`${btnClass} ${className}`}>
      <Link to={dest} onClick={handleLinkClick}>
        <ArrowLeft className="w-4 h-4" />
        {label}
      </Link>
    </Button>
  );
}

/** Top safe-area padding for sticky page headers (iOS notch) */
export const PAGE_HEADER_SAFE_STYLE = {
  paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
};
