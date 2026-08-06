import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import NightCityBackground from "@/components/online/NightCityBackground";
import { useCosmetics } from "@/hooks/useCosmetics";
import { useOnlineMatch } from "@/hooks/useOnlineMatch";
import {
  clearOnlineLiveSession,
  defaultOnlineDisplayName,
  defaultOnlineSkinId,
  readOnlineLiveSession,
} from "@/lib/onlineClient";
import { GHOST_SKIN_ID, pickTrueSkinForGhost } from "@/lib/ghostDisguise";
import { readProfileOnlineVisibility } from "@/lib/onlineVisibility";
import { toast } from "sonner";

/**
 * Waiting room for `/online/:matchId/play`.
 * When the match starts, hands off to `/game` (same live session + playerId).
 */
export default function OnlinePlay() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { equippedSkinId, ghostDisguiseId, ownedSkins } = useCosmetics();
  const session = readOnlineLiveSession();
  const code = (matchId || session?.code || "").toUpperCase();

  const [name] = useState(() => defaultOnlineDisplayName());
  const [visibility] = useState(() => readProfileOnlineVisibility());

  const playerId = session?.playerId;
  const skinId = equippedSkinId || defaultOnlineSkinId();
  const trueSkinId = useMemo(
    () =>
      skinId === GHOST_SKIN_ID
        ? ghostDisguiseId || pickTrueSkinForGhost(ownedSkins)
        : null,
    [skinId, ghostDisguiseId, ownedSkins]
  );

  useEffect(() => {
    if (!code || !playerId) {
      navigate(code ? `/online/${encodeURIComponent(code)}` : "/online", { replace: true });
    }
  }, [code, playerId, navigate]);

  const match = useOnlineMatch({
    enabled: !!code && !!playerId,
    code,
    playerId,
    name,
    skinId,
    trueSkinId,
    visibility,
    onToast: (msg, variant) => {
      if (variant === "warning") toast.warning(msg);
      else toast.success(msg);
    },
  });

  useEffect(() => {
    if (match.status === "playing" || match.serverPayload) {
      // Persist names for Game boot chrome; authoritative state comes from the server.
      const seats = match.lobby?.seats || [];
      if (seats.length >= 2) {
        sessionStorage.setItem(
          "dice10k_players",
          JSON.stringify(seats.map((s) => s.name || `Player ${s.playerIndex + 1}`))
        );
      }
      navigate("/game", { replace: true });
    }
  }, [match.status, match.serverPayload, match.lobby, navigate]);

  const mySeat = useMemo(
    () => match.lobby?.seats?.find((s) => s.playerIndex === match.viewerPlayerIndex),
    [match.lobby, match.viewerPlayerIndex]
  );

  const leave = () => {
    match.leave();
    clearOnlineLiveSession();
    navigate("/online");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative text-white"
      style={{ background: "#020408" }}
    >
      <NightCityBackground />
      <div className="absolute top-0 left-0 right-0 z-10 px-4" style={PAGE_HEADER_SAFE_STYLE}>
        <BackButton onClick={leave} label="Leave" />
      </div>

      <div className="z-10 w-full max-w-md text-center space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Room</p>
        <p className="font-mono text-3xl tracking-[0.35em] text-cyan-300 font-bold">{code}</p>

        {(match.status === "connecting" || match.status === "idle") && (
          <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting to match server…
          </p>
        )}

        {match.error && <p className="text-sm text-rose-400">{match.error}</p>}

        {match.lobby && (
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 text-left space-y-2">
            <p className="text-[10px] font-bold uppercase text-slate-400">Players</p>
            {(match.lobby.seats || []).map((seat) => (
              <div
                key={seat.playerIndex}
                className="flex items-center justify-between text-sm text-slate-200"
              >
                <span>
                  {seat.name}
                  {seat.playerIndex === match.viewerPlayerIndex ? " (you)" : ""}
                </span>
                <span className="text-xs text-slate-500">
                  {seat.ready ? "Ready" : seat.connected ? "Joined" : "Offline"}
                </span>
              </div>
            ))}
            {(match.lobby.seats?.length || 0) < 2 && (
              <p className="text-xs text-slate-500 pt-1">
                Waiting for opponent — share code{" "}
                <span className="text-cyan-300 font-mono">{code}</span>
              </p>
            )}
          </div>
        )}

        <Button
          type="button"
          disabled={!match.connected || mySeat?.ready}
          className="w-full font-bold"
          style={{ background: "linear-gradient(135deg, #00ffc8, #00b8ff)", color: "#000" }}
          onClick={() => match.setReady()}
        >
          {mySeat?.ready ? "Waiting for opponent…" : "I'm ready"}
        </Button>

        <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300">
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
