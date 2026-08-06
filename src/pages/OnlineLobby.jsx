import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, FlaskConical, Users, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import NightCityBackground from "@/components/online/NightCityBackground";
import OnlineVisibilityPreview from "@/components/online/OnlineVisibilityPreview";
import MuteToggleButton from "@/components/game/MuteToggleButton";
import { useCosmetics } from "@/hooks/useCosmetics";
import { writeOnlineMockSession, clearOnlineMockSession } from "@/lib/onlineVisibility";
import { SESSION_PLAYER_SKINS_KEY } from "@/lib/ghostDisguise";
import {
  clearOnlineLiveSession,
  createOnlineRoom,
  defaultOnlineDisplayName,
  defaultOnlineSkinId,
  newPlayerId,
  writeOnlineLiveSession,
} from "@/lib/onlineClient";
import { toast } from "sonner";

export default function OnlineLobby() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { sfxMuted, opponentSfxMuted, setSfxMuted, setOpponentSfxMuted, equippedSkinId } =
    useCosmetics();

  const [name, setName] = useState(() => defaultOnlineDisplayName());
  const [joinCode, setJoinCode] = useState(() => (matchId ? String(matchId).toUpperCase() : ""));
  const [busy, setBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);

  const skinId = useMemo(
    () => equippedSkinId || defaultOnlineSkinId(),
    [equippedSkinId]
  );

  const enterMatch = (code, playerId, viewerPlayerIndex = 0) => {
    clearOnlineMockSession();
    sessionStorage.setItem("dice10k_players", JSON.stringify([name.trim() || "Player", "Opponent"]));
    sessionStorage.removeItem(SESSION_PLAYER_SKINS_KEY);
    writeOnlineLiveSession({ code, playerId, viewerPlayerIndex });
    navigate(`/online/${encodeURIComponent(code)}/play`);
  };

  const onCreate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const code = await createOnlineRoom();
      const playerId = newPlayerId();
      setCreatedCode(code);
      enterMatch(code, playerId, 0);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not create room — is the online server running?");
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    const code = String(joinCode || "").trim().toUpperCase();
    if (!code || code.length < 4) {
      toast.warning("Enter a room code");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      clearOnlineLiveSession();
      const playerId = newPlayerId();
      enterMatch(code, playerId, 1);
    } catch (err) {
      toast.error(err?.message || "Could not join");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      toast.success("Code copied");
    } catch {
      toast.message(createdCode);
    }
  };

  const startDevMock = () => {
    clearOnlineLiveSession();
    sessionStorage.setItem("dice10k_players", JSON.stringify(["You", "Opponent"]));
    sessionStorage.removeItem(SESSION_PLAYER_SKINS_KEY);
    writeOnlineMockSession(0);
    navigate("/game");
  };

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
            background: "rgba(0,255,200,0.1)",
            border: "2px solid rgba(0,255,200,0.4)",
          }}
        >
          <Wifi className="w-10 h-10 text-cyan-300" />
        </div>

        <h1 className="font-pixel text-2xl mb-3" style={{ color: "#00ffc8" }}>
          Online Play
        </h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Create a room, share the code, and duel on separate devices. The server rolls the dice —
          each player only sees what your privacy settings allow.
        </p>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 mb-4 text-left space-y-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            className="w-full rounded-lg bg-slate-950/80 border border-slate-600 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            placeholder="Player"
            maxLength={24}
          />
          <p className="text-[11px] text-slate-500">
            Skin in play: <span className="text-cyan-300">{skinId}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <Button
            type="button"
            disabled={busy}
            className="w-full font-bold"
            style={{ background: "linear-gradient(135deg, #00ffc8, #00b8ff)", color: "#000" }}
            onClick={onCreate}
          >
            <Users className="w-4 h-4 mr-2" />
            {busy ? "Creating…" : "Create room"}
          </Button>

          {createdCode && (
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center justify-center gap-2 text-sm text-cyan-200 border border-cyan-500/30 rounded-lg py-2 bg-cyan-950/20"
            >
              <Copy className="w-4 h-4" />
              Room code: <span className="font-mono font-bold tracking-widest">{createdCode}</span>
            </button>
          )}

          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
              }
              className="flex-1 rounded-lg bg-slate-950/80 border border-slate-600 px-3 py-2 text-sm text-white font-mono tracking-widest outline-none focus:border-cyan-400"
              placeholder="ROOM CODE"
              maxLength={8}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="border-cyan-500/40 text-cyan-200"
              onClick={onJoin}
            >
              Join
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 px-4 py-3 mb-4 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-2">
            Privacy (per turn)
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Opponents see a redacted payload while you roll — dice, turn score, and power panel stay
            hidden by default. Change this in-game under Online privacy.
          </p>
          <OnlineVisibilityPreview />
        </div>

        <div className="flex flex-col gap-3">
          {import.meta.env.DEV && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-500/40 text-amber-200 hover:bg-amber-950/30"
              onClick={startDevMock}
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Offline visibility mock (dev)
            </Button>
          )}
          <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300">
            <Link to="/setup">Play Local instead</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
