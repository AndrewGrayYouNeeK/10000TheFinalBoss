import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import TurnBanner from "@/components/game/TurnBanner";
import CyberBackground from "@/components/game/CyberBackground";
import PlayerAvatarVideo from "@/components/game/PlayerAvatarVideo";
import {
  advanceRollOff,
  createRollOffState,
  formatRollOffStandings,
  rollRoundForPool,
} from "@/lib/turnOrderRollOff";

const ROLL_ANIM_MS = 650;
const ROUND_PAUSE_MS = 400;

function placeLabel(place) {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  if (place === 3) return "3rd";
  return `${place}th`;
}

export default function TurnOrderRollOff({
  playerNames,
  onComplete,
}) {
  const [rollOff, setRollOff] = useState(() => createRollOffState(playerNames.length));
  const [banner, setBanner] = useState("Rolling for turn order…");
  const [bannerVariant, setBannerVariant] = useState("info");
  const [rolling, setRolling] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [historicalRolls, setHistoricalRolls] = useState({});
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    timersRef.current = timers;

    const delay = (ms) =>
      new Promise((resolve) => {
        const id = window.setTimeout(resolve, ms);
        timers.push(id);
      });

    async function runAutomaticRollOff() {
      let state = createRollOffState(playerNames.length);

      while (!state.done && !cancelled) {
        setRolling(true);
        setBanner("Rolling for turn order…");
        setBannerVariant("info");
        setRollOff({ ...state, roundRolls: {} });

        await delay(ROLL_ANIM_MS);
        if (cancelled) return;

        const roundRolls = rollRoundForPool(state.pool);
        state = { ...state, roundRolls };
        setRollOff(state);
        setHistoricalRolls((prev) => ({ ...prev, ...roundRolls }));
        setRolling(false);

        await delay(ROUND_PAUSE_MS);
        if (cancelled) return;

        const advanced = advanceRollOff(state, playerNames);
        state = advanced;
        setRollOff(advanced);

        if (advanced.done) {
          setBanner(advanced.message);
          setBannerVariant("success");
          setShowResults(true);
          return;
        }

        if (advanced.tie) {
          setBanner(advanced.message);
          setBannerVariant("warning");
          await delay(ROUND_PAUSE_MS);
        }
      }
    }

    runAutomaticRollOff();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [playerNames]);

  const standings = useMemo(
    () => formatRollOffStandings(rollOff.order, playerNames),
    [rollOff.order, playerNames],
  );

  const startGame = () => {
    if (!rollOff.order.length) return;
    onComplete?.(rollOff.firstPlayerIndex ?? rollOff.order[0], rollOff.order);
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative">
      <CyberBackground />
      <div className="relative z-10 flex flex-col flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <h1
          className="text-center font-term text-lg tracking-[0.2em] uppercase mb-2"
          style={{ color: "#7effc4", textShadow: "0 0 10px rgba(0,255,200,0.6)" }}
        >
          Roll for turn order
        </h1>
        <p className="text-center text-sm text-slate-300 mb-4">
          Lowest goes first — ties on lowest roll again. Turn order then follows seating around
          the table.
        </p>

        <TurnBanner message={banner} variant={bannerVariant} />

        <div className="mt-6 space-y-2">
          {playerNames.map((name, i) => {
            const placed = standings.find((s) => s.playerIdx === i);
            const thisRoll = rollOff.roundRolls[i] ?? historicalRolls[i];
            const inPool = rollOff.pool.includes(i);
            const isRollingNow = rolling && inPool && rollOff.roundRolls[i] == null;
            return (
              <motion.div
                key={i}
                animate={
                  isRollingNow
                    ? { scale: [1, 1.02, 1], opacity: [0.85, 1, 0.85] }
                    : { scale: 1, opacity: 1 }
                }
                transition={isRollingNow ? { repeat: Infinity, duration: 0.6 } : { duration: 0.2 }}
                className="flex items-center justify-between rounded-xl border px-3 py-2"
                style={{
                  borderColor: isRollingNow ? "rgba(0,255,200,0.7)" : "rgba(255,255,255,0.12)",
                  background: isRollingNow ? "rgba(0,255,200,0.08)" : "rgba(3,4,10,0.55)",
                  boxShadow: isRollingNow ? "0 0 16px rgba(0,255,200,0.25)" : "none",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PlayerAvatarVideo
                    playerIndex={i}
                    playerCount={playerNames.length}
                    label={name}
                    active={isRollingNow}
                    sizeClass="w-8 h-8"
                  />
                  <span className="font-term tracking-wide truncate">{name}</span>
                </div>
                <span className="text-sm text-slate-300 shrink-0 ml-2">
                  {placed
                    ? placeLabel(placed.place)
                    : isRollingNow
                      ? "Rolling…"
                      : thisRoll != null
                        ? `Rolled ${thisRoll}`
                        : inPool
                          ? "Waiting…"
                          : "—"}
                </span>
              </motion.div>
            );
          })}
        </div>

        {!showResults ? (
          <p className="mt-8 text-center font-term text-cyan-200/80 tracking-widest uppercase text-xs">
            {rolling ? "Rolling for turn order…" : "Resolving…"}
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            <div
              className="rounded-2xl border-2 p-4 space-y-2"
              style={{
                borderColor: "rgba(0,255,200,0.45)",
                background: "rgba(8,2,20,0.65)",
              }}
            >
              <p className="font-term text-cyan-200 tracking-widest uppercase text-xs mb-2">
                Turn order
              </p>
              {standings.map((row) => (
                <div key={row.playerIdx} className="flex justify-between text-sm">
                  <span>{placeLabel(row.place)}</span>
                  <span className="font-semibold text-white">{row.name}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={startGame}
              className="w-full h-14 text-lg font-black uppercase tracking-widest border-2 text-white"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,200,0.25), rgba(0,140,110,0.4))",
                borderColor: "#00ffc8",
                boxShadow: "0 0 20px rgba(0,255,200,0.45)",
              }}
            >
              Start game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
