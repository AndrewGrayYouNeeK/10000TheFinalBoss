import React from "react";
import { Link } from "react-router-dom";
import { Film } from "lucide-react";
import { toast } from "sonner";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import { BOSSES } from "@/lib/storyBosses";
import {
  getStoryBossVideoDescription,
  getStoryBossVideoLabel,
  storyBossAvatarKey,
  storyBossIntroKey,
  storyBossWinKey,
} from "@/lib/storyBossVideos";

export default function VideoAssets() {
  React.useEffect(() => {
    import("@/lib/spriteLabLockedVideos")
      .then(({ recoverAllVideoSettings }) => recoverAllVideoSettings())
      .catch(() => {});
  }, []);

  const handleSaveAll = async () => {
    try {
      const { saveAllVideoSettings } = await import("@/lib/spriteLabLockedVideos");
      const count = await saveAllVideoSettings();
      toast.success(
        count > 0
          ? `Saved ${count} video${count === 1 ? "" : "s"} to this device`
          : "No uploads to save yet"
      );
    } catch {
      toast.error("Could not save video settings");
    }
  };

  const handleRestoreAll = async () => {
    try {
      const { recoverAllVideoSettings } = await import("@/lib/spriteLabLockedVideos");
      const restored = await recoverAllVideoSettings();
      toast.success(
        restored > 0
          ? `Restored ${restored} video${restored === 1 ? "" : "s"} from backup`
          : "All uploads already present — nothing to restore"
      );
    } catch {
      toast.error("Could not restore videos");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-950 to-black text-white pb-10">
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <BackButton to="/" label="Home" />
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <h1 className="text-lg font-black truncate">Video Assets</h1>
              <p className="text-[10px] text-slate-400 truncate">
                Upload MP4s in-app — stored on this device only
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <p className="text-xs text-slate-400 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2">
          Videos auto-save to this device (IndexedDB + backup) when you upload. They work offline
          and do not sync to other devices. You can also drop files in{" "}
          <code className="text-cyan-200">public/assets/</code> as a fallback.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            onClick={handleSaveAll}
          >
            Save all video settings
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-cyan-500/40 text-cyan-200 text-xs"
            onClick={handleRestoreAll}
          >
            Restore all uploads
          </Button>
        </div>

        <VideoUploadCard videoKey={VIDEO_KEYS.DIAMOND_CUT_POWER} />
        <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_POWER} />
        <VideoUploadCard videoKey={VIDEO_KEYS.STORY_MODE} />
        <VideoUploadCard videoKey={VIDEO_KEYS.STORY_BOSS_WIN} />

        <p className="text-xs text-slate-400 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2">
          <b>Gameplay</b> (10,000 sign + Matrix power dice) uploads on{" "}
          <Link to="/sprite-lab/matrix" className="text-cyan-400 underline">
            Matrix Sprite Lab
          </Link>
          . <b>Story fight loops</b> use each boss&apos;s <b>Avatar loop</b> below (or Sprite Lab for
          linked dice skins).
        </p>

        <div className="pt-4">
          <h2 className="text-sm font-black text-cyan-200 mb-1">Story mode — before &amp; after</h2>
          <p className="text-[10px] text-slate-500 mb-3">
            <b>Before match</b> plays once when a story fight starts. <b>After victory</b> plays when
            you beat that boss. <b>Avatar loop</b> is the large video above the table during every fight
            (same size as Neo&apos;s Matrix panel). If Avatar loop is empty, Before match is used as
            the loop. Win videos fall back to the shared boss-win clip if not uploaded (except GQ win).
          </p>
          <div className="space-y-6">
            {[...BOSSES].sort((a, b) => (a.id === "gq" ? -1 : b.id === "gq" ? 1 : 0)).map((boss) => (
              <div
                key={boss.id}
                className={`rounded-2xl border p-4 space-y-3 ${
                  boss.id === "gq"
                    ? "border-cyan-400/40 bg-cyan-950/20"
                    : "border-fuchsia-500/20 bg-slate-950/50"
                }`}
              >
                <div>
                  <p className="text-sm font-black text-white">
                    {boss.name}
                    {boss.id === "gq" ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        Final boss — upload here
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">{boss.title}</p>
                </div>
                <VideoUploadCard
                  videoKey={storyBossIntroKey(boss.id)}
                  label={getStoryBossVideoLabel(boss.id, "intro")}
                  description={getStoryBossVideoDescription(boss.id, "intro")}
                />
                <VideoUploadCard
                  videoKey={storyBossWinKey(boss.id)}
                  label={getStoryBossVideoLabel(boss.id, "win")}
                  description={getStoryBossVideoDescription(boss.id, "win")}
                />
                <VideoUploadCard
                  videoKey={storyBossAvatarKey(boss.id)}
                  label={getStoryBossVideoLabel(boss.id, "avatar")}
                  description={getStoryBossVideoDescription(boss.id, "avatar")}
                />
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center pt-2">
          Gameplay (10,000 sign + Matrix power dice) and Neo story before/after videos are on{" "}
          <Link to="/sprite-lab/matrix" className="text-cyan-400 underline">
            Matrix Sprite Lab
          </Link>
          . Other power dice uploads are on each dice&apos;s Sprite Lab (Diamond Cut, etc.). Story
          before/after videos are on matching boss dice labs (Frosty, Glacia, Vitrea, Sir Scalewyrm,
          …). Blue Gel / shark power video is also on{" "}
          <Link to="/fish-showcase" className="text-cyan-400 underline">
            Fish Showcase
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
