import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, SkipForward, Volume2, VolumeX } from "lucide-react";
import { assetUrl } from "@/lib/assetUrl";

/**
 * Full-screen story cutscene — intro before a fight or outro after win/lose.
 * Tap Play for sound (browser autoplay policy); or play muted.
 */
export default function StoryCutscene({ src, label, onFinished, onSkip }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const resolvedSrc = src ? assetUrl(src) : null;

  useEffect(() => {
    if (!resolvedSrc) onFinished?.();
  }, [resolvedSrc, onFinished]);

  useEffect(() => {
    setReady(false);
    setPlaying(false);
    setMuted(true);
    setFailed(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return null;
  }

  const finish = () => {
    onFinished?.();
  };

  const startPlayback = async (withSound = false) => {
    const el = videoRef.current;
    if (!el) return;
    try {
      el.muted = !withSound;
      setMuted(!withSound);
      await el.play();
      setPlaying(true);
    } catch {
      setFailed(true);
      finish();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col bg-black"
      >
        <video
          ref={videoRef}
          src={resolvedSrc}
          className="flex-1 w-full object-cover"
          muted={muted}
          playsInline
          preload="auto"
          onLoadedData={() => setReady(true)}
          onEnded={finish}
          onError={() => {
            setFailed(true);
            finish();
          }}
        />

        {!playing && ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <Button
              size="lg"
              onClick={() => startPlayback(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black px-8"
            >
              <Play className="w-5 h-5 mr-2" /> Play
            </Button>
            <button
              type="button"
              onClick={() => startPlayback(false)}
              className="text-xs text-slate-400 underline"
            >
              Play muted
            </button>
          </div>
        )}

        <div
          className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)",
          }}
        >
          {label && (
            <span className="font-pixel text-[10px] tracking-widest text-green-300 uppercase">
              {label}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {playing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  if (videoRef.current) videoRef.current.muted = next;
                }}
                className="border-green-500/40 text-green-200 hover:bg-green-500/10"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSkip?.();
                finish();
              }}
              className="border-green-500/40 text-green-200 hover:bg-green-500/10"
            >
              <SkipForward className="w-4 h-4 mr-1" /> Skip
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
