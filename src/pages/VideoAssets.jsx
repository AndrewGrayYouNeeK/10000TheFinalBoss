import React from "react";
import { Link } from "react-router-dom";
import { Film } from "lucide-react";
import { toast } from "sonner";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import BlueGelChromaControls from "@/components/game/BlueGelChromaControls";
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
      const restored = await recoverAllVideoSettings({ force: true });
      toast.success(
        restored > 0
          ? `Restored ${restored} video${restored === 1 ? "" : "s"} from backup`
          : "No backup copies found on this device — re-upload if still missing"
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
          Videos auto-save on this device in multiple copies (live + backup + vault + file cache).
          Use the same browser URL every time (e.g. always{" "}
          <code className="text-cyan-200">http://localhost:5173</code>
          — not a different port or IP). They do not sync to other devices. Tap{" "}
          <b>Restore all uploads</b> if a slot looks empty. You can also drop files in{" "}
          <code className="text-cyan-200">public/assets/</code> as a catalog fallback.
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

        <section className="rounded-2xl border border-rose-500/35 bg-rose-950/20 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-rose-200">Blue Gel — Shark Bite workbench</h2>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                Upload or use the catalog clip, tune background removal live, then preview the full
                bite over real gameplay. Settings save on this device.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/game?previewSharkBite=1"
                className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white"
              >
                ▶ Game Bite preview
              </Link>
              <Link
                to="/fish-showcase"
                className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/45 text-cyan-200 hover:bg-cyan-950/40"
              >
                Fish Showcase
              </Link>
            </div>
          </div>
          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_POWER} />
          <BlueGelChromaControls showWorkbenchLinks={false} />
        </section>

        <section className="rounded-2xl border border-sky-500/35 bg-sky-950/20 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-sky-200">Frosty — Ice power workbench</h2>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                Live-tune shape mask, dripping frame, and frozen cube layers for Score Freeze. Saves
                on this device and applies in-game immediately.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/ice-lab"
                className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white"
              >
                Open Ice Lab
              </Link>
              <Link
                to="/sprite-lab/ice"
                className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/45 text-cyan-200 hover:bg-cyan-950/40"
              >
                Ice Sprite Lab
              </Link>
            </div>
          </div>
        </section>

        <VideoUploadCard videoKey={VIDEO_KEYS.STORY_MODE} />
        <VideoUploadCard videoKey={VIDEO_KEYS.STORY_BOSS_WIN} />

        <p className="text-xs text-slate-400 rounded-lg border border-rose-500/25 bg-rose-950/20 px-3 py-2">
          Shark Bite quick links:{" "}
          <Link to="/game?previewSharkBite=1" className="text-rose-300 underline font-bold">
            /game?previewSharkBite=1
          </Link>{" "}
          (Marlin practice — POWER DICE / SHARK VID / ▶ BITE FX) ·{" "}
          <Link to="/fish-showcase" className="text-rose-300 underline font-bold">
            /fish-showcase
          </Link>{" "}
          (feast → chomp tray preview + chroma tuner).
        </p>

        <p className="text-xs text-slate-400 rounded-lg border border-sky-500/25 bg-sky-950/20 px-3 py-2">
          Frosty / Ice power:{" "}
          <Link to="/ice-lab" className="text-sky-300 underline font-bold">
            /ice-lab
          </Link>{" "}
          (shape · frame · frozen layer tuner) ·{" "}
          <Link to="/frosty-lab" className="text-sky-300 underline font-bold">
            /frosty-lab
          </Link>{" "}
          (alias) ·{" "}
          <Link to="/sprite-lab/ice" className="text-sky-300 underline font-bold">
            /sprite-lab/ice
          </Link>
          .
        </p>

        <p className="text-xs text-slate-400 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2">
          <b>Matrix power dice</b> and <b>Neo story videos</b> upload on{" "}
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
          Matrix power dice upload is on{" "}
          <Link to="/sprite-lab/matrix" className="text-cyan-400 underline">
            Matrix Sprite Lab
          </Link>
          . Neo story videos (intro, win, avatar loop) are there too and under <b>Neo</b> above.
          Other power dice uploads are on each dice&apos;s Sprite Lab (Diamond Cut, etc.). Story
          before/after videos for Glacia, Vitrea, Sir Scalewyrm, and Neo are on matching dice labs.
          Frosty and all other bosses upload above. Blue Gel / shark power video and{" "}
          <Link to="/fish-showcase" className="text-cyan-400 underline">
            Preview shark attack
          </Link>{" "}
          are on Fish Showcase. Frosty ice power layers:{" "}
          <Link to="/ice-lab" className="text-sky-400 underline">
            Ice Lab
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
