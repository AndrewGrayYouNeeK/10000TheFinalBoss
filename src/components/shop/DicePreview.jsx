import React from "react";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getBlueGelTrayFishProps } from "@/lib/fishDice";
import { getFelt, isAquariumOverlaySkinId } from "@/lib/shopCatalog";
import { useCosmetics } from "@/hooks/useCosmetics";
import { enterShopPreviewSession } from "@/lib/gameAudioSettings";
import { getSkinLevelVisual } from "@/lib/skinLevelVisuals";

function stableSeed(skinId) {
  return [...String(skinId)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** Shop / mystery box preview — same Die + felt tray as gameplay.
 *  Ghost always renders spectral (disguise is never swapped in for look). */
export default function DicePreview({
  skinId,
  value = 5,
  size = 64,
  scoreFill = 0.5,
  skinLevel = 1,
  compact = true,
  /** @deprecated Ghost no longer resolves to disguise; kept for call-site compat. */
  resolveGhost: _resolveGhost = false,
}) {
  const { equippedFeltId } = useCosmetics();
  const felt = getFelt(equippedFeltId);
  const renderSkinId = skinId;
  const previewValue =
    renderSkinId === "blue_gel" ? 1 : isAquariumOverlaySkinId(renderSkinId) ? 1 : value;
  const blueGelFishProps =
    renderSkinId === "blue_gel" ? getBlueGelTrayFishProps(0) : {};
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let leavePreview = enterShopPreviewSession();
    return () => {
      leavePreview?.();
    };
  }, []);

  const minHeight = size + (compact ? 28 : 44);
  const sharkTankPreview = renderSkinId === "shark_gel";

  return (
    <div ref={ref} className="flex items-center justify-center shrink-0" style={{ minHeight }}>
      <FeltTrayFrame
        felt={felt}
        compact={compact}
        allowDieOverflow={
          sharkTankPreview ||
          (Number(skinLevel) > 1 && getSkinLevelVisual(renderSkinId)?.effect === "frost")
        }
        innerClassName="flex items-center justify-center px-2 py-1.5"
      >
        <div className="relative z-10 overflow-visible">
          <Die
            value={previewValue}
            skinId={renderSkinId}
            size={size}
            scoreFill={scoreFill}
            dieSeed={stableSeed(renderSkinId)}
            skinLevel={skinLevel}
            {...blueGelFishProps}
          />
        </div>
      </FeltTrayFrame>
    </div>
  );
}
