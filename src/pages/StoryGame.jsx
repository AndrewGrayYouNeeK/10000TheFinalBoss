import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { Dices, PiggyBank, Sparkles, Swords } from "lucide-react";
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
  skipFrozenOpponentTurn,
  isPlayerPowerModeActive,
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
import { addSkinPlayXp } from "@/lib/progression";
import { chooseDiceToHold, chooseBankOrRoll } from "@/lib/aiOpponent";
import { useCosmetics } from "@/hooks/useCosmetics";
import { useDiceSound } from "@/lib/useDiceSound";
import DiceTray from "@/components/game/DiceTray";
import HeldDiceStylePicker from "@/components/game/HeldDiceStylePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StoryBossFightVideo from "@/components/story/StoryBossFightVideo";
import MarlinLoopPositionTool from "@/components/story/MarlinLoopPositionTool";
import ScorePanel from "@/components/game/ScorePanel";
import { xrayRevealsVisible } from "@/lib/xrayScan";
import TurnBanner from "@/components/game/TurnBanner";
import BigPopup from "@/components/game/BigPopup";
import BossDialogue from "@/components/story/BossDialogue";
import BossRainBackground from "@/components/story/BossRainBackground";
import SkinPowerPanel, { MAX_POWER } from "@/components/game/SkinPowerPanel";
import { enterGamePlaySession } from "@/lib/gameAudioSettings";
import { assignPlayerSkin, resolvePlayerPower, getSkinLabel, getDisplaySkinId, GHOST_SKIN_ID, getGhostHiddenTraySkinId, storyGhostDiceHidden, storyGhostPowerHiddenScores } from "@/lib/ghostDisguise";
import { redactDiceForOpponent } from "@/lib/onlineGameState";
import { applySkinPower } from "@/lib/powerEffects";
import { canAfford, getPower } from "@/lib/powers";
import { applyPlasmaCut, canUsePlasmaCut } from "@/lib/plasmaCut";
import PlasmaCutModal from "@/components/game/PlasmaCutModal";
import {
  SharkBiteScreenFX,
} from "@/components/game/BlueGelPowerFX";
import { getPrisonTraySkinId } from "@/lib/prisonDice";
import PrisonDiceStatus from "@/components/game/PrisonDiceStatus";
import PowerModePracticeBar, {
  storyBossPracticeVariant,
  practicePreviewSkinId,
} from "@/components/game/PowerModePracticeBar";
import { isLowPowerDevice } from "@/lib/platform";
import {
  abandonStoryFight,
  clearStoryFight,
  loadStoryFight,
  saveStoryFight,
} from "@/lib/storyGameSave";
import { getStoryHotDicePowerConfirmOptions } from "@/lib/devConfig";
import {
  STORY_PLAYER_INDEX,
  canFireStoryIce,
  fireStoryIcePower,
  isStoryIceBossFight,
  isStoryIcePower,
  resolveStorySkinPower,
} from "@/lib/storyIcePower";

const PLAYER_NAME = "You";
const STORY_BOSS_INDEX = 1;

/** Story AI pacing only — player roll/UI timing stays unchanged. */
const AI_ROLL_ANIM_MS = 900;
const AI_TURN_BANNER_MS = 1400;
const AI_AFTER_EVALUATE_MS = 1500;
const AI_FARKLE_PAUSE_MS = 1600;
const AI_NO_HOLD_PAUSE_MS = 1400;
const AI_AFTER_SHARK_BITE_MS = 700;
/** Show opponent dice + ice-cube overlay before skipping their frozen turn. */
const FROZEN_DICE_REVEAL_MS = 2000;

/** Story mode: gameLogic emits "${PLAYER_NAME}'s turn" — fix grammar and avoid duplicating "Your turn". */
function storyTurnBannerMessage(rawMessage, { myTurn, farkle }) {
  if (!myTurn || farkle) return rawMessage;

  const msg = (rawMessage || "").trim();
  const rollPrompt = `${PLAYER_NAME}'s turn — roll the dice!`;
  const enemyFrozen = `${PLAYER_NAME}'s turn — enemy frozen!`;

  if (!msg || msg === rollPrompt) {
    return "🎮 Your turn — roll the dice!";
  }
  if (msg === enemyFrozen) {
    return "🎮 Your turn — enemy frozen!";
  }
  if (msg.endsWith(`${PLAYER_NAME}'s turn.`) || msg.endsWith(`${PLAYER_NAME}'s turn`)) {
    const prefix = msg.replace(new RegExp(`\\s*${PLAYER_NAME}'s turn\\.?$`, "i"), "").trim();
    return prefix ? `🎮 ${prefix} Your turn.` : "🎮 Your turn.";
  }

  // Mid-turn guidance (select dice, roll again, etc.) — no redundant prefix.
  return msg;
}

