import React from "react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import Die from "@/components/game/Die";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import { getFelt } from "@/lib/shopCatalog";
import { useCosmetics } from "@/hooks/useCosmetics";
import { useAudioLevels } from "@/components/game/portfolio/useAudioLevels";
import SoundwaveBarDisplay from "@/components/game/portfolio/SoundwaveBarDisplay";
import SoundwaveMicSettingsForm from "@/components/game/portfolio/SoundwaveMicSettingsForm";

export default function SoundwaveMicSettings() {
  const { equippedSkinId, equippedFeltId } = useCosmetics();
  const felt = getFelt(equippedFeltId);
  const {
    levels,
    live,
    pending,
    error,
    synthetic,
    settings,
    devices,
    inputLevel,
    debug,
    enableMic,
    startDemo,
    updateSettings,
    refreshDevices,
    restartMic,
    resetMicSettings,
  } = useAudioLevels(20, true);

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
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <BackButton to="/labs" label="Labs" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">Soundwave Mic</h1>
            <p className="text-[10px] text-slate-400 truncate">
              EQ bars react to live sound on Soundwave dice
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-3 pt-5 space-y-5">
        <div
          className="rounded-2xl border border-fuchsia-500/30 p-4"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-300 mb-3 text-center">
            Live preview
          </p>
          <div
            className="rounded-xl overflow-hidden mb-4 h-28 flex items-end px-3 pb-3"
            style={{
              background: "linear-gradient(145deg, #020408 0%, #1e1b4b 100%)",
              boxShadow: "inset 0 0 24px rgba(0,0,0,0.5)",
            }}
          >
            <SoundwaveBarDisplay levels={levels} live={live} className="h-full w-full px-1 pb-0" barClassName="flex-1 max-w-[14px]" />
          </div>
          <div className="flex justify-center">
            <FeltTrayFrame felt={felt} innerClassName="flex items-center justify-center py-4 px-4">
              <Die value={5} skinId="pf_soundwave" size={88} dieSeed={42} />
            </FeltTrayFrame>
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-3">
            Tap <span className="text-cyan-300">Enable live mic</span> below, then speak — watch the input meter move.
          </p>
        </div>

        <div
          className="rounded-2xl border border-white/10 p-4"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <SoundwaveMicSettingsForm
            settings={settings}
            devices={devices}
            live={live}
            pending={pending}
            error={error}
            synthetic={synthetic}
            inputLevel={inputLevel}
            debug={debug}
            onChange={updateSettings}
            onRefreshDevices={refreshDevices}
            onRestart={restartMic}
            onStartDemo={startDemo}
            onEnableMic={enableMic}
            onResetDefaults={resetMicSettings}
          />
        </div>
      </div>
    </div>
  );
}
