import React from "react";
import { Link } from "react-router-dom";
import { Wrench, ArrowRight } from "lucide-react";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import { gameHubPath } from "@/lib/webPlay";
import { LAB_HUB_SECTIONS } from "@/lib/labCatalog";

/**
 * One door for every lab / video / edit tool (private — LabAccessGate).
 */
export default function LabsHub() {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white pb-16">
      <div
        className="sticky top-0 z-20 border-b border-white/10 backdrop-blur px-4 pb-3"
        style={{ background: "rgba(2,4,8,0.94)", ...PAGE_HEADER_SAFE_STYLE }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <BackButton to={gameHubPath()} label="Hub" />
          <div className="min-w-0">
            <h1 className="text-lg font-black flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400 shrink-0" />
              Dev Labs
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              All editors, video tools, and polish pages — one place
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-8">
        {LAB_HUB_SECTIONS.map((section) => (
          <section key={section.id}>
            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-amber-300/90 mb-1">
              {section.title}
            </h2>
            <p className="text-sm text-slate-500 mb-3">{section.blurb}</p>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 hover:border-amber-400/40 hover:bg-slate-900 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-white">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400/70 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-[11px] text-slate-600 text-center pt-4">
          Private tools — not shown to players. Old URLs still work; start here next time.
        </p>
      </main>
    </div>
  );
}
