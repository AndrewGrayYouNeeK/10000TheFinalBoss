import { useEffect, useRef } from "react";
import { isLowPowerDevice } from "@/lib/platform";

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
  fisherman:    {
    bg: "#031828",
    glow: "rgba(80,200,255,0.35)",
    effect: "bubbles",
    bubbles: {
      vents: 7,
      breathMin: 2.4,
      breathMax: 5.2,
      cluster: [18, 38],
      cap: 420,
      speed: [0.18, 0.75],
      radius: [0.45, 1.8],
      trailAlpha: 0.055,
    },
  },
  shark:        { glyphs: ["🦈","♠","♣","♥","♦","A","K","Q","J"], color: "rgba(100,220,240,0.9)", glow: "rgba(40,200,255,0.55)", bg: "#04101a" },

  // Tier 3
  pride_dancer: { glyphs: ["♥","♪","♫","✦","★"], color: "rgba(255,120,200,0.9)", glow: "rgba(255,80,180,0.5)", bg: "#0c0418" },
  ice_witch:    { glyphs: ["❄","❅","✦","◊"], color: "rgba(180,230,255,0.9)", glow: "rgba(100,200,255,0.55)", bg: "#040818" },
  teal_priest:  { glyphs: ["◊","◇","✦","∴","☸"], color: "rgba(120,230,220,0.9)", glow: "rgba(60,200,200,0.5)", bg: "#04120f" },
  ice_archer:   { glyphs: ["➳","↟","✦","❄"], color: "rgba(180,230,255,0.9)", glow: "rgba(120,200,255,0.5)", bg: "#04101a" },
  phantom:      { glyphs: ["†","✦","◊","○","●"], color: "rgba(200,140,255,0.85)", glow: "rgba(160,80,255,0.5)", bg: "#08040e" },
  ghost:        { glyphs: ["○","◌","◦","·","∘"], color: "rgba(200,210,230,0.75)", glow: "rgba(160,170,200,0.45)", bg: "#06080c" },
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
  neo:          {
    glyphs: [
      "A","N","D","R","E","W"," ","G","R","A","Y",
      "ｱ","ｲ","ｳ","ｴ","ｵ","ｶ","ｷ","ｸ","0","1","2","3","4","5","6","7","8","9","ﾗ","ﾘ","ﾙ",
    ],
    color: "rgba(80,255,120,0.95)",
    glow: "rgba(0,255,80,0.6)",
    bg: "#020a04",
    rain: { count: { normal: 170, low: 34 }, speed: [2.6, 7.4], trailAlpha: 0.1 },
  },
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

  // Final boss — crisp $100 bill rain
  gq:           {
    bg: "#020814",
    glow: "rgba(60,220,90,0.35)",
    effect: "bills",
    bills: {
      count: { normal: 148, low: 40 },
      speed: [9.5, 17.5],
      height: [12, 18],
    },
  },
};

const DEFAULT_THEME = { glyphs: ["⚀","⚁","⚂","⚃","⚄","⚅"], color: "rgba(0,255,200,0.8)", glow: "rgba(0,255,200,0.5)", bg: "#03040a" };

function randomBetween(a, b) { return a + Math.random() * (b - a); }

const DEFAULT_RAIN = { count: { normal: 90, low: 18 }, speed: [1.2, 3.8], trailAlpha: 0.15 };

function rainConfig(theme) {
  return theme.rain ?? DEFAULT_RAIN;
}

function bubbleConfig(theme) {
  return (
    theme.bubbles ?? {
      vents: 5,
      breathMin: 2.5,
      breathMax: 5,
      cluster: [12, 24],
      cap: 280,
      speed: [0.2, 0.8],
      radius: [0.5, 2],
      trailAlpha: 0.06,
    }
  );
}

/** US currency width:height ≈ 2.61:1 */
const USD_BILL_RATIO = 2.61;

function billConfig(theme) {
  return (
    theme.bills ?? {
      count: { normal: 148, low: 40 },
      speed: [9.5, 17.5],
      height: [12, 18],
    }
  );
}

