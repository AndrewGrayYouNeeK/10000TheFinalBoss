import React from "react";
import { Link, useParams } from "react-router-dom";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import SpriteLab from "@/components/spriteLab/SpriteLab";
import {
  getSpriteLabSkins,
  isSpriteLabSkin,
} from "@/lib/spriteLab";

function SpriteLabIndex() {
  const skins = getSpriteLabSkins();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-950 to-black text-white pb-10">
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <BackButton to="/shop" label="Shop" />
          <div>
            <h1 className="text-lg font-black">Sprite Lab</h1>
            <p className="text-[10px] text-slate-400">Pick a dice skin to tune crop, faces, and video</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {skins.map((skin) => (
            <Link
              key={skin.id}
              to={`/sprite-lab/${skin.id}`}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm font-bold hover:border-cyan-400/50 hover:bg-slate-900 transition-colors"
            >
              {skin.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SpriteLabPage() {
  const { skinId } = useParams();

  if (!skinId) {
    return <SpriteLabIndex />;
  }

  if (!isSpriteLabSkin(skinId)) {
    const options = getSpriteLabSkins();
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div style={PAGE_HEADER_SAFE_STYLE}>
          <BackButton to="/sprite-lab" label="Sprite Lab" />
        </div>
        <div className="max-w-md mx-auto mt-8 text-center space-y-4">
          <p className="text-rose-400 font-bold">Unknown sprite lab skin: {skinId}</p>
          <p className="text-sm text-slate-400">Pick a dice skin to tune:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {options.map((skin) => (
              <Link key={skin.id} to={`/sprite-lab/${skin.id}`} className="text-cyan-400 underline">
                {skin.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <SpriteLab key={skinId} skinId={skinId} />;
}
