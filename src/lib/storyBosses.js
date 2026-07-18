// Boss Ladder — Story Mode
// Full roster lives in ALL_BOSSES; STORY_LADDER_IDS controls what appears in Story Mode.

import { isDevUnlockAll } from "./devUnlock";
// Each opponent rolls with the same dice skin they unlock for you on defeat.
//
// Difficulty controls how the AI decides to bank vs. push for hot dice.
// - bankThreshold: minimum turn score before the AI considers banking (lower = pushier = better)
// - greed: 0..1, probability bonus toward rolling again even past threshold
// - holdGreedy: when true, AI holds ALL scoring dice for max points; when false, holds minimum

// Helper to keep entries compact
function fight({ id, name, title, avatar, color, isBoss = false, difficulty, gimmick = null, intro, winLine, loseLine, coins, xp, skin, storyFeltId = "classic_green" }) {
  return {
    id,
    name,
    title,
    avatar,
    color,
    chipColor: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40",
    isBoss,
    difficulty,
    gimmick,
    intro,
    winLine,
    loseLine,
    bossSkinId: skin, // AI rolls with this skin
    storyFeltId,
    rewards: { coins, xp, skin, felt: null },
  };
}

const ALL_BOSSES = [
  // ── Tier 1: Street rats (easy) ─────────────────────────────────────────
  fight({
    id: "rookie", name: "The Rookie", title: "Back-Alley Beginner",
    avatar: "🎲", color: "from-emerald-500 to-teal-600",
    difficulty: { bankThreshold: 300, greed: 0.05, holdGreedy: false },
    intro: "Yeah, I just started rollin' last week. But hey — luck favors the new, right?",
    winLine: "Wait... that's it? You're tougher than you look.",
    loseLine: "Beginner's luck! I'll get you next time!",
    coins: 100, xp: 150, skin: "wood",
  }),
  fight({
    id: "tennis_kid", name: "Lobby Lucas", title: "Tennis Club Hustler",
    avatar: "🎾", color: "from-yellow-400 to-lime-600",
    difficulty: { bankThreshold: 350, greed: 0.08, holdGreedy: false },
    intro: "Quick game before my match? Loser buys gatorade.",
    winLine: "Good game. Net's that way if you wanna play for real.",
    loseLine: "Ace! Best two of three?",
    coins: 120, xp: 180, skin: "gold",
  }),
  fight({
    id: "convict", name: "Cellblock Sammy", title: "Just Got Out",
    avatar: "📜", color: "from-stone-400 to-stone-700",
    difficulty: { bankThreshold: 400, greed: 0.1, holdGreedy: false },
    intro: "Five years inside, all I did was roll paper dice. Wanna see?",
    winLine: "Eh. Back to the yard. At least it's quiet.",
    loseLine: "Folded like the warden! Pay up, freebird.",
    coins: 150, xp: 200, skin: "paper",
  }),
  fight({
    id: "hustler", name: "Vinny \"The Hustler\"", title: "Streetwise Operator",
    avatar: "🎩", color: "from-amber-500 to-orange-600",
    difficulty: { bankThreshold: 500, greed: 0.15, holdGreedy: false },
    intro: "Listen kid, I've been workin' these dice longer than you've been breathin'.",
    winLine: "Eh, anyone can have a bad night. Don't get used to it.",
    loseLine: "That's how a real hustler plays. Pay up.",
    coins: 200, xp: 280, skin: "obsidian",
  }),
  fight({
    id: "footballer", name: "Coach Brick", title: "Locker Room Legend",
    avatar: "🏈", color: "from-amber-700 to-orange-900",
    difficulty: { bankThreshold: 550, greed: 0.18, holdGreedy: false },
    intro: "Dice, football — it's all the same game. Inches matter.",
    winLine: "Tough D. Tough D.",
    loseLine: "TOUCHDOWN! Hand off the dice, rookie.",
    coins: 250, xp: 320, skin: "baseball",
  }),

  // ── Tier 2: Craftsmen & casuals ────────────────────────────────────────
  fight({
    id: "carpenter", name: "Old Man Burl", title: "Woodshop Wizard",
    avatar: "🪵", color: "from-amber-700 to-amber-950",
    difficulty: { bankThreshold: 600, greed: 0.2, holdGreedy: false },
    intro: "Carved my own dice. Now let's see who's got the grain for this.",
    winLine: "Beautiful roll. Like watching a chisel find the line.",
    loseLine: "Wood remembers, kid. So do I.",
    coins: 300, xp: 380, skin: "wood",
  }),
  fight({
    id: "snowman", name: "Frosty", title: "Winter Wanderer",
    avatar: "⛄", color: "from-sky-200 to-blue-400",
    difficulty: { bankThreshold: 600, greed: 0.2, holdGreedy: true },
    intro: "Come closer. The cold won't bite. ...much.",
    winLine: "M-melted again. Until next snow...",
    loseLine: "Brrrr-eautiful play!",
    coins: 320, xp: 400, skin: "ice", storyFeltId: "frozen_lake",
  }),
  fight({
    id: "fisherman", name: "Marlin Joe", title: "Deep Sea Captain",
    avatar: "🐟", color: "from-sky-400 to-blue-700",
    difficulty: { bankThreshold: 650, greed: 0.22, holdGreedy: true },
    intro: "Caught bigger fish than you, kid. Cast your dice.",
    winLine: "Heh. Slippery one. Reel ya in next time.",
    loseLine: "Catch of the day! That's you.",
    coins: 350, xp: 420, skin: "blue_gel", storyFeltId: "underwater",
  }),
  fight({
    id: "shark", name: "Card Shark Cleo", title: "Casino Floor Legend",
    avatar: "🦈", color: "from-cyan-500 to-blue-600",
    isBoss: true,
    difficulty: { bankThreshold: 700, greed: 0.25, holdGreedy: true },
    gimmick: {
      id: "head_start", name: "Head Start",
      description: "Cleo starts with 1,500 points already banked.",
      startScore: 1500,
    },
    intro: "Sweetie, I don't lose. I just let the fish think they're winning... for a bit.",
    winLine: "Hmph. Looks like the fish bit back this time.",
    loseLine: "Run home, little fish. The deep water isn't for you.",
    coins: 500, xp: 600, skin: "aquamarine",
  }),

  // ── Tier 3: Streetwise mid-tier ────────────────────────────────────────
  fight({
    id: "pride_dancer", name: "DJ Spectra", title: "Rooftop Headliner",
    avatar: "🌈", color: "from-pink-500 via-yellow-400 to-cyan-500",
    difficulty: { bankThreshold: 700, greed: 0.25, holdGreedy: true },
    intro: "Love the dice. The dice love back. Let's go.",
    winLine: "You move with the beat. Respect.",
    loseLine: "All colors, one win!",
    coins: 400, xp: 500, skin: "pride",
  }),
  fight({
    id: "ice_witch", name: "Glacia", title: "Frostbite Queen",
    avatar: "❄️", color: "from-cyan-200 to-sky-500",
    difficulty: { bankThreshold: 750, greed: 0.25, holdGreedy: true },
    intro: "Your hands will be cold before this is over.",
    winLine: "...the thaw was inevitable.",
    loseLine: "Frozen solid. Such a shame.",
    coins: 420, xp: 520, skin: "ice",
  }),
  fight({
    id: "teal_priest", name: "Brother Caelum", title: "Crystal Monk",
    avatar: "🧘", color: "from-cyan-300 to-teal-600",
    difficulty: { bankThreshold: 750, greed: 0.28, holdGreedy: true },
    intro: "Stillness. Patience. The dice will speak.",
    winLine: "The dice were loud today. I heard them clearly.",
    loseLine: "Silence. As I expected.",
    coins: 450, xp: 540, skin: "teal_crackle",
  }),
  fight({
    id: "ice_archer", name: "Crystallia", title: "Frozen Marksman",
    avatar: "🏹", color: "from-sky-200 to-cyan-400",
    difficulty: { bankThreshold: 800, greed: 0.3, holdGreedy: true },
    intro: "I never miss. Not with arrows. Not with dice.",
    winLine: "...impossible.",
    loseLine: "Bullseye.",
    coins: 480, xp: 580, skin: "aquamarine_light",
  }),
  fight({
    id: "phantom", name: "The Phantom", title: "Underground Champion",
    avatar: "👻", color: "from-purple-500 to-fuchsia-600",
    difficulty: { bankThreshold: 850, greed: 0.32, holdGreedy: true },
    intro: "...",
    winLine: "...impressive.",
    loseLine: "...as expected.",
    coins: 550, xp: 700, skin: "amethyst", storyFeltId: "void_violet",
  }),
  fight({
    id: "ghost", name: "The Ghost", title: "Spectral Shade",
    avatar: "🫥", color: "from-slate-400 to-slate-800",
    difficulty: { bankThreshold: 875, greed: 0.34, holdGreedy: true },
    intro: "You can see right through me. That won't help you read my rolls.",
    winLine: "...vanished.",
    loseLine: "...always watching.",
    coins: 600, xp: 750, skin: "ghost", storyFeltId: "obsidian_glass",
  }),
  fight({
    id: "moon_priestess", name: "Lunara", title: "Tidekeeper",
    avatar: "🌙", color: "from-slate-200 to-indigo-300",
    difficulty: { bankThreshold: 850, greed: 0.32, holdGreedy: true },
    intro: "The moon pulls the tides. And the dice.",
    winLine: "The tide turned. Well played.",
    loseLine: "The moon was on my side tonight.",
    coins: 580, xp: 720, skin: "moonstone",
  }),

  // ── Tier 4: Stylists & sharpers ────────────────────────────────────────
  fight({
    id: "florist", name: "Violet Velvet", title: "Fluorite Floral",
    avatar: "💐", color: "from-emerald-400 to-purple-600",
    difficulty: { bankThreshold: 900, greed: 0.33, holdGreedy: true },
    intro: "Pretty dice, ugly outcomes. For you.",
    winLine: "Roses for the winner. This time.",
    loseLine: "Petals fall. So do you.",
    coins: 620, xp: 760, skin: "fluorite",
  }),
  fight({
    id: "lavadragon", name: "Vulkanos", title: "Ragnarok Reborn",
    avatar: "🌋", color: "from-orange-500 to-red-800",
    difficulty: { bankThreshold: 900, greed: 0.4, holdGreedy: true },
    intro: "The world ends in fire. Yours ends here.",
    winLine: "Even fire cools, it seems...",
    loseLine: "ASH! TO ASH!",
    coins: 700, xp: 850, skin: "ragnarok", storyFeltId: "lava_flow",
  }),
  fight({
    id: "dragon_knight", name: "Sir Scalewyrm", title: "Dragon Knight",
    avatar: "🐲", color: "from-emerald-400 to-cyan-700",
    difficulty: { bankThreshold: 950, greed: 0.4, holdGreedy: true },
    intro: "My scales have turned a thousand blades. Roll, mortal.",
    winLine: "A worthy duel. Your name will live on.",
    loseLine: "Steel cannot pierce me. Neither could you.",
    coins: 750, xp: 900, skin: "dragon_scale", storyFeltId: "forest_floor",
  }),
  fight({
    id: "amber_collector", name: "Dr. Helix", title: "Resin Researcher",
    avatar: "🪲", color: "from-yellow-500 to-amber-800",
    difficulty: { bankThreshold: 950, greed: 0.42, holdGreedy: true },
    intro: "I preserve things. Permanently. You might be next.",
    winLine: "Fascinating specimen. You may go.",
    loseLine: "Frozen in amber forever. Beautiful.",
    coins: 780, xp: 920, skin: "amber_wasp",
  }),
  fight({
    id: "bloodletter", name: "Lady Veyra", title: "Bloodstone Witch",
    avatar: "🩸", color: "from-emerald-900 to-red-800",
    difficulty: { bankThreshold: 1000, greed: 0.42, holdGreedy: true },
    intro: "Every drop tells me your fate. Drop a die — drop a vein.",
    winLine: "...the stones lied today.",
    loseLine: "Just as the blood foretold.",
    coins: 820, xp: 960, skin: "ruby",
  }),

  // ── Tier 5: Bosses ─────────────────────────────────────────────────────
  fight({
    id: "ironhand", name: "Ironhand Magnus", title: "The Unbreakable",
    avatar: "🛡️", color: "from-slate-400 to-slate-600",
    isBoss: true,
    difficulty: { bankThreshold: 1100, greed: 0.35, holdGreedy: true },
    gimmick: {
      id: "farkle_shield", name: "Iron Will",
      description: "Magnus is immune to his FIRST farkle of the game.",
      farkleShield: 1,
    },
    intro: "Many have rolled. Few have won. None have broken me.",
    winLine: "...iron can rust, it seems. Well rolled.",
    loseLine: "As immovable as ever. Better luck next time, mortal.",
    coins: 1200, xp: 1500, skin: "silver",
  }),
  fight({
    id: "ruby_baron", name: "The Ruby Baron", title: "Crimson Aristocrat",
    avatar: "💍", color: "from-red-500 to-red-900",
    difficulty: { bankThreshold: 1100, greed: 0.4, holdGreedy: true },
    intro: "I bet rubies. You bet... whatever you have.",
    winLine: "I'll have my driver bring more rubies. Carry on.",
    loseLine: "Pay the baron. Or work it off.",
    coins: 1400, xp: 1600, skin: "ruby",
  }),
  fight({
    id: "labradorite_lord", name: "Lord Aurorus", title: "Flashstone Magnate",
    avatar: "🌌", color: "from-indigo-500 to-slate-800",
    difficulty: { bankThreshold: 1150, greed: 0.42, holdGreedy: true },
    intro: "The stone flashes. So does my fortune. Yours? Dimmer.",
    winLine: "Refracted away from me today.",
    loseLine: "Outshone. As predicted.",
    coins: 1500, xp: 1700, skin: "labradorite",
  }),
  fight({
    id: "polished_twin", name: "Madame Mirrora", title: "The Polished Reflection",
    avatar: "🪞", color: "from-indigo-400 to-slate-700",
    difficulty: { bankThreshold: 1200, greed: 0.43, holdGreedy: true },
    intro: "I am every win you've ever had. Reflected.",
    winLine: "A new reflection. I'll remember it.",
    loseLine: "You see yourself now? Defeated?",
    coins: 1600, xp: 1800, skin: "labradorite_polished",
  }),
  fight({
    id: "galaxia", name: "Galaxia", title: "Star-Eater",
    avatar: "🌠", color: "from-purple-600 to-indigo-900",
    isBoss: true,
    difficulty: { bankThreshold: 1200, greed: 0.45, holdGreedy: true },
    gimmick: {
      id: "head_start", name: "Cosmic Lead",
      description: "Galaxia starts with 2,000 points banked.",
      startScore: 2000,
    },
    intro: "I have devoured suns. Your dice are a snack.",
    winLine: "A pocket of light I did not see. Well done.",
    loseLine: "Another star, snuffed. Goodbye.",
    coins: 1800, xp: 2000, skin: "galaxy",
  }),

  // ── Tier 6: High-tech antagonists ──────────────────────────────────────
  fight({
    id: "hacker", name: "0xNyx", title: "Circuit Breaker",
    avatar: "💻", color: "from-sky-500 to-slate-800",
    difficulty: { bankThreshold: 1250, greed: 0.45, holdGreedy: true },
    intro: "Your dice are just bits. I rewrite bits.",
    winLine: "Patched. Move along.",
    loseLine: "Pwned. GG no re.",
    coins: 1900, xp: 2100, skin: "circuit_board",
  }),
  fight({
    id: "the_grid", name: "Glitch_Mistress", title: "Neon Grid Runner",
    avatar: "🕹️", color: "from-fuchsia-500 to-slate-900",
    difficulty: { bankThreshold: 1300, greed: 0.48, holdGreedy: true },
    intro: "The grid never lies. The dice always do.",
    winLine: "Disconnecting...",
    loseLine: "Game. Set. Patch.",
    coins: 2000, xp: 2200, skin: "neon_grid",
  }),
  fight({
    id: "tesla_phreak", name: "Tesla", title: "Lightning Conduit",
    avatar: "⚡", color: "from-purple-500 to-slate-900",
    isBoss: true,
    difficulty: { bankThreshold: 1350, greed: 0.5, holdGreedy: true },
    gimmick: {
      id: "doubled_sixes", name: "Power Surge",
      description: "Tesla's non-scoring dice often spark into 6s mid-roll.",
      doubledSixes: true,
    },
    intro: "Three. Six. Nine. The universe sings. You scream.",
    winLine: "Frequency interrupted. I'll re-tune.",
    loseLine: "ELECTRIFIED!",
    coins: 2400, xp: 2600, skin: "tesla",
  }),
  fight({
    id: "neo", name: "Neo", title: "The One",
    avatar: "/assets/neo_avatar.jpg", color: "from-green-500 to-slate-950",
    difficulty: { bankThreshold: 1350, greed: 0.5, holdGreedy: true },
    intro: "I see the code now. Every roll, before it lands.",
    winLine: "You bent the spoon. Not me.",
    loseLine: "There is no try. Only one.",
    coins: 2500, xp: 2700, skin: "matrix", storyFeltId: "matrix_rain",
  }),
  fight({
    id: "toxin", name: "Vex the Toxic", title: "Containment Failure",
    avatar: "☢️", color: "from-green-400 to-emerald-900",
    difficulty: { bankThreshold: 1400, greed: 0.52, holdGreedy: true },
    intro: "Hold the dice. They're warm. Probably fine.",
    winLine: "...the containment held just enough.",
    loseLine: "MELTDOWN!",
    coins: 2600, xp: 2800, skin: "toxic_plasma_v2",
  }),

  // ── Tier 7: Lords of style ─────────────────────────────────────────────
  fight({
    id: "gunslinger", name: "Bullet Ben", title: "Last Duelist",
    avatar: "🤠", color: "from-stone-300 to-stone-700",
    difficulty: { bankThreshold: 1400, greed: 0.5, holdGreedy: true },
    intro: "Six shooter. Six dice. Same difference.",
    winLine: "Quick draw. Quicker dice.",
    loseLine: "Yeehaw! Hand over the buckle.",
    coins: 2700, xp: 2900, skin: "obsidian",
  }),
  fight({
    id: "lover", name: "Aphrodite Prism", title: "Heart of the Rainbow",
    avatar: "💗", color: "from-pink-400 to-cyan-300",
    isBoss: true,
    difficulty: { bankThreshold: 1450, greed: 0.5, holdGreedy: true },
    gimmick: {
      id: "head_start", name: "Love Conquers All",
      description: "Aphrodite starts with 2,500 points banked.",
      startScore: 2500,
    },
    intro: "Love is love. So is winning.",
    winLine: "You loved every roll. Worthy.",
    loseLine: "Heartbreaker!",
    coins: 2900, xp: 3100, skin: "love_is_love",
  }),
  fight({
    id: "cashman", name: "Big Money Mo", title: "Cold Hard Cash",
    avatar: "💵", color: "from-emerald-400 to-green-700",
    difficulty: { bankThreshold: 1500, greed: 0.52, holdGreedy: true },
    intro: "Cash rules everything around me. C.R.E.A.M.",
    winLine: "Take the bag. Earned it.",
    loseLine: "Cha-ching! Pay up, partner.",
    coins: 3200, xp: 3400, skin: "gold",
  }),
  fight({
    id: "plasmaqueen", name: "Plasma Queen Zara", title: "Pink Storm",
    avatar: "🔮", color: "from-pink-500 to-fuchsia-700",
    difficulty: { bankThreshold: 1500, greed: 0.55, holdGreedy: true },
    intro: "Touch the orb. Don't touch the orb. Either way: lose.",
    winLine: "The plasma stilled. Just for you.",
    loseLine: "ELECTRIFIED IN PINK!",
    coins: 3400, xp: 3600, skin: "plasma",
  }),
  fight({
    id: "decimus", name: "Lord Decimus", title: "The Golden Overlord",
    avatar: "👑", color: "from-yellow-300 to-amber-700",
    isBoss: true,
    difficulty: { bankThreshold: 1500, greed: 0.55, holdGreedy: true },
    gimmick: {
      id: "doubled_sixes", name: "Crown of Sixes",
      description: "Every 6 the Overlord rolls counts as TWO 6s when scoring.",
      doubledSixes: true,
    },
    intro: "You stand before me, mortal? After ALL who have fallen?",
    winLine: "Impossible... the gold throne... is YOURS.",
    loseLine: "Ten thousand wins. You were always going to lose.",
    coins: 3800, xp: 4200, skin: "gold",
  }),
  fight({
    id: "obsidian_blade", name: "Damascus Edge", title: "The Patterned Blade",
    avatar: "🗡️", color: "from-slate-600 to-slate-900",
    difficulty: { bankThreshold: 1550, greed: 0.55, holdGreedy: true },
    intro: "Folded ten thousand times. Sharper than your luck.",
    winLine: "A clean cut. You drew first.",
    loseLine: "Steel doesn't bend. Neither do I.",
    coins: 4000, xp: 4400, skin: "obsidian",
  }),
  fight({
    id: "shattered", name: "The Shattered King", title: "Cracked & Cursed",
    avatar: "🪨", color: "from-stone-400 to-stone-800",
    difficulty: { bankThreshold: 1600, greed: 0.58, holdGreedy: true },
    intro: "Broken. Still here. Still winning.",
    winLine: "Another crack in the crown. Fine.",
    loseLine: "Pieces. All of you. Pieces.",
    coins: 4200, xp: 4600, skin: "labradorite",
  }),
  fight({
    id: "diamond_cut", name: "Vitrea", title: "The Diamond Sister",
    avatar: "💎", color: "from-cyan-100 to-sky-300",
    isBoss: true,
    difficulty: { bankThreshold: 1700, greed: 0.6, holdGreedy: true },
    gimmick: {
      id: "head_start", name: "Faceted Edge",
      description: "Vitrea starts with 3,000 points banked.",
      startScore: 3000,
    },
    intro: "I am the cut before the diamond. Sharp. Polished. Final-adjacent.",
    winLine: "My brother... I have failed you. He's coming for you next.",
    loseLine: "Brilliant. As I am.",
    coins: 4800, xp: 5400, skin: "crystal_cut", storyFeltId: "marble",
  }),

  // ── FINAL BOSS ─────────────────────────────────────────────────────────
  fight({
    id: "gq", name: "GQ", title: "The One On The Logo",
    avatar: "/assets/c03db5f60_IMG_0628.jpg",
    color: "from-cyan-100 via-white to-sky-300",
    isBoss: true,
    difficulty: { bankThreshold: 2000, greed: 0.7, holdGreedy: true },
    gimmick: {
      id: "final_boss",
      name: "Diamond Mind",
      description: "GQ is immune to his first 2 farkles, and his non-scoring dice spark into 6s.",
      farkleShield: 2,
      doubledSixes: true,
    },
    intro: "So. You climbed the whole ladder just to lose to me. Cute. Sit down. Roll. I'll be brief.",
    winLine: "...you. You actually... did it. The diamonds are yours. The throne is yours. I'll see myself out.",
    loseLine: "Don't take it personally. Nobody beats GQ. That's why I'm GQ.",
    coins: 10000, xp: 15000, skin: "crystal_cut", storyFeltId: "casino_vip",
  }),
];

