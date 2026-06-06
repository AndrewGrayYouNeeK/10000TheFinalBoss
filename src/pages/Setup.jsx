import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CyberBackground from "@/components/game/CyberBackground";
import NeonTitle from "@/components/game/NeonTitle";

export default function Setup() {
  const [players, setPlayers] = useState(["Player 1", "Player 2"]);
  const navigate = useNavigate();

  const addPlayer = () => {
    if (players.length < 4) setPlayers([...players, `Player ${players.length + 1}`]);
  };
  const removePlayer = (i) => {
    if (players.length > 2) setPlayers(players.filter((_, idx) => idx !== i));
  };
  const updateName = (i, v) => {
    const copy = [...players];
    copy[i] = v;
    setPlayers(copy);
  };

  const startGame = () => {
    const names = players.map((n, i) => n.trim() || `Player ${i + 1}`);
    sessionStorage.setItem("dice10k_players", JSON.stringify(names));
    navigate("/game");
  };

  return (
    <div className="min-h-screen text-white flex flex-col pb-10 relative">
      <CyberBackground />
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 border-b"
          style={{
            borderColor: "rgba(0,255,200,0.25)",
            background: "rgba(3,4,10,0.6)",
            backdropFilter: "blur(6px)",
            boxShadow: "0 1px 0 rgba(255,0,170,0.25), 0 8px 24px rgba(0,255,200,0.08)",
          }}
        >
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <NeonTitle dieSize={32} />
          <div className="w-9" />
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
            <div className="space-y-2">
              <AnimatePresence>
                {players.map((name, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-2 items-center"
                  >
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

        <div className="px-4 max-w-md w-full mx-auto mt-6">
          <Button
            onClick={startGame}
            size="lg"
            className="w-full h-14 text-lg text-white font-black uppercase tracking-widest border-2"
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
        </div>
      </div>
    </div>
  );
}