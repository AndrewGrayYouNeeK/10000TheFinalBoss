import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, Swords } from "lucide-react";
import { motion } from "framer-motion";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { useCosmetics } from "@/hooks/useCosmetics";
import { BOSSES, isBossUnlocked, isBossDefeated, getStoryPlayerSkin, resolveStoryActiveBoss } from "@/lib/storyBosses";
import { getSkin } from "@/lib/shopCatalog";
import BossCard from "@/components/story/BossCard";
import CyberBackground from "@/components/game/CyberBackground";
import LocalLoopVideo from "@/components/video/LocalLoopVideo";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import { isLowPowerDevice } from "@/lib/platform";
import { isLabUnlocked } from "@/lib/labGate";

export default function Story() {
  const navigate = useNavigate();
  const { user, isLoading } = useCosmetics();
  const bossesDefeated = user?.bosses_defeated || [];
  const totalDefeated = BOSSES.filter((b) => bossesDefeated.includes(b.id)).length;
  const activeBossId = resolveStoryActiveBoss(user?.story_active_boss, bossesDefeated);
  const activeBoss = activeBossId ? BOSSES.find((b) => b.id === activeBossId) : null;
  const storyPlayerSkin = getStoryPlayerSkin(bossesDefeated);
  const storyPlayerSkinLabel = getSkin(storyPlayerSkin)?.name || storyPlayerSkin.replace(/_/g, " ");
  const lowPower = isLowPowerDevice();
  const labsUnlocked = isLabUnlocked();

  // Prefetch boss fight chunk while browsing the ladder (main nav destination).
  useEffect(() => {
    import("@/pages/StoryGame");
  }, []);

  return (
    <div className="min-h-screen text-white pb-10 relative">
      <CyberBackground lite={lowPower} />
      <div className="relative z-10">
        {/* Header */}
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

        <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <LocalLoopVideo
            videoKey={VIDEO_KEYS.STORY_MODE}
            heightClass="h-20 sm:h-24"
            className="shadow-lg shadow-fuchsia-500/10"
          />

          {labsUnlocked ? (
            <div className="flex justify-end">
              <Link
                to="/video-assets"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-300/80 hover:text-cyan-200"
              >
                <Film className="w-3.5 h-3.5" />
                Video settings
              </Link>
            </div>
          ) : null}

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
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-block px-3 py-1 rounded border text-xs font-bold tabular-nums"
                style={{
                  background: "rgba(0,255,200,0.07)",
                  borderColor: "rgba(0,255,200,0.4)",
                  color: "#00ffc8",
                }}
              >
                {totalDefeated} / {BOSSES.length} Defeated
              </div>
              <div className="inline-block px-3 py-1 rounded border text-xs font-bold"
                style={{
                  background: "rgba(255,0,234,0.08)",
                  borderColor: "rgba(255,0,234,0.35)",
                  color: "#f0abfc",
                }}
              >
                Story dice: {storyPlayerSkinLabel}
              </div>
            </div>
          </motion.div>

          {activeBoss && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-4 text-left"
              style={{
                borderColor: "rgba(0,255,200,0.45)",
                background: "rgba(0,255,200,0.08)",
                boxShadow: "0 0 22px rgba(0,255,200,0.15)",
              }}
            >
              <div className="text-[10px] uppercase tracking-widest font-bold text-cyan-300/90 mb-1">
                Continue your climb
              </div>
              <div className="text-sm font-black text-white mb-3">
                Fight {BOSSES.findIndex((b) => b.id === activeBoss.id) + 1} · {activeBoss.name}
              </div>
              <button
                type="button"
                onClick={() => navigate(`/story/${activeBoss.id}`)}
                className="w-full h-12 rounded-lg font-black text-sm flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #00ffc8 0%, #00b8ff 100%)",
                  color: "#000",
                  boxShadow: "0 0 18px rgba(0,255,200,0.35)",
                }}
              >
                <Swords className="w-4 h-4" />
                Continue vs {activeBoss.name}
              </button>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Exiting a fight saves your place on the ladder — the next match starts fresh.
              </p>
            </motion.div>
          )}

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
                    active={boss.id === activeBossId}
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