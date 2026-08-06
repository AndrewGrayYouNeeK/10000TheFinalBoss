import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dices, PiggyBank, Film, Sparkles, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { hasSharkBiteChompVideoSync } from "@/lib/blueGelPowerVideo";
import {
  captureSharkBiteTrayFreeze,
  playerHasSharkBiteMark,
} from "@/lib/sharkBiteTrayFreeze";
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
  isPlayerPowerModeActive,
  playerPowerChargeCount,
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
import { getLocalSkinPowerLevel, XP_REWARDS } from "@/lib/progression";
import { getHotDicePowerConfirmOptions, grantDevPowerCharge, isDevPowerToolsEnabled } from "@/lib/devConfig";
import DevGrantPowerButton from "@/components/game/DevGrantPowerButton";
import { useDiceSound } from "@/lib/useDiceSound";
import GameAudioControls from "@/components/game/GameAudioControls";
import HeldDiceStylePicker from "@/components/game/HeldDiceStylePicker";
import SkinPowerPanel, { MAX_POWER } from "@/components/game/SkinPowerPanel";
import { enterGamePlaySession } from "@/lib/gameAudioSettings";
import {
  buildGamePlayerSkins,
  resolvePlayerPower,
  getSkinLabel,
  getDisplaySkinId,
  GHOST_SKIN_ID,
  ghostDicePrivacyActive,
  getGhostHiddenTraySkinId,
  pickTrueSkinForGhost,
  readSessionPlayerDisguiseIds,
  readSessionPlayerSkinIds,
  SESSION_PLAYER_SKINS_KEY,
  SESSION_PLAYER_DISGUISES_KEY,
} from "@/lib/ghostDisguise";
import { applySkinPower } from "@/lib/powerEffects";
import { canAfford, getPower } from "@/lib/powers";
import { getSkinPower } from "@/lib/skinPowers";
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
import TurnOrderRollOff from "@/components/game/TurnOrderRollOff";
import PassPlayHandoffOverlay from "@/components/game/PassPlayHandoffOverlay";
import PassPlayPrivacySettings from "@/components/game/PassPlayPrivacySettings";
import OnlinePrivacySettings from "@/components/online/OnlinePrivacySettings";
import { isLowPowerDevice } from "@/lib/platform";
import { loadPassPlayPrivacy, savePassPlayPrivacy } from "@/lib/passPlayPrivacy";
import {
  readOnlineMockSession,
  readProfileOnlineVisibility,
  saveProfileOnlineVisibility,
} from "@/lib/onlineVisibility";
import { useOnlineGameView } from "@/hooks/useOnlineGameView";
import { redactDiceForOpponent } from "@/lib/onlineGameState";
import { xrayRevealsVisible } from "@/lib/xrayScan";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  clearLocalGame,
  isFreshUnstartedGame,
  loadLocalGame,
  namesMatch,
  saveLocalGame,
} from "@/lib/localGameSave";

/** Sync boot from localStorage so HMR remounts keep mid-match scores. */
function readBootLocalSnapshot(previewSharkBite) {
  if (typeof window === "undefined" || previewSharkBite) return null;
  try {
    if (readOnlineMockSession()) return null;
    const stored = sessionStorage.getItem("dice10k_players");
    if (!stored) return null;
    const names = JSON.parse(stored);
    if (!Array.isArray(names) || names.length === 0) return null;
    const saved = loadLocalGame();
    if (saved && namesMatch(saved.playerNames, names)) return saved;
  } catch {
    /* ignore */
  }
  return null;
}