/** Mixed fall speeds — higher floor so nothing crawls. */
function spawnBillFallSpeed([speedMin, speedMax]) {
  const roll = Math.random();
  if (roll < 0.15) return randomBetween(speedMin * 0.78, speedMin * 0.95);
  if (roll < 0.55) return randomBetween(speedMin * 0.98, (speedMin + speedMax) * 0.54);
  return randomBetween((speedMin + speedMax) * 0.5, speedMax * 1.06);
}

function billInk(h) {
  return h < 15 ? "#2f4a3c" : "#263d32";
}

function billPaperGradient(ctx, left, top, w, h, blueSecurity = false) {
  const g = ctx.createLinearGradient(left, top, left + w, top + h);
  g.addColorStop(0, "#faf7ed");
  g.addColorStop(0.45, "#f2ebda");
  g.addColorStop(1, "#e4dcc8");
  ctx.fillStyle = g;
  ctx.fillRect(left, top, w, h);
  ctx.fillStyle = blueSecurity ? "rgba(55, 120, 200, 0.1)" : "rgba(52, 98, 72, 0.06)";
  ctx.fillRect(left, top, w, h);
}

function paintSecurityFeatures(ctx, left, top, w, h, blueSecurity) {
  const ribbonX = left + w * 0.52;
  const ribbonW = Math.max(0.8, w * 0.018);
  if (blueSecurity) {
    // 3-D security ribbon (blue + copper, like modern $100)
    ctx.fillStyle = "rgba(32, 105, 195, 0.72)";
    ctx.fillRect(ribbonX, top + 1, ribbonW, h - 2);
    ctx.fillStyle = "rgba(175, 135, 55, 0.5)";
    ctx.fillRect(ribbonX + ribbonW * 1.05, top + 1, ribbonW * 0.65, h - 2);
    // Blue color-shift patch (right side)
    ctx.fillStyle = "rgba(48, 118, 205, 0.18)";
    ctx.fillRect(left + w * 0.58, top + h * 0.12, w * 0.32, h * 0.62);
  } else {
    ctx.fillStyle = "rgba(110, 165, 185, 0.18)";
    ctx.fillRect(ribbonX, top + 1, ribbonW * 0.85, h - 2);
  }
}

function randomBillSerial() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const nums = String(Math.floor(randomBetween(10000000, 99999999)));
  return `${letter}${nums}${letter}`;
}

