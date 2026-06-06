import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dices, PiggyBank, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  createInitialState,
  rollDice,
  evaluateRoll,
  toggleHold,
  getHeldInfo,
  confirmAndReroll,
  bankAndPass,
  passAfterFarkle,
  ENTRY_THRESHOLD,
} from "@/lib/gameLogic";
import DiceTray from "@/components/game/DiceTray";
import Die from "@/components/game/Die";
import ScorePanel from "@/components/game/ScorePanel";
import TurnBanner from "@/components/game/TurnBanner";
import GameOverDialog from "@/components/game/GameOverDialog";
import RulesSheet from "@/components/game/RulesSheet";
import BigPopup from "@/components/game/BigPopup";
import CyberBackground from "@/components/game/CyberBackground";
import NeonTitle from "@/components/game/NeonTitle";
import GlitchNeonBanner from "@/components/game/GlitchNeonBanner";
import { useCosmetics } from "@/hooks/useCosmetics";
import { XP_REWARDS } from "@/lib/progression";

export default function Game() {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [rollAnim, setRollAnim] = useState(false);
  const [popup, setPopup] = useState(null); // { word, variant }
  const [shakeTriggered, setShakeTriggered] = useState(0);
  const { user, equippedSkinId, equippedPipsId, equippedFeltId, addCoins, addXp, recordGameResult, grantReward } = useCosmetics();
  const prevBustRef = React.useRef(0);
  const winnerAwardedRef = React.useRef(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("dice10k_players");
    if (!stored) {
      navigate("/setup");
      return;
    }
    setState(createInitialState(JSON.parse(stored)));
    prevBustRef.current = 0;
    winnerAwardedRef.current = false;
  }, [navigate]);

  // Show big pop-up when bust count increases
  useEffect(() => {
    if (!state) return;
    if ((state.bustCount || 0) > prevBustRef.current && state.lastBustWord) {
      setPopup({ word: state.lastBustWord, variant: "danger" });
      prevBustRef.current = state.bustCount;
    }
  }, [state]);

  // Award coins + XP on game end (and record win / games_finished)
  useEffect(() => {
    if (state?.winner && !winnerAwardedRef.current) {
      winnerAwardedRef.current = true;
      addCoins(40); // small win bonus — ~10 wins to afford a Starter Vault

      let xpGain = XP_REWARDS.finishGame + XP_REWARDS.winGame;
      const wins = user?.wins ?? 0;
      if (wins === 0) xpGain += XP_REWARDS.firstWin;
      if (wins + 1 === 10) xpGain += XP_REWARDS.tenWins;
      if ((state.bustCount || 0) === 0) xpGain += XP_REWARDS.noFarkleGame;
      if (state.perfectTenK) {
        xpGain += XP_REWARDS.perfectTenK;
        addCoins(200); // bonus coin payout for the ultra-rare achievement
        // Grant the exclusive Mythic dice + badge for hitting an exact 10,000.
        import("@/lib/shopCatalog").then(({ PERFECT_TENK_REWARD }) => {
          grantReward(PERFECT_TENK_REWARD);
        });
        setPopup({ word: "PERFECT 10,000! 🎯 BADGE + MYTHIC DICE UNLOCKED", variant: "success" });
      }

      recordGameResult({ won: true, xpGain });
    }
  }, [state?.winner, state?.perfectTenK, addCoins, recordGameResult, user, state?.bustCount]);

  // Hot dice XP — awarded each time a player clears all 6 dice in a turn
  const prevDiceLeftRef = React.useRef(6);
  useEffect(() => {
    if (!state) return;
    const remaining = state.dice.filter(d => !d.used).length;
    if (remaining === 0 && prevDiceLeftRef.current > 0 && !state.farkle) {
      addXp(XP_REWARDS.hotDice);
    }
    prevDiceLeftRef.current = remaining || 6;
  }, [state, addXp]);

  // Shake-to-roll via DeviceMotion
  // NOTE: Uses pure acceleration (gravity removed) and a high threshold so taps
  // on the dice don't accidentally trigger a roll. Also ignores motion for a
  // brief window after any touch/click.
  const lastTouchRef = useRef(0);
  useEffect(() => {
    const markTouch = () => { lastTouchRef.current = Date.now(); };
    window.addEventListener("touchstart", markTouch, { passive: true });
    window.addEventListener("mousedown", markTouch, { passive: true });
    return () => {
      window.removeEventListener("touchstart", markTouch);
      window.removeEventListener("mousedown", markTouch);
    };
  }, []);

  useEffect(() => {
    let lastShake = 0;
    const THRESHOLD = 28; // raised — typical taps spike to ~15-22
    const COOLDOWN = 1500;
    const TOUCH_GUARD_MS = 600; // ignore motion right after a tap/click

    const handleMotion = (e) => {
      const acc = e.acceleration; // gravity-free; null if device doesn't support
      if (!acc || (acc.x == null && acc.y == null && acc.z == null)) return;
      const now = Date.now();
      if (now - lastTouchRef.current < TOUCH_GUARD_MS) return;
      const total = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      if (total > THRESHOLD && now - lastShake > COOLDOWN) {
        lastShake = now;
        setShakeTriggered(t => t + 1);
      }
    };

    if (typeof DeviceMotionEvent !== "undefined") {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        // iOS 13+ requires permission — request it on first user interaction
        const requestPerm = async () => {
          try {
            const res = await DeviceMotionEvent.requestPermission();
            if (res === "granted") window.addEventListener("devicemotion", handleMotion);
          } catch {}
          document.removeEventListener("click", requestPerm);
        };
        document.addEventListener("click", requestPerm);
      } else {
        window.addEventListener("devicemotion", handleMotion);
      }
    }
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [rollAnim]);

  const doRoll = useCallback(() => {
    if (!state) return;
    setRollAnim(true);
    const rolled = rollDice(state);
    setState(rolled);
    setTimeout(() => {
      setRollAnim(false);
      setState(s => evaluateRoll(s));
    }, 900);
  }, [state]);

  const onToggle = (dieId) => {
    setState(s => toggleHold(s, dieId));
  };

  const onRollAgain = useCallback(() => {
    const { state: next } = confirmAndReroll(state);
    if (!next) return;
    if (next.winner) {
      setState(next);
      return;
    }
    setRollAnim(true);
    setState(next);
    setTimeout(() => setRollAnim(false), 900);
  }, [state]);

  useEffect(() => {
    if (shakeTriggered === 0) return;
    if (!state || state.farkle || state.winner || rollAnim) return;
    if (!state.hasRolled) {
      doRoll();
    } else {
      const info = getHeldInfo(state);
      if (info.valid && info.score > 0) onRollAgain();
    }
  }, [shakeTriggered, state, doRoll, onRollAgain, rollAnim]);

  const onBank = () => {
    const prevScore = state.players[state.currentIndex].score;
    const prevName = state.players[state.currentIndex].name;
    const next = bankAndPass(state);
    const after = next.players.find(p => p.name === prevName);
    const gained = (after?.score ?? prevScore) - prevScore;
    if (gained > 0) addCoins(Math.floor(gained / 1000));
    setState(next);
  };

  const onPassFarkle = () => {
    setState(passAfterFarkle(state));
  };

  const playAgain = () => {
    const stored = sessionStorage.getItem("dice10k_players");
    if (stored) setState(createInitialState(JSON.parse(stored)));
  };

  if (!state) return null;

  const info = getHeldInfo(state);
  const currentPlayer = state.players[state.currentIndex];
  const potentialTotal = state.turnScore + (info.valid ? info.score : 0);
  const needsEntry = !currentPlayer.onBoard;
  const wouldOvershoot = currentPlayer.score + potentialTotal > 10000;
  const canBank = state.hasRolled && !state.farkle && info.valid && info.score > 0 &&
    (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);

  return (
    <div className="min-h-screen text-white flex flex-col pb-6 relative">
      <CyberBackground />
      <div className="relative z-10 flex flex-col flex-1">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b"
        style={{
          borderColor: "rgba(0,255,200,0.25)",
          background: "rgba(3,4,10,0.6)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 1px 0 rgba(255,0,170,0.25), 0 8px 24px rgba(0,255,200,0.08)",
        }}
      >
        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div />
        <RulesSheet />
      </div>

      {/* YouNeeK 10000 sign banner */}
      <div className="px-3 pt-3">
        <div
          className="rounded-2xl overflow-hidden border-2"
          style={{
            borderColor: "#ff00ea",
            boxShadow: "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.6)",
          }}
        >
          <GlitchNeonBanner
            src="/assets/354eae8fe_generated_image.png"
            alt="YouNeeK 10000 sign"
            objectPosition="center 30%"
          />
        </div>
      </div>

      {/* Score panel */}
      <div className="p-3">
        <ScorePanel players={state.players} currentIndex={state.currentIndex} />
      </div>

      {/* Banner */}
      <div className="px-3 mb-2">
        <TurnBanner message={state.message} variant={state.messageVariant} />
      </div>

      {/* Turn score */}
      <div className="px-3 mb-3">
        <motion.div
          animate={{ scale: info.valid && info.score > 0 ? 1.02 : 1 }}
          className="rounded-2xl border p-3 flex items-center justify-between relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(8,10,20,0.85), rgba(20,5,30,0.85))",
            borderColor: info.valid && info.score > 0 ? "rgba(0,255,200,0.6)" : "rgba(255,0,170,0.35)",
            boxShadow:
              info.valid && info.score > 0
                ? "0 0 20px rgba(0,255,200,0.4), inset 0 0 0 1px rgba(0,255,200,0.2)"
                : "0 0 16px rgba(255,0,170,0.2), inset 0 0 0 1px rgba(255,0,170,0.15)",
          }}
        >
          <div className="relative">
            <div
              className="text-[10px] uppercase tracking-[0.3em] font-bold"
              style={{ color: "#ff00aa", textShadow: "0 0 6px rgba(255,0,170,0.6)" }}
            >
              ▸ Turn Score
            </div>
            <div
              className="text-3xl font-black tabular-nums"
              style={{
                color: "#ffffff",
                textShadow: "0 0 12px rgba(0,255,200,0.7), 0 0 4px rgba(255,255,255,0.6)",
              }}
            >
              {state.turnScore.toLocaleString()}
              {info.valid && info.score > 0 && (
                <span
                  className="text-xl ml-1"
                  style={{ color: "#7effc4", textShadow: "0 0 10px rgba(0,255,170,0.9)" }}
                >
                  +{info.score}
                </span>
              )}
            </div>
          </div>
          {needsEntry && (
            <div className="text-right text-xs">
              <div className="text-amber-400 font-bold">Entry: 1,000</div>
              <div className={potentialTotal >= ENTRY_THRESHOLD ? "text-emerald-400" : "text-slate-500"}>
                {potentialTotal >= ENTRY_THRESHOLD ? "✓ On the board" : `${ENTRY_THRESHOLD - potentialTotal} to go`}
              </div>
            </div>
          )}
          {!needsEntry && wouldOvershoot && info.valid && info.score > 0 && (
            <div className="text-right text-xs">
              <div className="text-rose-400 font-bold">⚠️ Over 10,000!</div>
              <div className="text-slate-400">Need exactly {(10000 - currentPlayer.score - state.turnScore).toLocaleString()}</div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dice tray */}
      <div className="px-3 flex-[0.85] flex items-center justify-center">
        <div
          className="w-full rounded-2xl p-2"
          style={{
            border: "2px solid #ff00ea",
            boxShadow:
              "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)",
            background: "rgba(8,2,20,0.45)",
          }}
        >
          <DiceTray
            dice={state.dice}
            rolling={rollAnim}
            onToggle={onToggle}
            disabled={!state.hasRolled || state.farkle || !!state.winner}
            skinId={equippedSkinId}
            feltId={equippedFeltId}
          />
          {info.held.length > 0 && (
            <div className="mt-2 text-center text-sm">
              {info.valid ? (
                <span className="text-emerald-400 font-semibold">
                  {info.sixOfAKind ? "SIX OF A KIND!" : info.straight ? "Straight!" : info.smallStraight ? "Small Straight! +1000" : info.threePairs ? "Three Pairs!" : `Selection: +${info.score}`}
                </span>
              ) : (
                <span className="text-rose-400 font-semibold">Selection includes non-scoring dice</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="p-3 space-y-2 border-t"
        style={{
          borderColor: "rgba(0,255,200,0.25)",
          background: "rgba(3,4,10,0.85)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 -1px 0 rgba(255,0,170,0.25), 0 -8px 24px rgba(0,255,200,0.08)",
        }}
      >
        {state.farkle ? (
          <Button
            onClick={onPassFarkle}
            size="lg"
            className="w-full h-14 text-lg text-white font-black uppercase tracking-widest border-2"
            style={{
              background: "linear-gradient(135deg, rgba(255,0,90,0.3), rgba(120,0,50,0.5))",
              borderColor: "#ff2858",
              boxShadow: "0 0 24px rgba(255,40,90,0.6), inset 0 0 0 1px rgba(255,255,255,0.1)",
              textShadow: "0 0 8px rgba(255,40,90,0.9)",
            }}
          >
            <ChevronRight className="w-5 h-5 mr-2" /> Next Player
          </Button>
        ) : !state.hasRolled ? (
          <Button
            onClick={doRoll}
            size="lg"
            className="w-full h-14 text-lg text-white font-black uppercase tracking-widest border-2 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,0,170,0.25), rgba(0,255,200,0.25))",
              borderColor: "#00ffc8",
              boxShadow: "0 0 28px rgba(0,255,200,0.55), 0 0 28px rgba(255,0,170,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)",
              textShadow: "0 0 10px rgba(0,255,200,0.9)",
            }}
          >
            <Dices className="w-5 h-5 mr-2" /> Roll Dice
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onRollAgain}
              disabled={!info.valid || info.score === 0 || rollAnim}
              size="lg"
              className="h-14 text-white font-black uppercase tracking-wider border-2 disabled:opacity-30 disabled:grayscale"
              style={{
                background: "linear-gradient(135deg, rgba(255,0,170,0.25), rgba(120,0,180,0.4))",
                borderColor: "#ff00aa",
                boxShadow: "0 0 20px rgba(255,0,170,0.55), inset 0 0 0 1px rgba(255,255,255,0.1)",
                textShadow: "0 0 8px rgba(255,0,170,0.9)",
              }}
            >
              <Dices className="w-5 h-5 mr-1" /> Roll Again
            </Button>
            <Button
              onClick={onBank}
              disabled={!canBank}
              size="lg"
              className="h-14 text-white font-black uppercase tracking-wider border-2 disabled:opacity-30 disabled:grayscale"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,200,0.25), rgba(0,140,110,0.4))",
                borderColor: "#00ffc8",
                boxShadow: "0 0 20px rgba(0,255,200,0.55), inset 0 0 0 1px rgba(255,255,255,0.1)",
                textShadow: "0 0 8px rgba(0,255,200,0.9)",
              }}
            >
              <PiggyBank className="w-5 h-5 mr-1" /> Bank
            </Button>
          </div>
        )}
      </div>
      </div>

      <GameOverDialog
        open={!!state.winner}
        winner={state.winner}
        onPlayAgain={playAgain}
      />

      <BigPopup
        open={!!popup}
        word={popup?.word}
        variant={popup?.variant}
        onClose={() => setPopup(null)}
      />
    </div>
  );
}