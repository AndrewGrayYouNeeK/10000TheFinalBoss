import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCachedMatrixPowerVideoObjectUrl,
  preloadMatrixPowerVideo,
  subscribeMatrixPowerVideo,
} from "@/lib/matrixPowerVideo";
import {
  getCachedDiamondCutPowerVideoObjectUrl,
  preloadDiamondCutPowerVideo,
  subscribeDiamondCutPowerVideo,
} from "@/lib/diamondCutPowerVideo";
import { getSkin, getSkinSpriteLayer, getActiveVideoUrl } from "@/lib/shopCatalog";
import { layoutGrid } from "@/lib/diceAssets";
import { useXrayMorphLayout } from "@/hooks/useXrayMorphLayout";
import Pip from "./Pip";
import FishOverlay from "./FishOverlay";
import { BlueGelSharkAttack, BloodPowerFx, BloodyWaterTint, skinUsesBloodPowerFx } from "./BlueGelPowerFX";
import SnowGlobeOverlay from "./SnowGlobeOverlay";
import ExperimentalDieBody, { getExperimentalShadow, isExperimentalClearBody } from "./ExperimentalDieBody";
import { PortfolioDieProvider } from "./portfolio/PortfolioDieContext";
import HeldDiceOverlay from "./HeldDiceOverlay";
import { DEFAULT_HELD_DICE_STYLE } from "@/lib/heldDiceStyles";
import {
  getAquamarineShellNudges,
  getSpriteBleed,
  getSpriteSheetStyle,
  getPowerVideoCellStyle,
  getSkinFaceOffset,
  resolveFaceSpriteNudges,
} from "@/lib/dieSpriteOffsets";

const LOCAL_POWER_VIDEO_SKINS = {
  matrix: {
    getCached: getCachedMatrixPowerVideoObjectUrl,
    preload: preloadMatrixPowerVideo,
    subscribe: subscribeMatrixPowerVideo,
  },
  crystal_cut: {
    getCached: getCachedDiamondCutPowerVideoObjectUrl,
    preload: preloadDiamondCutPowerVideo,
    subscribe: subscribeDiamondCutPowerVideo,
  },
};

function useRollVariants() {
  const ref = React.useRef(null);
  if (!ref.current) {
    const dir = Math.random() > 0.5 ? 1 : -1;
    const spins = (3 + Math.floor(Math.random() * 3)) * 360 * dir;
    const bounceH = 18 + Math.random() * 28;
    ref.current = {
      rotate: [0, spins * 0.3, spins * 0.6, spins * 0.85, spins * 0.95, spins],
      y: [0, -bounceH, -bounceH * 0.4, -bounceH * 0.6, -bounceH * 0.15, 0],
      x: [0, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4, 0, 0],
      scale: [1, 1.15, 1.05, 1.1, 0.97, 1]
    };
  }
  return ref.current;
}

