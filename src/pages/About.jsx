import React from "react";
import { Link } from "react-router-dom";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <div
        className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 pb-3"
        style={PAGE_HEADER_SAFE_STYLE}
      >
        <BackButton to="/" label="Back" className="mb-0" />
      </div>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-black mb-6 text-amber-400">About YouNeeK 10,000</h1>

        <div className="space-y-4 text-slate-300 leading-relaxed text-base">
          <p>
            YouNeeK 10,000 — The Ultimate Roll is a fast-paced, strategic dice game for 2 to 4 players.
            Based on the classic folk dice game known by many names — Bust, Zilch, Greed — our version
            brings it to life with a neon interface, animated dice, and cosmetics to personalize your table.
          </p>
          <p>
            The goal is simple: be the first to reach 10,000 points by rolling six dice, banking scoring
            combinations, and knowing when to push your luck — and when to walk away.
          </p>
          <p>
            Play on iOS (and on the web while we are in open testing). Cosmetics — dice skins, felts, and
            mystery boxes — can be earned with in-game Gray Quarters, or purchased on{" "}
            <Link to="/shop" className="text-cyan-400 hover:underline">
              roll10000.com/shop
            </Link>{" "}
            so they sync to your account in the app.
          </p>
          <p>
            Have ideas or need help? Join the{" "}
            <Link to="/community" className="text-cyan-400 hover:underline">
              community boards
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 flex gap-4 flex-wrap">
          <Link to="/rules" className="text-amber-400 hover:underline text-sm font-semibold">
            View Rules
          </Link>
          <Link to="/shop" className="text-amber-400 hover:underline text-sm font-semibold">
            Web Shop
          </Link>
          <Link to="/contact" className="text-amber-400 hover:underline text-sm font-semibold">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
