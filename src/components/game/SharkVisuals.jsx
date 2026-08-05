import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AquariumBubbles } from "@/components/game/AquariumBubbles";

/** WAAPI rejects negative durations — clamp before framer-motion. */
function safeAnimDuration(seconds, min = 0.001) {
  const n = Number(seconds);
  return Number.isFinite(n) ? Math.max(min, n) : min;
}

const FROZEN_TRANSITION = { duration: 0 };

/** Constant cruise — linear so segments never ease-to-a-stop at keyframes. */
const SWIM_EASE = "linear";
const TAIL_SWAY_EASE = [0.35, 0.05, 0.35, 0.95];
const TAIL_SWAY_DURATION = 1.18;

function hashSeed(...parts) {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    }
  }
  return h >>> 0;
}

function seededUnit(seed) {
  return (seed % 10000) / 10000;
}

function seededIndex(seed, max) {
  if (max <= 0) return 0;
  return seed % max;
}

/**
 * Shark Tank species — mostly great whites (clear GW silhouette + age/size variety),
 * plus a killer whale so trays actually show an orca. Tiger / hammerhead stay rare.
 * All rendering is procedural SVG — no image assets. Shark Tank stays gray/silver
 * (no blue) except the black/white orca.
 */
export const SHARK_VARIANTS = [
  {
    id: "great_white",
    name: "Great White",
    // IMG_2272 charcoal dorsum / silver mid / crisp white belly
    top: "#2c3138",
    body: "#3a414c",
    belly: "#f8fafc",
    fin: "#1e232b",
    highlight: "#7a8494",
    gill: "#12161c",
    eye: "#0a0a0a",
    pupil: "#111827",
    hammerhead: false,
    orca: false,
    greatWhite: true,
    age: "adult",
  },
  {
    id: "great_white_juvenile",
    name: "Young Great White",
    top: "#3d4654",
    body: "#4e5868",
    belly: "#f8fafc",
    fin: "#2c3542",
    highlight: "#96a0ae",
    gill: "#1c2430",
    eye: "#0a0a0a",
    pupil: "#1e293b",
    hammerhead: false,
    orca: false,
    greatWhite: true,
    age: "juvenile",
  },
  {
    id: "great_white_bull",
    name: "Bull Great White",
    top: "#22262e",
    body: "#2e343e",
    belly: "#f1f5f9",
    fin: "#151920",
    highlight: "#6e7684",
    gill: "#0c0f14",
    eye: "#050505",
    pupil: "#020617",
    hammerhead: false,
    orca: false,
    greatWhite: true,
    age: "bull",
  },
  {
    id: "orca",
    name: "Killer Whale",
    top: "#0a0a0a",
    body: "#111111",
    belly: "#f8fafc",
    fin: "#050505",
    highlight: "#e5e7eb",
    gill: "#1f2937",
    eye: "#0f172a",
    pupil: "#020617",
    eyePatch: "#f8fafc",
    saddle: "#9ca3af",
    hammerhead: false,
    orca: true,
    greatWhite: false,
  },
  {
    id: "tiger",
    name: "Tiger Shark",
    top: "#3f3f46",
    body: "#52525b",
    belly: "#e4e4e7",
    fin: "#27272a",
    highlight: "#a1a1aa",
    gill: "#18181b",
    eye: "#0f172a",
    pupil: "#09090b",
    hammerhead: false,
    orca: false,
    greatWhite: false,
    stripes: true,
  },
  {
    id: "hammerhead",
    name: "Hammerhead",
    top: "#52525b",
    body: "#71717a",
    belly: "#e4e4e7",
    fin: "#3f3f46",
    highlight: "#a1a1aa",
    gill: "#27272a",
    eye: "#0f172a",
    pupil: "#18181b",
    hammerhead: true,
    orca: false,
    greatWhite: false,
  },
];

const GREAT_WHITE_VARIANTS = SHARK_VARIANTS.filter((v) => v.greatWhite);
const ORCA_VARIANT = SHARK_VARIANTS.find((v) => v.orca);
const TIGER_VARIANT = SHARK_VARIANTS.find((v) => v.id === "tiger");
const HAMMERHEAD_VARIANT = SHARK_VARIANTS.find((v) => v.id === "hammerhead");

/** Killer whales are larger than adult sharks, but must stay clip-friendly on mobile. */
const ORCA_SCALE_MULTIPLIER = 1.35;
/** Die-face width fraction — great whites read clearly; orcas still a bit wider. */
const SHARK_WIDTH_FRAC = 0.58;
const ORCA_WIDTH_FRAC = 0.64;
/** Height/width of the swim box — orca taller for upright dorsal + fluke beat. */
const SHARK_ASPECT = 0.40;
const HAMMERHEAD_ASPECT = 0.36;
const ORCA_ASPECT = 0.64;
/** Whale fluke beat — cycles IMG_2273 top / mid / bottom poses. */
const ORCA_FLUKE_DURATION = 0.92;
/** Rear-third peduncle undulation nested under the fluke beat. */
const ORCA_PEDUNCLE_DURATION = 0.92;

/**
 * Great white — full redraw from IMG_2272 only (head drawn facing right).
 * Fusiform charcoal/white body, conical snout, 5 gills, tall falcate dorsal,
 * sickle pectorals aft+down (near dark + far white/dark-tip), pelvic/anal/2nd dorsal,
 * narrow peduncle + lateral keel, near-symmetric lunate caudal, jagged mottled seam.
 */
