import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SkipForward } from "lucide-react";

/**
 * Full-screen story cutscene — intro before a fight or outro after win/lose.
 */
export default function StoryCutscene({ src, label, onFinished, onSkip }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);

  React.useEffect(() => {
    if (!src) onFinished?.();
  }, [src, onFinished]);

  if (!src || failed) {
    return null;
  }

  const finish = () => {
    onFinished?.();
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
          src={src}
          className="flex-1 w-full object-cover"
          autoPlay
          playsInline
          onEnded={finish}
          onError={() => {
            setFailed(true);
            finish();
          }}
        />

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSkip?.();
              finish();
            }}
            className="ml-auto border-green-500/40 text-green-200 hover:bg-green-500/10"
          >
            <SkipForward className="w-4 h-4 mr-1" /> Skip
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
