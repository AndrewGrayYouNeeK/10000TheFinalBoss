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
import {
  AQUARIUM_OVERLAY_SKIN_IDS,
  getSkin,
  getSkinSpriteLayer,
  getActiveVideoUrl,
} from "@/lib/shopCatalog";
import { layoutGrid } from "@/lib/diceAssets";
import { useXrayMorphLayout } from "@/hooks/useXrayMorphLayout";
import Pip from "./Pip";
import FishOverlay, { ANGELFISH_VARIANT_INDICES, FISH_VARIANTS } from "./FishOverlay";
import {
  BlueGelSharkAttack,
  BlueGelSharkBiteCharge,
  BloodPowerFx,
  BloodyWaterTint,
  SharkTankOverlay,
} from "./BlueGelPowerFX";
import { skinUsesBloodPowerFx } from "@/lib/skinPowerVisuals";
import SnowGlobeOverlay from "./SnowGlobeOverlay";
import IcePowerOverlay from "./IcePowerOverlay";
import { isFreezeOverlayImmuneSkin } from "@/lib/icePowerSettings";
import ExperimentalDieBody, { getExperimentalShadow, isExperimentalClearBody } from "./ExperimentalDieBody";
import { PortfolioDieProvider } from "./portfolio/PortfolioDieContext";
import HeldDiceOverlay from "./HeldDiceOverlay";
import { DEFAULT_HELD_DICE_STYLE } from "@/lib/heldDiceStyles";
import {
  getAquamarineShellStyle,
  getSpriteSheetStyle,
  getPowerVideoCellStyle,
  getSkinFaceOffset,
  resolveFaceSpriteNudges,
} from "@/lib/dieSpriteOffsets";
import { getDieSquircleClipStyle } from "@/lib/dieSquircleClip";
import {
  getSnowGlobeShellCrop,
  resolveSnowGlobeShellNudges,
  useSnowGlobeSettings,
} from "@/lib/snowGlobeSettings";
import {
  getBlueGelShellCrop,
  resolveBlueGelShellNudges,
  useBlueGelSettings,
} from "@/lib/blueGelSettings";
import { assetUrl } from "@/lib/assetUrl";
import { GHOST_SKIN_ID } from "@/lib/ghostDisguise";
import { clampSkinLevel, getSkinLevelVisual } from "@/lib/skinLevelVisuals";

// Keep the live aquarium roster available for every face while reserving
// indices 6 and 7 for the two deterministic face-1 Angelfish variants.
const BLUE_GEL_FISH_VARIANT_INDICES = FISH_VARIANTS.map((_, index) => index);

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

/** Survives Die remounts (roll animation keys) so skins don't flash pip fallback. */
const SPRITE_LOAD_CACHE = new Set();

function preloadSpriteUrl(url, onResult) {
  const resolved = assetUrl(url);
  if (SPRITE_LOAD_CACHE.has(resolved)) {
    onResult(true);
    return () => {};
  }
  let cancelled = false;
  const img = new Image();
  img.onload = () => {
    SPRITE_LOAD_CACHE.add(resolved);
    if (!cancelled) onResult(true);
  };
  img.onerror = () => {
    if (!cancelled) onResult(false);
  };
  img.decoding = "async";
  img.src = resolved;
  if (img.complete && img.naturalWidth > 0) {
    SPRITE_LOAD_CACHE.add(resolved);
    onResult(true);
  }
  return () => {
    cancelled = true;
  };
}