function GreatWhiteBody({ v, chomping, showTeeth, scary, frozen, chompDelay = 0 }) {
  const jawOpen = chomping ? 1 : 0;
  const eyeColor = scary ? "#dc2626" : v.eye;
  const pupilColor = scary ? "#fecaca" : v.pupil;
  const age = v.age || "adult";
  // Age variety on top of the same IMG_2272 silhouette.
  const dorsalTipY = age === "juvenile" ? -3.8 : age === "bull" ? -10.8 : -9.2;
  const snoutTipX = age === "juvenile" ? 98.0 : age === "bull" ? 101.0 : 99.8;
  const midY = age === "bull" ? 24.5 : 24;
  const bellyDeep = age === "bull" ? 10.6 : 9.8;
  const chompStart = safeAnimDuration(chompDelay, 0);

  const mouthClosedUpper = `M 82.5 ${midY + 2.6} Q 91 ${midY + 4.0} 97.4 ${midY + 1.4}`;
  const mouthClosedLower = `M 82.5 ${midY + 4.0} Q 91.2 ${midY + 6.4} 96.8 ${midY + 3.6}`;
  const mouthOpenUpper = `M 82.5 ${midY + 2.0} Q 91 ${midY + 3.2} 97.4 ${midY + 0.8}`;
  const mouthOpenLower = `M 82.5 ${midY + 5.0} Q 91.5 ${midY + 12.8} 97.2 ${midY + 7.4}`;

  return (
    <>
      {/* Lunate caudal — near-equal crescent; upper lobe slightly longer (IMG_2272) */}
      <motion.g
        animate={frozen ? { rotate: 0 } : { rotate: [-6.5, 7.5, -6.5] }}
        transition={
          frozen
            ? FROZEN_TRANSITION
            : { duration: TAIL_SWAY_DURATION, repeat: Infinity, ease: TAIL_SWAY_EASE }
        }
        style={{ originX: "78%", originY: "50%" }}
      >
        <path
          d={`M 34.5 ${midY - 3.6}
             C 28.5 ${midY - 5.8}, 22.5 ${midY - 10.5}, 17.5 ${midY - 16.2}
             L 15.2 ${midY - 17.8}
             C 16.2 ${midY - 16.6}, 17.2 ${midY - 15.0}, 17.8 ${midY - 13.6}
             C 22.2 ${midY - 8.4}, 27.2 ${midY - 4.0}, 31.5 ${midY - 1.5}
             L 33.0 ${midY + 0.05}
             L 33.4 ${midY}
             L 33.0 ${midY - 0.05}
             L 31.5 ${midY + 1.6}
             C 26.8 ${midY + 4.8}, 21.5 ${midY + 9.8}, 17.2 ${midY + 15.0}
             L 15.4 ${midY + 16.4}
             C 20.2 ${midY + 10.6}, 26.2 ${midY + 5.4}, 34.5 ${midY + 3.6}
             C 37.0 ${midY + 1.7}, 37.0 ${midY - 1.7}, 34.5 ${midY - 3.6} Z`}
          fill={v.fin}
          stroke="rgba(2,6,23,0.35)"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Soft trailing fork */}
        <path
          d={`M 31.6 ${midY - 1.2} C 26.8 ${midY - 3.8}, 22.5 ${midY - 7.8}, 19.0 ${midY - 12.0}
             L 20.4 ${midY - 11.0}
             C 24.0 ${midY - 6.4}, 27.8 ${midY - 2.8}, 31.8 ${midY - 0.2}
             L 32.0 ${midY + 0.25}
             C 28.0 ${midY + 3.0}, 24.0 ${midY + 7.0}, 20.2 ${midY + 11.2}
             L 18.8 ${midY + 12.0}
             C 22.6 ${midY + 7.4}, 27.0 ${midY + 3.4}, 31.6 ${midY + 1.2} Z`}
          fill={v.highlight}
          opacity="0.18"
        />
        {/* Peduncle join + lateral keel */}
        <path
          d={`M 39.8 ${midY - 3.5} L 34.0 ${midY - 1.8} L 33.4 ${midY} L 34.0 ${midY + 1.8} L 39.8 ${midY + 3.3} Z`}
          fill={v.body}
          opacity="0.98"
        />
        <ellipse cx="36.0" cy={midY} rx="3.6" ry="1.15" fill={v.body} opacity="0.9" />
        <ellipse cx="36.0" cy={midY} rx="4.4" ry="0.5" fill={v.fin} opacity="0.38" />
      </motion.g>

      {/* Fusiform hull — thickest under dorsal, conical snout, long taper to peduncle */}
      <path
        d={`M ${snoutTipX} ${midY - 2.8}
           C 95.5 ${midY - 8.6}, 87.5 ${midY - 11.8}, 75.5 ${midY - 12.0}
           C 63.5 ${midY - 12.2}, 53.5 ${midY - 11.2}, 45.5 ${midY - 9.8}
           C 39.5 ${midY - 8.6}, 36.5 ${midY - 6.0}, 34.8 ${midY - 3.5}
           L 33.8 ${midY}
           L 34.8 ${midY + 3.5}
           C 36.8 ${midY + 6.6}, 40.2 ${midY + 9.2}, 46.5 ${midY + bellyDeep}
           C 58 ${midY + bellyDeep + 0.5}, 70.5 ${midY + bellyDeep + 0.2}, 82.5 ${midY + 8.8}
           C 91.5 ${midY + 7.0}, 96.8 ${midY + 3.8}, ${snoutTipX} ${midY - 0.3}
           C ${snoutTipX + 0.55} ${midY - 1.2}, ${snoutTipX + 0.5} ${midY - 2.1}, ${snoutTipX} ${midY - 2.8} Z`}
        fill={v.body}
      />

      {/* Charcoal dorsum */}
      <path
        d={`M 97.0 ${midY - 3.0}
           C 90.5 ${midY - 10.0}, 77.5 ${midY - 12.2}, 61.5 ${midY - 11.4}
           C 49.5 ${midY - 10.8}, 39.5 ${midY - 8.8}, 35.2 ${midY - 4.4}
           L 34.2 ${midY - 0.3}
           C 48 ${midY + 1.2}, 66 ${midY + 1.6}, 82 ${midY}
           C 91 ${midY - 0.8}, 95.2 ${midY - 2.0}, 97.0 ${midY - 3.0} Z`}
        fill={v.top}
        opacity="0.94"
      />

      {/*
        White belly — IMG_2272 jagged/mottled gray↔white seam:
        under snout → above eye → drips between gills → irregular flank zigzags →
        deep peduncle dip rising into caudal base.
      */}
      <path
        d={`M 97.6 ${midY + 0.2}
           L 95.4 ${midY - 2.0}
           L 93.2 ${midY + 1.0}
           L 90.8 ${midY - 2.6}
           L 88.4 ${midY + 1.4}
           L 85.8 ${midY - 1.0}
           L 83.0 ${midY + 2.8}
           L 80.0 ${midY - 0.6}
           L 77.0 ${midY + 3.6}
           L 73.8 ${midY} 
           L 70.6 ${midY + 4.0}
           L 67.2 ${midY - 0.4}
           L 63.8 ${midY + 3.4}
           L 60.4 ${midY + 0.2}
           L 57.0 ${midY + 3.8}
           L 53.6 ${midY} 
           L 50.2 ${midY + 3.0}
           L 46.8 ${midY - 0.8}
           L 43.4 ${midY + 3.6}
           L 40.2 ${midY + 0.4}
           L 37.4 ${midY + 4.0}
           L 35.0 ${midY + 1.4}
           L 33.6 ${midY + 4.4}
           C 37.0 ${midY + 8.6}, 49.5 ${midY + 10.6}, 64 ${midY + 10.4}
           C 78.5 ${midY + 10.2}, 90.5 ${midY + 7.6}, 96.8 ${midY + 3.6}
           C 98.5 ${midY + 2.2}, 98.2 ${midY + 1.0}, 97.6 ${midY + 0.2} Z`}
        fill={v.belly}
        opacity="0.99"
      />
      {/* Mottled freckles / charcoal drips along the jagged seam */}
      {[
        [94.2, midY - 0.8],
        [90.8, midY + 0.6],
        [86.8, midY - 0.6],
        [82.2, midY + 1.6],
        [77.4, midY + 0.2],
        [72.6, midY + 2.2],
        [67.6, midY + 0.4],
        [62.4, midY + 2.6],
        [57.2, midY + 0.8],
        [52.0, midY + 2.4],
        [47.0, midY + 0.6],
        [42.4, midY + 2.8],
        [38.6, midY + 1.2],
        [35.4, midY + 3.0],
      ].map(([x, y], i) => (
        <ellipse
          key={`gw-speckle-${i}`}
          cx={x}
          cy={y}
          rx={0.7 + (i % 4) * 0.22}
          ry={0.42 + (i % 3) * 0.15}
          fill={v.top}
          opacity={0.38 + (i % 3) * 0.1}
        />
      ))}

      {/* Tall falcate first dorsal — convex leading edge, free rear tip / slight notch */}
      <path
        d={`M 48.5 ${midY - 10.4}
           C 50.2 ${midY - 15.8}, 52.6 ${dorsalTipY - 0.5}, 55.0 ${dorsalTipY}
           C 56.6 ${dorsalTipY + 1.4}, 58.6 ${midY - 7.2}, 61.4 ${midY - 9.4}
           C 62.0 ${midY - 9.0}, 61.8 ${midY - 8.4}, 60.8 ${midY - 8.6}
           C 58.4 ${midY - 9.8}, 53.6 ${midY - 10.6}, 48.5 ${midY - 10.4} Z`}
        fill={v.fin}
        stroke="rgba(2,6,23,0.32)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path
        d={`M 50.5 ${midY - 10.2} L 55.0 ${dorsalTipY + 2.6} L 59.0 ${midY - 9.0} Z`}
        fill={v.highlight}
        opacity="0.15"
      />

      {/* Far-side pectoral (under belly) — pale with dark tip, as in IMG_2272 */}
      <path
        d={`M 66 ${midY + 7.2}
           C 62 ${midY + 11.5}, 56.5 ${midY + 15.0}, 51.5 ${midY + 16.2}
           C 50.2 ${midY + 16.4}, 49.6 ${midY + 15.4}, 50.4 ${midY + 14.6}
           C 54.5 ${midY + 11.5}, 59.5 ${midY + 8.2}, 64 ${midY + 6.4}
           C 65 ${midY + 6.2}, 65.6 ${midY + 6.6}, 66 ${midY + 7.2} Z`}
        fill={v.belly}
        opacity="0.92"
      />
      <path
        d={`M 53.5 ${midY + 14.8} C 52.2 ${midY + 15.6}, 51.0 ${midY + 16.0}, 50.4 ${midY + 15.0}
           C 51.8 ${midY + 14.2}, 52.8 ${midY + 14.2}, 53.5 ${midY + 14.8} Z`}
        fill={v.fin}
        opacity="0.85"
      />

      {/*
        Near-side sickle pectoral — root just aft of 5th gill, sweeps AFT and DOWN
        (toward tail / lower x). Dark upper surface.
      */}
      <path
        d={`M 68.5 ${midY + 5.0}
           C 63.2 ${midY + 11.2}, 55.8 ${midY + 18.0}, 48.0 ${midY + 20.2}
           C 46.2 ${midY + 20.5}, 45.2 ${midY + 19.2}, 46.0 ${midY + 18.0}
           C 50.8 ${midY + 12.8}, 57.2 ${midY + 7.0}, 63.8 ${midY + 4.0}
           C 65.6 ${midY + 3.4}, 67.4 ${midY + 3.8}, 68.5 ${midY + 5.0} Z`}
        fill={v.fin}
        opacity="0.98"
      />
      <path
        d={`M 67.6 ${midY + 5.2}
           C 62.2 ${midY + 10.6}, 55.5 ${midY + 16.0}, 49.2 ${midY + 18.4}
           L 63.0 ${midY + 4.4} Z`}
        fill={v.belly}
        opacity="0.28"
      />

      {/* Pelvic — mostly white with dark leading edge (~⅔ body length) */}
      <path
        d={`M 49.5 ${midY + 9.0} C 46.8 ${midY + 13.8}, 43.2 ${midY + 15.6}, 40.5 ${midY + 11.4} L 47.0 ${midY + 7.8} Z`}
        fill={v.belly}
        opacity="0.97"
      />
      <path d={`M 49.5 ${midY + 9.0} L 47.0 ${midY + 7.8} L 45.2 ${midY + 12.4} Z`} fill={v.fin} opacity="0.88" />

      {/* Anal fin — small, under second dorsal */}
      <path d={`M 40.0 ${midY + 7.8} L 37.6 ${midY + 12.0} L 35.8 ${midY + 8.0} Z`} fill={v.belly} opacity="0.9" />
      <path d={`M 40.0 ${midY + 7.8} L 38.2 ${midY + 7.4} L 37.2 ${midY + 11.0} Z`} fill={v.fin} opacity="0.75" />

      {/* Second dorsal — tiny, just ahead of peduncle */}
      <path d={`M 41.0 ${midY - 7.4} L 43.0 ${midY - 11.6} L 45.2 ${midY - 7.0} Z`} fill={v.fin} opacity="0.92" />

      {/* Five gill slits — slightly curved, just ahead of pectoral root */}
      {[81.8, 78.4, 75.0, 71.6, 68.2].map((x, i) => (
        <path
          key={`gw-gill-${x}`}
          d={`M ${x} ${midY - 5.8 - i * 0.12} Q ${x - 1.8} ${midY} ${x + 0.2} ${midY + 5.4 - i * 0.1}`}
          stroke={v.gill}
          strokeWidth="1.2"
          opacity="0.62"
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {/* Conical snout — charcoal top, white lower jaw */}
      <path
        d={`M 90.5 ${midY - 6.6}
            C 94.8 ${midY - 8.6}, 98.4 ${midY - 5.4}, ${snoutTipX} ${midY - 2.6}
            C ${snoutTipX + 0.4} ${midY - 1.5}, ${snoutTipX + 0.25} ${midY - 0.4}, ${snoutTipX - 0.5} ${midY + 0.15}
            C 96.2 ${midY + 2.6}, 92.5 ${midY + 3.4}, 89.5 ${midY + 2.9}
            Z`}
        fill={v.body}
      />
      <path
        d={`M 90.8 ${midY - 6.2} C 95.0 ${midY - 8.0}, 98.2 ${midY - 4.8}, ${snoutTipX - 0.9} ${midY - 2.8}
            C 95.8 ${midY - 5.0}, 92.8 ${midY - 5.6}, 90.8 ${midY - 5.6} Z`}
        fill={v.top}
        opacity="0.88"
      />
      <path
        d={`M 90.0 ${midY + 1.9} C 94.2 ${midY + 2.8}, 97.4 ${midY + 1.0}, ${snoutTipX - 1.9} ${midY - 0.15}
            C 95.2 ${midY + 2.4}, 92.0 ${midY + 2.8}, 90.0 ${midY + 2.8} Z`}
        fill={v.belly}
        opacity="0.97"
      />

      {/* Small solid-black eye — just above mouth corner */}
      <circle cx="88.8" cy={midY - 3.9} r="1.4" fill={eyeColor} />
      <circle cx="89.05" cy={midY - 4.1} r="0.35" fill={pupilColor} opacity="0.8" />

      {/* Slightly open mouth cavity + triangular teeth */}
      <path
        d={
          jawOpen
            ? `M 82.5 ${midY + 2.4} Q 91 ${midY + 3.8} 97.6 ${midY + 1.6} Q 94 ${midY + 12.2} 87.5 ${midY + 12.8} Q 83 ${midY + 9.6} 82.5 ${midY + 5.2} Z`
            : `M 82.5 ${midY + 2.4} Q 91 ${midY + 4.0} 97.6 ${midY + 1.8} Q 93.5 ${midY + 6.6} 87.5 ${midY + 6.2} Q 83.5 ${midY + 4.4} 82.5 ${midY + 3.4} Z`
        }
        fill="#0f172a"
        opacity="0.92"
      />
      <motion.path
        d={jawOpen ? mouthOpenUpper : mouthClosedUpper}
        stroke="#1e293b"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? { d: [mouthClosedUpper, mouthOpenUpper, mouthClosedUpper] }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.42, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      <motion.path
        d={jawOpen ? mouthOpenLower : mouthClosedLower}
        stroke="#334155"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? { d: [mouthClosedLower, mouthOpenLower, mouthClosedLower] }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.42, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      {(showTeeth || chomping) && (
        <motion.g
          initial={{ opacity: showTeeth ? 0.7 : 0 }}
          animate={
            chomping
              ? { opacity: [0.4, 0.95, 0.8, 0.3] }
              : { opacity: showTeeth ? 0.85 : 0 }
          }
          transition={
            chomping
              ? { duration: 1.05, delay: Math.max(0, chompStart - 0.18) }
              : { duration: 0.2 }
          }
        >
          {[84.2, 86.8, 89.4, 92.0, 94.6].map((x) => (
            <path
              key={`gw-tooth-${x}`}
              d={`M ${x} ${midY + 3.0} L ${x + 0.55} ${midY + 5.1} L ${x + 1.1} ${midY + 3.0} Z`}
              fill="#f8fafc"
              opacity="0.95"
            />
          ))}
        </motion.g>
      )}
    </>
  );
}

/** Tiger / generic — same IMG_2272 GW architecture + optional flank stripes. */
function StandardSharkBody({ v, chomping, showTeeth, scary, frozen, chompDelay = 0 }) {
  const jawOpen = chomping ? 1 : 0;
  const eyeColor = scary ? "#dc2626" : v.eye;
  const pupilColor = scary ? "#fecaca" : v.pupil;
  const midY = 24;
  const chompStart = safeAnimDuration(chompDelay, 0);
  const mouthClosedUpper = "M 82.5 26.6 Q 91 28.0 97.4 25.4";
  const mouthClosedLower = "M 82.5 28.0 Q 91.2 30.4 96.8 27.6";
  const mouthOpenUpper = "M 82.5 26.0 Q 91 27.2 97.4 24.8";
  const mouthOpenLower = "M 82.5 29.0 Q 91.5 36.8 97.2 31.4";

  return (
    <>
      <motion.g
        animate={frozen ? { rotate: 0 } : { rotate: [-7, 8, -7] }}
        transition={
          frozen
            ? FROZEN_TRANSITION
            : { duration: TAIL_SWAY_DURATION, repeat: Infinity, ease: TAIL_SWAY_EASE }
        }
        style={{ originX: "78%", originY: "50%" }}
      >
        <path
          d={`M 34.5 ${midY - 3.6}
             C 28.5 ${midY - 5.8}, 22.5 ${midY - 10.5}, 17.5 ${midY - 16.2}
             L 15.2 ${midY - 17.8}
             C 16.2 ${midY - 16.6}, 17.2 ${midY - 15.0}, 17.8 ${midY - 13.6}
             C 22.2 ${midY - 8.4}, 27.2 ${midY - 4.0}, 31.5 ${midY - 1.5}
             L 33.0 ${midY + 0.05}
             L 33.4 ${midY}
             L 33.0 ${midY - 0.05}
             L 31.5 ${midY + 1.6}
             C 26.8 ${midY + 4.8}, 21.5 ${midY + 9.8}, 17.2 ${midY + 15.0}
             L 15.4 ${midY + 16.4}
             C 20.2 ${midY + 10.6}, 26.2 ${midY + 5.4}, 34.5 ${midY + 3.6}
             C 37.0 ${midY + 1.7}, 37.0 ${midY - 1.7}, 34.5 ${midY - 3.6} Z`}
          fill={v.fin}
          stroke="rgba(2,6,23,0.35)"
          strokeWidth="0.55"
          strokeLinejoin="round"
        />
        <path
          d={`M 39.8 ${midY - 3.5} L 34.0 ${midY - 1.8} L 33.4 ${midY} L 34.0 ${midY + 1.8} L 39.8 ${midY + 3.3} Z`}
          fill={v.body}
          opacity="0.95"
        />
        <ellipse cx="36.0" cy={midY} rx="3.6" ry="1.15" fill={v.body} opacity="0.85" />
      </motion.g>

      <path
        d={`M 99.8 ${midY - 2.8}
           C 95.5 ${midY - 8.6}, 87.5 ${midY - 11.8}, 75.5 ${midY - 12.0}
           C 63.5 ${midY - 12.2}, 53.5 ${midY - 11.2}, 45.5 ${midY - 9.8}
           C 39.5 ${midY - 8.6}, 36.5 ${midY - 6.0}, 34.8 ${midY - 3.5}
           L 33.8 ${midY}
           L 34.8 ${midY + 3.5}
           C 36.8 ${midY + 6.6}, 40.2 ${midY + 9.2}, 46.5 ${midY + 9.8}
           C 58 ${midY + 10.3}, 70.5 ${midY + 10.0}, 82.5 ${midY + 8.8}
           C 91.5 ${midY + 7.0}, 96.8 ${midY + 3.8}, 99.8 ${midY - 0.3}
           C 100.35 ${midY - 1.2}, 100.3 ${midY - 2.1}, 99.8 ${midY - 2.8} Z`}
        fill={v.body}
      />
      <path
        d={`M 97.0 ${midY - 3.0}
           C 90.5 ${midY - 10.0}, 77.5 ${midY - 12.2}, 61.5 ${midY - 11.4}
           C 49.5 ${midY - 10.8}, 39.5 ${midY - 8.8}, 35.2 ${midY - 4.4}
           L 34.2 ${midY - 0.3}
           C 48 ${midY + 1.2}, 66 ${midY + 1.6}, 82 ${midY}
           C 91 ${midY - 0.8}, 95.2 ${midY - 2.0}, 97.0 ${midY - 3.0} Z`}
        fill={v.top}
        opacity="0.8"
      />
      <path
        d={`M 97.6 ${midY + 0.2}
           L 95.4 ${midY - 2.0} L 93.2 ${midY + 1.0} L 90.8 ${midY - 2.6}
           L 88.4 ${midY + 1.4} L 85.8 ${midY - 1.0} L 83.0 ${midY + 2.8}
           L 80.0 ${midY - 0.6} L 77.0 ${midY + 3.6} L 73.8 ${midY}
           L 70.6 ${midY + 4.0} L 67.2 ${midY - 0.4} L 63.8 ${midY + 3.4}
           L 60.4 ${midY + 0.2} L 57.0 ${midY + 3.8} L 53.6 ${midY}
           L 50.2 ${midY + 3.0} L 46.8 ${midY - 0.8} L 43.4 ${midY + 3.6}
           L 40.2 ${midY + 0.4} L 37.4 ${midY + 4.0} L 35.0 ${midY + 1.4} L 33.6 ${midY + 4.4}
           C 37.0 ${midY + 8.6}, 49.5 ${midY + 10.6}, 64 ${midY + 10.4}
           C 78.5 ${midY + 10.2}, 90.5 ${midY + 7.6}, 96.8 ${midY + 3.6}
           C 98.5 ${midY + 2.2}, 98.2 ${midY + 1.0}, 97.6 ${midY + 0.2} Z`}
        fill={v.belly}
        opacity="0.95"
      />

      {v.stripes
        ? [42, 52, 62, 72, 82].map((x, i) => (
            <path
              key={`stripe-${x}`}
              d={`M ${x} ${midY - 7.5 + (i % 2)} Q ${x + 2.5} ${midY} ${x} ${midY + 7.5 - (i % 2)}`}
              stroke="#1e293b"
              strokeWidth="2.1"
              opacity="0.4"
              fill="none"
              strokeLinecap="round"
            />
          ))
        : null}

      <path
        d={`M 48.5 ${midY - 10.4}
           C 50.2 ${midY - 15.8}, 52.6 -9.7, 55.0 -9.2
           C 56.6 -7.8, 58.6 ${midY - 7.2}, 61.4 ${midY - 9.4}
           C 62.0 ${midY - 9.0}, 61.8 ${midY - 8.4}, 60.8 ${midY - 8.6}
           C 58.4 ${midY - 9.8}, 53.6 ${midY - 10.6}, 48.5 ${midY - 10.4} Z`}
        fill={v.fin}
        stroke="rgba(2,6,23,0.3)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path
        d={`M 68.5 ${midY + 5.0}
           C 63.2 ${midY + 11.2}, 55.8 ${midY + 18.0}, 48.0 ${midY + 20.2}
           C 46.2 ${midY + 20.5}, 45.2 ${midY + 19.2}, 46.0 ${midY + 18.0}
           C 50.8 ${midY + 12.8}, 57.2 ${midY + 7.0}, 63.8 ${midY + 4.0}
           C 65.6 ${midY + 3.4}, 67.4 ${midY + 3.8}, 68.5 ${midY + 5.0} Z`}
        fill={v.fin}
        opacity="0.95"
      />
      <path
        d={`M 49.5 ${midY + 9.0} C 46.8 ${midY + 13.8}, 43.2 ${midY + 15.6}, 40.5 ${midY + 11.4} L 47.0 ${midY + 7.8} Z`}
        fill={v.belly}
        opacity="0.92"
      />
      <path d={`M 49.5 ${midY + 9.0} L 47.0 ${midY + 7.8} L 45.2 ${midY + 12.4} Z`} fill={v.fin} opacity="0.86" />
      <path d={`M 40.0 ${midY + 7.8} L 37.6 ${midY + 12.0} L 35.8 ${midY + 8.0} Z`} fill={v.fin} opacity="0.85" />
      <path d={`M 41.0 ${midY - 7.4} L 43.0 ${midY - 11.6} L 45.2 ${midY - 7.0} Z`} fill={v.fin} opacity="0.88" />

      {[81.8, 78.4, 75.0, 71.6, 68.2].map((x, i) => (
        <path
          key={`std-gill-${x}`}
          d={`M ${x} ${midY - 5.8 - i * 0.12} Q ${x - 1.8} ${midY} ${x + 0.2} ${midY + 5.4 - i * 0.1}`}
          stroke={v.gill}
          strokeWidth="1.2"
          opacity="0.55"
          fill="none"
          strokeLinecap="round"
        />
      ))}

      <path
        d="M 90.5 17.4 C 94.8 15.4 98.4 18.6 99.8 21.4 C 100.2 22.5 100.05 23.6 99.3 24.15 C 96.2 26.6 92.5 27.4 89.5 26.9 Z"
        fill={v.body}
      />
      <path d="M 90.8 17.8 C 95.0 16.0 98.2 19.2 98.9 21.2 C 95.8 19.0 92.8 18.4 90.8 18.4 Z" fill={v.top} opacity="0.65" />
      <path d="M 90.0 25.9 C 94.2 26.8 97.4 25.0 97.9 23.85 C 95.2 26.4 92.0 26.8 90.0 26.8 Z" fill={v.belly} opacity="0.9" />

      <circle cx="88.8" cy="20.1" r="1.4" fill={eyeColor} />
      <circle cx="89.05" cy="19.9" r="0.35" fill={pupilColor} opacity="0.8" />

      <path
        d={
          jawOpen
            ? "M 82.5 26.4 Q 91 27.8 97.6 25.6 Q 94 36.2 87.5 36.8 Q 83 33.6 82.5 29.2 Z"
            : "M 82.5 26.4 Q 91 28.0 97.6 25.8 Q 93.5 30.6 87.5 30.2 Q 83.5 28.4 82.5 27.4 Z"
        }
        fill="#0f172a"
        opacity="0.9"
      />
      <motion.path
        d={jawOpen ? mouthOpenUpper : mouthClosedUpper}
        stroke="#1e293b"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? { d: [mouthClosedUpper, mouthOpenUpper, mouthClosedUpper] }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.42, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      <motion.path
        d={jawOpen ? mouthOpenLower : mouthClosedLower}
        stroke="#334155"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? { d: [mouthClosedLower, mouthOpenLower, mouthClosedLower] }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.42, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      {(showTeeth || chomping) && (
        <motion.g
          initial={{ opacity: showTeeth ? 0.55 : 0 }}
          animate={
            chomping
              ? { opacity: [0.35, 0.9, 0.72, 0.25] }
              : { opacity: showTeeth ? 0.75 : 0 }
          }
          transition={
            chomping
              ? { duration: 1.05, delay: Math.max(0, chompStart - 0.18) }
              : { duration: 0.2 }
          }
        >
          {[84.2, 86.8, 89.4, 92.0, 94.6].map((x) => (
            <path
              key={`std-tooth-${x}`}
              d={`M ${x} 27.0 L ${x + 0.55} 29.1 L ${x + 1.1} 27.0 Z`}
              fill="#f8fafc"
              opacity="0.92"
            />
          ))}
        </motion.g>
      )}
    </>
  );
}

/**
 * Killer whale — full redraw from IMG_2273 (all three side-profile poses).
 * Tall upright triangular dorsal (concave trailing edge), blunt rounded head,
 * bright white eye patch + grey saddle swoop, white chin→flank belly lobe,
 * large rounded paddle pectorals, muscular peduncle into side-view fluke crescent.
 * Animation cycles tip-down / neutral / tip-up to match the three reference poses.
 */
function OrcaBody({ v, chomping, showTeeth, frozen, chompDelay = 0 }) {
  const eyePatch = v.eyePatch || "#f8fafc";
  const saddle = v.saddle || "#9ca3af";
  const chompStart = safeAnimDuration(chompDelay, 0);
  const shadowMode = v.id?.startsWith("shadow");
  const midY = 26;
  /** Spine pivot under dorsal — whole rear third waves from here. */
  const waveX = 50;
  /** Peduncle–fluke hinge. */
  const pedX = 26;
  const pedLocalX = pedX - waveX;

  const pedTransition = frozen
    ? FROZEN_TRANSITION
    : { duration: ORCA_PEDUNCLE_DURATION, repeat: Infinity, ease: TAIL_SWAY_EASE };
  const flukeTransition = frozen
    ? FROZEN_TRANSITION
    : { duration: ORCA_FLUKE_DURATION, repeat: Infinity, ease: TAIL_SWAY_EASE };

  return (
    <>
      {/* Forward hull (head → under dorsal) */}
      <path
        d={`M 93 ${midY - 1.5}
           C 88 ${midY - 11.5}, 74 ${midY - 14.0}, 58 ${midY - 12.8}
           C 54 ${midY - 12.4}, ${waveX + 1} ${midY - 12.0}, ${waveX} ${midY - 11.4}
           L ${waveX} ${midY + 11.4}
           C ${waveX + 1} ${midY + 12.0}, 54 ${midY + 12.6}, 58 ${midY + 12.8}
           C 72 ${midY + 14.0}, 84 ${midY + 10.5}, 91 ${midY + 5.0}
           C 94.5 ${midY + 2.2}, 95 ${midY}, 93 ${midY - 1.5} Z`}
        fill={v.body}
      />
      <path
        d={`M 91 ${midY - 2.5}
           C 83 ${midY - 11.5}, 68 ${midY - 13.5}, ${waveX + 2} ${midY - 11.6}
           L ${waveX} ${midY - 0.2}
           C 58 ${midY + 2.0}, 76 ${midY + 1.4}, 87 ${midY + 0.4}
           C 91 ${midY - 1.0}, 91 ${midY - 2.5}, 91 ${midY - 2.5} Z`}
        fill={v.top}
        opacity="0.92"
      />
      {/* White belly lobe — chin through flank, tapers before peduncle (IMG_2273) */}
      <path
        d={`M 90 ${midY + 1.5}
           C 86 ${midY + 8.5}, 74 ${midY + 13.5}, 62 ${midY + 13.2}
           C 56 ${midY + 13.0}, ${waveX + 2} ${midY + 11.0}, ${waveX} ${midY + 9.6}
           C 56 ${midY + 4.5}, 70 ${midY + 2.8}, 84 ${midY + 1.8}
           C 87 ${midY + 1.5}, 90 ${midY + 1.5}, 90 ${midY + 1.5} Z`}
        fill={v.belly}
        opacity={shadowMode ? 0.2 : 0.98}
      />

      {/*
        Rear third + fluke — IMG_2273 poses:
          rotate+ → tip down (top), ~0 (mid), rotate− → tip up (bottom).
        Peduncle stays muscular; fluke is a side-view crescent (not top-down notch).
      */}
      <g transform={`translate(${waveX}, ${midY})`}>
        <motion.g
          animate={frozen ? { rotate: 0 } : { rotate: [8, -10, 8] }}
          transition={pedTransition}
          style={{ transformOrigin: "0px 0px", transformBox: "fill-box" }}
        >
          <path
            d={`M 2 -11.4
               C -3 -10.6, -8 -9.0, -13 -6.8
               C -17 -4.8, -20.5 -3.2, ${pedLocalX} -3.4
               L ${pedLocalX} 3.4
               C -20.5 3.2, -17 5.0, -13 7.0
               C -8 9.2, -3 10.8, 2 11.4
               Z`}
            fill={v.body}
          />
          <path
            d={`M 2 -11.2
               C -5 -10.0, -12 -7.2, ${pedLocalX + 0.4} -2.8
               L ${pedLocalX} 0.2
               C -10 1.6, -3 2.2, 2 1.4
               Z`}
            fill={v.top}
            opacity="0.9"
          />
          <path
            d={`M 2 9.4
               C -4 8.6, -11 6.0, ${pedLocalX + 0.5} 2.4
               L ${pedLocalX + 0.2} 0.3
               C -8 3.0, -2 4.6, 2 5.0
               Z`}
            fill={v.belly}
            opacity={shadowMode ? 0.16 : 0.94}
          />

          <g transform={`translate(${pedLocalX}, 0)`}>
            <motion.g
              animate={
                frozen
                  ? { rotate: 0, scaleY: 1 }
                  : {
                      // Tip-down (TOP) → flat (MID) → tip-up (BOT) → flat → tip-down
                      rotate: [22, -2, -26, -2, 22],
                      scaleY: [1.08, 1.0, 1.22, 1.0, 1.08],
                    }
              }
              transition={
                frozen
                  ? FROZEN_TRANSITION
                  : {
                      ...flukeTransition,
                      times: [0, 0.25, 0.5, 0.75, 1],
                    }
              }
              style={{ transformOrigin: "0px 0px", transformBox: "fill-box" }}
            >
              {/* Side-profile fluke crescent — root matches peduncle wrist */}
              <path
                d={`M 1.6 -3.5
                   C -3.0 -5.0, -9.0 -6.4, -14.5 -5.6
                   C -18.5 -4.8, -22.0 -2.8, -24.2 -0.5
                   C -25.0 0.3, -25.0 1.2, -24.0 1.9
                   C -21.5 3.6, -16.8 4.8, -12.0 5.0
                   C -7.0 5.4, -2.2 4.4, 1.4 3.2
                   C 2.8 1.6, 2.8 -1.8, 1.6 -3.5 Z`}
                fill={v.fin}
                stroke="rgba(248,250,252,0.18)"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
              <path
                d={`M 1.2 -2.8 C -1.8 -3.4, -5.0 -3.0, -7.8 -2.0 L -7.4 2.0 C -4.2 2.8, -0.8 2.4, 1.0 1.7 Z`}
                fill={v.body}
                opacity="0.92"
              />
            </motion.g>
          </g>
        </motion.g>
      </g>

      {/* Grey saddle swoop immediately behind dorsal (IMG_2273 comma shape) */}
      <path
        d={`M 46 ${midY - 11.0}
           C 42 ${midY - 11.8}, 37 ${midY - 10.6}, 34.5 ${midY - 8.2}
           C 36.5 ${midY - 9.8}, 41 ${midY - 9.2}, 44 ${midY - 7.6}
           C 48 ${midY - 6.4}, 52.5 ${midY - 7.0}, 55 ${midY - 9.0}
           C 53 ${midY - 10.8}, 49.5 ${midY - 11.4}, 46 ${midY - 11.0} Z`}
        fill={saddle}
        opacity={shadowMode ? 0.18 : 0.94}
      />

      {/*
        Tall upright triangular dorsal — IMG_2273 wild profile:
        slightly rounded tip, gently concave trailing edge. NOT flopped/captive.
      */}
      <path
        d={`M 52 ${midY - 11.2}
           C 53.2 ${midY - 18.5}, 54.8 ${midY - 26.5}, 56.2 ${midY - 29.5}
           C 56.8 ${midY - 30.2}, 57.6 ${midY - 29.6}, 57.8 ${midY - 28.6}
           C 58.6 ${midY - 22.0}, 59.5 ${midY - 15.5}, 60.8 ${midY - 10.8}
           C 60.2 ${midY - 10.4}, 58.5 ${midY - 10.6}, 56.5 ${midY - 10.9}
           C 54.8 ${midY - 11.1}, 53.2 ${midY - 11.2}, 52 ${midY - 11.2} Z`}
        fill={v.fin}
        stroke="rgba(2,6,23,0.35)"
        strokeWidth="0.55"
        strokeLinejoin="round"
      />
      <path
        d={`M 53.2 ${midY - 11.4}
           L 56.2 ${midY - 27.5}
           L 58.8 ${midY - 11.2} Z`}
        fill={v.highlight}
        opacity="0.1"
      />

      {/* Large rounded paddle pectorals (IMG_2273) */}
      <path
        d={`M 68 ${midY + 6.5}
           C 72 ${midY + 14.5}, 80 ${midY + 18.5}, 88 ${midY + 14.0}
           C 90 ${midY + 12.5}, 89 ${midY + 10.0}, 86 ${midY + 9.0}
           C 80 ${midY + 7.0}, 74 ${midY + 5.5}, 70 ${midY + 4.8}
           C 68.5 ${midY + 4.6}, 67.5 ${midY + 5.4}, 68 ${midY + 6.5} Z`}
        fill={v.fin}
        opacity="0.97"
      />
      <path
        d={`M 67 ${midY - 5.5}
           C 71 ${midY - 13.0}, 79 ${midY - 16.5}, 86 ${midY - 12.0}
           C 88 ${midY - 10.5}, 87 ${midY - 8.2}, 84 ${midY - 7.4}
           C 78 ${midY - 5.6}, 72 ${midY - 4.4}, 69 ${midY - 4.0}
           C 67.6 ${midY - 3.8}, 66.6 ${midY - 4.5}, 67 ${midY - 5.5} Z`}
        fill={v.fin}
        opacity="0.55"
      />

      {/* Rounded melon / blunt head */}
      <ellipse cx="84" cy={midY} rx="14" ry="11.5" fill={v.body} />
      <ellipse cx="86" cy={midY - 2.8} rx="10.5" ry="7.8" fill={v.top} opacity="0.78" />
      <ellipse
        cx="86"
        cy={midY + 5.8}
        rx="9.5"
        ry="5.0"
        fill={v.belly}
        opacity={shadowMode ? 0.18 : 0.96}
      />

      {/* White eye patch — elongated oval, tilted slightly aft-up (IMG_2273) */}
      <ellipse
        cx="75"
        cy={midY - 5.2}
        rx="6.8"
        ry="3.6"
        fill={eyePatch}
        opacity={shadowMode ? 0.22 : 1}
        transform={`rotate(-18 75 ${midY - 5.2})`}
      />
      {/* Tiny eye mark just ahead of the patch — almost invisible on black */}
      <circle cx="70.5" cy={midY - 3.2} r="0.55" fill="#f8fafc" opacity={shadowMode ? 0.12 : 0.55} />

      {/* Soft mouth line */}
      <motion.path
        d={`M 87 ${midY + 4.2} Q 93 ${midY + 5.8} 97.5 ${midY + 3.2}`}
        stroke={shadowMode ? "#050505" : "#1e293b"}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? {
                d: [
                  `M 87 ${midY + 4.2} Q 93 ${midY + 5.8} 97.5 ${midY + 3.2}`,
                  `M 87 ${midY + 5.8} Q 94 ${midY + 11.5} 98.5 ${midY + 5.2}`,
                  `M 87 ${midY + 4.2} Q 93 ${midY + 5.8} 97.5 ${midY + 3.2}`,
                ],
              }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.4, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      {(showTeeth || chomping) && !shadowMode && (
        <motion.g
          animate={chomping ? { opacity: [0.4, 0.85, 0.7, 0.25] } : { opacity: showTeeth ? 0.55 : 0 }}
          transition={
            chomping
              ? { duration: 1.0, delay: Math.max(0, chompStart - 0.15) }
              : { duration: 0.2 }
          }
        >
          {[89, 92, 95].map((x) => (
            <path
              key={`ot-${x}`}
              d={`M ${x} ${midY + 4.6} L ${x + 1} ${midY + 7.6} L ${x + 2} ${midY + 4.6} Z`}
              fill="#f8fafc"
            />
          ))}
        </motion.g>
      )}
    </>
  );
}

function HammerheadBody({ v, chomping, showTeeth, scary, frozen, chompDelay = 0 }) {
  const eyeColor = scary ? "#dc2626" : v.eye;
  const pupilColor = scary ? "#fecaca" : v.pupil;
  const jawOpen = chomping ? 1 : 0;
  const chompStart = safeAnimDuration(chompDelay, 0);

  return (
    <>
      {/* SMALL caudal translated aft with long dorsal→tail body (join ~x=0). */}
      <motion.g
        animate={frozen ? { rotate: 0 } : { rotate: [-8, 9, -8] }}
        transition={
          frozen
            ? FROZEN_TRANSITION
            : { duration: TAIL_SWAY_DURATION + 0.08, repeat: Infinity, ease: TAIL_SWAY_EASE }
        }
        style={{ originX: "78%", originY: "50%" }}
      >
        <path
          d="M 0 18
             C -3.5 16.8, -9 12.5, -14 8.5
             L -16 7.5
             C -11 13, -7 17, -4.5 19.8
             L -3.5 21.8
             L -3.2 24
             L -3.5 26.2
             L -4.5 28.2
             C -7 31.2, -11 35.5, -15 40
             L -13 41
             C -8 36, -3.5 31.5, 0 30.5
             C 2.2 27.5, 2.2 21, 0 18 Z"
          fill={v.fin}
          stroke="rgba(2,6,23,0.35)"
          strokeWidth="0.55"
          strokeLinejoin="round"
        />
        <path d="M 3 19 L -2.5 21 L -3 24 L -2.5 27 L 3 29 Z" fill={v.body} opacity="0.92" />
      </motion.g>

      <ellipse cx="58" cy="24" rx="26" ry="9" fill={v.body} />
      <ellipse cx="62" cy="22" rx="20" ry="6.5" fill={v.top} opacity="0.5" />
      {/* Long mid-aft body — dorsal (~x=58) to peduncle (~x=2) */}
      <path
        d="M 64 16
           C 44 14.5, 24 15.2, 6 18
           C 2 19, 1 21.5, 1 24
           C 1 26.5, 2 29, 6 30
           C 24 32.5, 44 33, 64 31
           C 68 28, 68 19, 64 16 Z"
        fill={v.body}
      />
      <ellipse cx="48" cy="28" rx="22" ry="5.5" fill={v.belly} opacity="0.78" />
      <path
        d="M 78 26.5 Q 50 34 18 32 Q 6 30 1 27 Q 4 25 14 26 Q 40 29 62 27.5 Q 72 26.8 78 26.5 Z"
        fill={v.belly}
        opacity="0.8"
      />

      <path d="M 52 14.5 L 60 3 L 68 15.5 Z" fill={v.fin} />
      <path d="M 66 28.5 Q 74 36.5 82 31.5 L 74 25.5 Z" fill={v.fin} opacity="0.9" />
      <path d="M 66 19.5 Q 74 11.5 82 15.5 L 74 21.5 Z" fill={v.fin} opacity="0.75" />
      <path d="M 16 30 Q 10 36 6 31.5 L 14 28 Z" fill={v.fin} opacity="0.78" />

      {[58, 54, 50].map((x) => (
        <path
          key={`hgill-${x}`}
          d={`M ${x} 19 Q ${x - 2} 24 ${x} 29`}
          stroke={v.gill}
          strokeWidth="1"
          opacity="0.5"
          fill="none"
        />
      ))}

      <path
        d="M 70 24 L 80 8 L 90 12 L 96 24 L 90 36 L 80 40 L 70 24 Z"
        fill={v.body}
        stroke="rgba(2,6,23,0.35)"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M 74 24 L 82 14 L 92 18 L 94 24 L 92 30 L 82 34 L 74 24 Z" fill={v.top} opacity="0.45" />
      <path d="M 78 24 L 86 20 L 92 24 L 86 28 Z" fill={v.belly} opacity="0.55" />

      <circle cx="82" cy="12" r="2.2" fill="white" />
      <circle cx="82.4" cy="12" r="1.2" fill={eyeColor} />
      <circle cx="82.7" cy="11.7" r="0.45" fill={pupilColor} />
      <circle cx="82" cy="36" r="2.2" fill="white" />
      <circle cx="82.4" cy="36" r="1.2" fill={eyeColor} />
      <circle cx="82.7" cy="35.7" r="0.45" fill={pupilColor} />

      {/* Underslung mouth under cephalofoil */}
      <path
        d={
          jawOpen
            ? "M 90 24 Q 100 26 106 24 Q 102 32 96 32 Q 91 28 90 26 Z"
            : "M 90 23.5 Q 100 25.2 106 24 Q 101 27.5 96 27 Q 91 25.5 90 24.5 Z"
        }
        fill="#0f172a"
        opacity="0.82"
      />
      <motion.path
        d={jawOpen ? "M 90 23.5 Q 100 24.5 106 23.5" : "M 90 23.2 Q 100 24.8 106 23.8"}
        stroke="#1e293b"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? {
                d: [
                  "M 90 23.2 Q 100 24.8 106 23.8",
                  "M 90 23.5 Q 100 24.5 106 23.5",
                  "M 90 23.2 Q 100 24.8 106 23.8",
                ],
              }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.4, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      <motion.path
        d={jawOpen ? "M 90 26 Q 100 34 106 28" : "M 90 24.8 Q 100 27 105.5 25"}
        stroke="#334155"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? {
                d: [
                  "M 90 24.8 Q 100 27 105.5 25",
                  "M 90 26 Q 100 34 106 28",
                  "M 90 24.8 Q 100 27 105.5 25",
                ],
              }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.4, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      {(showTeeth || chomping) && (
        <motion.g
          animate={chomping ? { opacity: [0.35, 0.75, 0.6, 0.2] } : { opacity: showTeeth ? 0.5 : 0 }}
          transition={
            chomping
              ? { duration: 1.0, delay: Math.max(0, chompStart - 0.15) }
              : { duration: 0.2 }
          }
        >
          {[94, 97.5, 101].map((x) => (
            <path
              key={`ht-${x}`}
              d={`M ${x} 24.4 L ${x + 0.7} 26.2 L ${x + 1.4} 24.4 Z`}
              fill="#f8fafc"
              opacity="0.88"
            />
          ))}
        </motion.g>
      )}
    </>
  );
}

/** Realistic procedural shark / orca — species-aware silhouette. */
export function SharkCreature({
  variant,
  chomping = false,
  showTeeth = false,
  scary = false,
  frozen = false,
  size = "100%",
  chompDelay = 0,
}) {
  const v = variant || SHARK_VARIANTS[0];
  const viewBox = v.hammerhead
    ? "-22 -6 138 54"
    : v.orca
      ? // Clear tall upright dorsal tip (~y=-4) + fluke beat aft of peduncle
        "-16 -24 126 72"
      : // Tall falcate dorsal tip (~y=-11) + sickle pectoral hang need extra pad
        "-14 -18 128 66";
  // Stronger black depth when aggressive — never a red halo/glow.
  const shadow = scary
    ? "drop-shadow(0 3px 7px rgba(0,0,0,0.55))"
    : "drop-shadow(0 2px 6px rgba(0,0,0,0.45))";

  const bodyProps = {
    v,
    chomping,
    showTeeth,
    scary,
    frozen,
    chompDelay,
  };

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      style={{ filter: shadow, overflow: "hidden" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`shark-body-${v.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={v.top} />
          <stop offset="55%" stopColor={v.body} />
          <stop offset="100%" stopColor={v.belly} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {v.hammerhead ? (
        <HammerheadBody {...bodyProps} />
      ) : v.orca ? (
        <OrcaBody {...bodyProps} />
      ) : v.greatWhite ? (
        <GreatWhiteBody {...bodyProps} />
      ) : (
        <StandardSharkBody {...bodyProps} />
      )}
    </svg>
  );
}

/**
 * One-way wrap cruise: always swim forward in `dir`, exit fully off one edge,
 * then Infinity-loop teleports back to the opposite off-screen edge (clipped
 * by SharkTankOverlay overflow:hidden). Never reverses, never dwells, never
 * flips facing while visible.
 */
function swimKeyframes(size, dir, pathStyle, swayFrac, scale = 1, widthFrac = 0.5) {
  const sharkW = size * widthFrac * scale;
  // Fully clear the clipped face before the wrap teleport.
  const offLeft = -(sharkW + size * 0.14);
  const offRight = size + sharkW * 0.15;
  const sway = size * swayFrac;
  const deep = size * (swayFrac + 0.022);
  const facing = dir === 1 ? 1 : -1;

  // One-way only: enter from spawn edge → exit opposite. Loop = off-screen wrap.
  const xCruise = dir === 1 ? [offLeft, offRight] : [offRight, offLeft];
  const xTimes = [0, 1];

  let yCruise;
  let yTimes;
  if (pathStyle === 1) {
    yCruise = [0, -sway * 0.95, sway * 0.4, 0];
    yTimes = [0, 0.35, 0.7, 1];
  } else if (pathStyle === 2) {
    yCruise = [0, deep * 0.85, -sway * 0.7, deep * 0.2, 0];
    yTimes = [0, 0.25, 0.5, 0.75, 1];
  } else {
    yCruise = [0, -sway * 0.75, sway * 0.45, -sway * 0.2, 0];
    yTimes = [0, 0.25, 0.5, 0.75, 1];
  }

  return {
    x: xCruise,
    y: yCruise,
    facing,
    xTimes,
    yTimes,
    offLeft,
    offRight,
  };
}

/**
 * Rivalry attack timeline (ms from attack start).
 * Telegraph + pullback first; bite lands mid-sequence; blood only after (and rarely).
 */
export const ATTACK_LUNGE_MS = 1650;
export const ATTACK_BITE_LAND_MS = 980;
const ATTACK_BLOOD_AFTER_BITE_MS = 220;
const ATTACK_BLOOD_HOLD_MS = 2400;
const ATTACK_BLOOD_FADE_MS = 800;
const ATTACK_SKELETON_MS = 2700;
const ATTACK_CLEAR_MS = ATTACK_LUNGE_MS + 80;
/** Blood is rare — min/max wall-clock gaps between crimson flashes. */
const BLOOD_MIN_GAP_MS = 28000;
const BLOOD_MAX_GAP_MS = 56000;

/** Attack lunge length (seconds) — windup pullback → snap → retreat. */
export const SHARK_ATTACK_ANIM_S = ATTACK_LUNGE_MS / 1000;
/** Jaw snap delay within the attack (seconds) — after telegraph, at bite land. */
export const SHARK_CHOMP_DELAY_S = ATTACK_BITE_LAND_MS / 1000;

/** Weighted species pick — mostly great whites; tiger/hammer rare; orca common enough to spot. */
function pickSharkVariant(slotSeed, forceOrca) {
  if (forceOrca && ORCA_VARIANT) return ORCA_VARIANT;

  const roll = seededUnit(hashSeed(slotSeed, "species"));
  // ~8% hammerhead, ~8% tiger, ~14% extra orca, ~70% great white ages
  if (roll > 0.92 && HAMMERHEAD_VARIANT) return HAMMERHEAD_VARIANT;
  if (roll > 0.84 && TIGER_VARIANT) return TIGER_VARIANT;
  if (roll > 0.7 && ORCA_VARIANT) return ORCA_VARIANT;
  return GREAT_WHITE_VARIANTS[seededIndex(hashSeed(slotSeed, "gw-age"), GREAT_WHITE_VARIANTS.length)];
}

/** One shark swimming inside the die tank. */
export function SwimmingShark({
  size,
  top,
  duration,
  delay,
  dir = 1,
  scale = 1,
  variant,
  frozen = false,
  chomping = false,
  showTeeth = false,
  scary = false,
  pathStyle = 0,
  swayFrac = 0.05,
  bodyRoll = 0,
  /** Brief rival lunge — layered on top of continuous forward swim (does not stop/reverse). */
  attacking = false,
  attackKey = 0,
  /** Pre-bite victim flinch / shake (no red halo). */
  telegraphing = false,
  /** Small flinch when another shark's bite lands. */
  recoiling = false,
  /** Signed lane delta toward the victim (percent points); attacker only. */
  lungeLaneDelta = 0,
}) {
  const v = variant || SHARK_VARIANTS[0];
  const isOrca = !!v.orca;
  const widthFrac = isOrca ? ORCA_WIDTH_FRAC : SHARK_WIDTH_FRAC;
  const aspect = v.hammerhead ? HAMMERHEAD_ASPECT : isOrca ? ORCA_ASPECT : SHARK_ASPECT;
  const sharkWidth = size * widthFrac * scale;
  const sharkHeight = sharkWidth * aspect;
  const swim = swimKeyframes(size, dir, pathStyle, swayFrac, scale, widthFrac);
  const restX = size * 0.28;
  const cruiseDuration = safeAnimDuration(duration);
  const startX = dir === 1 ? swim.offLeft : swim.offRight;
  const lungeX = dir * size * 0.18;
  const lungeY = Math.max(-size * 0.12, Math.min(size * 0.12, (lungeLaneDelta / 100) * size * 0.62));
  const isChomping = chomping || attacking;
  const isScary = scary || attacking;
  const burstActive = attacking || telegraphing || recoiling;
  const shakePx = Math.max(2.5, size * 0.028);
  // Sharks: slight side roll. Orcas: strong pitch undulation (vertical whale propulsion).
  const pitch0 = bodyRoll * (isOrca ? 0.35 : 1);
  const cruiseRotate = isOrca
    ? [pitch0, pitch0 - 14, pitch0 + 12, pitch0 - 10, pitch0 + 5, pitch0]
    : [bodyRoll, bodyRoll - 1.1, bodyRoll + 1.1, bodyRoll - 0.4, bodyRoll];
  const cruiseRotateTimes = isOrca ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.25, 0.5, 0.75, 1];

  return (
    <motion.div
      className="absolute"
      style={{
        top: `${top}%`,
        left: frozen ? `${restX}px` : 0,
        width: sharkWidth,
        height: sharkHeight,
      }}
      initial={{
        x: frozen ? restX : startX,
        opacity: frozen ? 1 : 0.85,
        rotate: pitch0,
        scaleX: swim.facing,
      }}
      animate={
        frozen
          ? { x: restX, y: 0, opacity: 1, scaleX: swim.facing, rotate: pitch0 }
          : {
              x: swim.x,
              y: swim.y,
              scaleX: swim.facing,
              opacity: 1,
              rotate: cruiseRotate,
            }
      }
      transition={
        frozen
          ? FROZEN_TRANSITION
          : {
              // One-way linear cruise; wrap teleport is the Infinity seam (both ends off-face).
              x: {
                duration: cruiseDuration,
                repeat: Infinity,
                ease: SWIM_EASE,
                delay,
                times: swim.xTimes,
              },
              y: {
                duration: cruiseDuration,
                repeat: Infinity,
                ease: SWIM_EASE,
                delay,
                times: swim.yTimes,
              },
              scaleX: { duration: 0 },
              rotate: {
                duration: cruiseDuration,
                repeat: Infinity,
                ease: SWIM_EASE,
                delay,
                times: cruiseRotateTimes,
              },
              opacity: { duration: 0.35, delay },
            }
      }
    >
      {/* Local burst only — outer cruise keeps wrapping forward without pause/reverse. */}
      <motion.div
        key={burstActive ? `burst-${attackKey}-${attacking ? "atk" : telegraphing ? "tel" : "rec"}` : "cruise"}
        style={{ width: "100%", height: "100%" }}
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={
          attacking
            ? {
                // Clear telegraph: rear up / pull back, hold, then snap-lunge, bite hold, retreat.
                x: [0, -lungeX * 0.32, -lungeX * 0.4, lungeX * 1.12, lungeX * 0.28, 0],
                y: [0, -lungeY * 0.2, lungeY * 0.15, lungeY, lungeY * 0.22, 0],
                scale: [1, 1.04, 1.06, 1.16, 1.05, 1],
              }
            : telegraphing
              ? {
                  // Subtle victim flinch — motion only, no red ring/glow.
                  x: [0, shakePx * 0.55, -shakePx * 0.45, shakePx * 0.35, 0],
                  y: [0, -shakePx * 0.22, shakePx * 0.15, -shakePx * 0.12, 0],
                  scale: [1, 1.015, 1.02, 1.01, 1],
                }
              : recoiling
                ? {
                    x: [0, -dir * size * 0.07, -dir * size * 0.03, 0],
                    y: [0, -size * 0.03, size * 0.01, 0],
                    scale: [1, 0.9, 0.96, 1],
                  }
                : { x: 0, y: 0, scale: 1 }
        }
        transition={
          attacking
            ? {
                duration: SHARK_ATTACK_ANIM_S,
                ease: [0.4, 0.0, 0.2, 1],
                times: [0, 0.22, 0.4, 0.58, 0.78, 1],
              }
            : telegraphing
              ? {
                  duration: ATTACK_BITE_LAND_MS / 1000,
                  ease: "easeInOut",
                  times: [0, 0.25, 0.5, 0.75, 1],
                }
              : recoiling
                ? { duration: 0.62, ease: "easeOut", times: [0, 0.35, 0.7, 1] }
                : { duration: 0.2 }
        }
      >
        <SharkCreature
          variant={v}
          chomping={isChomping}
          showTeeth={showTeeth || attacking}
          scary={isScary}
          frozen={frozen}
          size="100%"
          chompDelay={attacking ? SHARK_CHOMP_DELAY_S : 0}
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Deterministic shark layout — unique species, scale, and swim path per slot.
 * `dieSeed` + `count` (face value) seed all variation.
 * ~65% of dice force at least one orca so killer whales are actually visible.
 */
export function buildSharkTankCreatures(count, dieSeed = 0, powerMode = false) {
  const n = Math.max(1, Math.min(6, Math.floor(Number(count)) || 1));
  const layoutSeed = hashSeed(dieSeed, count, "shark-tank");
  // Deterministic: most dice get a guaranteed orca slot so players spot the killer whale.
  const forceOrca = seededUnit(hashSeed(layoutSeed, "force-orca")) > 0.35;
  const orcaSlot = forceOrca ? seededIndex(hashSeed(layoutSeed, "orca-slot"), n) : -1;
  const creatures = [];

  for (let i = 0; i < n; i++) {
    const slotSeed = hashSeed(layoutSeed, i);
    const variant = pickSharkVariant(slotSeed, i === orcaSlot);
    const dir = seededUnit(hashSeed(slotSeed, "dir")) > 0.48 ? 1 : -1;
    const baseScale = n >= 5 ? 0.8 : n >= 3 ? 0.94 : 1.08;
    // Age size: juveniles smaller, bulls a touch larger. Orcas use ORCA_SCALE_MULTIPLIER.
    const ageScale =
      variant.age === "juvenile" ? 0.88 : variant.age === "bull" ? 1.08 : 1;
    const speciesScale = variant.orca ? ORCA_SCALE_MULTIPLIER : 1;
    const scale =
      baseScale * ageScale * speciesScale * (0.92 + seededUnit(hashSeed(slotSeed, "scale")) * 0.18);
    const top =
      n === 1
        ? 34 + seededUnit(hashSeed(slotSeed, "top")) * 14
        : 7 + (i * 80) / Math.max(1, n - 1) + (seededUnit(hashSeed(slotSeed, "lane")) - 0.5) * 10;
    const cruiseDur =
      7.4 +
      seededUnit(hashSeed(slotSeed, "dur")) * 5.6 +
      (variant.hammerhead ? 0.85 : 0) +
      (variant.orca ? 0.55 : 0) +
      (variant.age === "juvenile" ? -0.55 : 0) +
      (variant.age === "bull" ? 0.35 : 0);
    const duration = Math.max(4.5, cruiseDur);
    // Keep delay within one cruise cycle — large negative delays can freeze
    // Framer Motion Infinity loops on iOS Safari.
    const rawDelay = seededUnit(hashSeed(slotSeed, "delay")) * 5.4 + i * 1.15;
    const delay = -(((rawDelay % duration) + duration) % duration);
    const pathStyle = seededIndex(hashSeed(slotSeed, "path"), 3);
    // Orcas: strong vertical cruise bob (fluke propulsion) — obvious whale swim, not static.
    const swayFrac =
      (0.026 + seededUnit(hashSeed(slotSeed, "sway")) * 0.038) * (variant.orca ? 3.4 : 1);
    const bodyRoll = (seededUnit(hashSeed(slotSeed, "roll")) - 0.5) * 3.8;

    creatures.push({
      id: `shark-${i}`,
      variant,
      dir,
      scale,
      top,
      duration,
      delay,
      pathStyle,
      swayFrac,
      bodyRoll,
      chomping: powerMode,
      showTeeth: true,
      scary: powerMode,
    });
  }

  return creatures;
}

/** Match Blue Gel feast blood (temporary flash — not permanent BloodyWaterTint). */
const SHARK_TANK_BLOOD_WATER =
  "radial-gradient(ellipse at 50% 38%, rgba(185,22,22,0.72) 0%, rgba(48,6,6,0.58) 58%, rgba(12,1,1,0.55) 100%)";

function attackGapMs(dieSeed, wave, first) {
  if (first) {
    // Stagger first strike so dice don't sync (≈2.8–9.5s).
    return 2800 + seededUnit(hashSeed(dieSeed, "atk-start")) * 6700;
  }
  // Attacks a bit more often than blood: ≈7.5–16s.
  return 7500 + seededUnit(hashSeed(dieSeed, "atk-gap", wave)) * 8500;
}

/** Rare crimson wash — only sometimes after a bite, never every attack. */
function shouldFlashBlood(dieSeed, wave, msSinceLastBlood) {
  if (msSinceLastBlood >= BLOOD_MAX_GAP_MS) return true;
  if (msSinceLastBlood < BLOOD_MIN_GAP_MS) return false;
  // Between min/max: ~35% of eligible attacks.
  return seededUnit(hashSeed(dieSeed, "blood", wave)) > 0.65;
}

/**
 * Occasional shark-vs-shark rivalry inside one die tank.
 * Longer lunge telegraph + delayed blood; skeleton after each bite.
 * Requires ≥2 sharks; inactive while frozen.
 */
export function useSharkTankRivalry({ active, dieSeed = 0, sharkCount = 1 }) {
  const [attack, setAttack] = useState(null);
  const [bloodVisible, setBloodVisible] = useState(false);
  const [skeleton, setSkeleton] = useState(null);
  const waveRef = useRef(0);
  const lastBloodAtRef = useRef(0);

  useEffect(() => {
    const n = Math.max(0, Math.floor(Number(sharkCount)) || 0);
    if (!active || n < 2) {
      setAttack(null);
      setBloodVisible(false);
      setSkeleton(null);
      return undefined;
    }

    let cancelled = false;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // Seed so the first blood can't fire on the very first attack.
    lastBloodAtRef.current = Date.now();

    const schedule = (first) => {
      const wave = waveRef.current;
      const gap = attackGapMs(dieSeed, wave, first);
      later(() => {
        if (cancelled) return;
        const attackerIdx = seededIndex(hashSeed(dieSeed, "atk-a", wave), n);
        let victimIdx = seededIndex(hashSeed(dieSeed, "atk-b", wave), n);
        if (victimIdx === attackerIdx) victimIdx = (attackerIdx + 1) % n;
        const attackId = wave + 1;

        setAttack({
          id: attackId,
          attackerIdx,
          victimIdx,
          biteLanded: false,
        });
        setBloodVisible(false);

        // Bite lands after telegraph — victim recoils + skeleton; blood only if rare roll.
        later(() => {
          if (cancelled) return;
          setAttack((prev) =>
            prev && prev.id === attackId ? { ...prev, biteLanded: true } : prev
          );

          const driftDir = seededUnit(hashSeed(dieSeed, "skel-dir", wave)) > 0.5 ? 1 : -1;
          setSkeleton({
            id: attackId,
            victimIdx,
            driftDir,
          });
          later(() => {
            if (cancelled) return;
            setSkeleton((prev) => (prev && prev.id === attackId ? null : prev));
          }, ATTACK_SKELETON_MS);

          const now = Date.now();
          const sinceBlood = now - lastBloodAtRef.current;
          if (shouldFlashBlood(dieSeed, wave, sinceBlood)) {
            lastBloodAtRef.current = now;
            later(() => {
              if (cancelled) return;
              setBloodVisible(true);
            }, ATTACK_BLOOD_AFTER_BITE_MS);
            later(() => {
              if (cancelled) return;
              setBloodVisible(false);
            }, ATTACK_BLOOD_AFTER_BITE_MS + ATTACK_BLOOD_HOLD_MS);
          }
        }, ATTACK_BITE_LAND_MS);

        later(() => {
          if (cancelled) return;
          setAttack(null);
        }, ATTACK_CLEAR_MS);

        waveRef.current = wave + 1;
        schedule(false);
      }, gap);
    };

    schedule(true);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active, dieSeed, sharkCount]);

  return { attack, bloodVisible, skeleton };
}

/**
 * Code-only fish skeleton — floats up / drifts after a rivalry bite, then fades.
 * No image assets.
 */
export function SharkTankFishSkeleton({
  size,
  topPct = 42,
  driftDir = 1,
  animKey = 0,
}) {
  const w = Math.max(18, size * 0.32);
  const h = w * 0.55;
  const driftX = driftDir * size * 0.16;

  return (
    <AnimatePresence>
      <motion.div
        key={`fish-skel-${animKey}`}
        className="absolute pointer-events-none z-[5]"
        style={{
          left: "38%",
          top: `${topPct}%`,
          width: w,
          height: h,
          marginLeft: -w / 2,
          marginTop: -h / 2,
        }}
        initial={{ opacity: 0, y: 4, x: 0, rotate: -12, scale: 0.75 }}
        animate={{
          opacity: [0, 0.95, 0.8, 0],
          y: [4, -size * 0.22, -size * 0.48],
          x: [0, driftX * 0.45, driftX],
          rotate: [-12, 8, -6, 14],
          scale: [0.75, 1, 0.92],
        }}
        exit={{ opacity: 0 }}
        transition={{
          duration: ATTACK_SKELETON_MS / 1000,
          ease: "easeOut",
          times: [0, 0.18, 0.72, 1],
        }}
        data-shark-overlay="fish-skeleton"
        aria-hidden
      >
        <svg viewBox="0 0 64 36" width="100%" height="100%" style={{ overflow: "visible" }}>
          {/* Skull */}
          <ellipse
            cx="16"
            cy="18"
            rx="9"
            ry="7.5"
            fill="none"
            stroke="#e7e5e4"
            strokeWidth="1.5"
            opacity="0.92"
          />
          <circle cx="12.5" cy="16.5" r="1.7" fill="#a8a29e" />
          <path d="M 8 20 Q 11 23 14 21" stroke="#d6d3d1" strokeWidth="1.1" fill="none" />
          {/* Spine */}
          <path
            d="M 25 18 H 50"
            stroke="#d6d3d1"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Ribs */}
          {[28, 34, 40, 46].map((x, i) => (
            <g key={`rib-${x}`}>
              <path
                d={`M ${x} 18 Q ${x + 1} ${10 - (i % 2)} ${x + 3} ${8 - (i % 2)}`}
                stroke="#e7e5e4"
                strokeWidth="1.15"
                fill="none"
                strokeLinecap="round"
                opacity="0.88"
              />
              <path
                d={`M ${x} 18 Q ${x + 1} ${26 + (i % 2)} ${x + 3} ${28 + (i % 2)}`}
                stroke="#e7e5e4"
                strokeWidth="1.15"
                fill="none"
                strokeLinecap="round"
                opacity="0.88"
              />
            </g>
          ))}
          {/* Tail fork */}
          <path
            d="M 50 18 L 60 9 M 50 18 L 60 27"
            stroke="#d6d3d1"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          <circle cx="50" cy="18" r="1.3" fill="#a8a29e" />
        </svg>
      </motion.div>
    </AnimatePresence>
  );
}

/** Brief crimson water wash after a rivalry snap (fades out — not permanent). */
export function SharkTankBloodFlash({ size, radius, active = false, count = 1, dieSeed = 0 }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="shark-tank-blood"
          className="absolute inset-0 pointer-events-none z-[4]"
          style={{ borderRadius: radius }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: ATTACK_BLOOD_FADE_MS / 1000, ease: "easeOut" }}
          data-shark-overlay="blood-flash"
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{ borderRadius: radius, background: SHARK_TANK_BLOOD_WATER }}
          />
          <AquariumBubbles
            size={size}
            count={count}
            dieSeed={dieSeed}
            theme="blood"
            density="light"
            salt="shark-blood-flash"
            riseMult={1.05}
            speedScale={1.55}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
