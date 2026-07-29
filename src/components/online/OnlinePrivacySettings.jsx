import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_ONLINE_VISIBILITY } from "@/lib/onlineVisibility";

function PrivacyToggle({ id, label, hint, checked, onCheckedChange }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-100 cursor-pointer">
          {label}
        </Label>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hint}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0 data-[state=checked]:bg-cyan-500"
      />
    </div>
  );
}

/** What opponents see during your turn (online / remote devices). */
export default function OnlinePrivacySettings({ settings, onChange, compact = false }) {
  const s = settings ?? DEFAULT_ONLINE_VISIBILITY;
  const patch = (key, value) => onChange({ ...s, [key]: value });

  return (
    <div className={compact ? "p-3 space-y-1" : "space-y-1"}>
      {!compact && (
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-cyan-300/90 mb-2">
          Online privacy
        </p>
      )}
      <p className="text-[11px] text-slate-500 mb-2 leading-snug">
        Controls what the opponent&apos;s device receives during your turn. Enforced by the game server.
      </p>
      <PrivacyToggle
        id="ol-dice"
        label="Hide dice from opponent"
        hint="They see blurred dice, not your rolls."
        checked={s.hideDice}
        onCheckedChange={(v) => patch("hideDice", v)}
      />
      <PrivacyToggle
        id="ol-turn-score"
        label="Hide turn score"
        checked={s.hideTurnScore}
        onCheckedChange={(v) => patch("hideTurnScore", v)}
      />
      <PrivacyToggle
        id="ol-power-panel"
        label="Hide power mode UI"
        hint="No charge fanfare on their screen."
        checked={s.hidePowerPanel}
        onCheckedChange={(v) => patch("hidePowerPanel", v)}
      />
      <PrivacyToggle
        id="ol-power-badge"
        label="Hide charge badge"
        checked={s.hidePowerChargeBadge}
        onCheckedChange={(v) => patch("hidePowerChargeBadge", v)}
      />
      <PrivacyToggle
        id="ol-xray"
        label="Hide X-ray findings"
        checked={s.hideXrayReveals}
        onCheckedChange={(v) => patch("hideXrayReveals", v)}
      />
      <PrivacyToggle
        id="ol-subtle-vfx"
        label="Subtle power VFX"
        hint="If any power UI leaks through, keep it minimal."
        checked={s.subtlePowerVfx}
        onCheckedChange={(v) => patch("subtlePowerVfx", v)}
      />
    </div>
  );
}