function Die({
  value = 1,
  held = false,
  selected = false,
  used = false,
  rolling = false,
  onClick,
  dieId,
  onToggleDie,
  size = 64,
  skinId = "classic_white",
  bigFishVariantIndex = 0,
  bigFishExtraScale = 1,
  includeJellyfish = false,
  scoreFill = 0.5,
  heldStyleId = DEFAULT_HELD_DICE_STYLE,
  dieSeed,
  lowPower = false,
  powerMode = false,
  sharkBiteFx = false,
  bloodWaterLocked = false,
  onBloodWaterSettled,
  devSkin = null,
}) {
  const stableSeedRef = React.useRef(Math.floor(Math.random() * 10000));
  const effectDieSeed = dieSeed ?? stableSeedRef.current;
  const effectiveHeldStyleId = heldStyleId;
  const reduceEffects = lowPower || rolling;
  const handleClick = React.useCallback(() => {
    if (onClick) onClick();
    else if (onToggleDie && dieId != null) onToggleDie(dieId);
  }, [onClick, onToggleDie, dieId]);
  const skin = devSkin ?? getSkin(skinId);
  const powerVideoSkin = LOCAL_POWER_VIDEO_SKINS[skin.id];
  const [failedVideoUrls, setFailedVideoUrls] = React.useState(() => new Set());
  const [localPowerVideoUrl, setLocalPowerVideoUrl] = React.useState(
    () => powerVideoSkin?.getCached() ?? null
  );
  // Real aspect ratio of the loaded power video (w/h). Matrix videos aren't
  // always 3:2, so we need this to crop each cell without stretching.
  const [videoAspect, setVideoAspect] = React.useState(null);
  React.useEffect(() => {
    setFailedVideoUrls(new Set());
  }, [skin.id, powerMode, skin.powerVideoUrl, skin.videoUrl, localPowerVideoUrl]);
  React.useEffect(() => {
    if (!powerVideoSkin) return undefined;
    let cancelled = false;
    powerVideoSkin.preload().then((url) => {
      if (!cancelled) setLocalPowerVideoUrl(url);
    });
    const unsub = powerVideoSkin.subscribe((url) => {
      if (!cancelled) setLocalPowerVideoUrl(url);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [skin.id, powerVideoSkin]);
  const catalogVideoUrl = getActiveVideoUrl(skin, { powerMode, allowPowerVideo: true });
  const localPowerSrc = powerVideoSkin && powerMode ? localPowerVideoUrl : null;
  const videoCandidates =
    powerVideoSkin && powerMode
      ? [localPowerSrc, catalogVideoUrl]
      : [catalogVideoUrl];
  const activeVideoUrl =
    videoCandidates.find((url) => url && !failedVideoUrls.has(url)) ?? null;
  const videoOk = !!activeVideoUrl;
  const videoSkinActive =
    !!activeVideoUrl || (powerMode && !!skin.powerVideoUrl && videoOk);
  const spriteLayer = getSkinSpriteLayer(skin, { powerMode, allowPowerVideo: videoOk });
  const usesBloodPowerFx = skinUsesBloodPowerFx(skin);
  const showBloodPowerFx =
    !reduceEffects && usesBloodPowerFx && (powerMode || bloodWaterLocked);
  const isXray = skin.id === "pf_xray";
  const { displayLayout: xrayLayout } = useXrayMorphLayout(value, rolling, isXray);
  const layout = isXray ? xrayLayout : layoutGrid(value);
  const rollVariants = useRollVariants();

  const rollKey = React.useRef(0);
  const wasRolling = React.useRef(false);
  const [settling, setSettling] = React.useState(false);
  if (rolling && !wasRolling.current) {
    rollKey.current += 1;
    const dir = Math.random() > 0.5 ? 1 : -1;
    const spins = (3 + Math.floor(Math.random() * 3)) * 360 * dir;
    const bounceH = 18 + Math.random() * 28;
    rollVariants.rotate = [0, spins * 0.3, spins * 0.65, spins * 0.88, spins * 0.97, spins];
    rollVariants.y = [0, -bounceH, -bounceH * 0.35, -bounceH * 0.55, -bounceH * 0.12, 0];
    rollVariants.x = [0, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, 0, 0];
    rollVariants.scale = [1, 1.18, 1.06, 1.12, 0.96, 1];
  }
  React.useEffect(() => {
    let startTimer, endTimer;
    if (rolling && !wasRolling.current) {
      // Start the wild snow ~0.55s into the 0.85s roll, so it begins before the die stops.
      startTimer = setTimeout(() => setSettling(true), 550);
      wasRolling.current = true;
    } else if (!rolling && wasRolling.current) {
      // Keep it going briefly after the die lands, then calm down.
      endTimer = setTimeout(() => setSettling(false), 700);
      wasRolling.current = false;
    }
    return () => {
      if (startTimer) clearTimeout(startTimer);
      if (endTimer) clearTimeout(endTimer);
    };
  }, [rolling]);

  // Standard dice corner radius
  const radius = Math.round(size * 0.06);

  // Squircle mask — bows the edges outward between the corners like a real die.
  // b = bulge amount (fraction of size that the midpoint of each edge extends past the square)
  const b = 0.04;
  const vb = `${-b} ${-b} ${1 + 2 * b} ${1 + 2 * b}`;
  const cr = 0.08; // corner radius in path units
  const squirclePath = `M ${cr},0 L ${1 - cr},0 Q ${1 + b},${0.5} ${1 - cr},1 L ${cr},1 Q ${-b},${0.5} ${cr},0 Z`
    .replace(`L ${1 - cr},0 Q`, `L ${1 - cr},0 Q ${1 + b * 0.3},${-b * 0.3} ${1},${cr} L ${1},${1 - cr} Q`)
    .replace(`L ${cr},1 Q`, `L ${cr},1 Q ${-b * 0.3},${1 + b * 0.3} ${0},${1 - cr} L ${0},${cr} Q`);
  const squircleSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}' preserveAspectRatio='none'><path d='M ${cr} 0 Q ${0.5} ${-b} ${1 - cr} 0 Q 1 0 1 ${cr} Q ${1 + b} ${0.5} 1 ${1 - cr} Q 1 1 ${1 - cr} 1 Q ${0.5} ${1 + b} ${cr} 1 Q 0 1 0 ${1 - cr} Q ${-b} ${0.5} 0 ${cr} Q 0 0 ${cr} 0 Z' fill='black'/></svg>`;
  const squircleMaskUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(squircleSvg)}")`;
  const squircleStyle = {
    WebkitMaskImage: squircleMaskUrl,
    maskImage: squircleMaskUrl,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };

  // Pip size scales nicely with die size
  const pipSize = Math.round(size * 0.145);

  // Padding inside die before the pip grid
  const padding = Math.round(size * 0.13);

  const buildShadow = () => {
    if (skin.experimental) {
      return getExperimentalShadow(skin.style, size, { used, held, selected, heldStyleId: effectiveHeldStyleId });
    }
    if (used) return "none";
    if (held && effectiveHeldStyleId === "corner_badge") return `0 0 0 ${Math.round(size * 0.07)}px #fcd34d`;
    if (held) return `0 0 ${Math.round(size * 0.12)}px rgba(251,191,36,0.25)`;
    if (selected) return `0 0 0 ${Math.round(size * 0.05)}px rgba(52,211,153,0.6)`;
    return "none";
  };

  const isClearBody =
    skin.id === "classic_white" ||
    videoSkinActive ||
    skin.videoUrl ||
    isExperimentalClearBody(skin) ||
    (skin.experimental && (skin.style?.kind === "clear" || skin.style?.kind === "glass"));

  const isPortfolioFx = skin.experimental && skin.style?.effectId && !reduceEffects;

  const renderPipGrid = () => {
    const flat = layout.flat();
    const pipEffect = skin.experimental ? skin.style?.pipEffect : null;

    if (isXray) {
      return (
        <div
          className="absolute grid grid-cols-3 grid-rows-3"
          style={{ inset: padding, gap: Math.round(size * 0.045) }}
        >
          {flat.map((p, i) => {
            const pipCol = i % 3;
            const pipRow = Math.floor(i / 3);
            return (
              <div key={i} className="flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  {p === 1 && (
                    <motion.div
                      key={`xray-pip-${i}`}
                      initial={{ scale: 0.15, opacity: 0, filter: "brightness(2.4)" }}
                      animate={{ scale: 1, opacity: 1, filter: "brightness(1)" }}
                      exit={{ scale: 0.1, opacity: 0, filter: "brightness(2.8)" }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Pip
                        size={pipSize}
                        colorClass={skin.pipColor}
                        inset={false}
                        animationEffect={pipEffect}
                        pipCol={pipCol}
                        pipRow={pipRow}
                        scoreFill={scoreFill}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      );
    }

    return (
    <div
      className="absolute grid grid-cols-3 grid-rows-3"
      style={{ inset: padding, gap: Math.round(size * 0.045) }}
    >
      {flat.map((p, i) => {
        if (p !== 1) {
          return <div key={i} className="flex items-center justify-center" />;
        }
        const pipCol = i % 3;
        const pipRow = Math.floor(i / 3);
        const style = skin.style;
        if (skin.experimental && style?.pipMode === "center_burst" && i !== 4) {
          return <div key={i} className="flex items-center justify-center" />;
        }
        if (skin.experimental && style?.pipMode === "hidden") {
          return <div key={i} className="flex items-center justify-center" />;
        }
        const diamondEffects = ["glow", "shinyStar", "blackHole"];
        let effect = null;
        if (skin.experimental) {
          effect = style?.pipEffect;
        } else if (skin.id === "diamond") {
          effect = diamondEffects[i % 3];
        }
        return (
          <div key={i} className="flex items-center justify-center">
            <Pip
              size={pipSize}
              colorClass={skin.pipColor}
              inset={skin.realistic && !skin.experimental}
              animationEffect={effect}
              pipCol={pipCol}
              pipRow={pipRow}
              scoreFill={scoreFill}
            />
          </div>
        );
      })}
    </div>
    );
  };

  return (
    <motion.div
      key={rolling ? rollKey.current : "idle"}
      className="relative flex-shrink-0 overflow-visible"
      style={{ width: size, height: size }}
      initial={false}
      animate={
      rolling ?
      { rotate: rollVariants.rotate, y: rollVariants.y, x: rollVariants.x, scale: rollVariants.scale } :
      held && !used ?
      { rotate: 0, y: -10, x: 0, scale: 1.08 } :
      { rotate: 0, y: 0, x: 0, scale: 1 }
      }
      transition={
      rolling ?
      {
        duration: 0.85,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.2, 0.45, 0.65, 0.85, 1]
      } :
      { type: "spring", stiffness: 300, damping: 18 }
      }
      whileTap={!used && !rolling ? { scale: 0.92 } : {}}
      whileHover={!used && !rolling ? { y: -5, rotate: 3 } : {}}>

      {held && !used && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
          <HeldDiceOverlay styleId={effectiveHeldStyleId} size={size} radius={radius} />
        </div>
      )}

      <PortfolioDieProvider scoreFill={scoreFill} enabled={isPortfolioFx}>
      <button
        type="button"
        onClick={handleClick}
        disabled={used || rolling}
        className={`relative w-full h-full ${!isClearBody && !skin.experimental ? `bg-gradient-to-br ${skin.gradient}` : ""} ${used ? "opacity-20 grayscale cursor-not-allowed" : ""}`}
        style={{
          borderRadius: radius,
          boxShadow: buildShadow(),
          overflow: "hidden",
          background: isClearBody ? "transparent" : undefined,
          ...squircleStyle
        }}>
        
        {/* Video background skin — cropped 3×2 grid, one face per die */}
        {activeVideoUrl && !reduceEffects && (() => {
          let videoStyle;
          if (skin.id === "matrix") {
            // Preserve the video's real aspect and COVER each cell so the face
            // fills the square die with no stretching. Center on the target cell.
            const cols = 3;
            const rows = 2;
            const col = (value - 1) % cols;
            const row = Math.floor((value - 1) / cols);
            const z = skin.powerVideoZoom ?? 1.28;
            const ratio = videoAspect ?? cols / rows;
            const faceOffset = getSkinFaceOffset(skin, powerMode, value);
            const { xNudge, yNudge } = resolveFaceSpriteNudges(skin.id, value, size, faceOffset, {
              powerVideo: true,
            });
            const crop = skin.powerVideoCrop ?? { offsetX: 0, offsetY: 0 };
            const cropX = (crop.offsetX || 0) * size;
            const cropY = (crop.offsetY || 0) * size;
            const elW = cols * size * z;
            const elH = elW / ratio;
            const cellW = elW / cols;
            const cellH = elH / rows;
            const left = size / 2 - (col + 0.5) * cellW + cropX + xNudge;
            const top = size / 2 - (row + 0.5) * cellH - cropY + yNudge;
            videoStyle = {
              width: `${elW}px`,
              height: `${elH}px`,
              maxWidth: "none",
              maxHeight: "none",
              transform: `translate(${left}px, ${top}px)`,
              transformOrigin: "top left",
              objectFit: "fill",
            };
          } else {
            const { videoW, videoH, txPos, tyPos, objectFit = "cover" } =
              getPowerVideoCellStyle(skin, value, size, { powerMode });
            videoStyle = {
              width: `${videoW * 100}%`,
              height: `${videoH * 100}%`,
              maxWidth: "none",
              maxHeight: "none",
              transform: `translate(${(-txPos / videoW) * 100}%, ${(-tyPos / videoH) * 100}%)`,
              transformOrigin: "top left",
              objectFit,
            };
          }
          const bleed = skin.id === "matrix" ? 0 : getSpriteBleed(size);
          return (
            <div
              className="absolute overflow-hidden pointer-events-none"
              style={{ borderRadius: radius, top: -bleed, left: -bleed, right: -bleed, bottom: -bleed }}
            >
              <video
                key={activeVideoUrl}
                src={activeVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => {
                  const { videoWidth, videoHeight } = e.currentTarget;
                  if (videoWidth && videoHeight) setVideoAspect(videoWidth / videoHeight);
                }}
                onError={() => {
                  setFailedVideoUrls((prev) => {
                    const next = new Set(prev);
                    next.add(activeVideoUrl);
                    return next;
                  });
                }}
                className="absolute top-0 left-0 pointer-events-none"
                style={videoStyle}
              />
              {!rolling && skin.id === "tesla" && (
                <>
                  {/* Electric glass tint for Tesla video dice */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at 35% 30%, rgba(200,220,255,0.35) 0%, rgba(120,80,255,0.25) 55%, rgba(80,40,200,0.4) 100%)",
                      mixBlendMode: "screen",
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: radius,
                      boxShadow:
                        "inset 0 0 0 2px rgba(210,220,255,0.45), inset 0 -6px 14px rgba(100,60,255,0.4), inset 0 4px 10px rgba(220,230,255,0.45)",
                    }}
                  />
                </>
              )}
            </div>
          );
        })()}

        {/* Snow Globe — borrows the Aquamarine glass shell with snowflakes drifting inside */}
        {skin.id === "snow_globe" && (() => {
          const aqua = getSkin("aquamarine");
          const cellW = size * 1.7;
          const cellH = size * 1.32;
          const cols = aqua.spriteGrid?.cols ?? 3;
          const rows = aqua.spriteGrid?.rows ?? 2;
          const col = (value - 1) % cols;
          const row = Math.floor((value - 1) / cols);
          const { xNudge, yNudge } = getAquamarineShellNudges(value, size);
          return (
            <>
              {/* Snowflakes drift behind — density tied to face value; goes wild for a moment AFTER the roll */}
              <SnowGlobeOverlay size={size} radius={radius} count={value} shaking={settling} />
              {/* Aquamarine sprite as a translucent glass shell */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: `${-size * 0.14 + yNudge}px`,
                  bottom: `${-size * 0.8 + yNudge}px`,
                  left: `${-size * 0.35 + xNudge}px`,
                  right: `${-size * 0.35 + xNudge}px`,
                  backgroundImage: `url(${aqua.spriteUrl})`,
                  backgroundSize: `${cellW * cols}px ${cellH * rows}px`,
                  backgroundPosition: `${-(col * cellW)}px ${-(row * cellH)}px`,
                  backgroundRepeat: "no-repeat",
                  opacity: 0.55,
                  mixBlendMode: "multiply",
                }}
              />
              {/* Glass rim */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: radius,
                  boxShadow:
                    "inset 0 0 0 2px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.45)",
                }}
              />
            </>
          );
        })()}

        {/* Blue Gel — borrows the Aquamarine glass shell with a fish swimming inside */}
        {skin.id === "blue_gel" && (() => {
          const aqua = getSkin("aquamarine");
          const cellW = size * 1.7;
          const cellH = size * 1.32;
          const cols = aqua.spriteGrid?.cols ?? 3;
          const rows = aqua.spriteGrid?.rows ?? 2;
          const col = (value - 1) % cols;
          const row = Math.floor((value - 1) / cols);
          const { xNudge, yNudge } = getAquamarineShellNudges(value, size);
          return (
            <>
              {/* Fish / in-die sharks — power-mode feast only (shark bite is fullscreen over gameplay). */}
              {powerMode && !reduceEffects ? (
                <BlueGelSharkAttack
                  key="power-feast"
                  size={size}
                  radius={radius}
                  count={value}
                  bigFishVariantIndex={bigFishVariantIndex}
                  onSettled={onBloodWaterSettled}
                >
                  <FishOverlay
                    size={size}
                    radius={radius}
                    count={value}
                    bigFishVariantIndex={bigFishVariantIndex}
                    bigFishExtraScale={bigFishExtraScale}
                    includeJellyfish={includeJellyfish}
                  />
                </BlueGelSharkAttack>
              ) : (
                <>
                  <FishOverlay
                    size={size}
                    radius={radius}
                    count={value}
                    bigFishVariantIndex={bigFishVariantIndex}
                    bigFishExtraScale={bigFishExtraScale}
                    includeJellyfish={includeJellyfish}
                  />
                  {bloodWaterLocked && !reduceEffects ? (
                    <BloodyWaterTint size={size} radius={radius} count={value} />
                  ) : null}
                </>
              )}
              {/* Aquamarine sprite as a translucent glass shell — on top of the fish */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: `${-size * 0.14 + yNudge}px`,
                  bottom: `${-size * 0.8 + yNudge}px`,
                  left: `${-size * 0.35 + xNudge}px`,
                  right: `${-size * 0.35 + xNudge}px`,
                  backgroundImage: `url(${aqua.spriteUrl})`,
                  backgroundSize: `${cellW * cols}px ${cellH * rows}px`,
                  backgroundPosition: `${-(col * cellW)}px ${-(row * cellH)}px`,
                  backgroundRepeat: "no-repeat",
                  opacity: 0.7,
                  mixBlendMode: "multiply",
                }}
              />
              {/* Glass rim — thickness */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: radius,
                  boxShadow:
                    "inset 0 0 0 2px rgba(255,255,255,0.4), inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.35)",
                }}
              />
            </>
          );
        })()}

        {/* Default power move for skins without dedicated power visuals — bloody water */}
        {showBloodPowerFx ? (
          <BloodPowerFx
            size={size}
            radius={radius}
            count={value}
            locked={bloodWaterLocked}
            onSettled={onBloodWaterSettled}
          />
        ) : null}

        {/* Experimental / preview dice bodies */}
        {skin.experimental && skin.style && (
          <ExperimentalDieBody
            style={skin.style}
            radius={radius}
            scoreFill={scoreFill}
            layout={layout}
            size={size}
            dieSeed={effectDieSeed}
          />
        )}

        {/* Sprite sheet texture or pip grid — skip when a video skin is active */}
        {skin.id !== "blue_gel" && skin.id !== "snow_globe" && spriteLayer && !activeVideoUrl ?
        (() => {
          const spriteSkin = { ...skin, spriteUrl: spriteLayer.spriteUrl, spriteCrop: spriteLayer.spriteCrop };
          const faceOffset = getSkinFaceOffset(skin, powerMode, value);
          const { xNudge, yNudge } = resolveFaceSpriteNudges(skin.id, value, size, faceOffset);
          const sheetStyle = getSpriteSheetStyle(spriteSkin, value, size, { xNudge, yNudge });
          return (
            <div
              className="absolute pointer-events-none"
              style={{
                borderRadius: radius,
                backgroundImage: `url(${spriteLayer.spriteUrl})`,
                ...sheetStyle,
              }} />
          );
        })() :

        (skin.experimental ||
          (skin.id !== "blue_gel" && skin.id !== "snow_globe" && !spriteLayer && !videoSkinActive)) &&
          renderPipGrid()}

        {/* Matrix — animated code rain in power mode only (hidden when power video plays) */}
        {skin.id === "matrix" && powerMode && !reduceEffects && !activeVideoUrl && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: radius,
                boxShadow: `inset 0 0 ${Math.round(size * 0.22)}px rgba(34,197,94,0.55), 0 0 ${Math.round(size * 0.18)}px rgba(34,197,94,0.65)`,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-95"
              style={{ borderRadius: radius }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute font-mono font-bold text-[5px] text-green-200"
                  style={{
                    left: `${i * (100 / 12) + 1}%`,
                    textShadow: "0 0 6px #4ade80, 0 0 14px #22c55e",
                  }}
                  animate={{ top: ["-20%", "120%"] }}
                  transition={{
                    duration: 0.18 + i * 0.02,
                    repeat: Infinity,
                    delay: i * 0.02,
                    ease: "linear",
                  }}
                >
                  {Array.from({ length: 14 }).map((__, j) => (
                    <div key={j}>{(i + j) % 2 ? "1" : "0"}</div>
                  ))}
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Corner shadow vignette — Chrome Silver only */}
        {skin.id === "silver" && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: radius,
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 90%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        )}

        {/* Diamond shimmer overlay */}
        {skin.special === "diamond" &&
        <>
            <div
            className="absolute inset-0 pointer-events-none opacity-80 mix-blend-overlay"
            style={{
              borderRadius: radius,
              background:
              "conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.9) 0deg, rgba(186,230,253,0.2) 60deg, rgba(255,255,255,0.8) 120deg, rgba(125,211,252,0.3) 180deg, rgba(255,255,255,0.9) 240deg, rgba(186,230,253,0.2) 300deg, rgba(255,255,255,0.9) 360deg)"
            }} />
          
            <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              borderRadius: radius,
              background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(186,230,253,0.7) 0%, transparent 35%)"
            }} />
          
          </>
        }

      </button>
      </PortfolioDieProvider>
    </motion.div>);

}

function diePropsAreEqual(prev, next) {
  if (prev.devSkin !== next.devSkin) return false;
  if (prev.powerMode !== next.powerMode) return false;
  return (
    prev.value === next.value &&
    prev.held === next.held &&
    prev.used === next.used &&
    prev.rolling === next.rolling &&
    prev.skinId === next.skinId &&
    prev.size === next.size &&
    prev.scoreFill === next.scoreFill &&
    prev.bigFishVariantIndex === next.bigFishVariantIndex &&
    prev.bigFishExtraScale === next.bigFishExtraScale &&
    prev.includeJellyfish === next.includeJellyfish &&
    prev.heldStyleId === next.heldStyleId &&
    prev.dieId === next.dieId &&
    prev.dieSeed === next.dieSeed &&
    prev.lowPower === next.lowPower &&
    prev.sharkBiteFx === next.sharkBiteFx &&
    prev.bloodWaterLocked === next.bloodWaterLocked &&
    prev.onBloodWaterSettled === next.onBloodWaterSettled &&
    prev.onToggleDie === next.onToggleDie &&
    prev.onClick === next.onClick
  );
}

export default React.memo(Die, diePropsAreEqual);