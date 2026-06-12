import React, { useMemo, useState, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getFelt } from "@/lib/shopCatalog";
import {
  EXPERIMENTAL_CATEGORIES,
  getExperimentalDice,
} from "@/lib/experimentalDice";
import { useCosmetics } from "@/hooks/useCosmetics";
import { enterShopPreviewSession } from "@/lib/gameAudioSettings";
import { toast } from "sonner";

export default function PreviewDice() {
  const { equipItem, equippedSkinId, equippedFeltId } = useCosmetics();
  const felt = getFelt(equippedFeltId);
  const [category, setCategory] = useState("all");
  const [face, setFace] = useState(5);
  const [expandedId, setExpandedId] = useState(null);
  const [demoScore, setDemoScore] = useState(0.72);

  const skins = useMemo(() => getExperimentalDice(category), [category]);

  useLayoutEffect(() => {
    const leave = enterShopPreviewSession();
    return leave;
  }, []);

  return (
    <div
      className="min-h-screen text-white pb-10"
      style={{
        background: "radial-gradient(ellipse at top, #1e1b4b 0%, #020408 55%), #020408",
      }}
    >
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{
          background: "rgba(2,4,8,0.92)",
          ...PAGE_HEADER_SAFE_STYLE,
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <BackButton to="/shop" label="Shop" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">Custom Dice Lab</h1>
            <p className="text-[10px] text-slate-400 truncate">
              4 spectral clears + bespoke custom effects
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-3 py-2">
          <label className="text-[10px] text-cyan-300 font-bold block mb-1">
            Score Meter demo fill ({Math.round(demoScore * 10000).toLocaleString()} / 10,000)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(demoScore * 100)}
            onChange={(e) => setDemoScore(Number(e.target.value) / 100)}
            className="w-full accent-cyan-400"
          />
        </div>

        <div className="max-w-4xl mx-auto flex flex-wrap gap-1.5 mt-3">
          {EXPERIMENTAL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                category === c.id
                  ? "bg-cyan-500/25 border-cyan-400 text-cyan-100"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto flex justify-center gap-1.5 mt-2">
          {[1, 2, 3, 4, 5, 6].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFace(v)}
              className={`w-8 h-8 rounded-lg text-xs font-bold border ${
                face === v
                  ? "bg-amber-500/25 border-amber-400 text-amber-100"
                  : "bg-white/5 border-white/10 text-slate-500"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {skins.map((skin) => {
          const equipped = equippedSkinId === skin.id;
          const expanded = expandedId === skin.id;
          return (
            <div
              key={skin.id}
              className={`rounded-xl border p-3 transition-all ${
                equipped
                  ? "ring-2 ring-amber-400/60 border-amber-400/40 bg-amber-500/10"
                  : "border-white/10 bg-black/30 hover:border-white/25"
              }`}
            >
              <div
                className="flex items-center justify-center mb-2 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : skin.id)}
              >
                <FeltTrayFrame
                  felt={felt}
                  compact={!expanded}
                  innerClassName="flex items-center justify-center py-4 px-3"
                >
                  <Die
                    value={face}
                    skinId={skin.id}
                    size={expanded ? 96 : 72}
                    scoreFill={demoScore}
                    dieSeed={[...skin.id].reduce((a, c) => a + c.charCodeAt(0), 0)}
                  />
                </FeltTrayFrame>
              </div>
              <p className="text-xs font-bold leading-tight truncate">{skin.name}</p>
              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 min-h-[2.5em]">{skin.description}</p>
              <Button
                size="sm"
                variant={equipped ? "secondary" : "outline"}
                className="w-full mt-2 h-7 text-[10px]"
                onClick={() => {
                  equipItem("skin", skin.id);
                  toast.success(`Equipped ${skin.name}`);
                }}
              >
                {equipped ? "Equipped" : "Equip"}
              </Button>
              {expanded && (
                <div className="flex justify-center gap-1 mt-2 pt-2 border-t border-white/10">
                  {[1, 2, 3, 4, 5, 6].map((v) => (
                    <Die key={v} value={v} skinId={skin.id} size={28} scoreFill={demoScore} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500 mt-6 px-4">
        {skins.length} dice — Soundwave mic presets & sensitivity: Shop → Soundwave Mic settings.
      </p>
    </div>
  );
}
