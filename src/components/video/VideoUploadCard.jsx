import React, { useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";

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
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(() => getCachedLocalVideoObjectUrl(videoKey));

  const blockUpload = disabled && !lockRemovesOnly;
  const blockRemove = disabled || lockRemovesOnly;

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

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || blockUpload) return;
    setUploading(true);
    try {
      await saveLocalVideo(videoKey, file);
      const url = await getLocalVideoObjectUrl(videoKey);
      setLoaded(!!url);
      setPreviewUrl(url);
      toast.success(`${labelOverride ?? VIDEO_LABELS[videoKey] ?? "Video"} saved to this device`);
    } catch {
      toast.error("Could not save video — try a smaller MP4");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    if (blockRemove) return;
    try {
      await clearLocalVideo(videoKey);
      setLoaded(false);
      setPreviewUrl(null);
      toast.success("Video removed");
    } catch {
      toast.error("Could not remove video");
    }
  };

  const fallback = fallbackOverride ?? VIDEO_FALLBACK_PATHS[videoKey] ?? null;
  const previewSrc = previewUrl || fallback;
  const label = labelOverride ?? VIDEO_LABELS[videoKey] ?? videoKey;
  const description = descriptionOverride ?? VIDEO_DESCRIPTIONS[videoKey] ?? "";

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
          onChange={handleUpload}
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
        {loaded && (
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
      </p>

      {previewSrc && (
        <video
          key={previewSrc}
          src={previewSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-lg border border-white/10 max-h-40 object-cover"
          onError={(e) => {
            if (!previewUrl) e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
