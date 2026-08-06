import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wifi, WifiOff, Copy, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import NightCityBackground from "@/components/online/NightCityBackground";
import OnlineVisibilityPreview from "@/components/online/OnlineVisibilityPreview";
import MuteToggleButton from "@/components/game/MuteToggleButton";
import { useCosmetics } from "@/hooks/useCosmetics";
import { useOnlineMatch } from "@/hooks/useOnlineMatch";
import { writeOnlineLiveSession, readOnlineLiveSession } from "@/lib/onlineSession";
import { clearOnlineMockSession } from "@/lib/onlineVisibility";
import { GHOST_SKIN_ID } from "@/lib/ghostDisguise";
import { toast } from "sonner";

export default function OnlineLobby() {
  const navigate = useNavigate();
  const { matchId: routeMatchId } = useParams();
  const {
    sfxMuted,
    opponentSfxMuted,
    setSfxMuted,
    setOpponentSfxMuted,
    equippedSkinId,
    ghostDisguiseId,
    profile,
  } = useCosmetics();

  const existing = readOnlineLiveSession();
  const [playerName, setPlayerName] = useState(() => profile?.display_name || "Player");
  const [joinCode, setJoinCode] = useState(() => routeMatchId?.toUpperCase() || "");
  const [connectMode, setConnectMode] = useState(null);

  const disguiseSkinId =
    equippedSkinId === GHOST_SKIN_ID && ghostDisguiseId ? ghostDisguiseId : null;

  const online = useOnlineMatch({
    enabled: !!connectMode,
    mode: connectMode || "create",
    roomCode:
      connectMode === "join" || connectMode === "reconnect"
        ? joinCode || existing?.matchId
        : null,
    playerId: connectMode === "reconnect" ? existing?.playerId : null,
    playerName,
    skinId: equippedSkinId,
    disguiseSkinId,
  });

  useEffect(() => {
    if (routeMatchId && !connectMode) {
      setConnectMode("join");
    } else if (existing && !connectMode && !routeMatchId) {
      setConnectMode("reconnect");
    }
  }, [routeMatchId, existing, connectMode]);

  useEffect(() => {
    if (online.roomState?.status !== "playing" && !online.viewerState) return;

    const joined = online.joinedInfo;
    const matchId = joined?.roomCode || online.roomState?.roomCode;
    const playerId = joined?.playerId || existing?.playerId;
    const viewerIndex = joined?.playerIndex ?? online.roomState?.youAreIndex ?? 0;

    if (!matchId || !playerId) return;

    clearOnlineMockSession();
    const names =
      online.viewerState?.players?.map((p) => p.name) ?? ["You", "Opponent"];
    sessionStorage.setItem("dice10k_players", JSON.stringify(names));
    writeOnlineLiveSession({
      matchId,
      playerId,
      viewerPlayerIndex: viewerIndex,
      isHost: joined?.isHost ?? online.roomState?.isHost ?? false,
    });
    navigate("/game", { replace: true });
  }, [
    online.roomState?.status,
    online.viewerState,
    online.joinedInfo,
    navigate,
    existing?.playerId,
    online.roomState?.roomCode,
    online.roomState?.youAreIndex,
    online.roomState?.isHost,
  ]);

  const roomCode = online.joinedInfo?.roomCode || online.roomState?.roomCode;
  const waiting = online.roomState?.status === "lobby";
  const canStart = online.roomState?.canStart;
  const playerCount = online.roomState?.players?.length ?? 0;

  const copyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied!");
    } catch {
      toast.error(`Could not copy — share manually: ${roomCode}`);
    }
  };

  const serverDown = connectMode && online.error && !online.connected && !roomCode;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative text-white"
      style={{ background: "#020408" }}
    >
      <NightCityBackground />

      <div
        className="absolute top-0 left-0 right-0 z-10 px-4 pb-3 flex items-center justify-between gap-2"
        style={PAGE_HEADER_SAFE_STYLE}
      >
        <BackButton to="/" label="Back" />
        <div className="flex items-center gap-0.5">
          <MuteToggleButton
            muted={sfxMuted}
            onToggle={() => setSfxMuted(!sfxMuted)}
            label="your sounds"
            compact
          />
          <MuteToggleButton
            muted={opponentSfxMuted}
            onToggle={() => setOpponentSfxMuted(!opponentSfxMuted)}
            label="opponent"
            compact
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md z-10 w-full"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: serverDown ? "rgba(255,100,100,0.1)" : "rgba(0,255,200,0.08)",
            border: serverDown
              ? "2px solid rgba(255,100,100,0.4)"
              : "2px solid rgba(0,255,200,0.35)",
          }}
        >
          {serverDown ? (
            <WifiOff className="w-10 h-10 text-rose-400" />
          ) : (
            <Wifi className="w-10 h-10 text-cyan-400" />
          )}
        </div>

        <h1 className="font-pixel text-2xl mb-2" style={{ color: "#00ffc8" }}>
          Play Online
        </h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {serverDown
            ? "Start the online server, then try again."
            : "Create a room or join with a friend's 4-letter code."}
        </p>

        {serverDown && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 mb-4 text-left text-xs text-slate-400">
            <p className="text-rose-300 font-bold mb-1">Server not reachable</p>
            <p className="mb-2">{online.error}</p>
            <p>
              In a second terminal run:{" "}
              <code className="text-cyan-300">npm run dev:online-server</code>
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full border-slate-600"
              onClick={() => setConnectMode(null)}
            >
              Try again
            </Button>
          </div>
        )}

        {!roomCode && !serverDown && (
          <div className="space-y-4 mb-6 text-left">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your name
              </label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={24}
                className="mt-1 bg-slate-900/60 border-slate-700"
              />
            </div>

            {connectMode !== "create" && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Room code
                </label>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="ABCD"
                  maxLength={4}
                  className="mt-1 bg-slate-900/60 border-slate-700 font-mono tracking-widest uppercase"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              {!connectMode && (
                <>
                  <Button
                    type="button"
                    className="w-full font-bold"
                    style={{
                      background: "linear-gradient(135deg, #00ffc8, #00b8ff)",
                      color: "#000",
                    }}
                    disabled={!playerName.trim()}
                    onClick={() => setConnectMode("create")}
                  >
                    Create room
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300"
                    disabled={!playerName.trim() || joinCode.length < 4}
                    onClick={() => setConnectMode("join")}
                  >
                    Join room
                  </Button>
                </>
              )}
              {connectMode && !roomCode && !serverDown && (
                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
                </p>
              )}
            </div>
          </div>
        )}

        {roomCode && waiting && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 px-4 py-4 mb-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-2">
              Room code — share with friend
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-3xl font-black tracking-[0.35em] text-white">
                {roomCode}
              </span>
              <Button type="button" size="icon" variant="ghost" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {playerCount}/2 players connected
            </p>
            {online.error && (
              <p className="text-xs text-rose-400 mt-2">{online.error}</p>
            )}
            {canStart && (
              <Button
                type="button"
                className="w-full mt-4 font-bold"
                style={{
                  background: "linear-gradient(135deg, #00ffc8, #00b8ff)",
                  color: "#000",
                }}
                onClick={online.startMatch}
              >
                Start match
              </Button>
            )}
            {!canStart && playerCount < 2 && (
              <p className="text-xs text-slate-500 mt-3">Waiting for opponent to join…</p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 px-4 py-3 mb-4 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-2">
            Privacy
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Each player chooses what opponents see during their turn. Tune this in-game via the
            eye icon.
          </p>
          <OnlineVisibilityPreview />
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300">
            <Link to="/setup">Play Local Instead</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-slate-500">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
