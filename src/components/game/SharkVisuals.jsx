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
 * (no blue) except the black/white orca. Bodies use volume gradients, underslung
 * jaws, lunate tails, and species markings that read at die size.
 */
export const SHARK_VARIANTS = [
  {
    id: "great_white",
    name: "Great White",
    // Steely slate dorsum, warm white belly, soft mid-tone seam
    top: "#3e4752",
    body: "#5a6570",
    belly: "#f3f1ea",
    fin: "#2c333c",
    highlight: "#9aa5b0",
    gill: "#1c2228",
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
    top: "#4f5a66",
    body: "#6a7580",
    belly: "#f6f4ee",
    fin: "#3a4450",
    highlight: "#b0b8c0",
    gill: "#2a3340",
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
    top: "#2c333c",
    body: "#434c56",
    belly: "#efece4",
    fin: "#1c2128",
    highlight: "#7e8791",
    gill: "#10141a",
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
    top: "#070708",
    body: "#101114",
    belly: "#f4f5f6",
    fin: "#050506",
    highlight: "#3a3d44",
    gill: "#1f2937",
    eye: "#050505",
    pupil: "#f8fafc",
    eyePatch: "#f7f8fa",
    saddle: "#8a919a",
    hammerhead: false,
    orca: true,
    greatWhite: false,
  },
  {
    id: "tiger",
    name: "Tiger Shark",
    top: "#4a453c",
    body: "#5e584c",
    belly: "#ece8df",
    fin: "#322e28",
    highlight: "#9a9286",
    gill: "#1c1915",
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
    top: "#5a5348",
    body: "#6d6558",
    belly: "#e8e4d9",
    fin: "#3f3b34",
    highlight: "#a39a8c",
    gill: "#2a261f",
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

/** Killer whales are the biggest tank creatures — clearly larger than adult sharks. */
const ORCA_SCALE_MULTIPLIER = 1.85;
/** Die-face width fraction — great whites read clearly larger; orcas still wider. */
const SHARK_WIDTH_FRAC = 0.66;
const ORCA_WIDTH_FRAC = 0.72;
/** Height/width of the swim box — orca taller for upright dorsal + fluke beat. */
const SHARK_ASPECT = 0.40;
const HAMMERHEAD_ASPECT = 0.36;
const ORCA_ASPECT = 0.64;
/** Whale fluke beat — cycles IMG_2273 top / mid / bottom poses. */
const ORCA_FLUKE_DURATION = 0.92;
/** Rear-third peduncle undulation nested under the fluke beat. */
const ORCA_PEDUNCLE_DURATION = 0.92;

/**
 * Great white — fusiform slate/white body, conical snout over an underslung jaw,
 * five gills, tall falcate dorsal, sickle pectorals aft+down, pelvic/anal/2nd dorsal,
 * narrow keeled peduncle, near-symmetric lunate caudal, wavy mottled countershade seam.
 */
function GreatWhiteBody({ v, chomping, showTeeth, scary, frozen, chompDelay = 0, ids }) {
  const eyeColor = scary ? "#dc2626" : v.eye;
  const age = v.age || "adult";
  const dorsalTipY = age === "juvenile" ? -1.2 : age === "bull" ? -8.4 : -6.6;
  const snoutTipX = age === "juvenile" ? 99.2 : age === "bull" ? 102.4 : 101.2;
  const midY = age === "bull" ? 24.4 : 24;
  const bellyDeep = age === "bull" ? 11.2 : 10.2;
  const chompStart = safeAnimDuration(chompDelay, 0);
  const dorsum = ids?.dorsum || v.top;
  const belly = ids?.belly || v.belly;
  const sheen = ids?.sheen;
  const finFill = ids?.fin || v.fin;
  const caudalFill = ids?.caudal || v.fin;
  const seam = ids?.seam;

  const mouthClosedUpper = `M 84.0 ${midY + 3.4} Q 90.6 ${midY + 4.6} 95.4 ${midY + 3.0}`;
  const mouthClosedLower = `M 84.0 ${midY + 4.6} Q 90.8 ${midY + 6.4} 95.0 ${midY + 4.6}`;
  const mouthOpenUpper = `M 84.0 ${midY + 2.8} Q 90.6 ${midY + 3.8} 95.6 ${midY + 2.4}`;
  const mouthOpenLower = `M 84.0 ${midY + 5.8} Q 91.2 ${midY + 13.4} 96.0 ${midY + 8.2}`;

  return (
    <>
      {/* Lunate caudal — nearly symmetrical crescent, upper lobe only slightly longer */}
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
          d={`M 36.2 ${midY - 3.4}
             C 30.0 ${midY - 7.4}, 24.2 ${midY - 11.6}, 19.2 ${midY - 14.0}
             C 17.6 ${midY - 14.8}, 16.6 ${midY - 13.6}, 17.6 ${midY - 12.6}
             C 22.0 ${midY - 8.8}, 26.2 ${midY - 5.2}, 29.6 ${midY - 2.0}
             C 30.4 ${midY - 1.2}, 30.6 ${midY - 0.4}, 30.4 ${midY}
             C 30.6 ${midY + 0.4}, 30.4 ${midY + 1.2}, 29.6 ${midY + 2.0}
             C 26.0 ${midY + 5.4}, 21.8 ${midY + 9.2}, 17.8 ${midY + 12.6}
             C 16.8 ${midY + 13.6}, 17.8 ${midY + 14.8}, 19.4 ${midY + 13.8}
             C 24.2 ${midY + 11.0}, 30.0 ${midY + 6.8}, 36.2 ${midY + 3.4}
             C 38.2 ${midY + 1.6}, 38.2 ${midY - 1.6}, 36.2 ${midY - 3.4} Z`}
          fill={caudalFill}
          stroke="rgba(2,6,23,0.4)"
          strokeWidth="0.45"
          strokeLinejoin="round"
        />
        <path
          d={`M 29.2 ${midY - 1.8} C 25.4 ${midY - 4.6}, 22.0 ${midY - 8.0}, 19.2 ${midY - 11.0}
             L 20.4 ${midY - 10.2}
             C 23.4 ${midY - 6.8}, 26.6 ${midY - 3.4}, 29.6 ${midY - 0.4}
             L 29.6 ${midY + 0.4}
             C 26.6 ${midY + 3.4}, 23.2 ${midY + 7.0}, 20.2 ${midY + 10.4}
             L 19.0 ${midY + 11.2}
             C 22.0 ${midY + 7.8}, 25.4 ${midY + 4.4}, 29.2 ${midY + 1.8} Z`}
          fill={v.highlight}
          opacity="0.16"
        />
        <path
          d={`M 40.2 ${midY - 3.4} C 37.8 ${midY - 2.2}, 35.4 ${midY - 1.2}, 33.6 ${midY}
             C 35.4 ${midY + 1.2}, 37.8 ${midY + 2.2}, 40.2 ${midY + 3.2} Z`}
          fill={v.body}
        />
        <ellipse cx="36.4" cy={midY} rx="3.4" ry="1.05" fill={v.body} opacity="0.95" />
        <ellipse cx="36.4" cy={midY} rx="4.2" ry="0.42" fill={v.fin} opacity="0.4" />
      </motion.g>

      {/* Fusiform hull — conical snout, thickest under the dorsal, long taper to peduncle */}
      <path
        d={`M ${snoutTipX} ${midY - 1.6}
           C 98.8 ${midY - 6.2}, 94.2 ${midY - 10.2}, 86.4 ${midY - 11.6}
           C 76.0 ${midY - 13.0}, 64.0 ${midY - 13.0}, 52.5 ${midY - 11.6}
           C 43.5 ${midY - 10.4}, 38.2 ${midY - 7.6}, 35.2 ${midY - 3.8}
           L 33.8 ${midY}
           L 35.2 ${midY + 3.8}
           C 38.0 ${midY + 7.6}, 43.2 ${midY + 10.6}, 52.8 ${midY + bellyDeep}
           C 64.0 ${midY + bellyDeep + 0.6}, 76.5 ${midY + bellyDeep + 0.2}, 86.0 ${midY + 8.4}
           C 92.2 ${midY + 6.8}, 97.2 ${midY + 3.4}, ${snoutTipX} ${midY + 0.4}
           C ${snoutTipX + 0.45} ${midY - 0.4}, ${snoutTipX + 0.4} ${midY - 1.1}, ${snoutTipX} ${midY - 1.6} Z`}
        fill={v.body}
      />

      {/* Slate dorsum with vertical volume */}
      <path
        d={`M 98.6 ${midY - 2.4}
           C 92.4 ${midY - 8.8}, 80.0 ${midY - 12.6}, 64.0 ${midY - 12.6}
           C 50.0 ${midY - 12.6}, 40.0 ${midY - 9.6}, 35.0 ${midY - 4.6}
           L 34.0 ${midY - 0.2}
           C 48 ${midY + 1.8}, 66 ${midY + 2.2}, 82 ${midY + 0.6}
           C 90.5 ${midY - 0.4}, 95.4 ${midY - 1.4}, 98.6 ${midY - 2.4} Z`}
        fill={dorsum}
        opacity="0.96"
      />

      {/* Soft mid-tone seam so the countershade is not a hard cartoon edge */}
      {seam ? (
        <path
          d={`M 97.2 ${midY + 0.2}
             C 90 ${midY + 1.6}, 78 ${midY + 3.4}, 66 ${midY + 3.8}
             C 54 ${midY + 4.0}, 44 ${midY + 3.2}, 35.4 ${midY + 1.6}
             C 46 ${midY + 5.4}, 62 ${midY + 6.2}, 78 ${midY + 4.6}
             C 88 ${midY + 3.6}, 94 ${midY + 2.0}, 97.2 ${midY + 0.2} Z`}
          fill={`url(#${seam})`}
          opacity="0.7"
        />
      ) : null}

      {/* White belly — irregular wavy (not zigzag) mottled seam, underslung under the snout */}
      <path
        d={`M 98.8 ${midY + 0.6}
           C 96.6 ${midY - 0.4}, 94.8 ${midY + 1.2}, 93.2 ${midY + 0.2}
           C 91.2 ${midY - 1.0}, 89.6 ${midY + 1.8}, 87.6 ${midY + 1.0}
           C 85.4 ${midY + 0.2}, 83.6 ${midY + 2.6}, 81.2 ${midY + 2.0}
           C 78.6 ${midY + 1.2}, 76.4 ${midY + 3.4}, 73.6 ${midY + 2.8}
           C 70.6 ${midY + 2.0}, 68.2 ${midY + 4.0}, 65.0 ${midY + 3.4}
           C 61.8 ${midY + 2.6}, 59.2 ${midY + 4.4}, 56.0 ${midY + 3.6}
           C 52.6 ${midY + 2.6}, 49.8 ${midY + 4.2}, 46.6 ${midY + 3.2}
           C 43.4 ${midY + 2.2}, 40.6 ${midY + 4.0}, 37.6 ${midY + 2.8}
           C 36.2 ${midY + 2.2}, 35.0 ${midY + 3.2}, 34.2 ${midY + 4.2}
           C 37.6 ${midY + 8.8}, 50.0 ${midY + 11.4}, 64.5 ${midY + 11.2}
           C 78.8 ${midY + 11.0}, 90.6 ${midY + 7.6}, 97.6 ${midY + 3.2}
           C 99.4 ${midY + 2.0}, 99.6 ${midY + 1.2}, 98.8 ${midY + 0.6} Z`}
        fill={belly}
        opacity="0.98"
      />
      {/* A few irregular blotches along the seam — mottled, not saw teeth */}
      {[
        [92.4, midY + 0.4, 1.5, 0.7],
        [85.8, midY + 1.5, 1.7, 0.8],
        [77.6, midY + 2.2, 1.6, 0.7],
        [68.8, midY + 3.0, 1.8, 0.85],
        [59.4, midY + 2.8, 1.5, 0.7],
        [50.2, midY + 2.6, 1.4, 0.65],
        [42.0, midY + 2.4, 1.2, 0.6],
        [36.6, midY + 3.0, 1.0, 0.55],
      ].map(([x, y, rx, ry], i) => (
        <ellipse
          key={`gw-blotch-${i}`}
          cx={x}
          cy={y}
          rx={rx}
          ry={ry}
          fill={v.top}
          opacity={0.22 + (i % 3) * 0.07}
        />
      ))}

      {sheen ? (
        <path
          d={`M 90 ${midY - 6.2}
             C 80 ${midY - 11.0}, 66 ${midY - 11.6}, 50 ${midY - 10.0}
             C 58 ${midY - 7.4}, 74 ${midY - 6.6}, 88 ${midY - 4.4} Z`}
          fill={`url(#${sheen})`}
          opacity="0.55"
        />
      ) : null}

      {v.stripes
        ? [
            [44, 2.2, 1.7],
            [51, -1.6, 2.1],
            [58, 2.0, 1.6],
            [65, -1.2, 2.0],
            [72, 1.8, 1.5],
            [79, -0.8, 1.8],
            [86, 1.2, 1.3],
          ].map(([x, amp, w], i) => (
            <path
              key={`stripe-${x}`}
              d={`M ${x} ${midY - 9.0 + (i % 2) * 0.6} Q ${x + amp} ${midY - 1} ${x - 0.4} ${midY + 4.2}`}
              stroke="#2a2318"
              strokeWidth={w}
              opacity="0.38"
              fill="none"
              strokeLinecap="round"
            />
          ))
        : null}

      {/* Tall falcate first dorsal — convex leading edge, slightly concave trailing */}
      <path
        d={`M 51.0 ${midY - 11.0}
           C 52.4 ${midY - 17.6}, 54.2 ${dorsalTipY - 1.2}, 56.6 ${dorsalTipY}
           C 58.2 ${dorsalTipY + 0.8}, 59.4 ${midY - 9.0}, 62.4 ${midY - 9.8}
           C 63.0 ${midY - 9.4}, 62.6 ${midY - 8.8}, 61.6 ${midY - 8.8}
           C 59.0 ${midY - 10.4}, 55.2 ${midY - 11.2}, 51.0 ${midY - 11.0} Z`}
        fill={finFill}
        stroke="rgba(2,6,23,0.35)"
        strokeWidth="0.45"
        strokeLinejoin="round"
      />
      <path
        d={`M 52.8 ${midY - 11.0} L 56.6 ${dorsalTipY + 3.2} L 59.8 ${midY - 9.6} Z`}
        fill={v.highlight}
        opacity="0.18"
      />

      {/* Far-side pectoral — pale underside, dark tip, aft and down */}
      <path
        d={`M 67.5 ${midY + 7.0}
           C 63.0 ${midY + 11.4}, 57.0 ${midY + 15.0}, 51.6 ${midY + 16.0}
           C 50.2 ${midY + 16.2}, 49.6 ${midY + 15.2}, 50.4 ${midY + 14.4}
           C 54.6 ${midY + 11.6}, 60.0 ${midY + 8.0}, 65.4 ${midY + 6.2}
           C 66.6 ${midY + 6.0}, 67.2 ${midY + 6.4}, 67.5 ${midY + 7.0} Z`}
        fill={v.belly}
        opacity="0.9"
      />
      <path
        d={`M 54.0 ${midY + 14.6} C 52.4 ${midY + 15.6}, 51.0 ${midY + 16.0}, 50.4 ${midY + 14.8}
           C 51.8 ${midY + 14.0}, 53.2 ${midY + 14.2}, 54.0 ${midY + 14.6} Z`}
        fill={v.fin}
        opacity="0.82"
      />

      {/* Near-side sickle pectoral — root just aft of the 5th gill, sweeps aft and down */}
      <path
        d={`M 69.0 ${midY + 5.2}
           C 63.4 ${midY + 11.6}, 55.4 ${midY + 18.4}, 47.2 ${midY + 20.0}
           C 45.4 ${midY + 20.2}, 44.6 ${midY + 18.8}, 45.6 ${midY + 17.6}
           C 51.0 ${midY + 12.6}, 58.0 ${midY + 7.0}, 64.6 ${midY + 4.2}
           C 66.4 ${midY + 3.6}, 68.0 ${midY + 4.0}, 69.0 ${midY + 5.2} Z`}
        fill={finFill}
        opacity="0.98"
      />
      <path
        d={`M 67.8 ${midY + 5.4}
           C 62.2 ${midY + 10.6}, 55.2 ${midY + 16.0}, 48.6 ${midY + 18.2}
           L 63.6 ${midY + 4.6} Z`}
        fill={v.belly}
        opacity="0.22"
      />

      {/* Pelvic — modest, mostly white, dark leading edge */}
      <path
        d={`M 49.8 ${midY + 9.4} C 47.4 ${midY + 13.6}, 44.2 ${midY + 14.8}, 42.0 ${midY + 11.2} L 47.6 ${midY + 8.2} Z`}
        fill={v.belly}
        opacity="0.96"
      />
      <path d={`M 49.8 ${midY + 9.4} L 47.6 ${midY + 8.2} L 45.8 ${midY + 12.0} Z`} fill={v.fin} opacity="0.82" />

      {/* Anal + tiny second dorsal, opposite each other ahead of the peduncle */}
      <path d={`M 40.4 ${midY + 7.6} L 38.2 ${midY + 11.2} L 36.6 ${midY + 7.8} Z`} fill={v.belly} opacity="0.9" />
      <path d={`M 40.4 ${midY + 7.6} L 38.8 ${midY + 7.2} L 37.8 ${midY + 10.4} Z`} fill={v.fin} opacity="0.7" />
      <path d={`M 41.2 ${midY - 7.0} L 43.2 ${midY - 10.8} L 45.4 ${midY - 6.6} Z`} fill={v.fin} opacity="0.92" />

      {/* Five slightly curved gill slits just ahead of the pectoral root */}
      {[81.0, 77.6, 74.2, 70.8, 67.4].map((x, i) => (
        <path
          key={`gw-gill-${x}`}
          d={`M ${x} ${midY - 5.4 - i * 0.1} Q ${x - 1.7} ${midY + 0.2} ${x + 0.15} ${midY + 5.2 - i * 0.12}`}
          stroke={v.gill}
          strokeWidth="1.05"
          opacity={0.7 - i * 0.04}
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {/* Conical snout — charcoal cap, white underslung jaw, not a smiling face at the tip */}
      <path
        d={`M 91.0 ${midY - 6.8}
            C 95.6 ${midY - 8.2}, 99.2 ${midY - 5.4}, ${snoutTipX} ${midY - 1.6}
            C ${snoutTipX + 0.35} ${midY - 0.6}, ${snoutTipX + 0.2} ${midY + 0.3}, ${snoutTipX - 0.6} ${midY + 0.7}
            C 96.8 ${midY + 2.8}, 93.0 ${midY + 3.6}, 89.8 ${midY + 3.0}
            Z`}
        fill={v.body}
      />
      <path
        d={`M 91.2 ${midY - 6.4} C 95.6 ${midY - 7.8}, 99.0 ${midY - 4.6}, ${snoutTipX - 0.7} ${midY - 1.8}
            C 96.0 ${midY - 4.8}, 93.0 ${midY - 5.8}, 91.2 ${midY - 5.6} Z`}
        fill={v.top}
        opacity="0.9"
      />
      <path
        d={`M 90.0 ${midY + 2.2} C 94.0 ${midY + 3.0}, 97.4 ${midY + 1.4}, ${snoutTipX - 1.6} ${midY + 0.5}
            C 95.6 ${midY + 2.4}, 92.2 ${midY + 3.0}, 90.0 ${midY + 2.8} Z`}
        fill={v.belly}
        opacity="0.97"
      />
      {/* Nostril */}
      <ellipse cx={snoutTipX - 6.4} cy={midY - 1.4} rx="0.7" ry="0.35" fill={v.gill} opacity="0.7" />

      {/* Round black eye with a tiny wet highlight — sits above the mouth corner */}
      <circle cx="88.2" cy={midY - 3.6} r="1.55" fill={eyeColor} />
      <circle cx="88.65" cy={midY - 4.05} r="0.38" fill="#f8fafc" opacity="0.75" />

      {/* Underslung mouth cavity + triangular teeth */}
      <path
        d={
          jawOpen
            ? `M 83.8 ${midY + 3.2} Q 90.8 ${midY + 4.4} 96.0 ${midY + 2.8} Q 93.0 ${midY + 13.0} 87.0 ${midY + 13.4} Q 83.4 ${midY + 10.0} 83.8 ${midY + 5.6} Z`
            : `M 83.8 ${midY + 3.2} Q 90.8 ${midY + 4.8} 96.0 ${midY + 3.0} Q 93.0 ${midY + 6.8} 87.2 ${midY + 6.4} Q 84.2 ${midY + 4.6} 83.8 ${midY + 3.8} Z`
        }
        fill="#0f172a"
        opacity="0.92"
      />
      <motion.path
        d={jawOpen ? mouthOpenUpper : mouthClosedUpper}
        stroke="#1e293b"
        strokeWidth="1.3"
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
        strokeWidth="1.2"
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
          {[85.0, 87.4, 89.8, 92.2, 94.4].map((x) => (
            <path
              key={`gw-tooth-${x}`}
              d={`M ${x} ${midY + 3.6} L ${x + 0.5} ${midY + 5.8} L ${x + 1.0} ${midY + 3.6} Z`}
              fill="#f8fafc"
              opacity="0.95"
            />
          ))}
        </motion.g>
      )}
    </>
  );
}

/** Tiger / generic — same improved great-white architecture + optional flank stripes. */
function StandardSharkBody(props) {
  return <GreatWhiteBody {...props} />;
}

/**
 * Killer whale — jet black with crisp white eye patch (black eye at the front of
 * the patch), grey saddle behind a tall upright dorsal, white chin-to-flank lobe,
 * large paddle pectorals that sweep aft and down, and a side-view fluke beat.
 */
function OrcaBody({ v, chomping, showTeeth, frozen, chompDelay = 0, ids }) {
  const eyePatch = v.eyePatch || "#f8fafc";
  const saddle = v.saddle || "#9ca3af";
  const chompStart = safeAnimDuration(chompDelay, 0);
  const shadowMode = v.id?.startsWith("shadow");
  const midY = 26;
  const waveX = 50;
  const pedX = 26;
  const pedLocalX = pedX - waveX;
  const sheen = ids?.orcaSheen;
  const saddleFill = ids?.orcaSaddle || saddle;
  const finFill = ids?.fin || v.fin;

  const pedTransition = frozen
    ? FROZEN_TRANSITION
    : { duration: ORCA_PEDUNCLE_DURATION, repeat: Infinity, ease: TAIL_SWAY_EASE };
  const flukeTransition = frozen
    ? FROZEN_TRANSITION
    : { duration: ORCA_FLUKE_DURATION, repeat: Infinity, ease: TAIL_SWAY_EASE };

  const mouthClosed = `M 88 ${midY + 4.0} Q 93.4 ${midY + 5.2} 97.2 ${midY + 3.4}`;
  const mouthOpen = `M 88 ${midY + 5.4} Q 94.2 ${midY + 11.6} 98.0 ${midY + 5.6}`;

  return (
    <>
      {/* Forward hull (rounded melon through the dorsal) — one continuous body, not a pasted ellipse */}
      <path
        d={`M 96.4 ${midY - 0.2}
           C 94.0 ${midY - 8.6}, 86.4 ${midY - 13.2}, 74.0 ${midY - 13.6}
           C 64.0 ${midY - 13.8}, 56.0 ${midY - 13.0}, ${waveX} ${midY - 11.6}
           L ${waveX} ${midY + 11.8}
           C 56.0 ${midY + 13.4}, 66.0 ${midY + 14.6}, 76.0 ${midY + 13.6}
           C 86.0 ${midY + 12.4}, 93.0 ${midY + 7.8}, 96.2 ${midY + 3.6}
           C 97.6 ${midY + 2.0}, 97.6 ${midY + 0.8}, 96.4 ${midY - 0.2} Z`}
        fill={v.body}
      />
      <path
        d={`M 94.6 ${midY - 2.2}
           C 88.0 ${midY - 10.8}, 74.0 ${midY - 13.8}, ${waveX + 1} ${midY - 11.4}
           L ${waveX} ${midY + 0.2}
           C 60 ${midY + 2.0}, 78 ${midY + 1.2}, 90 ${midY - 0.2}
           C 93.2 ${midY - 0.8}, 94.6 ${midY - 2.2}, 94.6 ${midY - 2.2} Z`}
        fill={v.top}
        opacity="0.88"
      />
      {sheen ? (
        <path
          d={`M 90 ${midY - 6.5}
             C 80 ${midY - 12.0}, 66 ${midY - 12.6}, 54 ${midY - 10.6}
             C 64 ${midY - 7.8}, 78 ${midY - 6.8}, 90 ${midY - 4.2} Z`}
          fill={`url(#${sheen})`}
          opacity="0.7"
        />
      ) : null}

      {/* White chin + belly lobe — rises on the flank behind the eye patch, then tapers */}
      <path
        d={`M 95.2 ${midY + 2.4}
           C 93.4 ${midY + 6.8}, 88.0 ${midY + 11.6}, 80.0 ${midY + 13.4}
           C 70.0 ${midY + 15.2}, 60.0 ${midY + 14.4}, ${waveX + 1} ${midY + 11.4}
           C 58.0 ${midY + 8.0}, 64.0 ${midY + 5.6}, 70.5 ${midY + 5.0}
           C 78.0 ${midY + 4.4}, 84.5 ${midY + 5.4}, 90.0 ${midY + 4.4}
           C 92.4 ${midY + 3.8}, 94.2 ${midY + 3.0}, 95.2 ${midY + 2.4} Z`}
        fill={v.belly}
        opacity={shadowMode ? 0.2 : 0.98}
      />

      {/*
        Rear third + fluke — vertical whale propulsion.
        Peduncle stays muscular; fluke is a thinner side-view crescent (not a club).
      */}
      <g transform={`translate(${waveX}, ${midY})`}>
        <motion.g
          animate={frozen ? { rotate: 0 } : { rotate: [8, -10, 8] }}
          transition={pedTransition}
          style={{ transformOrigin: "0px 0px", transformBox: "fill-box" }}
        >
          <path
            d={`M 2 -11.2
               C -4 -10.2, -10 -8.2, -16 -5.2
               C -20 -3.4, -22.8 -1.8, ${pedLocalX} -1.7
               L ${pedLocalX} 1.7
               C -22.8 1.8, -20 3.6, -16 5.6
               C -10 8.2, -4 10.4, 2 11.4
               Z`}
            fill={v.body}
          />
          <path
            d={`M 2 -11.0
               C -6 -9.6, -14 -6.6, ${pedLocalX + 0.3} -2.2
               L ${pedLocalX} 0.2
               C -10 1.4, -3 2.0, 2 1.2
               Z`}
            fill={v.top}
            opacity="0.9"
          />
          <path
            d={`M 2 9.8
               C -5 8.6, -13 5.4, ${pedLocalX + 0.4} 2.0
               L ${pedLocalX + 0.2} 0.2
               C -8 3.0, -2 4.6, 2 5.2
               Z`}
            fill={v.belly}
            opacity={shadowMode ? 0.16 : 0.88}
          />

          <g transform={`translate(${pedLocalX}, 0)`}>
            <motion.g
              animate={
                frozen
                  ? { rotate: 0, scaleY: 1 }
                  : {
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
              <path
                d={`M 0.8 -1.25
                   C -6.0 -1.9, -14.5 -2.4, -22.8 -1.8
                   C -25.6 -1.4, -27.2 -0.5, -27.4 0
                   C -27.2 0.5, -25.6 1.4, -22.8 1.8
                   C -14.5 2.4, -6.0 1.9, 0.8 1.25
                   C 1.4 0.6, 1.4 -0.6, 0.8 -1.25 Z`}
                fill={finFill}
                stroke="rgba(248,250,252,0.18)"
                strokeWidth="0.4"
                strokeLinejoin="round"
              />
              <path
                d={`M 0.6 -0.9 C -2.4 -1.1, -6.0 -1.0, -9.2 -0.6 L -9.0 0.6 C -5.8 1.0, -2.2 0.9, 0.6 0.7 Z`}
                fill={v.body}
                opacity="0.9"
              />
            </motion.g>
          </g>
        </motion.g>
      </g>

      {/* Grey saddle — comma / chevron immediately behind the dorsal */}
      <path
        d={`M 48.5 ${midY - 11.4}
           C 44.0 ${midY - 12.2}, 38.5 ${midY - 10.6}, 35.6 ${midY - 7.6}
           C 38.2 ${midY - 9.6}, 43.0 ${midY - 9.0}, 46.6 ${midY - 7.0}
           C 50.4 ${midY - 5.6}, 55.0 ${midY - 6.4}, 57.6 ${midY - 8.8}
           C 55.4 ${midY - 11.0}, 51.8 ${midY - 11.8}, 48.5 ${midY - 11.4} Z`}
        fill={saddleFill}
        opacity={shadowMode ? 0.18 : 0.96}
      />

      {/* Tall upright triangular dorsal — slightly raked, concave trailing edge, wild (not flopped) */}
      <path
        d={`M 53.0 ${midY - 11.4}
           C 54.0 ${midY - 19.0}, 55.2 ${midY - 26.8}, 56.6 ${midY - 30.4}
           C 57.2 ${midY - 31.2}, 58.2 ${midY - 30.6}, 58.4 ${midY - 29.6}
           C 59.4 ${midY - 22.4}, 60.6 ${midY - 15.6}, 62.2 ${midY - 10.8}
           C 61.4 ${midY - 10.4}, 59.2 ${midY - 10.6}, 56.8 ${midY - 11.0}
           C 55.0 ${midY - 11.2}, 53.8 ${midY - 11.4}, 53.0 ${midY - 11.4} Z`}
        fill={finFill}
        stroke="rgba(2,6,23,0.4)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path
        d={`M 54.2 ${midY - 11.6} L 56.6 ${midY - 28.0} L 59.6 ${midY - 11.2} Z`}
        fill={v.highlight}
        opacity="0.22"
      />

      {/* Far-side paddle, aft and down, mostly tucked */}
      <path
        d={`M 71.0 ${midY + 6.8}
           C 67.0 ${midY + 12.0}, 60.0 ${midY + 16.5}, 54.0 ${midY + 16.2}
           C 52.6 ${midY + 16.0}, 52.4 ${midY + 14.6}, 53.8 ${midY + 14.0}
           C 59.0 ${midY + 12.0}, 65.0 ${midY + 8.2}, 69.4 ${midY + 5.8}
           C 70.4 ${midY + 5.4}, 71.4 ${midY + 6.0}, 71.0 ${midY + 6.8} Z`}
        fill={v.fin}
        opacity="0.55"
      />

      {/* Near-side paddle pectoral — large, rounded, sweeps AFT and down (toward the tail) */}
      <path
        d={`M 72.4 ${midY + 7.0}
           C 69.0 ${midY + 14.0}, 61.0 ${midY + 20.6}, 52.0 ${midY + 21.0}
           C 49.6 ${midY + 21.0}, 48.8 ${midY + 18.8}, 50.8 ${midY + 17.6}
           C 57.0 ${midY + 14.2}, 64.0 ${midY + 9.2}, 69.4 ${midY + 5.6}
           C 70.8 ${midY + 4.8}, 72.6 ${midY + 5.4}, 72.4 ${midY + 7.0} Z`}
        fill={finFill}
        opacity="0.98"
      />
      <path
        d={`M 71.0 ${midY + 7.2} C 67.0 ${midY + 13.0}, 60.4 ${midY + 18.2}, 53.6 ${midY + 19.2} L 68.4 ${midY + 6.0} Z`}
        fill={v.highlight}
        opacity="0.16"
      />

      {/* Soft blowhole on the melon */}
      <ellipse cx="88.4" cy={midY - 8.6} rx="1.3" ry="0.55" fill="#000" opacity="0.45" />

      {/* White eye patch — elongated, rear-pointed, front-rounded; eye inset inside the patch */}
      <path
        d={`M 87.6 ${midY - 2.0}
           C 86.4 ${midY - 4.8}, 83.0 ${midY - 7.0}, 78.4 ${midY - 7.6}
           C 74.8 ${midY - 8.0}, 72.2 ${midY - 6.6}, 71.6 ${midY - 4.8}
           C 71.2 ${midY - 3.4}, 73.4 ${midY - 2.2}, 77.0 ${midY - 1.6}
           C 81.0 ${midY - 0.8}, 85.2 ${midY - 0.6}, 87.6 ${midY - 2.0} Z`}
        fill={eyePatch}
        opacity={shadowMode ? 0.22 : 1}
      />
      <circle cx="84.4" cy={midY - 3.15} r="1.05" fill={v.eye || "#050505"} />
      <circle cx="84.75" cy={midY - 3.5} r="0.28" fill="#f8fafc" opacity={shadowMode ? 0.2 : 0.8} />

      {/* Soft mouth line */}
      <motion.path
        d={mouthClosed}
        stroke={shadowMode ? "#050505" : "#111827"}
        strokeWidth="1.15"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? { d: [mouthClosed, mouthOpen, mouthClosed] }
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
          {[90.0, 92.8, 95.4].map((x) => (
            <path
              key={`ot-${x}`}
              d={`M ${x} ${midY + 4.4} L ${x + 0.85} ${midY + 7.2} L ${x + 1.7} ${midY + 4.4} Z`}
              fill="#f8fafc"
            />
          ))}
        </motion.g>
      )}
    </>
  );
}

function HammerheadBody({ v, chomping, showTeeth, scary, frozen, chompDelay = 0, ids }) {
  const eyeColor = scary ? "#dc2626" : v.eye;
  const jawOpen = chomping ? 1 : 0;
  const chompStart = safeAnimDuration(chompDelay, 0);
  const dorsum = ids?.dorsum || v.top;
  const belly = ids?.belly || v.belly;
  const finFill = ids?.fin || v.fin;
  const caudalFill = ids?.caudal || v.fin;
  const sheen = ids?.sheen;
  const midY = 24;

  const mouthClosedUpper = "M 82 25.2 Q 88 26.2 93.2 25.4";
  const mouthClosedLower = "M 82 26.2 Q 88 27.4 93.0 26.4";
  const mouthOpenUpper = "M 82 24.8 Q 88 25.6 93.2 25.0";
  const mouthOpenLower = "M 82 27.4 Q 88 33.6 93.4 28.2";

  return (
    <>
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
          d={`M 3.2 ${midY - 4.4}
             C -2.0 ${midY - 8.0}, -8.0 ${midY - 12.4}, -13.2 ${midY - 14.8}
             C -14.8 ${midY - 15.6}, -15.8 ${midY - 14.2}, -14.6 ${midY - 13.2}
             C -10.0 ${midY - 9.2}, -5.4 ${midY - 5.2}, -2.0 ${midY - 2.0}
             C -1.2 ${midY - 1.2}, -1.0 ${midY - 0.4}, -1.2 ${midY}
             C -1.0 ${midY + 0.4}, -1.2 ${midY + 1.2}, -2.0 ${midY + 2.0}
             C -5.4 ${midY + 5.4}, -10.0 ${midY + 9.4}, -14.4 ${midY + 13.2}
             C -15.6 ${midY + 14.2}, -14.6 ${midY + 15.6}, -13.0 ${midY + 14.6}
             C -8.0 ${midY + 12.0}, -2.0 ${midY + 7.4}, 3.2 ${midY + 4.4}
             C 5.2 ${midY + 2.0}, 5.2 ${midY - 2.0}, 3.2 ${midY - 4.4} Z`}
          fill={caudalFill}
          stroke="rgba(2,6,23,0.35)"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path d={`M 6 ${midY - 4.6} L -1.5 ${midY - 1.6} L -2 ${midY} L -1.5 ${midY + 1.6} L 6 ${midY + 4.4} Z`} fill={v.body} opacity="0.92" />
      </motion.g>

      {/* Long fusiform body from cephalofoil back to the peduncle */}
      <path
        d={`M 78 ${midY - 8.4}
           C 58 ${midY - 11.0}, 32 ${midY - 10.4}, 8 ${midY - 6.4}
           C 3 ${midY - 5.2}, 1.2 ${midY - 2.4}, 1 ${midY}
           C 1.2 ${midY + 2.4}, 3 ${midY + 5.2}, 8 ${midY + 6.4}
           C 32 ${midY + 10.6}, 58 ${midY + 11.0}, 78 ${midY + 8.2}
           C 82 ${midY + 4.8}, 82 ${midY - 4.8}, 78 ${midY - 8.4} Z`}
        fill={v.body}
      />
      <path
        d={`M 76 ${midY - 7.8}
           C 58 ${midY - 10.8}, 32 ${midY - 10.0}, 8 ${midY - 6.0}
           L 2 ${midY - 0.2}
           C 24 ${midY + 2.0}, 54 ${midY + 2.2}, 76 ${midY - 1.0} Z`}
        fill={dorsum}
        opacity="0.88"
      />
      <path
        d={`M 78 ${midY + 1.2}
           C 60 ${midY + 3.6}, 36 ${midY + 4.8}, 12 ${midY + 3.0}
           C 8 ${midY + 4.8}, 10 ${midY + 7.0}, 16 ${midY + 8.0}
           C 40 ${midY + 11.0}, 64 ${midY + 10.2}, 78 ${midY + 7.0}
           C 81 ${midY + 5.0}, 80 ${midY + 2.4}, 78 ${midY + 1.2} Z`}
        fill={belly}
        opacity="0.95"
      />
      {sheen ? (
        <path
          d={`M 70 ${midY - 6.4} C 50 ${midY - 9.4}, 28 ${midY - 8.6}, 12 ${midY - 5.2}
             C 28 ${midY - 3.6}, 52 ${midY - 3.0}, 70 ${midY - 3.8} Z`}
          fill={`url(#${sheen})`}
          opacity="0.5"
        />
      ) : null}

      <path
        d={`M 50 ${midY - 9.6}
           C 52.2 ${midY - 16.4}, 55.4 ${midY - 20.8}, 58.2 ${midY - 21.6}
           C 60.4 ${midY - 20.2}, 62.2 ${midY - 14.0}, 64.4 ${midY - 9.0}
           C 63.4 ${midY - 8.6}, 60.0 ${midY - 9.0}, 56.6 ${midY - 9.4}
           C 54.0 ${midY - 9.6}, 51.6 ${midY - 9.6}, 50 ${midY - 9.6} Z`}
        fill={finFill}
      />
      {/* Near pectoral aft+down; no upward far-side fin */}
      <path
        d={`M 66 ${midY + 5.6}
           C 60 ${midY + 12.6}, 52 ${midY + 16.0}, 45 ${midY + 15.2}
           C 43.6 ${midY + 15.0}, 43.6 ${midY + 13.4}, 45.2 ${midY + 13.0}
           C 52 ${midY + 11.0}, 58 ${midY + 7.2}, 63.4 ${midY + 4.8}
           C 64.8 ${midY + 4.4}, 66.4 ${midY + 4.8}, 66 ${midY + 5.6} Z`}
        fill={finFill}
        opacity="0.9"
      />
      <path d={`M 22 ${midY + 7.0} C 16 ${midY + 12.2}, 10 ${midY + 11.0}, 8 ${midY + 7.6} L 18 ${midY + 5.4} Z`} fill={finFill} opacity="0.8" />
      <path d={`M 20 ${midY - 6.4} L 23 ${midY - 9.8} L 26 ${midY - 6.0} Z`} fill={finFill} opacity="0.85" />

      {[62, 57, 52, 47, 42].map((x, i) => (
        <path
          key={`hgill-${x}`}
          d={`M ${x} ${midY - 5.2 - i * 0.08} Q ${x - 1.6} ${midY} ${x} ${midY + 5.0}`}
          stroke={v.gill}
          strokeWidth="1.05"
          opacity={0.58 - i * 0.03}
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {/* Cephalofoil — wide curved hammer, eyes at the wing tips, shallow central notch (no sword beak) */}
      <path
        d={`M 74 ${midY}
           C 76 ${midY - 10.5}, 82 ${midY - 17.6}, 90 ${midY - 18.4}
           C 94 ${midY - 18.8}, 96.4 ${midY - 17.0}, 95.6 ${midY - 14.6}
           C 94.2 ${midY - 8.0}, 93.4 ${midY - 3.2}, 93.0 ${midY}
           C 93.4 ${midY + 3.2}, 94.2 ${midY + 8.0}, 95.6 ${midY + 14.6}
           C 96.4 ${midY + 17.0}, 94 ${midY + 18.8}, 90 ${midY + 18.4}
           C 82 ${midY + 17.6}, 76 ${midY + 10.5}, 74 ${midY} Z`}
        fill={v.body}
        stroke="rgba(2,6,23,0.32)"
        strokeWidth="0.55"
        strokeLinejoin="round"
      />
      <path
        d={`M 76 ${midY}
           C 78 ${midY - 9.0}, 83.5 ${midY - 15.4}, 90 ${midY - 16.2}
           C 88 ${midY - 8.0}, 87.2 ${midY - 3.0}, 87 ${midY}
           C 87.2 ${midY + 3.0}, 88 ${midY + 8.0}, 90 ${midY + 16.2}
           C 83.5 ${midY + 15.4}, 78 ${midY + 9.0}, 76 ${midY} Z`}
        fill={dorsum}
        opacity="0.55"
      />
      {/* Shallow anterior notch, not a protruding snout */}
      <path
        d={`M 92.8 ${midY - 2.4} C 95.4 ${midY - 1.0}, 95.4 ${midY + 1.0}, 92.8 ${midY + 2.4} C 94.8 ${midY + 0.8}, 94.8 ${midY - 0.8}, 92.8 ${midY - 2.4} Z`}
        fill={v.body}
      />
      <path d={`M 86 ${midY + 2} C 88 ${midY + 5}, 90 ${midY + 5.6}, 92 ${midY + 3.2} L 88 ${midY + 1.6} Z`} fill={v.belly} opacity="0.7" />

      {/* Dark eyes at the ends of the wings — no cartoon white sclera */}
      <circle cx="90.2" cy="8.2" r="1.7" fill={eyeColor} />
      <circle cx="90.55" cy="7.8" r="0.4" fill="#f8fafc" opacity="0.7" />
      <circle cx="90.2" cy="39.8" r="1.7" fill={eyeColor} />
      <circle cx="90.55" cy="39.4" r="0.4" fill="#f8fafc" opacity="0.7" />

      <path
        d={
          jawOpen
            ? "M 81.5 25.0 Q 88 26.0 93.4 25.2 Q 91 32.4 86 32.6 Q 81.8 29.0 81.5 26.6 Z"
            : "M 81.5 24.8 Q 88 26.0 93.4 25.2 Q 90 27.4 86 27.0 Q 82.2 25.8 81.5 25.2 Z"
        }
        fill="#0f172a"
        opacity="0.82"
      />
      <motion.path
        d={jawOpen ? mouthOpenUpper : mouthClosedUpper}
        stroke="#1e293b"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? { d: [mouthClosedUpper, mouthOpenUpper, mouthClosedUpper] }
            : undefined
        }
        transition={
          chomping
            ? { duration: 0.4, repeat: 2, ease: "easeInOut", delay: chompStart }
            : undefined
        }
      />
      <motion.path
        d={jawOpen ? mouthOpenLower : mouthClosedLower}
        stroke="#334155"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        animate={
          chomping
            ? { d: [mouthClosedLower, mouthOpenLower, mouthClosedLower] }
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
          {[84, 87, 90].map((x) => (
            <path
              key={`ht-${x}`}
              d={`M ${x} 25.2 L ${x + 0.7} 27.2 L ${x + 1.4} 25.2 Z`}
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
    ? "-22 -4 128 56"
    : v.orca
      ? // Clear tall upright dorsal tip (~y=-4) + fluke beat aft of peduncle
        "-16 -24 126 72"
      : // Tall falcate dorsal tip (~y=-11) + sickle pectoral hang need extra pad
        "-14 -18 128 66";
  // Stronger black depth when aggressive — never a red halo/glow.
  const shadow = scary
    ? "drop-shadow(0 3px 7px rgba(0,0,0,0.55))"
    : "drop-shadow(0 2px 6px rgba(0,0,0,0.45))";

  // Unique gradient ids per instance so several creatures can share a die.
  const uid = React.useId().replace(/:/g, "");
  const ids = {
    dorsum: `sk-dorsum-${uid}`,
    belly: `sk-belly-${uid}`,
    sheen: `sk-sheen-${uid}`,
    fin: `sk-fin-${uid}`,
    caudal: `sk-caudal-${uid}`,
    seam: `sk-seam-${uid}`,
    orcaSheen: `sk-orca-sheen-${uid}`,
    orcaSaddle: `sk-orca-saddle-${uid}`,
  };
  const idRefs = Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, `url(#${id})`]));
  // Body components take fill strings for fills and raw ids for paint servers they wrap.
  const paint = {
    dorsum: idRefs.dorsum,
    belly: idRefs.belly,
    fin: idRefs.fin,
    caudal: idRefs.caudal,
    sheen: ids.sheen,
    seam: ids.seam,
    orcaSheen: ids.orcaSheen,
    orcaSaddle: idRefs.orcaSaddle,
  };

  const bodyProps = {
    v,
    chomping,
    showTeeth,
    scary,
    frozen,
    chompDelay,
    ids: paint,
  };

  return (
    <svg viewBox={viewBox} width={size} height={size} style={{ filter: shadow, overflow: "visible" }}>
      <defs>
        {/* Rounded-body light: brighter along the back ridge, darker toward the seam */}
        <linearGradient id={ids.dorsum} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.highlight} stopOpacity="0.95" />
          <stop offset="22%" stopColor={v.top} />
          <stop offset="78%" stopColor={v.top} />
          <stop offset="100%" stopColor={v.body} />
        </linearGradient>
        <linearGradient id={ids.belly} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.belly} />
          <stop offset="70%" stopColor={v.belly} />
          <stop offset="100%" stopColor="#b9bec6" />
        </linearGradient>
        <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.fin} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.fin} />
          <stop offset="100%" stopColor={v.top} />
        </linearGradient>
        <linearGradient id={ids.caudal} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={v.fin} />
          <stop offset="100%" stopColor={v.top} />
        </linearGradient>
        <linearGradient id={ids.seam} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.body} stopOpacity="0" />
          <stop offset="50%" stopColor={v.highlight} stopOpacity="0.55" />
          <stop offset="100%" stopColor={v.belly} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.orcaSheen} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9aa3ad" stopOpacity="0" />
          <stop offset="50%" stopColor="#9aa3ad" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#9aa3ad" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.orcaSaddle} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={v.saddle || "#8a919a"} stopOpacity="0.15" />
          <stop offset="55%" stopColor={v.saddle || "#8a919a"} />
          <stop offset="100%" stopColor={v.saddle || "#8a919a"} stopOpacity="0.55" />
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
    const duration =
      7.4 +
      seededUnit(hashSeed(slotSeed, "dur")) * 5.6 +
      (variant.hammerhead ? 0.85 : 0) +
      (variant.orca ? 0.55 : 0) +
      (variant.age === "juvenile" ? -0.55 : 0) +
      (variant.age === "bull" ? 0.35 : 0);
    const delay = -(seededUnit(hashSeed(slotSeed, "delay")) * 5.4 + i * 1.15);
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
