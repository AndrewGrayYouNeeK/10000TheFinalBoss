import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getFelt } from "@/lib/shopCatalog";
import { useCosmetics } from "@/hooks/useCosmetics";
import { HELD_DICE_STYLES, HELD_STYLE_SECTIONS } from "@/lib/heldDiceStyles";

function StyleCard({ style, selected, onSelect, skinId, face, felt }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border p-3 text-left transition-all ${
        selected
          ? "ring-2 ring-amber-400 border-amber-400/50 bg-amber-500/10"
          : "border-white/10 bg-black/30 hover:border-white/25"
      }`}
    >
      <div className="flex items-center justify-center mb-3 mx-auto w-full max-w-[200px]">
        <FeltTrayFrame felt={felt} innerClassName="flex items-center justify-center py-5 px-3 w-full">
          <Die value={face} skinId={skinId} size={80} held heldStyleId={style.id} />
        </FeltTrayFrame>
      </div>
      <p className="text-sm font-bold">{style.label}</p>
      <p className="text-[10px] text-slate-400 mt-1 leading-snug">{style.description}</p>
      {selected && (
        <p className="text-[10px] text-amber-300 font-bold mt-2 uppercase tracking-wide">Selected</p>
      )}
    </button>
  );
}

export default function HeldStylePreview() {
  const { equippedSkinId, equippedFeltId, heldDiceStyleId, setHeldDiceStyle } = useCosmetics();
  const felt = getFelt(equippedFeltId);
  const renderSkinId = equippedSkinId;
  const [face, setFace] = useState(5);
  const [previewStyle, setPreviewStyle] = useState(heldDiceStyleId);

  useEffect(() => {
    setPreviewStyle(heldDiceStyleId);
  }, [heldDiceStyleId]);

  const applyStyle = (id) => {
    setPreviewStyle(id);
    setHeldDiceStyle(id);
    const label = HELD_DICE_STYLES.find((s) => s.id === id)?.label ?? id;
    toast.success(`Held style: ${label}`);
  };

  const size = 96;

  return (
    <div
      className="min-h-screen text-white pb-10"
      style={{
        background: "radial-gradient(ellipse at top, #1e1b4b 0%, #020408 55%), #020408",
      }}
    >
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <BackButton to="/labs" label="Labs" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">Held Dice Style</h1>
            <p className="text-[10px] text-slate-400 truncate">
              Saved forever — applies to all dice skins in every game
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 pt-5">
        <div
          className="rounded-2xl border border-white/10 p-5 mb-6"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <p className="text-xs text-slate-400 text-center mb-4 uppercase tracking-wider font-bold">
            Side-by-side on felt
          </p>
          <div className="flex items-center justify-center mb-4">
            <FeltTrayFrame felt={felt} innerClassName="flex items-center justify-center gap-10 py-6 px-6">
              <div className="text-center relative z-10">
                <p className="text-[10px] text-slate-400 mb-2">Not held</p>
                <Die value={face} skinId={renderSkinId} size={size} heldStyleId={previewStyle} />
              </div>
              <div className="text-center relative z-10">
                <p className="text-[10px] text-amber-300 mb-2 font-bold">Held</p>
                <Die
                  value={face}
                  skinId={renderSkinId}
                  size={size}
                  held
                  heldStyleId={previewStyle}
                />
              </div>
            </FeltTrayFrame>
          </div>

          <div className="flex justify-center gap-1.5 mt-4">
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
          <p className="text-center text-[10px] text-slate-500 mt-3">
            Using your equipped skin: {equippedSkinId.replace(/_/g, " ")}
          </p>
        </div>

        <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-1">
          Held dice portfolio
        </h2>
        <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">
          Tap any style to try it live above. Favorites are ready to use; portfolio concepts are ideas
          to pick from or mix together.
        </p>

        {HELD_STYLE_SECTIONS.map((section) => {
          const styles = HELD_DICE_STYLES.filter((s) => s.category === section.category);
          if (styles.length === 0) return null;
          const isLegacy = section.id === "legacy";
          return (
            <div key={section.id} className={isLegacy ? "mt-8 opacity-70" : "mb-8"}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">
                {section.title}
              </h3>
              <p className="text-[10px] text-slate-500 mb-3">{section.subtitle}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {styles.map((style) => (
                  <StyleCard
                    key={style.id}
                    style={style}
                    selected={previewStyle === style.id}
                    onSelect={() => applyStyle(style.id)}
                    skinId={renderSkinId}
                    face={face}
                    felt={felt}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-2 flex flex-col items-center gap-2">
          <Button
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
            onClick={() => applyStyle(previewStyle)}
          >
            Save & use in game
          </Button>
          <p className="text-[10px] text-slate-500 text-center max-w-xs">
            Your choice is stored on this device and used whenever you hold dice — classic, custom, or mystery box skins.
          </p>
        </div>
      </div>
    </div>
  );
}
