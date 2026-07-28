import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_PASS_PLAY_PRIVACY } from "@/lib/passPlayPrivacy";

function PrivacyToggle({ id, label, hint, checked, disabled, onCheckedChange }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2 ${disabled ? "opacity-45" : ""}`}>
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-100 cursor-pointer">
          {label}
        </Label>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hint}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0 data-[state=checked]:bg-cyan-500"
      />
    </div>
  );
}

export default function PassPlayPrivacySettings({ settings, onChange, compact = false }) {
  const s = settings ?? DEFAULT_PASS_PLAY_PRIVACY;

  const patch = (key, value) => onChange({ ...s, [key]: value });

  return (
    <div className={compact ? "p-3 space-y-1" : "space-y-1"}>
      {!compact && (
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-cyan-300/90 mb-2">
          Pass-and-play privacy
        </p>
      )}
      <PrivacyToggle
        id="pp-enabled"
        label="Privacy mode"
        hint="Handoff screen between turns on shared devices."
        checked={s.enabled}
        onCheckedChange={(v) => patch("enabled", v)}
      />
      <PrivacyToggle
        id="pp-dice"
        label="Hide dice"
        hint="Blur tray until the active player confirms."
        checked={s.hideDice}
        disabled={!s.enabled}
        onCheckedChange={(v) => patch("hideDice", v)}
      />
      <PrivacyToggle
        id="pp-turn-score"
        label="Hide turn score"
        checked={s.hideTurnScore}
        disabled={!s.enabled}
        onCheckedChange={(v) => patch("hideTurnScore", v)}
      />
      <PrivacyToggle
        id="pp-power-panel"
        label="Hide power panel"
        checked={s.hidePowerPanel}
        disabled={!s.enabled}
        onCheckedChange={(v) => patch("hidePowerPanel", v)}
      />
      <PrivacyToggle
        id="pp-power-badge"
        label="Hide charge badge"
        hint="No ⚡ on score cards while shield is up."
        checked={s.hidePowerChargeBadge}
        disabled={!s.enabled}
        onCheckedChange={(v) => patch("hidePowerChargeBadge", v)}
      />
      <PrivacyToggle
        id="pp-xray"
        label="Hide X-ray findings"
        checked={s.hideXrayReveals}
        disabled={!s.enabled}
        onCheckedChange={(v) => patch("hideXrayReveals", v)}
      />
      <PrivacyToggle
        id="pp-subtle-vfx"
        label="Subtle power VFX"
        hint="Smaller glow on dice & panel during your turn."
        checked={s.subtlePowerVfx}
        disabled={!s.enabled}
        onCheckedChange={(v) => patch("subtlePowerVfx", v)}
      />
    </div>
  );
}
