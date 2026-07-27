import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { applyVideoStartOffset } from "@/lib/videoAudio";

/**
 * Full-size video preview — uploaded blob URLs and catalog fallbacks.
 * Optional footer actions (e.g. confirm/cancel before saving an upload).
 */
export default function VideoPreviewDialog({
  open,
  onOpenChange,
  src,
  title = "Video preview",
  sourceLabel,
  children,
  contentClassName,
  startAtSeconds = 0,
  videoStyle,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!open || !src) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    const startPlayback = () => {
      applyVideoStartOffset(video, startAtSeconds);
      video.play().catch(() => {});
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      startPlayback();
      return undefined;
    }

    video.addEventListener("loadedmetadata", startPlayback, { once: true });
    return () => video.removeEventListener("loadedmetadata", startPlayback);
  }, [open, src, startAtSeconds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl border-white/10 bg-slate-950 text-white sm:rounded-xl",
          contentClassName
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-black text-white pr-8">{title}</DialogTitle>
          {sourceLabel ? (
            <DialogDescription className="text-slate-400 text-xs">{sourceLabel}</DialogDescription>
          ) : null}
        </DialogHeader>

        {src ? (
          <div className="rounded-lg overflow-hidden border border-white/10 bg-black max-h-[min(70vh,520px)]">
            <video
              ref={videoRef}
              key={src}
              src={src}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full max-h-[min(70vh,520px)] bg-black"
              style={videoStyle}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-400">No video to preview.</p>
        )}

        {children ? <DialogFooter className="gap-2 sm:gap-2">{children}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