/** Stylized US $100 front — sized for small realistic rain. */
function paintBillFront(ctx, w, h, serial, blueSecurity = false) {
  const left = -w / 2;
  const top = -h / 2;
  const ink = billInk(h);
  const lw = Math.max(0.4, h * 0.035);

  billPaperGradient(ctx, left, top, w, h, blueSecurity);
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.strokeRect(left + 1, top + 0.75, w - 2, h - 1.5);
  ctx.strokeStyle = "rgba(38, 74, 58, 0.35)";
  ctx.strokeRect(left + 1.75, top + 1.25, w - 3.5, h - 2.5);

  paintSecurityFeatures(ctx, left, top, w, h, blueSecurity);

  // Portrait medallion (Franklin)
  const px = left + w * 0.26;
  const prx = w * 0.14;
  const pry = h * 0.34;
  ctx.fillStyle = blueSecurity ? "#d4cec0" : "#d8d0bc";
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw * 0.7;
  ctx.beginPath();
  ctx.ellipse(px, 0, prx, pry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = blueSecurity ? "#4a5668" : "#5a6358";
  ctx.beginPath();
  ctx.ellipse(px, -pry * 0.1, prx * 0.48, pry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bell / inkwell (blue on modern series)
  if (h >= 14) {
    ctx.fillStyle = blueSecurity
      ? "rgba(42, 108, 195, 0.62)"
      : "rgba(42, 82, 62, 0.55)";
    ctx.beginPath();
    ctx.arc(left + w * 0.56, top + h * 0.38, h * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  // Denomination — right (blue ink on modern $100)
  const big100 = Math.max(7, Math.round(h * 0.5));
  ctx.fillStyle = blueSecurity ? "#1e4a72" : ink;
  ctx.font = `700 ${big100}px "Times New Roman", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("100", left + w * 0.73, 0);

  const corner = Math.max(4, Math.round(h * 0.22));
  ctx.font = `700 ${corner}px Georgia, serif`;
  ctx.fillStyle = ink;
  ctx.fillText("100", left + corner * 0.85, top + corner * 0.85);
  ctx.fillText("100", left + w - corner * 0.85, top + corner * 0.85);
  ctx.fillStyle = blueSecurity ? "#1e4a72" : ink;
  ctx.fillText("100", left + corner * 0.85, top + h - corner * 0.75);
  ctx.fillText("100", left + w - corner * 0.85, top + h - corner * 0.75);

  if (h >= 15) {
    const micro = Math.max(3, Math.round(h * 0.12));
    ctx.font = `600 ${micro}px system-ui, sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("FEDERAL RESERVE NOTE", 0, top + 1);
    ctx.font = `${Math.max(2, micro - 0.5)}px system-ui, sans-serif`;
    ctx.fillText("THE UNITED STATES OF AMERICA", 0, top + micro + 1.5);
    ctx.textBaseline = "bottom";
    ctx.font = `${Math.max(2, micro - 0.5)}px system-ui, sans-serif`;
    ctx.fillText("ONE HUNDRED DOLLARS", 0, top + h - 2);
  }

  if (h >= 14) {
    const serialSize = Math.max(2, Math.round(h * 0.1));
    ctx.font = `${serialSize}px "Courier New", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#2a2a2a";
    ctx.fillText(serial.slice(0, 10), left + 2, top + h - 1);
  }
}

/** Back of bill — muted green reverse. */
function paintBillBack(ctx, w, h, serial, blueSecurity = false) {
  const left = -w / 2;
  const top = -h / 2;
  const ink = billInk(h);
  const lw = Math.max(0.4, h * 0.035);

  const g = ctx.createLinearGradient(left, top, left + w, top + h);
  g.addColorStop(0, "#ebe6d4");
  g.addColorStop(1, "#ddd5c0");
  ctx.fillStyle = g;
  ctx.fillRect(left, top, w, h);
  ctx.fillStyle = blueSecurity ? "rgba(50, 110, 190, 0.1)" : "rgba(48, 95, 70, 0.12)";
  ctx.fillRect(left, top, w, h);
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.strokeRect(left + 1, top + 0.75, w - 2, h - 1.5);

  paintSecurityFeatures(ctx, left, top, w, h, blueSecurity);

  ctx.fillStyle = "rgba(40, 78, 58, 0.32)";
  ctx.fillRect(left + w * 0.3, top + h * 0.24, w * 0.4, h * 0.46);
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw * 0.6;
  ctx.strokeRect(left + w * 0.3, top + h * 0.24, w * 0.4, h * 0.46);

  const center100 = Math.max(8, Math.round(h * 0.52));
  ctx.fillStyle = blueSecurity ? "#1e4a72" : ink;
  ctx.font = `700 ${center100}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("100", 0, 0);

  if (h >= 14) {
    const micro = Math.max(3, Math.round(h * 0.11));
    ctx.font = `600 ${micro}px system-ui, sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("UNITED STATES OF AMERICA", 0, top + 1);
    ctx.font = `${Math.max(2, Math.round(h * 0.09))}px "Courier New", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#2a2a2a";
    ctx.fillText(serial.slice(0, 10), left + 2, top + h - 1);
  }
}

function drawBillEdge(ctx, w, h, vertical = true) {
  const ink = "#2d4a3a";
  ctx.fillStyle = "#ebe4d0";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 0.5;
  if (vertical) {
    ctx.fillRect(-1, -h / 2, 2, h);
    ctx.strokeRect(-1, -h / 2, 2, h);
  } else {
    ctx.fillRect(-w / 2, -1, w, 2);
    ctx.strokeRect(-w / 2, -1, w, 2);
  }
}

/** Draw bill with optional 3D pitch/roll tumble. */
function drawHundredBill(ctx, p) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  if (p.tumbler) {
    const pitchCos = Math.cos(p.flipPitch);
    const rollCos = Math.cos(p.flipRoll);
    const scaleX = Math.max(0.18, Math.abs(pitchCos));
    const scaleY = Math.max(0.18, Math.abs(rollCos));

    ctx.scale(scaleX, scaleY);
    const showBack = pitchCos < 0;
    if (showBack) ctx.scale(-1, 1);
    if (showBack) paintBillBack(ctx, p.w, p.h, p.serial, p.blueSecurity);
    else paintBillFront(ctx, p.w, p.h, p.serial, p.blueSecurity);
  } else {
    paintBillFront(ctx, p.w, p.h, p.serial, p.blueSecurity);
  }

  ctx.restore();
}

function billCollisionRadius(p) {
  return Math.max(p.w, p.h) * 0.38;
}

function clampBillVelocity(p) {
  p.bvx = Math.max(-2.2, Math.min(2.2, p.bvx));
  p.bvy = Math.max(-1.8, Math.min(1.8, p.bvy));
  p.vx = Math.max(-0.9, Math.min(0.9, p.vx));
}

function syncSeesawOffset(p) {
  if (!p.seesaw) return;
  p.seesawPrevX = Math.cos(p.seesawPhase) * p.seesawAmpX;
  p.seesawPrevY = Math.abs(Math.sin(p.seesawPhase)) * p.seesawAmpY;
}

function collideBills(a, b) {
  if (a.collisionGrace > 0 || b.collisionGrace > 0) return;

  const ar = billCollisionRadius(a);
  const br = billCollisionRadius(b);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distSq = dx * dx + dy * dy;
  const minDist = ar + br;
  if (distSq >= minDist * minDist || distSq < 0.001) return;

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  const separate = overlap * 0.22;
  a.x -= nx * separate;
  a.y -= ny * separate;
  b.x += nx * separate;
  b.y += ny * separate;

  const avx = a.vx + a.bvx;
  const avy = a.vy + a.bvy;
  const bvx = b.vx + b.bvx;
  const bvy = b.vy + b.bvy;
  const rel = (bvx - avx) * nx + (bvy - avy) * ny;
  if (rel > 0) {
    syncSeesawOffset(a);
    syncSeesawOffset(b);
    return;
  }

  const restitution = 0.14;
  const impulse = -(1 + restitution) * rel * 0.22;
  a.bvx -= impulse * nx;
  a.bvy -= impulse * ny * 0.35;
  b.bvx += impulse * nx;
  b.bvy += impulse * ny * 0.35;

  clampBillVelocity(a);
  clampBillVelocity(b);
  syncSeesawOffset(a);
  syncSeesawOffset(b);

  a.collisionGrace = 10;
  b.collisionGrace = 10;
}

function resolveBillCollisions(particles) {
  const cell = 42;
  const buckets = new Map();

  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    const key = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  }

  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    const cx = Math.floor(a.x / cell);
    const cy = Math.floor(a.y / cell);
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        const list = buckets.get(`${cx + ox},${cy + oy}`);
        if (!list) continue;
        for (let k = 0; k < list.length; k += 1) {
          const j = list[k];
          if (j <= i) continue;
          collideBills(a, particles[j]);
        }
      }
    }
  }
}

