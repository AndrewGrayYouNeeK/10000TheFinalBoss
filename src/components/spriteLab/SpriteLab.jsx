import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getFelt, getSkin, skinHasPowerSprite, DICE_SKINS } from "@/lib/shopCatalog";
import { getSkinPowerMeta } from "@/lib/skinPowers";
import {
  getStoryBossesForSkin,
  isStoryLadderBoss,
} from "@/lib/storyBosses";
import { getBlueGelTrayFishProps } from "@/lib/fishDice";
import {
  DEFAULT_SNOW_GLOBE_SETTINGS,
  getSnowGlobeShellFace,
  loadSnowGlobeSettings,
  resetSnowGlobeSettings,
  saveSnowGlobeSettings,
} from "@/lib/snowGlobeSettings";
import { isFreezeOverlayImmuneSkin } from "@/lib/icePowerSettings";
import SpriteLabFreezeOverlayTools from "@/components/spriteLab/SpriteLabFreezeOverlayTools";
import {
  buildCatalogSnippet,
  buildLabPreviewSkin,
  clearSpriteLabDraft,
  DEFAULT_SPRITE_CROP,
  emptyFaceMap,
  FACES,
  isSpriteTuningLocked,
  readSpriteLabPersistedState,
  persistTuningLockFlag,
  persistSpriteLabTuning,
  saveLockedTuningSnapshot,
  tuningFileName,
  getSpriteLabSkins,
} from "@/lib/spriteLab";
import {
  recoverLockedVideoSnapshots,
  recoverMatrixVideosOnStartup,
  recoverAllVideoSettings,
  saveLockedVideoSnapshots,
} from "@/lib/spriteLabLockedVideos";
import {
  clearMatrixPowerVideo,
  getCachedMatrixPowerVideoObjectUrl,
  getMatrixPowerVideoObjectUrl,
  hasMatrixPowerVideo,
  saveMatrixPowerVideo,
  subscribeMatrixPowerVideo,
} from "@/lib/matrixPowerVideo";
import {
  clearDiamondCutPowerVideo,
  getCachedDiamondCutPowerVideoObjectUrl,
  getDiamondCutPowerVideoObjectUrl,
  hasDiamondCutPowerVideo,
  saveDiamondCutPowerVideo,
  subscribeDiamondCutPowerVideo,
} from "@/lib/diamondCutPowerVideo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock, Play, Save, Unlock } from "lucide-react";
import { loadProfile } from "@/lib/localProfile";
import { getLocalSkinPowerLevel, LOCAL_SKIN_MAX_LEVEL } from "@/lib/progression";
import { getSkinLevelVisual } from "@/lib/skinLevelVisuals";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import VideoPreviewDialog from "@/components/video/VideoPreviewDialog";
import { VIDEO_KEYS, VIDEO_LABELS, VIDEO_DESCRIPTIONS } from "@/lib/localVideoStore";
import {
  getStoryBossVideoDescription,
  getStoryBossVideoLabel,
  storyBossAvatarKey,
  storyBossIntroKey,
  storyBossWinKey,
} from "@/lib/storyBossVideos";
import {
  isMatrixTuningLocked,
  lockMatrixTuning,
  unlockMatrixTuning,
} from "@/lib/matrixTuningLock";
import {
  isDiamondCutTuningLocked,
  lockDiamondCutTuning,
  unlockDiamondCutTuning,
} from "@/lib/diamondCutTuningLock";
import {
  isSnowGlobeTuningLocked,
  lockSnowGlobeTuning,
  unlockSnowGlobeTuning,
} from "@/lib/snowGlobeTuningLock";
import {
  isBlueGelTuningLocked,
  lockBlueGelTuning,
  unlockBlueGelTuning,
} from "@/lib/blueGelTuningLock";
import {
  isIceTuningLocked,
  lockIceTuning,
  unlockIceTuning,
} from "@/lib/iceTuningLock";
import {
  isRagnarokTuningLocked,
  lockRagnarokTuning,
  unlockRagnarokTuning,
} from "@/lib/ragnarokTuningLock";
import {
  isGalaxyTuningLocked,
  lockGalaxyTuning,
  unlockGalaxyTuning,
} from "@/lib/galaxyTuningLock";
import {
  isFluoriteTuningLocked,
  lockFluoriteTuning,
  unlockFluoriteTuning,
} from "@/lib/fluoriteTuningLock";
import {
  isAmberWaspTuningLocked,
  lockAmberWaspTuning,
  unlockAmberWaspTuning,
} from "@/lib/amberWaspTuningLock";
import {
  isAmethystTuningLocked,
  lockAmethystTuning,
  unlockAmethystTuning,
} from "@/lib/amethystTuningLock";
import {
  isPaperTuningLocked,
  lockPaperTuning,
  unlockPaperTuning,
} from "@/lib/paperTuningLock";
import {
  isClassicWhiteTuningLocked,
  lockClassicWhiteTuning,
  unlockClassicWhiteTuning,
} from "@/lib/classicWhiteTuningLock";
import {
  isDragonScaleTuningLocked,
  lockDragonScaleTuning,
  unlockDragonScaleTuning,
} from "@/lib/dragonScaleTuningLock";
import {
  isTealCrackleTuningLocked,
  lockTealCrackleTuning,
  unlockTealCrackleTuning,
} from "@/lib/tealCrackleTuningLock";
import {
  isAquamarineLightTuningLocked,
  lockAquamarineLightTuning,
  unlockAquamarineLightTuning,
} from "@/lib/aquamarineLightTuningLock";
import {
  isAquamarineTuningLocked,
  lockAquamarineTuning,
  unlockAquamarineTuning,
} from "@/lib/aquamarineTuningLock";
import {
  isWoodTuningLocked,
  lockWoodTuning,
  unlockWoodTuning,
} from "@/lib/woodTuningLock";
import {
  isSilverTuningLocked,
  lockSilverTuning,
  unlockSilverTuning,
} from "@/lib/silverTuningLock";
import {
  isCircuitBoardTuningLocked,
  lockCircuitBoardTuning,
  unlockCircuitBoardTuning,
} from "@/lib/circuitBoardTuningLock";
import {
  isCyberNeonTuningLocked,
  lockCyberNeonTuning,
  unlockCyberNeonTuning,
} from "@/lib/cyberNeonTuningLock";
import {
  isObsidianTuningLocked,
  lockObsidianTuning,
  unlockObsidianTuning,
} from "@/lib/obsidianTuningLock";
import {
  isLabradoriteTuningLocked,
  lockLabradoriteTuning,
  unlockLabradoriteTuning,
} from "@/lib/labradoriteTuningLock";
import {
  isLabradoritePolishedTuningLocked,
  lockLabradoritePolishedTuning,
  unlockLabradoritePolishedTuning,
} from "@/lib/labradoritePolishedTuningLock";
import {
  isLoveIsLoveTuningLocked,
  lockLoveIsLoveTuning,
  unlockLoveIsLoveTuning,
} from "@/lib/loveIsLoveTuningLock";
import {
  isGoldTuningLocked,
  lockGoldTuning,
  unlockGoldTuning,
} from "@/lib/goldTuningLock";
import {
  isMoonstoneTuningLocked,
  lockMoonstoneTuning,
  unlockMoonstoneTuning,
} from "@/lib/moonstoneTuningLock";
import {
  isNeonGridTuningLocked,
  lockNeonGridTuning,
  unlockNeonGridTuning,
} from "@/lib/neonGridTuningLock";
import {
  isPlasmaTuningLocked,
  lockPlasmaTuning,
  unlockPlasmaTuning,
} from "@/lib/plasmaTuningLock";
import {
  isPrideTuningLocked,
  lockPrideTuning,
  unlockPrideTuning,
} from "@/lib/prideTuningLock";
import {
  isToxicPlasmaV2TuningLocked,
  lockToxicPlasmaV2Tuning,
  unlockToxicPlasmaV2Tuning,
} from "@/lib/toxicPlasmaV2TuningLock";
import {
  isRubyTuningLocked,
  lockRubyTuning,
  unlockRubyTuning,
} from "@/lib/rubyTuningLock";
import {
  isDiamondRubyTuningLocked,
  lockDiamondRubyTuning,
  unlockDiamondRubyTuning,
} from "@/lib/diamondRubyTuningLock";

