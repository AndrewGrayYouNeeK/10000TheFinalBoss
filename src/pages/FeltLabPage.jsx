import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";
import Die from "@/components/game/Die";
import { FELT_COLORS } from "@/lib/shopCatalog";
import {
  buildLabPreviewFelt,
  getCatalogFeltTuningDefaults,
  loadFeltTuning,
  persistFeltTuning,
  resetFeltTuning,
} from "@/lib/feltLab";

const FELT_LAB_FELTS = FELT_COLORS.filter((f) => f.textureUrl);

function getFeltLabFelts() {
  return FELT_LAB_FELTS;
}

function isFeltLabFelt(feltId) {
  return FELT_LAB_FELTS.some((f) => f.id === feltId);
}

const PREVIEW_DICE = [
  { id: 1, value: 5, held: false, used: false },
  { id: 2, value: 3, held: true, used: false },
  { id: 3, value: 1, held: false, used: false },
];

function SliderRow({ label, hint, value, min, max, step, onChange, format = (v) => v.toFixed(2) }) {
  return (
    <label className="block space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold text-emerald-100">{label}</span>
        <span className="text-[10px] font-mono text-slate-400">{format(value)}</span>
      </div>
      {hint ? <p className="text-[10px] text-slate-500">{hint}</p> : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-400"
      />
    </label>
  );
}

function FeltLabEditor({ feltId }) {
  const catalog = FELT_COLORS.find((f) => f.id === feltId);
  const defaults = useMemo(() => getCatalogFeltTuningDefaults(catalog), [catalog]);
  const [draft, setDraft] = useState(() => loadFeltTuning(feltId, catalog) ?? defaults);
  const [savedFlash, setSavedFlash] = useState(false);
  const previewFelt = useMemo(() => buildLabPreviewFelt(catalog, draft), [catalog, draft]);

  useEffect(() => {
    setDraft(loadFeltTuning(feltId, catalog) ?? getCatalogFeltTuningDefaults(catalog));
  }, [feltId, catalog]);

  const patch = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    persistFeltTuning(feltId, draft, catalog);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }, [feltId, draft, catalog]);

  const handleReset = useCallback(() => {
    resetFeltTuning(feltId);
    setDraft({ ...defaults });
  }, [feltId, defaults]);

  if (!catalog) return null;

  return (
    <div className="space-y-4">
      {/* Sticky live tray — same pattern as Sprite Lab (below page header). */}
      <div className="sticky z-20 self-start w-full top-[4.75rem] sm:top-20">
        <section className="rounded-xl border border-emerald-500/35 bg-emerald-950/95 backdrop-blur-md p-3 sm:p-4 space-y-3 shadow-lg shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-black text-emerald-200 truncate">{catalog.name}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Live tray · stays visible while you tune
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="text-xs font-black uppercase tracking-wider rounded-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {savedFlash ? "Saved ✓" : "Save felt"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold uppercase tracking-wider rounded-full px-3 py-2 border border-white/20 text-slate-300 hover:bg-white/5"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-800/40 bg-slate-950/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Game tray
            </p>
            <FeltTrayFrame felt={previewFelt} className="w-full">
              <div className="relative z-[2] flex flex-wrap justify-center gap-2 p-4">
                {PREVIEW_DICE.map((d) => (
                  <Die
                    key={d.id}
                    value={d.value}
                    held={d.held}
                    skinId="classic_white"
                    size={52}
                  />
                ))}
              </div>
            </FeltTrayFrame>
          </div>
        </section>
      </div>

      <section className="rounded-xl overflow-hidden border border-emerald-800/40 bg-slate-950/80 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Shop card (compact)
        </p>
        <div className="w-full max-w-[11.5rem] h-[5.75rem] mx-auto">
          <FeltTrayFrame
            felt={previewFelt}
            compact
            className="w-full h-full"
            innerClassName="h-full"
          />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-4">
        <h2 className="text-sm font-black text-white">Texture fit</h2>
        <p className="text-[11px] text-slate-400 -mt-2">
          Fix stretched or cropped photo textures. Scale 1.0 ≈ cover; lower zooms out, higher zooms in.
        </p>
        <SliderRow
          label="Texture scale"
          hint="Primary fix for stretch — try 0.85–1.15"
          value={draft.textureScale}
          min={0.45}
          max={2.5}
          step={0.01}
          onChange={(v) => patch("textureScale", v)}
        />
        <SliderRow
          label="Position X"
          value={draft.texturePosX}
          min={0}
          max={100}
          step={1}
          onChange={(v) => patch("texturePosX", v)}
          format={(v) => `${Math.round(v)}%`}
        />
        <SliderRow
          label="Position Y"
          value={draft.texturePosY}
          min={0}
          max={100}
          step={1}
          onChange={(v) => patch("texturePosY", v)}
          format={(v) => `${Math.round(v)}%`}
        />
        <SliderRow
          label="Texture opacity"
          value={draft.textureOpacity}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => patch("textureOpacity", v)}
        />
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-4">
        <h2 className="text-sm font-black text-white">Clarity</h2>
        <p className="text-[11px] text-slate-400 -mt-2">
          Reduce blur — keep blur at 0 and raise contrast slightly for sharper felt.
        </p>
        <SliderRow
          label="Brightness"
          value={draft.textureBrightness}
          min={0.4}
          max={1.8}
          step={0.01}
          onChange={(v) => patch("textureBrightness", v)}
        />
        <SliderRow
          label="Contrast"
          value={draft.textureContrast}
          min={0.4}
          max={2}
          step={0.01}
          onChange={(v) => patch("textureContrast", v)}
        />
        <SliderRow
          label="Saturation"
          value={draft.textureSaturate}
          min={0}
          max={2.5}
          step={0.01}
          onChange={(v) => patch("textureSaturate", v)}
        />
        <SliderRow
          label="Blur (px)"
          hint="0 = sharp; lower is better for photo felts"
          value={draft.textureBlur}
          min={0}
          max={8}
          step={0.1}
          onChange={(v) => patch("textureBlur", v)}
          format={(v) => `${v.toFixed(1)}px`}
        />
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-4">
        <h2 className="text-sm font-black text-white">Cloth overlays</h2>
        <SliderRow
          label="Nap / noise strength"
          hint="Lower if the felt looks muddy or fuzzy"
          value={draft.overlayStrength}
          min={0}
          max={1.5}
          step={0.01}
          onChange={(v) => patch("overlayStrength", v)}
        />
      </section>
    </div>
  );
}

