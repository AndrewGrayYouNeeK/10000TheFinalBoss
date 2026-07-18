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
  clearSharkBiteFx,
  restoreSharkDice,
  TARGET_SCORE,
  ENTRY_THRESHOLD,
  getObscuredScoreIndices,
  consumeSkinPower,
} from "@/lib/gameLogic";
import { heldSelectionLabel, heldSelectionPoints } from "@/lib/scoring";
import {
  getBoss,
  getBossDefinition,
  getStoryPlayerSkin,
  getStoryBossFeltId,
  getNextUnbeatenBossId,
  applyStoryBossHeadStart,
} from "@/lib/storyBosses";
import { getSkin } from "@/lib/shopCatalog";
import { chooseDiceToHold, chooseBankOrRoll } from "@/lib/aiOpponent";
import { useCosmetics } from "@/hooks/useCosmetics";
import { useDiceSound } from "@/lib/useDiceSound";
import DiceTray from "@/components/game/DiceTray";
import StoryBossFightVideo from "@/components/story/StoryBossFightVideo";
import ScorePanel from "@/components/game/ScorePanel";
import TurnBanner from "@/components/game/TurnBanner";
import BigPopup from "@/components/game/BigPopup";
import BossDialogue from "@/components/story/BossDialogue";
import BossRainBackground from "@/components/story/BossRainBackground";
import SkinPowerPanel, { MAX_POWER } from "@/components/game/SkinPowerPanel";
import { enterGamePlaySession } from "@/lib/gameAudioSettings";
import { assignPlayerSkin, resolvePlayerPower, getSkinLabel, getDisplaySkinId, GHOST_SKIN_ID } from "@/lib/ghostDisguise";
import { applySkinPower } from "@/lib/powerEffects";
import { canAfford, getPower } from "@/lib/powers";
import { applyPlasmaCut, canUsePlasmaCut } from "@/lib/plasmaCut";
import PlasmaCutModal from "@/components/game/PlasmaCutModal";
import {
  BlueGelPowerVideoScreen,
  SharkBiteScreenFX,
} from "@/components/game/BlueGelPowerFX";
import { getPrisonTraySkinId } from "@/lib/prisonDice";
import PrisonDiceStatus from "@/components/game/PrisonDiceStatus";
import PowerModePracticeBar, {
  storyBossPracticeVariant,
  practicePreviewSkinId,
} from "@/components/game/PowerModePracticeBar";
import { isLowPowerDevice } from "@/lib/platform";
import { isFishDiceSkin } from "@/lib/fishDice";
import { abandonStoryFight, clearStoryFight } from "@/lib/storyGameSave";

const PLAYER_NAME = "You";