const TUNING_LOCK_SKINS = {
  matrix: {
    isLocked: isMatrixTuningLocked,
    lock: lockMatrixTuning,
    unlock: unlockMatrixTuning,
    tuningFile: "matrixSpriteTuning.js",
    accent: "green",
  },
  crystal_cut: {
    isLocked: isDiamondCutTuningLocked,
    lock: lockDiamondCutTuning,
    unlock: unlockDiamondCutTuning,
    tuningFile: "crystalCutSpriteTuning.js",
    accent: "cyan",
  },
  ragnarok: {
    isLocked: isRagnarokTuningLocked,
    lock: lockRagnarokTuning,
    unlock: unlockRagnarokTuning,
    tuningFile: "ragnarokSpriteTuning.js",
    accent: "orange",
  },
  ice: {
    isLocked: isIceTuningLocked,
    lock: lockIceTuning,
    unlock: unlockIceTuning,
    tuningFile: "iceSpriteTuning.js",
    accent: "sky",
  },
  snow_globe: {
    isLocked: isSnowGlobeTuningLocked,
    lock: lockSnowGlobeTuning,
    unlock: unlockSnowGlobeTuning,
    tuningFile: "snowGlobeSpriteTuning.js",
    accent: "sky",
    noSpriteTuning: true,
  },
  blue_gel: {
    isLocked: isBlueGelTuningLocked,
    lock: lockBlueGelTuning,
    unlock: unlockBlueGelTuning,
    tuningFile: "blueGelSpriteTuning.js",
    accent: "cyan",
  },
  galaxy: {
    isLocked: isGalaxyTuningLocked,
    lock: lockGalaxyTuning,
    unlock: unlockGalaxyTuning,
    tuningFile: "galaxySpriteTuning.js",
    accent: "purple",
  },
  fluorite: {
    isLocked: isFluoriteTuningLocked,
    lock: lockFluoriteTuning,
    unlock: unlockFluoriteTuning,
    tuningFile: "fluoriteSpriteTuning.js",
    accent: "purple",
  },
  amber_wasp: {
    isLocked: isAmberWaspTuningLocked,
    lock: lockAmberWaspTuning,
    unlock: unlockAmberWaspTuning,
    tuningFile: "amberWaspSpriteTuning.js",
    accent: "amber",
  },
  amethyst: {
    isLocked: isAmethystTuningLocked,
    lock: lockAmethystTuning,
    unlock: unlockAmethystTuning,
    tuningFile: "amethystSpriteTuning.js",
    accent: "purple",
  },
  paper: {
    isLocked: isPaperTuningLocked,
    lock: lockPaperTuning,
    unlock: unlockPaperTuning,
    tuningFile: "paperSpriteTuning.js",
    accent: "stone",
  },
  classic_white: {
    isLocked: isClassicWhiteTuningLocked,
    lock: lockClassicWhiteTuning,
    unlock: unlockClassicWhiteTuning,
    tuningFile: "classicWhiteSpriteTuning.js",
    accent: "stone",
  },
  dragon_scale: {
    isLocked: isDragonScaleTuningLocked,
    lock: lockDragonScaleTuning,
    unlock: unlockDragonScaleTuning,
    tuningFile: "dragonScaleSpriteTuning.js",
    accent: "emerald",
  },
  teal_crackle: {
    isLocked: isTealCrackleTuningLocked,
    lock: lockTealCrackleTuning,
    unlock: unlockTealCrackleTuning,
    tuningFile: "tealCrackleSpriteTuning.js",
    accent: "sky",
  },
  aquamarine_light: {
    isLocked: isAquamarineLightTuningLocked,
    lock: lockAquamarineLightTuning,
    unlock: unlockAquamarineLightTuning,
    tuningFile: "aquamarineLightSpriteTuning.js",
    accent: "sky",
  },
  aquamarine: {
    isLocked: isAquamarineTuningLocked,
    lock: lockAquamarineTuning,
    unlock: unlockAquamarineTuning,
    tuningFile: "aquamarineSpriteTuning.js",
    accent: "sky",
  },
  wood: {
    isLocked: isWoodTuningLocked,
    lock: lockWoodTuning,
    unlock: unlockWoodTuning,
    tuningFile: "woodSpriteTuning.js",
    accent: "amber",
  },
  silver: {
    isLocked: isSilverTuningLocked,
    lock: lockSilverTuning,
    unlock: unlockSilverTuning,
    tuningFile: "silverSpriteTuning.js",
    accent: "stone",
  },
  circuit_board: {
    isLocked: isCircuitBoardTuningLocked,
    lock: lockCircuitBoardTuning,
    unlock: unlockCircuitBoardTuning,
    tuningFile: "circuitBoardSpriteTuning.js",
    accent: "green",
  },
  cyber_neon: {
    isLocked: isCyberNeonTuningLocked,
    lock: lockCyberNeonTuning,
    unlock: unlockCyberNeonTuning,
    tuningFile: "cyberNeonSpriteTuning.js",
    accent: "purple",
  },
  obsidian: {
    isLocked: isObsidianTuningLocked,
    lock: lockObsidianTuning,
    unlock: unlockObsidianTuning,
    tuningFile: "obsidianSpriteTuning.js",
    accent: "stone",
  },
  labradorite: {
    isLocked: isLabradoriteTuningLocked,
    lock: lockLabradoriteTuning,
    unlock: unlockLabradoriteTuning,
    tuningFile: "labradoriteSpriteTuning.js",
    accent: "purple",
  },
  labradorite_polished: {
    isLocked: isLabradoritePolishedTuningLocked,
    lock: lockLabradoritePolishedTuning,
    unlock: unlockLabradoritePolishedTuning,
    tuningFile: "labradoritePolishedSpriteTuning.js",
    accent: "purple",
  },
  love_is_love: {
    isLocked: isLoveIsLoveTuningLocked,
    lock: lockLoveIsLoveTuning,
    unlock: unlockLoveIsLoveTuning,
    tuningFile: "loveIsLoveSpriteTuning.js",
    accent: "purple",
  },
  gold: {
    isLocked: isGoldTuningLocked,
    lock: lockGoldTuning,
    unlock: unlockGoldTuning,
    tuningFile: "goldSpriteTuning.js",
    accent: "amber",
  },
  moonstone: {
    isLocked: isMoonstoneTuningLocked,
    lock: lockMoonstoneTuning,
    unlock: unlockMoonstoneTuning,
    tuningFile: "moonstoneSpriteTuning.js",
    accent: "sky",
  },
  neon_grid: {
    isLocked: isNeonGridTuningLocked,
    lock: lockNeonGridTuning,
    unlock: unlockNeonGridTuning,
    tuningFile: "neonGridSpriteTuning.js",
    accent: "purple",
  },
  plasma: {
    isLocked: isPlasmaTuningLocked,
    lock: lockPlasmaTuning,
    unlock: unlockPlasmaTuning,
    tuningFile: "plasmaSpriteTuning.js",
    accent: "purple",
  },
  pride: {
    isLocked: isPrideTuningLocked,
    lock: lockPrideTuning,
    unlock: unlockPrideTuning,
    tuningFile: "prideSpriteTuning.js",
    accent: "purple",
  },
  toxic_plasma_v2: {
    isLocked: isToxicPlasmaV2TuningLocked,
    lock: lockToxicPlasmaV2Tuning,
    unlock: unlockToxicPlasmaV2Tuning,
    tuningFile: "toxicPlasmaV2SpriteTuning.js",
    accent: "green",
  },
  ruby: {
    isLocked: isRubyTuningLocked,
    lock: lockRubyTuning,
    unlock: unlockRubyTuning,
    tuningFile: "rubySpriteTuning.js",
    accent: "amber",
  },
  diamond_ruby: {
    isLocked: isDiamondRubyTuningLocked,
    lock: lockDiamondRubyTuning,
    unlock: unlockDiamondRubyTuning,
    tuningFile: "diamondRubySpriteTuning.js",
    accent: "amber",
  },
};

const POWER_VIDEO_SKIN_CONFIG = {
  matrix: {
    getCached: getCachedMatrixPowerVideoObjectUrl,
    has: hasMatrixPowerVideo,
    save: saveMatrixPowerVideo,
    getUrl: getMatrixPowerVideoObjectUrl,
    clear: clearMatrixPowerVideo,
    subscribe: subscribeMatrixPowerVideo,
    videoKey: VIDEO_KEYS.MATRIX_POWER,
    uploadLabel: "Upload Matrix power video",
    accent: "green",
  },
  crystal_cut: {
    getCached: getCachedDiamondCutPowerVideoObjectUrl,
    has: hasDiamondCutPowerVideo,
    save: saveDiamondCutPowerVideo,
    getUrl: getDiamondCutPowerVideoObjectUrl,
    clear: clearDiamondCutPowerVideo,
    subscribe: subscribeDiamondCutPowerVideo,
    videoKey: VIDEO_KEYS.DIAMOND_CUT_POWER,
    uploadLabel: "Upload Diamond Cut power video",
    accent: "cyan",
  },
};

const GQ_BOSS_ID = "gq";
const NEO_BOSS_ID = "neo";
/** Frosty the Evil Snowman — story ladder / video key id (not dormant ice_witch). */
const FROSTY_BOSS_ID = "snowman";
const DRAGON_KNIGHT_BOSS_ID = "dragon_knight";

function skinUsesTuningLock(skinId) {
  return skinId in TUNING_LOCK_SKINS;
}

