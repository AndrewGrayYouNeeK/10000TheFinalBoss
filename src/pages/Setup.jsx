import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CyberBackground from "@/components/game/CyberBackground";
import NeonTitle from "@/components/game/NeonTitle";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import SetupSkinPicker from "@/components/game/SetupSkinPicker";
import { useCosmetics } from "@/hooks/useCosmetics";
import {
  buildDefaultSetupDisguiseIds,
  buildDefaultSetupSkinIds,
  getSetupDisguiseOptions,
  SESSION_PLAYER_DISGUISES_KEY,
  SESSION_PLAYER_SKINS_KEY,
} from "@/lib/ghostDisguise";
import PassPlayPrivacySettings from "@/components/game/PassPlayPrivacySettings";
import { loadPassPlayPrivacy, savePassPlayPrivacy } from "@/lib/passPlayPrivacy";
import { clearOnlineMockSession } from "@/lib/onlineVisibility";
import { clearLocalGame } from "@/lib/localGameSave";

export default function Setup() {
  const [players, setPlayers] = useState(["Player 1", "Player 2"]);
  const [playerSkins, setPlayerSkins] = useState(null);
  const [playerDisguises, setPlayerDisguises] = useState(null);
  const [disguiseLocked, setDisguiseLocked] = useState([]);
  const [privacySettings, setPrivacySettings] = useState(() => loadPassPlayPrivacy());
  const navigate = useNavigate();
  const { user, equippedSkinId, ownedSkins, ghostDisguiseId, isLoading } = useCosmetics();

  useEffect(() => {
    if (isLoading) return;
    setPlayerSkins((prev) => {
      if (!prev) return buildDefaultSetupSkinIds(players.length, equippedSkinId, ownedSkins, ghostDisguiseId);
      if (prev.length === players.length) return prev;
      const next = buildDefaultSetupSkinIds(players.length, equippedSkinId, ownedSkins, ghostDisguiseId);
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i];
      return next;
    });
  }, [isLoading, players.length, equippedSkinId, ownedSkins, ghostDisguiseId]);

  useEffect(() => {
    if (isLoading || !playerSkins?.length) return;
    setPlayerDisguises((prev) => {
      if (!prev || prev.length !== players.length) {
        return Array.from({ length: players.length }, () => null);
      }
      return playerSkins.map((skinId, i) => (skinId === "ghost" ? prev[i] : null));
    });
  }, [isLoading, players.length, playerSkins, ghostDisguiseId, ownedSkins]);

  const addPlayer = () => {
    if (players.length >= 4) return;
    const nextCount = players.length + 1;
    setPlayers([...players, `Player ${nextCount}`]);
    setPlayerSkins((prev) => {
      const defaults = buildDefaultSetupSkinIds(nextCount, equippedSkinId, ownedSkins, ghostDisguiseId);
      if (!prev) return defaults;
      return [...prev, defaults[nextCount - 1]];
    });
    setPlayerDisguises((prev) => {
      if (!prev) return Array(nextCount).fill(null);
      return [...prev, null];
    });
    setDisguiseLocked((prev) => [...prev, false]);
  };

  const removePlayer = (i) => {
    if (players.length <= 2) return;
    setPlayers(players.filter((_, idx) => idx !== i));
    setPlayerSkins((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
    setPlayerDisguises((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
    setDisguiseLocked((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateName = (i, v) => {
    const copy = [...players];
    copy[i] = v;
    setPlayers(copy);
  };

  const updateSkin = (i, skinId) => {
    setPlayerSkins((prev) => {
      const copy = [...(prev || [])];
      copy[i] = skinId;
      return copy;
    });
    setPlayerDisguises((prev) => {
      const copy = [...(prev || Array(players.length).fill(null))];
      copy[i] = null;
      return copy;
    });
    setDisguiseLocked((prev) => {
      const copy = [...prev];
      while (copy.length < players.length) copy.push(false);
      copy[i] = false;
      return copy;
    });
  };

  const updateDisguise = (i, disguiseId) => {
    setPlayerDisguises((prev) => {
      const copy = [...(prev || Array(players.length).fill(null))];
      copy[i] = disguiseId;
      return copy;
    });
    setDisguiseLocked((prev) => {
      const copy = [...prev];
      while (copy.length < players.length) copy.push(false);
      copy[i] = true;
      return copy;
    });
  };

  const startGame = () => {
    const names = players.map((n, i) => n.trim() || `Player ${i + 1}`);
    const skins = playerSkins || buildDefaultSetupSkinIds(names.length, equippedSkinId, ownedSkins, ghostDisguiseId);
    const defaultDisguises = buildDefaultSetupDisguiseIds(names.length, skins, ghostDisguiseId, ownedSkins);
    const disguises = (playerDisguises || defaultDisguises).map((disguise, i) =>
      skins[i] === "ghost" ? disguise || defaultDisguises[i] : null,
    );
    sessionStorage.setItem("dice10k_players", JSON.stringify(names));
    sessionStorage.setItem(SESSION_PLAYER_SKINS_KEY, JSON.stringify(skins));
    sessionStorage.setItem(SESSION_PLAYER_DISGUISES_KEY, JSON.stringify(disguises));
    savePassPlayPrivacy(privacySettings, { persistProfile: true });
    clearOnlineMockSession();
    clearLocalGame();
    navigate("/game");
  };

  const rosterReady =
    !isLoading && playerSkins?.length === players.length && playerDisguises?.length === players.length;
  const disguiseOptions = getSetupDisguiseOptions(ownedSkins);
  const ghostReady = (playerSkins || []).every(
    (skinId, i) =>
      skinId !== "ghost" || !!disguiseLocked[i] || disguiseOptions.length === 0,
  );

  return (
    <div className="min-h-screen text-white flex flex-col pb-10 relative">
      <CyberBackground />
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-3 pb-3 border-b"
          style={{
            ...PAGE_HEADER_SAFE_STYLE,
            borderColor: "rgba(0,255,200,0.25)",
            background: "rgba(3,4,10,0.85)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 1px 0 rgba(255,0,170,0.25), 0 8px 24px rgba(0,255,200,0.08)",
          }}
        >
          <BackButton label="Back" />
          <NeonTitle dieSize={32} />
          <div className="w-[72px]" />
        </div>

        {/* Tagline */}
        <div
          className="text-center font-term tracking-[0.18em] py-1.5 text-[13px]"
          style={{
            color: "#ffff66",
            textShadow: "0 0 10px rgba(255,255,102,0.7), 0 0 18px rgba(255,0,170,0.4)",
            background: "linear-gradient(90deg, rgba(255,0,170,0.05), rgba(0,255,200,0.08), rgba(255,0,170,0.05))",
          }}
        >
          ▸ ENLIST YOUR RUNNERS • 2–4 PLAYERS
        </div>

        <div className="flex-1 max-w-md w-full mx-auto px-4 mt-6">
          <div
            className="rounded-2xl p-4"
            style={{
              border: "2px solid #ff00ea",
              boxShadow:
                "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
              background: "rgba(8,2,20,0.55)",
            }}
          >
            <p
              className="font-term text-base mb-3 tracking-widest uppercase"
              style={{ color: "#7effc4", textShadow: "0 0 8px rgba(0,255,200,0.6)" }}
            >
              ▸ Player Roster
            </p>
            <div className="space-y-3">
              <AnimatePresence>
                {players.map((name, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-1.5"
                  >
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-9 h-9 rounded-full text-white font-black flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #ff00aa, #00ffc8)",
                          boxShadow: "0 0 12px rgba(255,0,170,0.7), 0 0 18px rgba(0,255,200,0.4)",
                          textShadow: "0 0 6px rgba(0,0,0,0.6)",
                        }}
                      >
                        {i + 1}
                      </div>
                      <Input
                        value={name}
                        onChange={(e) => updateName(i, e.target.value)}
                        className="text-white border-2 font-term text-lg tracking-wider"
                        style={{
                          background: "rgba(3,4,10,0.7)",
                          borderColor: "rgba(0,255,200,0.5)",
                          boxShadow: "inset 0 0 10px rgba(0,255,200,0.2)",
                        }}
                        maxLength={20}
                      />
                      {players.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlayer(i)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {rosterReady && (
                      <div className="pl-11 min-w-0">
                        <SetupSkinPicker
                          ownedSkins={ownedSkins}
                          selectedId={playerSkins[i]}
                          onSelect={(skinId) => updateSkin(i, skinId)}
                          selectedDisguiseId={playerDisguises[i]}
                          onDisguiseSelect={(disguiseId) => updateDisguise(i, disguiseId)}
                          disguiseLocked={!!disguiseLocked[i]}
                          profile={user}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {players.length < 4 && (
              <Button
                onClick={addPlayer}
                className="w-full mt-4 h-11 text-white font-black uppercase tracking-widest border-2"
                style={{
                  background: "linear-gradient(135deg, rgba(255,0,170,0.2), rgba(120,0,180,0.3))",
                  borderColor: "#ff00aa",
                  boxShadow: "0 0 16px rgba(255,0,170,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
                  textShadow: "0 0 8px rgba(255,0,170,0.9)",
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Runner
              </Button>
            )}
          </div>
        </div>

        {players.length >= 2 && (
          <div className="px-4 max-w-md w-full mx-auto mt-4">
            <div
              className="rounded-2xl p-3 border"
              style={{
                borderColor: "rgba(0,255,200,0.35)",
                background: "rgba(8,2,20,0.45)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <PassPlayPrivacySettings
                settings={privacySettings}
                onChange={setPrivacySettings}
              />
            </div>
          </div>
        )}

        <div className="px-4 max-w-md w-full mx-auto mt-6">
          <Button
            onClick={startGame}
            disabled={!rosterReady || !ghostReady}
            size="lg"
            className="w-full h-14 text-lg text-white font-black uppercase tracking-widest border-2 disabled:opacity-40 disabled:grayscale"
            style={{
              background: "linear-gradient(135deg, rgba(255,0,170,0.25), rgba(0,255,200,0.25))",
              borderColor: "#00ffc8",
              boxShadow:
                "0 0 28px rgba(0,255,200,0.55), 0 0 28px rgba(255,0,170,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)",
              textShadow: "0 0 10px rgba(0,255,200,0.9)",
            }}
          >
            <Play className="w-5 h-5 mr-2" /> Start Game
          </Button>
          {!ghostReady && rosterReady ? (
            <p className="text-center text-xs text-amber-300/90 mt-2 font-term tracking-wide">
              Ghost runners must pick a disguise before starting.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}