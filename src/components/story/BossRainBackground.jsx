import { useEffect, useRef } from "react";

// Per-boss theme map: glyph set + colors. Anything not in this map falls back to dice faces.
const THEMES = {
  // Tier 1
  rookie:       { glyphs: ["⚀","⚁","⚂","⚃","⚄","⚅"], color: "rgba(160,255,170,0.85)", glow: "rgba(0,255,140,0.5)", bg: "#04140a" },
  tennis_kid:   { glyphs: ["🎾","•","○","◦"], color: "rgba(230,255,90,0.9)", glow: "rgba(220,255,40,0.5)", bg: "#0e1402" },
  convict:      { glyphs: ["1","2","3","4","5","6","|","-"], color: "rgba(220,220,220,0.85)", glow: "rgba(180,180,180,0.4)", bg: "#0a0a0c" },
  hustler:      { glyphs: ["$","¢","€","£","¥"], color: "rgba(255,200,90,0.9)", glow: "rgba(255,160,40,0.5)", bg: "#140a04" },
  footballer:   { glyphs: ["🏈","⚆","⚇"], color: "rgba(220,150,90,0.9)", glow: "rgba(200,100,40,0.45)", bg: "#0e0804" },

  // Tier 2
  carpenter:    { glyphs: ["🪵","◊","✶"], color: "rgba(200,150,90,0.85)", glow: "rgba(180,120,60,0.4)", bg: "#0e0804" },
  snowman:      { glyphs: ["❄","❅","❆","*","·"], color: "rgba(220,240,255,0.9)", glow: "rgba(180,220,255,0.6)", bg: "#04080e" },
  fisherman:    { glyphs: ["🐟","~","≈","∽"], color: "rgba(120,200,255,0.85)", glow: "rgba(60,160,255,0.5)", bg: "#040a14" },
  shark:        { glyphs: ["🦈","♠","♣","♥","♦","A","K","Q","J"], color: "rgba(100,220,240,0.9)", glow: "rgba(40,200,255,0.55)", bg: "#04101a" },

  // Tier 3
  pride_dancer: { glyphs: ["♥","♪","♫","✦","★"], color: "rgba(255,120,200,0.9)", glow: "rgba(255,80,180,0.5)", bg: "#0c0418" },
  ice_witch:    { glyphs: ["❄","❅","✦","◊"], color: "rgba(180,230,255,0.9)", glow: "rgba(100,200,255,0.55)", bg: "#040818" },
  teal_priest:  { glyphs: ["◊","◇","✦","∴","☸"], color: "rgba(120,230,220,0.9)", glow: "rgba(60,200,200,0.5)", bg: "#04120f" },
  ice_archer:   { glyphs: ["➳","↟","✦","❄"], color: "rgba(180,230,255,0.9)", glow: "rgba(120,200,255,0.5)", bg: "#04101a" },
  phantom:      { glyphs: ["†","✦","◊","○","●"], color: "rgba(200,140,255,0.85)", glow: "rgba(160,80,255,0.5)", bg: "#08040e" },
  moon_priestess:{glyphs: ["☾","✦","✧","·","∘"], color: "rgba(220,220,255,0.9)", glow: "rgba(180,180,255,0.5)", bg: "#06081a" },

  // Tier 4
  florist:      { glyphs: ["💐","✿","❀","✾","✽"], color: "rgba(220,140,255,0.9)", glow: "rgba(180,80,255,0.5)", bg: "#0c0418" },
  lavadragon:   { glyphs: ["🔥","✦","●","◉"], color: "rgba(255,140,60,0.9)", glow: "rgba(255,80,20,0.6)", bg: "#180404" },
  dragon_knight:{ glyphs: ["🐲","◈","◊","✦"], color: "rgba(120,240,180,0.9)", glow: "rgba(60,200,140,0.5)", bg: "#04140c" },
  amber_collector:{glyphs:["🪲","◊","∴","∵"], color: "rgba(255,200,80,0.9)", glow: "rgba(220,160,40,0.5)", bg: "#140c04" },
  bloodletter:  { glyphs: ["🩸","●","◉","·"], color: "rgba(255,80,80,0.85)", glow: "rgba(220,40,40,0.55)", bg: "#140404" },

  // Tier 5
  ironhand:     { glyphs: ["🛡","◈","■","□","◇"], color: "rgba(220,220,230,0.9)", glow: "rgba(180,180,200,0.5)", bg: "#0a0a10" },
  ruby_baron:   { glyphs: ["💎","◆","◇","✦"], color: "rgba(255,80,90,0.9)", glow: "rgba(255,40,60,0.55)", bg: "#180408" },
  labradorite_lord:{glyphs:["✦","◊","◈","✧"], color: "rgba(140,160,255,0.9)", glow: "rgba(100,120,255,0.55)", bg: "#06081a" },
  polished_twin:{ glyphs: ["✦","◇","◈","◊"], color: "rgba(180,180,255,0.9)", glow: "rgba(140,140,240,0.5)", bg: "#08081a" },
  galaxia:      { glyphs: ["✦","✧","★","·","∘","◦"], color: "rgba(220,180,255,0.9)", glow: "rgba(180,120,255,0.6)", bg: "#06041a" },

  // Tier 6 — high-tech
  hacker:       { glyphs: ["0","1","{","}","<",">","/","\\","|","#"], color: "rgba(120,220,255,0.9)", glow: "rgba(60,180,255,0.6)", bg: "#04081a" },
  the_grid:     { glyphs: ["▓","▒","░","■","□","◧","◨"], color: "rgba(255,80,220,0.9)", glow: "rgba(255,40,200,0.55)", bg: "#100418" },
  tesla_phreak: { glyphs: ["⚡","↯","↟","✦"], color: "rgba(220,180,255,0.95)", glow: "rgba(180,100,255,0.7)", bg: "#08041a" },
  neo:          { glyphs: ["ｱ","ｲ","ｳ","ｴ","ｵ","ｶ","ｷ","ｸ","0","1","2","3","4","5","6","7","8","9","ﾗ","ﾘ","ﾙ"], color: "rgba(80,255,120,0.95)", glow: "rgba(0,255,80,0.6)", bg: "#020a04" },
  toxin:        { glyphs: ["☢","☣","◉","●","○"], color: "rgba(140,255,80,0.95)", glow: "rgba(80,255,40,0.6)", bg: "#041004" },

  // Tier 7
  gunslinger:   { glyphs: ["✦","✶","★","◦","·"], color: "rgba(240,220,180,0.9)", glow: "rgba(220,180,120,0.5)", bg: "#100804" },
  lover:        { glyphs: ["♥","♡","✦","♪"], color: "rgba(255,140,200,0.9)", glow: "rgba(255,80,180,0.55)", bg: "#180418" },
  cashman:      { glyphs: ["$","💵","€","£","¥","¢"], color: "rgba(120,240,140,0.95)", glow: "rgba(60,220,80,0.6)", bg: "#04120a" },
  plasmaqueen:  { glyphs: ["✦","◉","●","♦"], color: "rgba(255,120,220,0.95)", glow: "rgba(255,60,200,0.6)", bg: "#180418" },
  decimus:      { glyphs: ["👑","◆","✦","✧","◊"], color: "rgba(255,220,80,0.95)", glow: "rgba(255,180,40,0.65)", bg: "#180c04" },
  obsidian_blade:{glyphs: ["🗡","◈","◇","◊","✦"], color: "rgba(200,200,220,0.9)", glow: "rgba(160,160,200,0.5)", bg: "#08080c" },
  shattered:    { glyphs: ["◊","◇","◈","✦","·"], color: "rgba(200,180,160,0.9)", glow: "rgba(180,150,120,0.5)", bg: "#0c0a08" },
  diamond_cut:  { glyphs: ["💎","◆","◇","✦","✧"], color: "rgba(180,240,255,0.95)", glow: "rgba(120,220,255,0.65)", bg: "#040c18" },

  // Final boss
  gq:           { glyphs: ["💎","◆","✦","✧","★","◊"], color: "rgba(220,250,255,0.98)", glow: "rgba(180,240,255,0.8)", bg: "#020814" },
};

