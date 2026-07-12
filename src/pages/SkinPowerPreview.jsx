import React, { useLayoutEffect, useState } from "react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getFelt, getSkin } from "@/lib/shopCatalog";
import { useCosmetics } from "@/hooks/useCosmetics";
import { enterShopPreviewSession } from "@/lib/gameAudioSettings";

const POWER_SKINS = ["lava", "matrix"];

export default function SkinPowerPreview() {
  const { equippedFeltId } = useCosmetics();
  const felt = getFelt(equippedFeltId);
  const [skinId, setSkinId] = useState("lava");
  const [powerMode, setPowerMode] = useState(false);
  const [face, setFace] = useState(5);
  const skin = getSkin(skinId);

  useLayoutEffect(() => {
    const leave = enterShopPreviewSession();
    return leave;
  }, []);

  return (
    <div
      className="min-h-screen text-white pb-10"
      style={{
        background: "radial-gradient(ellipse at top, #2a0a04 0%, #020408 55%), #020408",
      }}
    >
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-md mx-auto flex items-center gap-2">
          <BackButton to="/shop" label="Shop" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">Power Skin Preview</h1>
            <p className="text-[10px] text-slate-400">Toggle power mode to see sprite swap</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {POWER_SKINS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSkinId(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                skinId === id
                  ? "bg-orange-500/25 border-orange-400 text-orange-100"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              {getSkin(id).name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPowerMode((p) => !p)}
          className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
            powerMode
              ? "border-orange-400 bg-orange-500/15 shadow-[0_0_24px_rgba(255,120,0,0.35)]"
              : "border-white/15 bg-black/30"
          }`}
        >
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Power mode</div>
          <div className="text-lg font-black">{powerMode ? "⚡ CHARGED" : "Off — normal sprite"}</div>
          <div className="text-[11px] text-slate-400 mt-1">Tap to toggle (same as 3rd hot die in a turn)</div>
        </button>

        <div className="flex justify-center">
          <FeltTrayFrame felt={felt} innerClassName="flex items-center justify-center py-8 px-10">
            <Die value={face} skinId={skinId} size={112} powerMode={powerMode} dieSeed={42} />
          </FeltTrayFrame>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFace(v)}
              className={`w-9 h-9 rounded-lg text-xs font-bold border ${
                face === v
                  ? "bg-amber-500/25 border-amber-400 text-amber-100"
                  : "bg-white/5 border-white/10 text-slate-500"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((v) => (
            <FeltTrayFrame key={v} felt={felt} compact innerClassName="flex items-center justify-center py-3">
              <Die value={v} skinId={skinId} size={64} powerMode={powerMode} dieSeed={v} />
            </FeltTrayFrame>
          ))}
        </div>

        {skinId === "lava" && (
          <p className="text-center text-xs text-slate-500 leading-relaxed">
            Normal Ragnarok uses <code className="text-orange-300">public/assets/lava/ragnarok_sprite.png</code>.
            Power mode uses the cracked magma sheet. Add your red-pip sprite file to preview the base look.
          </p>
        )}
      </div>
    </div>
  );
}
