import React from "react";
import { Link } from "react-router-dom";
import { Film } from "lucide-react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
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
          Videos are saved in your browser (IndexedDB). They work offline and do not sync to other
          devices. You can also drop files in <code className="text-cyan-200">public/assets/</code>{" "}
          as a fallback.
        </p>

        <VideoUploadCard videoKey={VIDEO_KEYS.MATRIX_POWER} />
        <VideoUploadCard videoKey={VIDEO_KEYS.DIAMOND_CUT_POWER} />
        <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_POWER} />
        <VideoUploadCard videoKey={VIDEO_KEYS.STORY_MODE} />
        <VideoUploadCard videoKey={VIDEO_KEYS.STORY_BOSS_WIN} />
        <VideoUploadCard videoKey={VIDEO_KEYS.GAMEPLAY_LOOP} />
        <VideoUploadCard videoKey={VIDEO_KEYS.GAMEPLAY_BILLBOARD} />

        <div className="pt-4">
          <h2 className="text-sm font-black text-cyan-200 mb-1">Story Boss Videos</h2>
          <p className="text-[10px] text-slate-500 mb-3">
            Each boss needs their own intro upload — they do not share the Story hub or Matrix
            video. Win videos fall back to the global boss-win video if not uploaded.
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
          Power dice uploads are also in{" "}
          <Link to="/sprite-lab/matrix" className="text-cyan-400 underline">
            Matrix Sprite Lab
          </Link>
          {" "}and{" "}
          <Link to="/sprite-lab/crystal_cut" className="text-cyan-400 underline">
            Diamond Cut Sprite Lab
          </Link>
          , and{" "}
          <Link to="/sprite-lab/snow_globe" className="text-cyan-400 underline">
            Snow Globe Sprite Lab
          </Link>
          , and{" "}
          <Link to="/sprite-lab/ice" className="text-cyan-400 underline">
            Frozen Ice Sprite Lab
          </Link>
          . Blue Gel / shark power video is also on{" "}
          <Link to="/fish-showcase" className="text-cyan-400 underline">
            Fish Showcase
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
