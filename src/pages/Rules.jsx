import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Rules() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="flex items-center gap-2 mb-4 max-w-lg mx-auto">
        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold">How to Play</h1>
      </div>

      <div className="max-w-lg mx-auto space-y-6 pb-10">
        <section className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold text-amber-400 mb-2">🎯 Goal</h2>
          <p className="text-slate-300 text-sm">First player to reach <b className="text-white">10,000 points</b> wins the game.</p>
        </section>

        <section className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold text-amber-400 mb-2">🎯 Land it Exactly</h2>
          <p className="text-slate-300 text-sm">
            You must finish on <b className="text-white">exactly 10,000</b>. If banking would put you over, the turn busts and you score <b className="text-white">0</b> for that turn — plan your rolls carefully on the home stretch.
          </p>
        </section>

        <section className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold text-amber-400 mb-2">🎲 Your Turn</h2>
          <ol className="list-decimal ml-5 space-y-2 text-slate-300 text-sm">
            <li>Roll all 6 dice.</li>
            <li>Select at least one scoring die to set aside.</li>
            <li>Choose: <b>Bank</b> your points (end turn) or <b>Roll</b> the remaining dice for more.</li>
            <li>If a roll has NO scoring dice → <b className="text-rose-400">YEEET! / SKEERT!</b> You lose the whole turn.</li>
            <li>Score with all 6 dice → <b className="text-emerald-400">Hot Dice!</b> All 6 re-roll.</li>
          </ol>
        </section>

        <section className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold text-amber-400 mb-2">🚪 Entry Rule</h2>
          <p className="text-slate-300 text-sm">
            First bank of the game must be <b className="text-white">≥ 1,000 points</b> in a single turn to get "on the board".
          </p>
        </section>

        <section className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-bold text-amber-400 mb-3">🏆 Scoring</h2>
          <div className="space-y-2 text-sm">
            {[
              ["Single 5", "50"],
              ["Single 1", "100"],
              ["Three 1s", "1,000"],
              ["Three 2s", "200"],
              ["Three 3s", "300"],
              ["Three 4s", "400"],
              ["Three 5s", "500"],
              ["Three 6s", "600"],
              ["Four of a kind", "2,000"],
              ["Five of a kind", "4,000"],
              ["Small Straight (1-2-3-4-5 or 2-3-4-5-6)", "1,000"],
              ["Large Straight (1-2-3-4-5-6)", "1,500"],
              ["Three Pairs", "1,500"],
              ["Six of a kind", "INSTANT WIN 🎉"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-300">{label}</span>
                <span className="font-bold text-white">{val}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}