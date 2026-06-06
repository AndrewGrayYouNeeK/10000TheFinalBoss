import React, { useEffect, useRef, useMemo } from "react";

/**
 * Heavy cyberpunk background: dark rainy skyline + neon rain (canvas) +
 * parallax layers of glowing flying hover cars with thrust trails + scanlines + vignette.
 * Pointer-events disabled — purely decorative.
 */
export default function NightCityBackground() {
  const rainRef = useRef(null);

  // Animated neon rain on a canvas (fast + cheap)
  useEffect(() => {
    const canvas = rainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 220;
    const COLORS = ["#00ffea", "#ff00ea", "#a3ff12", "#a855f7", "#fff200"];
    const drops = Array.from({ length: COUNT }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 8 + Math.random() * 22,
      speed: 6 + Math.random() * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.25 + Math.random() * 0.55,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of drops) {
        ctx.globalAlpha = d.alpha;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        d.x -= 1; // slight wind
        if (d.y > canvas.height) {
          d.y = -d.len;
          d.x = Math.random() * canvas.width;
        }
        if (d.x < -10) d.x = canvas.width + 10;
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Procedurally generate 3 parallax layers of hover cars
  const carLayers = useMemo(() => {
    const layers = [
      { count: 4, top: [8, 28], size: [70, 110], duration: [28, 38], opacity: 0.85, blur: 0 },   // foreground
      { count: 5, top: [25, 55], size: [40, 65], duration: [42, 58], opacity: 0.7, blur: 0.5 },  // mid
      { count: 6, top: [50, 78], size: [22, 36], duration: [60, 90], opacity: 0.5, blur: 1.2 },  // distant
    ];
    const colors = [
      ["#ff00ea", "#ff7fdc"],
      ["#00ffea", "#7ffff0"],
      ["#a3ff12", "#d4ff7e"],
      ["#a855f7", "#d8b4fe"],
      ["#fff200", "#fff9a0"],
    ];
    return layers.map((l, li) =>
      Array.from({ length: l.count }).map((_, i) => {
        const c = colors[(li + i) % colors.length];
        return {
          id: `${li}-${i}`,
          top: l.top[0] + Math.random() * (l.top[1] - l.top[0]),
          size: l.size[0] + Math.random() * (l.size[1] - l.size[0]),
          duration: l.duration[0] + Math.random() * (l.duration[1] - l.duration[0]),
          delay: -Math.random() * l.duration[1],
          direction: Math.random() < 0.5 ? "ltr" : "rtl",
          opacity: l.opacity,
          blur: l.blur,
          glow: c[0],
          trail: c[1],
        };
      })
    );
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base dark sky with magenta/cyan glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 90%, rgba(255,0,234,0.25), transparent 55%)," +
            "radial-gradient(ellipse at 80% 80%, rgba(0,255,234,0.22), transparent 55%)," +
            "radial-gradient(ellipse at 50% 20%, rgba(168,85,247,0.18), transparent 60%)," +
            "linear-gradient(180deg, #04020a 0%, #06031a 60%, #02010a 100%)",
        }}
      />

      {/* Distant skyline silhouette */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        style={{ height: "32vh", opacity: 0.85 }}
      >
        <defs>
          <linearGradient id="sky-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0a0820" />
            <stop offset="100%" stopColor="#020108" />
          </linearGradient>
        </defs>
        <path
          d="M0,220 L0,140 L40,140 L40,90 L80,90 L80,120 L120,120 L120,60 L160,60 L160,110 L200,110 L200,80 L240,80 L240,140 L290,140 L290,50 L330,50 L330,100 L380,100 L380,130 L430,130 L430,70 L470,70 L470,120 L520,120 L520,40 L560,40 L560,110 L610,110 L610,90 L660,90 L660,150 L710,150 L710,70 L760,70 L760,120 L810,120 L810,55 L860,55 L860,130 L910,130 L910,80 L960,80 L960,110 L1010,110 L1010,50 L1060,50 L1060,140 L1110,140 L1110,90 L1160,90 L1160,130 L1200,130 L1200,220 Z"
          fill="url(#sky-fade)"
          stroke="#ff00ea"
          strokeOpacity="0.35"
          strokeWidth="1"
          style={{ filter: "drop-shadow(0 0 6px rgba(255,0,234,0.5))" }}
        />
        {/* Window dots */}
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 23) % 1200;
          const y = 60 + ((i * 37) % 120);
          const col = i % 3 === 0 ? "#00ffea" : i % 3 === 1 ? "#ff00ea" : "#fff200";
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="2"
              height="3"
              fill={col}
              opacity={0.7}
              style={{ filter: `drop-shadow(0 0 3px ${col})` }}
            />
          );
        })}
      </svg>

      {/* Flying hover cars — 3 parallax layers */}
      {carLayers.map((layer, li) => (
        <div key={li} className="absolute inset-0">
          {layer.map((car) => (
            <div
              key={car.id}
              className="absolute"
              style={{
                top: `${car.top}%`,
                left: car.direction === "ltr" ? "-15%" : "115%",
                width: car.size,
                height: car.size * 0.35,
                opacity: car.opacity,
                filter: car.blur ? `blur(${car.blur}px)` : "none",
                animation: `hovercar-${car.direction} ${car.duration}s linear ${car.delay}s infinite`,
              }}
            >
              <HoverCar glow={car.glow} trail={car.trail} flip={car.direction === "rtl"} />
            </div>
          ))}
        </div>
      ))}

      {/* Neon rain canvas */}
      <canvas ref={rainRef} className="absolute inset-0 w-full h-full" />

      {/* Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,255,234,0.04) 2px, rgba(0,255,234,0.04) 3px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Keyframes */}
      <style>{`
        @keyframes hovercar-ltr {
          0% { transform: translateX(0); }
          100% { transform: translateX(140vw); }
        }
        @keyframes hovercar-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(-140vw); }
        }
      `}</style>
    </div>
  );
}

function HoverCar({ glow, trail, flip }) {
  // SVG hover car with thrust trail
  return (
    <svg
      viewBox="0 0 120 42"
      width="100%"
      height="100%"
      style={{ transform: flip ? "scaleX(-1)" : "none", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`trail-${glow}`} x1="0" x2="1" y1="0.5" y2="0.5">
          <stop offset="0%" stopColor={trail} stopOpacity="0" />
          <stop offset="100%" stopColor={trail} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* Thrust trail */}
      <rect x="-60" y="18" width="60" height="6" fill={`url(#trail-${glow})`} style={{ filter: `drop-shadow(0 0 8px ${trail})` }} />
      <rect x="-40" y="20" width="40" height="2" fill={trail} opacity="0.9" style={{ filter: `drop-shadow(0 0 4px ${trail})` }} />
      {/* Body */}
      <path
        d="M5,24 Q15,12 45,10 L90,10 Q108,12 115,22 L115,28 Q108,32 90,32 L20,32 Q8,30 5,24 Z"
        fill="#0a0218"
        stroke={glow}
        strokeWidth="1.5"
        style={{ filter: `drop-shadow(0 0 6px ${glow}) drop-shadow(0 0 12px ${glow})` }}
      />
      {/* Windshield */}
      <path d="M35,14 Q55,8 78,12 L78,20 L35,20 Z" fill={glow} opacity="0.55" />
      {/* Underglow */}
      <ellipse cx="60" cy="36" rx="42" ry="3" fill={glow} opacity="0.6" style={{ filter: `blur(3px)` }} />
      {/* Headlight */}
      <circle cx="110" cy="22" r="2" fill="#fff" style={{ filter: `drop-shadow(0 0 6px #fff)` }} />
    </svg>
  );
}