export default function StoryGame() {
  const { bossId } = useParams();
  const navigate = useNavigate();
  const boss = getBoss(bossId);
  const { user, updateMe, sfxMuted, heldDiceStyleId, ownedSkins, ghostDisguiseId } = useCosmetics();
  // Each boss brings their own table felt — no player choice in story mode.
  const storyFeltId = getStoryBossFeltId(bossId);
  const storyPlayerSkin = getStoryPlayerSkin(user?.bosses_defeated || []);
  const playDiceSound = useDiceSound();

  const [dialogue, setDialogue] = useState("intro"); // "intro" | null | "win" | "lose"
  const [game, setGame] = useState(null);
  const [rollAnim, setRollAnim] = useState(false);
  const [popup, setPopup] = useState(null);
  const [plasmaCutOpen, setPlasmaCutOpen] = useState(false);
  const [bloodWaterLocked, setBloodWaterLocked] = useState(false);
  const lockBloodWater = useCallback(() => setBloodWaterLocked(true), []);
  const [practicePowerPreview, setPracticePowerPreview] = useState(false);
  const [practiceSharkVideo, setPracticeSharkVideo] = useState(false);
  const practiceSharkBiteRef = useRef(false);
  const foregroundCanvasRef = useRef(null);
  const foregroundFx = bossId === "fisherman" || bossId === "gq";
  const replayPracticeSharkBite = useCallback(() => {
    practiceSharkBiteRef.current = true;
    setGame((g) => (g ? { ...g, sharkBiteFx: true, sharkDiceHidden: true } : g));
  }, []);
  const [rewardSummary, setRewardSummary] = useState(null);
  const farkleShieldUsedRef = useRef(false);
  const rewardsClaimedRef = useRef(false);
  const prevBustRef = useRef(0);
  const resolvedPower =
    game?.players[game.currentIndex]?.name === PLAYER_NAME
      ? resolvePlayerPower(game, game.currentIndex)
      : null;
  /** vs Marlin Joe — Shark Bite is always available (without swapping your story dice to Angelfish). */
  const skinPower =
    bossId === "fisherman"
      ? getPower("shark_bite")
      : resolvedPower?.power ?? null;

  const exitToLadder = useCallback(() => {
    if (boss?.id) {
      abandonStoryFight(boss.id);
      updateMe.mutate({ story_active_boss: boss.id });
    }
    navigate("/story");
  }, [boss?.id, navigate, updateMe]);

  useEffect(() => {
    const fightBoss = getBoss(bossId);
    if (!bossId || !fightBoss) return;

    abandonStoryFight(fightBoss.id);
    updateMe.mutate({ story_active_boss: fightBoss.id });

    prevBustRef.current = 0;
    setDialogue("intro");
    rewardsClaimedRef.current = false;
    farkleShieldUsedRef.current = false;
    setRewardSummary(null);
    setBloodWaterLocked(false);
    setPracticePowerPreview(false);
    setPracticeSharkVideo(false);
    practiceSharkBiteRef.current = false;
    setGame(makeInitialGame(fightBoss, storyPlayerSkin, ownedSkins, ghostDisguiseId));
    // Fresh fight when bossId changes only — avoid resetting mid-match on profile/cosmetics updates.
  }, [bossId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Full-screen YEEEET! / SKRRRT! on player bust only (not when boss busts)
  useEffect(() => {
    if (!game?.farkle || !game.lastBustWord) return;
    const n = game.bustCount || 0;
    if (n <= prevBustRef.current) return;
    prevBustRef.current = n;
    if (game.players[game.currentIndex]?.name !== PLAYER_NAME) return;
    setPopup({ word: game.lastBustWord, variant: "bust", burstKey: n });
  }, [game?.farkle, game?.lastBustWord, game?.bustCount, game?.currentIndex]);

  // Boss may not exist
  useEffect(() => {
    if (!boss) navigate("/story");
  }, [boss, navigate]);

  React.useLayoutEffect(() => {
    const leave = enterGamePlaySession();
    return leave;
  }, []);

  const isMyTurn = () => game?.players[game.currentIndex]?.name === PLAYER_NAME;

  // Shark Bite FX cleared via SharkBiteScreenFX onComplete (video or SVG)

  // Auto-pass after player farkle — longer window if Plasma Cut can rescue
  useEffect(() => {
    if (!game?.farkle || game.winner || dialogue || plasmaCutOpen) return;
    if (game.players[game.currentIndex]?.name !== PLAYER_NAME) return;
    const canRescue =
      skinPower?.id === "plasma_cut" &&
      !!game.players[game.currentIndex]?.powerCharge &&
      canUsePlasmaCut(game);
    const delay = canRescue ? 5000 : 1650;
    const timer = setTimeout(() => {
      setGame((g) =>
        g?.farkle && g.players[g.currentIndex]?.name === PLAYER_NAME
          ? passAfterFarkle(g)
          : g
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [game?.farkle, game?.bustCount, game?.currentIndex, game?.winner, dialogue, skinPower?.id, plasmaCutOpen]);

  const onFireSkinPower = () => {
    if (!game || !skinPower || !isMyTurn() || !game.players[game.currentIndex]?.powerCharge) return;
    if (!canAfford(MAX_POWER, skinPower.id)) return;
    const debuffs = game.players[game.currentIndex]?.debuffs || [];
    if (debuffs.some((d) => (typeof d === "string" ? d : d.id) === "lockout")) return;

    if (skinPower.id === "plasma_cut") {
      if (!canUsePlasmaCut(game)) {
        setPopup({ word: "NO DICE TO CUT", variant: "warning" });
        return;
      }
      setPlasmaCutOpen(true);
      return;
    }

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

  const onConfirmPlasmaCut = (dieId, newValue) => {
    setPlasmaCutOpen(false);
    if (!game) return;
    const result = applyPlasmaCut(game, dieId, newValue);
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
    if (!game || game.winner || dialogue || game.sharkBiteFx) return;
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
  }, [game?.currentIndex, game?.hasRolled, game?.winner, game?.sharkBiteFx, dialogue, boss?.name]);

  // After AI has rolled and the dice have settled, decide hold + bank/roll
  useEffect(() => {
    if (!game || game.winner || dialogue || game.sharkBiteFx) return;
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
    const activeDice = g.dice.filter((d) => !d.used);
    const hotDicePending = activeDice.length > 0 && activeDice.every((d) => d.held);
    const decision = hotDicePending
      ? "roll"
      : chooseBankOrRoll(
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
      // Outside effect cleanup — rollAnim=true re-runs this effect and would cancel timers.
      setTimeout(() => setRollAnim(false), 900);
    }, 900);

    return () => timers.forEach(clearTimeout);
  }, [game?.hasRolled, game?.farkle, game?.currentIndex, game?.sharkBiteFx, rollAnim, game?.winner, dialogue, boss, playDiceSound]);

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
    if (!isMyTurn() || rollAnim || game?.sharkBiteFx) return;
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
    if (instantWin) setPopup({ word: "SIX OF A KIND — YOU WIN!", variant: "success" });
    if (next.winner) {
      setGame(next);
      setRollAnim(false);
      return;
    }
    setGame(next);
    setTimeout(() => setRollAnim(false), 900);
  };
  const handleBank = () => {
    if (!isMyTurn() || game?.sharkBiteFx) return;
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

  // Compute and award rewards on player win
  const claimRewards = () => {
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

    const defeatedList = patch.bosses_defeated || user?.bosses_defeated || [];
    patch.story_active_boss = getNextUnbeatenBossId(defeatedList);

    // Skin reward (only first time)
    let skinUnlocked = null;
    let storySkinEquipped = null;
    if (!alreadyDefeated && boss.rewards.skin) {
      const profileSkins = user?.owned_skins || ["classic_white"];
      if (!profileSkins.includes(boss.rewards.skin)) {
        patch.owned_skins = [...profileSkins, boss.rewards.skin];
      }
      const rewardSkin = getSkin(boss.rewards.skin);
      skinUnlocked = rewardSkin?.name || boss.rewards.skin;
      storySkinEquipped = rewardSkin?.name || boss.rewards.skin;
    }

    updateMe.mutate(patch);
    setRewardSummary({
      coins: coinGain,
      xp: xpGain,
      skinUnlocked,
      storySkinEquipped,
      alreadyClaimed: alreadyDefeated,
    });
  };

  if (!boss) return null;
  if (!game) return null;

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
  const plasmaCutRescue =
    myTurn && skinPower?.id === "plasma_cut" && !!currentPlayer?.powerCharge && game.farkle;
  const powerModeActive =
    myTurn &&
    !!currentPlayer?.powerCharge &&
    (!game.farkle || plasmaCutRescue) &&
    !game.winner &&
    (skinPower?.id !== "plasma_cut" || game.hasRolled);
  const lowPower = isLowPowerDevice();
  const traySkinId = getPrisonTraySkinId(
    game,
    game.currentIndex,
    getDisplaySkinId(game.players[game.currentIndex], { ghostDisguiseId, ownedSkins })
  );
  const practiceVariant = storyBossPracticeVariant(bossId);
  const previewSkinId = practicePreviewSkinId(practiceVariant);
  const practiceTraySkinId =
    practicePowerPreview && previewSkinId ? previewSkinId : traySkinId;
  const fishFeastOnTray =
    (bloodWaterLocked && isFishDiceSkin(traySkinId)) ||
    (practicePowerPreview && practiceVariant === "marlin");
  const practiceSkinPower =
    practiceVariant === "marlin"
      ? getPower("shark_bite")
      : practiceVariant === "gq"
        ? getPower("siphon")
        : null;
  const trayPowerMode =
    (myTurn && !!currentPlayer?.powerCharge) || practicePowerPreview;
  const panelPowerMode = powerModeActive || practicePowerPreview;
  const panelSkinPower = practicePowerPreview ? practiceSkinPower : skinPower;
  const showSharkVideo =
    !lowPower &&
    !game?.sharkBiteFx &&
    ((powerModeActive && skinPower?.id === "shark_bite") ||
      (practiceSharkVideo && practiceVariant === "marlin"));

  return (
    <div className="min-h-screen text-white pb-6 flex flex-col relative">
      <BossRainBackground
        bossId={boss.id}
        bubblesFullScreen={bossId === "fisherman"}
        frontCanvasRef={foregroundFx ? foregroundCanvasRef : null}
      />
      <div className="relative z-10 flex flex-col">
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
            onClick={exitToLadder}
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

        <StoryBossFightVideo bossId={bossId} enabled={!lowPower} />
      </div>

      {foregroundFx && (
        <div
          className="fixed top-0 left-0 z-[13] pointer-events-none"
          style={{ width: "100vw", height: "100dvh" }}
          aria-hidden
        >
          <canvas ref={foregroundCanvasRef} className="block w-full h-full" />
        </div>
      )}

      <div className="relative z-10 flex flex-col">
        <div className="p-3 space-y-2">
          <ScorePanel
            players={game.players}
            currentIndex={game.currentIndex}
            obscuredIndices={obscuredScores}
            xrayReveals={game.xrayReveals}
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
          <PrisonDiceStatus state={game} currentIndex={game.currentIndex} />
          <SkinPowerPanel
            power={MAX_POWER}
            skinPower={panelSkinPower}
            powerMode={panelPowerMode}
            used={false}
            locked={powerLocked}
            disabled={powerFrozen || practicePowerPreview}
            frozen={powerFrozen}
            onFire={practicePowerPreview ? undefined : onFireSkinPower}
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
      </div>

      <div className="relative z-[15] flex-1 flex flex-col">
        <div className="px-3 flex-1 flex items-center justify-center">
          <div className="w-full space-y-2">
            {practiceVariant && !dialogue && (
              <PowerModePracticeBar
                variant={practiceVariant}
                disabled={!!game.winner || rollAnim}
                powerPreview={practicePowerPreview}
                onPowerPreviewChange={setPracticePowerPreview}
                sharkVideoPreview={practiceSharkVideo}
                onSharkVideoPreviewChange={setPracticeSharkVideo}
                onReplaySharkBite={replayPracticeSharkBite}
                sharkBiteActive={!!game.sharkBiteFx}
              />
            )}
            <DiceTray
              dice={game.dice}
              rolling={rollAnim}
              onToggle={handleToggle}
              disabled={!myTurn || !game.hasRolled || game.farkle || !!game.winner}
              skinId={practiceTraySkinId}
              feltId={storyFeltId}
              feltIntense={bossId === "neo"}
              heldStyleId={heldDiceStyleId}
              lowPower={lowPower}
              powerMode={trayPowerMode}
              fishFeastMode={fishFeastOnTray}
              sharkBiteFx={!!game.sharkBiteFx}
              sharkDiceHidden={!!game.sharkDiceHidden}
              bloodWaterLocked={bloodWaterLocked}
              onBloodWaterSettled={lockBloodWater}
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
              className="w-full min-h-14 py-2 flex flex-col items-center justify-center rounded-xl border-2 text-sm font-bold uppercase tracking-widest text-rose-200 px-3 text-center"
              style={{
                borderColor: plasmaCutRescue && canUsePlasmaCut(game) ? "#a855f7" : "#ff2858",
                background: plasmaCutRescue && canUsePlasmaCut(game)
                  ? "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(120,0,50,0.35))"
                  : "linear-gradient(135deg, rgba(255,0,90,0.2), rgba(120,0,50,0.35))",
                boxShadow: plasmaCutRescue && canUsePlasmaCut(game)
                  ? "0 0 20px rgba(168,85,247,0.45)"
                  : "0 0 20px rgba(255,40,90,0.4)",
              }}
            >
              {plasmaCutRescue && canUsePlasmaCut(game) ? (
                <>
                  <span>Bust — Plasma Cut can save you!</span>
                  <span className="text-[10px] normal-case tracking-normal text-violet-200/90 mt-0.5">
                    Fire ✂️ Plasma Cut above before time runs out
                  </span>
                </>
              ) : (
                "Passing turn…"
              )}
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

      <PlasmaCutModal
        open={plasmaCutOpen}
        dice={game.dice}
        onConfirm={onConfirmPlasmaCut}
        onCancel={() => setPlasmaCutOpen(false)}
      />

      <BlueGelPowerVideoScreen active={showSharkVideo} loop />
      <SharkBiteScreenFX
        active={!!game?.sharkBiteFx}
        onComplete={() => {
          const wasPractice = practiceSharkBiteRef.current;
          practiceSharkBiteRef.current = false;
          setGame((g) => {
            const cleared = clearSharkBiteFx(g);
            return wasPractice ? restoreSharkDice(cleared) : cleared;
          });
          if (!wasPractice) lockBloodWater();
        }}
      />

      <BigPopup
        open={!!popup}
        word={popup?.word}
        variant={popup?.variant}
        burstKey={popup?.burstKey}
        onClose={() => setPopup(null)}
      />

      {/* Boss dialogue overlays */}
      {dialogue && (
        <BossDialogue
          key={`${boss.id}-${dialogue}`}
          boss={boss}
          mode={dialogue}
          summary={dialogue === "win" ? rewardSummary : null}
          onContinue={() => {
            if (dialogue === "intro") {
              setDialogue(null);
            } else if (dialogue === "win") {
              clearStoryFight(boss.id);
              navigate("/story");
            } else {
              // lose — reset to play again (skip intro video on rematch)
              setBloodWaterLocked(false);
              farkleShieldUsedRef.current = false;
              rewardsClaimedRef.current = false;
              setRewardSummary(null);
              setDialogue(null);
              setGame(makeInitialGame(boss, storyPlayerSkin, ownedSkins, ghostDisguiseId));
            }
          }}
          onExit={exitToLadder}
        />
      )}
    </div>
  );
}

// Build the initial game state — boss may have a head-start gimmick.
function makeInitialGame(boss, storyPlayerSkin, ownedSkins = [], ghostDisguiseId = null) {
  if (!boss?.id) return null;
  const bossDef = getBossDefinition(boss.id) ?? boss;
  const playerSkins = [
    assignPlayerSkin(storyPlayerSkin, ownedSkins, ghostDisguiseId),
    assignPlayerSkin(bossDef.bossSkinId || "obsidian", ownedSkins, null, {
      bareGhost: bossDef.bossSkinId === GHOST_SKIN_ID,
    }),
  ];
  const headStart = bossDef.gimmick?.startScore;
  const startScores =
    typeof headStart === "number" && headStart > 0 ? [0, headStart] : null;
  let state = createInitialState([PLAYER_NAME, bossDef.name], { playerSkins, startScores });
  state = applyStoryBossHeadStart(state, bossDef.id);
  if (bossDef.id === "fisherman") {
    state.players = state.players.map((p, i) =>
      i === 0 ? { ...p, chargePowerId: "shark_bite" } : p
    );
  }
  return state;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}