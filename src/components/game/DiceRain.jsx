import { useEffect, useRef } from "react";

const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function DiceRain() {
  const canvasRef = useRef(null);
  const diceRef = useRef([]);
  const obstaclesRef = useRef([]);
  const tiltRef = useRef({ gx: 0, gy: 0.08 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    // Re-scan obstacles relative to the canvas viewport
    const updateObstacles = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const nodes = document.querySelectorAll("[data-dice-obstacle]");
      obstaclesRef.current = Array.from(nodes).map((el, idx) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.getAttribute("data-dice-id") || `obs-${idx}`,
          x: r.left - canvasRect.left,
          y: r.top - canvasRect.top,
          w: r.width,
          h: r.height,
          solid: el.hasAttribute("data-dice-solid"),
        };
      });
    };
    updateObstacles();
    const obsInterval = setInterval(updateObstacles, 500);
    window.addEventListener("scroll", updateObstacles, { passive: true });

    const COUNT = 70;
    const SIZE = 32;
    const GRAVITY = 0.08;
    const BOUNCE = 0.55;
    const FRICTION = 0.985;

    // Phone tilt → gravity vector. beta = front/back tilt (-180..180), gamma = left/right (-90..90).
    const handleOrientation = (e) => {
      const gamma = e.gamma || 0; // left/right tilt
      const beta = e.beta || 0;   // front/back tilt
      // Map tilt to a gravity vector. Clamp to reasonable range.
      const gx = Math.max(-1, Math.min(1, gamma / 45)) * 0.25;
      // Allow upward "gravity" when phone is tilted back, downward when forward.
      const gy = Math.max(-1, Math.min(1, beta / 45)) * 0.25 + GRAVITY * 0.5;
      tiltRef.current = { gx, gy };
    };

    const attachOrientation = () => {
      window.addEventListener("deviceorientation", handleOrientation);
    };

    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS 13+: request on first user tap
        const requestPerm = async () => {
          try {
            const res = await DeviceOrientationEvent.requestPermission();
            if (res === "granted") attachOrientation();
          } catch {}
          document.removeEventListener("click", requestPerm);
          document.removeEventListener("touchend", requestPerm);
        };
        document.addEventListener("click", requestPerm);
        document.addEventListener("touchend", requestPerm);
      } else {
        attachOrientation();
      }
    }

    const spawn = (initial = false) => ({
      x: randomBetween(0, canvas.width),
      y: initial ? randomBetween(-canvas.height, canvas.height) : randomBetween(-canvas.height * 0.5, -SIZE),
      vx: randomBetween(-0.3, 0.3),
      vy: randomBetween(1.8, 4.2),
      face: FACES[Math.floor(Math.random() * 6)],
      flipTimer: Math.floor(randomBetween(40, 140)),
      opacity: randomBetween(0.15, 0.45),
      size: randomBetween(SIZE * 0.6, SIZE * 1.2),
      // No dice pass in front by default — only enabled after bouncing on top of the logo
      passThrough: false,
      // Obstacle id this die should now ignore (so it falls in front of it)
      ignoreObstacleId: null,
    });

    diceRef.current = Array.from({ length: COUNT }, () => spawn(true));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const obstacles = obstaclesRef.current;

      diceRef.current.forEach((d, i) => {
        d.flipTimer--;
        if (d.flipTimer <= 0) {
          d.face = FACES[Math.floor(Math.random() * 6)];
          d.flipTimer = Math.floor(randomBetween(20, 80));
        }

        // Gravity + motion (gravity vector shifts with phone tilt)
        const { gx, gy } = tiltRef.current;
        d.vx += gx;
        d.vy += gy;
        d.vx *= FRICTION;
        d.vy *= FRICTION;
        d.x += d.vx;
        d.y += d.vy;

        // Wrap horizontally so tilted dice don't pile off-screen
        if (d.x < -d.size) d.x = canvas.width + d.size;
        if (d.x > canvas.width + d.size) d.x = -d.size;

        // Collision with obstacles (axis-aligned, bounce off nearest edge)
        // Skip collision entirely for "passThrough" dice — they fall in front of UI.
        const radius = d.size * 0.4;
        for (let j = 0; j < obstacles.length; j++) {
          const o = obstacles[j];
          // After bouncing on top of the logo, the die passes through THAT
          // obstacle only — so it can keep falling onto the Play Now sign below.
          if (d.ignoreObstacleId && d.ignoreObstacleId === o.id) continue;
          if (
            d.x + radius > o.x &&
            d.x - radius < o.x + o.w &&
            d.y + radius > o.y &&
            d.y - radius < o.y + o.h
          ) {
            // Determine which side was hit by smallest overlap
            const overlapLeft = d.x + radius - o.x;
            const overlapRight = o.x + o.w - (d.x - radius);
            const overlapTop = d.y + radius - o.y;
            const overlapBottom = o.y + o.h - (d.y - radius);
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapTop && d.vy > 0) {
              d.y = o.y - radius;
              d.vy = -Math.abs(d.vy) * BOUNCE;
              d.vx += randomBetween(-0.6, 0.6);
              // After bouncing off the top of an obstacle, ~50% of dice start
              // ignoring that specific obstacle — so they fall down IN FRONT of it
              // onto whatever is below (e.g. Play Now sign).
              if (Math.random() < 0.5) {
                d.ignoreObstacleId = o.id;
              }
            } else if (minOverlap === overlapBottom && d.vy < 0) {
              d.y = o.y + o.h + radius;
              d.vy = Math.abs(d.vy) * BOUNCE;
            } else if (minOverlap === overlapLeft && d.vx > 0) {
              d.x = o.x - radius;
              d.vx = -Math.abs(d.vx) * BOUNCE;
            } else if (minOverlap === overlapRight && d.vx < 0) {
              d.x = o.x + o.w + radius;
              d.vx = Math.abs(d.vx) * BOUNCE;
            }
            break;
          }
        }

        // Respawn at top once it falls past the bottom
        if (d.y > canvas.height + d.size) {
          diceRef.current[i] = spawn(false);
          return;
        }

        ctx.save();
        ctx.globalAlpha = d.opacity;
        ctx.font = `${d.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 255, 200, 0.5)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "rgba(0, 220, 170, 0.75)";
        ctx.fillText(d.face, d.x, d.y);
        ctx.restore();
      });

      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(obsInterval);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateObstacles);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 20 }}
    />
  );
}