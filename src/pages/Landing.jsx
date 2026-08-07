import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, MessagesSquare, Download } from "lucide-react";
import SiteNav from "@/components/marketing/SiteNav";
import { assetUrl } from "@/lib/assetUrl";
import { isWebPlayEnabled, APP_STORE_URL, gameHubPath } from "@/lib/webPlay";

/**
 * Marketing homepage — intentionally different from the in-game hub (/play).
 * No DiceRain, no neon stacked menu, no game HUD. Site first; game is a CTA.
 */
export default function Landing() {
  const playOn = isWebPlayEnabled();

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{
        background: "#0c1210",
        color: "#f4f0e6",
      }}
    >
      <SiteNav />

      {/* Hero — one composition: brand + line + CTAs + full-bleed visual */}
      <section className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(34, 90, 58, 0.55) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(180, 120, 40, 0.12) 0%, transparent 50%), linear-gradient(165deg, #0a100e 0%, #15261c 45%, #0c1210 100%)",
          }}
        />
        {/* Felt grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
          }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-16 lg:pt-16 lg:pb-20 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 lg:gap-16 flex-1">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-5"
              style={{ color: "#c4a35a" }}
            >
              The Ultimate Roll
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="font-black leading-[0.92] tracking-tight mb-5"
              style={{
                fontSize: "clamp(2.75rem, 8vw, 5.25rem)",
                color: "#f7f3ea",
              }}
            >
              YouNeeK
              <br />
              <span style={{ color: "#e8c56a" }}>10,000</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-base sm:text-lg leading-relaxed mb-9 max-w-md"
              style={{ color: "rgba(244,240,230,0.72)" }}
            >
              Bank your luck or bust. A dice night classic — skins, felts, and mystery
              boxes on the web; the full game in the app.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3"
            >
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-sm font-bold"
                style={{
                  background: "#e8c56a",
                  color: "#14110c",
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                Shop cosmetics
              </Link>

              {playOn ? (
                <Link
                  to={gameHubPath()}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-sm font-bold border"
                  style={{
                    borderColor: "rgba(232,197,106,0.45)",
                    color: "#f4f0e6",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  Open the game
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-sm font-bold border"
                  style={{
                    borderColor: "rgba(232,197,106,0.45)",
                    color: "#f4f0e6",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <Download className="w-4 h-4" />
                  Get the app
                </a>
              )}

              <Link
                to="/community"
                className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-md text-sm font-semibold"
                style={{ color: "rgba(244,240,230,0.65)" }}
              >
                <MessagesSquare className="w-4 h-4" />
                Community
              </Link>
            </motion.div>

            {playOn && (
              <p className="mt-5 text-xs" style={{ color: "rgba(244,240,230,0.4)" }}>
                Testing build — play in browser, or{" "}
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                  style={{ color: "#c4a35a" }}
                >
                  get the iOS app
                </a>
                .
              </p>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg shrink-0"
          >
            <div
              className="absolute -inset-6 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(40, 100, 65, 0.35)" }}
            />
            <img
              src={assetUrl("/assets/02645f1df_J-pkVgoLigDTfwK1sZ0Qt_3RwWpqbD.png")}
              alt="YouNeeK 10,000"
              className="relative w-full object-contain drop-shadow-2xl"
              style={{ maxHeight: "min(52vh, 420px)" }}
            />
          </motion.div>
        </div>
      </section>

      <footer
        className="relative z-10 border-t px-6 py-5"
        style={{ borderColor: "rgba(232,197,106,0.12)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{ color: "rgba(244,240,230,0.4)" }}
        >
          <span>© YouNeeK 10,000</span>
          <div className="flex gap-5">
            <Link to="/about" className="hover:opacity-80">
              About
            </Link>
            <Link to="/contact" className="hover:opacity-80">
              Contact
            </Link>
            <Link to="/privacy" className="hover:opacity-80">
              Privacy
            </Link>
            <Link to="/account" className="hover:opacity-80">
              Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