function FeltLabIndex() {
  const felts = getFeltLabFelts();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-950 to-black text-white pb-10">
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <BackButton to="/labs" label="Labs" />
          <div>
            <h1 className="text-lg font-black">Felt Lab</h1>
            <p className="text-[10px] text-slate-400">
              Tune table felt texture fit, sharpness, and overlay strength
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-3">
        <p className="text-[11px] text-slate-400">
          Pick a felt with a photo texture. Saves to your profile — same look in shop and game.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {felts.map((felt) => (
            <button
              key={felt.id}
              type="button"
              onClick={() => navigate(`/felt-lab/${felt.id}`)}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-left text-sm font-bold hover:border-emerald-400/50 hover:bg-slate-900 transition-colors"
            >
              {felt.name}
              {loadFeltTuning(felt.id, felt) ? (
                <span className="block text-[9px] font-normal text-emerald-400 mt-0.5">Custom tuning</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeltLabPage() {
  const { feltId } = useParams();

  if (!feltId) {
    return <FeltLabIndex />;
  }

  if (!isFeltLabFelt(feltId)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div style={PAGE_HEADER_SAFE_STYLE}>
          <BackButton to="/felt-lab" label="Felt Lab" />
        </div>
        <div className="max-w-md mx-auto mt-8 text-center space-y-4">
          <p className="text-rose-400 font-bold">Unknown felt: {feltId}</p>
          <Link to="/felt-lab" className="text-emerald-400 underline text-sm">
            Back to felt list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-950 to-black text-white pb-10">
      <div
        className="sticky top-0 z-30 border-b border-white/10 backdrop-blur px-3 pb-3"
        style={{ background: "rgba(2,4,8,0.92)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <BackButton to="/felt-lab" label="Felt Lab" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black truncate">Felt Lab</h1>
            <p className="text-[10px] text-slate-400 truncate">Texture fit · clarity · overlays</p>
          </div>
          <Link
            to="/labs"
            className="text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border border-white/20 text-slate-300 hover:bg-white/5 shrink-0"
          >
            Labs
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <FeltLabEditor key={feltId} feltId={feltId} />
      </div>
    </div>
  );
}
