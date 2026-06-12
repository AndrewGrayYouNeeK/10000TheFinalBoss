import { TARGET_SCORE } from "@/lib/gameLogic";
import { formatXraySummary, scanAllOpponents } from "@/lib/xrayScan";

function opponentIndex(state) {
  if (state.players.length <= 1) return state.currentIndex;
  return (state.currentIndex + 1) % state.players.length;
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
  if (!state || state.winner || state.farkle) {
    return { state, message: "Can't use a power right now.", variant: "warning" };
  }

  const targetIdx = opponentIndex(state);
  const targetName = state.players[targetIdx]?.name || "opponent";

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

    case "siphon": {
      const idx = state.currentIndex;
      const leader = [...state.players].sort((a, b) => b.score - a.score)[0];
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

      const { reveals, scanned, hasAny } = scanAllOpponents(state);

      if (!hasAny) {
        return {
          state,
          message: "🔬 X-Ray — no hidden information detected.",
          variant: "warning",
        };
      }

      return {
        state: {
          ...state,
          xrayReveals: reveals,
          message: `🔬 X-Ray — ${formatXraySummary(scanned)}`,
          messageVariant: "success",
        },
        message: "Hidden info revealed!",
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

    default:
      return { state, message: "Unknown power.", variant: "warning" };
  }
}
