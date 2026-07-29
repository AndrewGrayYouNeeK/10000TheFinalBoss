import React from "react";
import { Link } from "react-router-dom";
import VideoUploadCard from "@/components/video/VideoUploadCard";
import {
  MATRIX_GAMEPLAY_BILLBOARD_KEY,
  getGameplayBillboardDescription,
  getGameplayBillboardFallback,
  getGameplayBillboardLabel,
  migrateLegacyGameplayBillboard,
} from "@/lib/diceBillboardVideo";

/** Local-match 10,000 sign — Matrix Sprite Lab only. */
export default function MatrixGameplayVideoUploads({ lockRemovesOnly = false }) {
  React.useEffect(() => {
    migrateLegacyGameplayBillboard().catch(() => {});
  }, []);

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Gameplay — 10,000 sign</p>
      <p className="text-[10px] text-slate-400">
        <b>Local Play Now only</b> — looping video inside the neon 10,000 sign. Does{" "}
        <b>not</b> play in Story mode (use Neo → Avatar loop on{" "}
        <Link to="/video-assets" className="text-cyan-400 underline">
          Video Assets
        </Link>
        ).
      </p>
      <VideoUploadCard
        lockRemovesOnly={lockRemovesOnly}
        videoKey={MATRIX_GAMEPLAY_BILLBOARD_KEY}
        label={getGameplayBillboardLabel()}
        description={getGameplayBillboardDescription()}
        fallbackPath={getGameplayBillboardFallback()}
      />
    </div>
  );
}
