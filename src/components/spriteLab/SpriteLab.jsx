import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getFelt, getSkin, skinHasPowerSprite } from "@/lib/shopCatalog";
import { useCosmetics } from "@/hooks/useCosmetics";
import {
  buildCatalogSnippet,
  clearSpriteLabDraft,
  DEFAULT_SPRITE_CROP,
  emptyFaceMap,
  FACES,
  loadSpriteLabDraft,
  saveSpriteLabDraft,
  tuningFileName,
  getSpriteLabSkins,
} from "@/lib/spriteLab";
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
import { Lock, Unlock } from "lucide-react";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import { VIDEO_KEYS } from "@/lib/localVideoStore";
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
    storyVideosLabel: "Glacia story videos still editable below",
  },
  snow_globe: {
    isLocked: isSnowGlobeTuningLocked,
    lock: lockSnowGlobeTuning,
    unlock: unlockSnowGlobeTuning,
    tuningFile: "snowGlobeSpriteTuning.js",
    accent: "sky",
    noSpriteTuning: true,
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

const DIAMOND_CUT_BOSS_ID = "diamond_cut";
const FROSTY_BOSS_ID = "snowman";
const ICE_WITCH_BOSS_ID = "ice_witch";

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
        { key: "x", min: -200, max: 200, step: 0.5, label: "Nudge X" },
        { key: "y", min: -200, max: 200, step: 0.5, label: "Nudge Y" },
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

export default function SpriteLab({ skinId }) {
  const navigate = useNavigate();
  const spriteLabSkins = useMemo(() => getSpriteLabSkins(), []);
  const { equippedFeltId } = useCosmetics();
  const felt = getFelt(equippedFeltId);
  const catalogSkin = getSkin(skinId);
  const hasSpriteSheet = !!catalogSkin.spriteUrl;
  const hasPowerSheet = skinHasPowerSprite(catalogSkin);
  const hasPowerVideo = !!catalogSkin.powerVideoUrl;
  const hasPowerSprite = !!catalogSkin.powerSpriteUrl;
  const hasPowerEffect = !!catalogSkin.powerDice && !hasPowerSheet;
  const hasPowerPreview = hasPowerSheet || hasPowerEffect;
  const powerUsesVideo = hasPowerVideo && !hasPowerSprite;
  const lockConfig = TUNING_LOCK_SKINS[skinId];
  const powerVideoConfig = POWER_VIDEO_SKIN_CONFIG[skinId];
  const supportsPowerVideoUpload = !!powerVideoConfig;
  const [tuningUnlocked, setTuningUnlocked] = useState(
    () => !lockConfig || !lockConfig.isLocked()
  );
  const tuningLocked = !!lockConfig && !tuningUnlocked;
  const saved = loadSpriteLabDraft(skinId);

  const [regularCrop, setRegularCrop] = useState(
    () => saved?.regularCrop ?? catalogSkin.spriteCrop ?? DEFAULT_SPRITE_CROP
  );
  const [powerCrop, setPowerCrop] = useState(
    () => saved?.powerCrop ?? catalogSkin.powerSpriteCrop ?? DEFAULT_SPRITE_CROP
  );
  const [regularFaces, setRegularFaces] = useState(() =>
    emptyFaceMap(saved?.regularFaces ?? catalogSkin.spriteFaceOffsets?.regular)
  );
  const [powerFaces, setPowerFaces] = useState(() =>
    emptyFaceMap(saved?.powerFaces ?? catalogSkin.spriteFaceOffsets?.power)
  );
  const [powerMode, setPowerMode] = useState(false);
  const [selectedFace, setSelectedFace] = useState(1);
  const [size, setSize] = useState(100);
  const [powerVideoLoaded, setPowerVideoLoaded] = useState(false);
  const [powerVideoPreviewUrl, setPowerVideoPreviewUrl] = useState(
    () => powerVideoConfig?.getCached() ?? null
  );
  const powerVideoInputRef = useRef(null);
  const [powerVideoUploading, setPowerVideoUploading] = useState(false);
  const [powerVideoZoom, setPowerVideoZoom] = useState(
    () => saved?.powerVideoZoom ?? catalogSkin.powerVideoZoom ?? (skinId === "matrix" ? 1 : 3)
  );
  const [powerVideoCrop, setPowerVideoCrop] = useState(
    () => saved?.powerVideoCrop ?? catalogSkin.powerVideoCrop ?? { offsetX: 0, offsetY: 0 }
  );

  const usesPowerFaceNudges = hasPowerSprite || powerUsesVideo;
  const activeFaces = powerMode && usesPowerFaceNudges ? powerFaces : regularFaces;
  const setActiveFaces = powerMode && usesPowerFaceNudges ? setPowerFaces : setRegularFaces;
  const activeNudge = activeFaces[selectedFace] ?? { x: 0, y: 0 };

  const tunedSkin = useMemo(
    () => {
      if (tuningLocked) return catalogSkin;
      return {
      ...catalogSkin,
      spriteCrop: regularCrop,
      powerVideoZoom,
      powerVideoCrop,
      powerSpriteCrop: hasPowerSprite ? powerCrop : catalogSkin.powerSpriteCrop,
      spriteFaceOffsets: usesPowerFaceNudges
        ? { regular: regularFaces, power: powerFaces }
        : { regular: regularFaces },
    };
    },
    [
      tuningLocked,
      catalogSkin,
      regularCrop,
      powerCrop,
      powerVideoZoom,
      powerVideoCrop,
      regularFaces,
      powerFaces,
      hasPowerSprite,
      usesPowerFaceNudges,
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
    setRegularCrop(catalogSkin.spriteCrop ?? DEFAULT_SPRITE_CROP);
    setPowerCrop(catalogSkin.powerSpriteCrop ?? DEFAULT_SPRITE_CROP);
    setRegularFaces(emptyFaceMap(catalogSkin.spriteFaceOffsets?.regular));
    setPowerFaces(emptyFaceMap(catalogSkin.spriteFaceOffsets?.power));
    setPowerVideoZoom(catalogSkin.powerVideoZoom ?? (skinId === "matrix" ? 1 : 3));
    setPowerVideoCrop(catalogSkin.powerVideoCrop ?? { offsetX: 0, offsetY: 0 });
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
    setActiveFaces(emptyFaceMap(powerMode && usesPowerFaceNudges ? catalogSkin.spriteFaceOffsets?.power : catalogSkin.spriteFaceOffsets?.regular));
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

  const handleLockTuning = () => {
    if (!lockConfig) return;
    // Keep current slider values — never reset to catalog on Lock.
    // Catalog file must already match (Copy JSON → paste into tuning file).
    lockConfig.lock();
    setTuningUnlocked(false);
    toast.success(
      `${catalogSkin.name} tuning locked — current values kept. Paste Copy JSON into ${lockConfig.tuningFile} if you haven’t yet.`
    );
  };

  const handleUnlockTuning = () => {
    if (!lockConfig) return;
    lockConfig.unlock();
    setTuningUnlocked(true);
    toast.success(`${catalogSkin.name} tuning unlocked — sliders are live`);
  };

  useEffect(() => {
    if (tuningLocked) return;
    saveSpriteLabDraft(skinId, {
      regularCrop,
      powerCrop,
      regularFaces,
      powerFaces,
      powerVideoZoom,
      powerVideoCrop,
    });
  }, [skinId, regularCrop, powerCrop, regularFaces, powerFaces, powerVideoZoom, powerVideoCrop, tuningLocked]);

  useEffect(() => {
    if (!powerVideoConfig) return undefined;
    let cancelled = false;
    const refresh = async () => {
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

  const handlePowerVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !powerVideoConfig) return;
    setPowerVideoUploading(true);
    try {
      await powerVideoConfig.save(file);
      const url = await powerVideoConfig.getUrl();
      setPowerVideoLoaded(!!url);
      setPowerVideoPreviewUrl(url);
      toast.success("Power video saved — toggle Power mode to preview");
    } catch {
      toast.error("Could not save video — try a smaller MP4");
    } finally {
      setPowerVideoUploading(false);
    }
  };

  const handleClearPowerVideo = async () => {
    if (!powerVideoConfig) return;
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

  const accentBorder =
    skinId === "matrix"
      ? "border-green-500/30 bg-green-950/20"
      : skinId === "crystal_cut"
        ? "border-cyan-500/30 bg-cyan-950/20"
        : skinId === "ice"
          ? "border-sky-500/30 bg-sky-950/20"
          : skinId === "snow_globe"
            ? "border-sky-500/30 bg-sky-950/20"
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
            : "text-orange-200";

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
              <h1 className="text-lg font-black truncate">{catalogSkin.name} Sprite Lab</h1>
              <label className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Skin</span>
                <select
                  value={skinId}
                  onChange={(e) => navigate(`/sprite-lab/${e.target.value}`)}
                  className="h-8 max-w-[10rem] rounded-md border border-white/15 bg-slate-900 px-2 text-xs font-semibold text-white"
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
                )
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {tuningLocked
                ? lockConfig?.noSpriteTuning
                  ? "Locked — Frosty story videos still editable below"
                  : lockConfig?.storyVideosLabel
                    ? `Locked — ${lockConfig.storyVideosLabel}`
                    : "Locked — using saved catalog tuning only"
                : skinId === "snow_globe"
                  ? "No sprite sheet — upload Frosty story videos below"
                  : skinId === "ice"
                    ? "Sprite crop + per-face nudge · upload Glacia story videos below"
                    : "Global crop + per-face nudge · autosaved in browser"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {tuningLocked && lockConfig && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2.5 flex items-center gap-2 text-xs text-amber-100">
            <Lock className="w-4 h-4 shrink-0 text-amber-300" />
            <span>
              {lockConfig.noSpriteTuning ? (
                <>
                  {catalogSkin.name} Sprite Lab is <b>locked</b>. Tap <b>Unlock</b> when you need to tune future
                  sprite settings. Frosty story video uploads below stay editable.
                </>
              ) : lockConfig.storyVideosLabel ? (
                <>
                  {catalogSkin.name} tuning is <b>locked</b>. Sliders are read-only until you tap <b>Unlock</b>.
                  In-game dice use the saved values in{" "}
                  <code className="text-amber-200">{lockConfig.tuningFile}</code>. {lockConfig.storyVideosLabel}.
                </>
              ) : (
                <>
                  {catalogSkin.name} tuning is <b>locked</b>. Sliders are read-only until you tap <b>Unlock</b>.
                  In-game dice use the saved values in{" "}
                  <code className="text-amber-200">{lockConfig.tuningFile}</code>.
                </>
              )}
            </span>
          </div>
        )}
        <div className={cn("rounded-xl border px-3 py-3 text-xs space-y-2", accentBorder)}>
          <p className={cn("font-bold", accentText)}>How to tune</p>
          {skinId === "snow_globe" ? (
            <p className="text-slate-300">
              Snow Globe uses the Aquamarine glass shell with drifting snowflakes — no sprite sheet to tune.
              Upload <b>Frosty story videos</b> below (intro, victory, avatar loop).
            </p>
          ) : (
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Pick a face with the <b>1–6 buttons</b></li>
              <li>Drag <b>Nudge X / Y</b> — live preview updates instantly</li>
              <li>Tune global crop, then fine-tune each face</li>
              <li>Copy JSON → paste into <code className="text-cyan-200">{tuningFileName(skinId)}</code></li>
            </ol>
          )}
          {hasPowerVideo && (
            <p className="text-slate-400 pt-1 border-t border-white/10">
              <b className="text-orange-200">Power video:</b>{" "}
              {supportsPowerVideoUpload ? (
                <>
                  tap <b>{powerVideoConfig.uploadLabel}</b> below — no Finder needed. 3×2 face grid, like Tesla.
                </>
              ) : (
                <>
                  drag your animated MP4 to{" "}
                  <code className="text-cyan-200">public{catalogSkin.powerVideoUrl}</code> (3×2 face grid, like Tesla).
                </>
              )}
              {" "}Toggle <b>Power mode</b> below to preview on the live die.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
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

        <div className="grid sm:grid-cols-[auto,1fr] gap-4 items-start">
          <FeltTrayFrame felt={felt} innerClassName="p-5 flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Live preview</p>
            <Die
              value={selectedFace}
              size={Math.max(size, 120)}
              skinId={skinId}
              dieSeed={selectedFace}
              powerMode={hasPowerPreview && powerMode}
              devSkin={tunedSkin}
            />
            <p className="text-xs text-cyan-200 tabular-nums">
              Face {selectedFace} · x {activeNudge.x.toFixed(1)} · y {activeNudge.y.toFixed(1)}
            </p>
          </FeltTrayFrame>

          <div className="space-y-3">
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

            <FaceNudgePanel
              face={selectedFace}
              nudge={activeNudge}
              onChange={updateFaceNudge}
              onResetFace={resetFace}
              onResetAll={resetAllFaces}
              disabled={tuningLocked}
              modeLabel={
                hasPowerPreview && powerMode
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
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">All faces</p>
          <FeltTrayFrame felt={felt} innerClassName="p-4">
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
                    devSkin={tunedSkin}
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
                  setPowerVideoZoom(catalogSkin.powerVideoZoom ?? (skinId === "matrix" ? 1 : 3));
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
            <div
              className={cn(
                "rounded-xl border p-3 space-y-3",
                skinId === "crystal_cut"
                  ? "border-cyan-500/30 bg-cyan-950/20"
                  : "border-green-500/30 bg-green-950/20"
              )}
            >
              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  skinId === "crystal_cut" ? "text-cyan-200" : "text-green-200"
                )}
              >
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
                className={`w-full ${skinId === "crystal_cut" ? "accent-cyan-400" : "accent-green-400"} mt-1 ${tuningLocked ? "opacity-40 cursor-not-allowed" : ""}`}
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
                  className={`w-full ${skinId === "crystal_cut" ? "accent-cyan-400" : "accent-green-400"} mt-1 ${tuningLocked ? "opacity-40 cursor-not-allowed" : ""}`}
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

        {(hasSpriteSheet || hasPowerSprite || hasPowerVideo) && (
        <div className={cn("grid gap-4", hasPowerSprite || hasPowerVideo ? "sm:grid-cols-2" : "")}>
          {hasSpriteSheet && (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Sprite sheet</p>
            <img
              src={catalogSkin.spriteUrl}
              alt="Sprite sheet"
              className="w-full rounded-lg border border-white/10"
            />
          </div>
          )}
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
                      {powerVideoLoaded && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
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
                {powerVideoPreviewSrc && (
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
                  Toggle <b>Power video</b> above to preview on the live die.
                </p>
              </div>
            </div>
          )}
        </div>
        )}

        {skinId === "matrix" && (
          <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-200">Scene videos</p>
            <p className="text-[10px] text-slate-400">
              <b>Story hub banner</b> is the ladder page only — not a boss intro.{" "}
              <b>Boss defeated</b> is the shared victory fallback. Per-boss intros (including{" "}
              <b>GQ</b>) live under <b>Video settings</b>. <b>Billboard</b> is the 10,000 sign in
              local matches. Header loop is not shown above the sign anymore.
            </p>
            <VideoUploadCard videoKey={VIDEO_KEYS.STORY_MODE} />
            <VideoUploadCard videoKey={VIDEO_KEYS.STORY_BOSS_WIN} />
            <VideoUploadCard videoKey={VIDEO_KEYS.GAMEPLAY_BILLBOARD} />
            <VideoUploadCard videoKey={VIDEO_KEYS.GAMEPLAY_LOOP} />
          </div>
        )}

        {skinId === "crystal_cut" && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
              Vitrea — Diamond Cut story videos
            </p>
            <p className="text-[10px] text-slate-400">
              Per-boss uploads for <b>Vitrea</b> (The Diamond Sister). <b>Before match</b> plays
              fullscreen once before the fight. <b>Victory cutscene</b> plays after you win.
              <b> Avatar loop</b> replaces her emoji in dialogue when uploaded.
            </p>
            <VideoUploadCard
              videoKey={storyBossIntroKey(DIAMOND_CUT_BOSS_ID)}
              label={getStoryBossVideoLabel(DIAMOND_CUT_BOSS_ID, "intro")}
              description={getStoryBossVideoDescription(DIAMOND_CUT_BOSS_ID, "intro")}
            />
            <VideoUploadCard
              videoKey={storyBossWinKey(DIAMOND_CUT_BOSS_ID)}
              label={getStoryBossVideoLabel(DIAMOND_CUT_BOSS_ID, "win")}
              description={getStoryBossVideoDescription(DIAMOND_CUT_BOSS_ID, "win")}
            />
            <VideoUploadCard
              videoKey={storyBossAvatarKey(DIAMOND_CUT_BOSS_ID)}
              label={getStoryBossVideoLabel(DIAMOND_CUT_BOSS_ID, "avatar")}
              description={getStoryBossVideoDescription(DIAMOND_CUT_BOSS_ID, "avatar")}
            />
            <p className="text-[10px] text-slate-500 pt-1">
              Same slots are under <b>Vitrea</b> in{" "}
              <Link to="/video-assets" className="text-cyan-400 underline">
                Video Assets → Story Boss Videos
              </Link>
              .
            </p>
          </div>
        )}

        {skinId === "snow_globe" && (
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Frosty — Snow Globe story videos
            </p>
            <p className="text-[10px] text-slate-400">
              Per-boss uploads for <b>Frosty</b> (Winter Wanderer). <b>Before match</b> plays
              fullscreen once before the fight. <b>Victory cutscene</b> plays after you win.
              <b> Avatar loop</b> replaces his emoji in dialogue when uploaded.
            </p>
            <VideoUploadCard
              videoKey={storyBossIntroKey(FROSTY_BOSS_ID)}
              label={getStoryBossVideoLabel(FROSTY_BOSS_ID, "intro")}
              description={getStoryBossVideoDescription(FROSTY_BOSS_ID, "intro")}
            />
            <VideoUploadCard
              videoKey={storyBossWinKey(FROSTY_BOSS_ID)}
              label={getStoryBossVideoLabel(FROSTY_BOSS_ID, "win")}
              description={getStoryBossVideoDescription(FROSTY_BOSS_ID, "win")}
            />
            <VideoUploadCard
              videoKey={storyBossAvatarKey(FROSTY_BOSS_ID)}
              label={getStoryBossVideoLabel(FROSTY_BOSS_ID, "avatar")}
              description={getStoryBossVideoDescription(FROSTY_BOSS_ID, "avatar")}
            />
            <p className="text-[10px] text-slate-500 pt-1">
              Same slots are under <b>Frosty</b> in{" "}
              <Link to="/video-assets" className="text-cyan-400 underline">
                Video Assets → Story Boss Videos
              </Link>
              .
            </p>
          </div>
        )}

        {skinId === "ice" && (
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Glacia — Frozen Ice story videos
            </p>
            <p className="text-[10px] text-slate-400">
              Per-boss uploads for <b>Glacia</b> (Frostbite Queen). <b>Before match</b> plays
              fullscreen once before the fight. <b>Victory cutscene</b> plays after you win.
              <b> Avatar loop</b> replaces her emoji in dialogue when uploaded.
            </p>
            <VideoUploadCard
              videoKey={storyBossIntroKey(ICE_WITCH_BOSS_ID)}
              label={getStoryBossVideoLabel(ICE_WITCH_BOSS_ID, "intro")}
              description={getStoryBossVideoDescription(ICE_WITCH_BOSS_ID, "intro")}
            />
            <VideoUploadCard
              videoKey={storyBossWinKey(ICE_WITCH_BOSS_ID)}
              label={getStoryBossVideoLabel(ICE_WITCH_BOSS_ID, "win")}
              description={getStoryBossVideoDescription(ICE_WITCH_BOSS_ID, "win")}
            />
            <VideoUploadCard
              videoKey={storyBossAvatarKey(ICE_WITCH_BOSS_ID)}
              label={getStoryBossVideoLabel(ICE_WITCH_BOSS_ID, "avatar")}
              description={getStoryBossVideoDescription(ICE_WITCH_BOSS_ID, "avatar")}
            />
            <p className="text-[10px] text-slate-500 pt-1">
              Same slots are under <b>Glacia</b> in{" "}
              <Link to="/video-assets" className="text-cyan-400 underline">
                Video Assets → Story Boss Videos
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
