import React from "react";
import { assetUrl } from "@/lib/assetUrl";
import { getFeltTheme } from "@/lib/feltThemes";
import {
  getFeltFiberNoiseUrl,
  getFeltLighting,
  getFeltMottlingLayers,
  getFeltNapLayers,
  getFramePhotoImgStyle,
  getPhotoTextureStyle,
  getThemedFabricUnderlayOpacity,
  isDedicatedPhotoFelt,
  isFabricFelt,
  usesFramePhotoLayer,
  usesPhotoFeltTexture,
} from "@/lib/feltVisuals";
import FeltThemeOverlay from "./FeltThemeOverlay";

/**
 * Layered billiard-cloth surface: mottling → photo/cloth nap → theme → fibers → lighting.
 */
export default function FeltSurface({ felt, compact = false, intense = false }) {
  if (!felt) return null;

  const nap = getFeltNapLayers(felt, compact);
  const lighting = getFeltLighting(felt, compact);
  const theme = getFeltTheme(felt.id);
  const isFabric = isFabricFelt(felt.id);
  const isPhotoOnly = isDedicatedPhotoFelt(felt.id);
  const isFramedArt = usesFramePhotoLayer(felt);
  const fabricStrength = getThemedFabricUnderlayOpacity(felt.id);
  const showPhoto = usesPhotoFeltTexture(felt.id) && felt.textureUrl;
  const wearOpacity = compact ? 0.22 : 0.38;
  const vignetteStrength = compact ? 0.32 : 0.5;
  const overlay = isFramedArt ? 0 : (felt.overlayStrength ?? 1);

  return (
    <>
      {/* Dye-lot variation — breaks up the flat wash */}
      {!isFramedArt && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-soft-light"
          style={{
            opacity: (isPhotoOnly ? 0.35 : isFabric ? 0.85 : 0.45 * fabricStrength) * overlay,
            background: getFeltMottlingLayers(felt),
          }}
        />
      )}

      {showPhoto && isFramedArt && (
        <img
          src={assetUrl(felt.textureUrl)}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full pointer-events-none select-none"
          style={getFramePhotoImgStyle(felt, compact)}
        />
      )}

      {showPhoto && !isFramedArt && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("${assetUrl(felt.textureUrl)}")`,
            ...getPhotoTextureStyle(felt, compact),
          }}
        />
      )}

      {/* Cloth body for standard felts + subtle underlay on themed ones */}
      {(isFabric || fabricStrength > 0) && !isPhotoOnly && (
        <>
          <div
            className="absolute inset-0 pointer-events-none mix-blend-multiply"
            style={{
              opacity: (isFabric ? 0.55 : 0.35 * fabricStrength) * overlay,
              backgroundImage: `${nap.primary}, ${nap.cross}`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              opacity: (isFabric ? 0.42 : 0.28 * fabricStrength) * overlay,
              backgroundImage: nap.shear,
            }}
          />
        </>
      )}

      {!isFramedArt && <FeltThemeOverlay felt={felt} compact={compact} intense={intense} />}

      {/* Wool fuzz — directional fiber noise */}
      {!isFramedArt && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            opacity: (compact ? 0.45 : 0.58) * overlay,
            backgroundImage: getFeltFiberNoiseUrl(),
            backgroundSize: compact ? "128px 128px" : "192px 192px",
          }}
        />
      )}

      {/* Micro speckle — individual raised fibers */}
      {!isFramedArt && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-soft-light"
          style={{
            opacity: (compact ? 0.35 : 0.48) * overlay,
            backgroundImage: `
              radial-gradient(circle at 14% 22%, rgba(255,255,255,0.2) 0.4px, transparent 0.8px),
              radial-gradient(circle at 41% 67%, rgba(0,0,0,0.24) 0.4px, transparent 0.8px),
              radial-gradient(circle at 73% 28%, rgba(255,255,255,0.14) 0.4px, transparent 0.8px),
              radial-gradient(circle at 86% 74%, rgba(0,0,0,0.2) 0.4px, transparent 0.8px),
              radial-gradient(circle at 28% 88%, rgba(255,255,255,0.16) 0.4px, transparent 0.8px),
              radial-gradient(circle at 58% 12%, rgba(0,0,0,0.18) 0.4px, transparent 0.8px)
            `,
            backgroundSize: compact
              ? "6px 6px, 7px 7px, 8px 8px, 5px 5px, 6px 6px, 7px 7px"
              : "8px 8px, 10px 10px, 12px 12px, 7px 7px, 9px 9px, 11px 11px",
          }}
        />
      )}

      {/* Play-wear — dice rolling wears the center over time */}
      {isFabric && !isPhotoOnly && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-multiply"
          style={{
            opacity: compact ? 0.35 : 0.48,
            background:
              "radial-gradient(ellipse 58% 48% at 50% 54%, rgba(0,0,0,0.1) 0%, transparent 72%)",
          }}
        />
      )}

      {!isFramedArt && (
        <>
          {/* Pool-hall lamp */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={lighting.overhead}
          />

          {/* Nap-direction sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={lighting.napSheen}
          />
        </>
      )}

      {!isFramedArt && (
        <>
          {/* Edge compression from years of elbows */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 0% 0%, rgba(0,0,0,${wearOpacity * 0.55}) 0%, transparent 28%),
                radial-gradient(circle at 100% 0%, rgba(0,0,0,${wearOpacity * 0.55}) 0%, transparent 28%),
                radial-gradient(circle at 0% 100%, rgba(0,0,0,${wearOpacity * 0.65}) 0%, transparent 32%),
                radial-gradient(circle at 100% 100%, rgba(0,0,0,${wearOpacity * 0.65}) 0%, transparent 32%)
              `,
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,${vignetteStrength}) 100%)`,
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={lighting.rim}
          />
        </>
      )}

      {/* Velvet/table rails catch a hairline highlight on fabric felts */}
      {isFabric && theme !== "velvet" && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        />
      )}
    </>
  );
}
