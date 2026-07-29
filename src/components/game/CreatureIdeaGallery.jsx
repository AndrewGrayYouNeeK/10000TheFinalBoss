import { motion } from "framer-motion";

/** Concept creatures for /fish-showcase — emoji look, animated motion (not on dice yet). */

const CREATURES = [
  { id: "octopus", name: "Octopus", emoji: "🐙", note: "Round head + curling arms", mode: "bob", duration: 5 },
  { id: "seahorse", name: "Seahorse", emoji: "🐴", note: "Curved neck, tiny fins", mode: "bob", duration: 3.6 },
  { id: "turtle", name: "Sea turtle", emoji: "🐢", note: "Shell + flippers", mode: "swim", duration: 6 },
  { id: "crab", name: "Crab", emoji: "🦀", note: "Sideways scuttle + claws", mode: "scuttle", duration: 3 },
  { id: "dolphin", name: "Dolphin", emoji: "🐬", note: "Sleek jump arc", mode: "swim", duration: 4.2 },
  { id: "whale", name: "Whale", emoji: "🐋", note: "Big body, small eye", mode: "swim", duration: 6.5 },
  { id: "stingray", name: "Stingray", emoji: "🦇", note: "Flat diamond glide", mode: "swim", duration: 5.2 },
  { id: "shrimp", name: "Shrimp", emoji: "🦐", note: "Curved body, antennae", mode: "swim", duration: 3.4 },
  { id: "starfish", name: "Starfish", emoji: "⭐", note: "Five-point crawl", mode: "crawl", duration: 4.8 },
];

function MovingEmoji({ emoji, mode, duration, delay, dir }) {
  const animate =
    mode === "bob"
      ? {
          y: [0, -18, 0, 12, 0],
          x: [0, 10, 0, -10, 0],
          rotate: [-4, 4, -4],
        }
      : mode === "scuttle"
        ? {
            x: [-28, 28, -28],
            y: [4, 0, 4],
            rotate: [-6, 6, -6],
          }
        : mode === "crawl"
          ? {
              x: [-22, 22, -22],
              y: [6, 0, 6],
              rotate: [-14, 14, -14],
            }
          : {
              // swim / glide
              x: dir === 1 ? [-30, 30, 30, -30, -30] : [30, -30, -30, 30, 30],
              y: [0, -10, 0, 10, 0],
              scaleX: dir === 1 ? [1, 1, -1, -1, 1] : [-1, -1, 1, 1, -1],
            };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center text-5xl sm:text-6xl select-none"
      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))" }}
      animate={animate}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
        ...(mode === "swim" ? { times: [0, 0.4, 0.5, 0.9, 1] } : {}),
      }}
    >
      {emoji}
    </motion.div>
  );
}

export function CreatureIdeaGallery() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {CREATURES.map((c, i) => (
        <div
          key={c.id}
          className="rounded-2xl overflow-hidden border border-amber-500/25 bg-slate-950/80 shadow-lg shadow-cyan-950/40"
        >
          <div
            className="relative h-36 overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse at 40% 30%, rgba(56,189,248,0.35) 0%, transparent 55%), linear-gradient(180deg, #0c4a6e 0%, #082f49 45%, #042f2e 100%)",
            }}
          >
            <MovingEmoji
              emoji={c.emoji}
              mode={c.mode}
              duration={c.duration}
              delay={-(i * 0.4)}
              dir={i % 2 === 0 ? 1 : -1}
            />
          </div>
          <div className="px-3 py-2 border-t border-amber-900/40">
            <div className="text-sm font-bold text-amber-100">{c.name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{c.note} · idea only</div>
          </div>
        </div>
      ))}
    </div>
  );
}
