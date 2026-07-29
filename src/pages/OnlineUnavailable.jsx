import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WifiOff, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import NightCityBackground from "@/components/online/NightCityBackground";
import OnlineVisibilityPreview from "@/components/online/OnlineVisibilityPreview";
import MuteToggleButton from "@/components/game/MuteToggleButton";
import { useCosmetics } from "@/hooks/useCosmetics";
import { writeOnlineMockSession } from "@/lib/onlineVisibility";
import { SESSION_PLAYER_SKINS_KEY } from "@/lib/ghostDisguise";

export default function OnlineUnavailable() {
  const navigate = useNavigate();
  const { sfxMuted, opponentSfxMuted, setSfxMuted, setOpponentSfxMuted } = useCosmetics();

  const startDevMock = () => {
    sessionStorage.setItem("dice10k_players", JSON.stringify(["You", "Opponent"]));
    sessionStorage.removeItem(SESSION_PLAYER_SKINS_KEY);
    writeOnlineMockSession(0);
    navigate("/game");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative text-white" style={{ background: "#020408" }}>
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
        className="text-center max-w-md z-10"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(255,100,100,0.1)",
            border: "2px solid rgba(255,100,100,0.4)",
          }}
        >
          <WifiOff className="w-10 h-10 text-rose-400" />
        </div>

        <h1 className="font-pixel text-2xl mb-3" style={{ color: "#00ffc8" }}>
          Online Play Unavailable
        </h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Multiplayer across separate devices needs a dedicated game server. This build runs offline — use local play or story mode today.
        </p>

        <div
          className="rounded-xl border border-amber-500/30 bg-amber-950/15 px-4 py-3 mb-4 text-left"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-2">
            Privacy model (planned)
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Each player chooses what opponents see during their turn — hidden dice, turn score, and power mode. The server sends <b className="text-white">different payloads</b> to each device (not one shared broadcast).
          </p>
          <OnlineVisibilityPreview />
        </div>

        <div
          className="rounded-xl border border-slate-700/50 bg-slate-900/30 px-4 py-3 mb-4 text-left"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Roadmap
          </p>
          <ul className="text-xs text-slate-500 leading-relaxed space-y-1 list-disc list-inside">
            <li>WebSocket game server + authoritative <code className="text-slate-400">gameLogic</code></li>
            <li>Per-client state fan-out via <code className="text-slate-400">buildClientMatchPayload()</code></li>
            <li>Match invites / queue · profile sync · skin levels 1–100</li>
          </ul>
          <p className="text-[10px] text-slate-600 mt-2">
            See <code className="text-slate-500">docs/ONLINE_ARCHITECTURE.md</code>
          </p>
        </div>

        <div
          className="rounded-xl border border-slate-700/50 bg-slate-900/30 px-4 py-3 mb-4 text-left"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Planned: skin levels 1–100
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Online matches will track each dice skin at levels 1–100. Higher levels mean stronger dice in PvP — synced via server profile (<code className="text-slate-400">skin_levels</code>).
          </p>
        </div>

        <div
          className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 px-4 py-3 mb-6 text-left"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-2">
            Online audio settings
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Use the speaker icons above to mute <b className="text-white">your</b> sounds or <b className="text-white">opponent</b> sounds. Saved to your profile for when online play launches.
          </p>
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
              Preview in game (dev)
            </Button>
          )}
          <Button asChild className="w-full font-bold" style={{ background: "linear-gradient(135deg, #00ffc8, #00b8ff)", color: "#000" }}>
            <Link to="/setup">Play Local</Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
