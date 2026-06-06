import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { useCosmetics } from "@/hooks/useCosmetics";
import { BOSSES, isBossUnlocked, isBossDefeated } from "@/lib/storyBosses";
import BossCard from "@/components/story/BossCard";
import CyberBackground from "@/components/game/CyberBackground";

export default function Story() {
  const navigate = useNavigate();
  const { user, isLoading } = useCosmetics();
  const bossesDefeated = user?.bosses_defeated || [];
  const totalDefeated = BOSSES.filter((b) => bossesDefeated.includes(b.id)).length;

  return (
    <div className="min-h-screen text-white pb-10 relative">
      <CyberBackground />
      <div className="relative z-10">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 border-b sticky top-0 z-20"
          style={{
            borderColor: "rgba(0,255,200,0.25)",
            background: "rgba(3,4,10,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div
            className="font-pixel text-xs flex items-center gap-2 neon-glitch"
            style={{
              color: "#fff",
              textShadow: "0 0 6px #ff00ea, 0 0 14px #ff00ea, 0 0 28px #00ffff",
              letterSpacing: "0.15em",
            }}
          >
            <Swords className="w-4 h-4" style={{ filter: "drop-shadow(0 0 6px #ff00ea)" }} />
            STORY MODE
          </div>
          <div className="w-9" />
        </div>

        <div className="max-w-md mx-auto px-4 pt-6">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <h1
              className="font-pixel text-2xl mb-2"
              style={{
                color: "#fff",
                textShadow: "0 0 8px #00ffea, 0 0 18px #ff00ea",
                letterSpacing: "0.1em",
              }}
            >
              BOSS LADDER
            </h1>
            <div className="mt-3 inline-block px-3 py-1 rounded border text-xs font-bold tabular-nums"
              style={{
                background: "rgba(0,255,200,0.07)",
                borderColor: "rgba(0,255,200,0.4)",
                color: "#00ffc8",
              }}
            >
              {totalDefeated} / {BOSSES.length} Defeated
            </div>
          </motion.div>

          {/* Boss cards */}
          {!isLoading && (
            <div className="space-y-3">
              {BOSSES.map((boss, i) => {
                const unlocked = isBossUnlocked(boss.id, bossesDefeated);
                const defeated = isBossDefeated(boss.id, bossesDefeated);
                return (
                  <BossCard
                    key={boss.id}
                    boss={boss}
                    unlocked={unlocked}
                    defeated={defeated}
                    onClick={() => navigate(`/story/${boss.id}`)}
                    index={i}
                  />
                );
              })}
            </div>
          )}

          {/* Champion banner */}
          {totalDefeated === BOSSES.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl p-5 text-center border-2"
              style={{
                background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,0,170,0.15))",
                borderColor: "rgba(255,215,0,0.6)",
                boxShadow: "0 0 28px rgba(255,215,0,0.35)",
              }}
            >
              <div className="text-4xl mb-2">👑</div>
              <div className="font-black text-lg text-amber-300 mb-1">DICE OVERLORD</div>
              <div className="text-xs text-amber-100">You've conquered the entire ladder.</div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}