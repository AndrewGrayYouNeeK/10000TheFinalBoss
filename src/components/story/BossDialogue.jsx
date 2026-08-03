import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Swords, X } from "lucide-react";
import BossAvatar from "./BossAvatar";
import { useStoryBossVideo } from "@/hooks/useStoryBossVideo";
import FullscreenCutsceneVideo from "@/components/video/FullscreenCutsceneVideo";
import {
  getStoryBossVideoMuteAtSeconds,
  getStoryBossVideoStartOffset,
  isStoryBossVideoSilent,
} from "@/lib/storyBossVideos";

// A pre-fight or post-fight dialogue overlay.
// mode: "intro" | "win" | "lose"
export default function BossDialogue({ boss, mode, onContinue, onExit, summary }) {
  const { src: storyVideoSrc, ready: introReady } = useStoryBossVideo(boss?.id, "intro", {
    enabled: mode === "intro",
  });
  const { src: winVideoSrc, ready: winReady } = useStoryBossVideo(boss?.id, "win", {
    enabled: mode === "win",
  });
  const [introVideoDone, setIntroVideoDone] = React.useState(false);
  const [winVideoDone, setWinVideoDone] = React.useState(false);

  React.useEffect(() => {
    setIntroVideoDone(false);
    setWinVideoDone(false);
  }, [mode, boss?.id]);

  const introDoneRef = React.useRef(false);
  React.useEffect(() => {
    introDoneRef.current = false;
  }, [mode, boss?.id]);

  const finishIntro = React.useCallback(() => {
    if (introDoneRef.current) return;
    introDoneRef.current = true;
    onContinue();
  }, [onContinue]);

  const introPending = mode === "intro" && !introReady;
  const winPending = mode === "win" && !winReady;
  const showIntroVideo =
    mode === "intro" && introReady && !!storyVideoSrc && !introVideoDone;
  const showWinVideo = mode === "win" && winReady && !!winVideoSrc && !winVideoDone;
  const showDialogue =
    mode !== "intro" && !introPending && !winPending && !showIntroVideo && !showWinVideo;

  // No per-boss intro upload — start the fight once resolution finishes.
  React.useEffect(() => {
    if (mode !== "intro" || !introReady || storyVideoSrc) return;
    finishIntro();
  }, [mode, introReady, storyVideoSrc, finishIntro]);

  // Losses restart directly in StoryGame; never render the old boss taunt card.
  if (!boss || mode === "lose") return null;

  const handleIntroVideoDone = () => {
    setIntroVideoDone(true);
    finishIntro();
  };

  const line = mode === "win" ? boss.winLine : boss.loseLine;

  const continueLabel =
    mode === "win" ? "Claim Rewards" : "Try Again";

  return (
    <AnimatePresence>
      {(introPending || winPending) && (
        <motion.div
          key="cutscene-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black"
          aria-label="Loading cutscene"
        />
      )}
      {showIntroVideo && (
        <FullscreenCutsceneVideo
          src={storyVideoSrc}
          startAtSeconds={getStoryBossVideoStartOffset(boss.id, "intro")}
          muteAtSeconds={getStoryBossVideoMuteAtSeconds(boss.id, "intro")}
          onDone={handleIntroVideoDone}
          label="Skip intro"
        />
      )}
      {showWinVideo && (
        <FullscreenCutsceneVideo
          src={winVideoSrc}
          sfxMuted={isStoryBossVideoSilent(boss.id, "win")}
          onDone={() => setWinVideoDone(true)}
          label="Continue"
        />
      )}

      {showDialogue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="rounded-2xl border-2 p-6 max-w-sm w-full"
            style={{
              background: "rgba(8,2,20,0.95)",
              borderColor: "rgba(0,255,200,0.45)",
              boxShadow: "0 0 36px rgba(0,255,200,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
              <BossAvatar
                boss={boss}
                sizeClass="w-16 h-16"
                emojiClass="text-4xl"
                useBossAvatarVideo
              />
              <div className="flex-1 min-w-0">
                <div className="text-lg font-black text-white truncate">{boss.name}</div>
                <div className="text-xs text-slate-400 italic">{boss.title}</div>
              </div>
            </div>

            {/* Quote */}
            <div className="mb-5 rounded-lg p-4 border border-slate-700/60 bg-black/40">
              <p className="text-white text-sm italic leading-relaxed">"{line}"</p>
            </div>

            {/* Win rewards */}
            {mode === "win" && summary && (
              <div className="mb-5 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm space-y-1">
                <div className="text-amber-300 font-black uppercase tracking-wider text-xs mb-1">
                  ⚡ Rewards
                </div>
                <div className="text-amber-100">+{summary.coins} coins</div>
                <div className="text-cyan-200">+{summary.xp} XP</div>
                {summary.skinUnlocked && (
                  <div className="text-fuchsia-300 font-bold">✨ You unlocked {summary.skinUnlocked} dice!</div>
                )}
                {summary.storySkinEquipped && (
                  <div className="text-emerald-300 text-xs">
                    Equipped for story mode — you&apos;ll roll with {summary.storySkinEquipped} in your next fight.
                  </div>
                )}
                {summary.alreadyClaimed && (
                  <div className="text-slate-400 text-xs italic">(Already cleared — half rewards.)</div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onExit}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/30"
              >
                <X className="w-4 h-4 mr-1" /> Exit
              </Button>
              <Button
                onClick={onContinue}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-black"
              >
                <Swords className="w-4 h-4 mr-1" /> {continueLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