/** Tiny pore bubble — no blown-bubble highlight ring. */
function drawMicroBubble(ctx, p) {
  const drift = Math.sin(p.wobble) * 0.9 + Math.cos(p.wobble * 0.7) * 0.4;
  const x = p.x + drift;
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.beginPath();
  ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(140,220,255,0.28)";
  ctx.fill();
  if (p.r > 1.1) {
    ctx.beginPath();
    ctx.arc(x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220,250,255,0.35)";
    ctx.fill();
  }
  ctx.restore();
}

function makeBreathVents(count) {
  return Array.from({ length: count }, (_, i) => ({
    xNorm: (i + 0.5) / count + randomBetween(-0.04, 0.04),
    nextBreath: randomBetween(0.2, 2.2),
  }));
}

function spawnBreathCluster(particles, cfg, canvas, ventXNorm) {
  const w = canvas.width;
  const h = canvas.height;
  const clusterN = Math.floor(randomBetween(cfg.cluster[0], cfg.cluster[1] + 1));
  const baseX = ventXNorm * w + randomBetween(-10, 10);
  const baseY = h + randomBetween(2, 18);
  const [speedMin, speedMax] = cfg.speed;
  const [rMin, rMax] = cfg.radius;

  for (let i = 0; i < clusterN; i += 1) {
    if (particles.length >= cfg.cap) particles.shift();
    particles.push({
      x: baseX + randomBetween(-14, 14),
      y: baseY + randomBetween(-6, 4),
      vx: randomBetween(-0.12, 0.12),
      vy: -randomBetween(speedMin, speedMax),
      r: randomBetween(rMin, rMax),
      opacity: randomBetween(0.12, 0.42),
      wobble: randomBetween(0, Math.PI * 2),
      wobbleSpeed: randomBetween(0.025, 0.07),
    });
  }
}