function CropSliders({ label, crop, onChange, accent = "amber", disabled = false }) {
  const set = (key, val) => onChange({ ...crop, [key]: val });
  const accentClass = accent === "green" ? "accent-green-400" : "accent-amber-400";
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-200">{label}</p>
      {[
        { key: "zoom", min: 0.7, max: 3.0, step: 0.005, label: "Zoom" },
        { key: "offsetY", min: -0.1, max: 0.15, step: 0.005, label: "Offset Y" },
        { key: "offsetX", min: -0.2, max: 0.2, step: 0.005, label: "Offset X" },
        { key: "stretch", min: -0.3, max: 0.6, step: 0.005, label: "Stretch (taller +)" },
      ].map(({ key, min, max, step, label: sliderLabel }) => (
        <label key={key} className="block text-[10px] text-slate-400">
          {sliderLabel}: <span className="text-white tabular-nums">{crop[key]?.toFixed(3)}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={crop[key] ?? 0}
            disabled={disabled}
            onChange={(e) => set(key, Number(e.target.value))}
            onInput={(e) => set(key, Number(e.target.value))}
            className={`w-full ${accentClass} mt-1 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          />
        </label>
      ))}
    </div>
  );
}

function FaceNudgePanel({ face, nudge, onChange, onResetFace, onResetAll, modeLabel, disabled = false }) {
  const set = (key, val) => onChange({ ...nudge, [key]: val });
  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
          Face {face}{modeLabel ? ` — ${modeLabel}` : ""}
        </p>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={onResetFace} disabled={disabled}>
            Reset face
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={onResetAll} disabled={disabled}>
            Reset all
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-slate-500">Per-die nudge in ref pixels (@ 64px die size).</p>
      {[
        { key: "x", min: -12, max: 12, step: 0.5, label: "Nudge X" },
        { key: "y", min: -12, max: 12, step: 0.5, label: "Nudge Y" },
      ].map(({ key, min, max, step, label: sliderLabel }) => (
        <label key={key} className="block text-[10px] text-slate-400">
          {sliderLabel}: <span className="text-white tabular-nums">{nudge[key]?.toFixed(1)}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={nudge[key] ?? 0}
            disabled={disabled}
            onChange={(e) => set(key, Number(e.target.value))}
            onInput={(e) => set(key, Number(e.target.value))}
            className={`w-full accent-cyan-400 mt-1 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          />
        </label>
      ))}
    </div>
  );
}

const SPRITE_LAB_PREVIEW_FELT_ID = "classic_green";

function defaultPowerVideoZoom(skinId, skin) {
  if (skin?.powerVideoZoom != null) return skin.powerVideoZoom;
  if (skinId === "matrix" || skinId === "crystal_cut") return 1.41;
  return 3;
}

