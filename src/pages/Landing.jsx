import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_STORE_URL, gameHubPath, isWebPlayEnabled } from "@/lib/webPlay";
import "./Landing.css";

// Standard die faces (opposites sum to 7): front, back, right, left, top, bottom
const DIE_FACES = [
  ["6", "1", "4", "3", "5", "2"],
  ["3", "4", "6", "1", "2", "5"],
  ["5", "2", "1", "6", "3", "4"],
];

const FACE_CLASS = ["front", "back", "right", "left", "top", "bottom"];

const AMBIENT = [
  "SCANNING FOR CHEATERS...",
  "DICE ENTROPY STABLE",
  "HIGH ROLLER DETECTED IN SECTOR 7",
  "JACKPOT PROTOCOL ARMED",
  "NO MERCY MODE AVAILABLE",
];

const BURST_SYMBOLS = ["⚡", "✦", "◈", "6", "1", "X", "☠", "◉"];
const BURST_COLORS = ["#00f0ff", "#ff00aa", "#f0ff00", "#bc13fe"];

function Die({ faces, shakeKey }) {
  return (
    <div key={shakeKey} className="cyber-arena__die">
      {faces.map((glyph, i) => (
        <div key={FACE_CLASS[i]} className={`cyber-arena__face cyber-arena__face--${FACE_CLASS[i]}`}>
          {glyph}
        </div>
      ))}
    </div>
  );
}

/**
 * Cyber Arena landing — port of the 10,000 DICE HTML mock.
 * ENTER routes into the in-app game hub (/play on web).
 */
export default function Landing() {
  const navigate = useNavigate();
  const playOn = isWebPlayEnabled();
  const canvasRef = useRef(null);
  const [lines, setLines] = useState(["SYSTEM ONLINE", "AWAITING COMMAND..."]);
  const [fx, setFx] = useState({ hue: false, nuke: false, glitch: false });
  const [shakeKey, setShakeKey] = useState(0);
  const [bursts, setBursts] = useState([]);

  const log = useCallback((msgHtml) => {
    setLines((prev) => [msgHtml, ...prev].slice(0, 5));
  }, []);

  const spawnBurst = useCallback((x, y, count = 18) => {
    const id = Date.now() + Math.random();
    const items = Array.from({ length: count }, (_, i) => ({
      id: `${id}-${i}`,
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 40,
      text: BURST_SYMBOLS[Math.floor(Math.random() * BURST_SYMBOLS.length)],
      color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
    }));
    setBursts((prev) => [...prev, ...items]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => !String(b.id).startsWith(String(id))));
    }, 1200);
  }, []);

  // Matrix rain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const chars =
      "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン⚡✦◈☠";
    const fontSize = 16;
    let drops = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1);
    };
    resize();
    window.addEventListener("resize", resize);

    const timer = setInterval(() => {
      ctx.fillStyle = "rgba(5, 5, 10, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f0ff";
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 1;
      }
    }, 40);

    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Ambient terminal logs
  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.7) {
        log(AMBIENT[Math.floor(Math.random() * AMBIENT.length)]);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [log]);

  const onEnter = (e) => {
    log('<span>ACCESS GRANTED</span> — INITIATING DICE PROTOCOL...');
    spawnBurst(e.clientX, e.clientY, 30);
    setFx((f) => ({ ...f, hue: true }));
    setTimeout(() => setFx((f) => ({ ...f, hue: false })), 600);
    setTimeout(() => {
      log("WELCOME TO THE 10K ARENA, RUNNER");
      if (playOn) navigate(gameHubPath());
      else window.open(APP_STORE_URL, "_blank", "noopener,noreferrer");
    }, 700);
  };

  const onRoll = (e) => {
    const rolls = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
    log(`ROLL RESULT: <span>[${rolls.join(" | ")}]</span>`);
    spawnBurst(e.clientX, e.clientY);
    setShakeKey((k) => k + 1);
  };

  const onGlitch = (e) => {
    log("<span>GLITCH INJECTED</span> — REALITY DESTABILIZING...");
    spawnBurst(e.clientX, e.clientY, 25);
    setFx((f) => ({ ...f, glitch: true }));
    setTimeout(() => {
      setFx((f) => ({ ...f, glitch: false }));
      log("SYSTEM RECOVERED... BARELY");
    }, 1300);
  };

  const onNuke = (e) => {
    log('<span class="warn">SCORE NUKED</span> — EVERYTHING IS ZERO');
    spawnBurst(e.clientX, e.clientY, 40);
    setFx((f) => ({ ...f, nuke: true }));
    setTimeout(() => setFx((f) => ({ ...f, nuke: false })), 400);
  };

  const onLeader = () => {
    log(
      'LEADERBOARD: <span>GHOST_77</span> 9842 • <span>NEON_KILLA</span> 9710 • <span>YOU</span> ???'
    );
  };

  const rootClass = [
    "cyber-arena",
    fx.hue ? "cyber-arena--hue" : "",
    fx.nuke ? "cyber-arena--nuke" : "",
    fx.glitch ? "cyber-arena--glitching" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <canvas ref={canvasRef} className="cyber-arena__rain" aria-hidden />

      <div className="cyber-arena__main">
        <div className="cyber-arena__title-wrap">
          <h1 className="cyber-arena__title" data-text="Rolll 10,000">
            Rolll 10,000
          </h1>
        </div>
        <p className="cyber-arena__subtitle">// HIGH-STAKES CYBER ARENA //</p>

        <div className="cyber-arena__dice">
          {DIE_FACES.map((faces, i) => (
            <Die key={`${i}-${shakeKey}`} faces={faces} shakeKey={shakeKey} />
          ))}
        </div>

        <div className="cyber-arena__btns">
          <button type="button" className="cyber-arena__btn cyber-arena__btn--enter" onClick={onEnter}>
            ENTER THE ARENA
          </button>
          <button type="button" className="cyber-arena__btn" onClick={onRoll}>
            FORCE ROLL
          </button>
          <button type="button" className="cyber-arena__btn" onClick={onGlitch}>
            GLITCH SYSTEM
          </button>
          <button type="button" className="cyber-arena__btn cyber-arena__btn--danger" onClick={onNuke}>
            NUKE SCORE
          </button>
          <button type="button" className="cyber-arena__btn" onClick={onLeader}>
            LEADERBOARD
          </button>
          <Link to="/shop" className="cyber-arena__btn">
            WEB SHOP
          </Link>
        </div>

        <div className="cyber-arena__terminal" aria-live="polite">
          {lines.map((line, i) => (
            <div key={`${i}-${line.slice(0, 24)}`}>
              {"> "}
              <span dangerouslySetInnerHTML={{ __html: line }} />
            </div>
          ))}
        </div>

        <footer className="cyber-arena__footer">
          © 2026 // YOUNEEK 10K PROTOCOL // NO REFUNDS // DIE HARD
          <div style={{ marginTop: "0.75rem" }}>
            <Link to="/about">ABOUT</Link>
            <Link to="/community">COMMUNITY</Link>
            <Link to="/account">ACCOUNT</Link>
            <Link to="/privacy">PRIVACY</Link>
          </div>
        </footer>
      </div>

      {bursts.map((b) => (
        <div
          key={b.id}
          className="cyber-arena__burst"
          style={{ left: b.x, top: b.y, color: b.color }}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
}
