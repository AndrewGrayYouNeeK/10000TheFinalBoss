import React from "react";
import { motion } from "framer-motion";
import PortfolioDieEffect from "./portfolio/PortfolioEffects";

/** Renders procedural body for experimental / preview dice from skin.style config */
export default function ExperimentalDieBody({
  style,
  radius,
  scoreFill = 0.5,
  layout,
  size = 64,
  dieSeed = 0,
  frozen = false,
}) {
  if (!style) return null;

  if (style.effectId) {
    return (
      <PortfolioDieEffect
        effectId={style.effectId}
        radius={radius}
        scoreFill={scoreFill}
        layout={layout}
        size={size}
        dieSeed={dieSeed}
        frozen={frozen}
      />
    );
  }

  const {
    kind = "clear",
    fill,
    edgeColor = "rgba(255,255,255,0.2)",
    edgeWidth = 1,
    edgeGlow,
    highlight,
    backdropBlur = 0,
    shimmer = false,
    phantomPulse = false,
  } = style;

  const base = { borderRadius: radius };
  const phantomTransition = {
    duration: 4.2,
    repeat: Infinity,
    ease: "easeInOut",
    times: [0, 0.22, 0.3, 0.72, 0.82, 1],
  };

  if (kind === "clear" || kind === "glass") {
    const body = (
      <>
        {fill && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              ...base,
              background: fill,
              backdropFilter: backdropBlur ? `blur(${backdropBlur}px)` : undefined,
              boxShadow: `inset 0 0 0 ${edgeWidth}px ${edgeColor}${edgeGlow ? `, ${edgeGlow}` : ""}`,
            }}
          />
        )}
        {!fill && edgeColor && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              ...base,
              boxShadow: `inset 0 0 0 ${edgeWidth}px ${edgeColor}${edgeGlow ? `, ${edgeGlow}` : ""}`,
            }}
          />
        )}
        {highlight && (
          <div className="absolute inset-0 pointer-events-none opacity-50" style={{ ...base, background: highlight }} />
        )}
        {shimmer && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              ...base,
              background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)",
            }}
          />
        )}
      </>
    );

    if (phantomPulse) {
      return (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [1, 0.45, 0, 0, 0.45, 1] }}
          transition={phantomTransition}
        >
          {body}
        </motion.div>
      );
    }

    return body;
  }

  return null;
}

export function getExperimentalShadow(style, size, state = {}) {
  if (!style) return "none";
  const { used, held, selected, heldStyleId = "amber_glow" } = state;
  if (used) return "none";
  if (held && heldStyleId === "corner_badge") return `0 0 0 ${Math.round(size * 0.07)}px #fcd34d`;
  if (held) return `0 0 ${Math.round(size * 0.12)}px rgba(251,191,36,0.25)`;
  if (selected) return `0 0 0 ${Math.round(size * 0.05)}px rgba(52,211,153,0.6)`;
  if (style.outerShadow) return style.outerShadow.replace(/\{size\}/g, String(size));
  if (style.kind === "clear" && style.edgeColor) {
    return `0 0 0 1px ${style.edgeColor}, 0 0 ${Math.round(size * 0.18)}px rgba(120,200,255,0.12)`;
  }
  if (style.accentGlow) {
    return `0 0 ${Math.round(size * 0.2)}px ${style.accentGlow}, 0 0 ${Math.round(size * 0.08)}px ${style.accentGlow}`;
  }
  if (style.effectId) {
    return `0 0 ${Math.round(size * 0.12)}px rgba(0,0,0,0.5), 0 0 ${Math.round(size * 0.06)}px rgba(255,255,255,0.08)`;
  }
  return "none";
}

export function isExperimentalClearBody(skin) {
  return skin?.experimental && skin.category === "spectral";
}