export default function SpriteLab({ skinId }) {
  const navigate = useNavigate();
  const spriteLabSkins = useMemo(() => getSpriteLabSkins(), []);
  const felt = getFelt(SPRITE_LAB_PREVIEW_FELT_ID);
  const catalogSkin = getSkin(skinId);
  const profile = useMemo(() => loadProfile(), []);
  const skinPowerMeta = useMemo(() => getSkinPowerMeta(skinId), [skinId]);
  const storyBossesForSkin = useMemo(() => getStoryBossesForSkin(skinId), [skinId]);
  const currentSkinLevel = getLocalSkinPowerLevel(skinId, profile);
  const skinLevelVisual = getSkinLevelVisual(skinId);
  const hasSpriteSheet = !!catalogSkin.spriteUrl;
  const hasPowerSheet = skinHasPowerSprite(catalogSkin);
  const hasPowerVideo = !!catalogSkin.powerVideoUrl;
  const hasPowerSprite = !!catalogSkin.powerSpriteUrl;
  const powerUsesVideo = hasPowerVideo && !hasPowerSprite;
  const hasPowerEffect = !!catalogSkin.powerDice && !hasPowerSheet;
  const hasPowerPreview = hasPowerSheet || hasPowerEffect || powerUsesVideo;
  const lockConfig = TUNING_LOCK_SKINS[skinId];
  const powerVideoConfig = POWER_VIDEO_SKIN_CONFIG[skinId];
  const supportsPowerVideoUpload = !!powerVideoConfig;
  const [tuningUnlocked, setTuningUnlocked] = useState(
    () => !lockConfig || !lockConfig.isLocked()
  );
  const tuningLocked = !!lockConfig && !tuningUnlocked;
  const catalogBase = useMemo(
    () => DICE_SKINS.find((s) => s.id === skinId) ?? DICE_SKINS[0],
    [skinId]
  );

  const [regularCrop, setRegularCrop] = useState(
    () => readSpriteLabPersistedState(skinId).regularCrop
  );
  const [powerCrop, setPowerCrop] = useState(
    () => readSpriteLabPersistedState(skinId).powerCrop
  );
  const [regularFaces, setRegularFaces] = useState(
    () => readSpriteLabPersistedState(skinId).regularFaces
  );
  const [powerFaces, setPowerFaces] = useState(
    () => readSpriteLabPersistedState(skinId).powerFaces
  );
  const [powerMode, setPowerMode] = useState(false);
  const [previewSkinLevel, setPreviewSkinLevel] = useState(currentSkinLevel);
  /** Frozen Ice — Score Freeze cube overlay preview + tools (same saves as Ice Lab). */
  const [freezeOverlayPreview, setFreezeOverlayPreview] = useState(false);
  // Lab always allows freeze preview (incl. fire skins) so you can tune cubes here.
  // In-game Die still blocks immune skins unless labForceFreezeOverlay is set.
  const iceFreezeOn = freezeOverlayPreview;
  const freezeImmuneInGame = isFreezeOverlayImmuneSkin(skinId);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [levelPreviewOpen, setLevelPreviewOpen] = useState(false);
  const [snowGlobeShell, setSnowGlobeShell] = useState(() =>
    skinId === "snow_globe" ? loadSnowGlobeSettings() : null
  );

  useEffect(() => {
    const persisted = readSpriteLabPersistedState(skinId);
    setRegularCrop(persisted.regularCrop);
    setPowerCrop(persisted.powerCrop);
    setRegularFaces(persisted.regularFaces);
    setPowerFaces(persisted.powerFaces);
    setPowerVideoZoom(persisted.powerVideoZoom);
    setPowerVideoCrop(persisted.powerVideoCrop);
    setPreviewSkinLevel(getLocalSkinPowerLevel(skinId, profile));
    if (skinId === "snow_globe") setSnowGlobeShell(loadSnowGlobeSettings());
    setFreezeOverlayPreview(false);
  }, [skinId, profile]);
  const [selectedFace, setSelectedFace] = useState(1);
  const [size, setSize] = useState(100);
  const [powerVideoLoaded, setPowerVideoLoaded] = useState(false);
  const [powerVideoPreviewUrl, setPowerVideoPreviewUrl] = useState(
    () => powerVideoConfig?.getCached() ?? null
  );
  const powerVideoInputRef = useRef(null);
  const [powerVideoUploading, setPowerVideoUploading] = useState(false);
  const [powerVideoPreviewOpen, setPowerVideoPreviewOpen] = useState(false);
  const [pendingPowerFile, setPendingPowerFile] = useState(null);
  const [pendingPowerPreviewUrl, setPendingPowerPreviewUrl] = useState(null);
  const [powerVideoZoom, setPowerVideoZoom] = useState(
    () => readSpriteLabPersistedState(skinId).powerVideoZoom
  );
  const [powerVideoCrop, setPowerVideoCrop] = useState(
    () => readSpriteLabPersistedState(skinId).powerVideoCrop
  );
  const usesPowerFaceNudges = hasPowerSprite || powerUsesVideo;
  const activeFaces = powerMode && usesPowerFaceNudges ? powerFaces : regularFaces;
  const setActiveFaces = powerMode && usesPowerFaceNudges ? setPowerFaces : setRegularFaces;
  const activeNudge =
    skinId === "snow_globe"
      ? getSnowGlobeShellFace(snowGlobeShell, selectedFace)
      : activeFaces[selectedFace] ?? { x: 0, y: 0 };

  const patchSnowGlobeShell = (partial) => {
    const next = saveSnowGlobeSettings({ ...snowGlobeShell, ...partial });
    setSnowGlobeShell(next);
  };

  const patchSnowGlobeFace = (face, patch) => {
    const nextFaces = {
      ...(snowGlobeShell?.shellFaces ?? DEFAULT_SNOW_GLOBE_SETTINGS.shellFaces),
      [face]: { ...getSnowGlobeShellFace(snowGlobeShell, face), ...patch },
    };
    patchSnowGlobeShell({ shellFaces: nextFaces });
  };

  const tunedSkin = useMemo(
    () =>
      buildLabPreviewSkin(
        skinId,
        {
          regularCrop,
          powerCrop,
          regularFaces,
          powerFaces,
          powerVideoZoom,
          powerVideoCrop,
        },
        { locked: isSpriteTuningLocked(skinId) }
      ),
    [
      skinId,
      regularCrop,
      powerCrop,
      regularFaces,
      powerFaces,
      powerVideoZoom,
      powerVideoCrop,
      tuningLocked,
    ]
  );

  const catalogSnippet = JSON.stringify(
    {
      ...(catalogSkin.spriteSheetSize ? { spriteSheetSize: catalogSkin.spriteSheetSize } : {}),
      ...buildCatalogSnippet({
        hasPowerSheet: hasPowerSprite,
        hasPowerVideo: powerUsesVideo,
        powerVideoUrl: catalogSkin.powerVideoUrl,
        regularCrop,
        powerCrop,
        regularFaces,
        powerFaces,
        powerVideoZoom,
        powerVideoCrop,
      }),
    },
    null,
    2
  );

  const resetAllTuning = () => {
    if (tuningLocked) return;
    clearSpriteLabDraft(skinId);
    setRegularCrop(catalogBase.spriteCrop ?? DEFAULT_SPRITE_CROP);
    setPowerCrop(catalogBase.powerSpriteCrop ?? DEFAULT_SPRITE_CROP);
    setRegularFaces(emptyFaceMap(catalogBase.spriteFaceOffsets?.regular));
    setPowerFaces(emptyFaceMap(catalogBase.spriteFaceOffsets?.power));
    setPowerVideoZoom(defaultPowerVideoZoom(skinId, catalogBase));
    setPowerVideoCrop(catalogBase.powerVideoCrop ?? { offsetX: 0, offsetY: 0 });
    toast.success("All tuning reset to defaults");
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(catalogSnippet);
      toast.success(`Copied — paste into ${tuningFileName(skinId)}`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const updateFaceNudge = (patch) => {
    if (tuningLocked) return;
    setActiveFaces((prev) => ({
      ...prev,
      [selectedFace]: { ...prev[selectedFace], ...patch },
    }));
  };

  const resetFace = () => {
    if (tuningLocked) return;
    setActiveFaces((prev) => ({
      ...prev,
      [selectedFace]: { x: 0, y: 0 },
    }));
  };

  const resetAllFaces = () => {
    if (tuningLocked) return;
    setActiveFaces(
      emptyFaceMap(
        powerMode && usesPowerFaceNudges
          ? catalogBase.spriteFaceOffsets?.power
          : catalogBase.spriteFaceOffsets?.regular
      )
    );
  };

  useEffect(() => {
    if (!lockConfig) return;
    setTuningUnlocked(!lockConfig.isLocked());
  }, [skinId, lockConfig]);

  const resetTuningFromCatalog = () => {
    const lockedSkin = getSkin(skinId);
    setRegularCrop(lockedSkin.spriteCrop ?? DEFAULT_SPRITE_CROP);
    setPowerCrop(lockedSkin.powerSpriteCrop ?? DEFAULT_SPRITE_CROP);
    setRegularFaces(emptyFaceMap(lockedSkin.spriteFaceOffsets?.regular));
    setPowerFaces(emptyFaceMap(lockedSkin.spriteFaceOffsets?.power));
    setPowerVideoZoom(lockedSkin.powerVideoZoom ?? 1);
    setPowerVideoCrop(lockedSkin.powerVideoCrop ?? { offsetX: 0, offsetY: 0 });
  };

  const buildTuningPayload = (lockedVideos) => ({
    regularCrop,
    powerCrop,
    regularFaces,
    powerFaces,
    powerVideoZoom,
    powerVideoCrop,
    ...(lockedVideos ? { lockedVideos } : {}),
    ...(skinId === "snow_globe" && snowGlobeShell ? { shellSettings: snowGlobeShell } : {}),
    spriteUrl: catalogSkin.spriteUrl,
    powerSpriteUrl: catalogSkin.powerSpriteUrl,
    powerVideoUrl: catalogSkin.powerVideoUrl,
    videoUrl: catalogSkin.videoUrl,
  });

  const handleSaveTuning = () => {
    if (tuningLocked) return;
    persistSpriteLabTuning(skinId, buildTuningPayload(), { locked: false });
    toast.success(`${catalogSkin.name} saved on this device`);
  };

  const handleLockTuning = async () => {
    if (!lockConfig) return;
    let lockedVideos;
    try {
      lockedVideos = await saveLockedVideoSnapshots(skinId);
    } catch {
      lockedVideos = undefined;
      toast.message("Sprite tuning saved — video backup skipped", {
        description: "Uploads still auto-save; tap Restore uploads if needed.",
      });
    }
    const payload = buildTuningPayload(lockedVideos);
    saveLockedTuningSnapshot(skinId, payload);
    lockConfig.lock();
    persistTuningLockFlag(skinId, true);
    setTuningUnlocked(false);
    toast.success(`${catalogSkin.name} locked — saved on this device (survives restart).`);
  };

  const handleUnlockTuning = () => {
    if (!lockConfig) return;
    lockConfig.unlock();
    persistTuningLockFlag(skinId, false);
    setTuningUnlocked(true);
    toast.success(`${catalogSkin.name} unlocked — sliders and uploads are live`);
  };

  const handleRestoreUploads = async () => {
    try {
      const restored = await recoverAllVideoSettings({ force: true });
      if (restored > 0) {
        toast.success(
          `Restored ${restored} saved video${restored === 1 ? "" : "s"} on this device`
        );
      } else {
        toast.message("All uploads already present", {
          description: "Videos auto-save when you upload. Use Save all on Video Assets to refresh backups.",
        });
      }
    } catch {
      toast.error("Could not restore uploads");
    }
  };

  useEffect(() => {
    if (skinId !== "matrix" || !tuningLocked) return;
    const locked = getSkin(skinId);
    setRegularCrop(locked.spriteCrop ?? DEFAULT_SPRITE_CROP);
    setRegularFaces(emptyFaceMap(locked.spriteFaceOffsets?.regular));
    setPowerFaces(emptyFaceMap(locked.spriteFaceOffsets?.power));
    setPowerVideoZoom(locked.powerVideoZoom ?? 1.41);
    setPowerVideoCrop(locked.powerVideoCrop ?? { offsetX: 0, offsetY: 0 });
    recoverMatrixVideosOnStartup()
      .then(() => powerVideoConfig?.getUrl())
      .then((url) => {
        if (!powerVideoConfig) return;
        setPowerVideoLoaded(!!url);
        setPowerVideoPreviewUrl(powerVideoConfig.getCached());
      })
      .catch(() => {});
  }, [skinId, tuningLocked, powerVideoConfig]);

  useEffect(() => {
    recoverLockedVideoSnapshots(skinId)
      .then((restored) => {
        if (restored > 0) {
          toast.success(
            `Restored ${restored} saved video${restored === 1 ? "" : "s"} for ${catalogSkin.name}`
          );
        }
      })
      .catch(() => {});
  }, [skinId, catalogSkin.name]);

  useEffect(() => {
    if (tuningLocked) return;
    persistSpriteLabTuning(skinId, buildTuningPayload(), { locked: false });
  }, [skinId, regularCrop, powerCrop, regularFaces, powerFaces, powerVideoZoom, powerVideoCrop, tuningLocked, snowGlobeShell]);

  useEffect(() => {
    if (!powerVideoConfig) return undefined;
    let cancelled = false;
    const refresh = async () => {
      await import("@/lib/spriteLabLockedVideos")
        .then(({ recoverVideoKeyFromSnapshots }) =>
          recoverVideoKeyFromSnapshots(powerVideoConfig.videoKey ?? "matrix_power")
        )
        .catch(() => false);
      const loaded = await powerVideoConfig.has();
      if (cancelled) return;
      setPowerVideoLoaded(loaded);
      setPowerVideoPreviewUrl(powerVideoConfig.getCached());
    };
    refresh();
    const unsub = powerVideoConfig.subscribe((url) => {
      if (cancelled) return;
      setPowerVideoLoaded(!!url);
      setPowerVideoPreviewUrl(url);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [skinId, powerVideoConfig]);

  const clearPendingPowerSelection = () => {
    if (pendingPowerPreviewUrl) URL.revokeObjectURL(pendingPowerPreviewUrl);
    setPendingPowerFile(null);
    setPendingPowerPreviewUrl(null);
  };

  useEffect(() => () => {
    if (pendingPowerPreviewUrl) URL.revokeObjectURL(pendingPowerPreviewUrl);
  }, [pendingPowerPreviewUrl]);

  const handlePowerVideoUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !powerVideoConfig) return;
    clearPendingPowerSelection();
    const url = URL.createObjectURL(file);
    setPendingPowerFile(file);
    setPendingPowerPreviewUrl(url);
    setPowerVideoPreviewOpen(true);
  };

  const handleConfirmPendingPowerUpload = async () => {
    if (!pendingPowerFile || !powerVideoConfig) return;
    setPowerVideoUploading(true);
    try {
      await powerVideoConfig.save(pendingPowerFile);
      const url = await powerVideoConfig.getUrl();
      setPowerVideoLoaded(!!url);
      setPowerVideoPreviewUrl(url);
      clearPendingPowerSelection();
      setPowerVideoPreviewOpen(false);
      toast.success("Power video saved — toggle Power mode to preview");
    } catch {
      toast.error("Could not save video — try a smaller MP4");
    } finally {
      setPowerVideoUploading(false);
    }
  };

  const handleCancelPendingPowerUpload = () => {
    clearPendingPowerSelection();
    setPowerVideoPreviewOpen(false);
  };

  const handlePowerVideoPreviewOpenChange = (open) => {
    setPowerVideoPreviewOpen(open);
    if (!open && pendingPowerPreviewUrl) clearPendingPowerSelection();
  };

  const handleClearPowerVideo = async () => {
    if (!powerVideoConfig || tuningLocked) return;
    try {
      await powerVideoConfig.clear();
      setPowerVideoLoaded(false);
      setPowerVideoPreviewUrl(null);
      toast.success("Power video removed");
    } catch {
      toast.error("Could not remove video");
    }
  };

  const powerVideoPreviewSrc =
    supportsPowerVideoUpload && powerVideoPreviewUrl
      ? powerVideoPreviewUrl
      : catalogSkin.powerVideoUrl;
  const powerVideoDialogSrc = pendingPowerPreviewUrl || powerVideoPreviewSrc;
  const powerVideoSourceLabel = pendingPowerPreviewUrl
    ? "Selected file — review before saving to this slot"
    : powerVideoLoaded
      ? "Your upload on this device"
      : catalogSkin.powerVideoUrl
        ? `Catalog fallback · public${catalogSkin.powerVideoUrl}`
        : null;

  const accentBorder =
    skinId === "matrix"
      ? "border-green-500/30 bg-green-950/20"
      : skinId === "crystal_cut"
        ? "border-cyan-500/30 bg-cyan-950/20"
        : skinId === "ice"
          ? "border-sky-500/30 bg-sky-950/20"
          : skinId === "snow_globe"
            ? "border-sky-500/30 bg-sky-950/20"
            : skinId === "blue_gel"
              ? "border-cyan-500/30 bg-cyan-950/20"
              : "border-orange-500/30 bg-orange-950/20";
  const accentText =
    skinId === "matrix"
      ? "text-green-200"
      : skinId === "crystal_cut"
        ? "text-cyan-200"
        : skinId === "ice"
          ? "text-sky-200"
          : skinId === "snow_globe"
            ? "text-sky-200"
            : skinId === "blue_gel"
              ? "text-cyan-200"
              : "text-orange-200";
  const videoLabAccent =
    skinId === "crystal_cut"
      ? {
          border: "border-cyan-500/30 bg-cyan-950/20",
          title: "text-cyan-200",
          slider: "accent-cyan-400",
          code: "text-cyan-100",
        }
      : {
          border: "border-green-500/30 bg-green-950/20",
          title: "text-green-200",
          slider: "accent-green-400",
          code: "text-green-100",
        };

  const labPreviewSkin = lockConfig?.noSpriteTuning ? null : tunedSkin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-950 to-black text-white pb-10">
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <BackButton to="/shop" label="Shop" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black truncate">
                {skinId === "blue_gel"
                  ? "Blue Gel — Marlin Joe's Dice"
                  : `${catalogSkin.name} Sprite Lab`}
              </h1>
              <label className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Skin</span>
                <select
                  value={skinId}
                  onChange={(e) => navigate(`/sprite-lab/${e.target.value}`)}
                  className="h-8 min-w-[8rem] max-w-[14rem] rounded-md border border-white/15 bg-slate-900 px-2 text-xs font-semibold text-white"
                >
                  {spriteLabSkins.map((skin) => (
                    <option key={skin.id} value={skin.id}>
                      {skin.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-[10px] shrink-0"
                onClick={resetAllTuning}
                disabled={tuningLocked}
              >
                Reset all
              </Button>
              {lockConfig && (
                tuningLocked ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-[10px] shrink-0 border-amber-500/50 text-amber-200"
                    onClick={handleUnlockTuning}
                  >
                    <Unlock className="w-3.5 h-3.5 mr-1" />
                    Unlock
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] shrink-0 border-sky-500/50 text-sky-200"
                      onClick={handleSaveTuning}
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] shrink-0 border-emerald-500/50 text-emerald-200"
                      onClick={handleLockTuning}
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      Lock
                    </Button>
                  </>
                )
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-[10px] shrink-0 border-cyan-500/40 text-cyan-200"
                onClick={handleRestoreUploads}
              >
                Restore uploads
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">
              Preview uses classic green felt — saved dice look the same on every table felt in-game.
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {tuningLocked
                ? lockConfig?.noSpriteTuning
                  ? "Locked — story videos saved with lock"
                  : "Locked — tuning and videos saved on this device"
                : skinId === "snow_globe"
                  ? "Glass shell dice — live preview + shell shift"
                  : skinId === "blue_gel"
                    ? "Face sprite sheet — crop + per-face nudge · autosaved"
                    : skinId === "ice"
                    ? "Sprite crop + per-face nudge · Save or Lock to persist"
                    : "Global crop + per-face nudge · autosaved · tap Save to confirm"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="rounded-xl border border-fuchsia-500/35 bg-fuchsia-950/20 p-3 space-y-3">
          <button
            type="button"
            onClick={() => setDossierOpen((v) => !v)}
            className="w-full flex flex-wrap items-center justify-between gap-2 text-left"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-200">
                Dice dossier
              </p>
              <p className="text-base font-black text-white leading-tight">{catalogSkin.name}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-200/80 shrink-0">
              {dossierOpen ? "Hide details ▲" : "Show power / story ▼"}
            </span>
          </button>

          {dossierOpen ? (
            <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[10px] text-slate-500 font-mono">id: {skinId}</p>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {catalogSkin.powerDice ? (
                <span className="rounded-full border border-orange-400/50 bg-orange-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-200">
                  Power dice
                </span>
              ) : null}
              {catalogSkin.realistic ? (
                <span className="rounded-full border border-slate-400/40 bg-slate-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-300">
                  Realistic
                </span>
              ) : null}
              {catalogSkin.preview ? (
                <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-200">
                  Preview
                </span>
              ) : null}
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-100 tabular-nums">
                {catalogSkin.price === 0 ? "Free" : `${catalogSkin.price} coins`}
              </span>
            </div>
          </div>

          {catalogSkin.description ? (
            <p className="text-xs text-slate-300 leading-relaxed">{catalogSkin.description}</p>
          ) : null}

          <div className="rounded-lg border border-white/10 bg-black/25 p-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-200">
              Secret power
            </p>
            {skinPowerMeta.power ? (
              <>
                <p className="text-sm font-black text-white">
                  {skinPowerMeta.power.name}
                  {skinPowerMeta.power.tagline ? (
                    <span className="ml-2 text-[10px] font-semibold text-slate-400 normal-case tracking-normal">
                      — {skinPowerMeta.power.tagline}
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {skinPowerMeta.power.description}
                </p>
                <p className="text-[10px] text-slate-500">
                  Kind:{" "}
                  <span className="text-slate-300 font-semibold">
                    {skinPowerMeta.power.kind === "sabo" ? "sabotage" : "self"}
                  </span>
                  {" · "}
                  Source:{" "}
                  <span className="text-slate-300 font-semibold">
                    {skinPowerMeta.source === "mapped"
                      ? "skin map"
                      : skinPowerMeta.source === "random"
                        ? "stable hash (unmapped skin)"
                        : "none"}
                  </span>
                  {" · "}
                  <span className="font-mono text-slate-400">{skinPowerMeta.powerId}</span>
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-400">
                No secret power on this skin (vanilla / intentionally unpowered).
              </p>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
              Story mode character
            </p>
            {storyBossesForSkin.length > 0 ? (
              <ul className="space-y-2">
                {storyBossesForSkin.map((boss) => (
                  <li
                    key={boss.id}
                    className="rounded-md border border-sky-500/20 bg-sky-950/30 px-2.5 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base leading-none" aria-hidden>
                        {boss.avatar}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white leading-tight">
                          {boss.name}
                        </p>
                        {boss.title ? (
                          <p className="text-[10px] text-sky-200/80">{boss.title}</p>
                        ) : null}
                      </div>
                      {isStoryLadderBoss(boss.id) ? (
                        <span className="ml-auto rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-200">
                          On ladder
                        </span>
                      ) : (
                        <span className="ml-auto rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Roster only
                        </span>
                      )}
                    </div>
                    {boss.gimmick?.name ? (
                      <p className="mt-1.5 text-[10px] text-slate-400">
                        Gimmick:{" "}
                        <span className="text-slate-200 font-semibold">{boss.gimmick.name}</span>
                        {boss.gimmick.description ? ` — ${boss.gimmick.description}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-slate-500 font-mono">boss id: {boss.id}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-400">
                No Story mode boss uses this skin as their fight dice / unlock reward.
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-[10px] text-slate-400">
            <p>
              Regular sheet:{" "}
              <span className="font-mono text-slate-300">
                {catalogSkin.spriteUrl || "— (overlay / procedural)"}
              </span>
            </p>
            <p>
              Power sheet:{" "}
              <span className="font-mono text-slate-300">
                {catalogSkin.powerSpriteUrl || "—"}
              </span>
            </p>
            <p>
              Power video:{" "}
              <span className="font-mono text-slate-300">
                {catalogSkin.powerVideoUrl || "—"}
              </span>
            </p>
            <p>
              Skin level:{" "}
              <span className="tabular-nums text-slate-300 font-semibold">
                Lv {currentSkinLevel} / {LOCAL_SKIN_MAX_LEVEL}
              </span>
              {skinLevelVisual?.effect ? (
                <span className="text-slate-500"> · effect {skinLevelVisual.effect}</span>
              ) : null}
            </p>
          </div>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant={freezeOverlayPreview ? "default" : "outline"}
            onClick={() => setFreezeOverlayPreview((v) => !v)}
            className={
              freezeOverlayPreview
                ? "bg-sky-600 hover:bg-sky-500"
                : "border-sky-500/50 text-sky-200"
            }
          >
            {freezeOverlayPreview ? "Freeze overlay on" : "Freeze overlay off"}
          </Button>
          {freezeImmuneInGame ? (
            <span className="rounded-md border border-orange-500/40 bg-orange-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-200">
              Lab preview only · fire skin (no in-game freeze)
            </span>
          ) : null}
          {hasPowerPreview && (
            <Button
              size="sm"
              variant={powerMode ? "default" : "outline"}
              onClick={() => setPowerMode((v) => !v)}
              className={
                powerMode
                  ? skinId === "matrix"
                    ? "bg-green-600 hover:bg-green-500"
                    : skinId === "crystal_cut"
                      ? "bg-cyan-600 hover:bg-cyan-500"
                      : "bg-orange-600 hover:bg-orange-500"
                  : skinId === "matrix"
                    ? "border-green-500/50 text-green-200"
                    : skinId === "crystal_cut"
                      ? "border-cyan-500/50 text-cyan-200"
                      : "border-orange-500/50 text-orange-200"
              }
            >
              {powerMode
                ? hasPowerEffect
                  ? "Power mode"
                  : powerUsesVideo
                    ? "Power video"
                    : "Power sheet"
                : hasPowerEffect
                  ? "Regular"
                  : "Regular sheet"}
            </Button>
          )}
          <label className="text-[10px] text-slate-400 flex items-center gap-2 ml-auto">
            Preview size: {size}px
            <input
              type="range"
              min={48}
              max={120}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-28 accent-cyan-400"
            />
          </label>
        </div>

        <div className="grid lg:grid-cols-[minmax(160px,auto),1fr] gap-4 items-start">
          <FeltTrayFrame
            felt={felt}
            allowDieOverflow={
              iceFreezeOn || (previewSkinLevel > 1 && skinLevelVisual?.effect === "frost")
            }
            className="sticky top-2 z-20 self-start"
            innerClassName="p-4 sm:p-5 flex flex-col items-center gap-2"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Live preview</p>
            <Die
              value={selectedFace}
              size={Math.max(size, 120)}
              skinId={skinId}
              dieSeed={selectedFace}
              powerMode={hasPowerPreview && powerMode}
              iceFrozenOverlay={iceFreezeOn}
              labForceFreezeOverlay={iceFreezeOn}
              skinLevel={previewSkinLevel}
              snowGlobeShellSettings={skinId === "snow_globe" ? snowGlobeShell : undefined}
              devSkin={labPreviewSkin}
              includeJellyfish={skinId === "blue_gel" && selectedFace >= 2}
              {...(skinId === "blue_gel" ? getBlueGelTrayFishProps(selectedFace - 1) : {})}
            />
            <p className="text-xs text-cyan-200 tabular-nums">
              Face {selectedFace} · x {activeNudge.x.toFixed(1)} · y {activeNudge.y.toFixed(1)}
            </p>
          </FeltTrayFrame>

          <div className="space-y-3 min-w-0">
            <SpriteLabFreezeOverlayTools
              skinId={skinId}
              editFace={selectedFace}
              onEditFaceChange={setSelectedFace}
              freezeOn={freezeOverlayPreview}
              onFreezeOnChange={setFreezeOverlayPreview}
            />

            <div className="flex flex-wrap gap-1.5">
              {FACES.map((face) => (
                <button
                  key={face}
                  type="button"
                  onClick={() => setSelectedFace(face)}
                  className={cn(
                    "min-w-[2.25rem] h-9 rounded-lg text-sm font-bold tabular-nums border transition-colors",
                    selectedFace === face
                      ? "bg-cyan-500/25 border-cyan-400 text-cyan-100"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                  )}
                >
                  {face}
                </button>
              ))}
            </div>

            {(!lockConfig?.noSpriteTuning || skinId === "snow_globe") && (
            <FaceNudgePanel
              face={selectedFace}
              nudge={activeNudge}
              onChange={
                skinId === "snow_globe"
                  ? (nudge) => patchSnowGlobeFace(selectedFace, nudge)
                  : updateFaceNudge
              }
              onResetFace={
                skinId === "snow_globe"
                  ? () => patchSnowGlobeFace(selectedFace, { x: 0, y: 0 })
                  : resetFace
              }
              onResetAll={
                skinId === "snow_globe"
                  ? () =>
                      patchSnowGlobeShell({
                        shellFaces: DEFAULT_SNOW_GLOBE_SETTINGS.shellFaces,
                      })
                  : resetAllFaces
              }
              disabled={tuningLocked}
              modeLabel={
                skinId === "snow_globe"
                  ? "glass shell"
                  : hasPowerPreview && powerMode
                  ? hasPowerEffect
                    ? "power"
                    : powerUsesVideo
                      ? "power video"
                      : "power"
                  : hasPowerPreview
                    ? "regular"
                    : null
              }
            />
            )}
            {skinId === "snow_globe" && (() => {
              const shellSettings = snowGlobeShell;
              const shellDefaults = DEFAULT_SNOW_GLOBE_SETTINGS;
              const patchShell = patchSnowGlobeShell;
              const resetShell = resetSnowGlobeSettings;
              const setShell = setSnowGlobeShell;
              const panelAccent = {
                      border: "border-sky-500/30",
                      bg: "bg-sky-950/20",
                      title: "text-sky-200",
                      value: "text-sky-100",
                      slider: "accent-sky-400",
                    };
              return (
              <div className={cn("rounded-xl border p-3 space-y-3", panelAccent.border, panelAccent.bg)}>
                <p className={cn("text-xs font-bold uppercase tracking-wider", panelAccent.title)}>
                  Glass shell — all faces
                </p>
                {[
                  {
                    key: "shellZoom",
                    min: 0.85,
                    max: 1.25,
                    step: 0.01,
                    label: "Shell zoom",
                    format: (v) => Number(v).toFixed(2),
                  },
                  {
                    key: "shellOffsetX",
                    min: -0.2,
                    max: 0.2,
                    step: 0.005,
                    label: "Shell offset X",
                    format: (v) => Number(v).toFixed(3),
                  },
                  {
                    key: "shellOffsetY",
                    min: -0.2,
                    max: 0.2,
                    step: 0.005,
                    label: "Shell offset Y",
                    format: (v) => Number(v).toFixed(3),
                  },
                ].map(({ key, min, max, step, label, format }) => (
                  <label key={key} className="block text-[10px] text-slate-400">
                    {label}:{" "}
                    <span className={cn("tabular-nums", panelAccent.value)}>
                      {format(shellSettings?.[key] ?? shellDefaults[key])}
                    </span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={shellSettings?.[key] ?? shellDefaults[key]}
                      disabled={tuningLocked}
                      onChange={(e) => patchShell({ [key]: Number(e.target.value) })}
                      className={cn(
                        "w-full mt-1",
                        panelAccent.slider,
                        tuningLocked ? "opacity-40 cursor-not-allowed" : ""
                      )}
                    />
                  </label>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] text-slate-400"
                  disabled={tuningLocked}
                  onClick={() => {
                    const next = resetShell();
                    setShell(next);
                  }}
                >
                  Reset shell to defaults
                </Button>
              </div>
              );
            })()}
          </div>
        </div>


        {skinId === "blue_gel" && (
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-3 py-2.5 text-xs text-cyan-100 space-y-2">
            <p>
              Blue Gel uses its own <b>face sprite sheet</b> (<code className="text-cyan-200">999d8760b_generated_image.png</code>)
              with <b>baked-in dark pips</b> painted above the fish tank. Use crop + nudge below to align each face.
            </p>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
        )}
        {skinId === "blue_gel" && (
          <div className="rounded-xl border border-rose-500/35 bg-rose-950/20 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Shark Bite power videos
            </p>
            <p className="text-[10px] text-slate-400">
              Uploads auto-save on this device in multiple backups. Tap <b>Restore uploads</b> above
              if a clip looks missing after a refresh.
            </p>
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO}
              label={VIDEO_LABELS[VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO]}
              description={VIDEO_DESCRIPTIONS[VIDEO_KEYS.BLUE_GEL_SHARK_BITE_INTRO]}
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={VIDEO_KEYS.BLUE_GEL_POWER}
              label={VIDEO_LABELS[VIDEO_KEYS.BLUE_GEL_POWER]}
              description={VIDEO_DESCRIPTIONS[VIDEO_KEYS.BLUE_GEL_POWER]}
            />
          </div>
        )}
        {skinId === "ice" && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-100">
            <span>
              <b>Glacier sprite sheet</b> — crop + nudge below.{" "}
              <b>Score Freeze cube overlay</b> tunes in the Freeze overlay tools on this page (same
              device save as Ice Lab).
            </span>
            <Link
              to="/ice-lab"
              className="text-[11px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white shrink-0"
            >
              Full Ice Lab
            </Link>
          </div>
        )}
        {skinId === "snow_globe" && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 px-3 py-2.5 text-xs text-sky-100">
            Snow Globe has <b>no dice sheet of its own</b> — face + pips come from the borrowed{" "}
            <b>Aquamarine glass shell</b> (3×2 sprite). Use shell shift below to align; tune the shell
            crop on{" "}
            <Link to="/sprite-lab/aquamarine" className="text-sky-200 underline font-bold">
              Aquamarine Sprite Lab
            </Link>
            .
          </div>
        )}
        {tuningLocked && lockConfig && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2.5 flex items-center gap-2 text-xs text-amber-100">
            <Lock className="w-4 h-4 shrink-0 text-amber-300" />
            <span>
              {lockConfig.noSpriteTuning ? (
                <>
                  {catalogSkin.name} Sprite Lab is <b>locked</b>. Unlock if you need to change anything
                  here.
                </>
              ) : (
                <>
                  {catalogSkin.name} tuning and video uploads are <b>locked</b> and{" "}
                  <b>saved on this device</b>. Sliders and video uploads are read-only until you tap{" "}
                  <b>Unlock</b>.
                </>
              )}
            </span>
          </div>
        )}
        <div className={cn("rounded-xl border px-3 py-2.5 text-xs space-y-2", accentBorder)}>
          <button
            type="button"
            onClick={() => setHowToOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <p className={cn("font-bold", accentText)}>How to tune</p>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {howToOpen ? "Hide ▲" : "Show ▼"}
            </span>
          </button>
          {howToOpen ? (
            <>
          {skinId === "snow_globe" ? (
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Pick a face with the <b>1–6 buttons</b></li>
              <li>Shift the borrowed <b>Aquamarine glass shell</b> until pips read clearly</li>
              <li>Tune global shell zoom/offset, then fine-tune each face</li>
              <li>Settings autosave in this browser — apply in-game immediately</li>
            </ol>
          ) : skinId === "blue_gel" ? (
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Pick a face with the <b>1–6 buttons</b></li>
              <li>Drag <b>Nudge X / Y</b> until the dark pips/digits read clearly over the fish</li>
              <li>Tune global crop, then fine-tune each face</li>
              <li>Settings autosave in this browser — apply in-game immediately</li>
              <li>
                Shark Bite videos upload below (swim forward + chomp) — also on{" "}
                <Link to="/shark-bite-lab" className="text-rose-300 underline">
                  Shark Bite Lab
                </Link>
              </li>
            </ol>
          ) : (
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Pick a face with the <b>1–6 buttons</b></li>
              <li>Drag <b>Nudge X / Y</b> — live preview updates instantly</li>
              <li>Tune global crop, then fine-tune each face</li>
              <li>
                Tap <b>Lock</b> to save tuning and video uploads on this device — use <b>Copy JSON</b> only if you
                want to bake values into the repo
              </li>
            </ol>
          )}
          {hasPowerVideo && (
            <p className="text-slate-400 pt-1 border-t border-white/10">
              <b className="text-orange-200">Power video:</b>{" "}
              {supportsPowerVideoUpload ? (
                <>
                  tap <b>{powerVideoConfig.uploadLabel}</b> below — no Finder needed. 3×2 face grid.
                </>
              ) : (
                <>
                  drag your animated MP4 to{" "}
                  <code className="text-cyan-200">public{catalogSkin.powerVideoUrl}</code> (3×2 face grid).
                </>
              )}
              {" "}Toggle <b>Power mode</b> below to preview on the live die.
            </p>
          )}
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-3 space-y-2">
          <button
            type="button"
            onClick={() => setLevelPreviewOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                Sprite Lab level preview
              </p>
              <p className="text-[10px] text-slate-500">
                Saved Lv {currentSkinLevel} · preview Lv {previewSkinLevel}/{LOCAL_SKIN_MAX_LEVEL}
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
              {levelPreviewOpen ? "Hide ▲" : "Show ▼"}
            </span>
          </button>
          {levelPreviewOpen ? (
            <>
          <input
            aria-label="Preview skin level"
            type="range"
            min={1}
            max={LOCAL_SKIN_MAX_LEVEL}
            step={1}
            value={previewSkinLevel}
            onChange={(e) => setPreviewSkinLevel(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
            <span>Lv 1 · {skinLevelVisual?.levelOneLabel || "Base look"}</span>
            <span>Lv {LOCAL_SKIN_MAX_LEVEL} · {skinLevelVisual?.maxLevelLabel || "Max look"}</span>
          </div>
          <p className="text-[10px] text-cyan-100/80">
            {skinLevelVisual?.description ||
              "This skin has level tracking ready for a future Sprite Lab effect."}
          </p>
            </>
          ) : null}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">All faces</p>
          <FeltTrayFrame
            felt={felt}
            allowDieOverflow={
              iceFreezeOn || (previewSkinLevel > 1 && skinLevelVisual?.effect === "frost")
            }
            innerClassName="p-4"
          >
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 justify-items-center">
              {FACES.map((face) => (
                <button
                  key={face}
                  type="button"
                  onClick={() => setSelectedFace(face)}
                  className={cn(
                    "text-center rounded-xl p-1 transition-all",
                    selectedFace === face
                      ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-transparent bg-cyan-500/10"
                      : "hover:bg-white/5"
                  )}
                >
                  <Die
                    value={face}
                    size={size}
                    skinId={skinId}
                    dieSeed={face}
                    powerMode={hasPowerPreview && powerMode}
                    iceFrozenOverlay={iceFreezeOn}
                    labForceFreezeOverlay={iceFreezeOn}
                    skinLevel={previewSkinLevel}
                    snowGlobeShellSettings={skinId === "snow_globe" ? snowGlobeShell : undefined}
                    devSkin={labPreviewSkin}
                    includeJellyfish={skinId === "blue_gel" && face >= 2}
                    {...(skinId === "blue_gel" ? getBlueGelTrayFishProps(face - 1) : {})}
                  />
                  <p className={cn(
                    "text-[10px] mt-1 tabular-nums",
                    selectedFace === face ? "text-cyan-300 font-bold" : "text-slate-500"
                  )}>
                    {face}
                  </p>
                </button>
              ))}
            </div>
          </FeltTrayFrame>
        </div>

        {hasSpriteSheet && (
          <div className={cn("grid gap-3", hasPowerSprite ? "sm:grid-cols-2" : "")}>
            <div className="space-y-2">
              <CropSliders
                label={hasPowerSheet ? "Regular sheet crop" : "Sprite sheet crop"}
                crop={regularCrop}
                onChange={setRegularCrop}
                accent={skinId === "matrix" ? "green" : "amber"}
                disabled={tuningLocked}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] text-slate-400"
                disabled={tuningLocked}
                onClick={() => {
                  setRegularCrop(catalogSkin.spriteCrop ?? DEFAULT_SPRITE_CROP);
                  setPowerVideoZoom(defaultPowerVideoZoom(skinId, catalogSkin));
                  setPowerVideoCrop(catalogSkin.powerVideoCrop ?? { offsetX: 0, offsetY: 0 });
                  toast.success("Crop reset to defaults");
                }}
              >
                Reset crop to defaults
              </Button>
            </div>
            {hasPowerSprite && (
              <CropSliders label="Power sheet crop" crop={powerCrop} onChange={setPowerCrop} disabled={tuningLocked} />
            )}
          </div>
        )}

          {hasPowerVideo && !hasPowerSprite && (
            <div className={cn("rounded-xl border p-3 space-y-3", videoLabAccent.border)}>
              <p className={cn("text-xs font-bold uppercase tracking-wider", videoLabAccent.title)}>
                Power video crop
              </p>
            <p className="text-[10px] text-slate-400">
              Video must be a <b>3×2 face grid</b> (same layout as the sprite sheet). Toggle{" "}
              <b>Power video</b> above, then use nudges per face. Regular sliders above do not affect power.
            </p>
            <label className="block text-[10px] text-slate-400">
              Video zoom: <span className="text-white tabular-nums">{powerVideoZoom.toFixed(2)}</span>
              <input
                type="range"
                min={0.85}
                max={3}
                step={0.01}
                value={powerVideoZoom}
                disabled={tuningLocked}
                onChange={(e) => setPowerVideoZoom(Number(e.target.value))}
                onInput={(e) => setPowerVideoZoom(Number(e.target.value))}
                className={`w-full ${videoLabAccent.slider} mt-1 ${tuningLocked ? "opacity-40 cursor-not-allowed" : ""}`}
              />
              <p className="text-[10px] text-slate-500">1.0 = one full face per cell. Higher = zoom in.</p>
            </label>
            {[
              { key: "offsetX", min: -0.5, max: 0.5, step: 0.005, label: "Video offset X" },
              { key: "offsetY", min: -0.5, max: 0.5, step: 0.005, label: "Video offset Y" },
            ].map(({ key, min, max, step, label: sliderLabel }) => (
              <label key={key} className="block text-[10px] text-slate-400">
                {sliderLabel}:{" "}
                <span className="text-white tabular-nums">{(powerVideoCrop[key] ?? 0).toFixed(3)}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={powerVideoCrop[key] ?? 0}
                  disabled={tuningLocked}
                  onChange={(e) =>
                    setPowerVideoCrop((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  onInput={(e) =>
                    setPowerVideoCrop((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  className={`w-full ${videoLabAccent.slider} mt-1 ${tuningLocked ? "opacity-40 cursor-not-allowed" : ""}`}
                />
              </label>
            ))}
          </div>
        )}

        {hasSpriteSheet && (
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-bold text-slate-300">{tuningFileName(skinId)} values</p>
              <Button size="sm" variant="outline" onClick={copySnippet} className="text-xs h-8">
                Copy JSON
              </Button>
            </div>
            <pre className="text-[10px] text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">{catalogSnippet}</pre>
          </div>
        )}

        {(hasPowerSprite || hasPowerVideo) && (
        <div className={cn("grid gap-4", hasPowerSprite || hasPowerVideo ? "sm:grid-cols-2" : "")}>
          {hasPowerSprite && (
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Power sheet</p>
              <img
                src={catalogSkin.powerSpriteUrl}
                alt="Power sprite sheet"
                className="w-full rounded-lg border border-white/10"
              />
            </div>
          )}
          {hasPowerVideo && !hasPowerSprite && (
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Power video</p>
              <div
                className={cn(
                  "rounded-lg border p-3 space-y-3",
                  skinId === "crystal_cut"
                    ? "border-cyan-500/30 bg-cyan-950/20"
                    : "border-green-500/30 bg-green-950/20"
                )}
              >
                {supportsPowerVideoUpload ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={powerVideoInputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,.mp4,.mov"
                        className="hidden"
                        onChange={handlePowerVideoUpload}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={powerVideoUploading}
                        className={
                          skinId === "crystal_cut"
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                            : "bg-green-600 hover:bg-green-500 text-white"
                        }
                        onClick={() => powerVideoInputRef.current?.click()}
                      >
                        {powerVideoUploading ? "Saving…" : powerVideoConfig.uploadLabel}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!powerVideoDialogSrc}
                        className={
                          skinId === "crystal_cut"
                            ? "border-violet-500/40 text-violet-200 disabled:opacity-40"
                            : "border-violet-500/40 text-violet-200 disabled:opacity-40"
                        }
                        onClick={() => setPowerVideoPreviewOpen(true)}
                      >
                        <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                        Preview
                      </Button>
                      {powerVideoLoaded && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={tuningLocked}
                          className={
                            skinId === "crystal_cut"
                              ? "border-cyan-500/40 text-cyan-200"
                              : "border-green-500/40 text-green-200"
                          }
                          onClick={handleClearPowerVideo}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[10px]",
                        skinId === "crystal_cut" ? "text-cyan-200" : "text-green-200"
                      )}
                    >
                      {powerVideoLoaded ? "Video loaded ✓" : "No video yet — pick an MP4 from your device"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Or drop file in{" "}
                      <code className={skinId === "crystal_cut" ? "text-cyan-100" : "text-green-100"}>
                        public{catalogSkin.powerVideoUrl}
                      </code>{" "}
                      if you prefer. Also on{" "}
                      <Link to="/video-assets" className="text-cyan-400 underline">
                        Video Assets
                      </Link>
                      .
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-green-200">
                    Drag your mp4 to{" "}
                    <code className="text-green-100">public{catalogSkin.powerVideoUrl}</code>
                  </p>
                )}
                {powerVideoPreviewSrc && !pendingPowerPreviewUrl && (
                  <video
                    key={powerVideoPreviewSrc}
                    src={powerVideoPreviewSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full rounded border border-white/10"
                  />
                )}
                <p className="text-[10px] text-slate-500">
                  Tap <b>Preview</b> to verify your upload or catalog fallback. Toggle{" "}
                  <b>Power video</b> above to preview on the live die.
                </p>
                <VideoPreviewDialog
                  open={powerVideoPreviewOpen}
                  onOpenChange={handlePowerVideoPreviewOpenChange}
                  src={powerVideoDialogSrc}
                  title={`${catalogSkin.name} power video`}
                  sourceLabel={powerVideoSourceLabel}
                >
                  {pendingPowerPreviewUrl ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-500/50 text-slate-200"
                        disabled={powerVideoUploading}
                        onClick={handleCancelPendingPowerUpload}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className={
                          skinId === "crystal_cut"
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                            : "bg-green-600 hover:bg-green-500 text-white"
                        }
                        disabled={powerVideoUploading}
                        onClick={handleConfirmPendingPowerUpload}
                      >
                        {powerVideoUploading ? "Saving…" : "Save to this slot"}
                      </Button>
                    </>
                  ) : null}
                </VideoPreviewDialog>
              </div>
            </div>
          )}
        </div>
        )}

        {skinId === "crystal_cut" && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
              Story mode — before &amp; after (GQ)
            </p>
            <p className="text-[10px] text-slate-400">
              Only plays in <b>Story mode</b> fights against GQ. <b>Before match</b> fullscreen
              intro when the fight starts. <b>After victory</b> when you win.
            </p>
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossIntroKey(GQ_BOSS_ID)}
              label={getStoryBossVideoLabel(GQ_BOSS_ID, "intro")}
              description={getStoryBossVideoDescription(GQ_BOSS_ID, "intro")}
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossWinKey(GQ_BOSS_ID)}
              label={getStoryBossVideoLabel(GQ_BOSS_ID, "win")}
              description={getStoryBossVideoDescription(GQ_BOSS_ID, "win")}
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossAvatarKey(GQ_BOSS_ID)}
              label={getStoryBossVideoLabel(GQ_BOSS_ID, "avatar")}
              description={getStoryBossVideoDescription(GQ_BOSS_ID, "avatar")}
            />
            <p className="text-[10px] text-slate-500 pt-1">
              Same slots are under <b>GQ</b> in{" "}
              <Link to="/video-assets" className="text-cyan-400 underline">
                Video Assets → Story mode
              </Link>
              .
            </p>
          </div>
        )}

        {skinId === "ice" && (
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Story mode — before &amp; after (Frosty)
            </p>
            <p className="text-[10px] text-slate-400">
              Only plays in <b>Story mode</b> fights against Frosty the Evil Snowman.{" "}
              <b>Before match</b> fullscreen intro when the fight starts. <b>After victory</b> when
              you win.
            </p>
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossIntroKey(FROSTY_BOSS_ID)}
              label={getStoryBossVideoLabel(FROSTY_BOSS_ID, "intro")}
              description={getStoryBossVideoDescription(FROSTY_BOSS_ID, "intro")}
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossWinKey(FROSTY_BOSS_ID)}
              label={getStoryBossVideoLabel(FROSTY_BOSS_ID, "win")}
              description={getStoryBossVideoDescription(FROSTY_BOSS_ID, "win")}
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossAvatarKey(FROSTY_BOSS_ID)}
              label={getStoryBossVideoLabel(FROSTY_BOSS_ID, "avatar")}
              description={getStoryBossVideoDescription(FROSTY_BOSS_ID, "avatar")}
            />
            <p className="text-[10px] text-slate-500 pt-1">
              Same slots are under <b>Frosty the Evil Snowman</b> in{" "}
              <Link to="/video-assets" className="text-cyan-400 underline">
                Video Assets → Story mode
              </Link>
              .
            </p>
          </div>
        )}

        {skinId === "dragon_scale" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Story mode — before &amp; after (Sir Scalewyrm)
            </p>
            <p className="text-[10px] text-slate-400">
              Only plays in <b>Story mode</b> fights against Sir Scalewyrm. <b>Before match</b>{" "}
              fullscreen intro when the fight starts. <b>After victory</b> when you win.
            </p>
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossIntroKey(DRAGON_KNIGHT_BOSS_ID)}
              label={getStoryBossVideoLabel(DRAGON_KNIGHT_BOSS_ID, "intro")}
              description={getStoryBossVideoDescription(DRAGON_KNIGHT_BOSS_ID, "intro")}
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossWinKey(DRAGON_KNIGHT_BOSS_ID)}
              label={getStoryBossVideoLabel(DRAGON_KNIGHT_BOSS_ID, "win")}
              description={getStoryBossVideoDescription(DRAGON_KNIGHT_BOSS_ID, "win")}
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossAvatarKey(DRAGON_KNIGHT_BOSS_ID)}
              label={getStoryBossVideoLabel(DRAGON_KNIGHT_BOSS_ID, "avatar")}
              description={getStoryBossVideoDescription(DRAGON_KNIGHT_BOSS_ID, "avatar")}
            />
            <p className="text-[10px] text-slate-500 pt-1">
              Same slots are under <b>Sir Scalewyrm</b> in{" "}
              <Link to="/video-assets" className="text-cyan-400 underline">
                Video Assets → Story mode
              </Link>
              .
            </p>
          </div>
        )}

        {skinId === "matrix" && (
          <div className="rounded-xl border border-green-500/30 bg-green-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-green-200">
              Story mode — Neo videos
            </p>
            <p className="text-[10px] text-slate-400">
              <b>Before match</b> intro · <b>After victory</b> win cutscene ·{" "}
              <b>Avatar loop</b> = large video during Neo fights (upload your Matrix clip here —
              not the static 10,000 sign).
            </p>
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossIntroKey(NEO_BOSS_ID)}
              label={getStoryBossVideoLabel(NEO_BOSS_ID, "intro")}
              description="Story mode only — fullscreen intro before fighting Neo. Does not play in local games."
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossWinKey(NEO_BOSS_ID)}
              label={getStoryBossVideoLabel(NEO_BOSS_ID, "win")}
              description="Story mode only — victory cutscene after you beat Neo. Does not play in local games."
            />
            <VideoUploadCard
              lockRemovesOnly={tuningLocked}
              videoKey={storyBossAvatarKey(NEO_BOSS_ID)}
              label={getStoryBossVideoLabel(NEO_BOSS_ID, "avatar")}
              description={getStoryBossVideoDescription(NEO_BOSS_ID, "avatar")}
            />
            <p className="text-[10px] text-slate-500 pt-1">
              Same slots are under <b>Neo</b> in{" "}
              <Link to="/video-assets" className="text-cyan-400 underline">
                Video Assets → Story mode
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
