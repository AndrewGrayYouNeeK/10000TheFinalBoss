import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import { motion } from "framer-motion";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { useCosmetics } from "@/hooks/useCosmetics";
import { BOSSES, getChapters, isBossUnlocked, isBossDefeated } from "@/lib/storyBosses";
import { getSkin } from "@/lib/shopCatalog";
import BossCard from "@/components/story/BossCard";
import CyberBackground from "@/components/game/CyberBackground";

export default function Story() {
  const navigate = useNavigate();
  const { user, isLoading } = useCosmetics();
  const bossesDefeated = user?.bosses_defeated || [];
  const totalDefeated = BOSSES.filter((b) => bossesDefeated.includes(b.id)).length;
  const chapters = useMemo(() => getChapters(), []);
  const playerSkinName = getSkin(
    bossesDefeated.length
      ? BOSSES.slice()
          .reverse()
          .find((b) => bossesDefeated.includes(b.id) && b.rewards?.skin)?.rewards?.skin || "paper"
      : "paper"
  )?.name;

  return (
    <div className="min-h-screen text-white pb-10 relative">
      <CyberBackground />
      <div className="relative z-10">
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-3 pb-3 border-b"
          style={{
            ...PAGE_HEADER_SAFE_STYLE,
            borderColor: "rgba(0,255,200,0.25)",
            background: "rgba(3,4,10,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <BackButton to="/" label="Back" />
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
          <div className="w-[72px]" />
        </div>

        <div className="max-w-md mx-auto px-4 pt-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <h1
              className="font-pixel text-2xl mb-2"
              style={{
                color: "#fff",
                textShadow: "0 0 8px #00ff80, 0 0 18px #22c55e",
                letterSpacing: "0.1em",
              }}
            >
              THE GRID
            </h1>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              A fresh story ladder — beat bosses to unlock their dice. More chapters coming as you go.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <div
                className="inline-block px-3 py-1 rounded border text-xs font-bold tabular-nums"
                style={{
                  background: "rgba(0,255,200,0.07)",
                  borderColor: "rgba(0,255,200,0.4)",
                  color: "#00ffc8",
                }}
              >
                {totalDefeated} / {BOSSES.length} Defeated
              </div>
              <div
                className="inline-block px-3 py-1 rounded border text-xs font-bold"
                style={{
                  background: "rgba(34,197,94,0.08)",
                  borderColor: "rgba(34,197,94,0.35)",
                  color: "#86efac",
                }}
              >
                Rolling: {playerSkinName}
              </div>
            </div>
          </motion.div>

          {!isLoading &&
            chapters.map((chapter, chapterIdx) => (
              <div key={chapter.id} className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="font-pixel text-[10px] uppercase tracking-[0.2em] text-green-300"
                    style={{ textShadow: "0 0 8px rgba(34,197,94,0.6)" }}
                  >
                    Chapter {chapter.order ?? chapterIdx + 1}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-green-500/40 to-transparent" />
                </div>
                <h2 className="text-lg font-black text-white mb-3">{chapter.title}</h2>
                <div className="space-y-3">
                  {chapter.bosses.map((boss) => {
                    const globalIndex = BOSSES.findIndex((b) => b.id === boss.id);
                    const unlocked = isBossUnlocked(boss.id, bossesDefeated);
                    const defeated = isBossDefeated(boss.id, bossesDefeated);
                    return (
                      <BossCard
                        key={boss.id}
                        boss={boss}
                        unlocked={unlocked}
                        defeated={defeated}
                        onClick={() => navigate(`/story/${boss.id}`)}
                        index={globalIndex}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

          {totalDefeated === BOSSES.length && BOSSES.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl p-5 text-center border-2"
              style={{
                background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(0,255,170,0.08))",
                borderColor: "rgba(34,197,94,0.5)",
                boxShadow: "0 0 28px rgba(34,197,94,0.25)",
              }}
            >
              <div className="text-4xl mb-2">🕶️</div>
              <div className="font-black text-lg text-green-300 mb-1">CHAPTER CLEAR</div>
              <div className="text-xs text-green-100">
                You escaped the Grid. New chapters will unlock here soon.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