const DEFAULT_THEME = { glyphs: ["⚀","⚁","⚂","⚃","⚄","⚅"], color: "rgba(0,255,200,0.8)", glow: "rgba(0,255,200,0.5)", bg: "#03040a" };

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function BossRainBackground({ bossId }) {
  const canvasRef = useRef(null);
  const theme = THEMES[bossId] || DEFAULT_THEME;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 90;
    const spawn = (initial = false) => ({
      x: randomBetween(0, canvas.width),
      y: initial ? randomBetween(0, canvas.height) : randomBetween(-canvas.height * 0.4, -20),
      vy: randomBetween(1.2, 3.8),
      glyph: theme.glyphs[Math.floor(Math.random() * theme.glyphs.length)],
      size: randomBetween(14, 28),
      opacity: randomBetween(0.25, 0.85),
      flipTimer: Math.floor(randomBetween(20, 120)),
    });

    let particles = Array.from({ length: COUNT }, () => spawn(true));
    let frame;

    const draw = () => {
      // Light trail effect — fill with a low-alpha bg color each frame.
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.flipTimer--;
        if (p.flipTimer <= 0) {
          p.glyph = theme.glyphs[Math.floor(Math.random() * theme.glyphs.length)];
          p.flipTimer = Math.floor(randomBetween(20, 120));
        }
        p.y += p.vy;
        if (p.y > canvas.height + 30) {
          particles[i] = spawn(false);
          return;
        }
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 8;
        ctx.fillStyle = theme.color;
        ctx.fillText(p.glyph, p.x, p.y);
        ctx.restore();
      });

      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [bossId]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: theme.bg }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Vignette so dice/UI stay readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </div>
  );
}