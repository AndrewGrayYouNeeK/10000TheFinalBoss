import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import BackButton, { PAGE_HEADER_SAFE_STYLE } from "@/components/ui/BackButton";
import NightCityBackground from "@/components/online/NightCityBackground";

export default function OnlineUnavailable() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative text-white" style={{ background: "#020408" }}>
      <NightCityBackground />

      <div
        className="absolute top-0 left-0 right-0 z-10 px-4 pb-3"
        style={PAGE_HEADER_SAFE_STYLE}
      >
        <BackButton to="/" label="Back" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md z-10"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(255,100,100,0.1)",
            border: "2px solid rgba(255,100,100,0.4)",
          }}
        >
          <WifiOff className="w-10 h-10 text-rose-400" />
        </div>

        <h1 className="font-pixel text-2xl mb-3" style={{ color: "#00ffc8" }}>
          Online Play Unavailable
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Multiplayer requires a dedicated game server. This standalone build runs entirely on your device — use local play or story mode instead.
        </p>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full font-bold" style={{ background: "linear-gradient(135deg, #00ffc8, #00b8ff)", color: "#000" }}>
            <Link to="/setup">Play Local</Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
