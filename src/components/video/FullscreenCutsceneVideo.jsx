import React from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playVideoWithAudio, syncVideoAudio } from "@/lib/videoAudio";

export default function FullscreenCutsceneVideo({
  src,
  onDone,
  label = "Skip",
  sfxMuted = false,
}) {
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

      const withSound = await playVideoWithAudio(video, { sfxMuted, preferSound: true });
      if (!withSound && video.paused) {
        setNeedsTapToPlay(true);
      }
    };

    startPlayback();
    return () => {
      cancelled = true;
      try {
        video.pause();
      } catch {
        /* ignore */
      }
    };
  }, [src]);

  React.useEffect(() => {
    syncVideoAudio(videoRef.current, { sfxMuted });
  }, [sfxMuted, src]);

  const startFromTap = async (event) => {
    event?.stopPropagation?.();
    const video = videoRef.current;
    if (!video) return;

    const withSound = await playVideoWithAudio(video, { sfxMuted, preferSound: true });
    if (withSound || !video.paused) {
      setNeedsTapToPlay(false);
    } else {
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
        loop={false}
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ maxWidth: "none", maxHeight: "none" }}
        onEnded={(e) => {
          e.currentTarget.pause();
          onDoneRef.current?.();
        }}
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
            Tap to play{sfxMuted ? "" : " with sound"}
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
