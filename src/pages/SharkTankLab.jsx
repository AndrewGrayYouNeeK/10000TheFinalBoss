import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import DiceTray from "@/components/game/DiceTray";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
import {
  getStoryBossVideoDescription,
  getStoryBossVideoLabel,
  storyBossAvatarKey,
  storyBossIntroKey,
  storyBossWinKey,
} from "@/lib/storyBossVideos";

const SHARK_TANK_BOSS_ID = "shark_tank";

const TRAY_DICE = [
  { id: "st-1", value: 1, held: false, used: false },
  { id: "st-2", value: 2, held: false, used: false },
  { id: "st-3", value: 3, held: false, used: false },
  { id: "st-4", value: 4, held: false, used: false },
  { id: "st-5", value: 5, held: false, used: false },
  { id: "st-6", value: 6, held: false, used: false },
];

/**
 * Dedicated Shark Tank (shark_gel) workspace — in-die aquarium preview,
 * power-mode sharks, and shortcuts to bite / sprite tools.
 */
export default function SharkTankLab() {
  const [powerMode, setPowerMode] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [faceFocus, setFaceFocus] = useState(5);
  const [seedBump, setSeedBump] = useState(0);

  useEffect(() => {
    import("@/lib/spriteLabLockedVideos")
      .then(({ recoverAllVideoSettings }) => recoverAllVideoSettings())
      .catch(() => {});
  }, []);

  const trayDice = useMemo(
    () =>
      TRAY_DICE.map((d) => ({
        ...d,
        // Remount swim paths when reseeding
        id: `${d.id}-s${seedBump}`,
      })),
    [seedBump]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cyan-950/40 to-black text-white pb-12">
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.94)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <BackButton to="/labs" label="Labs" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black truncate">Shark Tank Lab</h1>
            <p className="text-[10px] text-slate-400 truncate">
              In-die great whites + orcas · power mode · Captain Chomps story skin
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/sprite-lab/shark_gel"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white"
          >
            Sprite / shell lab
          </Link>
          <Link
            to="/shark-bite-lab"
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white"
          >
            Shark Bite Lab
          </Link>
          <Link
            to="/fish-showcase"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-cyan-500/45 text-cyan-200 hover:bg-cyan-950/40"
          >
            Fish Showcase
          </Link>
          <Link
            to="/video-assets"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-white/20 text-slate-300 hover:bg-white/5"
          >
            Video Assets
          </Link>
          <Link
            to="/sprite-lab/shark_gel"
            className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-sky-500/40 text-sky-200 hover:bg-sky-950/40"
          >
            Sprite Lab
          </Link>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2.5 text-xs text-rose-100/90">
          <b>Shark Tank</b> (<code className="text-rose-200">shark_gel</code>) — regular faces are the
          angelfish aquarium; toggle <b>Power mode</b> below for sharks. Upload story + bite clips
          in the sections below. Story unlock: beat <b>Captain Chomps</b>.
        </div>

        <section className="rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-3">
          <div>
            <h2 className="text-sm font-black text-cyan-200">Story videos — Captain Chomps</h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload MP4s here (same slots as Sprite Lab / Video Assets). <b>Before match</b> plays
              fullscreen at fight start · <b>After victory</b> on win · <b>Avatar loop</b> sits above
              the table (crop / trim on that card). Old Marlin Joe uploads restore into these slots.
            </p>
          </div>
          <VideoUploadCard
            videoKey={storyBossIntroKey(SHARK_TANK_BOSS_ID)}
            label={getStoryBossVideoLabel(SHARK_TANK_BOSS_ID, "intro")}
            description={getStoryBossVideoDescription(SHARK_TANK_BOSS_ID, "intro")}
          />
          <VideoUploadCard
            videoKey={storyBossWinKey(SHARK_TANK_BOSS_ID)}
            label={getStoryBossVideoLabel(SHARK_TANK_BOSS_ID, "win")}
            description={getStoryBossVideoDescription(SHARK_TANK_BOSS_ID, "win")}
          />
          <VideoUploadCard
            videoKey={storyBossAvatarKey(SHARK_TANK_BOSS_ID)}
            label={getStoryBossVideoLabel(SHARK_TANK_BOSS_ID, "avatar")}
            description={getStoryBossVideoDescription(SHARK_TANK_BOSS_ID, "avatar")}
          />
        </section>

        <section className="rounded-2xl border border-rose-500/35 bg-rose-950/20 p-4 space-y-3">
          <div>
            <h2 className="text-sm font-black text-rose-200">Shark Bite power videos</h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Same clips as Shark Bite Lab — swim-in, then fullscreen chomp. Tune chroma on{" "}
              <Link to="/shark-bite-lab" className="text-rose-300 underline font-bold">
                Shark Bite Lab
              </Link>
              .
            </p>
          </div>
          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO} />
          <VideoUploadCard videoKey={VIDEO_KEYS.BLUE_GEL_POWER} />
        </section>

        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <input
              type="checkbox"
              className="accent-cyan-400 w-4 h-4"
              checked={powerMode}
              onChange={(e) => setPowerMode(e.target.checked)}
            />
            Power mode (aggro swim)
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <input
              type="checkbox"
              className="accent-sky-300 w-4 h-4"
              checked={frozen}
              onChange={(e) => setFrozen(e.target.checked)}
            />
            Frozen (pause sharks)
          </label>
          <button
            type="button"
            onClick={() => setSeedBump((n) => n + 1)}
            className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 border border-amber-400/40 text-amber-200 hover:bg-amber-950/30"
          >
            Reseed swim paths
          </button>
        </div>

        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-cyan-300">
            Tray preview
          </h2>
          <div className="rounded-2xl border border-cyan-500/25 bg-black/40 p-3 overflow-hidden">
            <DiceTray
              dice={trayDice}
              onToggle={() => {}}
              disabled
              rolling={false}
              skinId="shark_gel"
              powerMode={powerMode}
              iceFrozenOverlay={frozen}
            />
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-cyan-300">
              Face focus
            </h2>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFaceFocus(v)}
                  className={`w-8 h-8 rounded-lg text-xs font-black border ${
                    faceFocus === v
                      ? "bg-cyan-500/30 border-cyan-400 text-white"
                      : "bg-white/5 border-white/15 text-slate-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-center py-4 rounded-2xl border border-white/10 bg-slate-950/80">
            <Die
              key={`focus-${faceFocus}-${seedBump}-${powerMode}-${frozen}`}
              value={faceFocus}
              size={120}
              skinId="shark_gel"
              powerMode={powerMode}
              iceFrozenOverlay={frozen}
              dieSeed={1000 + faceFocus * 17 + seedBump * 31}
            />
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            Face value = shark count in the tank (1–6). Rivalry attacks need 2+.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-cyan-300">
            All faces
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setFaceFocus(v)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 p-2 hover:border-cyan-400/40"
              >
                <Die
                  key={`grid-${v}-${seedBump}-${powerMode}-${frozen}`}
                  value={v}
                  size={72}
                  skinId="shark_gel"
                  powerMode={powerMode}
                  iceFrozenOverlay={frozen}
                  dieSeed={2000 + v * 13 + seedBump * 19}
                />
                <span className="text-[10px] font-bold text-slate-400">{v} shark{v === 1 ? "" : "s"}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
