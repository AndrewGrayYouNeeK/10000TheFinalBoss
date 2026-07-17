import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Swords, Play, X } from "lucide-react";
import BossAvatar from "./BossAvatar";
import { useStoryBossVideo } from "@/hooks/useStoryBossVideo";

function FullscreenCutsceneVideo({ src, onDone, label = "Skip" }) {
  const videoRef = React.useRef(null);
  const onDoneRef = React.useRef(onDone);
  const [needsTapToPlay, setNeedsTapToPlay] = React.useState(false);

  onDoneRef.current = onDone;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    let cancelled = false;
    setNeedsTapToPlay(false);

    const waitUntilCanPlay = () =>
      new Promise((resolve, reject) => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          resolve();
          return;
        }
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(video.error ?? new Error("Video failed to load"));
        };
        const cleanup = () => {
          video.removeEventListener("loadeddata", onReady);
          video.removeEventListener("canplay", onReady);
          video.removeEventListener("error", onError);
        };
        video.addEventListener("loadeddata", onReady);
        video.addEventListener("canplay", onReady);
        video.addEventListener("error", onError);
        // Kick loading in case the browser deferred it.
        try {
          video.load();
        } catch {
          /* ignore */
        }
      });

    const startPlayback = async () => {
      try {
        await waitUntilCanPlay();
      } catch {
        if (!cancelled) onDoneRef.current?.();
        return;
      }
      if (cancelled) return;

      // Cutscenes are silent — muted autoplay is reliable and skips the sound prompt.
      video.muted = true;
      video.volume = 0;
      try {
        await video.play();
      } catch {
        // Never skip the cutscene just because autoplay was blocked —
        // keep the frame up and ask the player to tap.
        if (!cancelled) setNeedsTapToPlay(true);
      }
    };

    startPlayback();
    return () => {
      cancelled = true;
    };
  }, [src]);

  const startFromTap = async (event) => {
    event?.stopPropagation?.();
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 0;
    try {
      await video.play();
      setNeedsTapToPlay(false);
    } catch {
      setNeedsTapToPlay(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black"
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ maxWidth: "none", maxHeight: "none" }}
        onEnded={() => onDoneRef.current?.()}
        onError={() => onDoneRef.current?.()}
      />

      {needsTapToPlay && (
        <button
          type="button"
          aria-label="Tap to play"
          onClick={startFromTap}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50 text-white cursor-pointer"
        >
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm">
            <Play className="w-8 h-8 fill-white" />
          </span>
          <span className="text-sm font-bold tracking-wide drop-shadow-lg">
            Tap to play
          </span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
        <Button
          type="button"
          onClick={() => onDoneRef.current?.()}
          className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm font-bold"
        >
          {label}
        </Button>
      </div>
    </motion.div>
  );
}

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
  }, [storyVideoSrc, winVideoSrc, mode, boss?.id]);

  if (!boss) return null;

  const introPending = mode === "intro" && !introReady;
  const winPending = mode === "win" && !winReady;
  const showIntroVideo =
    mode === "intro" && introReady && !!storyVideoSrc && !introVideoDone;
  const showWinVideo = mode === "win" && winReady && !!winVideoSrc && !winVideoDone;
  const showDialogue = !introPending && !winPending && !showIntroVideo && !showWinVideo;

  const line =
    mode === "intro" ? boss.intro :
    mode === "win"   ? boss.winLine :
                       boss.loseLine;

  const continueLabel =
    mode === "intro" ? "Roll the Dice" :
    mode === "win"   ? "Claim Rewards" :
                       "Try Again";

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
          onDone={() => setIntroVideoDone(true)}
          label="Skip intro"
        />
      )}
      {showWinVideo && (
        <FullscreenCutsceneVideo
          src={winVideoSrc}
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

            {/* Gimmick warning on intro */}
            {mode === "intro" && boss.gimmick && (
              <div className="mb-5 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 p-3 text-sm">
                <div className="text-fuchsia-300 font-black uppercase tracking-wider text-xs mb-1">
                  ⚡ {boss.gimmick.name}
                </div>
                <div className="text-slate-200">{boss.gimmick.description}</div>
              </div>
            )}

            <div className="flex gap-2">
              {mode !== "intro" && (
                <Button
                  variant="outline"
                  onClick={onExit}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/30"
                >
                  <X className="w-4 h-4 mr-1" /> Exit
                </Button>
              )}
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
