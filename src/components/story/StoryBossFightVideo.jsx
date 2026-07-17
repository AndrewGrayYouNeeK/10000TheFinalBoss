import StoryBossGameplayLoop from "./StoryBossGameplayLoop";

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
};

const DEFAULT_FRAME = {
  borderColor: "#00ffc8",
  boxShadow: "0 0 18px rgba(0,255,200,0.5), 0 0 28px rgba(255,0,234,0.3)",
};

/** Matrix-sized looping boss video during story fights. */
export default function StoryBossFightVideo({ bossId, enabled = true }) {
  if (!bossId) return null;
  const frame = FRAME_BY_BOSS[bossId] ?? DEFAULT_FRAME;

  return (
    <div className="px-3 pt-3 flex justify-center">
      <div
        className="relative w-full max-w-[12rem] sm:max-w-[14rem] h-48 sm:h-56 max-h-[34vh] rounded-2xl overflow-hidden border-2 bg-black/90"
        style={frame}
      >
        <StoryBossGameplayLoop bossId={bossId} enabled={enabled} fit="contain" />
      </div>
    </div>
  );
}