export default function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewSharkBite = searchParams.get("previewSharkBite") === "1";
  const bootSave = React.useMemo(
    () => readBootLocalSnapshot(previewSharkBite),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot boot for this mount / HMR remount
    [previewSharkBite]
  );
  const [state, setState] = useState(() => bootSave?.game ?? null);
  const [rollOffSetup, setRollOffSetup] = useState(() =>
    bootSave?.game ? null : bootSave?.rollOffSetup ?? null
  );
  const [rollAnim, setRollAnim] = useState(false);
  const [popup, setPopup] = useState(null); // { word, variant }
  const [plasmaCutOpen, setPlasmaCutOpen] = useState(false);
  const [bloodWaterLocked, setBloodWaterLocked] = useState(
    () => bootSave?.bloodWaterLocked ?? false
  );
  const lockBloodWater = useCallback(() => setBloodWaterLocked(true), []);
  const [practicePowerPreview, setPracticePowerPreview] = useState(false);
  const practiceSharkBiteRef = useRef(false);
  /** Victim tray snapshot while Shark Bite FX plays (bank advances turn before FX ends). */
  const biteTrayFreezeRef = useRef(null);
  const [biteTrayFreeze, setBiteTrayFreeze] = useState(null);

  useEffect(() => {
    if (state?.sharkFishFeast && hasSharkBiteChompVideoSync() && state?.sharkBiteFx) {
      lockBloodWater();
    }
  }, [state?.sharkFishFeast, state?.sharkBiteFx, lockBloodWater]);

  // Promote pre-bank victim tray freeze once sharkBiteFx flips on; clear when FX ends.
  useLayoutEffect(() => {
    if (state?.sharkBiteFx && biteTrayFreezeRef.current) {
      setBiteTrayFreeze(biteTrayFreezeRef.current);
      return;
    }
    if (!state?.sharkBiteFx) {
      biteTrayFreezeRef.current = null;
      setBiteTrayFreeze((prev) => (prev ? null : prev));
    }
  }, [state?.sharkBiteFx]);

  useEffect(() => {
    if (!state?.matrixGlitchFx) return undefined;
    const t = setTimeout(() => {
      setState((s) =>
        s ? { ...s, matrixGlitchFx: false, matrixGlitchDieIds: [] } : s
      );
    }, 800);
    return () => clearTimeout(t);
  }, [state?.matrixGlitchFx]);
  const [shakeTriggered, setShakeTriggered] = useState(0);
  const [privacySettings, setPrivacySettings] = useState(() => loadPassPlayPrivacy());
  const [onlineVisibilitySettings, setOnlineVisibilitySettings] = useState(() =>
    readProfileOnlineVisibility()
  );
  const onlineSession = readOnlineMockSession();
  const onlineMockActive = !!onlineSession;
  /** Turn index the active player has acknowledged via handoff overlay (pass-and-play). */
  const [revealedTurnKey, setRevealedTurnKey] = useState(
    () => bootSave?.revealedTurnKey ?? null
  );
  const { user, equippedSkinId, equippedFeltId, addCoins, addXp, recordGameResult, grantReward, sfxMuted, opponentSfxMuted, setSfxMuted, setOpponentSfxMuted, heldDiceStyleId, setHeldDiceStyle, ownedSkins, ghostDisguiseId, isLoading } = useCosmetics();
  const playDiceSound = useDiceSound();
  const prevBustRef = React.useRef(bootSave?.game?.bustCount || 0);
  const winnerAwardedRef = React.useRef(
    !!(bootSave?.winnerAwarded || bootSave?.game?.winner)
  );
  const previewBiteFiredRef = React.useRef(false);
  const gameInitRef = React.useRef(false);
  const gameSnapshotRef = React.useRef(null);
  /** Sync guard — blocks double tap before rollAnim state commits. */
  const rollLockRef = React.useRef(false);
  const lastProcessedShakeRef = React.useRef(0);

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

  const ghostOptions = React.useMemo(
    () => ({ ghostDisguiseId, ownedSkins }),
    [ghostDisguiseId, ownedSkins]
  );

  const resolvedPower = state
    ? resolvePlayerPower(state, state.currentIndex, ghostOptions)
    : null;
  const skinPower = resolvedPower?.power ?? null;

  const onlineView = useOnlineGameView({
    enabled: onlineMockActive,
    gameState: state,
    viewerPlayerIndex: onlineSession?.viewerPlayerIndex ?? 0,
    visibilitySettings: onlineVisibilitySettings,
  });

  useEffect(() => {
    if (isLoading || gameInitRef.current) return;
    gameInitRef.current = true;
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
    // Slot 0 is this device — always match the shop equipped skin (stale session may still say ice).
    const syncedSkinIds = skinIds ? [...skinIds] : null;
    if (syncedSkinIds?.length) {
      syncedSkinIds[0] = equippedSkinId;
      sessionStorage.setItem(SESSION_PLAYER_SKINS_KEY, JSON.stringify(syncedSkinIds));
    }
    // Slot 0 Ghost disguise follows profile (shop picker), not a stale Setup session.
    const syncedDisguiseIds = disguiseIds ? [...disguiseIds] : null;
    if (syncedDisguiseIds?.length && equippedSkinId === GHOST_SKIN_ID) {
      syncedDisguiseIds[0] = ghostDisguiseId || pickTrueSkinForGhost(ownedSkins);
      sessionStorage.setItem(SESSION_PLAYER_DISGUISES_KEY, JSON.stringify(syncedDisguiseIds));
    }
    const playerSkins = buildSkins(names.length, syncedSkinIds, syncedDisguiseIds ?? disguiseIds);
    const onlineMock = readOnlineMockSession();
    const saved = !previewSharkBite && !onlineMock ? loadLocalGame() : null;
    if (saved && namesMatch(saved.playerNames, names)) {
      prevBustRef.current = saved.game?.bustCount || 0;
      winnerAwardedRef.current = saved.winnerAwarded || !!saved.game?.winner;
      setBloodWaterLocked(saved.bloodWaterLocked);
      setRevealedTurnKey(saved.revealedTurnKey);
      if (saved.game) {
        setRollOffSetup(null);
        setState(saved.game);
      } else if (saved.rollOffSetup) {
        setState(null);
        setRollOffSetup(saved.rollOffSetup);
      }
      previewBiteFiredRef.current = false;
      return;
    }
    // Never wipe a mid-match save just because boot already restored scores into state.
    if (saved?.game && !isFreshUnstartedGame(saved.game)) {
      prevBustRef.current = saved.game.bustCount || 0;
      winnerAwardedRef.current = saved.winnerAwarded || !!saved.game.winner;
      setBloodWaterLocked(saved.bloodWaterLocked);
      setRevealedTurnKey(saved.revealedTurnKey);
      setRollOffSetup(null);
      setState(saved.game);
      previewBiteFiredRef.current = false;
      return;
    }
    if (saved && !namesMatch(saved.playerNames, names) && isFreshUnstartedGame(saved.game)) {
      clearLocalGame();
    }
    if (previewSharkBite || names.length < 2 || onlineMock) {
      setRollOffSetup(null);
      setState(createInitialState(names, { playerSkins }));
    } else {
      setState(null);
      setRollOffSetup({ names, playerSkins });
    }
    prevBustRef.current = 0;
    winnerAwardedRef.current = false;
    previewBiteFiredRef.current = false;
  }, [navigate, buildSkins, isLoading, previewSharkBite, equippedSkinId, ghostDisguiseId, ownedSkins]);

  useLayoutEffect(() => {
    if (previewSharkBite || onlineMockActive) return;
    const stored = sessionStorage.getItem("dice10k_players");
    if (!stored) return;
    let playerNames;
    try {
      playerNames = JSON.parse(stored);
    } catch {
      return;
    }
    if (!Array.isArray(playerNames) || playerNames.length === 0) return;
    gameSnapshotRef.current = {
      playerNames,
      game: state,
      rollOffSetup,
      bloodWaterLocked,
      revealedTurnKey,
      winnerAwarded: winnerAwardedRef.current,
    };
    saveLocalGame(gameSnapshotRef.current);
  }, [
    state,
    rollOffSetup,
    bloodWaterLocked,
    revealedTurnKey,
    previewSharkBite,
    onlineMockActive,
  ]);

  const persistGame = useCallback(() => {
    if (previewSharkBite || onlineMockActive) return;
    if (gameSnapshotRef.current) {
      saveLocalGame(gameSnapshotRef.current);
    }
  }, [previewSharkBite, onlineMockActive]);

  useEffect(() => {
    const flushOnLifecycle = () => persistGame();
    window.addEventListener("orientationchange", flushOnLifecycle);
    window.addEventListener("pagehide", flushOnLifecycle);
    window.addEventListener("visibilitychange", flushOnLifecycle);
    return () => {
      window.removeEventListener("orientationchange", flushOnLifecycle);
      window.removeEventListener("pagehide", flushOnLifecycle);
      window.removeEventListener("visibilitychange", flushOnLifecycle);
    };
  }, [persistGame]);

  // Keep local player (slot 0) aligned when equipped skin changes mid-session.
  useEffect(() => {
    if (isLoading || !state?.players?.length || !equippedSkinId) return;
    setState((s) => {
      if (!s?.players?.length) return s;
      const p0 = s.players[0];
      if (!p0 || p0.skinId === GHOST_SKIN_ID || p0.skinId === equippedSkinId) return s;
      return {
        ...s,
        players: s.players.map((p, i) => (i === 0 ? { ...p, skinId: equippedSkinId } : p)),
      };
    });
  }, [equippedSkinId, isLoading]);

  const beginGame = useCallback((firstPlayerIndex, setup) => {
    if (!setup) return;
    setRevealedTurnKey(null);
    setState(createInitialState(setup.names, {
      playerSkins: setup.playerSkins,
      firstPlayerIndex,
    }));
    setRollOffSetup(null);
  }, []);

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
      if (!p0 || p0.skinId !== GHOST_SKIN_ID) return s;
      if (!disguise || disguise === GHOST_SKIN_ID) {
        if (p0.ghostBare && !p0.trueSkinId) return s;
        return {
          ...s,
          players: s.players.map((p, i) => {
            if (i !== 0) return p;
            const { trueSkinId: _drop, ...rest } = p;
            return { ...rest, ghostBare: true };
          }),
        };
      }
      if (p0.trueSkinId === disguise && !p0.ghostBare) return s;
      return {
        ...s,
        players: s.players.map((p, i) => {
          if (i !== 0) return p;
          const { ghostBare: _bare, ...rest } = p;
          return { ...rest, trueSkinId: disguise };
        }),
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
    const overshootBust = state.message?.includes("Overshoot");
    setPopup({
      word: overshootBust ? "OVERSHOOT!" : state.lastBustWord,
      detail: overshootBust ? state.message : undefined,
      variant: "bust",
      burstKey: n,
    });
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
    const overshootBust = state.message?.includes("Overshoot");
    const delay = canRescue ? 5000 : overshootBust ? 3400 : 1650;
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

      const localIdx = onlineSession?.viewerPlayerIndex ?? 0;
      const playedSkinId =
        state.players?.[localIdx]?.skinId || equippedSkinId || user?.equipped_skin;
      recordGameResult({ won: true, xpGain, skinId: playedSkinId });
    }
  }, [
    state?.winner,
    state?.perfectTenK,
    state?.players,
    state?.bustCount,
    addCoins,
    recordGameResult,
    user,
    equippedSkinId,
    onlineSession?.viewerPlayerIndex,
  ]);

  // Hot dice XP — award once per hot-dice event (tracked in game state)
  const prevHotDiceRef = React.useRef(0);

  // Sync hot-dice tracker when the active player changes (not on every hot-dice tick).
  useEffect(() => {
    if (!state) return;
    prevHotDiceRef.current = state.hotDiceCount || 0;
  }, [state?.currentIndex]);
  useEffect(() => {
    if (!state) return;
    const count = state.hotDiceCount || 0;
    if (count > prevHotDiceRef.current && !state.farkle) {
      addXp(XP_REWARDS.hotDice * (count - prevHotDiceRef.current));
    }
    prevHotDiceRef.current = count;
  }, [state?.hotDiceCount, state?.farkle, addXp, state]);

  const onFireSkinPower = () => {
    // PowerSlot may pass the power object as arg — ignore it; caster is always currentIndex.
    if (!state || !skinPower || !state.players[state.currentIndex]?.powerCharge) return;
    if (!canAfford(MAX_POWER, skinPower.id)) return;
    const debuffs = state.players[state.currentIndex]?.debuffs || [];
    if (debuffs.some((d) => (typeof d === "string" ? d : d.id) === "lockout")) return;

    if (skinPower.id === "plasma_cut") {
      if (!canUsePlasmaCut(state)) {
        toast.warning("No dice to cut");
        return;
      }
      setPlasmaCutOpen(true);
      return;
    }

    const casterIndex = state.currentIndex;
    const result = applySkinPower(state, skinPower.id);
    if (result.variant === "warning") {
      if (result.message) toast.warning(result.message);
      return;
    }
    // Cast never advances the turn — keep the caster's seat even if a power
    // effect wiped the opponent (Feeding Frenzy) or set FX flags.
    const spent = consumeSkinPower(result.state);
    setState({
      ...spent,
      currentIndex: casterIndex,
    });
    // Power was spent — drop bloody lock so dice return to normal after FX.
    // Keep sharkFishFeast flag from the power result for feast VFX; do not
    // swap the tray skin to the opponent (see diceTraySkinId below).
    setBloodWaterLocked(false);
    if (result.message) {
      toast.success(result.message);
    }
  };

  const onDevGrantPower = () => {
    if (!state || state.winner) return;
    setPracticePowerPreview(false);
    setState((s) => (s ? grantDevPowerCharge(s, s.currentIndex) : s));
    toast.success("Power charged");
  };

  const onConfirmPlasmaCut = (dieId, newValue) => {
    setPlasmaCutOpen(false);
    if (!state) return;
    const result = applyPlasmaCut(state, dieId, newValue);
    if (result.variant === "warning") {
      if (result.message) toast.warning(result.message);
      return;
    }
    setState(consumeSkinPower(result.state));
    setBloodWaterLocked(false);
    if (result.message) {
      toast.success(result.message);
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
    if (!state || state.sharkBiteFx || rollAnim || rollLockRef.current) return;
    rollLockRef.current = true;
    setRollAnim(true);
    playRollSound();
    const rolled = rollDice(state);
    setState(rolled);
    setTimeout(() => {
      setRollAnim(false);
      setState(s => evaluateRoll(s));
      rollLockRef.current = false;
    }, 900);
  }, [state, rollAnim, playRollSound]);

  const onToggleDie = useCallback((dieId) => {
    setState((s) => toggleHold(s, dieId));
  }, []);

  const onRollAgain = useCallback(() => {
    if (!state || rollAnim || rollLockRef.current) return;
    const info = getHeldInfo(state);
    if (!info.valid || heldSelectionPoints(info, state.perfectTenKPending) === 0) return;
    const { state: next, instantWin } = confirmAndReroll(state, getHotDicePowerConfirmOptions());
    if (instantWin) setPopup({ word: "SIX OF A KIND — YOU WIN!", variant: "success" });
    if (next.winner) {
      setState(next);
      return;
    }
    rollLockRef.current = true;
    setRollAnim(true);
    playRollSound();
    setState(next);
    setTimeout(() => {
      setRollAnim(false);
      rollLockRef.current = false;
    }, 900);
  }, [state, rollAnim, playRollSound]);

  useEffect(() => {
    rollLockRef.current = false;
  }, [state?.currentIndex]);

  const multiPlayer = (state?.players?.length ?? 0) >= 2;
  const onlineUi = onlineView.ui;
  const currentPlayerForShield = state?.players?.[state?.currentIndex];
  // Ghost + disguise only — bare/story Ghost bosses do not use privacy.
  const currentGhostPrivacy = ghostDicePrivacyActive(currentPlayerForShield);
  // Local pass-and-play: handoff so others look away before Ghost sees dice.
  const passPlayPrivacyActive = privacySettings.enabled && multiPlayer;
  const ghostLocalHandoff = multiPlayer && currentGhostPrivacy && !onlineMockActive;
  const localHandoffActive = passPlayPrivacyActive || ghostLocalHandoff;
  // Same-device pass-and-play uses handoff overlay — not online opponent-view blocking.
  const onlineActive = onlineMockActive && !passPlayPrivacyActive && onlineView.active;
  const shieldUp = onlineActive
    ? onlineUi.opponentTurnShield
    : localHandoffActive && revealedTurnKey !== state?.currentIndex;

  useEffect(() => {
    if (!state) return;
    // Ghost + disguise must claim the device before dice appear — never auto-reveal.
    if (multiPlayer && !onlineMockActive && ghostDicePrivacyActive(state.players[state.currentIndex])) {
      return;
    }
    if (!passPlayPrivacyActive) {
      setRevealedTurnKey(state.currentIndex);
    }
  }, [passPlayPrivacyActive, multiPlayer, onlineMockActive, state?.currentIndex, state]);

  const onPrivacySettingsChange = useCallback(
    (next) => {
      const saved = savePassPlayPrivacy(next, { persistProfile: true });
      setPrivacySettings(saved);
      if (!saved.enabled) setRevealedTurnKey(state?.currentIndex ?? 0);
    },
    [state?.currentIndex]
  );

  const onOnlineVisibilityChange = useCallback((next) => {
    const saved = saveProfileOnlineVisibility(next);
    setOnlineVisibilitySettings(saved);
  }, []);

  const onTurnReady = useCallback(() => {
    setRevealedTurnKey(state?.currentIndex ?? 0);
  }, [state?.currentIndex]);

  useEffect(() => {
    if (shakeTriggered === 0) return;
    if (shakeTriggered === lastProcessedShakeRef.current) return;
    if (!state || state.farkle || state.winner || rollAnim || rollLockRef.current) return;
    lastProcessedShakeRef.current = shakeTriggered;
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
      const potential = (s.turnScore || 0) + (info.valid ? points : 0);
      const allowed =
        s.hasRolled &&
        !s.farkle &&
        info.valid &&
        points > 0 &&
        (!!player.onBoard || potential >= ENTRY_THRESHOLD);
      if (!allowed) return s;
      const prevScore = player.score;
      const prevName = player.name;
      // Freeze victim tray before bankAndPass advances currentIndex / refreshes dice.
      if (playerHasSharkBiteMark(player)) {
        const localIdx = onlineMockActive ? onlineSession?.viewerPlayerIndex ?? 0 : 0;
        const victimSkinId = getPrisonTraySkinId(
          s,
          s.currentIndex,
          getDisplaySkinId(player, ghostOptions)
        );
        biteTrayFreezeRef.current = captureSharkBiteTrayFreeze({
          dice: s.dice,
          playerIndex: s.currentIndex,
          skinId: victimSkinId,
          skinLevel:
            s.currentIndex === localIdx ? getLocalSkinPowerLevel(victimSkinId, user) : 1,
        });
      } else {
        biteTrayFreezeRef.current = null;
      }
      const next = bankAndPass(s);
      if (!next.sharkBiteFx) biteTrayFreezeRef.current = null;
      const after = next.players.find((p) => p.name === prevName);
      const gained = (after?.score ?? prevScore) - prevScore;
      if (gained > 0) addCoins(Math.floor(gained / 1000));
      return next;
    });
  };

  const playAgain = () => {
    clearLocalGame();
    const stored = sessionStorage.getItem("dice10k_players");
    if (stored) {
      const names = JSON.parse(stored);
      const skinIds = readSessionPlayerSkinIds();
      const disguiseIds = readSessionPlayerDisguiseIds();
      const syncedSkinIds = skinIds ? [...skinIds] : null;
      if (syncedSkinIds?.length) syncedSkinIds[0] = equippedSkinId;
      const playerSkins = buildSkins(names.length, syncedSkinIds, disguiseIds);
      winnerAwardedRef.current = false;
      prevBustRef.current = 0;
      if (names.length < 2) {
        setRollOffSetup(null);
        setRevealedTurnKey(0);
        setState(createInitialState(names, { playerSkins }));
      } else {
        setState(null);
        setRevealedTurnKey(null);
        setRollOffSetup({ names, playerSkins });
      }
    }
  };

  if (rollOffSetup) {
    return (
      <TurnOrderRollOff
        playerNames={rollOffSetup.names}
        onComplete={(firstPlayerIndex) => beginGame(firstPlayerIndex, rollOffSetup)}
      />
    );
  }

  if (!state) return null;

  const displayState = onlineActive ? onlineView.renderState : state;
  const effectiveTurnScore = displayState.turnScore ?? 0;
  const info = getHeldInfo(displayState);
  const currentPlayer = displayState.players[displayState.currentIndex];
  const activeSkinId = getPrisonTraySkinId(
    displayState,
    displayState.currentIndex,
    getDisplaySkinId(currentPlayer, ghostOptions)
  );
  const heldPoints = heldSelectionPoints(info, displayState.perfectTenKPending);
  const potentialTotal = effectiveTurnScore + (info.valid ? heldPoints : 0);
  const needsEntry = !currentPlayer.onBoard;
  const wouldOvershoot = currentPlayer.score + potentialTotal > 10000;
  const canBank =
    !rollAnim &&
    displayState.hasRolled &&
    !displayState.farkle &&
    info.valid &&
    heldPoints > 0 &&
    (!needsEntry || potentialTotal >= ENTRY_THRESHOLD);
  const scoreFill = Math.min(1, (currentPlayer.score + effectiveTurnScore) / 10000);
  const obscuredScores = getObscuredScoreIndices(displayState);
  const powerLocked = (currentPlayer.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "lockout"
  );
  const powerFrozen = (currentPlayer.debuffs || []).some(
    (d) => (typeof d === "string" ? d : d.id) === "freeze"
  );
  const plasmaCutRescue =
    skinPower?.id === "plasma_cut" && !!currentPlayer?.powerCharge && state.farkle;
  // Power charge persists on the player until fired — keep panel/tray VFX on while charged.
  const powerModeActive = isPlayerPowerModeActive(displayState, displayState.currentIndex);

  const lowPower = isLowPowerDevice();
  const practiceVariant =
    skinPracticeVariant(activeSkinId) || (previewSharkBite ? "marlin" : null);
  const previewSkinId = practicePreviewSkinId(practiceVariant);
  const practiceTraySkinId =
    practicePowerPreview && previewSkinId ? previewSkinId : activeSkinId;
  const practiceSkinPower =
    practiceVariant === "marlin"
      ? getPower("shark_bite")
      : practiceVariant === "gq"
        ? getSkinPower("crystal_cut")
        : practiceVariant === "ice"
          ? getPower("frosty_ice")
          : null;
  // Dice tray power VFX when charged (or practice preview). Shark Bite stays turn-local.
  const trayPowerMode =
    powerModeActive ||
    (practicePowerPreview && !!practiceVariant);
  // Water / freeze sabo paints ice cubes on the tray (Die skips fire-immune skins).
  const trayIceFrozen = (currentPlayer.debuffs || []).some((d) => {
    const id = typeof d === "string" ? d : d.id;
    return id === "freeze_score" || id === "freeze";
  });
  const panelPowerMode = powerModeActive || practicePowerPreview;
  const panelSkinPower = practicePowerPreview ? practiceSkinPower : skinPower;
  // Feeding Frenzy VFX flag — must NOT swap tray ownership to the opponent.
  // (Previously feastTraySkinId made casting feel like the turn flipped.)
  const fishFeastOnTray = !!state.sharkFishFeast;
  // Ghost privacy is dice-only — never force-hide turn score / power panel / charge badge.
  const hidePowerPanelNow = onlineActive
    ? onlineUi.hidePowerPanel
    : shieldUp && privacySettings.hidePowerPanel;
  const hideTurnScoreNow = onlineActive
    ? onlineUi.hideTurnScore
    : shieldUp && privacySettings.hideTurnScore;
  const showPowerPanel = panelPowerMode && !hidePowerPanelNow;
  const subtlePowerUi = onlineActive
    ? onlineUi.subtlePowerVfx
    : passPlayPrivacyActive &&
      privacySettings.subtlePowerVfx &&
      revealedTurnKey === displayState.currentIndex;
  const hideDiceNow = onlineActive
    ? onlineUi.hideDice
    : shieldUp && (privacySettings.hideDice || currentGhostPrivacy);
  // Ghost tray is always spectral (getDisplaySkinId → player.skinId).
  // Never pass disguise/trueSkinId into the tray — privacy redacts faces only.
  // Shark Bite bank-steal: keep the marked banker's tray frozen through the eat FX.
  // Never use Feeding Frenzy target skin here — that swapped the tray to the opponent on cast.
  const diceTraySkinId =
    biteTrayFreeze?.skinId ||
    (currentGhostPrivacy && hideDiceNow ? getGhostHiddenTraySkinId() : practiceTraySkinId);
  // Only the local player's own tray should show earned frost progression.
  const localPlayerIndex = onlineActive
    ? onlineSession?.viewerPlayerIndex ?? 0
    : 0;
  const trayOwnerIndex = biteTrayFreeze?.playerIndex ?? displayState.currentIndex;
  const diceTraySkinLevel = biteTrayFreeze
    ? biteTrayFreeze.skinLevel
    : trayOwnerIndex === localPlayerIndex
      ? getLocalSkinPowerLevel(diceTraySkinId, user)
      : 1;
  const trayDice =
    biteTrayFreeze?.dice ??
    (hideDiceNow && !onlineActive
      ? redactDiceForOpponent(displayState.dice)
      : displayState.dice);
  const trayPowerVisible =
    trayPowerMode &&
    !(onlineActive
      ? onlineUi.hidePowerPanel
      : shieldUp && privacySettings.hideDice);
  const hideChargeBadge =
    (onlineActive
      ? onlineUi.hidePowerChargeBadge
      : shieldUp && privacySettings.hidePowerChargeBadge)
      ? new Set([displayState.currentIndex])
      : null;
  const scoreXrayReveals = (() => {
    if (onlineActive ? onlineUi.hideXrayReveals : shieldUp && privacySettings.hideXrayReveals) {
      return {};
    }
    return xrayRevealsVisible(displayState.xrayReveals, {
      scannerIndex: displayState.xrayScannerIndex,
      currentIndex: displayState.currentIndex,
      viewerIndex: onlineActive ? (onlineSession?.viewerPlayerIndex ?? 0) : null,
    });
  })();
  const diceInputBlocked = shieldUp || (onlineActive && onlineUi.diceInteractionDisabled);
  // Never loop the bite clip during power charge — one-shot only via SharkBiteScreenFX.
  // Charged Shark Bite uses in-die BlueGelSharkBiteCharge + panel, not a repeating fullscreen bite.
  const trayBloodWater = bloodWaterLocked && fishFeastOnTray;

  return (
    <div className="min-h-screen min-h-[100dvh] min-w-0 text-white flex flex-col relative">
      <CyberBackground lite={lowPower} />
      <div className="relative z-10 flex flex-col flex-1 min-w-0 min-h-0">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-3 pb-3 border-b shrink-0"
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`shrink-0 hover:bg-white/10 ${onlineActive || passPlayPrivacyActive ? "text-cyan-300 hover:text-cyan-200" : "text-slate-400 hover:text-slate-200"}`}
                  aria-label={onlineActive ? "Online privacy" : "Pass-and-play privacy"}
                  title={onlineActive ? "Online privacy" : "Pass-and-play privacy"}
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(20rem,calc(100vw-1.5rem))] border-cyan-500/30 bg-slate-950/95 p-0"
              >
                {onlineActive ? (
                  <OnlinePrivacySettings
                    settings={onlineVisibilitySettings}
                    onChange={onOnlineVisibilityChange}
                  />
                ) : (
                  <PassPlayPrivacySettings
                    settings={privacySettings}
                    onChange={onPrivacySettingsChange}
                  />
                )}
              </PopoverContent>
            </Popover>
          )}
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

      {/* Scrollable playfield — keeps Roll/Bank pinned below on phones */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {/* YouNeeK 10000 sign banner — compact on phones so the tray + Roll stay on screen */}
      <div className="px-3 pt-2 sm:pt-3">
        <div
          className="relative w-full h-14 sm:h-28 md:h-36 max-h-[10vh] sm:max-h-[18vh] md:max-h-[22vh] rounded-2xl overflow-hidden border-2"
          style={{
            borderColor: "#ff00ea",
            boxShadow: "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.6)",
          }}
        >
          <GameplayBillboard source="static" />
        </div>
      </div>

      {/* Score panel */}
      <div className="p-2 sm:p-3 space-y-2">
        <ScorePanel
          players={state.players}
          currentIndex={state.currentIndex}
          obscuredIndices={obscuredScores}
          xrayReveals={scoreXrayReveals}
          showPlayerAvatars
          hidePowerChargeForIndices={hideChargeBadge}
        />
      </div>

      {/* Banner */}
      <div className="px-3 mb-2 space-y-2">
        <TurnBanner message={state.message} variant={state.messageVariant} />
        <PrisonDiceStatus state={state} currentIndex={state.currentIndex} />
        <SkinPowerPanel
          power={MAX_POWER}
          skinPower={panelSkinPower}
          powerMode={showPowerPanel}
          chargeCount={playerPowerChargeCount(currentPlayer)}
          used={false}
          locked={powerLocked}
          disabled={powerFrozen || practicePowerPreview}
          frozen={powerFrozen}
          onFire={practicePowerPreview ? undefined : onFireSkinPower}
          isGhostMimic={resolvedPower?.isMimic}
          mimicSkinLabel={resolvedPower?.isMimic ? getSkinLabel(resolvedPower.mimicSkinId) : null}
          mimicFromName={resolvedPower?.sourcePlayerName}
          subtle={subtlePowerUi}
        />
      </div>

      {/* Turn score */}
      <div className="px-3 mb-2 sm:mb-3">
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
              {hideTurnScoreNow ? (
                <span className="text-slate-500 text-2xl tracking-widest">•••</span>
              ) : (
                <>
                  {effectiveTurnScore.toLocaleString()}
                  {info.valid && heldPoints > 0 && (
                    <span
                      className="text-xl ml-1"
                      style={{ color: "#7effc4", textShadow: "0 0 10px rgba(0,255,170,0.9)" }}
                    >
                      +{heldPoints.toLocaleString()}
                    </span>
                  )}
                </>
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
              <div className="text-slate-400">Need exactly {(10000 - currentPlayer.score - effectiveTurnScore).toLocaleString()}</div>
            </div>
          )}
        </motion.div>
      </div>

      {onlineActive && onlineUi.showOpponentWaitingBanner && (
        <div className="px-3 pt-2">
          <div
            className="rounded-xl border px-3 py-2 text-center text-xs text-slate-300"
            style={{
              borderColor: "rgba(0,255,200,0.35)",
              background: "rgba(0,40,50,0.5)",
            }}
          >
            Opponent&apos;s private turn — you see redacted dice until they bank or pass.
          </div>
        </div>
      )}

      {/* Dice tray */}
      <div className="px-3 pb-3 flex items-center justify-center min-w-0">
        <div className="w-full min-w-0 rounded-2xl p-2 space-y-2" style={{
            border: "2px solid #ff00ea",
            boxShadow:
              "0 0 18px #00ffff, 0 0 36px rgba(255,0,234,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)",
            background: "rgba(8,2,20,0.45)",
          }}>
          {isDevPowerToolsEnabled() && (
            <div className="flex flex-wrap items-center gap-2">
              <DevGrantPowerButton
                onGrant={onDevGrantPower}
                disabled={!!state.winner || rollAnim || !skinPower}
                charged={!!currentPlayer?.powerCharge}
              />
              {!skinPower ? (
                <span className="text-[9px] text-slate-500">
                  Equip a power skin to test
                </span>
              ) : null}
            </div>
          )}
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
            dice={trayDice}
            rolling={rollAnim}
            onToggle={onToggleDie}
            disabled={!displayState.hasRolled || displayState.farkle || !!displayState.winner || diceInputBlocked}
            skinId={diceTraySkinId}
            skinLevel={diceTraySkinLevel}
            feltId={equippedFeltId}
            scoreFill={scoreFill}
            heldStyleId={heldDiceStyleId}
            lowPower={lowPower}
            powerMode={trayPowerVisible}
            powerModeSubtle={subtlePowerUi}
            iceFrozenOverlay={trayIceFrozen}
            fishFeastMode={fishFeastOnTray && !hasSharkBiteChompVideoSync()}
            sharkBiteFx={!!state.sharkBiteFx}
            sharkDiceHidden={!!state.sharkDiceHidden}
            bloodWaterLocked={trayBloodWater}
            onBloodWaterSettled={
              fishFeastOnTray && !hasSharkBiteChompVideoSync() ? lockBloodWater : undefined
            }
            matrixGlitchDieIds={
              state.matrixGlitchFx ? (state.matrixGlitchDieIds ?? []) : []
            }
          />
          {info.held.length > 0 && !hideDiceNow && (
            <div className="mt-2 text-center text-sm">
              {info.valid ? (
                <span className="text-emerald-400 font-semibold">
                  {heldSelectionLabel(info, displayState.perfectTenKPending)}
                </span>
              ) : (
                <span className="text-rose-400 font-semibold">Selection includes non-scoring dice</span>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Actions — always visible at the bottom of the viewport on phones */}
      <div
        className="shrink-0 sticky bottom-0 z-30 p-3 space-y-2 border-t"
        style={{
          borderColor: "rgba(0,255,200,0.25)",
          background: "rgba(3,4,10,0.92)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 -1px 0 rgba(255,0,170,0.25), 0 -8px 24px rgba(0,255,200,0.08)",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
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
              "Next player"
            )}
          </div>
        ) : !state.hasRolled ? (
          <Button
            onClick={doRoll}
            disabled={rollAnim || diceInputBlocked}
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
              disabled={!info.valid || heldPoints === 0 || rollAnim || diceInputBlocked}
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
              disabled={!canBank || diceInputBlocked}
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

      <PassPlayHandoffOverlay
        open={!onlineActive && localHandoffActive && shieldUp}
        playerName={currentPlayer?.name ?? "Player"}
        ghostTurn={currentGhostPrivacy}
        onReady={onTurnReady}
      />

      <GameOverDialog
        open={!!state.winner}
        winner={state.winner}
        onPlayAgain={playAgain}
      />

      <SharkBiteScreenFX
        active={!!state.sharkBiteFx}
        onComplete={() => {
          // Bite finished — always restore tray dice + skins.
          setBloodWaterLocked(false);
          practiceSharkBiteRef.current = false;
          biteTrayFreezeRef.current = null;
          setBiteTrayFreeze(null);
          setState((s) => restoreSharkDice(clearSharkBiteFx(s)));
        }}
      />

      <BigPopup
        open={!!popup}
        word={popup?.word}
        detail={popup?.detail}
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