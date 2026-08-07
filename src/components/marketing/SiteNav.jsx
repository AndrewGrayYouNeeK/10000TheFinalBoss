import React from "react";
import { Link, useLocation } from "react-router-dom";
import { isNativeApp } from "@/lib/platform";
import { gameHubPath, isWebPlayEnabled, APP_STORE_URL } from "@/lib/webPlay";

const NAV_LINK =
  "text-xs sm:text-sm font-semibold tracking-wide transition-opacity hover:opacity-80";

/**
 * Marketing site chrome — website look, not the in-game neon HUD.
 */
export default function SiteNav({ transparent = false }) {
  const location = useLocation();
  const native = isNativeApp();
  const playOn = isWebPlayEnabled();

  const links = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/community", label: "Community" },
    { to: "/account", label: "Account" },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full border-b"
      style={{
        background: transparent ? "rgba(12,18,16,0.72)" : "rgba(12,18,16,0.94)",
        borderColor: "rgba(232,197,106,0.14)",
        backdropFilter: "blur(12px)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span
            className="font-black text-sm sm:text-base tracking-tight"
            style={{ color: "#f4f0e6" }}
          >
            YouNeeK{" "}
            <span style={{ color: "#e8c56a" }}>10,000</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          {links.map((l) => {
            const active =
              l.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={NAV_LINK}
                style={{
                  color: active ? "#e8c56a" : "rgba(244,240,230,0.55)",
                }}
              >
                {l.label}
              </Link>
            );
          })}
          {!native && playOn && (
            <Link
              to={gameHubPath()}
              className={`${NAV_LINK} px-2.5 py-1 rounded-md border`}
              style={{
                color: "#0c1210",
                borderColor: "transparent",
                background: "#e8c56a",
              }}
            >
              Game
            </Link>
          )}
          {!native && !playOn && (
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${NAV_LINK} px-2.5 py-1 rounded-md`}
              style={{
                color: "#0c1210",
                background: "#e8c56a",
              }}
            >
              Get App
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