/** Active story ladder — add boss IDs here one at a time as they're ready. */
export const STORY_LADDER_IDS = [
  "snowman",     // Frosty
  "fisherman",   // Marlin Joe — unlocks Blue Gel (Angelfish) dice + Shark Bite
  "phantom",     // The Phantom
  "ghost",       // The Ghost
  "lavadragon",  // Ragnarok
  "dragon_knight", // Sir Scalewyrm — unlocks Dragon Scale
  "neo",         // Matrix
  "diamond_cut", // Vitrea (diamond)
  "gq",          // GQ — final boss
];

export const BOSSES = STORY_LADDER_IDS.map((id) => ALL_BOSSES.find((b) => b.id === id)).filter(Boolean);

export function getBoss(id) {
  return BOSSES.find((b) => b.id === id) || null;
}

/** Story fights use the boss table felt — not the player's equipped felt. */
export function getStoryBossFeltId(bossId) {
  return getBossDefinition(bossId)?.storyFeltId ?? "classic_green";
}

/** Full roster lookup (includes bosses not yet on the active ladder). */
export function getBossDefinition(id) {
  return ALL_BOSSES.find((b) => b.id === id) ?? null;
}

/** Story fights: player slot 0 = you, slot 1 = boss. */
export const STORY_OPPONENT_INDEX = 1;

