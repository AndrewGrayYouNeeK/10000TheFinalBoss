import React, { useMemo, useState } from "react";
import { createInitialState, rollDice, evaluateRoll } from "@/lib/gameLogic";
import { buildClientMatchPayload } from "@/lib/onlineGameState";
import {
  DEFAULT_ONLINE_VISIBILITY,
  normalizeOnlineVisibility,
} from "@/lib/onlineVisibility";

function MiniDice({ dice }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {dice.map((d) => (
        <div
          key={d.id}
          className="w-7 h-7 rounded-md border flex items-center justify-center text-[10px] font-black relative overflow-hidden"
          style={{
            borderColor: d.held ? "rgba(0,255,200,0.7)" : "rgba(255,255,255,0.2)",
            background: "rgba(8,10,20,0.9)",
          }}
        >
          {d.valueHidden ? (
            <>
              <span className="text-slate-600">?</span>
              <div
                className="absolute inset-0 backdrop-blur-sm bg-slate-900/60"
                aria-hidden
              />
            </>
          ) : (
            <span className="text-cyan-200">{d.value ?? "–"}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function MiniPanel({ title, payload, accent }) {
  const turnHidden = payload.turnScore == null;
  return (
    <div
      className="rounded-xl border p-3 space-y-2 text-left min-h-[140px]"
      style={{
        borderColor: `${accent}55`,
        background: "rgba(8,10,20,0.85)",
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: accent }}>
        {title}
      </p>
      <div className="text-xs text-slate-400">
        Turn score:{" "}
        {turnHidden ? (
          <span className="text-slate-600 tracking-widest">•••</span>
        ) : (
          <span className="text-white font-bold">{payload.turnScore}</span>
        )}
      </div>
      <MiniDice dice={payload.dice} />
      <div className="text-[10px] text-slate-500 space-y-0.5">
        <div>Power panel: {payload.uiHints.hidePowerPanel ? "hidden" : "visible"}</div>
        <div>Charge badge: {payload.uiHints.hidePowerChargeBadge ? "hidden" : "visible"}</div>
      </div>
    </div>
  );
}

/**
 * Side-by-side mock: what each device receives when Player 1 is rolling (Player 2's turn to watch).
 */
export default function OnlineVisibilityPreview() {
  const [visibility, setVisibility] = useState({ ...DEFAULT_ONLINE_VISIBILITY });

  const mockState = useMemo(() => {
    let s = createInitialState(["You", "Opponent"]);
    s = rollDice(s);
    s = evaluateRoll(s);
    s.currentIndex = 0;
    return s;
  }, []);

  const player0View = useMemo(
    () =>
      buildClientMatchPayload({
        matchState: mockState,
        viewerPlayerIndex: 0,
        visibilityByPlayerIndex: { 0: normalizeOnlineVisibility(visibility) },
      }),
    [mockState, visibility]
  );

  const player1View = useMemo(
    () =>
      buildClientMatchPayload({
        matchState: mockState,
        viewerPlayerIndex: 1,
        visibilityByPlayerIndex: { 0: normalizeOnlineVisibility(visibility) },
      }),
    [mockState, visibility]
  );

  const patch = (key, value) => setVisibility((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed">
        Mock: Player 1&apos;s turn. Server sends <b className="text-white">different payloads</b> to each device.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <MiniPanel title="Player 1 device" payload={player0View} accent="#7effc4" />
        <MiniPanel title="Player 2 device" payload={player1View} accent="#ff8cc8" />
      </div>
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-2 space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your privacy (Player 1)</p>
        {[
          ["hideDice", "Hide dice"],
          ["hideTurnScore", "Hide turn score"],
          ["hidePowerPanel", "Hide power UI"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={visibility[key]}
              onChange={(e) => patch(key, e.target.checked)}
              className="rounded border-slate-600"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
