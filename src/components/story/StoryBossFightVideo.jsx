import StoryBossGameplayLoop from "./StoryBossGameplayLoop";
import { MarlinLoopPanOverlay } from "./MarlinLoopPositionTool";
import { getStoryBossAvatarLoopFit } from "@/lib/storyBossVideos";

const FRAME_BY_BOSS = {
  neo: {
    borderColor: "#ff00ea",
    boxShadow: "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.6)",
  },
  gq: {
    borderColor: "#67e8f9",
    boxShadow: "0 0 18px #a5f3fc, 0 0 36px rgba(103,232,249,0.55)",
  },
  snowman: {
    borderColor: "#7dd3fc",
    boxShadow: "0 0 18px #bae6fd, 0 0 32px rgba(56,189,248,0.45)",
  },
  fisherman: {
    borderColor: "#38bdf8",
    boxShadow: "0 0 18px #7dd3fc, 0 0 32px rgba(56,189,248,0.5)",
  },
};

const DEFAULT_FRAME = {
  borderColor: "#00ffc8",
  boxShadow: "0 0 18px rgba(0,255,200,0.5), 0 0 28px rgba(255,0,234,0.3)",
};

/** Matrix-sized looping boss video during story fights. */
export default function StoryBossFightVideo({
  bossId,
  enabled = true,
  loopPanEnabled = false,
  frozen = false,
}) {
  if (!bossId) return null;
  const frame = FRAME_BY_BOSS[bossId] ?? DEFAULT_FRAME;

  return (
    <div className="px-3 pt-3 flex justify-center">
      <div
        className="relative w-full max-w-[12rem] sm:max-w-[14rem] h-48 sm:h-56 max-h-[34vh] rounded-2xl overflow-hidden border-2 bg-black/90"
        style={
          frozen
            ? {
                borderColor: "#7dd3fc",
                boxShadow: "0 0 22px #bae6fd, 0 0 40px rgba(56,189,248,0.65)",
              }
            : frame
        }
      >
        <StoryBossGameplayLoop
          bossId={bossId}
          enabled={enabled}
          fit={getStoryBossAvatarLoopFit(bossId)}
        />
        {bossId === "fisherman" ? <MarlinLoopPanOverlay enabled={loopPanEnabled} /> : null}
        {frozen ? (
          <div
            className="absolute inset-0 pointer-events-none z-10 flex items-end justify-center pb-2"
            style={{
              background:
                "linear-gradient(180deg, rgba(125,211,252,0.35) 0%, rgba(14,116,144,0.45) 100%)",
              boxShadow: "inset 0 0 40px rgba(186,230,253,0.55)",
            }}
            aria-hidden
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 drop-shadow">
              Frozen
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
