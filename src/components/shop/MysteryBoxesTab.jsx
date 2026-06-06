import React, { useState } from "react";
import { Coins, Skull, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MYSTERY_BOXES } from "@/lib/mysteryBoxes";
import MysteryBoxCard from "@/components/shop/MysteryBoxCard";
import MysteryBoxReveal from "@/components/shop/MysteryBoxReveal";
import { useMysteryBox } from "@/hooks/useMysteryBox";

export default function MysteryBoxesTab({ user, coins }) {
  const { openBox, opening } = useMysteryBox();
  const [activeBox, setActiveBox] = useState(null);
  const [reward, setReward] = useState(null);

  const handleBuy = async (box) => {
    if (opening) return;
    if (coins < box.price) {
      toast.error("Not enough coins for this box.");
      return;
    }
    setActiveBox(box);
    setReward(null);
    const res = await openBox(box, user);
    if (res?.error === "insufficient") {
      toast.error("Not enough coins.");
      setActiveBox(null);
      return;
    }
    setReward(res);
  };

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 border"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,10,30,0.95) 0%, rgba(6,4,12,0.95) 100%)",
          borderColor: "rgba(168,85,247,0.4)",
          boxShadow:
            "0 0 30px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border"
            style={{
              background: "linear-gradient(145deg, #4c1d95, #06060c)",
              borderColor: "rgba(168,85,247,0.6)",
              boxShadow: "0 0 18px rgba(168,85,247,0.5)",
            }}
          >
            <Skull className="w-6 h-6 text-fuchsia-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black tracking-wider text-white" style={{ textShadow: "0 0 10px rgba(168,85,247,0.6)" }}>
              MYSTERY VAULT
            </h2>
            <p className="text-xs text-slate-300/80">
              Spend credits. Open a box. Pray to the dice gods.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 rounded-full px-3 py-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-black text-sm tabular-nums text-amber-300">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Box grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MYSTERY_BOXES.map((box) => (
          <MysteryBoxCard
            key={box.id}
            box={box}
            canAfford={coins >= box.price}
            onBuy={() => handleBuy(box)}
            opening={opening && activeBox?.id === box.id}
          />
        ))}
      </div>

      {/* Fine print */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-fuchsia-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Boxes contain a weighted mix of <span className="text-white font-semibold">coins</span>,{" "}
          <span className="text-white font-semibold">dice skins</span>, and{" "}
          <span className="text-white font-semibold">table felts</span>. Duplicates are auto-converted to bonus coins.
        </p>
      </div>

      <MysteryBoxReveal
        open={!!activeBox}
        box={activeBox}
        reward={reward}
        onClose={() => {
          setActiveBox(null);
          setReward(null);
        }}
      />
    </div>
  );
}