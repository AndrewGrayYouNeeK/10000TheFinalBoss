import React from "react";
import { Link } from "react-router-dom";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <div
        className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-4 pb-3"
        style={PAGE_HEADER_SAFE_STYLE}
      >
        <BackButton to="/" label="Back" />
      </div>
      <div className="max-w-2xl mx-auto p-6 prose prose-invert prose-sm max-w-none">
        <h1 className="text-3xl font-black mb-2 text-amber-400 not-prose">Privacy Policy</h1>
        <p className="text-slate-400 mb-8 not-prose">Last updated: June 2026</p>

        <section className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            YouNeeK 10,000 (&quot;the App&quot;) is an offline dice game. We do not require an account,
            and we do not sell your personal information.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">Data stored on your device</h2>
          <p>
            Game progress (coins, XP, owned dice, settings) is saved locally on your device using
            browser or app storage. This data is not synced to our servers and is not shared with third parties.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">Microphone (optional)</h2>
          <p>
            The Soundwave custom dice effect may request microphone access when you tap to enable it.
            Audio is processed on-device for visual effects only. We do not record, store, or transmit
            microphone audio.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">Motion sensors (optional)</h2>
          <p>
            Shake-to-roll and the home screen dice animation may use device motion or orientation data
            when you grant permission. This data is used only for gameplay and visuals on your device.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">No tracking or analytics</h2>
          <p>
            The App does not use advertising identifiers, third-party analytics, or cross-app tracking.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">In-app currency</h2>
          <p>
            Gray Quarters (GQ) are virtual currency earned by playing. Bonus GQ packs in the shop are
            free during this release and do not involve real-money purchases.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">Children</h2>
          <p>
            The App is suitable for general audiences. We do not knowingly collect personal information from children.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">Contact</h2>
          <p>
            Questions about this policy:{" "}
            <a href="mailto:hello@dice10k.app" className="text-cyan-400 hover:underline">
              hello@dice10k.app
            </a>
            {" · "}
            <Link to="/contact" className="text-cyan-400 hover:underline">Contact page</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
