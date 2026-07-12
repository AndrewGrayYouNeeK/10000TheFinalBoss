import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { Dices, PiggyBank, Swords } from "lucide-react";
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
  getObscuredScoreIndices,
  consumeSkinPower,
} from "@/lib/gameLogic";
import { heldSelectionLabel, heldSelectionPoints } from "@/lib/scoring";
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
import StoryNeonBanner from "@/components/story/StoryNeonBanner";
import StoryCutscene from "@/components/story/StoryCutscene";
import GameAudioControls from "@/components/game/GameAudioControls";
import HeldDiceStylePicker from "@/components/game/HeldDiceStylePicker";
import SkinPowerPanel, { MAX_POWER } from "@/components/game/SkinPowerPanel";
import { enterGamePlaySession } from "@/lib/gameAudioSettings";
import { assignPlayerSkin, resolvePlayerPower, getSkinLabel } from "@/lib/ghostDisguise";
import { applySkinPower } from "@/lib/powerEffects";
import { canAfford } from "@/lib/powers";
import { isLowPowerDevice } from "@/lib/platform";

const PLAYER_NAME = "You";

export default function StoryGame() {
  const { bossId } = useParams();
  const navigate = useNavigate();
  const boss = getBoss(bossId);
  const { user, equippedFeltId, grantReward, updateMe, sfxMuted, opponentSfxMuted, setSfxMuted, setOpponentSfxMuted, heldDiceStyleId, setHeldDiceStyle, ownedSkins, ghostDisguiseId } = useCosmetics();
  // In Story Mode you can't pick your dice — they're forced by your ladder progress.
  const storyPlayerSkin = getStoryPlayerSkin(user?.bosses_defeated || []);
  const playDiceSound = useDiceSound();

  const [cutscene, setCutscene] = useState(null); // "intro" | "victory" | "defeat"
  const [dialogue, setDialogue] = useState(null); // "intro" | "win" | "lose"
  const [game, setGame] = useState(null);
  const [rollAnim, setRollAnim] = useState(false);
  const [popup, setPopup] = useState(null);
  const [rewardSummary, setRewardSummary] = useState(null);
  const farkleShieldUsedRef = useRef(false);
  const rewardsClaimedRef = useRef(false);
  const resolvedPower =
    game?.players[game.currentIndex]?.name === PLAYER_NAME
      ? resolvePlayerPower(game, game.currentIndex)
      : null;
  const skinPower = resolvedPower?.power ?? null;

  useEffect(() => {
    if (!boss) return;
    if (boss.videos?.intro) {
      setCutscene("intro");
      setDialogue(null);
    } else {
      setCutscene(null);
      setDialogue("intro");
    }
    farkleShieldUsedRef.current = false;
    rewardsClaimedRef.current = false;
    setRewardSummary(null);
  }, [boss?.id]);

  useEffect(() => {
    if (boss) setGame(makeInitialGame(boss, storyPlayerSkin, ownedSkins, ghostDisguiseId));
  }, [boss, storyPlayerSkin, ownedSkins, ghostDisguiseId]);

  // Boss may not exist
  useEffect(() => {
    if (!boss) navigate("/story");
  }, [boss, navigate]);

  React.useLayoutEffect(() => {
    const leave = enterGamePlaySession();
    return leave;
  }, []);

  const isMyTurn = () => game?.players[game.currentIndex]?.name === PLAYER_NAME;

  // Auto-pass after player farkle — no manual "End Turn" button
  useEffect(() => {
    if (!game?.farkle || game.winner || dialogue || cutscene) return;
    if (game.players[game.currentIndex]?.name !== PLAYER_NAME) return;
    const timer = setTimeout(() => {
      setGame((g) =>
        g?.farkle && g.players[g.currentIndex]?.name === PLAYER_NAME
          ? passAfterFarkle(g)
          : g
      );
    }, 1400);
    return () => clearTimeout(timer);
  }, [game?.farkle, game?.bustCount, game?.currentIndex, game?.winner, dialogue, cutscene]);

  const onFireSkinPower = () => {
    if (!game || !skinPower || !isMyTurn() || !game.players[game.currentIndex]?.powerCharge) return;
    if (!canAfford(MAX_POWER, skinPower.id)) return;
    const debuffs = game.players[game.currentIndex]?.debuffs || [];
    if (debuffs.some((d) => (typeof d === "string" ? d : d.id) === "lockout")) return;

    const result = applySkinPower(game, skinPower.id);
    if (result.variant === "warning") {
      if (result.message) {
        setPopup({ word: result.message.toUpperCase(), variant: "warning" });
      }
      return;
    }
    setGame(consumeSkinPower(result.state));
    if (result.message) {
      setPopup({ word: result.message.toUpperCase(), variant: result.variant || "success" });
    }
  };

  // Compute and award rewards on player win
  const claimRewards = async () => {
    const alreadyDefeated = (user?.bosses_defeated || []).includes(boss.id);
    const multiplier = alreadyDefeated ? 0.5 : 1;
    const coinGain = Math.max(5, Math.round((boss.rewards.coins * multiplier) / 10));
    const xpGain = Math.round(boss.rewards.xp * multiplier);

    const patch = {
      coins: (user?.coins ?? 0) + coinGain,
      xp: (user?.xp ?? 0) + xpGain,
      wins: (user?.wins ?? 0) + 1,
      games_finished: (user?.games_finished ?? 0) + 1,
    };

    if (!alreadyDefeated) {
      patch.bosses_defeated = [...(user?.bosses_defeated || []), boss.id];
    }

    let skinUnlocked = null;
    if (!alreadyDefeated && boss.rewards.skin) {
      const ownedSkinsList = user?.owned_skins || ["classic_white"];
      if (!ownedSkinsList.includes(boss.rewards.skin)) {
        patch.owned_skins = [...ownedSkinsList, boss.rewards.skin];
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

  const beginPostMatchDialogue = useCallback(
    (playerWon) => {
      if (playerWon) {
        if (!rewardsClaimedRef.current) {
          rewardsClaimedRef.current = true;
          claimRewards();
        }
        if (boss.videos?.victory) {
          setCutscene("victory");
          setDialogue(null);
        } else {
          setDialogue("win");
        }
      } else if (boss.videos?.defeat) {
        setCutscene("defeat");
        setDialogue(null);
      } else {
        setDialogue("lose");
      }
    },
    [boss]
  );

  // Detect winner and show appropriate end dialogue / cutscene
  useEffect(() => {
    if (!game?.winner || dialogue || cutscene) return;
    const playerWon = game.winner.name === PLAYER_NAME;
    beginPostMatchDialogue(playerWon);
  }, [game?.winner, dialogue, cutscene, beginPostMatchDialogue]);

  // Drive AI turn when it's the AI's turn
  useEffect(() => {
    if (!game || game.winner || dialogue || cutscene) return;
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
  }, [game?.currentIndex, game?.winner, dialogue, cutscene]);

  // After AI has rolled and the dice have settled, decide hold + bank/roll
  useEffect(() => {
    if (!game || game.winner || dialogue || cutscene) return;
    const currentPlayerName = game.players[game.currentIndex]?.name;
    if (currentPlayerName !== boss?.name) return;
    if (!game.hasRolled || rollAnim) return;

    const timers = [];
    const schedule = (fn, ms) => {
      timers.push(setTimeout(fn, ms));
    };

    // Farkle handling for AI — apply farkle shield if available
    if (game.farkle) {
      if (boss.gimmick?.farkleShield && !farkleShieldUsedRef.current) {
        farkleShieldUsedRef.current = true;
        toast.success(`🛡️ ${boss.name} shrugs off the farkle! Iron Will absorbed.`);
        setGame((g) => ({
          ...g,
          farkle: false,
          turnScore: 0,
          hasRolled: false,
          dice: g.dice.map((d) => ({ ...d, used: false, held: false })),
          message: `🛡️ ${boss.name}'s Iron Will absorbs the bust!`,
          messageVariant: "warning",
        }));
        return () => timers.forEach(clearTimeout);
      }
      schedule(() => {
        setGame((g) =>
          g?.players[g.currentIndex]?.name === boss?.name && g.farkle
            ? passAfterFarkle(g)
            : g
        );
      }, 1100);
      return () => timers.forEach(clearTimeout);
    }

    const idsToHold = chooseDiceToHold(game, boss.difficulty);
    if (idsToHold.length === 0) {
      schedule(() => {
        setGame((g) =>
          g?.players[g.currentIndex]?.name === boss?.name ? passAfterFarkle(g) : g
        );
      }, 800);
      return () => timers.forEach(clearTimeout);
    }

    let g = game;
    idsToHold.forEach((id) => {
      const die = g.dice.find((d) => d.id === id);
      if (die && !die.held) g = toggleHold(g, id);
    });
    setGame(g);

    const heldInfo = getHeldInfo(g);
    const projectedTurnScore = g.turnScore + heldSelectionPoints(heldInfo, g.perfectTenKPending);
    const decision = chooseBankOrRoll(
      { ...g, turnScore: projectedTurnScore },
      boss.difficulty,
      g.players[g.currentIndex]
    );

    schedule(() => {
      if (decision === "bank") {
        setGame((current) =>
          current?.players[current.currentIndex]?.name === boss?.name
            ? bankAndPass(current)
            : current
        );
        return;
      }
      setRollAnim(true);
      playDiceSound({ opponent: true });
      setGame((current) => {
        if (current?.players[current.currentIndex]?.name !== boss?.name) return current;
        const { state: next } = confirmAndReroll(current);
        return applyBossDiceGimmick(next);
      });
      timers.push(setTimeout(() => setRollAnim(false), 900));
    }, 900);

    return () => timers.forEach(clearTimeout);
  }, [game?.hasRolled, game?.farkle, game?.currentIndex, rollAnim, game?.winner, dialogue, cutscene, boss, playDiceSound]);

  const doAiRoll = () => {
    setRollAnim(true);
    playDiceSound({ opponent: true });
    setGame((g) => rollDice(g));
    setTimeout(() => {
      setGame((g) => evaluateRoll(applyBossDiceGimmick(g)));
      setRollAnim(false);
    }, 900);
  };

  // Player actions
  const handleToggle = useCallback((dieId) => {
    setGame((g) => {
      if (g.players[g.currentIndex]?.name !== PLAYER_NAME || g.farkle || !g.hasRolled) return g;
      return toggleHold(g, dieId);
    });
  }, []);
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
    if (!info.valid || heldSelectionPoints(info, game.perfectTenKPending) === 0) return;
    setRollAnim(true);
    playDiceSound();
    const { state: next, instantWin } = confirmAndReroll(game);
    if (instantWin) setPopup({ word: "PERFECT 10,000!", variant: "success" });
    setGame(next);
    setTimeout(() => setRollAnim(false), 900);
  };
  const handleBank = () => {
    if (!isMyTurn()) return;
    setGame(bankAndPass(game));
  };

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

  const handleCutsceneFinished = () => {
    const mode = cutscene;
    setCutscene(null);
    if (mode === "intro") setDialogue("intro");
    else if (mode === "victory") setDialogue("win");
    else if (mode === "defeat") setDialogue("lose");
  };

  const restartFight = () => {
    setGame(makeInitialGame(boss, storyPlayerSkin, ownedSkins, ghostDisguiseId));
    farkleShieldUsedRef.current = false;
    rewardsClaimedRef.current = false;
    setRewardSummary(null);
    if (boss.videos?.intro) {
      setCutscene("intro");
      setDialogue(null);
    } else {
      setCutscene(null);
      setDialogue("intro");
    }
  };

  const cutsceneSrc =
    cutscene === "intro"
      ? boss?.videos?.intro
      : cutscene === "victory"
      ? boss?.videos?.victory
      : cutscene === "defeat"
      ? boss?.videos?.defeat
      : null;

  const cutsceneLabel =
    cutscene === "intro"
      ? `Vs ${boss?.name}`
      : cutscene === "victory"
      ? "Victory"
      : cutscene === "defeat"
      ? "Defeat"
      : "";

  if (!boss || !game) return null;

  // Setup boss panel
  const heldInfo = getHeldInfo(game);
  const heldPoints = heldSelectionPoints(heldInfo, game.perfectTenKPending);
  const currentPlayer = game.players[game.currentIndex];
  const myTurn = isMyTurn();
  const needsEntry = currentPlayer && !currentPlayer.onBoard;
  const potentialTotal = (game.turnScore || 0) + (heldInfo.valid ? heldPoints : 0);
  const wouldOvershoot = currentPlayer && currentPlayer.score + potentialTotal > TARGET_SCORE;
  const canBank =
    myTurn &&
    game.hasRolled &&
    !game.farkle &&
    heldInfo.valid &&
    heldPoints > 0 &&
    (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);
  const obscuredScores = getObscuredScoreIndices(game);
  const powerLocked = (currentPlayer?.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "lockout"
  );
  const powerFrozen = (currentPlayer?.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "freeze"
  );
  const powerModeActive =
    myTurn &&
    !!currentPlayer?.powerCharge &&
    !game.farkle &&
    !game.winner;
  const lowPower = isLowPowerDevice();

  return (
    <div className="min-h-screen text-white pb-6 flex flex-col relative">
      {!lowPower && <BossRainBackground bossId={boss.id} />}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-3 pb-3 border-b"
          style={{
            ...PAGE_HEADER_SAFE_STYLE,
            borderColor: "rgba(0,255,200,0.25)",
            background: "rgba(3,4,10,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <BackButton
            label="Back"
            onClick={() => navigate("/story")}
            confirmMessage={
              game.winner || dialogue ? undefined : "Forfeit this fight and return to the ladder?"
            }
          />
          <div className="flex items-center gap-2 font-pixel text-[10px] tracking-widest"
            style={{ color: "#fff", textShadow: "0 0 6px #ff00ea, 0 0 16px #00ffea" }}
          >
            <Swords className="w-4 h-4" />
            VS {boss.name.toUpperCase()}
          </div>
          <div className="w-16" aria-hidden />
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

        {/* YouNeeK 10,000 sign — loop video during the fight */}
        <div className="px-3 pt-3">
          <StoryNeonBanner videoSrc={boss.signVideo} />
        </div>

        <div className="p-3 space-y-2">
          <ScorePanel
            players={game.players}
            currentIndex={game.currentIndex}
            obscuredIndices={obscuredScores}
            xrayReveals={game.xrayReveals}
          />
          <HeldDiceStylePicker
            value={heldDiceStyleId}
            onChange={setHeldDiceStyle}
          />
          <GameAudioControls
            sfxMuted={sfxMuted}
            opponentSfxMuted={opponentSfxMuted}
            onToggleSfx={() => setSfxMuted(!sfxMuted)}
            onToggleOpponent={() => setOpponentSfxMuted(!opponentSfxMuted)}
          />
        </div>

        <div className="px-3 mb-2 space-y-2">
          <TurnBanner
            message={
              myTurn && !game.farkle
                ? `🎮 Your turn! ${game.message || ""}`
                : game.message
            }
            variant={game.messageVariant}
          />
          <SkinPowerPanel
            power={MAX_POWER}
            skinPower={skinPower}
            powerMode={powerModeActive}
            used={false}
            locked={powerLocked}
            disabled={powerFrozen}
            frozen={powerFrozen}
            onFire={onFireSkinPower}
            isGhostMimic={resolvedPower?.isMimic}
            mimicSkinLabel={resolvedPower?.isMimic ? getSkinLabel(resolvedPower.mimicSkinId) : null}
            mimicFromName={resolvedPower?.sourcePlayerName}
          />
        </div>

        <div className="px-3 mb-3">
          <motion.div
            animate={{ scale: heldInfo.valid && heldPoints > 0 ? 1.02 : 1 }}
            className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-3 flex items-center justify-between"
          >
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Turn Score</div>
              <div className="text-3xl font-black tabular-nums">
                {(game.turnScore || 0).toLocaleString()}
                {heldInfo.valid && heldPoints > 0 && (
                  <span className="text-emerald-400 text-xl"> +{heldPoints.toLocaleString()}</span>
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
            {!needsEntry && wouldOvershoot && heldInfo.valid && heldPoints > 0 && (
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
              disabled={!myTurn || !game.hasRolled || game.farkle || !!game.winner || rollAnim}
              skinId={myTurn ? storyPlayerSkin : (boss.bossSkinId || "obsidian")}
              feltId={equippedFeltId}
              heldStyleId={heldDiceStyleId}
              lowPower={lowPower}
              powerMode={myTurn && powerModeActive}
            />
            {heldInfo.held.length > 0 && (
              <div className="mt-2 text-center text-sm">
                {heldInfo.valid ? (
                  <span className="text-emerald-400 font-semibold">
                    {heldSelectionLabel(heldInfo, game.perfectTenKPending)}
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
            <div
              className="w-full h-14 flex items-center justify-center rounded-xl border-2 text-sm font-bold uppercase tracking-widest text-rose-200"
              style={{
                borderColor: "#ff2858",
                background: "linear-gradient(135deg, rgba(255,0,90,0.2), rgba(120,0,50,0.35))",
                boxShadow: "0 0 20px rgba(255,40,90,0.4)",
              }}
            >
              Passing turn…
            </div>
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
                disabled={!heldInfo.valid || heldPoints === 0 || rollAnim}
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

      {cutscene && (
        <StoryCutscene
          src={cutsceneSrc}
          label={cutsceneLabel}
          onFinished={handleCutsceneFinished}
        />
      )}

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
              restartFight();
            }
          }}
          onExit={() => navigate("/story")}
        />
      )}
    </div>
  );
}

// Build the initial game state — boss may have a head-start gimmick.
function makeInitialGame(boss, storyPlayerSkin, ownedSkins = [], ghostDisguiseId = null) {
  if (!boss) return null;
  const playerSkins = [
    assignPlayerSkin(storyPlayerSkin, ownedSkins, ghostDisguiseId),
    assignPlayerSkin(boss.bossSkinId || "obsidian", ownedSkins),
  ];
  const state = createInitialState([PLAYER_NAME, boss.name], { playerSkins });
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