import React, { useRef } from "react";
import { motion } from "framer-motion";
import { getSkin } from "@/lib/shopCatalog";
import Pip from "./Pip";
import LightningOverlay from "./LightningOverlay";
import FishOverlay from "./FishOverlay";
import SnowGlobeOverlay from "./SnowGlobeOverlay";

// Pip grid positions for each face value.
// Grid is 3x3. 1 = pip present, 0 = empty.
const PIP_LAYOUTS = {
  1: [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0]],

  2: [
  [1, 0, 0],
  [0, 0, 0],
  [0, 0, 1]],

  3: [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]],

  4: [
  [1, 0, 1],
  [0, 0, 0],
  [1, 0, 1]],

  5: [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1]],

  6: [
  [1, 0, 1],
  [1, 0, 1],
  [1, 0, 1]]

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

export default function Die({
  value = 1,
  held = false,
  selected = false,
  used = false,
  rolling = false,
  onClick,
  size = 64,
  skinId = "classic_white",
  bigFishVariantIndex = 0,
  bigFishExtraScale = 1
}) {
  const layout = PIP_LAYOUTS[value] || PIP_LAYOUTS[1];
  const skin = getSkin(skinId);
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
    if (used) return "none";
    if (held) return `0 0 0 ${Math.round(size * 0.07)}px #fcd34d`;
    if (selected) return `0 0 0 ${Math.round(size * 0.05)}px rgba(52,211,153,0.6)`;
    return "none";
  };

  return (
    <motion.div
      key={rolling ? rollKey.current : "idle"}
      className="flex-shrink-0"
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
      
      <button
        type="button"
        onClick={onClick}
        disabled={used || rolling}
        className={`relative w-full h-full ${skin.id !== "classic_white" && !skin.videoUrl ? `bg-gradient-to-br ${skin.gradient}` : ""} ${used ? "opacity-20 grayscale cursor-not-allowed" : ""}`}
        style={{
          borderRadius: radius,
          boxShadow: buildShadow(),
          overflow: "hidden",
          background: skin.id === "classic_white" || skin.videoUrl ? "transparent" : undefined,
          ...squircleStyle
        }}>
        
        {/* Video background skin — cropped 3x2 grid, zoomed 3x centered in each cell */}
        {skin.videoUrl && (() => {
          const zoom = 3.0;
          const cols = 3;
          const rows = 2;
          const col = (value - 1) % cols;
          const row = Math.floor((value - 1) / cols);
          // Container is the die. Video is sized so one cell == one die.
          // Zoom in by scaling video to (cols*zoom) x (rows*zoom) of die size,
          // and translating so the centered region of the cell aligns with the die.
          const videoW = cols * zoom; // multiples of die width
          const videoH = rows * zoom; // multiples of die height
          // Center of the cell in video units (die widths): col + 0.5
          // Translate so that center lands at die center (0.5, 0.5)
          // ✅ APPROVED Plasma orb offsets — do not change
          const FACE_TX_OFFSET = { 1: -0.3, 2: -3.8, 3: -7.0, 4: -1.3, 5: -3.1, 6: -6.8 };
          const FACE_TY_OFFSET = { 1: -0.05, 2: 0, 3: 0, 4: -3, 5: -3, 6: -3 };
          const tx = (col + 0.5) * zoom - 0.5 + (FACE_TX_OFFSET[value] || 0); // in die widths (per-face right shift)
          const ty = (row + 0.5) * zoom - 0.5 + (FACE_TY_OFFSET[value] || 0); // in die heights (per-face down shift)
          return (
            <div
              className="absolute overflow-hidden pointer-events-none"
              style={{ borderRadius: radius, top: -9, left: -9, right: -9, bottom: -9 }}
            >
              <video
                src={skin.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: `${videoW * 100}%`,
                  height: `${videoH * 100}%`,
                  transform: `translate(${(-tx / videoW) * 100}%, ${(-ty / videoH) * 100}%)`,
                  transformOrigin: "top left",
                  objectFit: "cover",
                }}
              />
              {!rolling && (
                <>
                  {/* Pink translucent glass tint */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at 35% 30%, rgba(255,192,225,0.45) 0%, rgba(255,105,180,0.35) 55%, rgba(255,20,147,0.45) 100%)",
                      mixBlendMode: "screen",
                    }}
                  />
                  {/* Pink glass rim + highlights */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: radius,
                      boxShadow:
                        "inset 0 0 0 2px rgba(255,210,230,0.55), inset 0 -6px 14px rgba(255,20,147,0.45), inset 0 4px 10px rgba(255,225,240,0.55)",
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
          const AQUA_X_OFFSET = { 3: -size * 0.03, 4: -size * 0.01, 5: -size * 0.03, 6: -size * 0.04 };
          const AQUA_Y_OFFSET = { 1: 0, 3: size * 0.01, 4: -size * 0.04 };
          const FACE_X_OFFSET = { 2: -size * 0.015, 3: -size * 0.022, 5: -size * 0.022, 6: -size * 0.032 };
          const FACE_Y_OFFSET = { 1: -size * 0.01, 2: -size * 0.01, 3: -size * 0.01, 4: -size * 0.04, 5: -size * 0.05, 6: -size * 0.045 };
          const xNudge = AQUA_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0);
          const yNudge = AQUA_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0);
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
          const AQUA_X_OFFSET = { 3: -size * 0.03, 4: -size * 0.01, 5: -size * 0.03, 6: -size * 0.04 };
          const AQUA_Y_OFFSET = { 1: 0, 3: size * 0.01, 4: -size * 0.04 };
          const FACE_X_OFFSET = { 2: -size * 0.015, 3: -size * 0.022, 5: -size * 0.022, 6: -size * 0.032 };
          const FACE_Y_OFFSET = { 1: -size * 0.01, 2: -size * 0.01, 3: -size * 0.01, 4: -size * 0.04, 5: -size * 0.05, 6: -size * 0.045 };
          const xNudge = AQUA_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0);
          const yNudge = AQUA_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0);
          return (
            <>
              {/* Fish swim behind — one per pip on the face */}
              <FishOverlay size={size} radius={radius} count={value} bigFishVariantIndex={bigFishVariantIndex} bigFishExtraScale={bigFishExtraScale} />
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

        {/* Sprite sheet texture or pip grid */}
        {skin.id !== "blue_gel" && skin.id !== "snow_globe" && skin.spriteUrl ?
        (() => {
          const cellW = size * 1.7;
          const cellH = size * 1.32;
          const cols = skin.spriteGrid?.cols ?? 3;
          const rows = skin.spriteGrid?.rows ?? 2;
          const col = (value - 1) % cols;
          const row = Math.floor((value - 1) / cols);
          // Per-face nudges (in px) — corrects misaligned sprite cells
          const FACE_X_OFFSET = { 2: -size * 0.015, 3: -size * 0.022, 5: -size * 0.022, 6: -size * 0.032 };
          const FACE_Y_OFFSET = { 1: -size * 0.01, 2: -size * 0.01, 3: -size * 0.01, 4: -size * 0.04, 5: -size * 0.05, 6: -size * 0.045 };
          // Classic White needs slightly different per-face Y tuning
          const CLASSIC_WHITE_Y_OFFSET = { 1: size * 0.012, 2: size * 0.012, 3: size * 0.018, 4: -size * 0.045, 6: -size * 0.05 };
          // Gold needs slightly different per-face Y tuning
          const GOLD_Y_OFFSET = { 5: -size * 0.03 };
          // Damascus (obsidian) per-face Y tuning
          const OBSIDIAN_Y_OFFSET = { 5: -size * 0.03 };
          // Burl Wood per-face tuning
          const WOOD_Y_OFFSET = { 1: -size * 0.02, 2: -size * 0.02, 3: -size * 0.025, 5: -size * 0.035, 6: -size * 0.02 };
          const WOOD_X_OFFSET = { 3: size * 0.02, 5: size * 0.02, 6: size * 0.02 };
          const SILVER_X_OFFSET = { 1: size * 0.02, 2: size * 0.02, 3: size * 0.02, 4: size * 0.02, 5: size * 0.02, 6: size * 0.02 };
          const GALAXY_X_OFFSET = { 1: size * 0.01, 2: size * 0.02, 3: size * 0.025, 4: size * 0.01, 5: size * 0.02, 6: size * 0.025 };
          const DRAGON_X_OFFSET = { 2: size * 0.015, 3: size * 0.015, 5: size * 0.01, 6: size * 0.015 };
          const AMETHYST_X_OFFSET = { 2: size * 0.015, 3: -size * 0.005, 6: size * 0.015 };
          const LAVA_X_OFFSET = { 2: -size * 0.005, 3: -size * 0.005, 5: 0, 6: 0 };
          const LAVA_Y_OFFSET = { 1: -size * 0.035, 2: -size * 0.035, 3: -size * 0.035, 4: -size * 0.045, 5: -size * 0.045, 6: -size * 0.045 };
          const MOONSTONE_X_OFFSET = { 1: size * 0.03, 2: size * 0.035, 3: size * 0.035, 4: size * 0.04, 5: size * 0.035, 6: size * 0.035 };
          const MOONSTONE_Y_OFFSET = { 1: size * 0.01, 2: size * 0.005, 3: size * 0.0075, 4: size * 0.003, 5: size * 0.003, 6: size * 0.003 };
          const SILVER_Y_OFFSET = { 1: -size * 0.015, 2: -size * 0.015, 3: -size * 0.015 };
          const GALAXY_Y_OFFSET = { 1: size * 0.005, 2: size * 0.005, 3: size * 0.005, 4: -size * 0.005, 5: -size * 0.005, 6: -size * 0.005 };
          const DRAGON_Y_OFFSET = { 5: -size * 0.025 };
          const AMETHYST_Y_OFFSET = { 1: -size * 0.025, 2: -size * 0.025, 3: -size * 0.025, 4: -size * 0.035, 5: -size * 0.035, 6: -size * 0.035 };
          const PLASMA_X_OFFSET = { 1: -size * 0.03, 2: -size * 0.06, 3: -size * 0.11, 4: -size * 0.02, 5: -size * 0.085, 6: -size * 0.12 };
          const PLASMA_Y_OFFSET = { 1: size * 0.01, 2: size * 0.02, 3: size * 0.02, 4: -size * 0.06, 5: -size * 0.06, 6: -size * 0.045 };
          const PAPER_X_OFFSET = { 1: -2, 2: size * 0.01 - 11, 3: size * 0.01 - 18, 4: -3, 5: size * 0.01 - 12, 6: size * 0.01 - 19 };
          const PAPER_Y_OFFSET = { 1: -size * 0.015 + 2, 2: -size * 0.015 + 3, 3: -size * 0.02 + 3, 4: -size * 0.04 - 3, 5: -size * 0.04 - 3, 6: -size * 0.04 - 4 };
          const TEAL2_X_OFFSET = { 2: size * 0.01, 3: size * 0.01, 5: size * 0.01, 6: size * 0.01 };
          const TEAL2_Y_OFFSET = { 1: -size * 0.015, 2: -size * 0.015, 3: -size * 0.02, 4: -size * 0.04, 5: -size * 0.04, 6: -size * 0.04 };
          const COPPER2_X_OFFSET = { 2: size * 0.01, 3: size * 0.01, 5: size * 0.01, 6: size * 0.01 };
          const COPPER2_Y_OFFSET = { 1: -size * 0.015, 2: -size * 0.015, 3: -size * 0.02, 4: -size * 0.04, 5: -size * 0.04, 6: -size * 0.04 };
          const LOVE_X_OFFSET = { 2: -size * 0.11, 3: -size * 0.23, 4: -size * 0.01, 5: size * 0.01 - 15, 6: size * 0.01 - 24 };
          const LOVE_Y_OFFSET = { 1: -size * 0.005, 2: -size * 0.005, 3: -size * 0.005, 4: -size * 0.05, 5: -size * 0.05, 6: -size * 0.04 };
          const CRYSTAL_CUT_X_OFFSET = { 2: -size * 0.0925, 3: -size * 0.175, 4: -size * 0.03, 5: -size * 0.105, 6: -size * 0.19 };
          const CRYSTAL_CUT_Y_OFFSET = { 4: -size * 0.06, 5: -size * 0.0525, 6: -size * 0.0525 };
          // Football (leather) per-face tuning
          const LEATHER_X_OFFSET = { 1: -size * 0.01, 2: -size * 0.13, 3: -size * 0.255, 4: -size * 0.025, 5: -size * 0.14, 6: -size * 0.26 };
          const LEATHER_Y_OFFSET = { 1: size * 0.01, 2: size * 0.02, 3: size * 0.035, 4: -size * 0.065, 5: -size * 0.06, 6: -size * 0.07 };
          // Frozen Ice per-face tuning — start with default + half-nudge down on all faces
          const ICE_Y_OFFSET = { 1: -size * 0.005, 2: -size * 0.005, 3: -size * 0.005, 4: -size * 0.035, 5: -size * 0.045, 6: -size * 0.04 };
          const ICE_X_OFFSET = { 3: -size * 0.03, 6: -size * 0.03 };
          // Aquamarine per-face tuning
          const AQUA_X_OFFSET = { 3: -size * 0.03, 4: -size * 0.01, 5: -size * 0.03, 6: -size * 0.04 };
          const AQUA_Y_OFFSET = { 1: 0, 3: size * 0.01, 4: -size * 0.04 };
          // Baseball per-face tuning
          const BASEBALL_X_OFFSET = { 1: -size * 0.03, 2: -size * 0.15, 3: -size * 0.27, 4: -size * 0.02, 5: -size * 0.1, 6: -size * 0.15 };
          const BASEBALL_Y_OFFSET = { 1: size * 0.01, 2: size * 0.01, 3: size * 0.02, 4: -size * 0.02 };
          // Aquamarine Ice per-face tuning
          const AQUA_LIGHT_X_OFFSET = { 1: size * 0.005, 2: -size * 0.02, 3: -size * 0.03, 4: -size * 0.01, 5: -size * 0.025, 6: -size * 0.035 };
          const AQUA_LIGHT_Y_OFFSET = { 1: 0, 2: 0, 3: 0, 4: -size * 0.05, 5: -size * 0.045, 6: -size * 0.05 };
          // Pride per-face tuning
          const PRIDE_X_OFFSET = { 1: -size * 0.01, 2: -size * 0.14, 3: -size * 0.26, 4: -size * 0.02, 5: -size * 0.15, 6: -size * 0.24 };
          const PRIDE_Y_OFFSET = { 2: size * 0.02, 3: size * 0.03, 4: -size * 0.07, 5: -size * 0.06, 6: -size * 0.06 };
          // Tennis Ball (yellow_felt) per-face tuning
          const TENNIS_X_OFFSET = { 1: -size * 0.02, 2: -size * 0.13, 3: -size * 0.25, 4: -size * 0.05, 5: -size * 0.15, 6: -size * 0.27 };
          const TENNIS_Y_OFFSET = { 4: -size * 0.07, 5: -size * 0.08, 6: -size * 0.07 };
          // Circuit Board per-face tuning
          const CIRCUIT_X_OFFSET = { 1: -3, 2: -18, 3: -31, 4: -2, 5: -17, 6: -29 };
          const CIRCUIT_Y_OFFSET = { 1: 5, 2: 4, 3: 4, 4: -7, 5: -10, 6: -9 };
          // Amber Wasp per-face tuning
          const AMBER_WASP_X_OFFSET = { 1: 4, 2: 4, 3: 4, 4: 4, 5: 3.5, 6: 5 };
          const AMBER_WASP_Y_OFFSET = { 1: 2, 2: 2, 3: 2, 4: 0.5, 5: 1, 6: 1 };
          // Radiation (toxic_plasma_v2) per-face tuning
          const TOXIC2_X_OFFSET = { 2: -4, 3: -7, 4: -1, 5: -4, 6: -7 };
          const TOXIC2_Y_OFFSET = { 4: -4 };
          // Cash per-face tuning
          const CASH_X_OFFSET = { 1: -1, 2: -9, 3: -17, 4: -2, 5: -9, 6: -18 };
          const CASH_Y_OFFSET = { 1: 1, 2: 1, 3: 2, 4: -7, 5: -6, 6: -6 };
          // Bullet Holes per-face tuning
          const BULLET_HOLES_X_OFFSET = { 3: -3, 4: 0, 5: -2.5, 6: -3.5 };
          const BULLET_HOLES_Y_OFFSET = { 1: 1, 2: 1, 3: 1, 4: -5 };
          // Shattered (cracked) per-face tuning
          const CRACKED_X_OFFSET = { 3: -3, 4: 0 };
          const CRACKED_Y_OFFSET = { 1: 1, 2: 1, 3: 1, 4: -4 };
          // Bloodstone per-face tuning
          const BLOODSTONE_X_OFFSET = { 1: -size * 0.044, 2: -size * 0.156, 3: -size * 0.278, 4: -size * 0.044, 5: -size * 0.189, 6: -size * 0.300 };
          const BLOODSTONE_Y_OFFSET = { 4: -size * 0.078, 5: -size * 0.078, 6: -size * 0.067 };
          // Labradorite per-face tuning
          const LABRADORITE_X_OFFSET = { 2: 2, 3: 4, 4: 2, 5: 2, 6: 2 };
          const LABRADORITE_Y_OFFSET = {};
          // Labradorite Polished per-face tuning
          const LABRADORITE_POLISHED_X_OFFSET = { 2: -10, 3: -18, 4: -2, 5: -10, 6: -18 };
          const LABRADORITE_POLISHED_Y_OFFSET = { 4: -8, 5: -8, 6: -8 };
          // Blue Gel per-face tuning
          const BLUE_GEL_X_OFFSET = { 1: -1, 3: -size * 0.01 };
          const BLUE_GEL_Y_OFFSET = { 1: 1, 2: size * 0.01 };
          // Ruby per-face tuning
          const RUBY_X_OFFSET = {};
          const RUBY_Y_OFFSET = { 1: -size * 0.01 - 1, 2: -size * 0.01 - 1, 3: -size * 0.01 - 1, 4: -size * 0.04 - 1, 5: -size * 0.05 - 1, 6: -size * 0.045 - 1 };
          // Neon Grid per-face tuning
          const NEON_GRID_X_OFFSET = { 1: -3, 2: -16, 3: -25, 4: -4, 5: -15, 6: -25 };
          const NEON_GRID_Y_OFFSET = { 4: -8, 5: -7, 6: -7 };

          const xNudge = skin.id === "wood"
            ? (WOOD_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "silver"
            ? (SILVER_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "galaxy"
            ? (GALAXY_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "dragon_scale"
            ? (DRAGON_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "amethyst"
            ? (AMETHYST_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "moonstone"
            ? (MOONSTONE_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "lava"
            ? (LAVA_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "plasma"
            ? (PLASMA_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "paper"
            ? (PAPER_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "teal_crackle_v2"
            ? (TEAL2_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "copper_v2"
            ? (COPPER2_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "love_is_love"
            ? (LOVE_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "crystal_cut"
            ? (CRYSTAL_CUT_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "leather"
            ? (LEATHER_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "ice"
            ? (ICE_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "aquamarine"
            ? (AQUA_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "baseball"
            ? (BASEBALL_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "aquamarine_light"
            ? (AQUA_LIGHT_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "pride"
            ? (PRIDE_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "yellow_felt"
            ? (TENNIS_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "circuit_board"
            ? (CIRCUIT_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "amber_wasp"
            ? (AMBER_WASP_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "toxic_plasma_v2"
            ? (TOXIC2_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "cash"
            ? (CASH_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "bullet_holes"
            ? (BULLET_HOLES_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "cracked"
            ? (CRACKED_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "bloodstone"
            ? (BLOODSTONE_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "labradorite"
            ? (LABRADORITE_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "labradorite_polished"
            ? (LABRADORITE_POLISHED_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "ruby"
            ? (RUBY_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "blue_gel"
            ? (BLUE_GEL_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : skin.id === "neon_grid"
            ? (NEON_GRID_X_OFFSET[value] ?? (FACE_X_OFFSET[value] || 0))
            : (FACE_X_OFFSET[value] || 0);
          const yNudge = skin.id === "classic_white"
            ? (CLASSIC_WHITE_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "gold"
            ? (GOLD_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "obsidian"
            ? (OBSIDIAN_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "wood"
            ? (WOOD_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "silver"
            ? (SILVER_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "galaxy"
            ? (GALAXY_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "dragon_scale"
            ? (DRAGON_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "amethyst"
            ? (AMETHYST_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "moonstone"
            ? (MOONSTONE_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "lava"
            ? (LAVA_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "plasma"
            ? (PLASMA_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "paper"
            ? (PAPER_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "teal_crackle_v2"
            ? (TEAL2_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "copper_v2"
            ? (COPPER2_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "love_is_love"
            ? (LOVE_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "crystal_cut"
            ? (CRYSTAL_CUT_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "leather"
            ? (LEATHER_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "ice"
            ? (ICE_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "aquamarine"
            ? (AQUA_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "baseball"
            ? (BASEBALL_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "aquamarine_light"
            ? (AQUA_LIGHT_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "pride"
            ? (PRIDE_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "yellow_felt"
            ? (TENNIS_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "circuit_board"
            ? (CIRCUIT_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "amber_wasp"
            ? (AMBER_WASP_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "toxic_plasma_v2"
            ? (TOXIC2_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "cash"
            ? (CASH_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "bullet_holes"
            ? (BULLET_HOLES_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "cracked"
            ? (CRACKED_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "bloodstone"
            ? (BLOODSTONE_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "labradorite"
            ? (LABRADORITE_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "labradorite_polished"
            ? (LABRADORITE_POLISHED_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "ruby"
            ? (RUBY_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "blue_gel"
            ? (BLUE_GEL_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : skin.id === "neon_grid"
            ? (NEON_GRID_Y_OFFSET[value] ?? (FACE_Y_OFFSET[value] || 0))
            : (FACE_Y_OFFSET[value] || 0);
          const MOONSTONE_EXTRA_STRETCH = { 3: size * 0.015, 4: size * 0.015, 5: size * 0.015, 6: size * 0.015 };
          const AMBER_WASP_STRETCH = { 1: size * 0.065, 2: size * 0.065, 3: size * 0.065, 4: size * 0.065, 5: size * 0.065, 6: size * 0.065 };
          const stretch = skin.id === "moonstone"
            ? size * 0.0375 + (MOONSTONE_EXTRA_STRETCH[value] || 0)
            : skin.id === "amber_wasp"
            ? (AMBER_WASP_STRETCH[value] || 0)
            : skin.id === "galaxy"
            ? size * 0.04
            : 0;
          return (
            <div
              className="absolute pointer-events-none"
              style={{
                top: `${-size * 0.14 + yNudge - stretch}px`,
                bottom: `${-size * 0.8 + yNudge - stretch}px`,
                left: `${-size * 0.35 + xNudge - stretch}px`,
                right: `${-size * 0.35 + xNudge - stretch}px`,
                borderRadius: radius,
                backgroundImage: `url(${skin.spriteUrl})`,
                backgroundSize: `${cellW * cols + stretch * 2}px ${cellH * rows + stretch * 2}px`,
                backgroundPosition: `${-(col * (cellW + stretch * 2 / cols))}px ${-(row * (cellH + stretch * 2 / rows))}px`,
                backgroundRepeat: 'no-repeat',
              }} />
          );
        })() :


        skin.id !== "blue_gel" && skin.id !== "snow_globe" && <div
          className="absolute grid grid-cols-3 grid-rows-3"
          style={{ inset: padding, gap: Math.round(size * 0.045) }}>
          
            {layout.flat().map((p, i) => {
              // For the Diamond skin, cycle pip animations: glow → shinyStar → blackHole
              const diamondEffects = ["glow", "shinyStar", "blackHole"];
              const effect = skin.id === "diamond" ? diamondEffects[i % 3] : null;
              return (
                <div key={i} className="flex items-center justify-center">
                  {p === 1 && (
                    <Pip
                      size={pipSize}
                      colorClass={skin.pipColor}
                      inset={skin.realistic}
                      animationEffect={effect}
                    />
                  )}
                </div>
              );
            })}
          </div>
        }



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

        {/* Held indicator — pulsing amber glow + checkmark */}
        {held && !used &&
        <>
            <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-black font-black text-xs pointer-events-none">
            
              ✓
            </motion.div>
          </>
        }
      </button>
    </motion.div>);

}