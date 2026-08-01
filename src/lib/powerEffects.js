import { TARGET_SCORE } from "@/lib/gameLogic";
import { formatXraySummary, scanAllOpponents } from "@/lib/xrayScan";
import { isFishDicePlayer } from "@/lib/fishDice";
import { loadProfile } from "@/lib/localProfile";
import { getLocalSkinPowerLevel } from "@/lib/progression";
import { glitchDiceCountForLevel } from "@/lib/matrixGlitch";

function opponentIndex(state) {
  const n = state.players?.length ?? 0;
  if (n <= 1) return -1;
  // Always the next seat — never the caster.
  return (state.currentIndex + 1) % n;
}

function addDebuff(players, targetIdx, debuff, fromIdx) {
  const entry =
    typeof debuff === "string"
      ? { id: debuff, from: fromIdx }
      : { ...debuff, from: debuff.from ?? fromIdx };
  return players.map((p, i) => {
    if (i !== targetIdx) return p;
    const debuffs = [...(p.debuffs || [])];
    const exists = debuffs.some((d) => (typeof d === "string" ? d : d.id) === entry.id);
    if (!exists) debuffs.push(entry);
    return { ...p, debuffs };
  });
}

/** Apply a skin secret power to the current game state. */
export function applySkinPower(state, powerId) {
  if (!state || state.winner) {
    return { state, message: "Can't use a power right now.", variant: "warning" };
  }
  if (state.farkle && powerId !== "plasma_cut") {
    return { state, message: "Can't use a power right now.", variant: "warning" };
  }

  const targetIdx = opponentIndex(state);
  const targetName = state.players[targetIdx]?.name || "opponent";
  if (targetIdx < 0 || targetIdx === state.currentIndex) {
    // Sabo powers need a real opponent; self powers still work below.
    if (
      powerId === "shark_bite" ||
      powerId === "freeze" ||
      powerId === "freeze_score" ||
      powerId === "lockout" ||
      powerId === "blackout" ||
      powerId === "static" ||
      powerId === "prison_dice" ||
      powerId === "xray"
    ) {
      return { state, message: "Need an opponent for that power.", variant: "warning" };
    }
  }

  switch (powerId) {
    case "reroll": {
      const active = state.dice.filter((d) => !d.used);
      if (!active.length) {
        return { state, message: "No active dice to reroll.", variant: "warning" };
      }
      const target = active.find((d) => !d.held) || active[0];
      const newValue = Math.floor(Math.random() * 6) + 1;
      return {
        state: {
          ...state,
          dice: state.dice.map((d) =>
            d.id === target.id ? { ...d, value: newValue, held: false } : d
          ),
          farkle: false,
          message: `🔄 Secret Power — rerolled a die to ${newValue}.`,
          messageVariant: "success",
        },
        message: "Reroll fired!",
        variant: "success",
      };
    }

    case "shield":
      return {
        state: {
          ...state,
          powerShield: true,
          message: "🛡️ Shield active — next farkle won't bust your turn.",
          messageVariant: "success",
        },
        message: "Shield up!",
        variant: "success",
      };

    case "double_or_nothing":
      return {
        state: {
          ...state,
          doubleOrNothing: true,
          message: "✨ Double or Nothing — next farkle costs double!",
          messageVariant: "warning",
        },
        message: "Double or Nothing armed!",
        variant: "success",
      };

    case "lucky_seven":
      return {
        state: {
          ...state,
          luckyRollNext: true,
          message: "🍀 Lucky roll charged — next roll will score.",
          messageVariant: "success",
        },
        message: "Lucky roll ready!",
        variant: "success",
      };

    case "matrix_glitch": {
      const profile = loadProfile();
      const skinId = profile.equipped_skin || "matrix";
      const level = getLocalSkinPowerLevel(skinId, profile);
      const diceCount = glitchDiceCountForLevel(level);
      return {
        state: {
          ...state,
          matrixGlitchArmed: { diceCount },
          message: `⚡ Matrix Glitch armed — next bust rewrites up to ${diceCount} die${diceCount === 1 ? "" : "s"}! (Lv ${level})`,
          messageVariant: "success",
        },
        message: "Matrix Glitch armed!",
        variant: "success",
      };
    }

    case "hot_streak":
      return {
        state: {
          ...state,
          turnScoreMultiplier: 1.5,
          message: "🔥 Hot Streak — ×1.5 turn score for the rest of this turn!",
          messageVariant: "success",
        },
        message: "Hot Streak active!",
        variant: "success",
      };

    case "plasma_cut":
      return {
        state,
        message: "Pick a die to cut.",
        variant: "success",
        needsPlasmaCutPicker: true,
      };

    case "siphon": {
      const idx = state.currentIndex;
      const leader = [...state.players].sort((a, b) => b.score - a.score)[0];
      const leaderFrozen = (leader?.debuffs || []).some(
        (d) => (typeof d === "string" ? d : d.id) === "freeze_score"
      );
      if (leaderFrozen) {
        return {
          state,
          message: `${leader.name}'s score is frozen — can't siphon.`,
          variant: "warning",
        };
      }
      const steal = Math.min(500, Math.max(0, Math.floor(leader.score * 0.1)));
      if (steal <= 0) {
        return { state, message: "Nobody to siphon from yet.", variant: "warning" };
      }
      const players = state.players.map((p, i) => {
        if (p.name === leader.name && leader.score > 0) {
          return { ...p, score: Math.max(0, p.score - steal) };
        }
        if (i === idx) {
          return { ...p, score: Math.min(TARGET_SCORE, p.score + steal) };
        }
        return p;
      });
      return {
        state: {
          ...state,
          players,
          message: `🩸 Siphoned ${steal.toLocaleString()} from ${leader.name}!`,
          messageVariant: "success",
        },
        message: `Stole ${steal} points!`,
        variant: "success",
      };
    }

    case "freeze": {
      const players = addDebuff(state.players, targetIdx, "freeze", state.currentIndex);
      return {
        state: {
          ...state,
          players,
          message: `❄️ ${targetName}'s power frozen for the rest of their turn!`,
          messageVariant: "success",
        },
        message: "Freeze cast!",
        variant: "success",
      };
    }

    case "freeze_score": {
      const lockedScore = state.players[targetIdx]?.score ?? 0;
      const players = addDebuff(
        state.players,
        targetIdx,
        { id: "freeze_score", lockedScore },
        state.currentIndex
      );
      return {
        state: {
          ...state,
          players,
          message: `🧊 ${targetName}'s banked score locked at ${lockedScore.toLocaleString()} for the rest of their turn!`,
          messageVariant: "success",
        },
        message: "Score Freeze cast!",
        variant: "success",
      };
    }

    case "lockout": {
      const players = addDebuff(state.players, targetIdx, "lockout", state.currentIndex);
      return {
        state: {
          ...state,
          players,
          message: `🔒 ${targetName} locked out of powers for the rest of their turn!`,
          messageVariant: "success",
        },
        message: "Lockout cast!",
        variant: "success",
      };
    }

    case "blackout": {
      const players = addDebuff(state.players, targetIdx, "blackout", state.currentIndex);
      return {
        state: {
          ...state,
          players,
          message: `🌑 Your score is hidden from ${targetName} for the rest of their turn!`,
          messageVariant: "success",
        },
        message: "Blackout cast!",
        variant: "success",
      };
    }

    case "static": {
      const players = addDebuff(state.players, targetIdx, "static", state.currentIndex);
      return {
        state: {
          ...state,
          players,
          message: `📡 ${targetName} can't see their own score for the rest of their turn!`,
          messageVariant: "success",
        },
        message: "Static cast!",
        variant: "success",
      };
    }

    case "xray": {
      if (state.players.length <= 1) {
        return { state, message: "Need an opponent to scan.", variant: "warning" };
      }

      const { reveals, scanned } = scanAllOpponents(state);

      return {
        state: {
          ...state,
          xrayReveals: reveals,
          xrayScannerIndex: state.currentIndex,
          message: `🔬 X-Ray — ${formatXraySummary(scanned)}`,
          messageVariant: "success",
        },
        message: "Scan complete!",
        variant: "success",
      };
    }

    case "overtime": {
      if (state.players.length <= 1) {
        return { state, message: "Need an opponent for Overtime.", variant: "warning" };
      }
      const players = state.players.map((p) => ({
        ...p,
        score: 0,
        onBoard: false,
        debuffs: [],
      }));
      return {
        state: {
          ...state,
          players,
          turnScore: 0,
          message: "⏱️ Overtime — everyone's banked score wiped! Get 1,000 to get back on the board.",
          messageVariant: "success",
        },
        message: "Overtime!",
        variant: "success",
      };
    }

    case "prison_dice": {
      if (state.players.length <= 1) {
        return { state, message: "Need an opponent for Prison Dice.", variant: "warning" };
      }
      if (state.prisonDice) {
        return { state, message: "Prison lock already active.", variant: "warning" };
      }
      return {
        state: {
          ...state,
          prisonDice: {
            casterIdx: state.currentIndex,
            targetIdx,
            sixCount: 0,
          },
          message: `⛓️ ${targetName}'s dice locked in prison! Roll 3 sixes to release them.`,
          messageVariant: "success",
        },
        message: "Prison Dice cast!",
        variant: "success",
      };
    }

    case "shark_bite": {
      if (targetIdx < 0 || targetIdx === state.currentIndex) {
        return { state, message: "Need an opponent for Shark Bite.", variant: "warning" };
      }
      const already = (state.players[targetIdx]?.debuffs || []).some(
        (d) => (typeof d === "string" ? d : d.id) === "shark_bite"
      );
      if (already) {
        return { state, message: `${targetName} is already marked for a shark bite.`, variant: "warning" };
      }

      // Feeding Frenzy — only when the TARGET has fish/aquarium dice (not the caster).
      // Blue Gel's own Shark Bite power mode is separate (charge → mark → bank steal).
      if (isFishDicePlayer(state, targetIdx) && targetIdx !== state.currentIndex) {
        const wipedScore = state.players[targetIdx]?.score ?? 0;
        const players = state.players.map((p, i) =>
          i === targetIdx
            ? { ...p, score: 0, onBoard: false, debuffs: [] }
            : p
        );
        return {
          state: {
            ...state,
            players,
            sharkBiteFx: true,
            sharkDiceHidden: true,
            sharkFishFeast: true,
            sharkFishFeastTargetIdx: targetIdx,
            message:
              wipedScore > 0
                ? `🦈 Feeding Frenzy! Sharks devoured ${targetName}'s fish — score back to 0 (−${wipedScore.toLocaleString()}).`
                : `🦈 Feeding Frenzy! Sharks devoured ${targetName}'s fish! The tank runs red.`,
            messageVariant: "success",
          },
          message: "Feeding Frenzy!",
          variant: "success",
        };
      }

      // Shark Bite mark — opponent loses their next banked round (not Feeding Frenzy).
      const players = addDebuff(state.players, targetIdx, "shark_bite", state.currentIndex);
      return {
        state: {
          ...state,
          players,
          message: `🦈 Shark Bite — hunting ${targetName}. Their next bank will be eaten!`,
          messageVariant: "success",
        },
        message: "Shark Bite cast!",
        variant: "success",
      };
    }

    default:
      return { state, message: "Unknown power.", variant: "warning" };
  }
}