function BossRainStatic({ theme }) {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: theme.bg }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${theme.glow} 0%, transparent 55%)`,
        }}
      />
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

export default function BossRainBackground({ bossId, lite = false }) {
  const canvasRef = useRef(null);
  const theme = THEMES[bossId] || DEFAULT_THEME;
  const isBubbleEffect = theme.effect === "bubbles";
  const isBillEffect = theme.effect === "bills";

  useEffect(() => {
    if (lite) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let particles = [];
    let frame;

    if (isBubbleEffect) {
      const cfg = bubbleConfig(theme);
      const ventCount = isLowPowerDevice()
        ? Math.max(3, Math.floor(cfg.vents * 0.45))
        : cfg.vents;
      let vents = makeBreathVents(ventCount);
      let particles = [];
      let lastFrame = performance.now();

      const primeScreen = () => {
        vents.forEach((v) => spawnBreathCluster(particles, cfg, canvas, v.xNorm));
        for (let i = 0; i < 3; i += 1) {
          spawnBreathCluster(
            particles,
            cfg,
            canvas,
            randomBetween(0.08, 0.92)
          );
        }
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        if (canvas.width === w && canvas.height === h && particles.length > 0) return;
        canvas.width = w;
        canvas.height = h;
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, w, h);
        particles = [];
        vents = makeBreathVents(ventCount);
        primeScreen();
      };

      resize();
      window.addEventListener("resize", resize);
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
      ro?.observe(canvas);

      const draw = () => {
        if (document.hidden) {
          frame = requestAnimationFrame(draw);
          return;
        }
        if (canvas.width < 2 || canvas.height < 2) {
          frame = requestAnimationFrame(draw);
          return;
        }

        const now = performance.now();
        const dt = Math.min(0.05, (now - lastFrame) / 1000);
        lastFrame = now;

        vents.forEach((v) => {
          v.nextBreath -= dt;
          if (v.nextBreath <= 0) {
            spawnBreathCluster(particles, cfg, canvas, v.xNorm);
            v.nextBreath = randomBetween(cfg.breathMin, cfg.breathMax);
          }
        });

        ctx.fillStyle = `rgba(3,24,40,${cfg.trailAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i -= 1) {
          const p = particles[i];
          p.wobble += p.wobbleSpeed;
          p.x += p.vx + Math.sin(p.wobble) * 0.04;
          p.y += p.vy;
          if (p.y < -4) {
            particles.splice(i, 1);
            continue;
          }
          drawMicroBubble(ctx, p);
        }

        frame = requestAnimationFrame(draw);
      };

      draw();
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        ro?.disconnect();
      };
    }

    if (isBillEffect) {
      const cfg = billConfig(theme);
      const COUNT = isLowPowerDevice() ? cfg.count.low : cfg.count.normal;
      const [hMin, hMax] = cfg.height;

      const spawn = (initial = false) => {
        const billH = randomBetween(hMin, hMax);
        const heavyFlip = Math.random() < 0.62;
        const tumbler = heavyFlip;
        const flipSign = () => (Math.random() < 0.5 ? -1 : 1);
        const spinRoll = Math.random();
        const spinMul =
          spinRoll < 0.22
            ? randomBetween(1.8, 2.8)
            : spinRoll < 0.58
              ? randomBetween(0.55, 0.9)
              : randomBetween(0.95, 1.35);
        let flipPitchSpeed = 0;
        let flipRollSpeed = 0;
        if (heavyFlip) {
          const mode = Math.random();
          if (mode < 0.55) {
            flipPitchSpeed = randomBetween(0.08, 0.16) * flipSign() * spinMul;
          } else if (mode < 0.85) {
            flipRollSpeed = randomBetween(0.06, 0.13) * flipSign() * spinMul;
          } else {
            flipPitchSpeed = randomBetween(0.06, 0.11) * flipSign() * spinMul;
            flipRollSpeed = randomBetween(0.04, 0.08) * flipSign() * spinMul;
          }
        }
        const seesaw = Math.random() < 0.55;
        const seesawPhase = randomBetween(0, Math.PI * 2);
        const seesawAmpX = randomBetween(1.2, 3.2);
        const seesawAmpY = randomBetween(0.8, 2.2);
        return {
          x: randomBetween(0, Math.max(canvas.width, 1)),
          y: initial
            ? randomBetween(0, Math.max(canvas.height, 1))
            : randomBetween(-Math.max(canvas.height, 1) * 0.35, -30),
          vy: spawnBillFallSpeed(cfg.speed),
          vx: randomBetween(-0.32, 0.32),
          bvx: 0,
          bvy: 0,
          collisionGrace: initial ? 0 : 10,
          h: billH,
          w: billH * USD_BILL_RATIO,
          baseRotation: randomBetween(-0.28, 0.28),
          rotation: 0,
          opacity: randomBetween(0.78, 0.96),
          wobble: randomBetween(0, Math.PI * 2),
          wobbleSpeed: randomBetween(0.05, 0.1) * spinMul,
          sway: randomBetween(0.45, 1.05),
          flutter: randomBetween(0.12, 0.28),
          liftPhase: randomBetween(0, Math.PI * 2),
          liftFreq: randomBetween(0.8, 1.4),
          liftAmp: randomBetween(0.35, 1.1),
          tumbleLift: randomBetween(0.2, 0.75),
          serial: randomBillSerial(),
          blueSecurity: Math.random() < 0.45,
          tumbler,
          flipPitch: randomBetween(0, Math.PI * 2),
          flipRoll: randomBetween(0, Math.PI * 2),
          flipPitchSpeed,
          flipRollSpeed,
          seesaw,
          seesawPhase,
          seesawSpeed: randomBetween(0.09, 0.18),
          seesawAmpX,
          seesawAmpY,
          seesawPrevX: seesaw ? Math.cos(seesawPhase) * seesawAmpX : 0,
          seesawPrevY: seesaw ? Math.abs(Math.sin(seesawPhase)) * seesawAmpY : 0,
        };
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        if (canvas.width === w && canvas.height === h && particles.length > 0) return;
        canvas.width = w;
        canvas.height = h;
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, w, h);
        particles = Array.from({ length: COUNT }, (_, idx) => {
          const p = spawn(true);
          p.y = ((idx + Math.random() * 0.35) / COUNT) * (h + 80) - 40;
          p.x = randomBetween(0, Math.max(w, 1));
          return p;
        });
      };

      resize();
      window.addEventListener("resize", resize);
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
      ro?.observe(canvas);

      let lastFrame = performance.now();
      let collisionTick = 0;

      const draw = () => {
        if (document.hidden) {
          frame = requestAnimationFrame(draw);
          return;
        }
        if (canvas.width < 2 || canvas.height < 2) {
          frame = requestAnimationFrame(draw);
          return;
        }

        const now = performance.now();
        const dt = Math.min(0.05, (now - lastFrame) / 1000);
        lastFrame = now;
        const step = dt * 60;

        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, i) => {
          if (p.collisionGrace > 0) p.collisionGrace -= 1;
          p.wobble += p.wobbleSpeed * step;
          p.bvx *= 0.9;
          p.bvy *= 0.9;
          clampBillVelocity(p);

          const windDriftX =
            (p.vx + Math.sin(p.wobble) * p.sway * 0.65) * step;
          const flutterLift =
            Math.sin(p.wobble * p.liftFreq + p.liftPhase) * p.liftAmp * 0.35 * step;

          if (p.seesaw) {
            p.seesawPhase += p.seesawSpeed * step;
            const xOff = Math.cos(p.seesawPhase) * p.seesawAmpX;
            const yOff = Math.abs(Math.sin(p.seesawPhase)) * p.seesawAmpY;
            p.x += (xOff - p.seesawPrevX) + windDriftX + p.bvx * step;
            p.y += p.vy * step + (yOff - p.seesawPrevY) * 0.35 + flutterLift + p.bvy * step;
            p.seesawPrevX = xOff;
            p.seesawPrevY = yOff;
            p.rotation =
              p.baseRotation +
              Math.sin(p.seesawPhase) * 0.32 +
              Math.sin(p.wobble * 1.1) * p.flutter;
          } else {
            p.x += windDriftX + p.bvx * step;
            p.y += p.vy * step + flutterLift + p.bvy * step;
            p.rotation =
              p.baseRotation +
              Math.sin(p.wobble * 1.15) * p.flutter;
          }

          if (p.tumbler) {
            p.flipPitch += p.flipPitchSpeed * step;
            p.flipRoll += p.flipRollSpeed * step;
          }
          if (p.y > canvas.height + 50 || p.x < -80 || p.x > canvas.width + 80) {
            particles[i] = spawn(false);
          }
        });

        collisionTick += 1;
        if (collisionTick % 2 === 0) {
          resolveBillCollisions(particles);
        }

        particles.forEach((p) => {
          drawHundredBill(ctx, p);
        });

        frame = requestAnimationFrame(draw);
      };

      draw();
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        ro?.disconnect();
      };
    }

    const rain = rainConfig(theme);
    const COUNT = isLowPowerDevice() ? rain.count.low : rain.count.normal;
    const [speedMin, speedMax] = rain.speed;

    const spawn = (initial = false) => ({
      x: randomBetween(0, Math.max(canvas.width, 1)),
      y: initial
        ? randomBetween(0, Math.max(canvas.height, 1))
        : randomBetween(-Math.max(canvas.height, 1) * 0.4, -20),
      vy: randomBetween(speedMin, speedMax),
      glyph: theme.glyphs[Math.floor(Math.random() * theme.glyphs.length)],
      size: randomBetween(14, 28),
      opacity: randomBetween(0.25, 0.85),
      flipTimer: Math.floor(randomBetween(20, 120)),
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (canvas.width === w && canvas.height === h && particles.length > 0) return;
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, w, h);
      particles = Array.from({ length: COUNT }, () => spawn(true));
    };

    resize();
    window.addEventListener("resize", resize);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => resize())
      : null;
    ro?.observe(canvas);

    const draw = () => {
      if (document.hidden) {
        frame = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width < 2 || canvas.height < 2) {
        frame = requestAnimationFrame(draw);
        return;
      }

      // Light trail effect — fill with a low-alpha bg color each frame.
      ctx.fillStyle = `rgba(0,0,0,${rain.trailAlpha})`;
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
      ro?.disconnect();
    };
  }, [bossId, lite, isBubbleEffect, isBillEffect, theme.bg, theme.glow]);

  if (lite) {
    return <BossRainStatic theme={theme} />;
  }

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{
        background: isBubbleEffect
          ? `linear-gradient(180deg, #062840 0%, ${theme.bg} 45%, #021018 100%)`
          : theme.bg,
      }}
    >
      {isBubbleEffect && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(100,220,255,0.35) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 20% 80%, rgba(40,140,200,0.2) 0%, transparent 55%)",
          }}
        />
      )}
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