/** Banked score the boss starts with (head-start gimmick), or null. */
export function getBossHeadStartScore(bossOrId) {
  if (bossOrId && typeof bossOrId === "object") {
    const direct = bossOrId.gimmick?.startScore;
    if (typeof direct === "number" && direct > 0) return direct;
    return getBossHeadStartScore(bossOrId.id);
  }
  const score = getBossDefinition(bossOrId)?.gimmick?.startScore;
  return typeof score === "number" && score > 0 ? score : null;
}

/** Apply boss head-start gimmick onto createInitialState output. */
export function applyStoryBossHeadStart(state, bossOrId) {
  const startScore = getBossHeadStartScore(bossOrId);
  if (!state?.players?.[STORY_OPPONENT_INDEX] || startScore == null) return state;
  const players = [...state.players];
  players[STORY_OPPONENT_INDEX] = {
    ...players[STORY_OPPONENT_INDEX],
    score: startScore,
    onBoard: true,
  };
  return { ...state, players };
}

// Sequential ladder — previous fight must be cleared to unlock the next.
export function isBossUnlocked(bossId, bossesDefeated = []) {
  if (isDevUnlockAll()) return true;
  const idx = BOSSES.findIndex((b) => b.id === bossId);
  if (idx <= 0) return true;
  const prev = BOSSES[idx - 1];
  return bossesDefeated.includes(prev.id);
}

