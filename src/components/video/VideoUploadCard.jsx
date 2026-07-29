import React, { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearLocalVideo,
  getCachedLocalVideoObjectUrl,
  getLocalVideoObjectUrl,
  hasLocalVideo,
  saveLocalVideo,
  subscribeLocalVideo,
  VIDEO_DESCRIPTIONS,
  VIDEO_FALLBACK_PATHS,
  VIDEO_LABELS,
} from "@/lib/localVideoStore";
import VideoPreviewDialog from "@/components/video/VideoPreviewDialog";
import { toast } from "sonner";
import {
  getFishermanAvatarLoopVideoStyle,
  useFishermanAvatarLoopSettings,
} from "@/lib/fishermanAvatarLoopSettings";
import MarlinLoopPositionTool from "@/components/story/MarlinLoopPositionTool";
import {
  getStoryBossAvatarLoopVideoStyle,
  getStoryBossIdForAvatarKey,
  getStoryBossVideoStartOffsetForKey,
} from "@/lib/storyBossVideos";
import {
  loadSharkBiteSettings,
  getSharkBiteUploadPreviewLayout,
} from "@/lib/sharkBiteSettings";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import { applyVideoStartOffset } from "@/lib/videoAudio";

export default function VideoUploadCard({
  videoKey,
  label: labelOverride,
  description: descriptionOverride,
  fallbackPath: fallbackOverride,
  disabled = false,
  /** When true, uploads stay enabled but Remove is blocked (locked dice). */
  lockRemovesOnly = false,
}) {
  const inputRef = useRef(null);
  const inlinePreviewRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(() => getCachedLocalVideoObjectUrl(videoKey));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [previewVideoSize, setPreviewVideoSize] = useState({ width: 0, height: 0 });

  const blockUpload = disabled && !lockRemovesOnly;
  const blockRemove = disabled || lockRemovesOnly;

  const clearPendingSelection = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      await import("@/lib/spriteLabLockedVideos")
        .then(({ recoverVideoKeyFromSnapshots }) => recoverVideoKeyFromSnapshots(videoKey))
        .catch(() => false);
      const hasUpload = await hasLocalVideo(videoKey);
      const url = hasUpload ? await getLocalVideoObjectUrl(videoKey) : null;
      if (cancelled) return;
      setLoaded(hasUpload);
      setPreviewUrl(url);
    };
    refresh();
    const unsub = subscribeLocalVideo(videoKey, (url) => {
      if (cancelled) return;
      setLoaded(!!url);
      setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [videoKey]);

  const fallback = fallbackOverride ?? VIDEO_FALLBACK_PATHS[videoKey] ?? null;
  const previewSrc = previewUrl || fallback;
  const dialogSrc = pendingPreviewUrl || previewSrc;
  const isSharkBiteIntro = videoKey === VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO;
  const isSharkBiteChomp = videoKey === VIDEO_KEYS.BLUE_GEL_POWER;
  const isSharkBiteSlot = isSharkBiteIntro || isSharkBiteChomp;
  const startAtSeconds = isSharkBiteIntro
    ? loadSharkBiteSettings().introStartAtSeconds
    : isSharkBiteChomp
      ? loadSharkBiteSettings().startAtSeconds
      : getStoryBossVideoStartOffsetForKey(videoKey);
  const label = labelOverride ?? VIDEO_LABELS[videoKey] ?? videoKey;
  const description = descriptionOverride ?? VIDEO_DESCRIPTIONS[videoKey] ?? "";
  const sharkPreviewLayout = isSharkBiteSlot
    ? getSharkBiteUploadPreviewLayout(
        loadSharkBiteSettings(),
        isSharkBiteChomp ? "chomp" : "intro",
        previewVideoSize.width,
        previewVideoSize.height
      )
    : undefined;
  const fishermanTuning = useFishermanAvatarLoopSettings();
  const avatarBossId = getStoryBossIdForAvatarKey(videoKey);
  const isFishermanAvatar = avatarBossId === "fisherman";
  const storyAvatarPreviewStyle = avatarBossId
    ? isFishermanAvatar
      ? getFishermanAvatarLoopVideoStyle(fishermanTuning)
      : getStoryBossAvatarLoopVideoStyle(avatarBossId)
    : undefined;
  const inlinePreviewStyle =
    sharkPreviewLayout?.videoStyle ?? storyAvatarPreviewStyle ?? { objectFit: "cover" };
  const inlinePreviewVideoClassName =
    sharkPreviewLayout?.videoClassName ??
    (avatarBossId ? "w-full h-full bg-black" : "w-full h-40 bg-black");
  const inlinePreviewContainerClassName =
    sharkPreviewLayout?.containerClassName ??
    (avatarBossId ? "mx-auto w-full max-w-[14rem] h-48 sm:h-56" : "max-h-40");
  const dialogVideoContainerClassName = isSharkBiteSlot
    ? inlinePreviewContainerClassName
    : "max-h-[min(70vh,520px)]";
  const dialogVideoClassName = isSharkBiteSlot
    ? inlinePreviewVideoClassName
    : "w-full h-full max-h-[min(70vh,520px)] bg-black";

  const syncPreviewVideoSize = (video) => {
    if (!video?.videoWidth || !video?.videoHeight) return;
    setPreviewVideoSize((prev) =>
      prev.width === video.videoWidth && prev.height === video.videoHeight
        ? prev
        : { width: video.videoWidth, height: video.videoHeight }
    );
  };

  useEffect(() => {
    setPreviewVideoSize({ width: 0, height: 0 });
  }, [previewSrc, pendingPreviewUrl]);

  useEffect(() => {
    const video = inlinePreviewRef.current;
    if (!video || !previewSrc || pendingPreviewUrl || startAtSeconds <= 0) return undefined;

    const applyOffset = () => applyVideoStartOffset(video, startAtSeconds);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applyOffset();
      return undefined;
    }
    video.addEventListener("loadedmetadata", applyOffset, { once: true });
    return () => video.removeEventListener("loadedmetadata", applyOffset);
  }, [previewSrc, pendingPreviewUrl, startAtSeconds]);

  const previewSourceLabel = pendingPreviewUrl
    ? "Selected file — review before saving to this slot"
    : loaded
      ? "Your upload on this device"
      : fallback
        ? `Catalog fallback · public${fallback}`
        : null;

  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || blockUpload) return;

    clearPendingSelection();
    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleConfirmPendingUpload = async () => {
    if (!pendingFile || blockUpload) return;
    setUploading(true);
    try {
      await saveLocalVideo(videoKey, pendingFile);
      const url = await getLocalVideoObjectUrl(videoKey);
      setLoaded(!!url);
      setPreviewUrl(url);
      clearPendingSelection();
      setPreviewOpen(false);
      toast.success(`${label} saved to this device`);
    } catch {
      toast.error("Could not save video — try a smaller MP4");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPendingUpload = () => {
    clearPendingSelection();
    setPreviewOpen(false);
  };

  const handlePreviewOpenChange = (open) => {
    setPreviewOpen(open);
    if (!open && pendingPreviewUrl) clearPendingSelection();
  };

  const handleClear = async () => {
    if (blockRemove) return;
    try {
      await clearLocalVideo(videoKey);
      setLoaded(false);
      setPreviewUrl(null);
      toast.success("Removed from this slot — Restore all uploads can bring a backup back");
    } catch {
      toast.error("Could not remove video");
    }
  };

  const handleDownload = async () => {
    try {
      const { getLocalVideoBlob } = await import("@/lib/localVideoStore");
      const blob = await getLocalVideoBlob(videoKey);
      if (!blob) {
        toast.error("No uploaded file to download");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${videoKey}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Download started — keep a copy outside the browser");
    } catch {
      toast.error("Could not download video");
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        {description && <p className="text-[10px] text-slate-400 mt-1">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          className="hidden"
          onChange={handleFileSelected}
        />
        <Button
          type="button"
          size="sm"
          disabled={uploading || blockUpload}
          className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Saving…" : blockUpload ? "Locked" : loaded ? "Replace video" : "Upload video"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!dialogSrc}
          className="border-violet-500/40 text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setPreviewOpen(true)}
        >
          <Play className="w-3.5 h-3.5 mr-1 fill-current" />
          Preview
        </Button>
        {loaded && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-emerald-500/40 text-emerald-200"
              onClick={handleDownload}
            >
              Download copy
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={blockRemove}
              className="border-rose-500/40 text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleClear}
            >
              Remove
            </Button>
          </>
        )}
      </div>

      <p className="text-[10px] text-slate-500">
        {loaded ? (
          <span className="text-emerald-300">Uploaded to this device ✓</span>
        ) : (
          "No upload yet — pick an MP4 from your device"
        )}
        {fallback ? (
          <>
            {" · "}Fallback: <code className="text-cyan-200">public{fallback}</code>
          </>
        ) : (
          " · Upload required for this slot (or uses a boss-specific global fallback at playback)"
        )}
        {dialogSrc ? (
          <>
            {" · "}
            <span className="text-violet-300">Tap Preview to verify before or after upload</span>
          </>
        ) : null}
        {startAtSeconds > 0 ? (
          <>
            {" · "}
            <span className="text-amber-300">
              Playback skips first {startAtSeconds}s (upload unchanged)
            </span>
          </>
        ) : null}
      </p>

      {isFishermanAvatar && previewSrc && !pendingPreviewUrl ? (
        <MarlinLoopPositionTool compact />
      ) : null}

      {previewSrc && !pendingPreviewUrl && (
        <div
          className={`rounded-lg border border-white/10 bg-black ${inlinePreviewContainerClassName}`}
        >
          <video
            ref={inlinePreviewRef}
            key={previewSrc}
            src={previewSrc}
            autoPlay
            loop
            muted
            playsInline
            className={`${inlinePreviewVideoClassName} bg-black`}
            style={inlinePreviewStyle}
            onLoadedMetadata={(e) => syncPreviewVideoSize(e.currentTarget)}
            onError={(e) => {
              if (!previewUrl) e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <VideoPreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
        src={dialogSrc}
        title={label}
        sourceLabel={previewSourceLabel}
        startAtSeconds={pendingPreviewUrl ? 0 : startAtSeconds}
        videoStyle={inlinePreviewStyle}
        videoClassName={dialogVideoClassName}
        videoContainerClassName={dialogVideoContainerClassName}
        onVideoMetadata={isSharkBiteSlot ? syncPreviewVideoSize : undefined}
        contentClassName={avatarBossId ? "max-w-md" : undefined}
      >
        {pendingPreviewUrl ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="border-slate-500/50 text-slate-200"
              disabled={uploading}
              onClick={handleCancelPendingUpload}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
              disabled={uploading || blockUpload}
              onClick={handleConfirmPendingUpload}
            >
              {uploading ? "Saving…" : "Save to this slot"}
            </Button>
          </>
        ) : null}
      </VideoPreviewDialog>
    </div>
  );
}
