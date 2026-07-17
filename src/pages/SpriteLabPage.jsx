import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import SpriteLab from "@/components/spriteLab/SpriteLab";
import {
  DEFAULT_SPRITE_LAB_SKIN_ID,
  getSpriteLabSkins,
  isSpriteLabSkin,
} from "@/lib/spriteLab";

export default function SpriteLabPage() {
  const { skinId } = useParams();

  if (!skinId) {
    return <Navigate to={`/sprite-lab/${DEFAULT_SPRITE_LAB_SKIN_ID}`} replace />;
  }

  if (!isSpriteLabSkin(skinId)) {
    const options = getSpriteLabSkins();
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div style={PAGE_HEADER_SAFE_STYLE}>
          <BackButton to="/shop" label="Shop" />
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

  return <SpriteLab skinId={skinId} />;
}
