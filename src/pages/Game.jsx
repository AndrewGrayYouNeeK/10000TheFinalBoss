import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dices, PiggyBank, Film, Sparkles } from "lucide-react";
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
  clearSharkBiteFx,
  restoreSharkDice,
  ENTRY_THRESHOLD,
  getObscuredScoreIndices,
  consumeSkinPower,
} from "@/lib/gameLogic";
import { heldSelectionLabel, heldSelectionPoints } from "@/lib/scoring";
import DiceTray from "@/components/game/DiceTray";
import ScorePanel from "@/components/game/ScorePanel";
import TurnBanner from "@/components/game/TurnBanner";
import GameOverDialog from "@/components/game/GameOverDialog";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import RulesSheet from "@/components/game/RulesSheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import BigPopup from "@/components/game/BigPopup";
import CyberBackground from "@/components/game/CyberBackground";
import GameplayBillboard from "@/components/game/GameplayBillboard";
import { useCosmetics } from "@/hooks/useCosmetics";
import { XP_REWARDS } from "@/lib/progression";
import { useDiceSound } from "@/lib/useDiceSound";
import GameAudioControls from "@/components/game/GameAudioControls";
import HeldDiceStylePicker from "@/components/game/HeldDiceStylePicker";
import SkinPowerPanel, { MAX_POWER } from "@/components/game/SkinPowerPanel";
import { enterGamePlaySession } from "@/lib/gameAudioSettings";
import { buildGamePlayerSkins, resolvePlayerPower, getSkinLabel, getDisplaySkinId, GHOST_SKIN_ID, pickTrueSkinForGhost, readSessionPlayerDisguiseIds, readSessionPlayerSkinIds } from "@/lib/ghostDisguise";
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
  skinPracticeVariant,
  practicePreviewSkinId,
} from "@/components/game/PowerModePracticeBar";
import { isLowPowerDevice } from "@/lib/platform";
import { Link } from "react-router-dom";

