import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-16">
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10 mb-6">
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>

        <h1 className="text-3xl font-black mb-6 text-amber-400">About 10,000 — The Ultimate Roll</h1>

        <div className="space-y-4 text-slate-300 leading-relaxed text-base">
          <p>
            10,000 — The Ultimate Roll is a fast-paced, strategic dice game for 2 to 4 players, all
            sharing a single device. Based on the classic folk dice game known by many names — Bust,
            Zilch, Greed — our version brings it to life with a sleek neon interface, animated dice,
            and a fully featured cosmetics shop to personalize your experience.
          </p>
          <p>
            The goal is simple: be the first player to reach 10,000 points by rolling six dice,
            banking scoring combinations, and knowing exactly when to push your luck — and when to
            walk away. Every turn is a gamble, and every roll could be your best or your last.
          </p>
          <p>
            This app is built for casual game nights, competitive friend groups, and anyone who loves
            the tension of a great dice game. Whether you're a first-time player or a seasoned roller,
            the rules page has everything you need to get started in minutes.
          </p>
          <p>
            10,000 is developed and maintained by a small independent team passionate about bringing
            classic tabletop experiences to modern mobile and web platforms. We believe great games
            should be accessible, beautiful, and endlessly replayable. We're constantly improving the
            app based on player feedback, adding new cosmetics, game modes, and features.
          </p>
          <p>
            All cosmetics — dice skins, pip styles, and player badges — are earnable in-game through
            play, with no pay-to-win mechanics. Every coin you earn is a reward for great rolling.
          </p>
        </div>

        <div className="mt-10 flex gap-4">
          <Link to="/rules" className="text-amber-400 hover:underline text-sm font-semibold">View Rules</Link>
          <Link to="/contact" className="text-amber-400 hover:underline text-sm font-semibold">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}