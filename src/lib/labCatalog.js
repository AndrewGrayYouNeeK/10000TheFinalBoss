/**
 * Single catalog of private editor / lab / video tools.
 * Primary entry: /labs (LabsHub). Keep routes for deep links, but don't scatter entry points.
 */

export const LAB_HUB_SECTIONS = [
  {
    id: "sprites",
    title: "Dice & sprites",
    blurb: "Crop faces, lock tuning, power videos",
    items: [
      {
        to: "/sprite-lab",
        title: "Sprite Lab",
        description: "Pick any lab skin — crop, faces, power clips",
      },
      {
        to: "/sprite-lab/matrix",
        title: "Matrix (Neo)",
        description: "Shortcut into Matrix sprite lab",
      },
      {
        to: "/sprite-lab/shark_gel",
        title: "Shark Tank",
        description: "Fish aquarium regular · sharks on power · story videos",
      },
      {
        to: "/sprite-lab/ice",
        title: "Frozen Ice",
        description: "Ice sprite + freeze overlays",
      },
      {
        to: "/preview-dice",
        title: "Custom / Preview Lab",
        description: "Experimental custom dice effects",
      },
    ],
  },
  {
    id: "felt",
    title: "Table felts",
    blurb: "Texture fit and sharpness",
    items: [
      {
        to: "/felt-lab",
        title: "Felt Lab",
        description: "Tune every table felt texture",
      },
    ],
  },
  {
    id: "powers",
    title: "Power FX labs",
    blurb: "Shark Tank aquarium, Shark Bite, freeze, fish showcase",
    items: [
      {
        to: "/shark-tank-lab",
        title: "Shark Tank Lab",
        description: "Aquarium preview · story + bite video uploads · power mode",
      },
      {
        to: "/sprite-lab/shark_gel",
        title: "Shark Tank sprite / shell",
        description: "Crop & shell tools for shark_gel",
      },
      {
        to: "/shark-bite-lab",
        title: "Shark Bite Lab",
        description: "Chomp clips, chroma, layout",
      },
      {
        to: "/fish-showcase",
        title: "Fish Showcase",
        description: "Aquarium / fish VFX preview",
      },
      {
        to: "/ice-lab",
        title: "Ice / Freeze Lab",
        description: "Score Freeze & frosty power previews",
      },
    ],
  },
  {
    id: "video",
    title: "Videos & uploads",
    blurb: "Story bosses, power clips, asset vault",
    items: [
      {
        to: "/video-assets",
        title: "Video Assets",
        description: "All upload slots — story, powers, labs",
      },
    ],
  },
  {
    id: "player-tools",
    title: "Player polish tools",
    blurb: "Also listed here so nothing is buried in the shop",
    items: [
      {
        to: "/held-style",
        title: "Held Dice Glow",
        description: "Glow style when dice are held",
      },
      {
        to: "/soundwave-mic",
        title: "Soundwave Mic",
        description: "Mic presets for audio-reactive dice",
      },
    ],
  },
];
