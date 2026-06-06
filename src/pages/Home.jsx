import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dices, Users, BookOpen, Sparkles, Coins, Zap, Wifi, Swords } from "lucide-react";
import RulesSheet from "@/components/game/RulesSheet";
import { useCosmetics } from "@/hooks/useCosmetics";
import DiceRain from "@/components/game/DiceRain";
import DiamondShowcase from "@/components/home/DiamondShowcase";

export default function Home() {
  const { coins, isLoading } = useCosmetics();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 pb-6 pt-20 overflow-hidden relative"
      style={{ background: "#020408" }}
    >
      {/* Matrix dice rain */}
      <DiceRain />

      {/* Animated scanlines */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.015) 2px, rgba(0,255,200,0.015) 4px)",
        }}
      />

      {/* Cyan glow orb top */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,255,200,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Purple glow orb bottom */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(180,0,255,0.13) 0%, transparent 70%)",
        }}
      />

      {/* Grid floor perspective */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(0,255,200,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,200,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
          transform: "perspective(300px) rotateX(40deg)",
          transformOrigin: "bottom center",
        }}
      />

      {/* Floating neon particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(14)].map((_, i) => {
          const colors = ["rgba(0,255,200,0.7)", "rgba(180,0,255,0.7)", "rgba(255,50,150,0.7)", "rgba(0,180,255,0.7)"];
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                background: colors[i % colors.length],
                boxShadow: `0 0 6px 2px ${colors[i % colors.length]}`,
                left: `${(i * 71) % 100}%`,
                top: `${(i * 53) % 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + (i % 4),
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Link
          to="/shop"
          className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-all border font-black tabular-nums text-sm"
          style={{
            background: "rgba(0,255,200,0.07)",
            borderColor: "rgba(0,255,200,0.35)",
            color: "#00ffc8",
            boxShadow: "0 0 12px rgba(0,255,200,0.15)",
          }}
        >
          <Coins className="w-4 h-4" />
          {isLoading ? "…" : coins.toLocaleString()}
        </Link>
        <RulesSheet />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative z-10 max-w-sm w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-1 relative"
        >
          {/* Neon ring behind logo */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              background: "radial-gradient(circle, rgba(0,255,200,0.08) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <img
            data-dice-obstacle
            data-dice-solid
            src="/assets/02645f1df_J-pkVgoLigDTfwK1sZ0Qt_3RwWpqbD.png"
            alt="10,000 The Ultimate Roll"
            className="w-80 h-80 object-contain mx-auto relative"
            style={{ filter: "drop-shadow(0 0 30px rgba(0,255,200,0.3)) drop-shadow(0 0 60px rgba(180,0,255,0.2))" }}
          />
        </motion.div>

        {/* Glitch tagline */}
        <motion.p
          className="mb-8 text-xs font-bold tracking-[0.35em] uppercase"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ color: "#00ffc8", textShadow: "0 0 10px rgba(0,255,200,0.6)" }}
        >
          Roll. Risk. Reach ten thousand.
        </motion.p>

        <DiamondShowcase />

        {/* Buttons */}
        <div className="space-y-3">
          {/* Primary CTA */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              data-dice-obstacle
              data-dice-solid
              to="/setup"
              className="flex items-center justify-center w-full h-16 text-lg font-black rounded-lg gap-2 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #00ffc8 0%, #00b8ff 50%, #a855f7 100%)",
                color: "#000",
                boxShadow: "0 0 30px rgba(0,255,200,0.4), 0 0 60px rgba(0,180,255,0.2)",
              }}
            >
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
              />
              <Zap className="w-6 h-6" />
              PLAY NOW
            </Link>
          </motion.div>

          {/* Story mode */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              data-dice-obstacle
              to="/story"
              className="flex items-center justify-center w-full h-14 text-base font-black rounded-lg gap-2 relative overflow-hidden border"
              style={{
                background: "rgba(255,0,170,0.08)",
                borderColor: "rgba(255,0,170,0.5)",
                color: "#ff5cb0",
                boxShadow: "0 0 20px rgba(255,0,170,0.2)",
              }}
            >
              <Swords className="w-5 h-5" />
              STORY MODE
            </Link>
          </motion.div>

          {/* Online play */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              data-dice-obstacle
              to="/online"
              className="flex items-center justify-center w-full h-14 text-base font-black rounded-lg gap-2 relative overflow-hidden border"
              style={{
                background: "rgba(0,255,200,0.08)",
                borderColor: "rgba(0,255,200,0.5)",
                color: "#00ffc8",
                boxShadow: "0 0 20px rgba(0,255,200,0.2)",
              }}
            >
              <Wifi className="w-5 h-5" />
              PLAY ONLINE
              <span className="text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                1.5×
              </span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                data-dice-obstacle
                to="/shop"
                className="flex items-center justify-center w-full h-13 py-3 text-sm font-bold rounded-lg gap-2 border"
                style={{
                  background: "rgba(168,85,247,0.1)",
                  borderColor: "rgba(168,85,247,0.5)",
                  color: "#c084fc",
                  boxShadow: "0 0 15px rgba(168,85,247,0.15)",
                }}
              >
                <Sparkles className="w-4 h-4" /> Shop
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                data-dice-obstacle
                to="/rules"
                className="flex items-center justify-center w-full h-13 py-3 text-sm font-bold rounded-lg gap-2 border"
                style={{
                  background: "rgba(0,255,200,0.06)",
                  borderColor: "rgba(0,255,200,0.25)",
                  color: "#5eead4",
                  boxShadow: "0 0 15px rgba(0,255,200,0.08)",
                }}
              >
                <BookOpen className="w-4 h-4" /> Rules
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="mt-8 text-xs flex items-center justify-center gap-1"
          style={{ color: "rgba(0,255,200,0.3)" }}>
          <Users className="w-3 h-3" /> 2–4 players · one device
        </div>

        <div className="mt-4 text-xs flex items-center justify-center gap-4"
          style={{ color: "rgba(0,255,200,0.25)" }}>
          <Link to="/about" className="hover:opacity-70 transition-opacity">About</Link>
          <Link to="/contact" className="hover:opacity-70 transition-opacity">Contact</Link>
        </div>
      </motion.div>

    </div>
  );
}