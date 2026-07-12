import React, { useEffect, useRef, useState } from "react";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getFelt } from "@/lib/shopCatalog";
import { useCosmetics } from "@/hooks/useCosmetics";
import { getSkin } from "@/lib/shopCatalog";
import { enterShopPreviewSession } from "@/lib/gameAudioSettings";

function stableSeed(skinId) {
  return [...String(skinId)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** Shop / mystery box preview — same Die + felt tray as gameplay */
export default function DicePreview({
  skinId,
  value = 5,
  size = 64,
  scoreFill = 0.5,
  compact = true,
}) {
  const { equippedFeltId } = useCosmetics();
  const felt = getFelt(equippedFeltId);
  const skin = getSkin(skinId);
  const hasPowerSprite = !!skin?.powerSpriteUrl;
  const [powerMode, setPowerMode] = useState(false);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let leavePreview = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (!leavePreview) leavePreview = enterShopPreviewSession();
        } else {
          leavePreview?.();
          leavePreview = null;
        }
      },
      { rootMargin: "140px" },
    );

    io.observe(el);
    return () => {
      leavePreview?.();
      io.disconnect();
    };
  }, []);

  const minHeight = size + (compact ? 28 : 44);

  return (
    <div ref={ref} className="flex items-center justify-center shrink-0" style={{ minHeight }}>
      {visible ? (
        <FeltTrayFrame
          felt={felt}
          compact={compact}
          innerClassName="flex items-center justify-center px-2 py-1.5"
        >
          <div className="relative z-10 flex flex-col items-center gap-1">
            <Die
              value={value}
              skinId={skinId}
              size={size}
              scoreFill={scoreFill}
              dieSeed={stableSeed(skinId)}
              powerMode={powerMode}
            />
            {hasPowerSprite && (
              <button
                type="button"
                onClick={() => setPowerMode((p) => !p)}
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  powerMode
                    ? "border-orange-400/60 text-orange-200 bg-orange-500/20"
                    : "border-white/15 text-slate-500 bg-black/20"
                }`}
              >
                {powerMode ? "⚡ Power" : "Power off"}
              </button>
            )}
          </div>
        </FeltTrayFrame>
      ) : (
        <div
          className="rounded-xl bg-slate-800/30 animate-pulse"
          style={{ width: size + 24, height: minHeight - 4 }}
        />
      )}
    </div>
  );
}
