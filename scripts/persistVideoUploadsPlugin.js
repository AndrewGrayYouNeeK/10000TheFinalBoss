/**
 * Dev-only: POST video blobs to disk under public/assets so uploads survive
 * browser storage clears / origin switches.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, "../public/assets");
const SPRITE_TUNING_DIR = path.resolve(ASSETS_DIR, "sprite-tuning");

/** Live IndexedDB key → filename in public/assets (matches VIDEO_FALLBACK_PATHS). */
const KEY_TO_FILENAME = {
  matrix_power: "matrix_power.mp4",
  diamond_cut_power: "diamond_cut_power.mp4",
  blue_gel_power: "blue_gel_power.mp4",
  blue_gel_shark_bite_intro: "blue_gel_shark_bite_intro.mp4",
  story_mode: "story_mode.mp4",
  story_boss_win: "story_boss_win.mp4",
  gameplay_loop: "gameplay_header_loop.mp4",
  gameplay_billboard: "gameplay_billboard.mp4",
  gameplay_billboard_matrix: "gameplay_billboard_matrix.mp4",
  characters_loop: "characters_loop.mp4",
};

function safeKey(key) {
  return typeof key === "string" && /^[a-z0-9_-]+$/i.test(key) ? key : null;
}

function filenameForKey(key) {
  return KEY_TO_FILENAME[key] || `${key}.mp4`;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function looksLikeVideoBuffer(buf) {
  if (!buf || buf.length < 8_000) return false;
  // ....ftyp
  return buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
}

export function persistVideoUploadsPlugin() {
  return {
    name: "persist-video-uploads",
    configureServer(server) {
      // Missing /assets/*.mp4 must 404 — Vite SPA fallback returns index.html as 200,
      // which used to get saved as fake "videos".
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || "";
        const pathname = rawUrl.split("?")[0] || "";
        if (!pathname.startsWith("/assets/") || !/\.(mp4|mov|webm)$/i.test(pathname)) {
          return next();
        }
        const filename = path.basename(pathname);
        if (filename !== pathname.slice("/assets/".length)) {
          res.statusCode = 400;
          res.end("Invalid asset path");
          return;
        }
        try {
          await fs.access(path.join(ASSETS_DIR, filename));
          return next();
        } catch {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain");
          res.end("Video asset not found");
        }
      });

      // Missing sprite-tuning JSON must 404 (not index.html).
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || "").split("?")[0] || "";
        if (!pathname.startsWith("/assets/sprite-tuning/") || !pathname.endsWith(".json")) {
          return next();
        }
        const filename = path.basename(pathname);
        if (!/^[a-z0-9_-]+\.json$/i.test(filename)) {
          res.statusCode = 400;
          res.end("Invalid tuning path");
          return;
        }
        try {
          await fs.access(path.join(SPRITE_TUNING_DIR, filename));
          return next();
        } catch {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain");
          res.end("Sprite tuning not found");
        }
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (url.startsWith("/__api/persist-sprite-tuning")) {
          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }
          try {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method not allowed");
              return;
            }
            const parsed = new URL(url, "http://localhost");
            const skinId = safeKey(parsed.searchParams.get("skinId") || "");
            if (!skinId) {
              res.statusCode = 400;
              res.end("Missing or invalid skinId");
              return;
            }
            const buf = await readBody(req);
            if (!buf.length) {
              res.statusCode = 400;
              res.end("Empty body");
              return;
            }
            let parsedJson;
            try {
              parsedJson = JSON.parse(buf.toString("utf8"));
            } catch {
              res.statusCode = 400;
              res.end("Invalid JSON");
              return;
            }
            if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
              res.statusCode = 400;
              res.end("Tuning payload must be an object");
              return;
            }
            await fs.mkdir(SPRITE_TUNING_DIR, { recursive: true });
            const dest = path.join(SPRITE_TUNING_DIR, `${skinId}.json`);
            await fs.writeFile(dest, `${JSON.stringify(parsedJson, null, 2)}\n`, "utf8");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, path: `/assets/sprite-tuning/${skinId}.json` }));
          } catch (err) {
            res.statusCode = 500;
            res.end(err?.message || "Failed to persist sprite tuning");
          }
          return;
        }

        if (!url.startsWith("/__api/persist-video")) return next();

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (req.method === "GET" && url.startsWith("/__api/persist-video/list")) {
            await fs.mkdir(ASSETS_DIR, { recursive: true });
            const names = await fs.readdir(ASSETS_DIR);
            const videos = [];
            for (const n of names) {
              if (!/\.(mp4|mov|webm)$/i.test(n)) continue;
              try {
                const full = path.join(ASSETS_DIR, n);
                const st = await fs.stat(full);
                if (st.size < 8_000) continue;
                const fh = await fs.open(full, "r");
                const buf = Buffer.alloc(12);
                await fh.read(buf, 0, 12, 0);
                await fh.close();
                if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
                  videos.push(n);
                }
              } catch {
                /* skip unreadable */
              }
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, videos }));
            return;
          }

          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("Method not allowed");
            return;
          }

          const parsed = new URL(url, "http://localhost");
          const key = safeKey(parsed.searchParams.get("key") || "");
          if (!key) {
            res.statusCode = 400;
            res.end("Missing or invalid key");
            return;
          }

          const buf = await readBody(req);
          if (!buf.length) {
            res.statusCode = 400;
            res.end("Empty body");
            return;
          }
          if (!looksLikeVideoBuffer(buf)) {
            res.statusCode = 400;
            res.end("Not a video file (refusing to overwrite assets)");
            return;
          }

          await fs.mkdir(ASSETS_DIR, { recursive: true });
          const filename = filenameForKey(key);
          const dest = path.join(ASSETS_DIR, filename);
          await fs.writeFile(dest, buf);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, path: `/assets/${filename}`, bytes: buf.length }));
        } catch (err) {
          res.statusCode = 500;
          res.end(err?.message || "Failed to persist video");
        }
      });
    },
  };
}
