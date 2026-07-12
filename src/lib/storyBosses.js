// Story Mode v2 — rebuilt ladder. Add bosses here as the story grows.
// Each opponent rolls with the dice skin they unlock for you on defeat.
//
// Difficulty controls AI banking behavior (see aiOpponent.js):
// - bankThreshold: minimum turn score before the AI considers banking
// - greed: 0..1, probability bonus toward rolling again past threshold
// - holdGreedy: hold all scoring dice vs. minimum required

import { BOSS_MEDIA, STORY_ASSETS } from "./storyAssets";

export const STORY_VERSION = 2;

function fight({
  id,
  name,
  title,
  avatar,
  color,
  chapter = null,
  isBoss = false,
  difficulty,
  gimmick = null,
  intro,
  winLine,
  loseLine,
  coins,
  xp,
  skin,
  videos = null,
  signVideo = null,
}) {
  const media = BOSS_MEDIA[id] || {};
  return {
    id,
    name,
    title,
    avatar: avatar || media.portrait || "🕶️",
    color,
    chapter,
    chipColor: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40",
    isBoss,
    difficulty,
    gimmick,
    intro,
    winLine,
    loseLine,
    bossSkinId: skin,
    rewards: { coins, xp, skin, felt: null },
    videos: videos || {
      intro: media.introVideo || null,
      victory: media.victoryVideo || null,
      defeat: media.defeatVideo || null,
    },
    signVideo: signVideo || STORY_ASSETS.signLoopVideo,
    media,
  };
}

export const BOSSES = [
  // ── Chapter 1: Enter the Grid ───────────────────────────────────────────
  fight({
    id: "neo",
    name: "Neo",
    title: "The One",
    avatar: BOSS_MEDIA.neo?.portrait,
    color: "from-green-500 to-slate-950",
    chapter: { id: "matrix", title: "Enter the Grid", order: 1 },
    difficulty: { bankThreshold: 450, greed: 0.12, holdGreedy: false },
    intro:
      "Wake up, player. The Matrix has you. Every roll is code — follow the white rabbit.",
    winLine: "You bent the spoon. The Grid is yours now.",
    loseLine: "There is no spoon. Only try again.",
    coins: 500,
    xp: 600,
    skin: "matrix",
  }),
];

export function getBoss(id) {
  return BOSSES.find((b) => b.id === id) || null;
}

export function getChapters() {
  const chapters = [];
  const seen = new Map();
  for (const boss of BOSSES) {
    const ch = boss.chapter || { id: "story", title: "Story", order: 99 };
    if (!seen.has(ch.id)) {
      const entry = { ...ch, bosses: [] };
      seen.set(ch.id, entry);
      chapters.push(entry);
    }
    seen.get(ch.id).bosses.push(boss);
  }
  return chapters.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function isBossUnlocked(bossId, bossesDefeated = []) {
  const idx = BOSSES.findIndex((b) => b.id === bossId);
  if (idx <= 0) return true;
  const prev = BOSSES[idx - 1];
  return bossesDefeated.includes(prev.id);
}

export function isBossDefeated(bossId, bossesDefeated = []) {
  return bossesDefeated.includes(bossId);
}

// In Story Mode the player's dice are forced by ladder progress.
export function getStoryPlayerSkin(bossesDefeated = []) {
  for (let i = BOSSES.length - 1; i >= 0; i--) {
    if (bossesDefeated.includes(BOSSES[i].id) && BOSSES[i].rewards?.skin) {
      return BOSSES[i].rewards.skin;
    }
  }
  return "paper";
}