function buildRollMotion() {
  const dir = Math.random() > 0.5 ? 1 : -1;
  const spins = (3 + Math.floor(Math.random() * 3)) * 360 * dir;
  const bounceH = 18 + Math.random() * 28;
  return {
    rotate: [0, spins * 0.3, spins * 0.65, spins * 0.88, spins * 0.97, spins],
    y: [0, -bounceH, -bounceH * 0.35, -bounceH * 0.55, -bounceH * 0.12, 0],
    x: [0, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, 0, 0],
    scale: [1, 1.18, 1.06, 1.12, 0.96, 1],
  };
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
  bigFishStaticPose = false,
  includeJellyfish = false,
  scoreFill = 0.5,
  heldStyleId = DEFAULT_HELD_DICE_STYLE,
  dieSeed,
  lowPower = false,
  powerMode = false,
  powerModeSubtle = false,
  /** When true (power mode + chosen die), X-Ray may morph this die's pip face. */
  allowXrayMorph = false,
  iceFrozenOverlay = false,
  /**
   * Sprite Lab only — paint freeze cubes even on fire-immune skins while tuning.
   * In-game Ragnarok / lava stay freeze-overlay immune.
   */
  labForceFreezeOverlay = false,
  sharkBiteFx = false,
  /** Feeding Frenzy — opponent targeted these fish dice (not Blue Gel's own Shark Bite charge). */
  fishFeastMode = false,
  /** Online opponent view — face values withheld by server. */
  valueHidden = false,
  /** Story Ghost — nearly invisible body; no face readout / ? badge. */
  spectralHidden = false,
  bloodWaterLocked = false,
  onBloodWaterSettled,
  /** Brief RGB glitch overlay when Matrix Glitch rewrites this die. */
  matrixGlitchFx = false,
  /** Earned local skin level used by Sprite Lab visual progression. */
  skinLevel = 1,
  devSkin = null,
  /** Sprite Lab override for Snow Globe glass-shell alignment. */
  snowGlobeShellSettings: snowGlobeShellSettingsProp = null,
}) {
  const stableSeedRef = React.useRef(Math.floor(Math.random() * 10000));
  const effectDieSeed = dieSeed ?? stableSeedRef.current;
  const effectiveHeldStyleId = heldStyleId;
  const handleClick = React.useCallback(() => {
    if (onClick) onClick();
    else if (onToggleDie && dieId != null) onToggleDie(dieId);
  }, [onClick, onToggleDie, dieId]);
  const skin = devSkin ?? getSkin(skinId);
  const effectiveSkinId = devSkin?.id ?? skinId;
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
  const reduceEffects = lowPower || rolling;
  const reducePowerPresentation = reduceEffects || powerModeSubtle;
  const skinLevelForRender = clampSkinLevel(skinLevel);
  const skinLevelVisual = getSkinLevelVisual(effectiveSkinId);
  const levelFrostActive =
    !reduceEffects &&
    skinLevelForRender > 1 &&
    skinLevelVisual?.effect === "frost";
  // Reserve sprite only while the video layer is actually on screen (not during roll/lowPower/subtle).
  const videoPlaying = Boolean(activeVideoUrl && !reducePowerPresentation);
  const videoSkinActive = videoPlaying;
  const chargedSpriteLayer = getSkinSpriteLayer(skin, {
    powerMode,
    allowPowerVideo: videoOk && videoPlaying,
  });
  const regularSpriteLayer = getSkinSpriteLayer(skin, {
    powerMode: false,
    allowPowerVideo: false,
  });
  const displaySpriteLayer = videoPlaying
    ? null
    : (chargedSpriteLayer || regularSpriteLayer);
  const spriteOffsetMode = videoPlaying
    ? "powerVideo"
    : displaySpriteLayer?.isPowerLayer
      ? "powerSprite"
      : "regular";
  const [spriteFailed, setSpriteFailed] = React.useState(false);
  React.useEffect(() => {
    const url = displaySpriteLayer?.spriteUrl;
    if (!url) {
      setSpriteFailed(false);
      return undefined;
    }
    const resolved = assetUrl(url);
    if (SPRITE_LOAD_CACHE.has(resolved)) {
      setSpriteFailed(false);
      return undefined;
    }
    setSpriteFailed(false);
    return preloadSpriteUrl(url, (ok) => {
      if (ok) setSpriteFailed(false);
      else setSpriteFailed(true);
    });
  }, [displaySpriteLayer?.spriteUrl]);
  const usesBloodPowerFx = skinUsesBloodPowerFx(skin);
  const showBloodPowerFx =
    !reducePowerPresentation && usesBloodPowerFx && (powerMode || bloodWaterLocked);
  const isXray = skin.id === "pf_xray";
  const isGhostSkin = effectiveSkinId === GHOST_SKIN_ID;
  // Ghost — hold the previous face while tumbling so pip layouts don't flash mid-roll.
  const stableGhostFaceRef = React.useRef(value);
  React.useEffect(() => {
    if (!rolling || held || used) {
      stableGhostFaceRef.current = value;
    }
  }, [rolling, held, used, value]);
  const faceValue =
    isGhostSkin && rolling && !held && !used ? stableGhostFaceRef.current : value;

  const { displayLayout: xrayLayout } = useXrayMorphLayout(
    faceValue,
    rolling,
    isXray && allowXrayMorph
  );
  const layout = isXray ? xrayLayout : layoutGrid(faceValue);

  const wasRolling = React.useRef(false);
  const [settling, setSettling] = React.useState(false);
  // Stable key — remounting on every roll was causing a second spin.
  const [rollMotion, setRollMotion] = React.useState(null);
  React.useEffect(() => {
    let startTimer;
    let endTimer;
    if (rolling && !wasRolling.current) {
      setRollMotion(buildRollMotion());
      startTimer = setTimeout(() => setSettling(true), 550);
      wasRolling.current = true;
    } else if (!rolling && wasRolling.current) {
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

  // Score Freeze cube overlay — only when explicitly frozen (never from ice skin power charge).
  // Ragnarok / lava never get ice cubes in-game; Sprite Lab can force preview via labForceFreezeOverlay.
  const freezeImmune =
    isFreezeOverlayImmuneSkin(effectiveSkinId) && !labForceFreezeOverlay;
  const icePowerActive = iceFrozenOverlay && !reduceEffects && !freezeImmune;
  const iceOverlayActive = icePowerActive || levelFrostActive;
  const isAquariumOverlaySkin = AQUARIUM_OVERLAY_SKIN_IDS.has(effectiveSkinId);
  const isBlueGelTank = effectiveSkinId === "blue_gel";
  const isSharkTank = effectiveSkinId === "shark_gel";
  const blueGelVariantSeed = Number(effectDieSeed);
  const blueGelBigFishVariantIndex =
    value === 1
      ? ANGELFISH_VARIANT_INDICES[
          (Number.isFinite(blueGelVariantSeed) ? Math.abs(blueGelVariantSeed) : 0) %
            ANGELFISH_VARIANT_INDICES.length
        ]
      : bigFishVariantIndex;
  const aquamarineShellSkin = isAquariumOverlaySkin ? getSkin("aquamarine") : null;
  const aquamarineShellUrl = aquamarineShellSkin?.spriteUrl ?? null;
  const [aquaShellOk, setAquaShellOk] = React.useState(true);
  React.useEffect(() => {
    if (!aquamarineShellUrl) {
      setAquaShellOk(false);
      return undefined;
    }
    setAquaShellOk(true);
    return preloadSpriteUrl(aquamarineShellUrl, (ok) => setAquaShellOk(ok));
  }, [aquamarineShellUrl]);
  const showAquamarineShell = Boolean(aquamarineShellUrl && aquaShellOk);
  const liveSnowGlobeSettings = useSnowGlobeSettings();
  const liveBlueGelSettings = useBlueGelSettings();
  const snowGlobeShellSettings =
    effectiveSkinId === "snow_globe"
      ? snowGlobeShellSettingsProp ?? liveSnowGlobeSettings
      : null;
  // Convex squircle on the inner visual stack — never on the button (that hid sprites).
  const dieShapeStyle = getDieSquircleClipStyle(size);

  const showSpriteLayer =
    !isBlueGelTank &&
    displaySpriteLayer &&
    !videoPlaying &&
    !isAquariumOverlaySkin &&
    !spriteFailed;
  // Pip grid only when there is no sprite sheet, or the sheet failed to load — never flash during load.
  const showPipFallback =
    !isBlueGelTank &&
    !isAquariumOverlaySkin &&
    !videoPlaying &&
    !videoSkinActive &&
    (!displaySpriteLayer || spriteFailed);

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
    isAquariumOverlaySkin ||
    isBlueGelTank ||
    videoSkinActive ||
    skin.videoUrl ||
    isExperimentalClearBody(skin) ||
    (skin.experimental && (skin.style?.kind === "clear" || skin.style?.kind === "glass"));

  const isPortfolioFx = skin.experimental && skin.style?.effectId && !reduceEffects;

  const renderPipGrid = () => {
    // Private / redacted faces — spectral body only, no pip readout underneath.
    if (spectralHidden || valueHidden) return null;
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
      data-die-pip-grid
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

  const isRollingAnim = rolling && !held && !used && rollMotion;
  // Hover-rotate + squircle clip-path leaves a rotated "ghost" of portfolio FX (Soundwave, etc.).
  const hoverMotion =
    !used && !(rolling && !held)
      ? isPortfolioFx
        ? { y: -5 }
        : { y: -5, rotate: 3 }
      : {};
  return (
    <motion.div
      key={dieId != null ? `die-${dieId}` : "die"}
      className="relative flex-shrink-0 overflow-visible"
      style={{
        width: size,
        height: size,
        isolation: isPortfolioFx || skin.experimental ? "isolate" : undefined,
      }}
      initial={false}
      animate={
        isRollingAnim
          ? {
              rotate: rollMotion.rotate,
              y: rollMotion.y,
              x: rollMotion.x,
              scale: rollMotion.scale,
            }
          : held && !used
            ? { rotate: 0, y: -10, x: 0, scale: 1.08 }
            : { rotate: 0, y: 0, x: 0, scale: 1 }
      }
      transition={
        isRollingAnim
          ? {
              duration: 0.85,
              ease: [0.25, 0.46, 0.45, 0.94],
              times: [0, 0.2, 0.45, 0.65, 0.85, 1],
            }
          : {
              y: { type: "spring", stiffness: 300, damping: 18 },
              x: { type: "spring", stiffness: 300, damping: 18 },
              scale: { type: "spring", stiffness: 300, damping: 18 },
              // Snap — do not animate from multi-turn roll rotate back to 0
              // (that unwind looked like a second spin).
              rotate: { duration: 0 },
            }
      }
      whileTap={!used && !(rolling && !held) ? { scale: 0.92 } : {}}
      whileHover={hoverMotion}>

      {held && !used && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
          <HeldDiceOverlay styleId={effectiveHeldStyleId} size={size} radius={radius} />
        </div>
      )}

      <PortfolioDieProvider scoreFill={scoreFill} enabled={isPortfolioFx}>
      <button
        type="button"
        onClick={handleClick}
        disabled={used || (rolling && !held)}
        className={`relative w-full h-full ${used ? "opacity-20 grayscale cursor-not-allowed" : ""}`}
        style={{
          boxShadow: icePowerActive ? "none" : buildShadow(),
          // Ice drips must paint outside the squircle — don't clip the button.
          overflow: iceOverlayActive ? "visible" : "hidden",
          background: "transparent",
        }}>
        {/* Visual stack — squircle clip-path on skin layers only (not ice overlay). */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={dieShapeStyle}
        >
        {!isClearBody && !skin.experimental && !showSpriteLayer && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${skin.gradient}`}
            aria-hidden
          />
        )}

        {/* Video background skin — cropped 3×2 grid, one face per die */}
        {activeVideoUrl && !reduceEffects && effectiveSkinId !== "blue_gel" && (() => {
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
            const faceOffset = getSkinFaceOffset(skin, value, "powerVideo");
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
          return (
            <div
              className="absolute overflow-hidden pointer-events-none"
              style={{ inset: 0 }}
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
            </div>
          );
        })()}

        {/* Snow Globe — drifting snow + semi-transparent Aquamarine glass shell (original stack). */}
        {effectiveSkinId === "snow_globe" && (() => {
          const aqua = aquamarineShellSkin ?? getSkin("aquamarine");
          const { xNudge, yNudge } = resolveSnowGlobeShellNudges(
            value,
            size,
            snowGlobeShellSettings
          );
          const aquaForShell = {
            ...aqua,
            spriteCrop: getSnowGlobeShellCrop(aqua.spriteCrop, snowGlobeShellSettings),
          };
          const shellStyle = getAquamarineShellStyle(aquaForShell, value, size, { xNudge, yNudge });
          return (
            <>
              <SnowGlobeOverlay size={size} radius={radius} count={value} shaking={settling} />
              {showAquamarineShell ? (
                <div
                  className="absolute pointer-events-none z-[2]"
                  style={{
                    backgroundImage: `url(${assetUrl(aqua.spriteUrl)})`,
                    opacity: 0.55,
                    mixBlendMode: "multiply",
                    ...shellStyle,
                  }}
                />
              ) : null}
              <div
                className="absolute inset-0 pointer-events-none z-[3]"
                style={{
                  boxShadow:
                    "inset 0 0 0 2px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(0,0,0,0.12), inset 0 4px 8px rgba(255,255,255,0.45)",
                }}
              />
            </>
          );
        })()}

        {/* Blue Gel — original live aquarium, kept in the existing die stack. */}
        {effectiveSkinId === "blue_gel" && (
            <>
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(125,211,252,0.55) 0%, rgba(56,189,248,0.65) 35%, rgba(37,99,235,0.75) 70%, rgba(30,64,175,0.85) 100%)",
                }}
              />
              <div className="absolute inset-0 z-[1] pointer-events-none">
              {fishFeastMode && !reduceEffects ? (
                <BlueGelSharkAttack
                  key="feeding-frenzy"
                  size={size}
                  radius={radius}
                  count={value}
                  bigFishVariantIndex={blueGelBigFishVariantIndex}
                  onSettled={onBloodWaterSettled}
                >
                  <FishOverlay
                    size={size}
                    radius={radius}
                    count={value}
                    dieSeed={effectDieSeed}
                    bigFishVariantIndex={blueGelBigFishVariantIndex}
                    bigFishExtraScale={Math.min(bigFishExtraScale, 1.65)}
                    bigFishStaticPose={false}
                    fishVariantIndices={BLUE_GEL_FISH_VARIANT_INDICES}
                    includeJellyfish={includeJellyfish}
                    frozen={icePowerActive}
                  />
                </BlueGelSharkAttack>
              ) : powerMode && !reducePowerPresentation ? (
                <BlueGelSharkBiteCharge size={size} radius={radius} count={value} dieSeed={effectDieSeed}>
                  <FishOverlay
                    size={size}
                    radius={radius}
                    count={value}
                    dieSeed={effectDieSeed}
                    bigFishVariantIndex={blueGelBigFishVariantIndex}
                    bigFishExtraScale={Math.min(bigFishExtraScale, 1.65)}
                    bigFishStaticPose={false}
                    fishVariantIndices={BLUE_GEL_FISH_VARIANT_INDICES}
                    includeJellyfish={includeJellyfish}
                    frozen={icePowerActive}
                  />
                </BlueGelSharkBiteCharge>
              ) : (
                <>
                  <FishOverlay
                    size={size}
                    radius={radius}
                    count={value}
                    dieSeed={effectDieSeed}
                    bigFishVariantIndex={blueGelBigFishVariantIndex}
                    bigFishExtraScale={Math.min(bigFishExtraScale, 1.65)}
                    bigFishStaticPose={false}
                    fishVariantIndices={BLUE_GEL_FISH_VARIANT_INDICES}
                    includeJellyfish={includeJellyfish}
                    frozen={icePowerActive}
                  />
                  {bloodWaterLocked && !reduceEffects ? (
                    <BloodyWaterTint size={size} radius={radius} count={value} dieSeed={effectDieSeed} />
                  ) : null}
                </>
              )}
              </div>
              {showAquamarineShell ? (() => {
                const { xNudge, yNudge } = resolveBlueGelShellNudges(
                  value,
                  size,
                  liveBlueGelSettings
                );
                const aquaForShell = {
                  ...aquamarineShellSkin,
                  spriteCrop: getBlueGelShellCrop(
                    aquamarineShellSkin?.spriteCrop,
                    liveBlueGelSettings
                  ),
                };
                const shellStyle = getAquamarineShellStyle(
                  aquaForShell,
                  value,
                  size,
                  { xNudge, yNudge }
                );
                return (
                  <div
                    className="absolute pointer-events-none z-[2]"
                    style={{
                      backgroundImage: `url(${assetUrl(aquamarineShellSkin.spriteUrl)})`,
                      opacity: 0.58,
                      mixBlendMode: "multiply",
                      ...shellStyle,
                    }}
                  />
                );
              })() : null}
              <div
                className="absolute inset-0 pointer-events-none z-[3]"
                style={{
                  boxShadow:
                    "inset 0 0 0 2px rgba(255,255,255,0.4), inset 0 -6px 12px rgba(0,0,0,0.12), inset 0 4px 8px rgba(255,255,255,0.35)",
                }}
              />
            </>
        )}

        {/* Shark Tank — separate dark aquarium skin; Blue Gel/Angelfish stays untouched. */}
        {isSharkTank && (
          <>
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background:
                  "linear-gradient(160deg, rgba(100,116,139,0.68) 0%, rgba(14,116,144,0.78) 38%, rgba(15,23,42,0.9) 72%, rgba(2,6,23,0.96) 100%)",
              }}
            />
            <div className="absolute inset-0 z-[1] pointer-events-none">
              <SharkTankOverlay
                size={size}
                radius={radius}
                count={value}
                dieSeed={effectDieSeed}
                frozen={icePowerActive}
                powerMode={powerMode && !reducePowerPresentation}
              />
            </div>
            {showAquamarineShell ? (() => {
              const { xNudge, yNudge } = resolveBlueGelShellNudges(
                value,
                size,
                liveBlueGelSettings
              );
              const aquaForShell = {
                ...aquamarineShellSkin,
                spriteCrop: getBlueGelShellCrop(
                  aquamarineShellSkin?.spriteCrop,
                  liveBlueGelSettings
                ),
              };
              const shellStyle = getAquamarineShellStyle(
                aquaForShell,
                value,
                size,
                { xNudge, yNudge }
              );
              return (
                <div
                  className="absolute pointer-events-none z-[2]"
                  style={{
                    backgroundImage: `url(${assetUrl(aquamarineShellSkin.spriteUrl)})`,
                    opacity: 0.58,
                    mixBlendMode: "multiply",
                    ...shellStyle,
                  }}
                />
              );
            })() : null}
            <div
              className="absolute inset-0 pointer-events-none z-[3]"
              style={{
                boxShadow:
                  "inset 0 0 0 2px rgba(148,163,184,0.55), inset 0 -8px 16px rgba(0,0,0,0.42), inset 0 4px 8px rgba(255,255,255,0.25), inset 0 0 12px rgba(220,38,38,0.12)",
              }}
            />
          </>
        )}

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
            scoreFill={scoreFill}
            layout={layout}
            size={size}
            dieSeed={effectDieSeed}
            frozen={icePowerActive}
          />
        )}

        {/* Sprite sheet texture or pip grid — skip when a video skin is active */}
        {showSpriteLayer ?
        (() => {
          const faceSpriteUrl = displaySpriteLayer.spriteUrl;
          const spriteSkin = {
            ...skin,
            spriteUrl: faceSpriteUrl,
            spriteCrop: displaySpriteLayer?.spriteCrop ?? skin.spriteCrop,
          };
          const faceOffset = getSkinFaceOffset(skin, value, spriteOffsetMode);
          const nudgeSkinId = displaySpriteLayer.offsetSkinId ?? skin.id;
          const { xNudge, yNudge } = resolveFaceSpriteNudges(nudgeSkinId, value, size, faceOffset);
          const sheetStyle = getSpriteSheetStyle(spriteSkin, value, size, { xNudge, yNudge });
          const spriteZ = "z-[1]";
          return (
            <div
              className={`absolute inset-0 pointer-events-none ${spriteZ}`}
              style={{
                backgroundImage: `url(${assetUrl(faceSpriteUrl)})`,
                backgroundColor: "transparent",
                ...sheetStyle,
              }}
            />
          );
        })() :

        !isBlueGelTank &&
          (skin.experimental || showPipFallback) &&
          !(isGhostSkin && rolling && !held && !used) &&
          renderPipGrid()}

        {/* Matrix — animated code rain in power mode only (hidden when power video plays) */}
        {skin.id === "matrix" && powerMode && !reducePowerPresentation && !activeVideoUrl && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: `inset 0 0 ${Math.round(size * 0.22)}px rgba(34,197,94,0.55), 0 0 ${Math.round(size * 0.18)}px rgba(34,197,94,0.65)`,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-95"
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
              background:
              "conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.9) 0deg, rgba(186,230,253,0.2) 60deg, rgba(255,255,255,0.8) 120deg, rgba(125,211,252,0.3) 180deg, rgba(255,255,255,0.9) 240deg, rgba(186,230,253,0.2) 300deg, rgba(255,255,255,0.9) 360deg)"
            }} />
          
            <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(186,230,253,0.7) 0%, transparent 35%)"
            }} />
          
          </>
        }

        </div>

        {/* Ice overlay OUTSIDE squircle clip — drips / edge frost can overhang the die. */}
        {iceOverlayActive && (
          <IcePowerOverlay
            value={value}
            size={size}
            radius={radius}
            allowOverflow
            skinId={effectiveSkinId}
            forceEnabled={icePowerActive}
            levelFrost={levelFrostActive ? skinLevelForRender : null}
          />
        )}

        {valueHidden && !spectralHidden && (
          <div
            className="absolute inset-0 z-[25] flex items-center justify-center pointer-events-none"
            style={{
              backdropFilter: "blur(6px)",
              background: "rgba(8,12,24,0.72)",
              borderRadius: radius,
            }}
            aria-hidden
          >
            <span className="text-lg font-black text-slate-500">?</span>
          </div>
        )}
        {spectralHidden && (
          <div
            className="absolute inset-0 z-[25] pointer-events-none"
            style={{
              borderRadius: radius,
              background:
                "radial-gradient(circle at 40% 35%, rgba(165,243,252,0.12), transparent 62%)",
              boxShadow: "inset 0 0 18px rgba(165,243,252,0.08)",
            }}
            aria-hidden
          />
        )}
        {matrixGlitchFx && (
          <div
            className="absolute inset-0 z-[35] pointer-events-none overflow-hidden"
            style={{ borderRadius: radius }}
            aria-hidden
          >
            <motion.div
              className="absolute inset-0 mix-blend-screen"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0.85, 0.4, 0],
                x: [0, 3, -4, 2, 0],
                filter: [
                  "hue-rotate(0deg) brightness(1)",
                  "hue-rotate(90deg) brightness(1.8)",
                  "hue-rotate(-60deg) brightness(2)",
                  "hue-rotate(40deg) brightness(1.4)",
                  "hue-rotate(0deg) brightness(1)",
                ],
              }}
              transition={{ duration: 0.8, ease: "linear", times: [0, 0.15, 0.35, 0.6, 1] }}
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,255,255,0.55), rgba(255,0,234,0.45), rgba(34,197,94,0.5))",
                boxShadow: "inset 0 0 12px rgba(0,255,255,0.6)",
              }}
            />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0.5, 0], x: [0, -5, 4, 0] }}
              transition={{ duration: 0.8, ease: "linear", times: [0, 0.2, 0.5, 1] }}
              style={{
                background: "rgba(255,0,102,0.35)",
                mixBlendMode: "screen",
                clipPath: "inset(15% 0 55% 0)",
              }}
            />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0.45, 0], x: [0, 4, -3, 0] }}
              transition={{ duration: 0.8, ease: "linear", times: [0, 0.25, 0.55, 1] }}
              style={{
                background: "rgba(0,255,255,0.35)",
                mixBlendMode: "screen",
                clipPath: "inset(50% 0 10% 0)",
              }}
            />
          </div>
        )}
      </button>
      </PortfolioDieProvider>
    </motion.div>);

}

function diePropsAreEqual(prev, next) {
  if (prev.devSkin !== next.devSkin) return false;
  if (prev.snowGlobeShellSettings !== next.snowGlobeShellSettings) return false;
  if (prev.powerMode !== next.powerMode) return false;
  if (prev.powerModeSubtle !== next.powerModeSubtle) return false;
  if (prev.allowXrayMorph !== next.allowXrayMorph) return false;
  if (prev.fishFeastMode !== next.fishFeastMode) return false;
  if (prev.valueHidden !== next.valueHidden) return false;
  if (prev.spectralHidden !== next.spectralHidden) return false;
  if (prev.iceFrozenOverlay !== next.iceFrozenOverlay) return false;
  if (prev.labForceFreezeOverlay !== next.labForceFreezeOverlay) return false;
  if (prev.matrixGlitchFx !== next.matrixGlitchFx) return false;
  if (prev.skinLevel !== next.skinLevel) return false;
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
    prev.bigFishStaticPose === next.bigFishStaticPose &&
    prev.includeJellyfish === next.includeJellyfish &&
    prev.heldStyleId === next.heldStyleId &&
    prev.dieId === next.dieId &&
    prev.dieSeed === next.dieSeed &&
    prev.lowPower === next.lowPower &&
    prev.sharkBiteFx === next.sharkBiteFx &&
    prev.fishFeastMode === next.fishFeastMode &&
    prev.bloodWaterLocked === next.bloodWaterLocked &&
    prev.onBloodWaterSettled === next.onBloodWaterSettled &&
    prev.onToggleDie === next.onToggleDie &&
    prev.onClick === next.onClick
  );
}

export default React.memo(Die, diePropsAreEqual);