function readSavedFight(bossId) {
  if (!bossId) return null;
  return loadStoryFight(bossId);
}

export default function StoryGame() {
  const { bossId } = useParams();
  const navigate = useNavigate();
  const boss = getBoss(bossId);
  const { user, updateMe, sfxMuted, heldDiceStyleId, setHeldDiceStyle, ownedSkins, ghostDisguiseId } = useCosmetics();
  // Each boss brings their own table felt — no player choice in story mode.
  const storyFeltId = getStoryBossFeltId(bossId);
  const storyPlayerSkin = getStoryPlayerSkin(user?.bosses_defeated || []);
  const playDiceSound = useDiceSound();

  const initialSave = readSavedFight(bossId);

  const [dialogue, setDialogue] = useState(() => {
    if (initialSave?.game) return initialSave.dialogue ?? null;
    return "intro";
  });
  const [game, setGame] = useState(() => initialSave?.game ?? null);
  const [playerRolling, setPlayerRolling] = useState(false);
  const [opponentRolling, setOpponentRolling] = useState(false);
  const playerRollTimerRef = useRef(null);
  const opponentRollTimerRef = useRef(null);
  /** Sync guard — blocks double tap before playerRolling state commits. */
  const playerRollLockRef = useRef(false);
  const playerEvaluateTimerRef = useRef(null);
  const clearPlayerRollTimer = useCallback(() => {
    if (playerRollTimerRef.current != null) {
      clearTimeout(playerRollTimerRef.current);
      playerRollTimerRef.current = null;
    }
  }, []);
  const clearOpponentRollTimer = useCallback(() => {
    if (opponentRollTimerRef.current != null) {
      clearTimeout(opponentRollTimerRef.current);
      opponentRollTimerRef.current = null;
    }
  }, []);
  const startPlayerRollAnim = useCallback(() => {
    clearPlayerRollTimer();
    setPlayerRolling(true);
    playerRollTimerRef.current = setTimeout(() => {
      setPlayerRolling(false);
      playerRollTimerRef.current = null;
    }, 900);
  }, [clearPlayerRollTimer]);
  const startOpponentRollAnim = useCallback(() => {
    clearOpponentRollTimer();
    setOpponentRolling(true);
    opponentRollTimerRef.current = setTimeout(() => {
      setOpponentRolling(false);
      opponentRollTimerRef.current = null;
    }, AI_ROLL_ANIM_MS);
  }, [clearOpponentRollTimer]);
  const [popup, setPopup] = useState(null);
  const [plasmaCutOpen, setPlasmaCutOpen] = useState(false);
  const [bloodWaterLocked, setBloodWaterLocked] = useState(() => initialSave?.bloodWaterLocked ?? false);
  const lockBloodWater = useCallback(() => setBloodWaterLocked(true), []);
  const onFeastSettled = useCallback(() => {
    lockBloodWater();
    setGame((g) => clearSharkBiteFx(g));
  }, [lockBloodWater]);

  useEffect(() => {
    if (!game?.matrixGlitchFx) return undefined;
    const t = setTimeout(() => {
      setGame((g) =>
        g ? { ...g, matrixGlitchFx: false, matrixGlitchDieIds: [] } : g
      );
    }, 800);
    return () => clearTimeout(t);
  }, [game?.matrixGlitchFx]);

  const [practicePowerPreview, setPracticePowerPreview] = useState(false);
  const [marlinLoopToolOpen, setMarlinLoopToolOpen] = useState(false);
  /** Flash opponent dice with ice-cube skin on top while Frozen Ice is active. */
  const [frozenDiceReveal, setFrozenDiceReveal] = useState(false);
  const frozenRevealTimerRef = useRef(null);
  const practiceSharkBiteRef = useRef(false);

  const startFrozenDiceReveal = useCallback(() => {
    if (frozenRevealTimerRef.current != null) {
      clearTimeout(frozenRevealTimerRef.current);
    }
    setFrozenDiceReveal(true);
    frozenRevealTimerRef.current = setTimeout(() => {
      setFrozenDiceReveal(false);
      frozenRevealTimerRef.current = null;
    }, FROZEN_DICE_REVEAL_MS);
  }, []);
  const foregroundCanvasRef = useRef(null);
  const foregroundFx = bossId === "fisherman" || bossId === "gq";
  const replayPracticeSharkBite = useCallback(() => {
    practiceSharkBiteRef.current = true;
    setGame((g) => (g ? { ...g, sharkBiteFx: true, sharkDiceHidden: true } : g));
  }, []);
  const onPracticeSharkVideo = useCallback(() => {
    replayPracticeSharkBite();
  }, [replayPracticeSharkBite]);
  const [rewardSummary, setRewardSummary] = useState(null);
  const farkleShieldUsedRef = useRef(initialSave?.farkleShieldUsed ?? false);
  const rewardsClaimedRef = useRef(initialSave?.rewardsClaimed ?? false);
  const prevBustRef = useRef(initialSave?.game?.bustCount ?? 0);
  const fightStartedRef = useRef(!!initialSave?.game || !!initialSave?.fightStarted);
  const dialogueRef = useRef(dialogue);
  dialogueRef.current = dialogue;
  const fightSnapshotRef = useRef(null);
  const ghostOptions = React.useMemo(
    () => ({ ghostDisguiseId, ownedSkins }),
    [ghostDisguiseId, ownedSkins]
  );
  const playerPowerResolve = game
    ? resolvePlayerPower(game, STORY_PLAYER_INDEX, ghostOptions)
    : null;
  /** Player power comes from THEIR equipped skin — never steal Marlin's Shark Bite. */
  const rawSkinPower = playerPowerResolve?.power ?? null;
  const skinPower = resolveStorySkinPower(rawSkinPower, bossId);
  const storyIceFight = isStoryIceBossFight(bossId);
  const resolvedPower = playerPowerResolve;

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

    updateMe.mutate({ story_active_boss: fightBoss.id });

    const saved = loadStoryFight(bossId);
    if (saved?.game) {
      prevBustRef.current = saved.game.bustCount || 0;
      rewardsClaimedRef.current = saved.rewardsClaimed;
      farkleShieldUsedRef.current = saved.farkleShieldUsed;
      setRewardSummary(null);
      setBloodWaterLocked(saved.bloodWaterLocked);
      setPracticePowerPreview(false);
      practiceSharkBiteRef.current = false;
      setDialogue(saved.dialogue ?? null);
      // Repair Composer bug: player was wrongly given Marlin's shark_bite charge.
      let restored = saved.game;
      if (bossId === "fisherman" && restored?.players?.length >= 2) {
        restored = {
          ...restored,
          players: restored.players.map((p, i) => {
            if (i === 0 && p.chargePowerId === "shark_bite") {
              const { chargePowerId: _drop, ...rest } = p;
              return rest;
            }
            if (i === 1 && !p.chargePowerId) {
              return { ...p, chargePowerId: "shark_bite" };
            }
            return p;
          }),
        };
      }
      setGame(restored);
      fightStartedRef.current = true;
      return;
    }

    abandonStoryFight(fightBoss.id);
    prevBustRef.current = 0;
    fightStartedRef.current = false;
    setDialogue("intro");
    rewardsClaimedRef.current = false;
    farkleShieldUsedRef.current = false;
    setRewardSummary(null);
    setBloodWaterLocked(false);
    setPracticePowerPreview(false);
    practiceSharkBiteRef.current = false;
    setGame(null);
    // Fresh fight when bossId changes only — avoid resetting mid-match on profile/cosmetics updates.
  }, [bossId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistFight = useCallback(() => {
    if (!bossId || !fightSnapshotRef.current?.game) return;
    saveStoryFight(bossId, fightSnapshotRef.current);
  }, [bossId]);

  useLayoutEffect(() => {
    if (!bossId || !game) {
      fightSnapshotRef.current = null;
      return;
    }
    fightSnapshotRef.current = {
      game,
      dialogue,
      bloodWaterLocked,
      farkleShieldUsed: farkleShieldUsedRef.current,
      rewardsClaimed: rewardsClaimedRef.current,
      fightStarted: fightStartedRef.current,
    };
    saveStoryFight(bossId, fightSnapshotRef.current);
  }, [bossId, game, dialogue, bloodWaterLocked]);

  useEffect(() => {
    const flushOnLifecycle = () => persistFight();
    window.addEventListener("orientationchange", flushOnLifecycle);
    window.addEventListener("pagehide", flushOnLifecycle);
    window.addEventListener("visibilitychange", flushOnLifecycle);
    return () => {
      window.removeEventListener("orientationchange", flushOnLifecycle);
      window.removeEventListener("pagehide", flushOnLifecycle);
      window.removeEventListener("visibilitychange", flushOnLifecycle);
    };
  }, [persistFight]);

  useEffect(
    () => () => {
      clearPlayerRollTimer();
      clearOpponentRollTimer();
      if (playerEvaluateTimerRef.current != null) {
        clearTimeout(playerEvaluateTimerRef.current);
      }
    },
    [clearPlayerRollTimer, clearOpponentRollTimer]
  );

  // Opponent roll animation must not leak onto the player's turn (and vice versa).
  useEffect(() => {
    clearPlayerRollTimer();
    clearOpponentRollTimer();
    if (playerEvaluateTimerRef.current != null) {
      clearTimeout(playerEvaluateTimerRef.current);
      playerEvaluateTimerRef.current = null;
    }
    playerRollLockRef.current = false;
    setPlayerRolling(false);
    setOpponentRolling(false);
  }, [game?.currentIndex, clearPlayerRollTimer, clearOpponentRollTimer]);

  const handleDialogueContinue = useCallback(() => {
    const mode = dialogueRef.current;
    if (mode === "intro") {
      if (fightStartedRef.current) return;
      fightStartedRef.current = true;
      setDialogue(null);
      const nextGame = makeInitialGame(boss, storyPlayerSkin, ownedSkins, ghostDisguiseId);
      setGame(nextGame);
      if (boss?.id && nextGame) {
        saveStoryFight(boss.id, {
          game: nextGame,
          dialogue: null,
          bloodWaterLocked: false,
          farkleShieldUsed: false,
          rewardsClaimed: false,
          fightStarted: true,
        });
      }
    } else if (mode === "win") {
      clearStoryFight(boss.id);
      navigate("/story");
    } else if (mode === "lose") {
      abandonStoryFight(boss.id);
      fightStartedRef.current = true;
      setBloodWaterLocked(false);
      farkleShieldUsedRef.current = false;
      rewardsClaimedRef.current = false;
      setRewardSummary(null);
      setDialogue(null);
      setGame(makeInitialGame(boss, storyPlayerSkin, ownedSkins, ghostDisguiseId));
    }
  }, [boss, storyPlayerSkin, ownedSkins, ghostDisguiseId, navigate]);

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
    if (!game || !skinPower) return;

    const player = game.players[STORY_PLAYER_INDEX];
    const storyIce = isStoryIcePower(skinPower, bossId);
    const canFireStoryIceNow = storyIce && canFireStoryIce(game, STORY_PLAYER_INDEX, bossId);

    if (storyIce) {
      if (!canFireStoryIceNow) {
        setPopup({ word: "CAN'T FREEZE RIGHT NOW", variant: "warning" });
        return;
      }
    } else if (!isMyTurn() || !player?.powerCharge) {
      return;
    }

    if (!canAfford(MAX_POWER, skinPower.id)) return;
    const debuffs = player?.debuffs || [];
    if (debuffs.some((d) => (typeof d === "string" ? d : d.id) === "lockout")) return;

    if (skinPower.id === "plasma_cut") {
      if (!canUsePlasmaCut(game)) {
        setPopup({ word: "NO DICE TO CUT", variant: "warning" });
        return;
      }
      setPlasmaCutOpen(true);
      return;
    }

    if (storyIce) {
      const result = fireStoryIcePower(game, STORY_PLAYER_INDEX, bossId);
      if (result.variant === "warning") {
        if (result.message) {
          setPopup({ word: result.message.toUpperCase(), variant: "warning" });
        }
        return;
      }
      setGame(result.state);
      setBloodWaterLocked(false);
      // Show their dice with ice cubes on top (opponent skin under the freeze sheet).
      startFrozenDiceReveal();
      setPopup({
        word: (result.message || "ENEMY FROZEN").toUpperCase(),
        variant: "success",
      });
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
    setBloodWaterLocked(false);
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
    setBloodWaterLocked(false);
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

  const doAiRoll = useCallback(() => {
    startOpponentRollAnim();
    playDiceSound({ opponent: true });
    setGame((g) => rollDice(g));
    setTimeout(() => {
      setGame((g) => evaluateRoll(applyBossDiceGimmick(g)));
    }, AI_ROLL_ANIM_MS);
  }, [playDiceSound, startOpponentRollAnim, boss]);

  // Frozen enemy: show their iced dice, then bounce turn back (never let AI act).
  useEffect(() => {
    if (!storyIceFight || !game?.storyIceFreeze || game.winner || dialogue) return;
    if (game.players[game.currentIndex]?.name !== boss?.name) return;
    startFrozenDiceReveal();
    const t = setTimeout(() => {
      setGame((g) => skipFrozenOpponentTurn(g));
    }, FROZEN_DICE_REVEAL_MS);
    return () => clearTimeout(t);
  }, [
    storyIceFight,
    game?.currentIndex,
    game?.storyIceFreeze,
    game?.winner,
    dialogue,
    boss?.name,
    startFrozenDiceReveal,
  ]);

  useEffect(() => {
    return () => {
      if (frozenRevealTimerRef.current != null) {
        clearTimeout(frozenRevealTimerRef.current);
      }
    };
  }, []);

  // Drive AI turn when it's the AI's turn
  useEffect(() => {
    if (!game || game.winner || dialogue || game.sharkBiteFx) return;
    // Frozen — no AI rolls; reveal + skip effect owns this beat.
    if (game.storyIceFreeze) return;
    const currentPlayerName = game.players[game.currentIndex]?.name;
    if (currentPlayerName !== boss?.name) return;

    let cancelled = false;
    const runAiTurn = async () => {
      // Pause so the turn banner is readable before the opponent rolls
      await wait(AI_TURN_BANNER_MS);
      if (cancelled) return;

      // First roll of the turn if not yet rolled
      if (!game.hasRolled) {
        // Marlin Joe — fire Shark Bite at the player before rolling when charged.
        if (bossId === "fisherman" && game.players[game.currentIndex]?.powerCharge) {
          const result = applySkinPower(game, "shark_bite");
          if (result.variant !== "warning") {
            const next = consumeSkinPower(result.state);
            setGame(next);
            // Feeding Frenzy / bite FX — wait for onComplete, then this effect re-runs.
            if (next.sharkBiteFx) return;
            await wait(AI_AFTER_SHARK_BITE_MS);
            if (cancelled) return;
          }
        }
        doAiRoll();
        return;
      }
    };
    runAiTurn();
    return () => { cancelled = true; };
  }, [
    game?.currentIndex,
    game?.hasRolled,
    game?.winner,
    game?.sharkBiteFx,
    game?.storyIceFreeze,
    dialogue,
    boss?.name,
    bossId,
    doAiRoll,
  ]);

  // After AI has rolled and the dice have settled, decide hold + bank/roll
  useEffect(() => {
    if (!game || game.winner || dialogue || game.sharkBiteFx) return;
    if (game.storyIceFreeze) return;
    const currentPlayerName = game.players[game.currentIndex]?.name;
    if (currentPlayerName !== boss?.name) return;
    if (!game.hasRolled || opponentRolling) return;

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
      }, AI_FARKLE_PAUSE_MS);
      return () => timers.forEach(clearTimeout);
    }

    const idsToHold = chooseDiceToHold(game, boss.difficulty);
    if (idsToHold.length === 0) {
      schedule(() => {
        setGame((g) =>
          g?.players[g.currentIndex]?.name === boss?.name ? passAfterFarkle(g) : g
        );
      }, AI_NO_HOLD_PAUSE_MS);
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
      startOpponentRollAnim();
      playDiceSound({ opponent: true });
      setGame((current) => {
        if (current?.players[current.currentIndex]?.name !== boss?.name) return current;
        const { state: next } = confirmAndReroll(current);
        return applyBossDiceGimmick(next);
      });
    }, AI_AFTER_EVALUATE_MS);

    return () => timers.forEach(clearTimeout);
  }, [
    game?.hasRolled,
    game?.farkle,
    game?.currentIndex,
    game?.sharkBiteFx,
    game?.storyIceFreeze,
    opponentRolling,
    game?.winner,
    dialogue,
    boss,
    playDiceSound,
    startOpponentRollAnim,
  ]);

  // Player actions
  const handleToggle = useCallback((dieId) => {
    setGame((g) => {
      if (g.players[g.currentIndex]?.name !== PLAYER_NAME || g.farkle || !g.hasRolled) return g;
      return toggleHold(g, dieId);
    });
  }, []);
  const handleRoll = () => {
    if (playerRollLockRef.current) return;
    if (frozenDiceReveal) return;
    if (!isMyTurn() || playerRolling || opponentRolling || game?.sharkBiteFx) return;
    playerRollLockRef.current = true;
    startPlayerRollAnim();
    playDiceSound();
    setGame((g) => rollDice(g));
    if (playerEvaluateTimerRef.current != null) {
      clearTimeout(playerEvaluateTimerRef.current);
    }
    playerEvaluateTimerRef.current = setTimeout(() => {
      playerEvaluateTimerRef.current = null;
      setGame((g) => evaluateRoll(g));
      playerRollLockRef.current = false;
    }, 900);
  };
  const handleRollAgain = () => {
    if (playerRollLockRef.current) return;
    if (frozenDiceReveal) return;
    if (!isMyTurn() || playerRolling || opponentRolling) return;
    const info = getHeldInfo(game);
    if (!info.valid || heldSelectionPoints(info, game.perfectTenKPending) === 0) return;
    playerRollLockRef.current = true;
    startPlayerRollAnim();
    playDiceSound();
    const { state: next, instantWin } = confirmAndReroll(game, getStoryHotDicePowerConfirmOptions());
    if (instantWin) setPopup({ word: "SIX OF A KIND — YOU WIN!", variant: "success" });
    if (next.winner) {
      clearPlayerRollTimer();
      setPlayerRolling(false);
      playerRollLockRef.current = false;
      setGame(next);
      return;
    }
    setGame(next);
    if (playerEvaluateTimerRef.current != null) {
      clearTimeout(playerEvaluateTimerRef.current);
    }
    playerEvaluateTimerRef.current = setTimeout(() => {
      playerEvaluateTimerRef.current = null;
      playerRollLockRef.current = false;
    }, 900);
  };
  const handleBank = () => {
    if (frozenDiceReveal) return;
    if (!game || !isMyTurn() || playerRolling || opponentRolling || game.sharkBiteFx || game.farkle || !game.hasRolled) return;
    setGame((g) => {
      if (!g || g.players[g.currentIndex]?.name !== PLAYER_NAME || g.sharkBiteFx || g.farkle || g.winner) {
        return g;
      }
      const heldInfo = getHeldInfo(g);
      const points = heldSelectionPoints(heldInfo, g.perfectTenKPending);
      const player = g.players[g.currentIndex];
      const needsEntry = !player.onBoard;
      const potentialTotal = (g.turnScore || 0) + (heldInfo.valid ? points : 0);
      const allowed =
        g.hasRolled &&
        !g.farkle &&
        heldInfo.valid &&
        points > 0 &&
        (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);
      return allowed ? bankAndPass(g) : g;
    });
  };

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

    const skinId = user?.equipped_skin || storyPlayerSkin;
    Object.assign(patch, addSkinPlayXp(user, skinId, 2));

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

  const lowPower = isLowPowerDevice();
  const cutsceneOverlay = !!dialogue;

  if (dialogue === "intro" && !game) {
    return (
      <div className="min-h-screen text-white flex flex-col relative">
        <BossRainBackground bossId={boss.id} lite />
        <div className="relative z-10 flex flex-col flex-1">
          <div
            className="sticky top-0 z-20 flex items-center justify-between px-3 pb-3 border-b"
            style={{
              ...PAGE_HEADER_SAFE_STYLE,
              borderColor: "rgba(0,255,200,0.25)",
              background: "rgba(3,4,10,0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            <BackButton label="Back" onClick={exitToLadder} />
            <div
              className="flex items-center gap-2 font-pixel text-[10px] tracking-widest"
              style={{ color: "#fff", textShadow: "0 0 6px #ff00ea, 0 0 16px #00ffea" }}
            >
              <Swords className="w-4 h-4" />
              VS {boss.name.toUpperCase()}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-amber-300 hover:text-amber-200 hover:bg-white/10"
                  aria-label="Held dice glow styles"
                  title="Held dice glow"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(20rem,calc(100vw-1.5rem))] border-amber-500/30 bg-slate-950/95 p-0"
              >
                <HeldDiceStylePicker value={heldDiceStyleId} onChange={setHeldDiceStyle} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <BossDialogue
          key={`${boss.id}-intro`}
          boss={boss}
          mode="intro"
          onContinue={handleDialogueContinue}
          onExit={exitToLadder}
        />
      </div>
    );
  }

  if (!game) return null;

  // Setup boss panel
  const heldInfo = getHeldInfo(game);
  const heldPoints = heldSelectionPoints(heldInfo, game.perfectTenKPending);
  const currentPlayer = game.players[game.currentIndex];
  const myTurn = isMyTurn();
  const rollAnim = playerRolling || opponentRolling;
  const diceRolling = myTurn ? playerRolling : opponentRolling;
  const needsEntry = currentPlayer && !currentPlayer.onBoard;
  const potentialTotal = (game.turnScore || 0) + (heldInfo.valid ? heldPoints : 0);
  const wouldOvershoot = currentPlayer && currentPlayer.score + potentialTotal > TARGET_SCORE;
  const canBank =
    myTurn &&
    !playerRolling &&
    game.hasRolled &&
    !game.farkle &&
    heldInfo.valid &&
    heldPoints > 0 &&
    (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);
  const obscuredScores = (() => {
    const base = getObscuredScoreIndices(game);
    storyGhostPowerHiddenScores(game, STORY_BOSS_INDEX).forEach((i) => base.add(i));
    return base;
  })();
  const storyPlayer = game.players[STORY_PLAYER_INDEX];
  const powerLocked = (storyPlayer?.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "lockout"
  );
  const powerFrozen = (storyPlayer?.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "freeze"
  );
  const playerCharge = game?.players[STORY_PLAYER_INDEX]?.powerCharge;
  const storyIceReady =
    storyIceFight &&
    isStoryIcePower(skinPower, bossId) &&
    canFireStoryIce(game, STORY_PLAYER_INDEX, bossId);
  const plasmaCutRescue =
    myTurn && skinPower?.id === "plasma_cut" && !!playerCharge && game.farkle;
  // Power stays on once charged — panel remains visible across opponent turns until fired.
  const storyPlayerPowerMode = isPlayerPowerModeActive(game, STORY_PLAYER_INDEX);
  const powerModeActive = storyPlayerPowerMode;
  const isSaboPower = skinPower?.kind === "sabo";
  const frozenTargetIdx = game?.storyIceFreeze?.targetIdx;
  const showFrozenEnemyDice =
    frozenDiceReveal ||
    (storyIceFight &&
      !!game.storyIceFreeze &&
      game.currentIndex === frozenTargetIdx);
  const trayPlayerIndex =
    showFrozenEnemyDice && typeof frozenTargetIdx === "number"
      ? frozenTargetIdx
      : game.currentIndex;
  const trayPlayer = game.players[trayPlayerIndex];
  const hideStoryGhostDice = storyGhostDiceHidden(
    trayPlayer,
    trayPlayerIndex,
    STORY_PLAYER_INDEX
  );
  const traySkinId = getPrisonTraySkinId(
    game,
    trayPlayerIndex,
    hideStoryGhostDice
      ? getGhostHiddenTraySkinId()
      : getDisplaySkinId(trayPlayer, { ghostDisguiseId, ownedSkins })
  );
  const practiceVariant = storyBossPracticeVariant(bossId);
  const previewSkinId = practicePreviewSkinId(practiceVariant);
  const practiceTraySkinId =
    practicePowerPreview && previewSkinId ? previewSkinId : traySkinId;
  // Feeding Frenzy — fish dice were targeted (not Blue Gel's own Shark Bite charge).
  const fishFeastOnTray = !!game?.sharkFishFeast;
  const feastTargetIdx = game?.sharkFishFeastTargetIdx;
  const feastTraySkinId =
    fishFeastOnTray && typeof feastTargetIdx === "number" && game.players[feastTargetIdx]
      ? getPrisonTraySkinId(
          game,
          feastTargetIdx,
          getDisplaySkinId(game.players[feastTargetIdx], { ghostDisguiseId, ownedSkins })
        )
      : null;
  const diceTraySkinId = feastTraySkinId || practiceTraySkinId;
  const practiceSkinPower =
    practiceVariant === "marlin"
      ? getPower("shark_bite")
      : practiceVariant === "gq"
        ? getPower("siphon")
        : practiceVariant === "ice"
          ? getPower("frosty_ice")
          : null;
  // Dice tray power VFX while your charge is live on your dice (stays on through rolls).
  const trayPlayerPowerMode = storyPlayerPowerMode && myTurn && !hideStoryGhostDice;
  const trayPowerMode =
    trayPlayerPowerMode || (practicePowerPreview && !!practiceVariant);
  const trayIceFrozen = showFrozenEnemyDice;
  const panelPowerMode = powerModeActive || practicePowerPreview;
  const panelSkinPower = practicePowerPreview ? practiceSkinPower : skinPower;
  const trayBloodWater = bloodWaterLocked;
  const trayDice = hideStoryGhostDice ? redactDiceForOpponent(game.dice) : game.dice;
  return (
    <div className="min-h-screen text-white pb-6 flex flex-col relative">
      <BossRainBackground
        bossId={boss.id}
        lite={cutsceneOverlay || lowPower}
        bubblesFullScreen={bossId === "fisherman"}
        frontCanvasRef={foregroundFx && !cutsceneOverlay ? foregroundCanvasRef : null}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-amber-300 hover:text-amber-200 hover:bg-white/10"
                aria-label="Held dice glow styles"
                title="Held dice glow"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(20rem,calc(100vw-1.5rem))] border-amber-500/30 bg-slate-950/95 p-0"
            >
              <HeldDiceStylePicker value={heldDiceStyleId} onChange={setHeldDiceStyle} />
            </PopoverContent>
          </Popover>
        </div>

        {!cutsceneOverlay && (
          <StoryBossFightVideo
            bossId={bossId}
            loopPanEnabled={bossId === "fisherman" && marlinLoopToolOpen}
            frozen={storyIceFight && !!game?.storyIceFreeze}
          />
        )}
      </div>

      {foregroundFx && !cutsceneOverlay && (
        <div
          className="fixed top-0 left-0 z-[13] pointer-events-none"
          style={{ width: "100vw", height: "100dvh" }}
          aria-hidden
        >
          <canvas ref={foregroundCanvasRef} className="block w-full h-full" />
        </div>
      )}

      {bossId === "fisherman" && !cutsceneOverlay && (
        <MarlinLoopPositionTool
          floating
          open={marlinLoopToolOpen}
          onOpenChange={setMarlinLoopToolOpen}
        />
      )}

      {!cutsceneOverlay && (
      <>
      <div className="relative z-10 flex flex-col">
        <div className="p-3 space-y-2">
          <ScorePanel
            players={game.players}
            currentIndex={game.currentIndex}
            obscuredIndices={obscuredScores}
            xrayReveals={xrayRevealsVisible(game.xrayReveals, {
              scannerIndex: game.xrayScannerIndex,
              currentIndex: game.currentIndex,
            })}
          />
        </div>

        <div className="px-3 mb-2 space-y-2">
          <TurnBanner
            message={storyTurnBannerMessage(game.message, { myTurn, farkle: game.farkle })}
            variant={game.messageVariant}
          />
          <PrisonDiceStatus state={game} currentIndex={game.currentIndex} />
          <SkinPowerPanel
            power={MAX_POWER}
            skinPower={panelSkinPower}
            powerMode={panelPowerMode}
            used={false}
            locked={powerLocked}
            disabled={(powerFrozen && !storyIceReady) || practicePowerPreview}
            frozen={powerFrozen}
            onFire={practicePowerPreview ? undefined : onFireSkinPower}
            hidePowerName={isSaboPower && !storyIceFight}
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
                {hideStoryGhostDice ? (
                  <span className="text-slate-500 text-2xl tracking-widest">•••</span>
                ) : (
                  <>
                    {(game.turnScore || 0).toLocaleString()}
                    {heldInfo.valid && heldPoints > 0 && (
                      <span className="text-emerald-400 text-xl"> +{heldPoints.toLocaleString()}</span>
                    )}
                  </>
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
                sharkVideoPreview={!!game.sharkBiteFx}
                onSharkVideoPreviewChange={onPracticeSharkVideo}
                onReplaySharkBite={replayPracticeSharkBite}
                sharkBiteActive={!!game.sharkBiteFx}
              />
            )}
            <DiceTray
              dice={trayDice}
              rolling={diceRolling}
              onToggle={handleToggle}
              disabled={
                showFrozenEnemyDice ||
                hideStoryGhostDice ||
                !myTurn ||
                !game.hasRolled ||
                game.farkle ||
                !!game.winner
              }
              skinId={diceTraySkinId}
              feltId={storyFeltId}
              feltIntense={bossId === "neo"}
              heldStyleId={heldDiceStyleId}
              lowPower={lowPower}
              powerMode={trayPowerMode && !showFrozenEnemyDice}
              spectralHidden={hideStoryGhostDice}
              iceFrozenOverlay={trayIceFrozen}
              fishFeastMode={fishFeastOnTray}
              sharkBiteFx={!!game.sharkBiteFx}
              sharkDiceHidden={!!game.sharkDiceHidden}
              bloodWaterLocked={trayBloodWater}
              onBloodWaterSettled={fishFeastOnTray ? onFeastSettled : undefined}
              matrixGlitchDieIds={
                game.matrixGlitchFx ? (game.matrixGlitchDieIds ?? []) : []
              }
            />
            {heldInfo.held.length > 0 && !hideStoryGhostDice && (
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
          ) : showFrozenEnemyDice ? (
            <div className="text-center text-sm text-sky-200 py-4 font-bold uppercase tracking-widest">
              ❄️ {boss.name} frozen — dice iced over
            </div>
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
              disabled={
                frozenDiceReveal || playerRolling || opponentRolling || !!game.winner
              }
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white disabled:opacity-40"
            >
              <Dices className="w-5 h-5 mr-2" /> Roll Dice
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRollAgain}
                disabled={
                  frozenDiceReveal ||
                  !heldInfo.valid ||
                  heldPoints === 0 ||
                  playerRolling
                }
                size="lg"
                className="h-14 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white disabled:opacity-40"
              >
                <Dices className="w-5 h-5 mr-1" /> Roll Again
              </Button>
              <Button
                onClick={handleBank}
                disabled={frozenDiceReveal || !canBank}
                size="lg"
                className="h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white disabled:opacity-40"
              >
                <PiggyBank className="w-5 h-5 mr-1" /> Bank
              </Button>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      <PlasmaCutModal
        open={plasmaCutOpen}
        dice={game.dice}
        onConfirm={onConfirmPlasmaCut}
        onCancel={() => setPlasmaCutOpen(false)}
      />

      <SharkBiteScreenFX
        active={!!game?.sharkBiteFx}
        onComplete={() => {
          practiceSharkBiteRef.current = false;
          // Bite finished — always restore tray dice + skins.
          setBloodWaterLocked(false);
          setGame((g) => restoreSharkDice(clearSharkBiteFx(g)));
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
      {dialogue && dialogue !== "intro" && (
        <BossDialogue
          key={`${boss.id}-${dialogue}`}
          boss={boss}
          mode={dialogue}
          summary={dialogue === "win" ? rewardSummary : null}
          onContinue={handleDialogueContinue}
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
  // Marlin Joe owns Shark Bite (boss index 1). Player keeps their own skin power.
  if (bossDef.id === "fisherman") {
    state.players = state.players.map((p, i) =>
      i === 1 ? { ...p, chargePowerId: "shark_bite" } : p
    );
  }
  // Frost arc — player always fires offensive Frozen Ice (not Score Freeze / paper RNG).
  if (bossDef.id === "snowman" || bossDef.id === "ice_witch") {
    state.players = state.players.map((p, i) =>
      i === 0 ? { ...p, chargePowerId: "frosty_ice" } : p
    );
  }
  return state;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}