export default function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewSharkBite = searchParams.get("previewSharkBite") === "1";
  const [state, setState] = useState(null);
  const [rollAnim, setRollAnim] = useState(false);
  const [popup, setPopup] = useState(null); // { word, variant }
  const [plasmaCutOpen, setPlasmaCutOpen] = useState(false);
  const [bloodWaterLocked, setBloodWaterLocked] = useState(false);
  const lockBloodWater = useCallback(() => setBloodWaterLocked(true), []);
  const [practicePowerPreview, setPracticePowerPreview] = useState(false);
  const practiceSharkBiteRef = useRef(false);
  const [shakeTriggered, setShakeTriggered] = useState(0);
  const { user, equippedSkinId, equippedFeltId, addCoins, addXp, recordGameResult, grantReward, sfxMuted, opponentSfxMuted, setSfxMuted, setOpponentSfxMuted, heldDiceStyleId, setHeldDiceStyle, ownedSkins, ghostDisguiseId, isLoading } = useCosmetics();
  const playDiceSound = useDiceSound();
  const prevBustRef = React.useRef(0);
  const winnerAwardedRef = React.useRef(false);
  const previewBiteFiredRef = React.useRef(false);

  const buildSkins = React.useCallback(
    (playerCount, skinIds = null, disguiseIds = null) =>
      buildGamePlayerSkins(
        playerCount,
        equippedSkinId,
        ownedSkins,
        ghostDisguiseId,
        skinIds,
        disguiseIds,
      ),
    [equippedSkinId, ownedSkins, ghostDisguiseId]
  );

  const resolvedPower = state ? resolvePlayerPower(state, state.currentIndex) : null;
  const skinPower = resolvedPower?.power ?? null;

  useEffect(() => {
    if (isLoading) return;
    let stored = sessionStorage.getItem("dice10k_players");
    // Preview mode: jump straight onto the real gameplay screen with 2 players.
    if (!stored && previewSharkBite) {
      stored = JSON.stringify(["You", "Rival"]);
      sessionStorage.setItem("dice10k_players", stored);
    }
    if (!stored) {
      navigate("/setup");
      return;
    }
    const names = JSON.parse(stored);
    const skinIds = readSessionPlayerSkinIds();
    const disguiseIds = readSessionPlayerDisguiseIds();
    const playerSkins = buildSkins(names.length, skinIds, disguiseIds);
    setState(createInitialState(names, { playerSkins }));
    prevBustRef.current = 0;
    winnerAwardedRef.current = false;
    previewBiteFiredRef.current = false;
  }, [navigate, buildSkins, isLoading, previewSharkBite]);

  // Auto-play Shark Bite FX once on the real game screen (?previewSharkBite=1).
  useEffect(() => {
    if (!previewSharkBite || !state || previewBiteFiredRef.current) return undefined;
    previewBiteFiredRef.current = true;
    practiceSharkBiteRef.current = true;
    const t = setTimeout(() => {
      setState((s) => (s ? { ...s, sharkBiteFx: true, sharkDiceHidden: true } : s));
    }, 600);
    return () => clearTimeout(t);
  }, [previewSharkBite, state]);

  const replaySharkBitePreview = useCallback(() => {
    practiceSharkBiteRef.current = true;
    setState((s) => (s ? { ...s, sharkBiteFx: true, sharkDiceHidden: true } : s));
  }, []);

  // Practice "Shark vid" — one-shot bite FX only (never a looping bite during charge).
  const onPracticeSharkVideo = useCallback(() => {
    replaySharkBitePreview();
  }, [replaySharkBitePreview]);

  // Keep slot-0 Ghost disguise in sync with profile (set in Shop before play).
  useEffect(() => {
    if (isLoading || !state || equippedSkinId !== GHOST_SKIN_ID) return;
    const disguise = ghostDisguiseId || pickTrueSkinForGhost(ownedSkins);
    setState((s) => {
      const p0 = s?.players?.[0];
      if (!p0 || p0.skinId !== GHOST_SKIN_ID || p0.trueSkinId === disguise) return s;
      return {
        ...s,
        players: s.players.map((p, i) => (i === 0 ? { ...p, trueSkinId: disguise } : p)),
      };
    });
  }, [isLoading, ghostDisguiseId, equippedSkinId, ownedSkins]);

  React.useLayoutEffect(() => {
    const leave = enterGamePlaySession();
    return leave;
  }, []);

  // Full-screen YEEEET! / SKRRRT! on bust (opening roll or re-roll)
  useEffect(() => {
    if (!state?.farkle || !state.lastBustWord) return;
    const n = state.bustCount || 0;
    if (n <= prevBustRef.current) return;
    prevBustRef.current = n;
    setPopup({ word: state.lastBustWord, variant: "bust", burstKey: n });
  }, [state?.farkle, state?.lastBustWord, state?.bustCount]);

  // Shark Bite FX cleared via SharkBiteScreenFX onComplete (video or SVG)
  // (popup fires on chomp from the same component)

  // Auto-pass after farkle — longer window if Plasma Cut can rescue the turn
  useEffect(() => {
    if (!state?.farkle || state.winner || plasmaCutOpen) return;
    const canRescue =
      skinPower?.id === "plasma_cut" &&
      !!state.players[state.currentIndex]?.powerCharge &&
      canUsePlasmaCut(state);
    const delay = canRescue ? 5000 : 1650;
    const timer = setTimeout(() => {
      setState((s) => (s?.farkle ? passAfterFarkle(s) : s));
    }, delay);
    return () => clearTimeout(timer);
  }, [state?.farkle, state?.bustCount, state?.currentIndex, state?.winner, skinPower?.id, plasmaCutOpen, state]);

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

  // Hot dice XP — award once per hot-dice event (tracked in game state)
  const prevHotDiceRef = React.useRef(0);

  // Sync hot-dice tracker when the active player changes
  useEffect(() => {
    if (!state) return;
    prevHotDiceRef.current = state.hotDiceCount || 0;
  }, [state?.currentIndex, state]);
  useEffect(() => {
    if (!state) return;
    const count = state.hotDiceCount || 0;
    if (count > prevHotDiceRef.current && !state.farkle) {
      addXp(XP_REWARDS.hotDice * (count - prevHotDiceRef.current));
    }
    prevHotDiceRef.current = count;
  }, [state?.hotDiceCount, state?.farkle, addXp, state]);

  const onFireSkinPower = () => {
    if (!state || !skinPower || !state.players[state.currentIndex]?.powerCharge) return;
    if (!canAfford(MAX_POWER, skinPower.id)) return;
    const debuffs = state.players[state.currentIndex]?.debuffs || [];
    if (debuffs.some((d) => (typeof d === "string" ? d : d.id) === "lockout")) return;

    if (skinPower.id === "plasma_cut") {
      if (!canUsePlasmaCut(state)) {
        setPopup({ word: "NO DICE TO CUT", variant: "warning" });
        return;
      }
      setPlasmaCutOpen(true);
      return;
    }

    const result = applySkinPower(state, skinPower.id);
    if (result.variant === "warning") {
      if (result.message) {
        setPopup({ word: result.message.toUpperCase(), variant: "warning" });
      }
      return;
    }
    setState(consumeSkinPower(result.state));
    // Power was spent — drop feast / bloody lock so dice return to normal.
    setBloodWaterLocked(false);
    if (result.message) {
      setPopup({ word: result.message.toUpperCase(), variant: result.variant || "success" });
    }
  };

  const onConfirmPlasmaCut = (dieId, newValue) => {
    setPlasmaCutOpen(false);
    if (!state) return;
    const result = applyPlasmaCut(state, dieId, newValue);
    if (result.variant === "warning") {
      if (result.message) {
        setPopup({ word: result.message.toUpperCase(), variant: "warning" });
      }
      return;
    }
    setState(consumeSkinPower(result.state));
    setBloodWaterLocked(false);
    if (result.message) {
      setPopup({ word: result.message.toUpperCase(), variant: result.variant || "success" });
    }
  };

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
  }, []);

  const playRollSound = useCallback(() => {
    if (state?.players?.length >= 2 && opponentSfxMuted) return;
    playDiceSound();
  }, [state, opponentSfxMuted, playDiceSound]);

  const doRoll = useCallback(() => {
    if (!state || state.sharkBiteFx) return;
    setRollAnim(true);
    playRollSound();
    const rolled = rollDice(state);
    setState(rolled);
    setTimeout(() => {
      setRollAnim(false);
      setState(s => evaluateRoll(s));
    }, 900);
  }, [state, playRollSound]);

  const onToggleDie = useCallback((dieId) => {
    setState((s) => toggleHold(s, dieId));
  }, []);

  const onRollAgain = useCallback(() => {
    if (!state || rollAnim) return;
    const info = getHeldInfo(state);
    if (!info.valid || heldSelectionPoints(info, state.perfectTenKPending) === 0) return;
    const { state: next, instantWin } = confirmAndReroll(state);
    if (instantWin) setPopup({ word: "SIX OF A KIND — YOU WIN!", variant: "success" });
    if (next.winner) {
      setState(next);
      return;
    }
    setRollAnim(true);
    playRollSound();
    setState(next);
    setTimeout(() => setRollAnim(false), 900);
  }, [state, rollAnim, playRollSound]);

  useEffect(() => {
    if (shakeTriggered === 0) return;
    if (!state || state.farkle || state.winner || rollAnim) return;
    if (!state.hasRolled) {
      doRoll();
    } else {
      const info = getHeldInfo(state);
      if (info.valid && heldSelectionPoints(info, state.perfectTenKPending) > 0) onRollAgain();
    }
  }, [shakeTriggered, state, doRoll, onRollAgain, rollAnim]);

  const onBank = () => {
    if (!state || rollAnim || state.sharkBiteFx) return;
    setState((s) => {
      if (!s || s.sharkBiteFx || s.farkle || s.winner) return s;
      const info = getHeldInfo(s);
      const points = heldSelectionPoints(info, s.perfectTenKPending);
      const player = s.players[s.currentIndex];
      const needsEntry = !player.onBoard;
      const potentialTotal = (s.turnScore || 0) + (info.valid ? points : 0);
      const allowed =
        s.hasRolled &&
        !s.farkle &&
        info.valid &&
        points > 0 &&
        (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);
      if (!allowed) return s;
      const prevScore = player.score;
      const prevName = player.name;
      const next = bankAndPass(s);
      const after = next.players.find((p) => p.name === prevName);
      const gained = (after?.score ?? prevScore) - prevScore;
      if (gained > 0) addCoins(Math.floor(gained / 1000));
      return next;
    });
  };

  const playAgain = () => {
    const stored = sessionStorage.getItem("dice10k_players");
    if (stored) {
      const names = JSON.parse(stored);
      const skinIds = readSessionPlayerSkinIds();
      const disguiseIds = readSessionPlayerDisguiseIds();
      setState(createInitialState(names, { playerSkins: buildSkins(names.length, skinIds, disguiseIds) }));
    }
  };

  if (!state) return null;

  const info = getHeldInfo(state);
  const currentPlayer = state.players[state.currentIndex];
  const ghostOptions = { ghostDisguiseId, ownedSkins };
  const activeSkinId = getPrisonTraySkinId(
    state,
    state.currentIndex,
    getDisplaySkinId(currentPlayer, ghostOptions)
  );
  const heldPoints = heldSelectionPoints(info, state.perfectTenKPending);
  const potentialTotal = state.turnScore + (info.valid ? heldPoints : 0);
  const needsEntry = !currentPlayer.onBoard;
  const wouldOvershoot = currentPlayer.score + potentialTotal > 10000;
  const canBank = !rollAnim && state.hasRolled && !state.farkle && info.valid && heldPoints > 0 &&
    (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);
  const scoreFill = Math.min(1, (currentPlayer.score + state.turnScore) / 10000);
  const obscuredScores = getObscuredScoreIndices(state);
  const powerLocked = (currentPlayer.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "lockout"
  );
  const powerFrozen = (currentPlayer.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "freeze"
  );
  const plasmaCutRescue =
    skinPower?.id === "plasma_cut" && !!currentPlayer?.powerCharge && state.farkle;
  const powerModeActive =
    !!currentPlayer?.powerCharge &&
    (!state.farkle || plasmaCutRescue) &&
    !state.winner &&
    (skinPower?.id !== "plasma_cut" || state.hasRolled);

  const lowPower = isLowPowerDevice();
  const practiceVariant =
    skinPracticeVariant(equippedSkinId) || (previewSharkBite ? "marlin" : null);
  const previewSkinId = practicePreviewSkinId(practiceVariant);
  const practiceTraySkinId =
    practicePowerPreview && previewSkinId ? previewSkinId : activeSkinId;
  const practiceSkinPower =
    practiceVariant === "marlin"
      ? getPower("shark_bite")
      : practiceVariant === "gq"
        ? getPower("siphon")
        : practiceVariant === "ice"
          ? getPower("freeze_score")
          : null;
  // Dice tray power VFX when charged (or practice preview). Shark Bite stays turn-local.
  const trayPowerMode =
    powerModeActive ||
    (practicePowerPreview && !!practiceVariant);
  const panelPowerMode = powerModeActive || practicePowerPreview;
  const panelSkinPower = practicePowerPreview ? practiceSkinPower : skinPower;
  // Feeding Frenzy — only when fish dice were targeted (separate from Shark Bite charge).
  const fishFeastOnTray = !!state.sharkFishFeast;
  const feastTargetIdx = state.sharkFishFeastTargetIdx;
  const feastTraySkinId =
    fishFeastOnTray && typeof feastTargetIdx === "number" && state.players[feastTargetIdx]
      ? getPrisonTraySkinId(
          state,
          feastTargetIdx,
          getDisplaySkinId(state.players[feastTargetIdx], ghostOptions)
        )
      : null;
  const diceTraySkinId = feastTraySkinId || practiceTraySkinId;
  // Never loop the bite clip during power charge — one-shot only via SharkBiteScreenFX.
  // Charged Shark Bite uses in-die BlueGelSharkBiteCharge + panel, not a repeating fullscreen bite.
  const trayBloodWater =
    bloodWaterLocked && (fishFeastOnTray || !!feastTraySkinId);

  return (
    <div className="min-h-screen text-white flex flex-col pb-6 relative">
      <CyberBackground lite={lowPower} />
      <div className="relative z-10 flex flex-col flex-1">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-3 pb-3 border-b"
        style={{
          ...PAGE_HEADER_SAFE_STYLE,
          borderColor: "rgba(0,255,200,0.25)",
          background: "rgba(3,4,10,0.85)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 1px 0 rgba(255,0,170,0.25), 0 8px 24px rgba(0,255,200,0.08)",
        }}
      >
        <BackButton
          to="/"
          label="Back"
          confirmMessage={state.winner ? undefined : "Leave this game and go home?"}
        />
        <div className="flex items-center gap-1">
          {state.players.length >= 2 && (
            <GameAudioControls
              compact
              sfxMuted={sfxMuted}
              opponentSfxMuted={opponentSfxMuted}
              onToggleSfx={() => setSfxMuted(!sfxMuted)}
              onToggleOpponent={() => setOpponentSfxMuted(!opponentSfxMuted)}
            />
          )}
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
          <Link
            to="/video-assets"
            className="text-slate-400 hover:text-cyan-300 p-1"
            title="Video settings"
            aria-label="Video settings"
          >
            <Film className="w-4 h-4" />
          </Link>
          <RulesSheet />
        </div>
      </div>

      {/* YouNeeK 10000 sign banner — static neon sign (no loop video) */}
      <div className="px-3 pt-3">
        <div
          className="relative w-full h-28 sm:h-36 max-h-[22vh] rounded-2xl overflow-hidden border-2"
          style={{
            borderColor: "#ff00ea",
            boxShadow: "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.6)",
          }}
        >
          <GameplayBillboard source="static" />
        </div>
      </div>

      {/* Score panel */}
      <div className="p-3 space-y-2">
        <ScorePanel
          players={state.players}
          currentIndex={state.currentIndex}
          obscuredIndices={obscuredScores}
          xrayReveals={state.xrayReveals}
        />
      </div>

      {/* Banner */}
      <div className="px-3 mb-2 space-y-2">
        <TurnBanner message={state.message} variant={state.messageVariant} />
        <PrisonDiceStatus state={state} currentIndex={state.currentIndex} />
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

      {/* Turn score */}
      <div className="px-3 mb-3">
        <motion.div
          animate={{ scale: info.valid && heldPoints > 0 ? 1.02 : 1 }}
          className="rounded-2xl border p-3 flex items-center justify-between relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(8,10,20,0.85), rgba(20,5,30,0.85))",
            borderColor: info.valid && heldPoints > 0 ? "rgba(0,255,200,0.6)" : "rgba(255,0,170,0.35)",
            boxShadow:
              info.valid && heldPoints > 0
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
              {info.valid && heldPoints > 0 && (
                <span
                  className="text-xl ml-1"
                  style={{ color: "#7effc4", textShadow: "0 0 10px rgba(0,255,170,0.9)" }}
                >
                  +{heldPoints.toLocaleString()}
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
          {!needsEntry && wouldOvershoot && info.valid && heldPoints > 0 && (
            <div className="text-right text-xs">
              <div className="text-rose-400 font-bold">⚠️ Over 10,000!</div>
              <div className="text-slate-400">Need exactly {(10000 - currentPlayer.score - state.turnScore).toLocaleString()}</div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dice tray */}
      <div className="px-3 flex-[0.85] flex items-center justify-center">
        <div className="w-full rounded-2xl p-2 space-y-2" style={{
            border: "2px solid #ff00ea",
            boxShadow:
              "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)",
            background: "rgba(8,2,20,0.45)",
          }}>
          {practiceVariant && (
            <PowerModePracticeBar
              variant={practiceVariant}
              disabled={!!state.winner || rollAnim}
              powerPreview={practicePowerPreview}
              onPowerPreviewChange={setPracticePowerPreview}
              sharkVideoPreview={!!state.sharkBiteFx}
              onSharkVideoPreviewChange={onPracticeSharkVideo}
              onReplaySharkBite={replaySharkBitePreview}
              sharkBiteActive={!!state.sharkBiteFx}
            />
          )}
          <DiceTray
            dice={state.dice}
            rolling={rollAnim}
            onToggle={onToggleDie}
            disabled={!state.hasRolled || state.farkle || !!state.winner}
            skinId={diceTraySkinId}
            feltId={equippedFeltId}
            scoreFill={scoreFill}
            heldStyleId={heldDiceStyleId}
            lowPower={lowPower}
            powerMode={trayPowerMode}
            fishFeastMode={fishFeastOnTray}
            sharkBiteFx={!!state.sharkBiteFx}
            sharkDiceHidden={!!state.sharkDiceHidden}
            bloodWaterLocked={trayBloodWater}
            onBloodWaterSettled={fishFeastOnTray ? lockBloodWater : undefined}
          />
          {info.held.length > 0 && (
            <div className="mt-2 text-center text-sm">
              {info.valid ? (
                <span className="text-emerald-400 font-semibold">
                  {heldSelectionLabel(info, state.perfectTenKPending)}
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
        {state.winner ? (
          <div
            className="w-full h-14 flex items-center justify-center rounded-xl border-2 text-sm font-bold uppercase tracking-widest text-emerald-200"
            style={{
              borderColor: "#00ffc8",
              background: "linear-gradient(135deg, rgba(0,255,200,0.2), rgba(0,140,110,0.35))",
              boxShadow: "0 0 20px rgba(0,255,200,0.4)",
            }}
          >
            🎯 {state.winner.name} wins!
          </div>
        ) : state.farkle ? (
          <div
            className="w-full min-h-14 py-2 flex flex-col items-center justify-center rounded-xl border-2 text-sm font-bold uppercase tracking-widest text-rose-200 px-3 text-center"
            style={{
              borderColor: plasmaCutRescue && canUsePlasmaCut(state) ? "#a855f7" : "#ff2858",
              background: plasmaCutRescue && canUsePlasmaCut(state)
                ? "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(120,0,50,0.35))"
                : "linear-gradient(135deg, rgba(255,0,90,0.2), rgba(120,0,50,0.35))",
              boxShadow: plasmaCutRescue && canUsePlasmaCut(state)
                ? "0 0 20px rgba(168,85,247,0.45)"
                : "0 0 20px rgba(255,40,90,0.4)",
            }}
          >
            {plasmaCutRescue && canUsePlasmaCut(state) ? (
              <>
                <span>Bust — Plasma Cut can save you!</span>
                <span className="text-[10px] normal-case tracking-normal text-violet-200/90 mt-0.5">
                  Fire ✂️ Plasma Cut above before time runs out
                </span>
              </>
            ) : (
              "Next player&apos;s turn…"
            )}
          </div>
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
              disabled={!info.valid || heldPoints === 0 || rollAnim}
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

      <SharkBiteScreenFX
        active={!!state.sharkBiteFx}
        onComplete={() => {
          // Bite finished — restore normal dice (no lingering power feast / blood lock).
          setBloodWaterLocked(false);
          setState((s) => {
            const cleared = clearSharkBiteFx(s);
            const wasPractice = practiceSharkBiteRef.current || previewSharkBite;
            practiceSharkBiteRef.current = false;
            return wasPractice ? restoreSharkDice(cleared) : cleared;
          });
        }}
      />

      <BigPopup
        open={!!popup}
        word={popup?.word}
        variant={popup?.variant}
        burstKey={popup?.burstKey}
        onClose={() => setPopup(null)}
      />

      <PlasmaCutModal
        open={plasmaCutOpen}
        dice={state.dice}
        onConfirm={onConfirmPlasmaCut}
        onCancel={() => setPlasmaCutOpen(false)}
      />
    </div>
  );
}