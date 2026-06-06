import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dices, PiggyBank, ChevronRight, Swords } from "lucide-react";
import { toast } from "sonner";
import {
  createInitialState,
  rollDice,
  evaluateRoll,
  toggleHold,
  getHeldInfo,
  confirmAndReroll,
  bankAndPass,
  passAfterFarkle,
  TARGET_SCORE,
  ENTRY_THRESHOLD,
} from "@/lib/gameLogic";
import { scoreSelection } from "@/lib/scoring";
import { getBoss, getStoryPlayerSkin } from "@/lib/storyBosses";
import { chooseDiceToHold, chooseBankOrRoll } from "@/lib/aiOpponent";
import { useCosmetics } from "@/hooks/useCosmetics";
import { useDiceSound } from "@/lib/useDiceSound";
import DiceTray from "@/components/game/DiceTray";
import ScorePanel from "@/components/game/ScorePanel";
import TurnBanner from "@/components/game/TurnBanner";
import BigPopup from "@/components/game/BigPopup";
import BossDialogue from "@/components/story/BossDialogue";
import BossAvatar from "@/components/story/BossAvatar";
import BossRainBackground from "@/components/story/BossRainBackground";

const PLAYER_NAME = "You";

export default function StoryGame() {
  const { bossId } = useParams();
  const navigate = useNavigate();
  const boss = getBoss(bossId);
  const { user, equippedFeltId, grantReward, updateMe } = useCosmetics();
  // In Story Mode you can't pick your dice — they're forced by your ladder progress.
  const storyPlayerSkin = getStoryPlayerSkin(user?.bosses_defeated || []);
  const playDiceSound = useDiceSound();

  const [dialogue, setDialogue] = useState("intro"); // "intro" | null | "win" | "lose"
  const [game, setGame] = useState(() => makeInitialGame(boss));
  const [rollAnim, setRollAnim] = useState(false);
  const [popup, setPopup] = useState(null);
  const [rewardSummary, setRewardSummary] = useState(null);
  const farkleShieldUsedRef = useRef(false);
  const rewardsClaimedRef = useRef(false);

  // Boss may not exist
  useEffect(() => {
    if (!boss) navigate("/story");
  }, [boss, navigate]);

  // Detect winner and show appropriate end dialogue
  useEffect(() => {
    if (!game?.winner || dialogue) return;
    const playerWon = game.winner.name === PLAYER_NAME;
    if (playerWon) {
      if (!rewardsClaimedRef.current) {
        rewardsClaimedRef.current = true;
        claimRewards();
      }
      setDialogue("win");
    } else {
      setDialogue("lose");
    }
  }, [game?.winner, dialogue]);

  // Drive AI turn when it's the AI's turn
  useEffect(() => {
    if (!game || game.winner || dialogue) return;
    const currentPlayerName = game.players[game.currentIndex]?.name;
    if (currentPlayerName !== boss?.name) return;

    let cancelled = false;
    const runAiTurn = async () => {
      // Small delay to let UI settle
      await wait(700);
      if (cancelled) return;

      // First roll of the turn if not yet rolled
      if (!game.hasRolled) {
        doAiRoll();
        return;
      }
    };
    runAiTurn();
    return () => { cancelled = true; };
  }, [game?.currentIndex, game?.winner, dialogue]);

  // After AI has rolled and the dice have settled, decide hold + bank/roll
  useEffect(() => {
    if (!game || game.winner || dialogue) return;
    const currentPlayerName = game.players[game.currentIndex]?.name;
    if (currentPlayerName !== boss?.name) return;
    if (!game.hasRolled || rollAnim) return;

    // Farkle handling for AI — apply farkle shield if available
    if (game.farkle) {
      const aiPlayer = game.players[game.currentIndex];
      const shieldRemaining =
        (boss.gimmick?.farkleShield ?? 0) - (farkleShieldUsedRef.current ? 1 : 0);
      if (boss.gimmick?.farkleShield && !farkleShieldUsedRef.current) {
        farkleShieldUsedRef.current = true;
        // Cancel the farkle — restore as if the bust didn't happen.
        toast.success(`🛡️ ${boss.name} shrugs off the farkle! Iron Will absorbed.`);
        // Pretend the AI banks whatever it had before the farkle (we lost it — use a minimum baseline)
        // Simpler: just pass the farkle (no points lost beyond turnScore that's already zeroed)
        // but keep the player on their turn. To do this cleanly, we just clear the farkle flag
        // and re-roll fresh. We'll restore turn_score from a snapshot ref.
        setGame((g) => ({
          ...g,
          farkle: false,
          turnScore: 0,
          hasRolled: false,
          dice: g.dice.map((d) => ({ ...d, used: false, held: false })),
          message: `🛡️ ${boss.name}'s Iron Will absorbs the bust!`,
          messageVariant: "warning",
        }));
        return;
      }
      // No shield (or already used) — pass the turn
      setTimeout(() => {
        setGame((g) => passAfterFarkle(g));
      }, 1100);
      return;
    }

    // Decide what to hold
    const idsToHold = chooseDiceToHold(game, boss.difficulty);
    if (idsToHold.length === 0) {
      // No scoring dice — pass
      setTimeout(() => {
        setGame((g) => passAfterFarkle(g));
      }, 800);
      return;
    }

    // Animate selection by toggling holds one by one
    let g = game;
    idsToHold.forEach((id) => {
      const die = g.dice.find((d) => d.id === id);
      if (die && !die.held) g = toggleHold(g, id);
    });
    setGame(g);

    // Decide bank vs roll after a beat
    setTimeout(() => {
      const aiPlayer = g.players[g.currentIndex];
      const heldInfo = getHeldInfo(g);
      const projectedTurnScore = g.turnScore + (heldInfo.valid ? heldInfo.score : 0);

      // Build a "what would my state be" check
      const decisionState = { ...g, turnScore: projectedTurnScore };
      const decision = chooseBankOrRoll(decisionState, boss.difficulty, aiPlayer);

      if (decision === "bank") {
        doAiBank();
      } else {
        doAiRollAgain();
      }
    }, 900);
  }, [game?.hasRolled, game?.farkle, rollAnim]);

  const doAiRoll = () => {
    setRollAnim(true);
    playDiceSound();
    setGame((g) => rollDice(g));
    setTimeout(() => {
      setGame((g) => evaluateRoll(applyBossDiceGimmick(g)));
      setRollAnim(false);
    }, 900);
  };

  const doAiRollAgain = () => {
    setRollAnim(true);
    playDiceSound();
    setGame((g) => {
      const { state } = confirmAndReroll(g);
      return applyBossDiceGimmick(state);
    });
    setTimeout(() => setRollAnim(false), 900);
  };

  const doAiBank = () => {
    setGame((g) => bankAndPass(g));
  };

  // Player actions
  const handleToggle = (dieId) => {
    if (!isMyTurn() || game.farkle || !game.hasRolled || rollAnim) return;
    setGame((g) => toggleHold(g, dieId));
  };
  const handleRoll = () => {
    if (!isMyTurn() || rollAnim) return;
    setRollAnim(true);
    playDiceSound();
    setGame((g) => rollDice(g));
    setTimeout(() => {
      setGame((g) => evaluateRoll(g));
      setRollAnim(false);
    }, 900);
  };
  const handleRollAgain = () => {
    if (!isMyTurn() || rollAnim) return;
    const info = getHeldInfo(game);
    if (!info.valid || info.score === 0) return;
    setRollAnim(true);
    playDiceSound();
    setGame((g) => {
      const { state, instantWin } = confirmAndReroll(g);
      if (instantWin) setPopup({ word: "PERFECT 10,000!", variant: "success" });
      return state;
    });
    setTimeout(() => setRollAnim(false), 900);
  };
  const handleBank = () => {
    if (!isMyTurn()) return;
    setGame((g) => bankAndPass(g));
  };
  const handlePassFarkle = () => {
    if (!isMyTurn() || !game.farkle) return;
    setGame((g) => passAfterFarkle(g));
  };

  const isMyTurn = () => game?.players[game.currentIndex]?.name === PLAYER_NAME;

  // Apply boss "Crown of Sixes" gimmick — if AI is current player, mutate dice
  // so any 6 it rolls is "secretly" treated as if the boss rolled an extra 6
  // for three-of-a-kind scoring. We bias by re-rolling: with probability 0.3,
  // turn a non-6 into a 6 on this turn (only applies to the boss's roll).
  function applyBossDiceGimmick(state) {
    if (!boss.gimmick?.doubledSixes) return state;
    const current = state.players[state.currentIndex];
    if (current?.name !== boss.name) return state;

    // Subtle boost: convert ~25% of non-scoring dice to 6s
    const newDice = state.dice.map((d) => {
      if (d.used || d.held) return d;
      if (d.value === 1 || d.value === 5 || d.value === 6) return d;
      if (Math.random() < 0.25) return { ...d, value: 6 };
      return d;
    });
    return { ...state, dice: newDice };
  }

  // Compute and award rewards on player win
  const claimRewards = async () => {
    const alreadyDefeated = (user?.bosses_defeated || []).includes(boss.id);
    const multiplier = alreadyDefeated ? 0.5 : 1;
    // Coins are deflated 10× — Gray Quarters are the in-game currency and 100 GQ = $1.
    // Players should need ~10 games to afford a Starter Vault.
    const coinGain = Math.max(5, Math.round((boss.rewards.coins * multiplier) / 10));
    const xpGain = Math.round(boss.rewards.xp * multiplier);

    // Build the user patch
    const patch = {
      coins: (user?.coins ?? 0) + coinGain,
      xp: (user?.xp ?? 0) + xpGain,
      wins: (user?.wins ?? 0) + 1,
      games_finished: (user?.games_finished ?? 0) + 1,
    };

    // Mark boss defeated (only once)
    if (!alreadyDefeated) {
      patch.bosses_defeated = [...(user?.bosses_defeated || []), boss.id];
    }

    // Skin reward (only first time)
    let skinUnlocked = null;
    if (!alreadyDefeated && boss.rewards.skin) {
      const ownedSkins = user?.owned_skins || ["classic_white"];
      if (!ownedSkins.includes(boss.rewards.skin)) {
        patch.owned_skins = [...ownedSkins, boss.rewards.skin];
        const { getSkin } = await import("@/lib/shopCatalog");
        skinUnlocked = getSkin(boss.rewards.skin)?.name || boss.rewards.skin;
      }
    }

    updateMe.mutate(patch);
    setRewardSummary({
      coins: coinGain,
      xp: xpGain,
      skinUnlocked,
      alreadyClaimed: alreadyDefeated,
    });
  };

  if (!boss) return null;

  // Setup boss panel
  const panelPlayers = game.players.map((p) => ({
    name: p.name,
    score: p.score,
    onBoard: p.onBoard,
  }));

  const heldInfo = getHeldInfo(game);
  const currentPlayer = game.players[game.currentIndex];
  const myTurn = isMyTurn();
  const needsEntry = currentPlayer && !currentPlayer.onBoard;
  const potentialTotal = (game.turnScore || 0) + (heldInfo.valid ? heldInfo.score : 0);
  const wouldOvershoot = currentPlayer && currentPlayer.score + potentialTotal > TARGET_SCORE;
  const canBank =
    myTurn &&
    game.hasRolled &&
    !game.farkle &&
    heldInfo.valid &&
    heldInfo.score > 0 &&
    (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);

  return (
    <div className="min-h-screen text-white pb-6 flex flex-col relative">
      <BossRainBackground bossId={boss.id} />
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 border-b"
          style={{
            borderColor: "rgba(0,255,200,0.25)",
            background: "rgba(3,4,10,0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => {
              if (game.winner || dialogue) {
                navigate("/story");
              } else if (window.confirm("Forfeit this fight?")) {
                navigate("/story");
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 font-pixel text-[10px] tracking-widest"
            style={{ color: "#fff", textShadow: "0 0 6px #ff00ea, 0 0 16px #00ffea" }}
          >
            <Swords className="w-4 h-4" />
            VS {boss.name.toUpperCase()}
          </div>
          <div className="w-9" />
        </div>

        {/* Boss banner */}
        <div className="px-3 pt-3">
          <div
            className="rounded-xl border p-3 flex items-center gap-3"
            style={{
              borderColor: "rgba(255,0,234,0.3)",
              background: "rgba(8,2,20,0.6)",
            }}
          >
            <BossAvatar boss={boss} sizeClass="w-10 h-10" emojiClass="text-2xl" rounded="rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{boss.name}</div>
              <div className="text-[10px] text-slate-400 italic truncate">{boss.title}</div>
            </div>
            {boss.gimmick && (
              <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                ⚡ {boss.gimmick.name}
              </span>
            )}
          </div>
        </div>

        <div className="p-3">
          <ScorePanel players={panelPlayers} currentIndex={game.currentIndex} />
        </div>

        <div className="px-3 mb-2">
          <TurnBanner
            message={
              myTurn && !game.farkle
                ? `🎮 Your turn! ${game.message || ""}`
                : game.message
            }
            variant={game.messageVariant}
          />
        </div>

        <div className="px-3 mb-3">
          <motion.div
            animate={{ scale: heldInfo.valid && heldInfo.score > 0 ? 1.02 : 1 }}
            className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-3 flex items-center justify-between"
          >
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Turn Score</div>
              <div className="text-3xl font-black tabular-nums">
                {(game.turnScore || 0).toLocaleString()}
                {heldInfo.valid && heldInfo.score > 0 && (
                  <span className="text-emerald-400 text-xl"> +{heldInfo.score}</span>
                )}
              </div>
            </div>
            {needsEntry && (
              <div className="text-right text-xs">
                <div className="text-amber-400 font-bold">Entry: 1,000</div>
                <div className={potentialTotal >= ENTRY_THRESHOLD ? "text-emerald-400" : "text-slate-500"}>
                  {potentialTotal >= ENTRY_THRESHOLD
                    ? "✓ On the board"
                    : `${ENTRY_THRESHOLD - potentialTotal} to go`}
                </div>
              </div>
            )}
            {!needsEntry && wouldOvershoot && heldInfo.valid && heldInfo.score > 0 && (
              <div className="text-right text-xs">
                <div className="text-rose-400 font-bold">⚠️ Over 10,000!</div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="px-3 flex-1 flex items-center justify-center">
          <div className="w-full">
            <DiceTray
              dice={game.dice}
              rolling={rollAnim}
              onToggle={handleToggle}
              disabled={!myTurn || !game.hasRolled || game.farkle || !!game.winner}
              skinId={myTurn ? storyPlayerSkin : (boss.bossSkinId || "obsidian")}
              feltId={equippedFeltId}
            />
            {heldInfo.held.length > 0 && (
              <div className="mt-2 text-center text-sm">
                {heldInfo.valid ? (
                  <span className="text-emerald-400 font-semibold">
                    {heldInfo.sixOfAKind
                      ? "SIX OF A KIND!"
                      : heldInfo.straight
                      ? "Straight!"
                      : heldInfo.threePairs
                      ? "Three Pairs!"
                      : `Selection: +${heldInfo.score}`}
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
            borderColor: "rgba(0,255,234,0.35)",
            background: "rgba(2,3,12,0.78)",
            backdropFilter: "blur(8px)",
          }}
        >
          {game.winner ? (
            <Button
              onClick={() => navigate("/story")}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white"
            >
              Back to Ladder
            </Button>
          ) : !myTurn ? (
            <div className="text-center text-sm text-slate-400 py-4">
              ⏳ {boss.name} is thinking...
            </div>
          ) : game.farkle ? (
            <Button
              onClick={handlePassFarkle}
              size="lg"
              className="w-full h-14 text-lg bg-rose-600 hover:bg-rose-500 text-white"
            >
              <ChevronRight className="w-5 h-5 mr-2" /> End Turn
            </Button>
          ) : !game.hasRolled ? (
            <Button
              onClick={handleRoll}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white"
            >
              <Dices className="w-5 h-5 mr-2" /> Roll Dice
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRollAgain}
                disabled={!heldInfo.valid || heldInfo.score === 0 || rollAnim}
                size="lg"
                className="h-14 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white disabled:opacity-40"
              >
                <Dices className="w-5 h-5 mr-1" /> Roll Again
              </Button>
              <Button
                onClick={handleBank}
                disabled={!canBank}
                size="lg"
                className="h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white disabled:opacity-40"
              >
                <PiggyBank className="w-5 h-5 mr-1" /> Bank
              </Button>
            </div>
          )}
        </div>
      </div>

      <BigPopup
        open={!!popup}
        word={popup?.word}
        variant={popup?.variant}
        onClose={() => setPopup(null)}
      />

      {/* Boss dialogue overlays */}
      {dialogue && (
        <BossDialogue
          boss={boss}
          mode={dialogue}
          summary={dialogue === "win" ? rewardSummary : null}
          onContinue={() => {
            if (dialogue === "intro") {
              setDialogue(null);
            } else if (dialogue === "win") {
              navigate("/story");
            } else {
              // lose — reset to play again
              setGame(makeInitialGame(boss));
              farkleShieldUsedRef.current = false;
              rewardsClaimedRef.current = false;
              setRewardSummary(null);
              setDialogue("intro");
            }
          }}
          onExit={() => navigate("/story")}
        />
      )}
    </div>
  );
}

// Build the initial game state — boss may have a head-start gimmick.
function makeInitialGame(boss) {
  if (!boss) return null;
  const state = createInitialState([PLAYER_NAME, boss.name]);
  if (boss.gimmick?.startScore) {
    state.players = state.players.map((p) =>
      p.name === boss.name
        ? { ...p, score: boss.gimmick.startScore, onBoard: true }
        : p
    );
  }
  return state;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}