export function isBossDefeated(bossId, bossesDefeated = []) {
  return bossesDefeated.includes(bossId);
}

/** First unlocked boss the player has not cleared yet. */
export function getNextUnbeatenBossId(bossesDefeated = []) {
  for (const b of BOSSES) {
    if (isBossUnlocked(b.id, bossesDefeated) && !bossesDefeated.includes(b.id)) {
      return b.id;
    }
  }
  return null;
}

/** Ladder bookmark — stay on last boss attempted, or the next unbeaten fight. */
export function resolveStoryActiveBoss(savedBossId, bossesDefeated = []) {
  const fallback = getNextUnbeatenBossId(bossesDefeated);
  if (!fallback) return null;
  if (
    savedBossId &&
    isBossUnlocked(savedBossId, bossesDefeated) &&
    !bossesDefeated.includes(savedBossId)
  ) {
    return savedBossId;
  }
  return fallback;
}

// In Story Mode, the player's dice are forced — you start with Prison Dice ("paper")
// and roll with whatever skin you most recently unlocked by beating a boss in the ladder.
export function getStoryPlayerSkin(bossesDefeated = []) {
  // Walk the ladder backward and use the latest defeated boss's reward skin.
  for (let i = BOSSES.length - 1; i >= 0; i--) {
    if (bossesDefeated.includes(BOSSES[i].id) && BOSSES[i].rewards?.skin) {
      return BOSSES[i].rewards.skin;
    }
  }
  return "paper"; // Prison Dice — the starting kit.
}